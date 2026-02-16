/**
 * Analysis of Variance (ANOVA) - R-style ANOVA tables and model comparison
 * Implements ANOVA for linear models fitted with lm()
 */

import { pf } from '../distributions/f.js';
import { lm } from './lm.js';

/**
 * Analysis of Variance for fitted linear models
 * 
 * Can be used in two modes:
 * 1. Single model: Generate ANOVA table showing variance decomposition
 * 2. Multiple models: Compare nested models with sequential F-tests
 * 
 * @param {...Object} models - One or more fitted model objects from lm()
 * @returns {Object} - ANOVA table or model comparison results
 * 
 * @example
 * // ANOVA table for single model
 * const fit = lm(y, [x1, x2]);
 * const aov = anova(fit);
 * 
 * @example
 * // Model comparison
 * const fit1 = lm(y, [x1]);
 * const fit2 = lm(y, [x1, x2]);
 * const comparison = anova(fit1, fit2);
 */
export function anova(...models) {
  if (models.length === 0) {
    throw new Error('At least one model is required');
  }
  
  if (models.length === 1) {
    // Single model: generate ANOVA table
    return anovaTable(models[0]);
  } else {
    // Multiple models: model comparison
    return modelComparison(models);
  }
}

/**
 * Generate ANOVA table for a single fitted model
 * Shows variance decomposition by each predictor
 * 
 * Returns a table with columns:
 * - term: predictor name
 * - df: degrees of freedom
 * - sum_sq: sum of squares
 * - mean_sq: mean square (sum_sq / df)
 * - f_value: F-statistic
 * - p_value: p-value from F-test
 */
function anovaTable(model) {
  const n = model.n;
  const p = model.p;
  const intercept = model.coef_names[0] === '(Intercept)';
  const nPredictors = intercept ? p - 1 : p;

  if (nPredictors === 0) {
    throw new Error('Cannot compute ANOVA for intercept-only model');
  }

  const df_residual = model.df.residual;
  const tss = model.tss;
  const rss = model.rss;
  const mse = rss / df_residual;

  const { columns: predictorCols, names: predictorNames } = extractPredictorColumns(model, intercept);
  const response = reconstructResponse(model);

  const sequentialFits = buildSequentialFits(response, predictorCols, intercept);
  const rows = [];
  let prevRss = sequentialFits[0].rss;

  for (let i = 0; i < predictorCols.length; i++) {
    const fit = sequentialFits[i + 1];
    const sumSq = prevRss - fit.rss;
    const fValue = (sumSq / 1) / mse;
    const pValue = pf(fValue, 1, df_residual, { lower_tail: false });

    rows.push({
      term: predictorNames[i],
      df: 1,
      sum_sq: sumSq,
      mean_sq: sumSq,
      f_value: fValue,
      p_value: pValue
    });

    prevRss = fit.rss;
  }

  rows.push({
    term: 'Residuals',
    df: df_residual,
    sum_sq: rss,
    mean_sq: mse,
    f_value: null,
    p_value: null
  });

  const model_sum_sq = rows.slice(0, -1).reduce((acc, row) => acc + row.sum_sq, 0);

  return {
    table: rows,
    total_df: n - (intercept ? 1 : 0),
    model_df: nPredictors,
    residual_df: df_residual,
    total_ss: tss,
    model_ss: model_sum_sq,
    residual_ss: rss,
    r_squared: model.r_squared,
    adj_r_squared: model.adj_r_squared
  };
}

/**
 * Compare multiple nested models using F-tests
 * Models should be nested (smaller models are subsets of larger models)
 * 
 * Returns comparison table with:
 * - model: model number
 * - res_df: residual degrees of freedom
 * - rss: residual sum of squares  
 * - df: difference in df from previous model
 * - sum_of_sq: difference in RSS from previous model
 * - f: F-statistic for model comparison
 * - p_value: p-value from F-test
 */
function modelComparison(models) {
  const nModels = models.length;
  
  // Validate models
  for (let i = 0; i < nModels; i++) {
    if (!models[i].coefficients || !models[i].rss) {
      throw new Error(`Model ${i + 1} is not a valid fitted model from lm()`);
    }
  }
  
  // Check sample sizes match
  const n = models[0].n;
  for (let i = 1; i < nModels; i++) {
    if (models[i].n !== n) {
      throw new Error('All models must be fitted to the same data (same number of observations)');
    }
  }
  
  const rows = [];
  
  for (let i = 0; i < nModels; i++) {
    const model = models[i];
    const row = {
      model: i + 1,
      res_df: model.df.residual,
      rss: model.rss,
      df: null,
      sum_of_sq: null,
      f: null,
      p_value: null
    };
    
    if (i > 0) {
      // Compare with previous (smaller) model
      const prevModel = models[i - 1];
      
      // Difference in df and RSS
      const df_diff = prevModel.df.residual - model.df.residual;
      const rss_diff = prevModel.rss - model.rss;
      
      if (df_diff <= 0) {
        throw new Error('Models do not appear to be nested (df difference <= 0)');
      }
      
      // F-test: F = (RSS1 - RSS2) / (df1 - df2) / (RSS2 / df2)
      // where model 1 is simpler (more df), model 2 is more complex (less df)
      const f_statistic = (rss_diff / df_diff) / (model.rss / model.df.residual);
      const p_value = pf(f_statistic, df_diff, model.df.residual, { lower_tail: false });
      
      row.df = df_diff;
      row.sum_of_sq = rss_diff;
      row.f = f_statistic;
      row.p_value = p_value;
    }
    
    rows.push(row);
  }
  
  return {
    table: rows,
    n: n,
    comparison: 'sequential',
    note: 'Models are compared in the order provided (sequential).'
  };
}

function extractPredictorColumns(model, intercept) {
  const X = model._X;
  if (!X) {
    throw new Error('Design matrix is required to compute ANOVA table');
  }

  const cols = [];
  const names = [];
  const startIdx = intercept ? 1 : 0;

  for (let j = startIdx; j < model.p; j++) {
    cols.push(X.getColumn(j));
    names.push(model.coef_names[j]);
  }

  return { columns: cols, names };
}

function reconstructResponse(model) {
  const n = model.n;
  const response = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    response[i] = model.fitted_values[i] + model.residuals[i];
  }
  return Array.from(response);
}

function buildSequentialFits(response, predictorCols, intercept) {
  const fits = [];
  const predictors = [];

  fits.push(lm(response, [], { intercept }));

  for (let i = 0; i < predictorCols.length; i++) {
    predictors.push(predictorCols[i]);
    fits.push(lm(response, predictors.slice(), { intercept }));
  }

  return fits;
}

/**
 * Print ANOVA table in a readable format (for console/debugging)
 * Mimics R's print.anova() output
 * 
 * @param {Object} anovaResult - Result from anova()
 * @returns {string} - Formatted table string
 */
export function printAnova(anovaResult) {
  if (anovaResult.comparison) {
    // Model comparison format
    return formatComparisonTable(anovaResult);
  } else {
    // Single model ANOVA table format
    return formatAnovaTable(anovaResult);
  }
}

function formatAnovaTable(result) {
  const lines = [];
  lines.push('Analysis of Variance Table\n');
  lines.push('Response: y\n');
  lines.push(
    'Term'.padEnd(15) +
    'Df'.padStart(8) +
    'Sum Sq'.padStart(12) +
    'Mean Sq'.padStart(12) +
    'F value'.padStart(12) +
    'Pr(>F)'.padStart(12)
  );
  lines.push('-'.repeat(71));
  
  for (const row of result.table) {
    const term = row.term.padEnd(15);
    const df = row.df.toString().padStart(8);
    const sum_sq = row.sum_sq.toFixed(4).padStart(12);
    const mean_sq = row.mean_sq.toFixed(4).padStart(12);
    const f_val = row.f_value !== null ? row.f_value.toFixed(4).padStart(12) : ''.padStart(12);
    const p_val = row.p_value !== null ? formatPValue(row.p_value).padStart(12) : ''.padStart(12);
    
    lines.push(term + df + sum_sq + mean_sq + f_val + p_val);
  }
  
  lines.push('-'.repeat(71));
  lines.push(`R-squared: ${result.r_squared.toFixed(4)}, Adj. R-squared: ${result.adj_r_squared.toFixed(4)}`);
  
  return lines.join('\n');
}

function formatComparisonTable(result) {
  const lines = [];
  lines.push('Analysis of Variance Table\n');
  lines.push('Model Comparison\n');
  lines.push(
    'Model'.padEnd(8) +
    'Res.Df'.padStart(10) +
    'RSS'.padStart(12) +
    'Df'.padStart(8) +
    'Sum of Sq'.padStart(12) +
    'F'.padStart(12) +
    'Pr(>F)'.padStart(12)
  );
  lines.push('-'.repeat(74));
  
  for (const row of result.table) {
    const model = row.model.toString().padEnd(8);
    const res_df = row.res_df.toString().padStart(10);
    const rss = row.rss.toFixed(4).padStart(12);
    const df = row.df !== null ? row.df.toString().padStart(8) : ''.padStart(8);
    const sum_sq = row.sum_of_sq !== null ? row.sum_of_sq.toFixed(4).padStart(12) : ''.padStart(12);
    const f = row.f !== null ? row.f.toFixed(4).padStart(12) : ''.padStart(12);
    const p = row.p_value !== null ? formatPValue(row.p_value).padStart(12) : ''.padStart(12);
    
    lines.push(model + res_df + rss + df + sum_sq + f + p);
  }
  
  lines.push('-'.repeat(74));
  lines.push(`n = ${result.n}`);
  
  return lines.join('\n');
}

function formatPValue(p) {
  if (p < 0.0001) {
    return '< 0.0001';
  } else if (p < 0.001) {
    return '< 0.001';
  } else if (p < 0.01) {
    return '< 0.01';
  } else if (p < 0.05) {
    return '< 0.05';
  } else {
    return p.toFixed(4);
  }
}

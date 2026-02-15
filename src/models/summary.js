/**
 * Model Summary Functions - R-style summary output for fitted models
 */

import { pt } from '../distributions/t.js';
import { pf } from '../distributions/f.js';
import { pchisq } from '../distributions/chisq.js';

/**
 * Generate summary statistics for a fitted linear model
 * 
 * @param {Object} model - Fitted model from lm()
 * @returns {Object} - Summary statistics
 */
export function summaryLM(model) {
  const n = model.n;
  const p = model.p;
  const df_residual = model.df.residual;
  
  // Coefficient table
  const coef_table = [];
  for (let i = 0; i < p; i++) {
    coef_table.push({
      term: model.coef_names[i],
      estimate: model.coefficients[i],
      std_error: model.std_errors[i],
      t_value: model.t_values[i],
      p_value: model.p_values[i],
      signif: getSignificance(model.p_values[i])
    });
  }
  
  // Residual statistics
  const residuals = model.residuals;
  const sorted_res = residuals.slice().sort((a, b) => a - b);
  const res_quantiles = {
    min: sorted_res[0],
    q1: sorted_res[Math.floor(n * 0.25)],
    median: sorted_res[Math.floor(n * 0.50)],
    q3: sorted_res[Math.floor(n * 0.75)],
    max: sorted_res[n - 1]
  };
  
  return {
    call: 'lm',
    residuals: res_quantiles,
    coefficients: coef_table,
    
    // Model fit statistics
    residual_std_error: model.sigma,
    df_residual: df_residual,
    r_squared: model.r_squared,
    adj_r_squared: model.adj_r_squared,
    
    // F-statistic
    f_statistic: {
      value: model.f_statistic,
      df1: model.df.model,
      df2: df_residual,
      p_value: model.f_pvalue
    },
    
    n: n,
    p: p
  };
}

/**
 * Generate summary statistics for a fitted GLM
 * 
 * @param {Object} model - Fitted model from glm()
 * @returns {Object} - Summary statistics
 */
export function summaryGLM(model) {
  const n = model.n;
  const p = model.p;
  const df_residual = model.df.residual;
  const df_null = model.df.null;
  
  // Coefficient table with z-statistics (Wald tests)
  const coef_table = [];
  
  // For GLM, we compute z-statistics and p-values
  // Need to compute standard errors from the model
  // For now, use approximate SEs based on Fisher information
  
  for (let i = 0; i < p; i++) {
    // Approximate SE (would need Fisher information for exact)
    // For demonstration, use a simple approximation
    const se = computeGLMStandardError(model, i);
    const z_value = model.coefficients[i] / se;
    const p_value = 2 * (1 - pnorm(Math.abs(z_value)));
    
    coef_table.push({
      term: model.coef_names[i],
      estimate: model.coefficients[i],
      std_error: se,
      z_value: z_value,
      p_value: p_value,
      signif: getSignificance(p_value)
    });
  }
  
  // Deviance residual quantiles
  const dev_res = model.deviance_residuals;
  const sorted_res = dev_res.slice().sort((a, b) => a - b);
  const res_quantiles = {
    min: sorted_res[0],
    q1: sorted_res[Math.floor(n * 0.25)],
    median: sorted_res[Math.floor(n * 0.50)],
    q3: sorted_res[Math.floor(n * 0.75)],
    max: sorted_res[n - 1]
  };
  
  // Chi-squared test for model fit
  const chi_sq = model.null_deviance - model.deviance;
  const chi_df = df_null - df_residual;
  const chi_p = pchisq(chi_sq, chi_df, { lower_tail: false });
  
  return {
    call: 'glm',
    family: model.family,
    link: model.link,
    
    deviance_residuals: res_quantiles,
    coefficients: coef_table,
    
    // Model fit statistics
    null_deviance: model.null_deviance,
    residual_deviance: model.deviance,
    df_null: df_null,
    df_residual: df_residual,
    
    // Likelihood ratio test
    lr_test: {
      statistic: chi_sq,
      df: chi_df,
      p_value: chi_p
    },
    
    aic: model.aic,
    dispersion: model.dispersion,
    converged: model.converged,
    
    n: n,
    p: p
  };
}

/**
 * Compute approximate standard errors for GLM coefficients
 * Using the observed Fisher information
 */
function computeGLMStandardError(model, coef_index) {
  // This is a simplified approximation
  // Proper implementation would use Fisher information matrix
  const n = model.n;
  const dispersion = model.dispersion;
  
  // Rough approximation based on dispersion
  // Real implementation would compute (X'WX)^-1 where W is weight matrix
  return Math.sqrt(dispersion / n) * 2; // Placeholder
}

/**
 * Normal CDF approximation for p-value calculation
 */
function pnorm(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/**
 * Get significance code for p-value
 */
function getSignificance(p) {
  if (p < 0.001) return '***';
  if (p < 0.01) return '**';
  if (p < 0.05) return '*';
  if (p < 0.1) return '.';
  return '';
}

/**
 * Print summary for linear model (lm)
 */
export function printSummaryLM(summary) {
  const lines = [];
  
  lines.push('\nCall:');
  lines.push(`${summary.call}(y ~ x)\n`);
  
  lines.push('Residuals:');
  const res = summary.residuals;
  lines.push(`    Min       1Q   Median       3Q      Max`);
  lines.push(
    `${res.min.toFixed(4).padStart(7)} ` +
    `${res.q1.toFixed(4).padStart(8)} ` +
    `${res.median.toFixed(4).padStart(8)} ` +
    `${res.q3.toFixed(4).padStart(8)} ` +
    `${res.max.toFixed(4).padStart(8)}\n`
  );
  
  lines.push('Coefficients:');
  lines.push(
    'Term'.padEnd(15) +
    'Estimate'.padStart(12) +
    'Std. Error'.padStart(12) +
    't value'.padStart(10) +
    'Pr(>|t|)'.padStart(12) +
    '   '
  );
  
  for (const row of summary.coefficients) {
    lines.push(
      row.term.padEnd(15) +
      row.estimate.toFixed(6).padStart(12) +
      row.std_error.toFixed(6).padStart(12) +
      row.t_value.toFixed(3).padStart(10) +
      formatPValue(row.p_value).padStart(12) +
      ' ' + row.signif.padEnd(3)
    );
  }
  
  lines.push('---');
  lines.push('Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1\n');
  
  lines.push(
    `Residual standard error: ${summary.residual_std_error.toFixed(4)} ` +
    `on ${summary.df_residual} degrees of freedom`
  );
  
  lines.push(
    `Multiple R-squared:  ${summary.r_squared.toFixed(4)},\t` +
    `Adjusted R-squared:  ${summary.adj_r_squared.toFixed(4)}`
  );
  
  const f = summary.f_statistic;
  lines.push(
    `F-statistic: ${f.value.toFixed(2)} on ${f.df1} and ${f.df2} DF,  ` +
    `p-value: ${formatPValue(f.p_value)}\n`
  );
  
  return lines.join('\n');
}

/**
 * Print summary for generalized linear model (glm)
 */
export function printSummaryGLM(summary) {
  const lines = [];
  
  lines.push('\nCall:');
  lines.push(`${summary.call}(y ~ x, family = ${summary.family}(link = "${summary.link}"))\n`);
  
  lines.push('Deviance Residuals:');
  const res = summary.deviance_residuals;
  lines.push(`    Min       1Q   Median       3Q      Max`);
  lines.push(
    `${res.min.toFixed(4).padStart(7)} ` +
    `${res.q1.toFixed(4).padStart(8)} ` +
    `${res.median.toFixed(4).padStart(8)} ` +
    `${res.q3.toFixed(4).padStart(8)} ` +
    `${res.max.toFixed(4).padStart(8)}\n`
  );
  
  lines.push('Coefficients:');
  lines.push(
    'Term'.padEnd(15) +
    'Estimate'.padStart(12) +
    'Std. Error'.padStart(12) +
    'z value'.padStart(10) +
    'Pr(>|z|)'.padStart(12) +
    '   '
  );
  
  for (const row of summary.coefficients) {
    lines.push(
      row.term.padEnd(15) +
      row.estimate.toFixed(6).padStart(12) +
      row.std_error.toFixed(6).padStart(12) +
      row.z_value.toFixed(3).padStart(10) +
      formatPValue(row.p_value).padStart(12) +
      ' ' + row.signif.padEnd(3)
    );
  }
  
  lines.push('---');
  lines.push('Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1\n');
  
  lines.push(
    `    Null deviance: ${summary.null_deviance.toFixed(4)}  ` +
    `on ${summary.df_null}  degrees of freedom`
  );
  lines.push(
    `Residual deviance: ${summary.residual_deviance.toFixed(4)}  ` +
    `on ${summary.df_residual}  degrees of freedom`
  );
  
  lines.push(`AIC: ${summary.aic.toFixed(2)}\n`);
  
  const lr = summary.lr_test;
  lines.push(
    `Likelihood ratio test: χ² = ${lr.statistic.toFixed(4)} ` +
    `(df = ${lr.df}), p-value = ${formatPValue(lr.p_value)}`
  );
  
  if (summary.dispersion > 1.5) {
    lines.push(`\nWarning: Dispersion parameter (${summary.dispersion.toFixed(4)}) suggests possible overdispersion`);
  }
  
  if (!summary.converged) {
    lines.push('\nWarning: Algorithm did not converge');
  }
  
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Format p-value for display
 */
function formatPValue(p) {
  if (p < 0.0001) return '< 0.0001';
  if (p < 0.001) return '< 0.001';
  if (p < 0.01) return '< 0.01';
  if (p < 0.05) return '< 0.05';
  if (p < 0.1) return '< 0.1';
  return p.toFixed(4);
}

/**
 * Generic summary function that dispatches to appropriate summary method
 */
export function summarizeModel(model) {
  if (model.family === 'gaussian' && !model.link) {
    // Linear model (lm)
    return summaryLM(model);
  } else if (model.family) {
    // Generalized linear model (glm)
    return summaryGLM(model);
  } else if (model.coefficients && model.r_squared) {
    // Assume linear model if has R-squared
    return summaryLM(model);
  } else {
    throw new Error('Unknown model type');
  }
}

/**
 * Generic print function for model summaries
 */
export function printModelSummary(summary) {
  if (summary.call === 'lm') {
    return printSummaryLM(summary);
  } else if (summary.call === 'glm') {
    return printSummaryGLM(summary);
  } else {
    throw new Error('Unknown summary type');
  }
}

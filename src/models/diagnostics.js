/**
 * Model Diagnostics - Influence measures and diagnostic statistics
 * for linear and generalized linear models
 */

import { qt } from '../distributions/t.js';
import { Matrix } from '../math/matrix.js';

/**
 * Compute diagnostic statistics for a fitted model
 * 
 * @param {Object} model - Fitted model from lm() or glm()
 * @returns {Object} - Diagnostic statistics
 * 
 * Includes:
 * - Leverage (hat values)
 * - Cook's distance
 * - DFBETAS
 * - Standardized and studentized residuals
 * - Influence measures
 */
export function diagnostics(model) {
  const n = model.n;
  const p = model.p;
  const X = model._X;
  
  if (!X) {
    throw new Error('Model must contain design matrix (_X) for diagnostics');
  }
  
  // Compute hat matrix diagonal (leverage)
  const leverage = computeLeverage(X);
  
  // Standardized residuals
  const std_residuals = new Float64Array(n);
  const sigma = model.sigma || Math.sqrt(model.deviance / model.df.residual);
  
  for (let i = 0; i < n; i++) {
    std_residuals[i] = model.residuals[i] / sigma;
  }
  
  // Studentized residuals (leave-one-out)
  const student_residuals = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const h_ii = leverage[i];
    student_residuals[i] = model.residuals[i] / (sigma * Math.sqrt(1 - h_ii));
  }
  
  // Cook's distance
  const cooks_d = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const h_ii = leverage[i];
    const r_i = std_residuals[i];
    cooks_d[i] = (r_i * r_i * h_ii) / (p * (1 - h_ii));
  }
  
  // DFBETAS - influence on each coefficient
  const dfbetas = computeDFBETAS(model, leverage, student_residuals);
  
  // DFFITS - influence on fitted values
  const dffits = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const h_ii = leverage[i];
    dffits[i] = student_residuals[i] * Math.sqrt(h_ii / (1 - h_ii));
  }
  
  // Identify influential points
  const influential = identifyInfluential(n, p, leverage, cooks_d, dffits, dfbetas);
  
  return {
    leverage: Array.from(leverage),
    cooks_distance: Array.from(cooks_d),
    standardized_residuals: Array.from(std_residuals),
    studentized_residuals: Array.from(student_residuals),
    dfbetas: dfbetas.map(arr => Array.from(arr)),
    dffits: Array.from(dffits),
    influential,
    
    // Summary statistics
    max_cooks_d: Math.max(...cooks_d),
    max_leverage: Math.max(...leverage),
    mean_leverage: p / n, // theoretical mean
  };
}

/**
 * Compute leverage (hat values) from design matrix
 * h_ii = [X(X'X)^-1X']_ii
 */
function computeLeverage(X) {
  const n = X.rows;
  const p = X.cols;
  const leverage = new Float64Array(n);
  
  // Compute X'X
  const XtX = X.transpose().multiply(X);
  
  // Invert X'X
  const XtX_inv = invertMatrix(XtX);
  
  // Compute leverage for each observation
  // h_i = x_i' (X'X)^-1 x_i
  for (let i = 0; i < n; i++) {
    let h_ii = 0;
    for (let j = 0; j < p; j++) {
      for (let k = 0; k < p; k++) {
        h_ii += X.get(i, j) * XtX_inv.get(j, k) * X.get(i, k);
      }
    }
    leverage[i] = Math.max(0, Math.min(1, h_ii)); // Bound to [0, 1]
  }
  
  return leverage;
}

/**
 * Compute DFBETAS - change in each coefficient when observation i is deleted
 */
function computeDFBETAS(model, leverage, student_residuals) {
  const n = model.n;
  const p = model.p;
  const X = model._X;
  const sigma = model.sigma || Math.sqrt(model.deviance / model.df.residual);
  
  // Compute (X'X)^-1
  const XtX = X.transpose().multiply(X);
  const XtX_inv = invertMatrix(XtX);
  
  // DFBETAS for each observation and coefficient
  const dfbetas = [];
  
  for (let i = 0; i < n; i++) {
    const dfbeta_i = new Float64Array(p);
    const h_ii = leverage[i];
    const r_i = student_residuals[i];
    
    for (let j = 0; j < p; j++) {
      // DFBETAS_j(i) = (r_i / (sigma * sqrt((X'X)^-1_jj))) * x_ij / sqrt(1 - h_ii)
      const x_ij = X.get(i, j);
      const se_j = sigma * Math.sqrt(Math.max(0, XtX_inv.get(j, j)));
      dfbeta_i[j] = (r_i * x_ij) / (se_j * Math.sqrt(1 - h_ii));
    }
    
    dfbetas.push(dfbeta_i);
  }
  
  return dfbetas;
}

/**
 * Identify influential observations using standard thresholds
 */
function identifyInfluential(n, p, leverage, cooks_d, dffits, dfbetas) {
  const influential = [];
  
  // Thresholds
  const leverage_threshold = 2 * p / n;
  const cooks_threshold = 4 / n;
  const dffits_threshold = 2 * Math.sqrt(p / n);
  const dfbetas_threshold = 2 / Math.sqrt(n);
  
  for (let i = 0; i < n; i++) {
    const reasons = [];
    
    if (leverage[i] > leverage_threshold) {
      reasons.push('high leverage');
    }
    
    if (cooks_d[i] > cooks_threshold) {
      reasons.push('high Cook\'s D');
    }
    
    if (Math.abs(dffits[i]) > dffits_threshold) {
      reasons.push('high DFFITS');
    }
    
    // Check if any DFBETAS exceeds threshold
    for (let j = 0; j < p; j++) {
      if (Math.abs(dfbetas[i][j]) > dfbetas_threshold) {
        reasons.push(`high DFBETAS[${j}]`);
        break;
      }
    }
    
    if (reasons.length > 0) {
      influential.push({
        observation: i + 1,
        reasons,
        leverage: leverage[i],
        cooks_d: cooks_d[i],
        dffits: dffits[i]
      });
    }
  }
  
  return influential;
}

/**
 * Matrix inversion using Gauss-Jordan elimination
 */
function invertMatrix(A) {
  const n = A.rows;
  if (A.cols !== n) {
    throw new Error('Matrix must be square');
  }
  
  // Create augmented matrix [A | I]
  const aug = new Matrix(n, 2 * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      aug.set(i, j, A.get(i, j));
    }
    aug.set(i, n + i, 1);
  }
  
  // Gauss-Jordan elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    let maxVal = Math.abs(aug.get(i, i));
    for (let k = i + 1; k < n; k++) {
      const val = Math.abs(aug.get(k, i));
      if (val > maxVal) {
        maxVal = val;
        maxRow = k;
      }
    }
    
    // Swap rows
    if (maxRow !== i) {
      for (let j = 0; j < 2 * n; j++) {
        const tmp = aug.get(i, j);
        aug.set(i, j, aug.get(maxRow, j));
        aug.set(maxRow, j, tmp);
      }
    }
    
    // Scale pivot row
    const pivot = aug.get(i, i);
    if (Math.abs(pivot) < 1e-10) {
      throw new Error('Matrix is singular');
    }
    
    for (let j = 0; j < 2 * n; j++) {
      aug.set(i, j, aug.get(i, j) / pivot);
    }
    
    // Eliminate column
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = aug.get(k, i);
        for (let j = 0; j < 2 * n; j++) {
          aug.set(k, j, aug.get(k, j) - factor * aug.get(i, j));
        }
      }
    }
  }
  
  // Extract inverse
  const inv = new Matrix(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      inv.set(i, j, aug.get(i, n + j));
    }
  }
  
  return inv;
}

/**
 * Compute confidence intervals for model coefficients
 * 
 * @param {Object} model - Fitted model from lm() or glm()
 * @param {number} level - Confidence level (default: 0.95)
 * @returns {Array} - Array of [lower, upper] bounds for each coefficient
 */
export function confint(model, level = 0.95) {
  const p = model.p;
  const df = model.df.residual;
  const alpha = 1 - level;
  
  // t-quantile for confidence interval
  const t_crit = qt(1 - alpha / 2, df);
  
  const intervals = [];
  
  for (let i = 0; i < p; i++) {
    const coef = model.coefficients[i];
    const se = model.std_errors[i];
    const margin = t_crit * se;
    
    intervals.push({
      coefficient: model.coef_names[i],
      estimate: coef,
      lower: coef - margin,
      upper: coef + margin,
      level: level
    });
  }
  
  return intervals;
}

/**
 * Compute prediction intervals for new observations
 * 
 * @param {Object} model - Fitted model from lm()
 * @param {Array} newX - New predictor values
 * @param {number} level - Confidence level (default: 0.95)
 * @param {string} interval - 'confidence' or 'prediction' (default: 'confidence')
 * @returns {Object} - Predictions with intervals
 */
export function predictWithInterval(model, newX, level = 0.95, interval = 'confidence') {
  if (model.family && model.family !== 'gaussian') {
    throw new Error('Prediction intervals only supported for linear models (lm)');
  }
  
  const n_new = newX[0].length;
  const p = model.p;
  const intercept = model.coef_names[0] === '(Intercept)';
  const df = model.df.residual;
  const sigma = model.sigma;
  const alpha = 1 - level;
  const t_crit = qt(1 - alpha / 2, df);
  
  // Build design matrix for new data
  const cols = [];
  
  if (intercept) {
    const interceptCol = new Float64Array(n_new);
    interceptCol.fill(1);
    cols.push(interceptCol);
  }
  
  for (let j = 0; j < newX.length; j++) {
    const col = new Float64Array(n_new);
    for (let i = 0; i < n_new; i++) {
      col[i] = newX[j][i];
    }
    cols.push(col);
  }
  
  const X_new = Matrix.fromColumns(cols);
  
  // Compute predictions
  const coefs = new Float64Array(model.coefficients);
  const predictions = X_new.multiplyVector(coefs);
  
  // Compute standard errors
  // SE(pred) = sigma * sqrt(x' (X'X)^-1 x)
  // SE(forecast) = sigma * sqrt(1 + x' (X'X)^-1 x)
  
  const X_train = model._X;
  const XtX = X_train.transpose().multiply(X_train);
  const XtX_inv = invertMatrix(XtX);
  
  const results = [];
  
  for (let i = 0; i < n_new; i++) {
    // Extract row i from X_new as vector
    const x_i = new Float64Array(p);
    for (let j = 0; j < p; j++) {
      x_i[j] = X_new.get(i, j);
    }
    
    // Compute x' (X'X)^-1 x
    let variance_multiplier = 0;
    for (let j = 0; j < p; j++) {
      for (let k = 0; k < p; k++) {
        variance_multiplier += x_i[j] * XtX_inv.get(j, k) * x_i[k];
      }
    }
    
    // Standard error depends on interval type
    let se;
    if (interval === 'confidence') {
      // Confidence interval for mean response
      se = sigma * Math.sqrt(variance_multiplier);
    } else if (interval === 'prediction') {
      // Prediction interval for individual observation
      se = sigma * Math.sqrt(1 + variance_multiplier);
    } else {
      throw new Error('interval must be "confidence" or "prediction"');
    }
    
    const margin = t_crit * se;
    
    results.push({
      fit: predictions[i],
      lower: predictions[i] - margin,
      upper: predictions[i] + margin,
      se: se
    });
  }
  
  return {
    predictions: results,
    level: level,
    interval: interval
  };
}

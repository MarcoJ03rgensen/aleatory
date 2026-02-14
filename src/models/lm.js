/**
 * Linear regression (lm) - R-style linear models
 * Implements ordinary least squares using QR decomposition
 */

import Vector from '../core/Vector.js';
import { Matrix } from '../math/matrix.js';
import { leastSquares } from '../math/qr.js';
import { pt, qt } from '../distributions/t.js';
import { pf } from '../distributions/f.js';

/**
 * Fit a linear model using ordinary least squares
 * 
 * @param {Vector|Array} y - Response variable
 * @param {Matrix|Array<Vector|Array>} X - Design matrix or array of predictors
 * @param {Object} options - Options
 * @param {boolean} options.intercept - Include intercept (default: true)
 * @returns {Object} - Model fit object
 * 
 * @example
 * // Simple linear regression
 * const x = [1, 2, 3, 4, 5];
 * const y = [2.1, 3.9, 6.2, 7.8, 10.1];
 * const fit = lm(y, [x]);
 * 
 * @example
 * // Multiple regression
 * const y = [10, 12, 15, 18, 20];
 * const x1 = [1, 2, 3, 4, 5];
 * const x2 = [2, 3, 4, 5, 6];
 * const fit = lm(y, [x1, x2]);
 */
export function lm(y, X, { intercept = true } = {}) {
  // Convert y to Vector
  const yVec = y instanceof Vector ? y : new Vector(y);
  const n = yVec.length;
  
  // Check for NAs in y and remove if present
  const validIndices = [];
  for (let i = 0; i < n; i++) {
    if (!yVec.isNA(i)) {
      validIndices.push(i);
    }
  }
  
  if (validIndices.length === 0) {
    throw new Error('No valid observations in response variable');
  }
  
  const nValid = validIndices.length;
  
  // Build design matrix
  let p; // number of predictors (including intercept)
  let designMatrix;
  
  if (X instanceof Matrix) {
    designMatrix = X;
    p = X.cols;
  } else if (Array.isArray(X)) {
    // X is array of predictor vectors
    const nPredictors = X.length;
    p = intercept ? nPredictors + 1 : nPredictors;
    
    const cols = [];
    
    // Add intercept column if requested
    if (intercept) {
      const interceptCol = new Float64Array(nValid);
      interceptCol.fill(1);
      cols.push(interceptCol);
    }
    
    // Add predictor columns
    for (let j = 0; j < nPredictors; j++) {
      const pred = X[j] instanceof Vector ? X[j] : new Vector(X[j]);
      const col = new Float64Array(nValid);
      
      for (let i = 0; i < nValid; i++) {
        const origIdx = validIndices[i];
        if (pred.isNA(origIdx)) {
          throw new Error(`NA values in predictor ${j + 1} not yet supported`);
        }
        col[i] = pred.get(origIdx);
      }
      
      cols.push(col);
    }
    
    designMatrix = Matrix.fromColumns(cols);
  } else {
    throw new Error('X must be a Matrix or array of predictors');
  }
  
  // Extract valid y values
  const yData = new Float64Array(nValid);
  for (let i = 0; i < nValid; i++) {
    yData[i] = yVec.get(validIndices[i]);
  }
  
  // Check dimensions
  if (designMatrix.rows !== nValid) {
    throw new Error(`Design matrix has ${designMatrix.rows} rows but response has ${nValid} valid observations`);
  }
  
  if (nValid <= p) {
    throw new Error(`Not enough observations (${nValid}) for ${p} parameters`);
  }
  
  // Fit model using QR decomposition
  const coefficients = leastSquares(designMatrix, yData);
  
  // Calculate fitted values
  const fitted = designMatrix.multiplyVector(coefficients);
  
  // Calculate residuals
  const residuals = new Float64Array(nValid);
  for (let i = 0; i < nValid; i++) {
    residuals[i] = yData[i] - fitted[i];
  }
  
  // Calculate residual sum of squares
  let rss = 0;
  for (let i = 0; i < nValid; i++) {
    rss += residuals[i] * residuals[i];
  }
  
  // Degrees of freedom
  const df_residual = nValid - p;
  const df_total = nValid - 1;
  
  // Residual standard error
  const sigma = Math.sqrt(rss / df_residual);
  
  // Calculate R-squared
  let yMean = 0;
  for (let i = 0; i < nValid; i++) {
    yMean += yData[i];
  }
  yMean /= nValid;
  
  let tss = 0; // Total sum of squares
  for (let i = 0; i < nValid; i++) {
    const diff = yData[i] - yMean;
    tss += diff * diff;
  }
  
  const r_squared = 1 - (rss / tss);
  const adj_r_squared = 1 - ((rss / df_residual) / (tss / df_total));
  
  // Standard errors (using diagonal of (X'X)^-1)
  // For QR: (X'X)^-1 = (R'R)^-1 = R^-1 * (R')^-1
  const se = calculateStandardErrors(designMatrix, sigma);
  
  // t-statistics and p-values
  const tStats = new Float64Array(p);
  const pValues = new Float64Array(p);
  
  for (let i = 0; i < p; i++) {
    tStats[i] = coefficients[i] / se[i];
    // Two-tailed p-value
    pValues[i] = 2 * pt(-Math.abs(tStats[i]), df_residual, { lower_tail: true });
  }
  
  // F-statistic for overall model significance
  const mss = tss - rss; // Model sum of squares
  const df_model = p - (intercept ? 1 : 0);
  const f_statistic = df_model > 0 ? (mss / df_model) / (rss / df_residual) : null;
  const f_pvalue = f_statistic !== null ? pf(f_statistic, df_model, df_residual, { lower_tail: false }) : null;
  
  // Build coefficient names
  const coefNames = [];
  if (intercept) {
    coefNames.push('(Intercept)');
  }
  for (let i = (intercept ? 1 : 0); i < p; i++) {
    coefNames.push(`x${i - (intercept ? 1 : 0) + 1}`);
  }
  
  // Return lm object
  return {
    coefficients: Array.from(coefficients),
    residuals: Array.from(residuals),
    fitted_values: Array.from(fitted),
    
    // Summary statistics
    sigma,
    df: { residual: df_residual, total: df_total, model: df_model },
    r_squared,
    adj_r_squared,
    
    // Coefficient information
    std_errors: Array.from(se),
    t_values: Array.from(tStats),
    p_values: Array.from(pValues),
    
    // Overall model test
    f_statistic,
    f_pvalue,
    
    // Data info
    n: nValid,
    p,
    coef_names: coefNames,
    
    // Residual analysis
    rss,
    tss,
    
    // Design matrix (for predictions)
    _X: designMatrix,
  };
}

/**
 * Calculate standard errors of coefficients
 * SE = sigma * sqrt(diag((X'X)^-1))
 * 
 * Uses the fact that after QR decomposition:
 * (X'X)^-1 = R^-1 * (R')^-1
 */
function calculateStandardErrors(X, sigma) {
  const p = X.cols;
  const se = new Float64Array(p);
  
  // Compute X'X
  const XtX = X.transpose().multiply(X);
  
  // Invert using Cholesky or simple inversion for small matrices
  // For now, use simple Gaussian elimination for diagonal extraction
  const XtXinv = invertSmallMatrix(XtX);
  
  // Extract diagonal
  for (let i = 0; i < p; i++) {
    se[i] = sigma * Math.sqrt(Math.abs(XtXinv.get(i, i)));
  }
  
  return se;
}

/**
 * Simple matrix inversion for small matrices using Gauss-Jordan elimination
 */
function invertSmallMatrix(A) {
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
    aug.set(i, n + i, 1); // Identity on right side
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
    
    // Swap rows if needed
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
      throw new Error('Matrix is singular or nearly singular');
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
  
  // Extract inverse from right side
  const inv = new Matrix(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      inv.set(i, j, aug.get(i, n + j));
    }
  }
  
  return inv;
}

/**
 * Predict using a fitted linear model
 * 
 * @param {Object} model - Fitted model from lm()
 * @param {Array<Vector|Array>} newX - New predictor values
 * @returns {Array} - Predicted values
 */
export function predict(model, newX) {
  const n = newX[0].length;
  const p = model.p;
  const intercept = model.coef_names[0] === '(Intercept)';
  
  // Build design matrix for new data
  const cols = [];
  
  if (intercept) {
    const interceptCol = new Float64Array(n);
    interceptCol.fill(1);
    cols.push(interceptCol);
  }
  
  for (let j = 0; j < newX.length; j++) {
    const pred = newX[j] instanceof Vector ? newX[j] : new Vector(newX[j]);
    const col = new Float64Array(n);
    
    for (let i = 0; i < n; i++) {
      col[i] = pred.get(i);
    }
    
    cols.push(col);
  }
  
  const X_new = Matrix.fromColumns(cols);
  
  // Compute predictions
  const coefs = new Float64Array(model.coefficients);
  const predictions = X_new.multiplyVector(coefs);
  
  return Array.from(predictions);
}

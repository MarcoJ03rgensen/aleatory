/**
 * Generalized Linear Models (GLM) - R-style GLM fitting
 * Implements GLM using Iteratively Reweighted Least Squares (IRWLS)
 */

import Vector from '../core/Vector.js';
import { Matrix } from '../math/matrix.js';
import { leastSquares } from '../math/qr.js';
import { dnorm, pnorm } from '../distributions/normal.js';
import { dpois, ppois } from '../distributions/poisson.js';
import { dbinom, pbinom } from '../distributions/binomial.js';
import { pchisq } from '../distributions/chisq.js';

/**
 * Family objects define the distribution and link function for GLM
 */

// Gaussian family (normal distribution)
export const gaussian = (link = 'identity') => ({
  family: 'gaussian',
  link: link,
  
  linkfun: (mu) => {
    if (link === 'identity') return mu;
    if (link === 'log') return Math.log(mu);
    if (link === 'inverse') return 1 / mu;
    throw new Error(`Unknown link: ${link}`);
  },
  
  linkinv: (eta) => {
    if (link === 'identity') return eta;
    if (link === 'log') return Math.exp(eta);
    if (link === 'inverse') return 1 / eta;
    throw new Error(`Unknown link: ${link}`);
  },
  
  mu_eta: (eta) => {
    if (link === 'identity') return 1;
    if (link === 'log') return Math.exp(eta);
    if (link === 'inverse') return -1 / (eta * eta);
    throw new Error(`Unknown link: ${link}`);
  },
  
  variance: (mu) => 1,
  
  dev_resids: (y, mu, wt) => {
    const r = y - mu;
    return wt * r * r;
  },
  
  aic: (y, n, mu, wt, dev) => {
    const nobs = y.length;
    return nobs * (Math.log(dev / nobs * 2 * Math.PI) + 1) + 2;
  },
  
  validmu: (mu) => true,
  valideta: (eta) => true
});

// Binomial family (logistic regression)
export const binomial = (link = 'logit') => ({
  family: 'binomial',
  link: link,
  
  linkfun: (mu) => {
    if (link === 'logit') return Math.log(mu / (1 - mu));
    if (link === 'probit') return pnorm(mu); // Inverse probit
    if (link === 'log') return Math.log(mu);
    throw new Error(`Unknown link: ${link}`);
  },
  
  linkinv: (eta) => {
    if (link === 'logit') {
      // Stable computation of 1/(1 + exp(-eta))
      if (eta > 0) {
        const expNeg = Math.exp(-eta);
        return 1 / (1 + expNeg);
      } else {
        const expPos = Math.exp(eta);
        return expPos / (1 + expPos);
      }
    }
    if (link === 'probit') {
      // For probit: eta = Phi^-1(mu), so mu = Phi(eta)
      return pnorm(eta);
    }
    if (link === 'log') return Math.exp(eta);
    throw new Error(`Unknown link: ${link}`);
  },
  
  mu_eta: (eta) => {
    if (link === 'logit') {
      const expEta = Math.exp(eta);
      const denom = (1 + expEta) * (1 + expEta);
      return expEta / denom;
    }
    if (link === 'probit') {
      return dnorm(eta); // Density at eta
    }
    if (link === 'log') return Math.exp(eta);
    throw new Error(`Unknown link: ${link}`);
  },
  
  variance: (mu) => mu * (1 - mu),
  
  dev_resids: (y, mu, wt) => {
    const epsilon = 1e-10;
    const muSafe = Math.max(epsilon, Math.min(1 - epsilon, mu));
    const d1 = y > 0 ? y * Math.log(y / muSafe) : 0;
    const d2 = (1 - y) > 0 ? (1 - y) * Math.log((1 - y) / (1 - muSafe)) : 0;
    return 2 * wt * (d1 + d2);
  },
  
  aic: (y, n, mu, wt, dev) => {
    const m = y.map((yi, i) => wt[i]);
    let aic = dev;
    for (let i = 0; i < y.length; i++) {
      if (m[i] > 0) {
        aic += 2 * (y[i] > 0 ? y[i] * Math.log(y[i] / m[i]) : 0) +
               2 * ((m[i] - y[i]) > 0 ? (m[i] - y[i]) * Math.log((m[i] - y[i]) / m[i]) : 0);
      }
    }
    return aic;
  },
  
  validmu: (mu) => mu > 0 && mu < 1,
  valideta: (eta) => true
});

// Poisson family (count data)
export const poisson = (link = 'log') => ({
  family: 'poisson',
  link: link,
  
  linkfun: (mu) => {
    if (link === 'log') return Math.log(mu);
    if (link === 'identity') return mu;
    if (link === 'sqrt') return Math.sqrt(mu);
    throw new Error(`Unknown link: ${link}`);
  },
  
  linkinv: (eta) => {
    if (link === 'log') return Math.exp(eta);
    if (link === 'identity') return eta;
    if (link === 'sqrt') return eta * eta;
    throw new Error(`Unknown link: ${link}`);
  },
  
  mu_eta: (eta) => {
    if (link === 'log') return Math.exp(eta);
    if (link === 'identity') return 1;
    if (link === 'sqrt') return 2 * eta;
    throw new Error(`Unknown link: ${link}`);
  },
  
  variance: (mu) => mu,
  
  dev_resids: (y, mu, wt) => {
    const epsilon = 1e-10;
    const muSafe = Math.max(epsilon, mu);
    return 2 * wt * (y * Math.log(Math.max(epsilon, y) / muSafe) - (y - mu));
  },
  
  aic: (y, n, mu, wt, dev) => {
    return dev + 2 * y.reduce((sum, yi) => {
      let logfact = 0;
      for (let i = 2; i <= yi; i++) logfact += Math.log(i);
      return sum + logfact;
    }, 0);
  },
  
  validmu: (mu) => mu > 0,
  valideta: (eta) => true
});

// Gamma family
export const Gamma = (link = 'inverse') => ({
  family: 'Gamma',
  link: link,
  
  linkfun: (mu) => {
    if (link === 'inverse') return 1 / mu;
    if (link === 'identity') return mu;
    if (link === 'log') return Math.log(mu);
    throw new Error(`Unknown link: ${link}`);
  },
  
  linkinv: (eta) => {
    if (link === 'inverse') return 1 / eta;
    if (link === 'identity') return eta;
    if (link === 'log') return Math.exp(eta);
    throw new Error(`Unknown link: ${link}`);
  },
  
  mu_eta: (eta) => {
    if (link === 'inverse') return -1 / (eta * eta);
    if (link === 'identity') return 1;
    if (link === 'log') return Math.exp(eta);
    throw new Error(`Unknown link: ${link}`);
  },
  
  variance: (mu) => mu * mu,
  
  dev_resids: (y, mu, wt) => {
    return 2 * wt * ((y - mu) / mu - Math.log(y / mu));
  },
  
  aic: (y, n, mu, wt, dev) => {
    // Simplified AIC for Gamma
    return dev + 2;
  },
  
  validmu: (mu) => mu > 0,
  valideta: (eta) => link === 'inverse' ? eta !== 0 : true
});

/**
 * Fit a generalized linear model
 * 
 * @param {Vector|Array} y - Response variable
 * @param {Matrix|Array<Vector|Array>} X - Design matrix or array of predictors
 * @param {Object} options - Options
 * @param {Object} options.family - Family object (gaussian(), binomial(), poisson(), Gamma())
 * @param {boolean} options.intercept - Include intercept (default: true)
 * @param {number} options.maxit - Maximum iterations (default: 25)
 * @param {number} options.epsilon - Convergence tolerance (default: 1e-8)
 * @param {Array} options.weights - Prior weights (default: all 1s)
 * @returns {Object} - Fitted GLM object
 * 
 * @example
 * // Logistic regression
 * const x = [1, 2, 3, 4, 5];
 * const y = [0, 0, 1, 1, 1];
 * const fit = glm(y, [x], { family: binomial() });
 * 
 * @example
 * // Poisson regression for count data
 * const x = [1, 2, 3, 4, 5];
 * const y = [2, 3, 5, 8, 13];
 * const fit = glm(y, [x], { family: poisson() });
 */
export function glm(y, X, { 
  family = gaussian(), 
  intercept = true, 
  maxit = 25, 
  epsilon = 1e-8,
  weights = null 
} = {}) {
  // Convert y to Vector
  const yVec = y instanceof Vector ? y : new Vector(y);
  const n = yVec.length;
  
  // Check for NAs and remove
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
  
  // Extract valid y values
  const yData = new Float64Array(nValid);
  for (let i = 0; i < nValid; i++) {
    yData[i] = yVec.get(validIndices[i]);
  }
  
  // Build design matrix
  let p;
  let designMatrix;
  
  if (X instanceof Matrix) {
    designMatrix = X;
    p = X.cols;
  } else if (Array.isArray(X)) {
    const nPredictors = X.length;
    p = intercept ? nPredictors + 1 : nPredictors;
    
    const cols = [];
    
    if (intercept) {
      const interceptCol = new Float64Array(nValid);
      interceptCol.fill(1);
      cols.push(interceptCol);
    }
    
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
  
  // Prior weights
  const wts = new Float64Array(nValid);
  if (weights === null) {
    wts.fill(1);
  } else {
    for (let i = 0; i < nValid; i++) {
      wts[i] = weights[validIndices[i]];
    }
  }
  
  // Initialize
  const muStart = new Float64Array(nValid);
  const etaStart = new Float64Array(nValid);
  
  // Initial values for mu
  for (let i = 0; i < nValid; i++) {
    muStart[i] = yData[i] + (yData[i] === 0 ? 0.1 : 0);
    if (family.family === 'binomial') {
      muStart[i] = (yData[i] * wts[i] + 0.5) / (wts[i] + 1);
    } else if (family.family === 'poisson') {
      muStart[i] = yData[i] + 0.1;
    }
    etaStart[i] = family.linkfun(muStart[i]);
  }
  
  // IRWLS algorithm
  let coefficients = null;
  let mu = Float64Array.from(muStart);
  let eta = Float64Array.from(etaStart);
  let deviance = Infinity;
  let converged = false;
  
  for (let iter = 0; iter < maxit; iter++) {
    const devOld = deviance;
    
    // Compute working weights and working response
    const w = new Float64Array(nValid);
    const z = new Float64Array(nValid);
    
    for (let i = 0; i < nValid; i++) {
      const muEta = family.mu_eta(eta[i]);
      const variance = family.variance(mu[i]);
      
      // Working weight: w = (dmu/deta)^2 / V(mu)
      w[i] = wts[i] * (muEta * muEta) / Math.max(variance, 1e-10);
      
      // Working response: z = eta + (y - mu) * deta/dmu
      z[i] = eta[i] + (yData[i] - mu[i]) / Math.max(muEta, 1e-10);
      
      // Bound working weights and response
      if (!isFinite(w[i]) || w[i] < 1e-10) w[i] = 1e-10;
      if (!isFinite(z[i])) z[i] = eta[i];
    }
    
    // Weighted least squares: solve (X'WX)b = X'Wz
    // Create weighted design matrix: X_w = W^(1/2) * X
    const XCols = [];
    for (let j = 0; j < p; j++) {
      const col = new Float64Array(nValid);
      for (let i = 0; i < nValid; i++) {
        col[i] = designMatrix.get(i, j) * Math.sqrt(w[i]);
      }
      XCols.push(col);
    }
    const Xw = Matrix.fromColumns(XCols);
    
    // Weighted response: z_w = W^(1/2) * z
    const zw = new Float64Array(nValid);
    for (let i = 0; i < nValid; i++) {
      zw[i] = z[i] * Math.sqrt(w[i]);
    }
    
    // Solve
    coefficients = leastSquares(Xw, zw);
    
    // Update eta and mu
    const etaNew = designMatrix.multiplyVector(coefficients);
    
    for (let i = 0; i < nValid; i++) {
      eta[i] = etaNew[i];
      mu[i] = family.linkinv(eta[i]);
      
      // Bound mu to valid range
      if (!family.validmu(mu[i])) {
        if (family.family === 'binomial') {
          mu[i] = Math.max(1e-6, Math.min(1 - 1e-6, mu[i]));
        } else if (family.family === 'poisson' || family.family === 'Gamma') {
          mu[i] = Math.max(1e-6, mu[i]);
        }
        eta[i] = family.linkfun(mu[i]);
      }
    }
    
    // Compute deviance
    deviance = 0;
    for (let i = 0; i < nValid; i++) {
      deviance += family.dev_resids(yData[i], mu[i], wts[i]);
    }
    
    // Check convergence
    if (Math.abs(deviance - devOld) < epsilon * (0.1 + Math.abs(deviance))) {
      converged = true;
      break;
    }
  }
  
  // Calculate residuals
  const residuals = new Float64Array(nValid);
  const pearsonResiduals = new Float64Array(nValid);
  const devianceResiduals = new Float64Array(nValid);
  
  for (let i = 0; i < nValid; i++) {
    // Response residuals
    residuals[i] = yData[i] - mu[i];
    
    // Pearson residuals: (y - mu) / sqrt(V(mu))
    const variance = family.variance(mu[i]);
    pearsonResiduals[i] = residuals[i] / Math.sqrt(Math.max(variance, 1e-10));
    
    // Deviance residuals: sign(y - mu) * sqrt(deviance contribution)
    const sign = yData[i] > mu[i] ? 1 : -1;
    devianceResiduals[i] = sign * Math.sqrt(Math.abs(family.dev_resids(yData[i], mu[i], 1)));
  }
  
  // Null deviance (intercept-only model)
  let nullDeviance = 0;
  const muNull = yData.reduce((sum, val) => sum + val, 0) / nValid;
  for (let i = 0; i < nValid; i++) {
    nullDeviance += family.dev_resids(yData[i], muNull, wts[i]);
  }
  
  // Degrees of freedom
  const df_residual = nValid - p;
  const df_null = nValid - (intercept ? 1 : 0);
  
  // AIC
  const aic = family.aic(yData, nValid, mu, wts, deviance) + 2 * p;
  
  // Coefficient names
  const coefNames = [];
  if (intercept) {
    coefNames.push('(Intercept)');
  }
  for (let i = (intercept ? 1 : 0); i < p; i++) {
    coefNames.push(`x${i - (intercept ? 1 : 0) + 1}`);
  }
  
  return {
    coefficients: Array.from(coefficients),
    residuals: Array.from(residuals),
    fitted_values: Array.from(mu),
    linear_predictors: Array.from(eta),
    
    // GLM-specific
    family: family.family,
    link: family.link,
    deviance,
    null_deviance: nullDeviance,
    
    // Residuals
    pearson_residuals: Array.from(pearsonResiduals),
    deviance_residuals: Array.from(devianceResiduals),
    
    // Diagnostics
    aic,
    df: { residual: df_residual, null: df_null },
    dispersion: deviance / df_residual,
    
    // Convergence
    converged,
    iterations: converged ? null : maxit,
    
    // Data info
    n: nValid,
    p,
    coef_names: coefNames,
    weights: Array.from(wts),
    
    // For predictions
    _family: family,
    _X: designMatrix,
  };
}

/**
 * Predict using a fitted GLM
 * 
 * @param {Object} model - Fitted GLM from glm()
 * @param {Array<Vector|Array>} newX - New predictor values
 * @param {string} type - Type of prediction: 'link' or 'response' (default: 'response')
 * @returns {Array} - Predicted values
 */
export function predictGlm(model, newX, type = 'response') {
  const n = newX[0].length;
  const p = model.p;
  const intercept = model.coef_names[0] === '(Intercept)';
  
  // Build design matrix
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
  
  // Linear predictors (eta = X * beta)
  const coefs = new Float64Array(model.coefficients);
  const eta = X_new.multiplyVector(coefs);
  
  if (type === 'link') {
    return Array.from(eta);
  } else if (type === 'response') {
    // Apply inverse link function
    const mu = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      mu[i] = model._family.linkinv(eta[i]);
    }
    return Array.from(mu);
  } else {
    throw new Error(`Unknown prediction type: ${type}. Use 'link' or 'response'.`);
  }
}

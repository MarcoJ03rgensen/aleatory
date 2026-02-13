// F-distribution functions

import { lgamma, betaIncomplete } from '../math/special.js';
import { dchisq, rchisq } from './chisq.js';

/**
 * F probability density function
 * @param {number|number[]} x - values
 * @param {number} df1 - numerator degrees of freedom
 * @param {number} df2 - denominator degrees of freedom
 * @param {boolean} log - return log density (default false)
 * @returns {number|number[]} density value(s)
 */
export function df(x, df1, df2, { log = false } = {}) {
  const scalar = typeof x === 'number';
  const values = scalar ? [x] : x;
  
  if (df1 <= 0 || df2 <= 0) {
    throw new Error('Both df1 and df2 must be positive');
  }
  
  const result = values.map(xi => {
    if (xi == null || isNaN(xi)) return NaN;
    if (xi < 0) return log ? -Infinity : 0;
    if (xi === 0) {
      if (df1 < 2) return log ? Infinity : Infinity;
      if (df1 === 2) return log ? 0 : 1;
      return log ? -Infinity : 0;
    }
    if (!isFinite(xi)) return log ? -Infinity : 0;
    
    // F density: (df1/df2)^(df1/2) * Γ((df1+df2)/2) / (Γ(df1/2) * Γ(df2/2))
    //          * x^(df1/2 - 1) * (1 + df1*x/df2)^(-(df1+df2)/2)
    
    const d1 = df1;
    const d2 = df2;
    const half_d1 = d1 / 2;
    const half_d2 = d2 / 2;
    const half_sum = (d1 + d2) / 2;
    
    const logDens = half_d1 * Math.log(d1) + half_d1 * Math.log(xi)
                  - half_d1 * Math.log(d2)
                  + lgamma(half_sum)
                  - lgamma(half_d1) - lgamma(half_d2)
                  - half_sum * Math.log(1 + d1 * xi / d2);
    
    return log ? logDens : Math.exp(logDens);
  });
  
  return scalar ? result[0] : result;
}

/**
 * F cumulative distribution function
 * @param {number|number[]} q - quantiles
 * @param {number} df1 - numerator degrees of freedom
 * @param {number} df2 - denominator degrees of freedom
 * @param {boolean} lower_tail - P(X <= q) if true (default true)
 * @param {boolean} log_p - return log probability (default false)
 * @returns {number|number[]} probability value(s)
 */
export function pf(q, df1, df2, { lower_tail = true, log_p = false } = {}) {
  const scalar = typeof q === 'number';
  const values = scalar ? [q] : q;
  
  if (df1 <= 0 || df2 <= 0) {
    throw new Error('Both df1 and df2 must be positive');
  }
  
  const result = values.map(qi => {
    if (qi == null || isNaN(qi)) return NaN;
    if (qi <= 0) return formatProb(0, lower_tail, log_p);
    if (!isFinite(qi)) return formatProb(1, lower_tail, log_p);
    
    // P(F <= x) = P(Beta(df1/2, df2/2) <= (df1*x)/(df1*x + df2))
    // This is the incomplete beta function I_w(df1/2, df2/2)
    // where w = (df1*x) / (df1*x + df2)
    
    const w = (df1 * qi) / (df1 * qi + df2);
    const p = betaIncomplete(w, df1/2, df2/2);
    
    return formatProb(p, lower_tail, log_p);
  });
  
  return scalar ? result[0] : result;
}

/**
 * F quantile function
 * Uses Newton-Raphson iteration
 * @param {number|number[]} p - probabilities
 * @param {number} df1 - numerator degrees of freedom
 * @param {number} df2 - denominator degrees of freedom
 * @param {boolean} lower_tail - quantile of lower tail (default true)
 * @param {boolean} log_p - p is given as log(p) (default false)
 * @returns {number|number[]} quantile value(s)
 */
export function qf(p, df1, df2, { lower_tail = true, log_p = false } = {}) {
  const scalar = typeof p === 'number';
  const values = scalar ? [p] : p;
  
  if (df1 <= 0 || df2 <= 0) {
    throw new Error('Both df1 and df2 must be positive');
  }
  
  const result = values.map(pi => {
    if (pi == null || isNaN(pi)) return NaN;
    
    let prob = log_p ? Math.exp(pi) : pi;
    if (prob < 0 || prob > 1) return NaN;
    
    if (!lower_tail) prob = 1 - prob;
    
    if (prob === 0) return 0;
    if (prob === 1) return Infinity;
    
    // Initial guess using mean and variance
    let x;
    if (df2 > 4) {
      const mean = df2 / (df2 - 2);
      const variance = 2 * df2 * df2 * (df1 + df2 - 2) / (df1 * (df2 - 2) * (df2 - 2) * (df2 - 4));
      x = mean + Math.sqrt(variance) * (prob - 0.5) * 2;
      x = Math.max(0.01, x);
    } else {
      x = 1;
    }
    
    // Newton-Raphson refinement
    const maxIter = 50;
    const tol = 1e-12;
    
    for (let i = 0; i < maxIter; i++) {
      const cdf = pf(x, df1, df2);
      const pdf = df(x, df1, df2);
      
      if (pdf === 0 || !isFinite(pdf)) break;
      
      const delta = (cdf - prob) / pdf;
      x = x - delta;
      
      if (x < 0) x = 0.001; // Keep positive
      if (Math.abs(delta) < tol * Math.abs(x)) break;
    }
    
    return x;
  });
  
  return scalar ? result[0] : result;
}

/**
 * Generate random F variates
 * F ~ (χ²(df1)/df1) / (χ²(df2)/df2)
 * @param {number} n - number of values
 * @param {number} df1 - numerator degrees of freedom
 * @param {number} df2 - denominator degrees of freedom
 * @returns {number[]} random values
 */
export function rf(n, df1, df2) {
  if (df1 <= 0 || df2 <= 0) {
    throw new Error('Both df1 and df2 must be positive');
  }
  
  const chisq1 = rchisq(n, df1);
  const chisq2 = rchisq(n, df2);
  
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push((chisq1[i] / df1) / (chisq2[i] / df2));
  }
  
  return result;
}

// Helper function to format probability output
function formatProb(p, lower_tail, log_p) {
  const prob = lower_tail ? p : 1 - p;
  if (log_p) {
    return prob <= 0 ? -Infinity : Math.log(prob);
  }
  return prob;
}

export default { df, pf, qf, rf };

// Chi-squared distribution functions

import { lgamma, gammaIncomplete } from '../math/special.js';

/**
 * Chi-squared probability density function
 * @param {number|number[]} x - values
 * @param {number} df - degrees of freedom
 * @param {boolean} log - return log density (default false)
 * @returns {number|number[]} density value(s)
 */
export function dchisq(x, df, { log = false } = {}) {
  const scalar = typeof x === 'number';
  const values = scalar ? [x] : x;
  
  if (df <= 0) throw new Error('df must be positive');
  
  const result = values.map(xi => {
    if (xi == null || isNaN(xi)) return NaN;
    if (xi < 0) return log ? -Infinity : 0;
    if (xi === 0) {
      if (df < 2) return log ? Infinity : Infinity;
      if (df === 2) return log ? -Math.log(2) : 0.5;
      return log ? -Infinity : 0;
    }
    
    // χ² density: (1/2^(k/2) Γ(k/2)) x^(k/2-1) e^(-x/2)
    const logDens = (df/2 - 1) * Math.log(xi) - xi/2 
                    - df/2 * Math.log(2) - lgamma(df/2);
    
    return log ? logDens : Math.exp(logDens);
  });
  
  return scalar ? result[0] : result;
}

/**
 * Chi-squared cumulative distribution function
 * @param {number|number[]} q - quantiles
 * @param {number} df - degrees of freedom
 * @param {boolean} lower_tail - P(X <= q) if true (default true)
 * @param {boolean} log_p - return log probability (default false)
 * @returns {number|number[]} probability value(s)
 */
export function pchisq(q, df, { lower_tail = true, log_p = false } = {}) {
  const scalar = typeof q === 'number';
  const values = scalar ? [q] : q;
  
  if (df <= 0) throw new Error('df must be positive');
  
  const result = values.map(qi => {
    if (qi == null || isNaN(qi)) return NaN;
    if (qi <= 0) return formatProb(0, lower_tail, log_p);
    if (!isFinite(qi)) return formatProb(1, lower_tail, log_p);
    
    // P(χ² <= x) = P(Γ(k/2) <= x/2) = P_γ(k/2, x/2)
    const p = gammaIncomplete(df/2, qi/2);
    
    return formatProb(p, lower_tail, log_p);
  });
  
  return scalar ? result[0] : result;
}

/**
 * Chi-squared quantile function
 * Uses Newton-Raphson iteration
 * @param {number|number[]} p - probabilities
 * @param {number} df - degrees of freedom
 * @param {boolean} lower_tail - quantile of lower tail (default true)
 * @param {boolean} log_p - p is given as log(p) (default false)
 * @returns {number|number[]} quantile value(s)
 */
export function qchisq(p, df, { lower_tail = true, log_p = false } = {}) {
  const scalar = typeof p === 'number';
  const values = scalar ? [p] : p;
  
  if (df <= 0) throw new Error('df must be positive');
  
  const result = values.map(pi => {
    if (pi == null || isNaN(pi)) return NaN;
    
    let prob = log_p ? Math.exp(pi) : pi;
    if (prob < 0 || prob > 1) return NaN;
    
    if (!lower_tail) prob = 1 - prob;
    
    if (prob === 0) return 0;
    if (prob === 1) return Infinity;
    
    // Initial guess using Wilson-Hilferty transformation
    let x = wilsonHilfertyApprox(prob, df);
    
    // Newton-Raphson refinement
    const maxIter = 20;
    const tol = 1e-12;
    
    for (let i = 0; i < maxIter; i++) {
      const cdf = pchisq(x, df);
      const pdf = dchisq(x, df);
      
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
 * Generate random chi-squared variates
 * @param {number} n - number of values
 * @param {number} df - degrees of freedom
 * @returns {number[]} random values
 */
export function rchisq(n, df) {
  if (df <= 0) throw new Error('df must be positive');
  
  const result = [];
  
  for (let i = 0; i < n; i++) {
    let sum = 0;
    const k = Math.floor(df);
    
    // Sum of k squared standard normals
    for (let j = 0; j < k; j++) {
      const z = rnormSingle();
      sum += z * z;
    }
    
    // Handle fractional df using gamma representation
    const frac = df - k;
    if (frac > 0) {
      // For χ²(ν) with fractional ν, use Gamma(ν/2, 2)
      // Approximate for now
      const z = rnormSingle();
      sum += frac * z * z;
    }
    
    result.push(sum);
  }
  
  return result;
}

// Helpers
function rnormSingle() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function formatProb(p, lower_tail, log_p) {
  const prob = lower_tail ? p : 1 - p;
  if (log_p) {
    return prob <= 0 ? -Infinity : Math.log(prob);
  }
  return prob;
}

// Wilson-Hilferty normal approximation for initial guess
function wilsonHilfertyApprox(p, df) {
  const z = qnormApprox(p);
  const wh = 1 - 2/(9*df) + z * Math.sqrt(2/(9*df));
  return df * wh * wh * wh;
}

function qnormApprox(p) {
  const q = p - 0.5;
  
  if (Math.abs(q) <= 0.42) {
    const r = q * q;
    return q * ((((-25.44106049637 * r + 41.39119773534) * r
      - 18.61500062529) * r + 2.50662823884) * r) /
      ((((3.13082909833 * r - 21.06224101826) * r
      + 23.08336743743) * r - 8.47351093090) * r + 1.0);
  } else {
    let r = p < 0.5 ? p : 1 - p;
    r = Math.sqrt(-Math.log(r));
    
    const z = (((2.32121276858 * r + 4.85014127135) * r
      - 2.29796479134) * r - 2.78718931138) /
      ((1.63706781897 * r + 3.54388924762) * r + 1.0);
    
    return p < 0.5 ? -z : z;
  }
}

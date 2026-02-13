// Student's t-distribution functions
// Uses exact implementations with beta function and Newton-Raphson for quantiles

import { lbeta, betaIncomplete } from '../math/special.js';

/**
 * Student's t probability density function
 * @param {number|number[]} x - values
 * @param {number} df - degrees of freedom
 * @param {boolean} log - return log density (default false)
 * @returns {number|number[]} density value(s)
 */
export function dt(x, df, { log = false } = {}) {
  const scalar = typeof x === 'number';
  const values = scalar ? [x] : x;
  
  if (df <= 0) throw new Error('df must be positive');
  
  const result = values.map(xi => {
    if (xi == null || isNaN(xi)) return NaN;
    
    // t density: Γ((ν+1)/2) / (√(νπ) Γ(ν/2)) * (1 + x²/ν)^(-(ν+1)/2)
    // Using log-beta function for numerical stability
    const logDens = -lbeta(0.5, df/2) - 0.5 * Math.log(df) 
                    - (df + 1) / 2 * Math.log(1 + xi * xi / df);
    
    return log ? logDens : Math.exp(logDens);
  });
  
  return scalar ? result[0] : result;
}

/**
 * Student's t cumulative distribution function
 * @param {number|number[]} q - quantiles
 * @param {number} df - degrees of freedom
 * @param {boolean} lower_tail - P(X <= q) if true, P(X > q) if false (default true)
 * @param {boolean} log_p - return log probability (default false)
 * @returns {number|number[]} probability value(s)
 */
export function pt(q, df, { lower_tail = true, log_p = false } = {}) {
  const scalar = typeof q === 'number';
  const values = scalar ? [q] : q;
  
  if (df <= 0) throw new Error('df must be positive');
  
  const result = values.map(qi => {
    if (qi == null || isNaN(qi)) return NaN;
    
    // Special cases
    if (!isFinite(qi)) {
      const p = qi < 0 ? 0 : 1;
      return formatProb(p, lower_tail, log_p);
    }
    
    // Use relationship to beta distribution:
    // P(T <= t) = 1/2 + sign(t)/2 * I_x((ν+1)/2, (ν+1)/2)
    // where x = ν/(ν + t²)
    const x = df / (df + qi * qi);
    const betaCdf = betaIncomplete(x, df/2, 0.5);
    
    let p;
    if (qi >= 0) {
      p = 1 - 0.5 * betaCdf;
    } else {
      p = 0.5 * betaCdf;
    }
    
    return formatProb(p, lower_tail, log_p);
  });
  
  return scalar ? result[0] : result;
}

/**
 * Student's t quantile function (inverse CDF)
 * Uses Newton-Raphson iteration with pt/dt
 * @param {number|number[]} p - probabilities
 * @param {number} df - degrees of freedom
 * @param {boolean} lower_tail - quantile of lower tail if true (default true)
 * @param {boolean} log_p - p is given as log(p) (default false)
 * @returns {number|number[]} quantile value(s)
 */
export function qt(p, df, { lower_tail = true, log_p = false } = {}) {
  const scalar = typeof p === 'number';
  const values = scalar ? [p] : p;
  
  if (df <= 0) throw new Error('df must be positive');
  
  const result = values.map(pi => {
    if (pi == null || isNaN(pi)) return NaN;
    
    let prob = log_p ? Math.exp(pi) : pi;
    if (prob < 0 || prob > 1) return NaN;
    
    if (!lower_tail) prob = 1 - prob;
    
    // Special cases
    if (prob === 0) return -Infinity;
    if (prob === 1) return Infinity;
    if (prob === 0.5) return 0;
    
    // For large df, t converges to normal
    if (df > 1e6) {
      return qnormApprox(prob);
    }
    
    // Initial guess using normal approximation, but adjusted for df
    let t = qnormApprox(prob);
    
    // Cornish-Fisher expansion for better initial guess
    if (df < 100) {
      const g1 = (t * t * t + t) / (4 * df);
      const g2 = (5 * Math.pow(t, 5) + 16 * t * t * t + 3 * t) / (96 * df * df);
      t = t + g1 + g2;
    }
    
    // Newton-Raphson iteration
    const maxIter = 10;
    const tol = 1e-12;
    
    for (let i = 0; i < maxIter; i++) {
      const cdf = pt(t, df);
      const pdf = dt(t, df);
      
      if (pdf === 0) break; // Avoid division by zero
      
      const delta = (cdf - prob) / pdf;
      t = t - delta;
      
      if (Math.abs(delta) < tol) break;
    }
    
    return t;
  });
  
  return scalar ? result[0] : result;
}

/**
 * Generate random t variates
 * Uses ratio of normal and chi-squared: T = Z / √(χ²/df)
 * @param {number} n - number of values to generate
 * @param {number} df - degrees of freedom
 * @returns {number[]} random values
 */
export function rt(n, df) {
  if (df <= 0) throw new Error('df must be positive');
  
  const result = [];
  
  for (let i = 0; i < n; i++) {
    // Generate standard normal
    const z = rnormSingle();
    
    // Generate chi-squared
    const chisq = rchisqSingle(df);
    
    // t = Z / √(χ²/df)
    result.push(z / Math.sqrt(chisq / df));
  }
  
  return result;
}

// Helper: generate single standard normal using Box-Muller
function rnormSingle() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Helper: generate single chi-squared variate
// For integer df, sum of df squared normals
function rchisqSingle(df) {
  let sum = 0;
  const k = Math.floor(df);
  
  // Integer part
  for (let i = 0; i < k; i++) {
    const z = rnormSingle();
    sum += z * z;
  }
  
  // Fractional part (if df is not integer)
  const frac = df - k;
  if (frac > 0) {
    // Use gamma representation for fractional df
    // For now, approximate with interpolation
    const z = rnormSingle();
    sum += frac * z * z;
  }
  
  return sum;
}

// Helper: format probability with lower_tail and log_p
function formatProb(p, lower_tail, log_p) {
  const prob = lower_tail ? p : 1 - p;
  if (log_p) {
    return prob <= 0 ? -Infinity : Math.log(prob);
  }
  return prob;
}

// Helper: quick normal quantile approximation for initial guess
function qnormApprox(p) {
  // Beasley-Springer-Moro approximation (simplified)
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

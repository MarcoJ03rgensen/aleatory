// Normal distribution functions (R-compatible)
// Uses Marsaglia polar method for rnorm, rational approximations for pnorm/qnorm

const SQRT_2PI = Math.sqrt(2 * Math.PI);
const SQRT_2 = Math.sqrt(2);

/**
 * Normal probability density function
 * @param {number|number[]} x - values
 * @param {number} mean - mean (default 0)
 * @param {number} sd - standard deviation (default 1)
 * @param {boolean} log - return log density (default false)
 * @returns {number|number[]} density value(s)
 */
export function dnorm(x, { mean = 0, sd = 1, log = false } = {}) {
  const scalar = typeof x === 'number';
  const values = scalar ? [x] : x;
  
  const result = values.map(xi => {
    if (xi == null || isNaN(xi)) return NaN;
    if (sd <= 0) return NaN;
    
    const z = (xi - mean) / sd;
    const logDens = -0.5 * z * z - Math.log(sd * SQRT_2PI);
    return log ? logDens : Math.exp(logDens);
  });
  
  return scalar ? result[0] : result;
}

/**
 * Normal cumulative distribution function (CDF)
 * Uses rational approximation (Abramowitz & Stegun 26.2.17)
 * Accuracy: ~7.5e-8
 * @param {number|number[]} q - quantiles
 * @param {number} mean - mean (default 0)
 * @param {number} sd - standard deviation (default 1)
 * @param {boolean} lower_tail - P(X <= q) if true, P(X > q) if false (default true)
 * @param {boolean} log_p - return log probability (default false)
 * @returns {number|number[]} probability value(s)
 */
export function pnorm(q, { mean = 0, sd = 1, lower_tail = true, log_p = false } = {}) {
  const scalar = typeof q === 'number';
  const values = scalar ? [q] : q;
  
  const result = values.map(qi => {
    if (qi == null || isNaN(qi)) return NaN;
    if (sd <= 0) return NaN;
    
    const z = (qi - mean) / sd;
    
    // Use error function approximation
    const p = 0.5 * (1 + erf(z / SQRT_2));
    const prob = lower_tail ? p : 1 - p;
    
    if (log_p) {
      return prob <= 0 ? -Infinity : Math.log(prob);
    }
    return prob;
  });
  
  return scalar ? result[0] : result;
}

/**
 * Normal quantile function (inverse CDF)
 * Uses Beasley-Springer-Moro algorithm
 * @param {number|number[]} p - probabilities
 * @param {number} mean - mean (default 0)
 * @param {number} sd - standard deviation (default 1)
 * @param {boolean} lower_tail - quantile of lower tail if true (default true)
 * @param {boolean} log_p - p is given as log(p) (default false)
 * @returns {number|number[]} quantile value(s)
 */
export function qnorm(p, { mean = 0, sd = 1, lower_tail = true, log_p = false } = {}) {
  const scalar = typeof p === 'number';
  const values = scalar ? [p] : p;
  
  const result = values.map(pi => {
    if (pi == null || isNaN(pi)) return NaN;
    if (sd <= 0) return NaN;
    
    let prob = log_p ? Math.exp(pi) : pi;
    if (prob < 0 || prob > 1) return NaN;
    
    if (!lower_tail) prob = 1 - prob;
    
    // Special cases
    if (prob === 0) return -Infinity;
    if (prob === 1) return Infinity;
    if (prob === 0.5) return mean;
    
    // Beasley-Springer-Moro approximation
    const q = prob - 0.5;
    let z;
    
    if (Math.abs(q) <= 0.42) {
      // Central region
      const r = q * q;
      z = q * ((((-25.44106049637 * r + 41.39119773534) * r
        - 18.61500062529) * r + 2.50662823884) * r + 0.0) /
        ((((3.13082909833 * r - 21.06224101826) * r
        + 23.08336743743) * r - 8.47351093090) * r + 1.0);
    } else {
      // Tail region
      let r = prob < 0.5 ? prob : 1 - prob;
      r = Math.sqrt(-Math.log(r));
      
      z = (((2.32121276858 * r + 4.85014127135) * r
        - 2.29796479134) * r - 2.78718931138) /
        ((1.63706781897 * r + 3.54388924762) * r + 1.0);
      
      if (prob < 0.5) z = -z;
    }
    
    return mean + sd * z;
  });
  
  return scalar ? result[0] : result;
}

/**
 * Generate random normal variates
 * Uses Marsaglia polar method
 * @param {number} n - number of values to generate
 * @param {number} mean - mean (default 0)
 * @param {number} sd - standard deviation (default 1)
 * @returns {number[]} random values
 */
export function rnorm(n, { mean = 0, sd = 1 } = {}) {
  if (sd <= 0) throw new Error('sd must be positive');
  
  const result = [];
  
  // Marsaglia polar method (generates pairs)
  for (let i = 0; i < n; i += 2) {
    let u, v, s;
    do {
      u = 2 * Math.random() - 1;
      v = 2 * Math.random() - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    
    const mul = Math.sqrt(-2 * Math.log(s) / s);
    result.push(mean + sd * u * mul);
    if (i + 1 < n) {
      result.push(mean + sd * v * mul);
    }
  }
  
  return result.slice(0, n);
}

// Error function approximation (Abramowitz & Stegun 7.1.26)
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  // Constants
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
}

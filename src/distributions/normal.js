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

  // Peter J. Acklam's inverse CDF approximation (robust, high accuracy)
  const a = [
    -3.969683028665376e+01,
     2.209460984245205e+02,
    -2.759285104469687e+02,
     1.383577518672690e+02,
    -3.066479806614716e+01,
     2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01,
     1.615858368580409e+02,
    -1.556989798598866e+02,
     6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
     4.374664141464968e+00,
     2.938163982698783e+00
  ];
  const d = [
     7.784695709041462e-03,
     3.224671290700398e-01,
     2.445134137142996e+00,
     3.754408661907416e+00
  ];

  const plow = 0.02425;
  const phigh = 1 - plow;

  const result = values.map(pi => {
    if (pi == null || isNaN(pi)) return NaN;
    if (sd <= 0) return NaN;

    let prob = log_p ? Math.exp(pi) : pi;
    if (prob < 0 || prob > 1) return NaN;
    if (!lower_tail) prob = 1 - prob;

    if (prob === 0) return -Infinity;
    if (prob === 1) return Infinity;
    if (prob === 0.5) return mean;

    let q, r, val;

    if (prob < plow) {
      // Rational approximation for lower region
      q = Math.sqrt(-2 * Math.log(prob));
      val = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (prob > phigh) {
      // Rational approximation for upper region (negate lower-tail approximation)
      q = Math.sqrt(-2 * Math.log(1 - prob));
      val = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else {
      // Rational approximation for central region
      q = prob - 0.5;
      r = q * q;
      val = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
            (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }

    return mean + sd * val;
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

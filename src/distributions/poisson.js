// Poisson distribution functions

/**
 * Poisson probability mass function
 * @param {number|number[]} x - number of events (must be non-negative integer)
 * @param {number} lambda - rate parameter (must be positive)
 * @param {boolean} log - return log probability (default false)
 * @returns {number|number[]} probability value(s)
 */
export function dpois(x, lambda, { log = false } = {}) {
  const scalar = typeof x === 'number';
  const values = scalar ? [x] : x;
  
  if (lambda < 0) {
    throw new Error('lambda must be non-negative');
  }
  
  const result = values.map(xi => {
    if (xi == null || isNaN(xi)) return NaN;
    if (xi !== Math.floor(xi) || xi < 0) {
      return log ? -Infinity : 0;
    }
    
    // P(X = k) = (λ^k * e^(-λ)) / k!
    // log P(X = k) = k*log(λ) - λ - log(k!)
    
    if (lambda === 0) {
      return xi === 0 ? (log ? 0 : 1) : (log ? -Infinity : 0);
    }
    
    const logProb = xi * Math.log(lambda) - lambda - logFactorial(xi);
    
    return log ? logProb : Math.exp(logProb);
  });
  
  return scalar ? result[0] : result;
}

/**
 * Poisson cumulative distribution function
 * @param {number|number[]} q - quantiles (number of events)
 * @param {number} lambda - rate parameter
 * @param {boolean} lower_tail - P(X <= q) if true (default true)
 * @param {boolean} log_p - return log probability (default false)
 * @returns {number|number[]} probability value(s)
 */
export function ppois(q, lambda, { lower_tail = true, log_p = false } = {}) {
  const scalar = typeof q === 'number';
  const values = scalar ? [q] : q;
  
  if (lambda < 0) {
    throw new Error('lambda must be non-negative');
  }
  
  const result = values.map(qi => {
    if (qi == null || isNaN(qi)) return NaN;
    
    const k = Math.floor(qi);
    
    if (k < 0) return formatProb(0, lower_tail, log_p);
    if (!isFinite(qi)) return formatProb(1, lower_tail, log_p);
    
    if (lambda === 0) return formatProb(1, lower_tail, log_p);
    
    // P(X <= k) = sum_{i=0}^{k} P(X = i)
    // For efficiency, accumulate in log space when possible
    let cumProb = 0;
    let term = Math.exp(-lambda); // P(X = 0)
    
    for (let i = 0; i <= k; i++) {
      cumProb += term;
      term *= lambda / (i + 1); // Compute next term recursively
    }
    
    return formatProb(cumProb, lower_tail, log_p);
  });
  
  return scalar ? result[0] : result;
}

/**
 * Poisson quantile function
 * @param {number|number[]} p - probabilities
 * @param {number} lambda - rate parameter
 * @param {boolean} lower_tail - quantile of lower tail (default true)
 * @param {boolean} log_p - p is given as log(p) (default false)
 * @returns {number|number[]} quantile value(s)
 */
export function qpois(p, lambda, { lower_tail = true, log_p = false } = {}) {
  const scalar = typeof p === 'number';
  const values = scalar ? [p] : p;
  
  if (lambda < 0) {
    throw new Error('lambda must be non-negative');
  }
  
  const result = values.map(pi => {
    if (pi == null || isNaN(pi)) return NaN;
    
    let target = log_p ? Math.exp(pi) : pi;
    if (target < 0 || target > 1) return NaN;
    
    if (!lower_tail) target = 1 - target;
    
    if (target === 0) return 0;
    if (target === 1) return Infinity;
    
    if (lambda === 0) return 0;
    
    // Sequential search from 0 until cumulative probability >= target
    // Start near expected value for efficiency
    let k = Math.max(0, Math.floor(lambda));
    let cumProb = ppois(k, lambda);
    
    if (cumProb < target) {
      // Search upward
      while (cumProb < target && k < 1e6) {
        k++;
        cumProb = ppois(k, lambda);
      }
    } else {
      // Search downward
      while (k > 0) {
        const prevCumProb = ppois(k - 1, lambda);
        if (prevCumProb < target) break;
        k--;
        cumProb = prevCumProb;
      }
    }
    
    return k;
  });
  
  return scalar ? result[0] : result;
}

/**
 * Generate random Poisson variates
 * Uses Knuth's algorithm for small lambda, ratio-of-uniforms for large lambda
 * @param {number} n - number of values
 * @param {number} lambda - rate parameter
 * @returns {number[]} random values
 */
export function rpois(n, lambda) {
  if (lambda < 0) {
    throw new Error('lambda must be non-negative');
  }
  
  const result = [];
  
  for (let i = 0; i < n; i++) {
    if (lambda < 30) {
      // Knuth's algorithm for small lambda
      result.push(rpoisKnuth(lambda));
    } else {
      // Ratio-of-uniforms method for large lambda
      result.push(rpoisRatioUniforms(lambda));
    }
  }
  
  return result;
}

// Helper functions

/**
 * Knuth's algorithm for generating Poisson random variates
 * Efficient for small lambda
 */
function rpoisKnuth(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  
  return k - 1;
}

/**
 * Ratio-of-uniforms method for large lambda
 * More efficient than Knuth for lambda > 30
 */
function rpoisRatioUniforms(lambda) {
  const c = 0.767 - 3.36 / lambda;
  const beta = Math.PI / Math.sqrt(3 * lambda);
  const alpha = beta * lambda;
  const k = Math.log(c) - lambda - Math.log(beta);
  
  while (true) {
    const u = Math.random();
    const x = (Math.random() - 0.5) / u;
    const n = Math.floor((2 * alpha / u + beta) * x + lambda + 0.5);
    
    if (n < 0) continue;
    
    const v = Math.random();
    const y = alpha - beta * x;
    const lhs = y + Math.log(v / (1 + Math.exp(y)) ** 2);
    const rhs = k + n * Math.log(lambda) - logFactorial(n);
    
    if (lhs <= rhs) return n;
  }
}

/**
 * Log factorial using Stirling approximation for large n
 */
function logFactorial(n) {
  // Small values lookup
  const small = [0, 0, 0.693147180559945, 1.791759469228055, 3.178053830347946,
                 4.787491742782046, 6.579251212010101, 8.525161361065415,
                 10.60460290274525, 12.80182748008147, 15.10441257307552,
                 17.50230784587389, 19.98721449566188, 22.55216385312342,
                 25.19122118273868, 27.89927138384089, 30.67186010608067];
  
  if (n <= 16) return small[n];
  
  // Stirling approximation: log(n!) ≈ n*log(n) - n + 0.5*log(2*π*n)
  return n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n);
}

function formatProb(p, lower_tail, log_p) {
  const prob = lower_tail ? p : 1 - p;
  if (log_p) {
    return prob <= 0 ? -Infinity : Math.log(prob);
  }
  return prob;
}

export default { dpois, ppois, qpois, rpois };

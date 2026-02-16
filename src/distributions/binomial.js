// Binomial distribution functions

import { lbeta } from '../math/special.js';

/**
 * Binomial probability mass function
 * @param {number|number[]} x - number of successes (must be integer)
 * @param {number} size - number of trials
 * @param {number} prob - probability of success
 * @param {boolean} log - return log probability (default false)
 * @returns {number|number[]} probability value(s)
 */
export function dbinom(x, size, prob, { log = false } = {}) {
  const scalar = typeof x === 'number';
  const values = scalar ? [x] : x;
  
  if (size < 0 || size !== Math.floor(size)) {
    throw new Error('size must be a non-negative integer');
  }
  if (prob < 0 || prob > 1) {
    throw new Error('prob must be between 0 and 1');
  }
  
  const result = values.map(xi => {
    if (xi == null || isNaN(xi)) return NaN;
    if (xi !== Math.floor(xi) || xi < 0 || xi > size) {
      return log ? -Infinity : 0;
    }
    
    // P(X = k) = C(n, k) * p^k * (1-p)^(n-k)
    // log P(X = k) = log C(n, k) + k*log(p) + (n-k)*log(1-p)
    
    if (prob === 0) return xi === 0 ? (log ? 0 : 1) : (log ? -Infinity : 0);
    if (prob === 1) return xi === size ? (log ? 0 : 1) : (log ? -Infinity : 0);
    
    const logProb = logChoose(size, xi) 
                  + xi * Math.log(prob) 
                  + (size - xi) * Math.log(1 - prob);
    
    return log ? logProb : Math.exp(logProb);
  });
  
  return scalar ? result[0] : result;
}

/**
 * Binomial cumulative distribution function
 * @param {number|number[]} q - quantiles (number of successes)
 * @param {number} size - number of trials
 * @param {number} prob - probability of success
 * @param {boolean} lower_tail - P(X <= q) if true (default true)
 * @param {boolean} log_p - return log probability (default false)
 * @returns {number|number[]} probability value(s)
 */
export function pbinom(q, size, prob, { lower_tail = true, log_p = false } = {}) {
  const scalar = typeof q === 'number';
  const values = scalar ? [q] : q;
  
  if (size < 0 || size !== Math.floor(size)) {
    throw new Error('size must be a non-negative integer');
  }
  if (prob < 0 || prob > 1) {
    throw new Error('prob must be between 0 and 1');
  }
  
  const result = values.map(qi => {
    if (qi == null || isNaN(qi)) return NaN;
    
    const k = Math.floor(qi);
    
    if (k < 0) return formatProb(0, lower_tail, log_p);
    if (k >= size) return formatProb(1, lower_tail, log_p);
    
    if (prob === 0) return formatProb(1, lower_tail, log_p);
    if (prob === 1) return formatProb(0, lower_tail, log_p);
    
    // Sum probabilities P(X = 0) + P(X = 1) + ... + P(X = k)
    let cumProb = 0;
    for (let i = 0; i <= k; i++) {
      cumProb += dbinom(i, size, prob);
    }

    // Clamp to [0,1] to avoid tiny round-off errors
    cumProb = Math.min(1, Math.max(0, cumProb));

    return formatProb(cumProb, lower_tail, log_p);
  });
  
  return scalar ? result[0] : result;
}

/**
 * Binomial quantile function
 * @param {number|number[]} p - probabilities
 * @param {number} size - number of trials
 * @param {number} prob - probability of success
 * @param {boolean} lower_tail - quantile of lower tail (default true)
 * @param {boolean} log_p - p is given as log(p) (default false)
 * @returns {number|number[]} quantile value(s)
 */
export function qbinom(p, size, prob, { lower_tail = true, log_p = false } = {}) {
  const scalar = typeof p === 'number';
  const values = scalar ? [p] : p;
  
  if (size < 0 || size !== Math.floor(size)) {
    throw new Error('size must be a non-negative integer');
  }
  if (prob < 0 || prob > 1) {
    throw new Error('prob must be between 0 and 1');
  }
  
  const result = values.map(pi => {
    if (pi == null || isNaN(pi)) return NaN;
    
    let target = log_p ? Math.exp(pi) : pi;
    if (target < 0 || target > 1) return NaN;
    
    if (!lower_tail) target = 1 - target;
    
    if (target === 0) return 0;
    if (target === 1) return size;
    
    // Binary search for smallest k such that P(X <= k) >= target
    let left = 0;
    let right = size;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const cumProb = pbinom(mid, size, prob);
      
      if (cumProb < target) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    return left;
  });
  
  return scalar ? result[0] : result;
}

/**
 * Generate random binomial variates
 * @param {number} n - number of values
 * @param {number} size - number of trials
 * @param {number} prob - probability of success
 * @returns {number[]} random values
 */
export function rbinom(n, size, prob) {
  if (size < 0 || size !== Math.floor(size)) {
    throw new Error('size must be a non-negative integer');
  }
  if (prob < 0 || prob > 1) {
    throw new Error('prob must be between 0 and 1');
  }
  
  const result = [];
  
  for (let i = 0; i < n; i++) {
    let successes = 0;
    
    // Simulate size Bernoulli trials
    for (let j = 0; j < size; j++) {
      if (Math.random() < prob) {
        successes++;
      }
    }
    
    result.push(successes);
  }
  
  return result;
}

// Helper functions

/**
 * Log of binomial coefficient C(n, k) = n! / (k! * (n-k)!)
 * Using log-gamma function to avoid overflow
 */
function logChoose(n, k) {
  if (k < 0 || k > n) return -Infinity;
  if (k === 0 || k === n) return 0;
  
  // log C(n, k) = log(n!) - log(k!) - log((n-k)!)
  // Using Stirling approximation for factorial
  return logFactorial(n) - logFactorial(k) - logFactorial(n - k);
}

/**
 * Log factorial using Stirling approximation for large n
 * For small n, use lookup table
 */
function logFactorial(n) {
  // Small values lookup
  const small = [0, 0, 0.693147180559945, 1.791759469228055, 3.178053830347946,
                 4.787491742782046, 6.579251212010101, 8.525161361065415,
                 10.60460290274525, 12.80182748008147, 15.10441257307552];
  
  if (n <= 10) return small[n];
  
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

export default { dbinom, pbinom, qbinom, rbinom };

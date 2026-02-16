// Special mathematical functions
// Gamma, beta, and related functions needed for distributions

/**
 * Log-gamma function using Lanczos approximation
 * @param {number} x - input value
 * @returns {number} log(Γ(x))
 */
export function lgamma(x) {
  if (x <= 0) {
    if (x === Math.floor(x)) return Infinity; // Pole at non-positive integers
  }
  
  // Lanczos approximation coefficients (g=7)
  const coef = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  
  if (x < 0.5) {
    // Reflection formula: Γ(1-z) Γ(z) = π / sin(πz)
    return Math.log(Math.PI) - Math.log(Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  }
  
  x -= 1;
  let a = coef[0];
  for (let i = 1; i < coef.length; i++) {
    a += coef[i] / (x + i);
  }
  
  const t = x + 7.5;
  return Math.log(Math.sqrt(2 * Math.PI)) + Math.log(a) - t + (x + 0.5) * Math.log(t);
}

/**
 * Gamma function
 * @param {number} x - input value
 * @returns {number} Γ(x)
 */
export function gamma(x) {
  return Math.exp(lgamma(x));
}

/**
 * Log-beta function
 * @param {number} a - first parameter
 * @param {number} b - second parameter  
 * @returns {number} log(B(a,b))
 */
export function lbeta(a, b) {
  return lgamma(a) + lgamma(b) - lgamma(a + b);
}

/**
 * Beta function
 * @param {number} a - first parameter
 * @param {number} b - second parameter
 * @returns {number} B(a,b)
 */
export function beta(a, b) {
  return Math.exp(lbeta(a, b));
}

/**
 * Regularized incomplete beta function I_x(a,b)
 * Uses continued fraction representation
 * @param {number} x - upper limit (0 <= x <= 1)
 * @param {number} a - first parameter
 * @param {number} b - second parameter
 * @returns {number} I_x(a,b)
 */
export function betaIncomplete(x, a, b) {
  if (x < 0 || x > 1) return NaN;
  if (x === 0) return 0;
  if (x === 1) return 1;
  
  // Use symmetry if needed: I_x(a,b) = 1 - I_(1-x)(b,a)
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - betaIncomplete(1 - x, b, a);
  }
  
  // Continued fraction evaluation (Lentz's algorithm)
  const logBeta = lbeta(a, b);
  // Use log1p for better precision when x is near 1
  const logTerm = a * Math.log(x) + b * Math.log1p(-x) - logBeta;
  const front = Math.exp(logTerm) / a;
  
  const cf = betaContinuedFraction(x, a, b);
  return front * cf;
}

/**
 * Continued fraction for incomplete beta
 * Uses modified Lentz's algorithm
 */
function betaContinuedFraction(x, a, b) {
  const maxIter = 200;
  const eps = 1e-15;
  
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < eps) d = eps;
  d = 1 / d;
  let h = d;
  
  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    
    // Even step
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < eps) d = eps;
    c = 1 + aa / c;
    if (Math.abs(c) < eps) c = eps;
    d = 1 / d;
    h *= d * c;
    
    // Odd step
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < eps) d = eps;
    c = 1 + aa / c;
    if (Math.abs(c) < eps) c = eps;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    
    if (Math.abs(delta - 1) < eps) break;
  }
  
  return h;
}

/**
 * Regularized incomplete gamma function P(a,x)
 * P(a,x) = γ(a,x) / Γ(a) where γ(a,x) is the lower incomplete gamma
 * @param {number} a - shape parameter
 * @param {number} x - upper limit
 * @returns {number} P(a,x)
 */
export function gammaIncomplete(a, x) {
  if (x < 0 || a <= 0) return NaN;
  if (x === 0) return 0;
  if (!isFinite(x)) return 1;
  
  // Use series representation for x < a+1, continued fraction otherwise
  if (x < a + 1) {
    return gammaIncompleteSeries(a, x);
  } else {
    return 1 - gammaIncompleteCF(a, x);
  }
}

/**
 * Incomplete gamma via series representation
 */
function gammaIncompleteSeries(a, x) {
  const maxIter = 200;
  const eps = 1e-15;
  
  let sum = 1 / a;
  let term = 1 / a;
  
  for (let n = 1; n <= maxIter; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < Math.abs(sum) * eps) break;
  }
  
  return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
}

/**
 * Incomplete gamma via continued fraction (for upper incomplete)
 */
function gammaIncompleteCF(a, x) {
  const maxIter = 200;
  const eps = 1e-15;
  
  let b = x + 1 - a;
  let c = 1 / eps;
  let d = 1 / b;
  let h = d;
  
  for (let i = 1; i <= maxIter; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < eps) d = eps;
    c = b + an / c;
    if (Math.abs(c) < eps) c = eps;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < eps) break;
  }
  
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

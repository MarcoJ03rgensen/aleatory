// Student's t-test implementation
import Vector from '../core/Vector.js';
import { pnorm } from '../distributions/normal.js';

/**
 * Student's t-test
 * @param {number[]|Vector} x - first sample
 * @param {number[]|Vector} y - second sample (optional, for two-sample test)
 * @param {Object} options
 * @param {number} options.mu - hypothesized mean difference (default 0)
 * @param {string} options.alternative - "two.sided", "less", or "greater" (default "two.sided")
 * @param {boolean} options.paired - paired t-test (default false)
 * @param {boolean} options.var_equal - assume equal variances (default false)
 * @param {number} options.conf_level - confidence level (default 0.95)
 * @returns {Object} test result object
 */
export function t_test(x, y = null, {
  mu = 0,
  alternative = 'two.sided',
  paired = false,
  var_equal = false,
  conf_level = 0.95
} = {}) {
  
  const vx = x instanceof Vector ? x : new Vector(x);
  const cleanX = vx.naOmit();
  
  // One-sample t-test
  if (y === null) {
    return oneSampleT(cleanX, mu, alternative, conf_level);
  }
  
  // Two-sample t-test
  const vy = y instanceof Vector ? y : new Vector(y);
  const cleanY = vy.naOmit();
  
  if (paired) {
    if (cleanX.length !== cleanY.length) {
      throw new Error('Paired test requires equal length vectors');
    }
    // Paired t-test reduces to one-sample on differences
    const diffs = cleanX.data.map((xi, i) => xi - cleanY.data[i]);
    return oneSampleT(new Vector(diffs), mu, alternative, conf_level);
  }
  
  return twoSampleT(cleanX, cleanY, mu, alternative, var_equal, conf_level);
}

/**
 * One-sample t-test
 */
function oneSampleT(x, mu, alternative, conf_level) {
  const n = x.length;
  const mean = x.mean();
  const sd = x.sd();
  const se = sd / Math.sqrt(n);
  
  const t_stat = (mean - mu) / se;
  const df = n - 1;
  
  // P-value calculation (using normal approximation for now - placeholder)
  // TODO: Implement proper t-distribution functions (pt, qt)
  const p_value = calculatePValue(t_stat, df, alternative);
  
  // Confidence interval
  const { lower, upper } = calculateCI(mean, se, df, conf_level, alternative);
  
  return {
    statistic: { t: t_stat },
    parameter: { df },
    p_value,
    conf_int: [lower, upper],
    estimate: { mean },
    null_value: { mean: mu },
    alternative,
    method: 'One Sample t-test',
    data_name: 'x'
  };
}

/**
 * Two-sample t-test
 */
function twoSampleT(x, y, mu, alternative, var_equal, conf_level) {
  const nx = x.length;
  const ny = y.length;
  const mx = x.mean();
  const my = y.mean();
  const vx = x.variance();
  const vy = y.variance();
  
  let t_stat, df, se;
  
  if (var_equal) {
    // Pooled variance (equal variance assumed)
    const pooled_var = ((nx - 1) * vx + (ny - 1) * vy) / (nx + ny - 2);
    se = Math.sqrt(pooled_var * (1/nx + 1/ny));
    t_stat = (mx - my - mu) / se;
    df = nx + ny - 2;
  } else {
    // Welch's t-test (unequal variances)
    se = Math.sqrt(vx/nx + vy/ny);
    t_stat = (mx - my - mu) / se;
    
    // Welch-Satterthwaite degrees of freedom
    const vx_n = vx / nx;
    const vy_n = vy / ny;
    df = Math.pow(vx_n + vy_n, 2) / 
         (Math.pow(vx_n, 2) / (nx - 1) + Math.pow(vy_n, 2) / (ny - 1));
  }
  
  const p_value = calculatePValue(t_stat, df, alternative);
  const { lower, upper } = calculateCI(mx - my, se, df, conf_level, alternative);
  
  return {
    statistic: { t: t_stat },
    parameter: { df },
    p_value,
    conf_int: [lower, upper],
    estimate: { 'mean of x': mx, 'mean of y': my },
    null_value: { 'difference in means': mu },
    alternative,
    method: var_equal ? 'Two Sample t-test' : "Welch Two Sample t-test",
    data_name: 'x and y'
  };
}

/**
 * Calculate p-value from t-statistic
 * PLACEHOLDER: Uses normal approximation (not accurate for small df)
 * TODO: Replace with proper pt() function when t-distribution is implemented
 */
function calculatePValue(t_stat, df, alternative) {
  // TEMPORARY: Normal approximation (works reasonably for df > 30)
  // This is a placeholder until we implement the t-distribution
  const abs_t = Math.abs(t_stat);
  const p_upper = pnorm(-abs_t, { lower_tail: false });
  
  switch (alternative) {
    case 'two.sided':
      return 2 * p_upper;
    case 'greater':
      return t_stat > 0 ? p_upper : 1 - p_upper;
    case 'less':
      return t_stat < 0 ? p_upper : 1 - p_upper;
    default:
      throw new Error(`Unknown alternative: ${alternative}`);
  }
}

/**
 * Calculate confidence interval
 * PLACEHOLDER: Uses normal quantiles
 * TODO: Replace with proper qt() function
 */
function calculateCI(estimate, se, df, conf_level, alternative) {
  // TEMPORARY: Using normal approximation
  // For df > 30, this is reasonable; for smaller df, we need t-quantiles
  
  if (alternative === 'two.sided') {
    const alpha = 1 - conf_level;
    // Using normal critical value (placeholder)
    const z = 1.96; // ~95% for normal; should be qt(1-alpha/2, df)
    return {
      lower: estimate - z * se,
      upper: estimate + z * se
    };
  } else if (alternative === 'less') {
    return {
      lower: -Infinity,
      upper: estimate + 1.645 * se // placeholder
    };
  } else { // greater
    return {
      lower: estimate - 1.645 * se, // placeholder
      upper: Infinity
    };
  }
}

export default t_test;

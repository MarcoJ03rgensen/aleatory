// Student's t-test implementation
import Vector from '../core/Vector.js';
import { pt, qt } from '../distributions/t.js';

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
  
  // P-value using proper t-distribution
  const p_value = calculatePValue(t_stat, df, alternative);
  
  // Confidence interval using t-quantiles
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
 * Calculate p-value from t-statistic using proper t-distribution
 */
function calculatePValue(t_stat, df, alternative) {
  const abs_t = Math.abs(t_stat);
  
  switch (alternative) {
    case 'two.sided':
      // P(|T| >= |t|) = 2 * P(T >= |t|)
      return 2 * pt(abs_t, df, { lower_tail: false });
    case 'greater':
      // P(T >= t)
      return pt(t_stat, df, { lower_tail: false });
    case 'less':
      // P(T <= t)
      return pt(t_stat, df, { lower_tail: true });
    default:
      throw new Error(`Unknown alternative: ${alternative}`);
  }
}

/**
 * Calculate confidence interval using proper t-quantiles
 */
function calculateCI(estimate, se, df, conf_level, alternative) {
  if (alternative === 'two.sided') {
    const alpha = 1 - conf_level;
    const t_crit = qt(1 - alpha/2, df);
    return {
      lower: estimate - t_crit * se,
      upper: estimate + t_crit * se
    };
  } else if (alternative === 'less') {
    const t_crit = qt(conf_level, df);
    return {
      lower: -Infinity,
      upper: estimate + t_crit * se
    };
  } else { // greater
    const t_crit = qt(conf_level, df);
    return {
      lower: estimate - t_crit * se,
      upper: Infinity
    };
  }
}

export default t_test;

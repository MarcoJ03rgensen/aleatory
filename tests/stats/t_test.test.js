// Golden-fixture tests for t-test (now with proper t-distribution)
// Reference values from R 4.3.0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { t_test } from '../../src/stats/t_test.js';
import Vector from '../../src/core/Vector.js';

const TOLERANCE = 1e-5; // Now we can use tighter tolerance!

function assertClose(actual, expected, tol = TOLERANCE, message = '') {
  assert.ok(
    Math.abs(actual - expected) < tol,
    `${message}Expected ${expected}, got ${actual} (diff: ${Math.abs(actual - expected)})`
  );
}

test('t_test - one sample (basic)', () => {
  // R: t.test(c(1, 2, 3, 4, 5))
  const x = [1, 2, 3, 4, 5];
  const result = t_test(x);
  
  assertClose(result.statistic.t, 3.464102, 0.001);
  assert.equal(result.parameter.df, 4);
  assertClose(result.p_value, 0.02535339, TOLERANCE);
  assert.equal(result.estimate.mean, 3);
  assert.equal(result.null_value.mean, 0);
  assert.equal(result.alternative, 'two.sided');
});

test('t_test - one sample with mu', () => {
  // R: t.test(c(10, 12, 13, 11, 15), mu=10)
  const x = [10, 12, 13, 11, 15];
  const result = t_test(x, null, { mu: 10 });
  
  assertClose(result.statistic.t, 2.738613, 0.001);
  assert.equal(result.parameter.df, 4);
  assertClose(result.p_value, 0.05192494, TOLERANCE);
  assertClose(result.estimate.mean, 12.2, 0.01);
  assert.equal(result.null_value.mean, 10);
});

test('t_test - confidence intervals', () => {
  // R: t.test(c(1, 2, 3, 4, 5))
  const x = [1, 2, 3, 4, 5];
  const result = t_test(x);
  
  // R gives: 95% CI [0.5253119, 5.4746881]
  assertClose(result.conf_int[0], 0.5253119, 0.001);
  assertClose(result.conf_int[1], 5.474688, 0.001);
});

test('t_test - one sample with Vector input', () => {
  const x = new Vector([5, 10, 15, 20]);
  const result = t_test(x, null, { mu: 10 });
  
  assertClose(result.statistic.t, 1.154701, 0.001);
  assert.equal(result.parameter.df, 3);
  assertClose(result.p_value, 0.3290053, TOLERANCE);
  assertClose(result.estimate.mean, 12.5, 0.01);
});

test('t_test - two sample (equal variance)', () => {
  // R: t.test(c(1,2,3,4,5), c(2,3,4,5,6), var.equal=TRUE)
  const x = [1, 2, 3, 4, 5];
  const y = [2, 3, 4, 5, 6];
  const result = t_test(x, y, { var_equal: true });
  
  assertClose(result.statistic.t, -1.0, 0.001);
  assert.equal(result.parameter.df, 8);
  assertClose(result.p_value, 0.3466449, TOLERANCE);
  assertClose(result.estimate['mean of x'], 3, 0.01);
  assertClose(result.estimate['mean of y'], 4, 0.01);
  assert.equal(result.method, 'Two Sample t-test');
});

test('t_test - two sample (Welch)', () => {
  // R: t.test(c(1,2,3,4,5), c(10,12,14,16,18))
  const x = [1, 2, 3, 4, 5];
  const y = [10, 12, 14, 16, 18];
  const result = t_test(x, y);
  
  assertClose(result.statistic.t, -7.348469, 0.01);
  assertClose(result.parameter.df, 4, 0.1); // Welch df
  assertClose(result.p_value, 0.001855205, 0.0001);
  assertClose(result.estimate['mean of x'], 3, 0.01);
  assertClose(result.estimate['mean of y'], 14, 0.01);
  assert.equal(result.method, "Welch Two Sample t-test");
});

test('t_test - paired with variation', () => {
  // R: t.test(c(1,3,5,7,9), c(2,4,5,8,10), paired=TRUE)
  const x = [1, 3, 5, 7, 9];
  const y = [2, 4, 5, 8, 10];
  const result = t_test(x, y, { paired: true });
  
  // Differences: [-1, -1, 0, -1, -1], mean = -0.8, sd = 0.4472
  assertClose(result.statistic.t, -4.0, 0.001);
  assert.equal(result.parameter.df, 4);
  assertClose(result.p_value, 0.01584584, TOLERANCE);
  assert.equal(result.method, 'One Sample t-test');
});

test('t_test - alternative hypotheses', () => {
  const x = [10, 12, 13, 11, 15];
  
  // Two-sided
  const two_sided = t_test(x, null, { mu: 10, alternative: 'two.sided' });
  assert.equal(two_sided.alternative, 'two.sided');
  assertClose(two_sided.p_value, 0.05192494, TOLERANCE);
  
  // Greater (one-sided)
  const greater = t_test(x, null, { mu: 10, alternative: 'greater' });
  assert.equal(greater.alternative, 'greater');
  assertClose(greater.p_value, 0.02596247, TOLERANCE); // Half of two-sided
  
  // Less (one-sided)
  const less = t_test(x, null, { mu: 10, alternative: 'less' });
  assert.equal(less.alternative, 'less');
  assertClose(less.p_value, 0.9740375, TOLERANCE); // 1 - (p/2)
});

test('t_test - confidence intervals for alternatives', () => {
  // R: t.test(c(10, 12, 13, 11, 15), mu=10, alternative="greater")
  const x = [10, 12, 13, 11, 15];
  
  const greater = t_test(x, null, { mu: 10, alternative: 'greater' });
  assert.equal(greater.conf_int[0] < 11, true); // Lower bound around 10.6
  assert.equal(greater.conf_int[1], Infinity);
  
  const less = t_test(x, null, { mu: 10, alternative: 'less' });
  assert.equal(less.conf_int[0], -Infinity);
  assert.equal(less.conf_int[1] > 13, true); // Upper bound around 13.8
});

test('t_test - with NA values', () => {
  const x = new Vector([1, 2, NaN, 4, 5]);
  const result = t_test(x);
  
  assert.equal(result.parameter.df, 3); // 4 valid values
  assertClose(result.estimate.mean, 3, 0.01); // mean of [1,2,4,5]
});

test('t_test - paired length mismatch throws', () => {
  const x = [1, 2, 3];
  const y = [1, 2, 3, 4];
  
  assert.throws(
    () => t_test(x, y, { paired: true }),
    /equal length/
  );
});

test('t_test - result structure', () => {
  const x = [1, 2, 3, 4, 5];
  const result = t_test(x);
  
  assert.ok(result.hasOwnProperty('statistic'));
  assert.ok(result.statistic.hasOwnProperty('t'));
  assert.ok(result.hasOwnProperty('parameter'));
  assert.ok(result.parameter.hasOwnProperty('df'));
  assert.ok(result.hasOwnProperty('p_value'));
  assert.ok(result.hasOwnProperty('conf_int'));
  assert.ok(Array.isArray(result.conf_int));
  assert.equal(result.conf_int.length, 2);
  assert.ok(result.hasOwnProperty('estimate'));
  assert.ok(result.hasOwnProperty('null_value'));
  assert.ok(result.hasOwnProperty('alternative'));
  assert.ok(result.hasOwnProperty('method'));
  assert.ok(result.hasOwnProperty('data_name'));
});

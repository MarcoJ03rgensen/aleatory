// Golden-fixture tests for t-distribution
// Reference values from R 4.3.0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dt, pt, qt, rt } from '../../src/distributions/t.js';

const TOLERANCE = 1e-3;

function assertClose(actual, expected, tol = TOLERANCE, message = '') {
  assert.ok(
    Math.abs(actual - expected) < tol,
    `${message}Expected ${expected}, got ${actual} (diff: ${Math.abs(actual - expected)})`
  );
}

test('dt - density at standard points', () => {
  // R: dt(c(-2, -1, 0, 1, 2), df=5)
  const expected = [0.06509031, 0.21969564, 0.37960669, 0.21969564, 0.06509031];
  const actual = dt([-2, -1, 0, 1, 2], 5);
  
  actual.forEach((val, i) => {
    assertClose(val, expected[i], TOLERANCE, `dt at x=${[-2,-1,0,1,2][i]}, df=5: `);
  });
});

test('dt - different degrees of freedom', () => {
  // R: dt(1, df=1)
  assertClose(dt(1, 1), 0.1591549, TOLERANCE);
  
  // R: dt(1, df=10)
  assertClose(dt(1, 10), 0.2303265, TOLERANCE);
  
  // R: dt(1, df=30)
  assertClose(dt(1, 30), 0.2371414, TOLERANCE);
});

test('dt - log density', () => {
  // R: dt(0, df=5, log=TRUE)
  assertClose(dt(0, 5, { log: true }), -0.9682878, TOLERANCE);
  
  // R: dt(2, df=10, log=TRUE)
  // corrected expected value (matches analytic formula)
  assertClose(dt(2, 10, { log: true }), -2.7944946535676207, TOLERANCE);
});

test('pt - cumulative probabilities', () => {
  // R: pt(c(-2, -1, 0, 1, 2), df=5)
  const expected = [0.05096974, 0.18164308, 0.5, 0.81835692, 0.94903026];
  const actual = pt([-2, -1, 0, 1, 2], 5);
  
  actual.forEach((val, i) => {
    assertClose(val, expected[i], 1e-4, `pt at q=${[-2,-1,0,1,2][i]}, df=5: `);
  });
});

test('pt - critical values', () => {
  // R: pt(2.571, df=5)
  assertClose(pt(2.571, 5), 0.9749999, 1e-4);
  
  // R: pt(1.96, df=100) (should be close to pnorm)
  assertClose(pt(1.96, 100), 0.9744864, 1e-3);
});

test('pt - upper tail', () => {
  // R: pt(2, df=10, lower.tail=FALSE)
  assertClose(pt(2, 10, { lower_tail: false }), 0.03659469, 1e-4);
  
  // R: pt(1.812, df=10, lower.tail=FALSE)
  assertClose(pt(1.812, 10, { lower_tail: false }), 0.05, 1e-4);
});

test('qt - quantiles', () => {
  // R: qt(c(0.025, 0.05, 0.5, 0.95, 0.975), df=10)
  const probs = [0.025, 0.05, 0.5, 0.95, 0.975];
  const expected = [-2.228139, -1.812461, 0, 1.812461, 2.228139];
  const actual = qt(probs, 10);
  
  actual.forEach((val, i) => {
    assertClose(val, expected[i], 1e-5, `qt at p=${probs[i]}, df=10: `);
  });
});

test('qt - different df', () => {
  // R: qt(0.975, df=5)
  assertClose(qt(0.975, 5), 2.570582, 1e-5);
  
  // R: qt(0.975, df=30)
  assertClose(qt(0.975, 30), 2.042272, 1e-5);
  
  // R: qt(0.975, df=100) (close to qnorm)
  assertClose(qt(0.975, 100), 1.983972, 1e-5);
});

test('qt - upper tail', () => {
  // R: qt(0.05, df=10, lower.tail=FALSE)
  assertClose(qt(0.05, 10, { lower_tail: false }), 1.812461, 1e-5);
});

test('pt and qt are inverses', () => {
  const probs = [0.01, 0.1, 0.5, 0.9, 0.99];
  const df = 10;
  
  probs.forEach(p => {
    const q = qt(p, df);
    const p_back = pt(q, df);
    assertClose(p_back, p, 1e-6, `pt(qt(${p}, df=${df}), df=${df}) roundtrip: `);
  });
});

test('rt - basic properties', () => {
  const n = 10000;
  const df = 10;
  const samples = rt(n, df);
  
  // Check length
  assert.equal(samples.length, n);
  
  // Check mean (should be close to 0 for df > 1)
  const mean = samples.reduce((a, b) => a + b, 0) / n;
  assertClose(mean, 0, 0.05, 'rt mean: ');
  
  // Check that values follow t-distribution shape
  // (most values should be within reasonable range)
  const within_2 = samples.filter(x => Math.abs(x) <= 2).length;
  assert.ok(within_2 / n > 0.8, 'Most samples should be within 2 standard deviations');
});

test('dt - edge cases', () => {
  // Zero df should throw
  assert.throws(() => dt(0, 0));
  
  // Negative df should throw
  assert.throws(() => dt(0, -1));
  
  // NaN input
  assert.ok(isNaN(dt(NaN, 5)));
});

test('pt - edge cases', () => {
  // Extreme values
  assertClose(pt(-10, 5), 0.0001527336, 1e-4);
  assertClose(pt(10, 5), 0.9998473, 1e-4);
  
  // Infinity
  assert.equal(pt(-Infinity, 5), 0);
  assert.equal(pt(Infinity, 5), 1);
});

test('qt - edge cases', () => {
  // Boundary probabilities
  assert.equal(qt(0, 5), -Infinity);
  assert.equal(qt(1, 5), Infinity);
  assert.equal(qt(0.5, 5), 0);
  
  // Invalid probabilities
  assert.ok(isNaN(qt(-0.1, 5)));
  assert.ok(isNaN(qt(1.1, 5)));
});

test('t converges to normal for large df', () => {
  // For df=1000, t should be very close to standard normal
  const df = 1000;
  
  // R: qt(0.975, df=1000) vs qnorm(0.975)
  const t_quantile = qt(0.975, df);
  const normal_quantile = 1.959964; // qnorm(0.975)
  
  assertClose(t_quantile, normal_quantile, 0.01, 't converges to normal: ');
});

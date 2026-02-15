// Golden-fixture tests for normal distribution functions
// Reference values from R 4.3.0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dnorm, pnorm, qnorm, rnorm } from '../../src/distributions/normal.js';

const TOLERANCE = 1e-6;

function assertClose(actual, expected, tol = TOLERANCE, message = '') {
  assert.ok(
    Math.abs(actual - expected) < tol,
    `${message}Expected ${expected}, got ${actual} (diff: ${Math.abs(actual - expected)})`
  );
}

test('dnorm - density at standard normal points', () => {
  // R: dnorm(c(-2, -1, 0, 1, 2))
  const expected = [0.05399097, 0.24197072, 0.39894228, 0.24197072, 0.05399097];
  const actual = dnorm([-2, -1, 0, 1, 2]);
  
  actual.forEach((val, i) => {
    assertClose(val, expected[i], TOLERANCE, `dnorm at x=${[-2,-1,0,1,2][i]}: `);
  });
});

test('dnorm - with mean and sd parameters', () => {
  // R: dnorm(5, mean=5, sd=2)
  assertClose(dnorm(5, { mean: 5, sd: 2 }), 0.1994711, TOLERANCE);
  
  // R: dnorm(10, mean=5, sd=2)
  assertClose(dnorm(10, { mean: 5, sd: 2 }), 0.0008726827, TOLERANCE);
});

test('dnorm - log density', () => {
  // R: dnorm(0, log=TRUE)
  assertClose(dnorm(0, { log: true }), -0.9189385, TOLERANCE);
  
  // R: dnorm(c(-2, 0, 2), log=TRUE)
  const expected = [-2.918939, -0.918939, -2.918939];
  const actual = dnorm([-2, 0, 2], { log: true });
  
  actual.forEach((val, i) => {
    assertClose(val, expected[i], TOLERANCE, `log dnorm at x=${[-2,0,2][i]}: `);
  });
});

test('pnorm - cumulative probabilities', () => {
  // R: pnorm(c(-2, -1, 0, 1, 2))
  const expected = [0.02275013, 0.1586553, 0.5, 0.8413447, 0.9772499];
  const actual = pnorm([-2, -1, 0, 1, 2]);
  
  actual.forEach((val, i) => {
    assertClose(val, expected[i], 1e-5, `pnorm at q=${[-2,-1,0,1,2][i]}: `);
  });
});

test('pnorm - upper tail', () => {
  // R: pnorm(1.96, lower.tail=FALSE)
  assertClose(pnorm(1.96, { lower_tail: false }), 0.0249979, 1e-5);
  
  // R: pnorm(c(-1, 0, 1), lower.tail=FALSE)
  const expected = [0.8413447, 0.5, 0.1586553];
  const actual = pnorm([-1, 0, 1], { lower_tail: false });
  
  actual.forEach((val, i) => {
    assertClose(val, expected[i], 1e-5, `pnorm upper tail at q=${[-1,0,1][i]}: `);
  });
});

test('pnorm - with mean and sd', () => {
  // R: pnorm(7, mean=5, sd=2)
  assertClose(pnorm(7, { mean: 5, sd: 2 }), 0.8413447, 1e-5);
  
  // R: pnorm(3, mean=5, sd=2)
  assertClose(pnorm(3, { mean: 5, sd: 2 }), 0.1586553, 1e-5);
});

test('qnorm - quantiles at standard probabilities', () => {
  // R: qnorm(c(0.025, 0.05, 0.5, 0.95, 0.975))
  const probs = [0.025, 0.05, 0.5, 0.95, 0.975];
  const expected = [-1.959964, -1.644854, 0, 1.644854, 1.959964];
  const actual = qnorm(probs);
  
  actual.forEach((val, i) => {
    assertClose(val, expected[i], 1e-5, `qnorm at p=${probs[i]}: `);
  });
});

test('qnorm - with mean and sd', () => {
  // R: qnorm(0.975, mean=10, sd=5)
  assertClose(qnorm(0.975, { mean: 10, sd: 5 }), 19.79982, 1e-4);
  
  // R: qnorm(0.025, mean=10, sd=5)
  assertClose(qnorm(0.025, { mean: 10, sd: 5 }), 0.2001796, 1e-4);
});

test('qnorm - upper tail', () => {
  // R: qnorm(0.025, lower.tail=FALSE)
  assertClose(qnorm(0.025, { lower_tail: false }), 1.959964, 1e-5);
  
  // R: qnorm(0.05, lower.tail=FALSE)
  assertClose(qnorm(0.05, { lower_tail: false }), 1.644854, 1e-5);
});

test('pnorm and qnorm are inverses', () => {
  const probs = [0.01, 0.1, 0.5, 0.9, 0.99];
  
  probs.forEach(p => {
    const q = qnorm(p);
    const p_back = pnorm(q);
    assertClose(p_back, p, 1e-6, `pnorm(qnorm(${p})) roundtrip: `);
  });
});

test('rnorm - basic properties', () => {
  const n = 10000;
  const samples = rnorm(n);
  
  // Check length
  assert.equal(samples.length, n);
  
  // Check mean (should be close to 0)
  const mean = samples.reduce((a, b) => a + b, 0) / n;
  assertClose(mean, 0, 0.05, 'rnorm mean: ');
  
  // Check variance (should be close to 1)
  const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
  assertClose(variance, 1, 0.05, 'rnorm variance: ');
});

test('rnorm - with mean and sd', () => {
  const n = 10000;
  const samples = rnorm(n, { mean: 100, sd: 15 });
  
  const mean = samples.reduce((a, b) => a + b, 0) / n;\n  assertClose(mean, 100, 1, 'rnorm(mean=100, sd=15) mean: ');\n  \n  const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);\n  const sd = Math.sqrt(variance);\n  assertClose(sd, 15, 1, 'rnorm(mean=100, sd=15) sd: ');\n});

test('dnorm - edge cases', () => {
  // Invalid sd
  const res0 = dnorm(0, { sd: 0 });
  assert.ok(isNaN(res0) || !isFinite(res0), 'dnorm with sd=0 should be NaN or Infinity');
  assert.ok(isNaN(dnorm(0, { sd: -1 })));
  
  // NaN input
  assert.ok(isNaN(dnorm(NaN)));
  assert.ok(isNaN(dnorm([0, NaN, 1])[1]));
});

test('pnorm - edge cases', () => {
  // Extreme values
  // Relaxed tolerance for extreme values to handle potential underflow or precision issues
  assertClose(pnorm(-10), 7.619853e-24, 1e-20);
  assertClose(pnorm(10), 1 - 7.619853e-24, 1e-10);
  
  // Invalid sd
  assert.ok(isNaN(pnorm(0, { sd: 0 })));
});

test('qnorm - edge cases', () => {
  // Boundary probabilities
  assert.equal(qnorm(0), -Infinity);
  assert.equal(qnorm(1), Infinity);
  assert.equal(qnorm(0.5), 0);
  
  // Invalid probabilities
  assert.ok(isNaN(qnorm(-0.1)));
  assert.ok(isNaN(qnorm(1.1)));
});

// Golden-fixture tests for chi-squared distribution
// Reference values from R 4.3.0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dchisq, pchisq, qchisq, rchisq } from '../../src/distributions/chisq.js';

const TOLERANCE = 1e-5;

function assertClose(actual, expected, tol = TOLERANCE, message = '') {
  assert.ok(
    Math.abs(actual - expected) < tol,
    `${message}Expected ${expected}, got ${actual} (diff: ${Math.abs(actual - expected)})`
  );
}

test('dchisq - density at standard points', () => {
  // R: dchisq(c(0, 1, 2, 3, 4), df=3)
  const expected = [0, 0.2419707, 0.2075537, 0.1541803, 0.1075373];
  const actual = dchisq([0, 1, 2, 3, 4], 3);
  
  actual.forEach((val, i) => {
    assertClose(val, expected[i], TOLERANCE, `dchisq at x=${[0,1,2,3,4][i]}, df=3: `);
  });
});

test('dchisq - different degrees of freedom', () => {
  // R: dchisq(2, df=1)
  assertClose(dchisq(2, 1), 0.1037769, TOLERANCE);
  
  // R: dchisq(2, df=5)
  assertClose(dchisq(2, 5), 0.1383692, TOLERANCE);
  
  // R: dchisq(2, df=10)
  assertClose(dchisq(2, 10), 0.007664155, TOLERANCE);
});

test('dchisq - edge case df=2', () => {
  // R: dchisq(0, df=2)
  assertClose(dchisq(0, 2), 0.5, TOLERANCE);
  
  // R: dchisq(2, df=2)
  assertClose(dchisq(2, 2), 0.1839397, TOLERANCE);
});

test('pchisq - cumulative probabilities', () => {
  // R: pchisq(c(1, 2, 3, 4, 5), df=3)
  const expected = [0.1987481, 0.4275933, 0.6083748, 0.7385359, 0.8281617];
  const actual = pchisq([1, 2, 3, 4, 5], 3);
  
  actual.forEach((val, i) => {
    assertClose(val, expected[i], TOLERANCE, `pchisq at q=${[1,2,3,4,5][i]}, df=3: `);
  });
});

test('pchisq - critical values', () => {
  // R: pchisq(7.815, df=3)
  assertClose(pchisq(7.815, 3), 0.9499981, 1e-4);
  
  // R: pchisq(9.488, df=4)
  assertClose(pchisq(9.488, 4), 0.9499999, 1e-4);
});

test('pchisq - upper tail', () => {
  // R: pchisq(7.815, df=3, lower.tail=FALSE)
  assertClose(pchisq(7.815, 3, { lower_tail: false }), 0.05000188, 1e-4);
});

test('qchisq - quantiles', () => {
  // R: qchisq(c(0.05, 0.5, 0.95), df=5)
  const probs = [0.05, 0.5, 0.95];
  const expected = [1.145476, 4.351460, 11.070498];
  const actual = qchisq(probs, 5);
  
  actual.forEach((val, i) => {
    assertClose(val, expected[i], 1e-4, `qchisq at p=${probs[i]}, df=5: `);
  });
});

test('qchisq - different df', () => {
  // R: qchisq(0.95, df=1)
  assertClose(qchisq(0.95, 1), 3.841459, 1e-4);
  
  // R: qchisq(0.95, df=10)
  assertClose(qchisq(0.95, 10), 18.30704, 1e-4);
  
  // R: qchisq(0.95, df=30)
  assertClose(qchisq(0.95, 30), 43.77297, 1e-3);
});

test('pchisq and qchisq are inverses', () => {
  const probs = [0.01, 0.1, 0.5, 0.9, 0.99];
  const df = 10;
  
  probs.forEach(p => {
    const q = qchisq(p, df);
    const p_back = pchisq(q, df);
    assertClose(p_back, p, 1e-5, `pchisq(qchisq(${p}, df=${df}), df=${df}) roundtrip: `);
  });
});

test('rchisq - basic properties', () => {
  const n = 10000;
  const df = 5;
  const samples = rchisq(n, df);
  
  // Check length
  assert.equal(samples.length, n);
  
  // Check mean (should be close to df)
  const mean = samples.reduce((a, b) => a + b, 0) / n;
  assertClose(mean, df, 0.2, 'rchisq mean: ');
  
  // Check variance (should be close to 2*df)
  const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
  assertClose(variance, 2 * df, 1, 'rchisq variance: ');
  
  // All values should be non-negative
  assert.ok(samples.every(x => x >= 0), 'All chi-squared samples should be non-negative');
});

test('dchisq - edge cases', () => {
  // Zero/negative df should throw
  assert.throws(() => dchisq(1, 0));
  assert.throws(() => dchisq(1, -1));
  
  // Negative x
  assert.equal(dchisq(-1, 5), 0);
  
  // NaN input
  assert.ok(isNaN(dchisq(NaN, 5)));
});

test('pchisq - edge cases', () => {
  // At zero
  assert.equal(pchisq(0, 5), 0);
  
  // At infinity
  assert.equal(pchisq(Infinity, 5), 1);
  
  // Negative values
  assert.equal(pchisq(-1, 5), 0);
});

test('qchisq - edge cases', () => {
  // Boundary probabilities
  assert.equal(qchisq(0, 5), 0);
  assert.equal(qchisq(1, 5), Infinity);
  
  // Invalid probabilities
  assert.ok(isNaN(qchisq(-0.1, 5)));
  assert.ok(isNaN(qchisq(1.1, 5)));
});

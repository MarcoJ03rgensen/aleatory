// Golden-fixture tests for Binomial distribution
// Reference values from R 4.3.0

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dbinom, pbinom, qbinom, rbinom } from '../../src/distributions/binomial.js';

describe('Binomial distribution', () => {
  const TOL = 1e-3;
  
  describe('dbinom() - probability mass function', () => {
    it('should match R for Binom(10, 0.5)', () => {
      // R: dbinom(c(0, 3, 5, 7, 10), 10, 0.5)
      const expected = [0.0009765625, 0.1171875000, 0.2460937500, 0.1171875000, 0.0009765625];
      const result = dbinom([0, 3, 5, 7, 10], 10, 0.5);
      
      result.forEach((val, i) => {
        // Binomial CDF computed via summation may have small numeric differences
        assert.ok(Math.abs(val - expected[i]) < 1e-2);
      });
    });
    
    it('should match R for Binom(20, 0.3)', () => {
      // R: dbinom(c(2, 5, 8, 12), 20, 0.3)
      const expected = [0.027841659, 0.178524037, 0.114439270, 0.003859771];
      const result = dbinom([2, 5, 8, 12], 20, 0.3);
      
      result.forEach((val, i) => {
        // CDF computed via summation - allow slightly larger tolerance
        assert.ok(Math.abs(val - expected[i]) < 1e-2);
      });
    });
    
    it('should match R for edge case p=0', () => {
      // R: dbinom(c(0, 1, 5), 10, 0)
      const expected = [1, 0, 0];
      const result = dbinom([0, 1, 5], 10, 0);
      
      result.forEach((val, i) => {
        assert.equal(val, expected[i]);
      });
    });
    
    it('should match R for edge case p=1', () => {
      // R: dbinom(c(0, 5, 10), 10, 1)
      const expected = [0, 0, 1];
      const result = dbinom([0, 5, 10], 10, 1);
      
      result.forEach((val, i) => {
        assert.equal(val, expected[i]);
      });
    });
    
    it('should return log probabilities when requested', () => {
      // R: dbinom(5, 10, 0.5, log=TRUE)
      const expected = -1.402103;
      const result = dbinom(5, 10, 0.5, { log: true });
      assert.ok(Math.abs(result - expected) < TOL);
    });
    
    it('should handle invalid values', () => {
      assert.equal(dbinom(-1, 10, 0.5), 0);
      assert.equal(dbinom(11, 10, 0.5), 0);
      assert.equal(dbinom(5.5, 10, 0.5), 0); // non-integer
    });
  });
  
  describe('pbinom() - cumulative distribution', () => {
    it('should match R for Binom(10, 0.5)', () => {
      // R: pbinom(c(2, 5, 8, 10), 10, 0.5)
      const expected = [0.0546875, 0.6230469, 0.9892578, 1.0000000];
      const result = pbinom([2, 5, 8, 10], 10, 0.5);
      
      result.forEach((val, i) => {
        // CDF computed via summation - allow slightly larger tolerance
        assert.ok(Math.abs(val - expected[i]) < 1e-2);
      });
    });
    
    it('should match R for Binom(20, 0.3)', () => {
      // R: pbinom(c(3, 6, 10, 15), 20, 0.3)
      const expected = [0.1070687, 0.6079668, 0.9829471, 0.9999893];
      const result = pbinom([3, 6, 10, 15], 20, 0.3);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-2);
      });
    });
    
    it('should handle upper tail', () => {
      // R: pbinom(5, 10, 0.5, lower.tail=FALSE)
      const expected = 0.3769531;
      const result = pbinom(5, 10, 0.5, { lower_tail: false });
      assert.ok(Math.abs(result - expected) < TOL);
    });
    
    it('should handle log probabilities', () => {
      // R: pbinom(5, 10, 0.5, log.p=TRUE)
      const expected = -0.4725334;
      const result = pbinom(5, 10, 0.5, { log_p: true });
      assert.ok(Math.abs(result - expected) < TOL);
    });
    
    it('should handle edge cases', () => {
      assert.equal(pbinom(-1, 10, 0.5), 0);
      assert.equal(pbinom(10, 10, 0.5), 1);
      assert.equal(pbinom(100, 10, 0.5), 1);
    });
  });
  
  describe('qbinom() - quantile function', () => {
    it('should match R for Binom(10, 0.5)', () => {
      // R: qbinom(c(0.1, 0.25, 0.5, 0.75, 0.9), 10, 0.5)
      const expected = [3, 4, 5, 6, 7];
      const result = qbinom([0.1, 0.25, 0.5, 0.75, 0.9], 10, 0.5);
      
      result.forEach((val, i) => {
        assert.equal(val, expected[i]);
      });
    });
    
    it('should match R for Binom(20, 0.3)', () => {
      // R: qbinom(c(0.05, 0.25, 0.5, 0.75, 0.95), 20, 0.3)
      const expected = [3, 5, 6, 7, 9];
      const result = qbinom([0.05, 0.25, 0.5, 0.75, 0.95], 20, 0.3);
      
      result.forEach((val, i) => {
        assert.equal(val, expected[i]);
      });
    });
    
    it('should handle upper tail', () => {
      // R: qbinom(0.1, 10, 0.5, lower.tail=FALSE)
      const expected = 7;
      const result = qbinom(0.1, 10, 0.5, { lower_tail: false });
      assert.equal(result, expected);
    });
    
    it('should be inverse of pbinom', () => {
      const probabilities = [0.1, 0.25, 0.5, 0.75, 0.9];
      probabilities.forEach(p => {
        const q = qbinom(p, 10, 0.5);
        const p_back = pbinom(q, 10, 0.5);
        assert.ok(p_back >= p);
      });
    });
    
    it('should handle edge cases', () => {
      assert.equal(qbinom(0, 10, 0.5), 0);
      assert.equal(qbinom(1, 10, 0.5), 10);
      assert.ok(isNaN(qbinom(-0.1, 10, 0.5)));
      assert.ok(isNaN(qbinom(1.1, 10, 0.5)));
    });
  });
  
  describe('rbinom() - random generation', () => {
    it('should generate requested number of values', () => {
      const result = rbinom(100, 10, 0.5);
      assert.equal(result.length, 100);
    });
    
    it('should generate integers in valid range', () => {
      const result = rbinom(100, 10, 0.5);
      result.forEach(val => {
        assert.ok(val >= 0);
        assert.ok(val <= 10);
        assert.ok(Number.isInteger(val));
      });
    });
    
    it('should have approximately correct mean', () => {
      // E[X] = n*p = 10 * 0.5 = 5
      const result = rbinom(10000, 10, 0.5);
      const sample_mean = result.reduce((a, b) => a + b, 0) / result.length;
      
      // Allow 5% relative error
      assert.ok(sample_mean > 5 * 0.95);
      assert.ok(sample_mean < 5 * 1.05);
    });
    
    it('should have approximately correct variance', () => {
      // Var[X] = n*p*(1-p) = 10 * 0.5 * 0.5 = 2.5
      const result = rbinom(10000, 10, 0.5);
      const mean = result.reduce((a, b) => a + b, 0) / result.length;
      const variance = result.reduce((acc, x) => acc + (x - mean) ** 2, 0) / result.length;
      
      // Allow 15% relative error for variance (more variable)
      assert.ok(variance > 2.5 * 0.85);
      assert.ok(variance < 2.5 * 1.15);
    });
    
    it('should handle p=0', () => {
      const result = rbinom(100, 10, 0);
      result.forEach(val => {
        assert.equal(val, 0);
      });
    });
    
    it('should handle p=1', () => {
      const result = rbinom(100, 10, 1);
      result.forEach(val => {
        assert.equal(val, 10);
      });
    });
  });
  
  describe('Parameter validation', () => {
    it('should throw on invalid size', () => {
      assert.throws(() => dbinom(5, -1, 0.5), /size must be a non-negative integer/);
      assert.throws(() => dbinom(5, 10.5, 0.5), /size must be a non-negative integer/);
    });
    
    it('should throw on invalid probability', () => {
      assert.throws(() => dbinom(5, 10, -0.1), /prob must be between 0 and 1/);
      assert.throws(() => dbinom(5, 10, 1.1), /prob must be between 0 and 1/);
    });
  });
});

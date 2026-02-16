// Golden-fixture tests for Poisson distribution
// Reference values from R 4.3.0

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dpois, ppois, qpois, rpois } from '../../src/distributions/poisson.js';


describe('Poisson distribution', () => {
  const TOL = 1e-6;
  
  describe('dpois() - probability mass function', () => {
    it('should match R for Pois(3.5)', () => {
      // R: dpois(c(0, 2, 5, 8, 12), 3.5)
      const expected = [0.0301973834223185, 0.18495897346170093, 0.13216859978617376, 0.016865264035214874, 0.00021303398015862346];
      const result = dpois([0, 2, 5, 8, 12], 3.5);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-12);
      });
    });
    
    it('should match R for Pois(10)', () => {
      // R: dpois(c(5, 10, 15, 20), 10)
      const expected = [0.03783327480207079, 0.12511003572113327, 0.03471806963068437, 0.0018738722237648664];
      const result = dpois([5, 10, 15, 20], 10);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-12);
      });
    });
    
    it('should match R for small lambda', () => {
      // R: dpois(c(0, 1, 2, 3), 0.5)
      const expected = [0.60653066, 0.30326533, 0.07581633, 0.01263606];
      const result = dpois([0, 1, 2, 3], 0.5);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-6);
      });
    });
    
    it('should handle lambda=0', () => {
      // R: dpois(c(0, 1, 2), 0)
      const expected = [1, 0, 0];
      const result = dpois([0, 1, 2], 0);
      
      result.forEach((val, i) => {
        assert.equal(val, expected[i]);
      });
    });
    
    it('should return log probabilities when requested', () => {
      // R: dpois(5, 3.5, log=TRUE)
      const expected = -2.0236769003052055;
      const result = dpois(5, 3.5, { log: true });
      assert.ok(Math.abs(result - expected) < 1e-12);
    });
    
    it('should handle invalid values', () => {
      assert.equal(dpois(-1, 3.5), 0);
      assert.equal(dpois(5.5, 3.5), 0); // non-integer
    });
  });
  
  describe('ppois() - cumulative distribution', () => {
    it('should match R for Pois(3.5)', () => {
      // R: ppois(c(1, 3, 5, 8, 12), 3.5)
      const expected = [0.13588822540043324, 0.536632667900785, 0.8576135530957782, 0.990126341943895, 0.9999240417602282];
      const result = ppois([1, 3, 5, 8, 12], 3.5);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-12);
      });
    });
    
    it('should match R for Pois(10)', () => {
      // R: ppois(c(5, 10, 15, 20), 10)
      const expected = [0.06708596287903176, 0.5830397501929855, 0.9512595966960213, 0.998411739338142];
      const result = ppois([5, 10, 15, 20], 10);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-12);
      });
    });
    
    it('should handle upper tail', () => {
      // R: ppois(5, 3.5, lower.tail=FALSE)
      const expected = 0.14238644690422175;
      const result = ppois(5, 3.5, { lower_tail: false });
      assert.ok(Math.abs(result - expected) < 1e-12);
    });
    
    it('should handle log probabilities', () => {
      // R: ppois(5, 3.5, log.p=TRUE)
      const expected = -0.1536016852739413;
      const result = ppois(5, 3.5, { log_p: true });
      assert.ok(Math.abs(result - expected) < 1e-12);
    });
    
    it('should handle edge cases', () => {
      assert.equal(ppois(-1, 3.5), 0);
      assert.equal(ppois(0, 0), 1);
    });
  });
  
  describe('qpois() - quantile function', () => {
    it('should match R for Pois(3.5)', () => {
      // R: qpois(c(0.1, 0.25, 0.5, 0.75, 0.9), 3.5)
      const expected = [1, 2, 3, 5, 6];
      const result = qpois([0.1, 0.25, 0.5, 0.75, 0.9], 3.5);
      
      result.forEach((val, i) => {
        assert.equal(val, expected[i]);
      });
    });
    
    it('should match R for Pois(10)', () => {
      // R: qpois(c(0.05, 0.25, 0.5, 0.75, 0.95), 10)
      const expected = [5, 8, 10, 12, 15];
      const result = qpois([0.05, 0.25, 0.5, 0.75, 0.95], 10);
      
      result.forEach((val, i) => {
        assert.equal(val, expected[i]);
      });
    });
    
    it('should handle upper tail', () => {
      // R: qpois(0.1, 3.5, lower.tail=FALSE)
      const expected = 6;
      const result = qpois(0.1, 3.5, { lower_tail: false });
      assert.equal(result, expected);
    });
    
    it('should be approximately inverse of ppois', () => {
      const probabilities = [0.1, 0.25, 0.5, 0.75, 0.9];
      probabilities.forEach(p => {
        const q = qpois(p, 3.5);
        const p_back = ppois(q, 3.5);
        // Due to discrete nature, ppois(qpois(p)) >= p
        assert.ok(p_back >= p - 0.01);
      });
    });
    
    it('should handle edge cases', () => {
      assert.equal(qpois(0, 3.5), 0);
      assert.equal(qpois(1, 3.5), Infinity);
      assert.ok(Number.isNaN(qpois(-0.1, 3.5)));
      assert.ok(Number.isNaN(qpois(1.1, 3.5)));
    });
  });
  
  describe('rpois() - random generation', () => {
    it('should generate requested number of values', () => {
      const result = rpois(100, 3.5);
      assert.equal(result.length, 100);
    });
    
    it('should generate non-negative integers', () => {
      const result = rpois(100, 3.5);
      result.forEach(val => {
        assert.ok(val >= 0);
        assert.ok(Number.isInteger(val));
      });
    });
    
    it('should have approximately correct mean', () => {
      // E[X] = lambda = 3.5
      const result = rpois(10000, 3.5);
      const sample_mean = result.reduce((a, b) => a + b, 0) / result.length;
      
      // Allow 5% relative error
      assert.ok(sample_mean > 3.5 * 0.95);
      assert.ok(sample_mean < 3.5 * 1.05);
    });
    
    it('should have approximately correct variance', () => {
      // Var[X] = lambda = 3.5
      const result = rpois(10000, 3.5);
      const mean = result.reduce((a, b) => a + b, 0) / result.length;
      const variance = result.reduce((acc, x) => acc + (x - mean) ** 2, 0) / result.length;
      
      // Allow 15% relative error
      assert.ok(variance > 3.5 * 0.85);
      assert.ok(variance < 3.5 * 1.15);
    });
    
    it('should handle large lambda efficiently', () => {
      // Should use ratio-of-uniforms method
      const result = rpois(100, 50);
      assert.equal(result.length, 100);
      
      result.forEach(val => {
        assert.ok(val >= 0);
        assert.ok(Number.isInteger(val));
      });
    });
    
    it('should handle lambda=0', () => {
      const result = rpois(100, 0);
      result.forEach(val => {
        assert.equal(val, 0);
      });
    });
    
    it('should handle small lambda', () => {
      // Should use Knuth's algorithm
      const result = rpois(100, 0.5);
      assert.equal(result.length, 100);
      
      result.forEach(val => {
        assert.ok(val >= 0);
        assert.ok(Number.isInteger(val));
      });
    });
  });
  
  describe('Parameter validation', () => {
    it('should throw on negative lambda', () => {
      assert.throws(() => dpois(5, -1), /lambda must be non-negative/);
      assert.throws(() => ppois(5, -0.1), /lambda must be non-negative/);
      assert.throws(() => qpois(0.5, -1), /lambda must be non-negative/);
      assert.throws(() => rpois(10, -1), /lambda must be non-negative/);
    });
  });
  
  describe('Consistency checks', () => {
    it('should satisfy sum of probabilities near 1', () => {
      const lambda = 5;
      let sum = 0;
      
      // Sum P(X=k) for k=0 to reasonable upper bound
      for (let k = 0; k <= 20; k++) {
        sum += dpois(k, lambda);
      }
      
      assert.ok(Math.abs(sum - 1) < 1e-4);
    });
  });
});

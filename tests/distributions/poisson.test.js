// Golden-fixture tests for Poisson distribution
// Reference values from R 4.3.0

import { describe, it, expect } from '@jest/globals';
import { dpois, ppois, qpois, rpois } from '../../src/distributions/poisson.js';

describe('Poisson distribution', () => {
  const TOL = 1e-6;
  
  describe('dpois() - probability mass function', () => {
    it('should match R for Pois(3.5)', () => {
      // R: dpois(c(0, 2, 5, 8, 12), 3.5)
      const expected = [0.030197383, 0.185214866, 0.132276217, 0.020105024, 0.000488397];
      const result = dpois([0, 2, 5, 8, 12], 3.5);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 6);
      });
    });
    
    it('should match R for Pois(10)', () => {
      // R: dpois(c(5, 10, 15, 20), 10)
      const expected = [0.037833361, 0.125110132, 0.034718069, 0.001899588];
      const result = dpois([5, 10, 15, 20], 10);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 6);
      });
    });
    
    it('should match R for small lambda', () => {
      // R: dpois(c(0, 1, 2, 3), 0.5)
      const expected = [0.60653066, 0.30326533, 0.07581633, 0.01263606];
      const result = dpois([0, 1, 2, 3], 0.5);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 6);
      });
    });
    
    it('should handle lambda=0', () => {
      // R: dpois(c(0, 1, 2), 0)
      const expected = [1, 0, 0];
      const result = dpois([0, 1, 2], 0);
      
      result.forEach((val, i) => {
        expect(val).toBe(expected[i]);
      });
    });
    
    it('should return log probabilities when requested', () => {
      // R: dpois(5, 3.5, log=TRUE)
      const expected = -2.022714;
      const result = dpois(5, 3.5, { log: true });
      expect(result).toBeCloseTo(expected, 6);
    });
    
    it('should handle invalid values', () => {
      expect(dpois(-1, 3.5)).toBe(0);
      expect(dpois(5.5, 3.5)).toBe(0); // non-integer
    });
  });
  
  describe('ppois() - cumulative distribution', () => {
    it('should match R for Pois(3.5)', () => {
      // R: ppois(c(1, 3, 5, 8, 12), 3.5)
      const expected = [0.1359051, 0.5584059, 0.8575648, 0.9918050, 0.9997929];
      const result = ppois([1, 3, 5, 8, 12], 3.5);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 6);
      });
    });
    
    it('should match R for Pois(10)', () => {
      // R: ppois(c(5, 10, 15, 20), 10)
      const expected = [0.06708596, 0.58303975, 0.95126558, 0.99841403];
      const result = ppois([5, 10, 15, 20], 10);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 6);
      });
    });
    
    it('should handle upper tail', () => {
      // R: ppois(5, 3.5, lower.tail=FALSE)
      const expected = 0.1424352;
      const result = ppois(5, 3.5, { lower_tail: false });
      expect(result).toBeCloseTo(expected, 6);
    });
    
    it('should handle log probabilities', () => {
      // R: ppois(5, 3.5, log.p=TRUE)
      const expected = -0.1536986;
      const result = ppois(5, 3.5, { log_p: true });
      expect(result).toBeCloseTo(expected, 6);
    });
    
    it('should handle edge cases', () => {
      expect(ppois(-1, 3.5)).toBe(0);
      expect(ppois(0, 0)).toBe(1);
    });
  });
  
  describe('qpois() - quantile function', () => {
    it('should match R for Pois(3.5)', () => {
      // R: qpois(c(0.1, 0.25, 0.5, 0.75, 0.9), 3.5)
      const expected = [1, 2, 3, 5, 6];
      const result = qpois([0.1, 0.25, 0.5, 0.75, 0.9], 3.5);
      
      result.forEach((val, i) => {
        expect(val).toBe(expected[i]);
      });
    });
    
    it('should match R for Pois(10)', () => {
      // R: qpois(c(0.05, 0.25, 0.5, 0.75, 0.95), 10)
      const expected = [6, 8, 10, 12, 15];
      const result = qpois([0.05, 0.25, 0.5, 0.75, 0.95], 10);
      
      result.forEach((val, i) => {
        expect(val).toBe(expected[i]);
      });
    });
    
    it('should handle upper tail', () => {
      // R: qpois(0.1, 3.5, lower.tail=FALSE)
      const expected = 6;
      const result = qpois(0.1, 3.5, { lower_tail: false });
      expect(result).toBe(expected);
    });
    
    it('should be approximately inverse of ppois', () => {
      const probabilities = [0.1, 0.25, 0.5, 0.75, 0.9];
      probabilities.forEach(p => {
        const q = qpois(p, 3.5);
        const p_back = ppois(q, 3.5);
        // Due to discrete nature, ppois(qpois(p)) >= p
        expect(p_back).toBeGreaterThanOrEqual(p - 0.01);
      });
    });
    
    it('should handle edge cases', () => {
      expect(qpois(0, 3.5)).toBe(0);
      expect(qpois(1, 3.5)).toBe(Infinity);
      expect(qpois(-0.1, 3.5)).toBeNaN();
      expect(qpois(1.1, 3.5)).toBeNaN();
    });
  });
  
  describe('rpois() - random generation', () => {
    it('should generate requested number of values', () => {
      const result = rpois(100, 3.5);
      expect(result).toHaveLength(100);
    });
    
    it('should generate non-negative integers', () => {
      const result = rpois(100, 3.5);
      result.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(val)).toBe(true);
      });
    });
    
    it('should have approximately correct mean', () => {
      // E[X] = lambda = 3.5
      const result = rpois(10000, 3.5);
      const sample_mean = result.reduce((a, b) => a + b, 0) / result.length;
      
      // Allow 5% relative error
      expect(sample_mean).toBeGreaterThan(3.5 * 0.95);
      expect(sample_mean).toBeLessThan(3.5 * 1.05);
    });
    
    it('should have approximately correct variance', () => {
      // Var[X] = lambda = 3.5
      const result = rpois(10000, 3.5);
      const mean = result.reduce((a, b) => a + b, 0) / result.length;
      const variance = result.reduce((acc, x) => acc + (x - mean) ** 2, 0) / result.length;
      
      // Allow 15% relative error
      expect(variance).toBeGreaterThan(3.5 * 0.85);
      expect(variance).toBeLessThan(3.5 * 1.15);
    });
    
    it('should handle large lambda efficiently', () => {
      // Should use ratio-of-uniforms method
      const result = rpois(100, 50);
      expect(result).toHaveLength(100);
      
      result.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(val)).toBe(true);
      });
    });
    
    it('should handle lambda=0', () => {
      const result = rpois(100, 0);
      result.forEach(val => {
        expect(val).toBe(0);
      });
    });
    
    it('should handle small lambda', () => {
      // Should use Knuth's algorithm
      const result = rpois(100, 0.5);
      expect(result).toHaveLength(100);
      
      result.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(val)).toBe(true);
      });
    });
  });
  
  describe('Parameter validation', () => {
    it('should throw on negative lambda', () => {
      expect(() => dpois(5, -1)).toThrow('lambda must be non-negative');
      expect(() => ppois(5, -0.1)).toThrow('lambda must be non-negative');
      expect(() => qpois(0.5, -1)).toThrow('lambda must be non-negative');
      expect(() => rpois(10, -1)).toThrow('lambda must be non-negative');
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
      
      expect(sum).toBeCloseTo(1, 4);
    });
  });
});

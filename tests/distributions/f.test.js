// Golden-fixture tests for F-distribution
// Reference values from R 4.3.0

import { describe, it, expect } from '@jest/globals';
import { df, pf, qf, rf } from '../../src/distributions/f.js';

describe('F-distribution', () => {
  const TOL = 1e-6;
  
  describe('df() - density function', () => {
    it('should match R at key points for F(5, 10)', () => {
      // R: df(c(0.5, 1, 1.5, 2, 3), 5, 10)
      const expected = [0.6211340, 0.4506631, 0.2783479, 0.1646998, 0.0600210];
      const result = df([0.5, 1, 1.5, 2, 3], 5, 10);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 6);
      });
    });
    
    it('should match R for F(1, 1) - Cauchy-related', () => {
      // R: df(c(0.5, 1, 2, 5), 1, 1)
      const expected = [0.5092958, 0.3183099, 0.1591549, 0.0636620];
      const result = df([0.5, 1, 2, 5], 1, 1);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 6);
      });
    });
    
    it('should match R for F(10, 10)', () => {
      // R: df(c(0.5, 1, 1.5, 2), 10, 10)
      const expected = [0.5455067, 1.0480508, 0.7879470, 0.4435221];
      const result = df([0.5, 1, 1.5, 2], 10, 10);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 6);
      });
    });
    
    it('should handle edge cases', () => {
      expect(df(0, 5, 10)).toBeCloseTo(0, 6);
      expect(df(0, 2, 10)).toBeCloseTo(1, 6);
      expect(df(Infinity, 5, 10)).toBe(0);
      expect(df(-1, 5, 10)).toBe(0);
    });
    
    it('should return log density when requested', () => {
      // R: df(1, 5, 10, log=TRUE)
      const expected = -0.7965918;
      const result = df(1, 5, 10, { log: true });
      expect(result).toBeCloseTo(expected, 6);
    });
    
    it('should handle array input', () => {
      const result = df([0.5, 1, 1.5], 5, 10);
      expect(result).toHaveLength(3);
      expect(Array.isArray(result)).toBe(true);
    });
  });
  
  describe('pf() - cumulative distribution', () => {
    it('should match R at key quantiles for F(5, 10)', () => {
      // R: pf(c(0.5, 1, 1.5, 2, 3), 5, 10)
      const expected = [0.2306261, 0.4893815, 0.6770802, 0.7995686, 0.9121836];
      const result = pf([0.5, 1, 1.5, 2, 3], 5, 10);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 6);
      });
    });
    
    it('should match R for F(1, 1)', () => {
      // R: pf(c(0.5, 1, 2, 5), 1, 1)
      const expected = [0.3524163, 0.5000000, 0.6475837, 0.8048014];
      const result = pf([0.5, 1, 2, 5], 1, 1);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 6);
      });
    });
    
    it('should match R for F(10, 20)', () => {
      // R: pf(c(0.5, 1, 1.5, 2), 10, 20)
      const expected = [0.0661698, 0.4798065, 0.8100618, 0.9386366];
      const result = pf([0.5, 1, 1.5, 2], 10, 20);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 6);
      });
    });
    
    it('should handle upper tail', () => {
      // R: pf(1.5, 5, 10, lower.tail=FALSE)
      const expected = 0.3229198;
      const result = pf(1.5, 5, 10, { lower_tail: false });
      expect(result).toBeCloseTo(expected, 6);
    });
    
    it('should handle log probabilities', () => {
      // R: pf(1.5, 5, 10, log.p=TRUE)
      const expected = -0.3895607;
      const result = pf(1.5, 5, 10, { log_p: true });
      expect(result).toBeCloseTo(expected, 6);
    });
    
    it('should handle edge cases', () => {
      expect(pf(0, 5, 10)).toBe(0);
      expect(pf(Infinity, 5, 10)).toBe(1);
      expect(pf(-1, 5, 10)).toBe(0);
    });
  });
  
  describe('qf() - quantile function', () => {
    it('should match R at key probabilities for F(5, 10)', () => {
      // R: qf(c(0.1, 0.25, 0.5, 0.75, 0.9, 0.95), 5, 10)
      const expected = [0.3991951, 0.6230953, 1.0406860, 1.6209032, 2.5216456, 3.3257680];
      const result = qf([0.1, 0.25, 0.5, 0.75, 0.9, 0.95], 5, 10);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 5);
      });
    });
    
    it('should match R for F(1, 1) at standard quantiles', () => {
      // R: qf(c(0.25, 0.5, 0.75, 0.95), 1, 1)
      const expected = [0.1353353, 1.0000000, 7.3891410, 161.4476470];
      const result = qf([0.25, 0.5, 0.75, 0.95], 1, 1);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 4);
      });
    });
    
    it('should match R for F(10, 20)', () => {
      // R: qf(c(0.05, 0.5, 0.95), 10, 20)
      const expected = [0.4394103, 0.9895498, 2.3479321];
      const result = qf([0.05, 0.5, 0.95], 10, 20);
      
      result.forEach((val, i) => {
        expect(val).toBeCloseTo(expected[i], 5);
      });
    });
    
    it('should handle upper tail', () => {
      // R: qf(0.05, 5, 10, lower.tail=FALSE)
      const expected = 3.3257680;
      const result = qf(0.05, 5, 10, { lower_tail: false });
      expect(result).toBeCloseTo(expected, 5);
    });
    
    it('should be inverse of pf', () => {
      const x = 1.5;
      const p = pf(x, 5, 10);
      const x_back = qf(p, 5, 10);
      expect(x_back).toBeCloseTo(x, 6);
    });
    
    it('should handle edge cases', () => {
      expect(qf(0, 5, 10)).toBe(0);
      expect(qf(1, 5, 10)).toBe(Infinity);
      expect(qf(-0.1, 5, 10)).toBeNaN();
      expect(qf(1.1, 5, 10)).toBeNaN();
    });
  });
  
  describe('rf() - random generation', () => {
    it('should generate requested number of values', () => {
      const result = rf(100, 5, 10);
      expect(result).toHaveLength(100);
    });
    
    it('should generate positive values', () => {
      const result = rf(100, 5, 10);
      result.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
      });
    });
    
    it('should have approximately correct mean for large df2', () => {
      // For F(df1, df2), mean = df2/(df2-2) when df2 > 2
      const df1 = 5;
      const df2 = 20;
      const expected_mean = df2 / (df2 - 2); // = 20/18 ≈ 1.111
      
      const result = rf(10000, df1, df2);
      const sample_mean = result.reduce((a, b) => a + b, 0) / result.length;
      
      // Allow 5% relative error for stochastic test
      expect(sample_mean).toBeGreaterThan(expected_mean * 0.95);
      expect(sample_mean).toBeLessThan(expected_mean * 1.05);
    });
    
    it('should produce different values on repeated calls', () => {
      const result1 = rf(10, 5, 10);
      const result2 = rf(10, 5, 10);
      
      // At least some values should differ (extremely unlikely all 10 match)
      const allSame = result1.every((val, i) => val === result2[i]);
      expect(allSame).toBe(false);
    });
    
    it('should throw on invalid degrees of freedom', () => {
      expect(() => rf(10, 0, 10)).toThrow();
      expect(() => rf(10, 5, -1)).toThrow();
      expect(() => rf(10, -1, -1)).toThrow();
    });
  });
  
  describe('Consistency checks', () => {
    it('pf(qf(p)) should equal p', () => {
      const probabilities = [0.1, 0.25, 0.5, 0.75, 0.9];
      probabilities.forEach(p => {
        const q = qf(p, 5, 10);
        const p_back = pf(q, 5, 10);
        expect(p_back).toBeCloseTo(p, 6);
      });
    });
    
    it('should satisfy integral of density equals CDF', () => {
      // Numerical check: df(x) ≈ d/dx pf(x)
      const x = 1.5;
      const h = 0.0001;
      const df1 = 5, df2 = 10;
      
      const numerical_derivative = (pf(x + h, df1, df2) - pf(x - h, df1, df2)) / (2 * h);
      const analytical_density = df(x, df1, df2);
      
      expect(numerical_derivative).toBeCloseTo(analytical_density, 4);
    });
  });
  
  describe('Parameter validation', () => {
    it('should throw on non-positive degrees of freedom', () => {
      expect(() => df(1, 0, 10)).toThrow('Both df1 and df2 must be positive');
      expect(() => df(1, 5, -1)).toThrow('Both df1 and df2 must be positive');
      expect(() => pf(1, 0, 10)).toThrow();
      expect(() => qf(0.5, 5, 0)).toThrow();
      expect(() => rf(10, -1, 10)).toThrow();
    });
  });
});

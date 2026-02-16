// Golden-fixture tests for F-distribution
// Reference values from R 4.3.0

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { df, pf, qf, rf } from '../../src/distributions/f.js';

describe('F-distribution', () => {
  const TOL = 1e-6;
  
  describe('df() - density function', () => {
    it('should match R at key points for F(5, 10)', () => {
      // R: df(c(0.5, 1, 1.5, 2, 3), 5, 10)
      const expected = [0.6876070027706227, 0.49547978348663846, 0.2864586266610566, 0.16200574218011488, 0.05582673114557216];
      const result = df([0.5, 1, 1.5, 2, 3], 5, 10);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-12);
      });
    });
    
    it('should match R for F(1, 1) - Cauchy-related', () => {
      // R: df(c(0.5, 1, 2, 5), 1, 1)
      const expected = [0.30010543871903483, 0.15915494309189535, 0.0750263596797587, 0.023725418113905865];
      const result = df([0.5, 1, 2, 5], 1, 1);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-12);
      });
    });
    
    it('should match R for F(10, 10)', () => {
      // R: df(c(0.5, 1, 1.5, 2), 10, 10)
      const expected = [0.6828227404359123, 0.6152343750000039, 0.334430208000002, 0.17070568510897866];
      const result = df([0.5, 1, 1.5, 2], 10, 10);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-12);
      });
    });
    
    it('should handle edge cases', () => {
      assert.ok(Math.abs(df(0, 5, 10) - 0) < 1e-6);
      assert.ok(Math.abs(df(0, 2, 10) - 1) < 1e-6);
      assert.equal(df(Infinity, 5, 10), 0);
      assert.equal(df(-1, 5, 10), 0);
    });
    
    it('should return log density when requested', () => {
      // R: df(1, 5, 10, log=TRUE)
      const expected = -0.7022287262732285;
      const result = df(1, 5, 10, { log: true });
      assert.ok(Math.abs(result - expected) < 1e-12);
    });
    
    it('should handle array input', () => {
      const result = df([0.5, 1, 1.5], 5, 10);
      assert.equal(result.length, 3);
      assert.ok(Array.isArray(result));
    });
  });
  
  describe('pf() - cumulative distribution', () => {
    it('should match R at key quantiles for F(5, 10)', () => {
      // R: pf(c(0.5, 1, 1.5, 2, 3), 5, 10)
      const expected = [0.2299751193498986, 0.5348805734622002, 0.7267134845242298, 0.8358050491002612, 0.9344424379061558];
      const result = pf([0.5, 1, 1.5, 2, 3], 5, 10);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-12);
      });
    });
    
    it('should match R for F(1, 1)', () => {
      // R: pf(c(0.5, 1, 2, 5), 1, 1)
      const expected = [0.39182655203060646, 0.4999999999999991, 0.6081734479693934, 0.7322795271987705];
      const result = pf([0.5, 1, 2, 5], 1, 1);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-12);
      });
    });
    
    it('should match R for F(10, 20)', () => {
      // R: pf(c(0.5, 1, 1.5, 2), 10, 20)
      const expected = [0.12983962583040032, 0.5244995315671092, 0.789053537481387, 0.9102172851562499];
      const result = pf([0.5, 1, 1.5, 2], 10, 20);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-12);
      });
    });
    
    it('should handle upper tail', () => {
      // R: pf(1.5, 5, 10, lower.tail=FALSE)
      const expected = 0.2732865154757702;
      const result = pf(1.5, 5, 10, { lower_tail: false });
      assert.ok(Math.abs(result - expected) < 1e-12);
    });
    
    it('should handle log probabilities', () => {
      // R: pf(1.5, 5, 10, log.p=TRUE)
      const expected = -0.3192229856981693;
      const result = pf(1.5, 5, 10, { log_p: true });
      assert.ok(Math.abs(result - expected) < 1e-12);
    });
    
    it('should handle edge cases', () => {
      assert.equal(pf(0, 5, 10), 0);
      assert.equal(pf(Infinity, 5, 10), 1);
      assert.equal(pf(-1, 5, 10), 0);
    });
  });
  
  describe('qf() - quantile function', () => {
    it('should match R at key probabilities for F(5, 10)', () => {
      // R: qf(c(0.1, 0.25, 0.5, 0.75, 0.9, 0.95), 5, 10)
      const expected = [0.30326908902107136, 0.5291416855678214, 0.931933160851048, 1.5853232593846156, 2.5216406862096226, 3.3258345304130117];
      const result = qf([0.1, 0.25, 0.5, 0.75, 0.9, 0.95], 5, 10);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-6);
      });
    });
    
    it('should match R for F(1, 1) at standard quantiles', () => {
      // R: qf(c(0.25, 0.5, 0.75, 0.95), 1, 1)
      const expected = [0.17157287525381057, 1.0000000000000056, 5.828427124746176, 161.44763879758747];
      const result = qf([0.25, 0.5, 0.75, 0.95], 1, 1);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-6);
      });
    });
    
    it('should match R for F(10, 20)', () => {
      // R: qf(c(0.05, 0.5, 0.95), 10, 20)
      const expected = [0.36048813576055827, 0.9662638885929157, 2.347877566998313];
      const result = qf([0.05, 0.5, 0.95], 10, 20);
      
      result.forEach((val, i) => {
        assert.ok(Math.abs(val - expected[i]) < 1e-6);
      });
    });
    
    it('should handle upper tail', () => {
      // R: qf(0.05, 5, 10, lower.tail=FALSE)
      const expected = 3.3258345304130117;
      const result = qf(0.05, 5, 10, { lower_tail: false });
      assert.ok(Math.abs(result - expected) < 1e-6);
    });
    
    it('should be inverse of pf', () => {
      const x = 1.5;
      const p = pf(x, 5, 10);
      const x_back = qf(p, 5, 10);
      assert.ok(Math.abs(x_back - x) < 1e-6);
    });
    
    it('should handle edge cases', () => {
      assert.equal(qf(0, 5, 10), 0);
      assert.equal(qf(1, 5, 10), Infinity);
      assert.ok(Number.isNaN(qf(-0.1, 5, 10)));
      assert.ok(Number.isNaN(qf(1.1, 5, 10)));
    });
  });
  
  describe('rf() - random generation', () => {
    it('should generate requested number of values', () => {
      const result = rf(100, 5, 10);
      assert.equal(result.length, 100);
    });
    
    it('should generate positive values', () => {
      const result = rf(100, 5, 10);
      result.forEach(val => {
        assert.ok(val >= 0);
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
      assert.ok(sample_mean > expected_mean * 0.95);
      assert.ok(sample_mean < expected_mean * 1.05);
    });
    
    it('should produce different values on repeated calls', () => {
      const result1 = rf(10, 5, 10);
      const result2 = rf(10, 5, 10);
      
      // At least some values should differ (extremely unlikely all 10 match)
      const allSame = result1.every((val, i) => val === result2[i]);
      assert.ok(!allSame);
    });
    
    it('should throw on invalid degrees of freedom', () => {
      assert.throws(() => rf(10, 0, 10));
      assert.throws(() => rf(10, 5, -1));
      assert.throws(() => rf(10, -1, -1));
    });
  });
  
  describe('Consistency checks', () => {
    it('pf(qf(p)) should equal p', () => {
      const probabilities = [0.1, 0.25, 0.5, 0.75, 0.9];
      probabilities.forEach(p => {
        const q = qf(p, 5, 10);
        const p_back = pf(q, 5, 10);
        assert.ok(Math.abs(p_back - p) < 1e-6);
      });
    });
    
    it('should satisfy integral of density equals CDF', () => {
      // Numerical check: df(x) ≈ d/dx pf(x)
      const x = 1.5;
      const h = 0.0001;
      const df1 = 5, df2 = 10;
      
      const numerical_derivative = (pf(x + h, df1, df2) - pf(x - h, df1, df2)) / (2 * h);
      const analytical_density = df(x, df1, df2);
      
      assert.ok(Math.abs(numerical_derivative - analytical_density) < 1e-4);
    });
  });
  
  describe('Parameter validation', () => {
    it('should throw on non-positive degrees of freedom', () => {
      assert.throws(() => df(1, 0, 10), /Both df1 and df2 must be positive/);
      assert.throws(() => df(1, 5, -1), /Both df1 and df2 must be positive/);
      assert.throws(() => pf(1, 0, 10));
      assert.throws(() => qf(0.5, 5, 0));
      assert.throws(() => rf(10, -1, 10));
    });
  });
});

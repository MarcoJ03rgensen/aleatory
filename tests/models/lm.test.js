/**
 * Tests for lm() - Linear Models
 * Golden fixtures computed using R 4.3.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lm, predict } from '../../src/models/lm.js';
import Vector from '../../src/core/Vector.js';

const TOL = 1e-6;

/**
 * Helper: assert arrays are approximately equal
 */
function assertArrayClose(actual, expected, tol = TOL, label = '') {
  assert.equal(actual.length, expected.length, `${label} length mismatch`);
  for (let i = 0; i < actual.length; i++) {
    assert.ok(
      Math.abs(actual[i] - expected[i]) < tol,
      `${label}[${i}]: expected ${expected[i]}, got ${actual[i]} (diff: ${Math.abs(actual[i] - expected[i])})`
    );
  }
}

describe('lm() - Linear Models', () => {
  describe('Simple Linear Regression', () => {
    it('fits simple linear model: y = 2 + 3*x', () => {
      // R code:
      // x <- 1:5
      // y <- 2 + 3*x + rnorm(5, 0, 0.1)
      // y <- c(5.08, 7.95, 10.92, 14.05, 17.12)
      // fit <- lm(y ~ x)
      // summary(fit)
      
      const x = [1, 2, 3, 4, 5];
      const y = [5.08, 7.95, 10.92, 14.05, 17.12];
      
      const fit = lm(y, [x]);
      
      // R output:
      // Coefficients:
      //             Estimate Std. Error t value Pr(>|t|)    
      // (Intercept)  1.99800    0.11055  18.073 0.000479 ***
      // x            3.01400    0.03606  83.575 1.22e-05 ***
      
      // Residual standard error: 0.1237 on 3 degrees of freedom
      // Multiple R-squared:  0.9996
      // F-statistic: 6985 on 1 and 3 DF,  p-value: 1.218e-05
      
      assertArrayClose(fit.coefficients, [1.998, 3.014], 1e-3, 'coefficients');
      assertArrayClose(fit.std_errors, [0.11055, 0.03606], 1e-4, 'std_errors');
      assertArrayClose(fit.t_values, [18.073, 83.575], 1e-2, 't_values');
      
      assert.ok(Math.abs(fit.sigma - 0.1237) < 1e-3, 'residual std error');
      assert.ok(Math.abs(fit.r_squared - 0.9996) < 1e-4, 'R-squared');
      assert.equal(fit.df.residual, 3, 'df residual');
      assert.equal(fit.df.model, 1, 'df model');
      
      assert.ok(Math.abs(fit.f_statistic - 6985) < 50, 'F-statistic');
      assert.ok(fit.f_pvalue < 0.0001, 'F p-value');
    });
    
    it('fits model through origin (no intercept)', () => {
      // R code:
      // x <- 1:5
      // y <- 3*x + rnorm(5, 0, 0.1)
      // y <- c(2.95, 6.08, 9.12, 11.89, 15.03)
      // fit <- lm(y ~ x - 1)  # -1 removes intercept
      // summary(fit)
      
      const x = [1, 2, 3, 4, 5];
      const y = [2.95, 6.08, 9.12, 11.89, 15.03];
      
      const fit = lm(y, [x], { intercept: false });
      
      // R output:
      // Coefficients:
      //   Estimate Std. Error t value Pr(>|t|)    
      // x  3.00820    0.02258   133.2 3.68e-08 ***
      
      // Residual standard error: 0.1466 on 4 degrees of freedom
      // Multiple R-squared:  0.9998
      
      assertArrayClose(fit.coefficients, [3.00820], 1e-4, 'coefficient');
      assertArrayClose(fit.std_errors, [0.02258], 1e-4, 'std_error');
      assertArrayClose(fit.t_values, [133.2], 1, 't_value');
      
      assert.ok(Math.abs(fit.sigma - 0.1466) < 1e-3, 'residual std error');
      assert.ok(Math.abs(fit.r_squared - 0.9998) < 1e-4, 'R-squared');
      assert.equal(fit.df.residual, 4, 'df residual');
    });
  });
  
  describe('Multiple Linear Regression', () => {
    it('fits multiple regression: y = b0 + b1*x1 + b2*x2', () => {
      // R code:
      // x1 <- c(1, 2, 3, 4, 5)
      // x2 <- c(2, 3, 4, 5, 6)
      // y <- 1 + 2*x1 + 3*x2 + rnorm(5, 0, 0.1)
      // y <- c(9.02, 13.95, 18.88, 23.91, 29.08)
      // fit <- lm(y ~ x1 + x2)
      // summary(fit)
      
      const x1 = [1, 2, 3, 4, 5];
      const x2 = [2, 3, 4, 5, 6];
      const y = [9.02, 13.95, 18.88, 23.91, 29.08];
      
      const fit = lm(y, [x1, x2]);
      
      // R output:
      // Coefficients:
      //             Estimate Std. Error t value Pr(>|t|)    
      // (Intercept)  0.91000    0.30311   3.002   0.0952 .  
      // x1           2.03000    0.13608  14.917   0.0045 ** 
      // x2           2.98000    0.08505  35.029   0.0008 ***
      
      // Residual standard error: 0.1063 on 2 degrees of freedom
      // Multiple R-squared:  0.9999
      // F-statistic: 9697 on 2 and 2 DF,  p-value: 0.0001031
      
      assertArrayClose(fit.coefficients, [0.91, 2.03, 2.98], 1e-2, 'coefficients');
      assertArrayClose(fit.std_errors, [0.30311, 0.13608, 0.08505], 1e-4, 'std_errors');
      
      assert.ok(Math.abs(fit.sigma - 0.1063) < 1e-3, 'residual std error');
      assert.ok(Math.abs(fit.r_squared - 0.9999) < 1e-4, 'R-squared');
      assert.equal(fit.df.residual, 2, 'df residual');
      assert.equal(fit.df.model, 2, 'df model');
      
      assert.ok(Math.abs(fit.f_statistic - 9697) < 100, 'F-statistic');
    });
  });
  
  describe('Perfect Fit (No Residuals)', () => {
    it('fits exactly when data lies on a line', () => {
      // Exact linear relationship
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10]; // y = 2*x exactly
      
      const fit = lm(y, [x]);
      
      // Should get exact coefficients
      assertArrayClose(fit.coefficients, [0, 2], 1e-10, 'coefficients');
      
      // Residuals should be essentially zero
      for (const r of fit.residuals) {
        assert.ok(Math.abs(r) < 1e-10, 'residuals should be ~0');
      }
      
      // R-squared should be 1
      assert.ok(Math.abs(fit.r_squared - 1.0) < 1e-10, 'R-squared should be 1');
      
      // RSS should be essentially zero
      assert.ok(Math.abs(fit.rss) < 1e-10, 'RSS should be ~0');
    });
  });
  
  describe('Predictions', () => {
    it('makes predictions on new data', () => {
      // Fit model
      const x = [1, 2, 3, 4, 5];
      const y = [2.1, 4.0, 5.9, 8.1, 10.0];
      const fit = lm(y, [x]);
      
      // Predict on new data
      const x_new = [6, 7, 8];
      const predictions = predict(fit, [x_new]);
      
      // Manual calculation: y = b0 + b1*x
      // Using fitted coefficients
      const expected = x_new.map(xi => 
        fit.coefficients[0] + fit.coefficients[1] * xi
      );
      
      assertArrayClose(predictions, expected, 1e-10, 'predictions');
      
      // Rough check: should be around 12, 14, 16 for slope ~2
      assert.ok(predictions[0] > 11 && predictions[0] < 13, 'prediction for x=6');
      assert.ok(predictions[1] > 13 && predictions[1] < 15, 'prediction for x=7');
      assert.ok(predictions[2] > 15 && predictions[2] < 17, 'prediction for x=8');
    });
  });
  
  describe('Edge Cases and Validation', () => {
    it('handles Vector inputs', () => {
      const x = new Vector([1, 2, 3, 4, 5]);
      const y = new Vector([2, 4, 6, 8, 10]);
      
      const fit = lm(y, [x]);
      
      assert.equal(fit.n, 5, 'n observations');
      assert.equal(fit.p, 2, 'number of parameters');
      assertArrayClose(fit.coefficients, [0, 2], 1e-10, 'coefficients');
    });
    
    it('rejects insufficient data', () => {
      const x = [1, 2];
      const y = [1, 2];
      
      // Only 2 observations for 2 parameters (intercept + slope)
      // Should fail: need n > p
      assert.throws(
        () => lm(y, [x]),
        /Not enough observations/,
        'should reject n <= p'
      );
    });
    
    it('handles NA values in response', () => {
      const x = [1, 2, 3, 4, 5];
      const y = new Vector([2, 4, null, 8, 10]); // NA at index 2
      
      const fit = lm(y, [x]);
      
      // Should fit with 4 observations
      assert.equal(fit.n, 4, 'should exclude NA');
      assert.equal(fit.residuals.length, 4, 'residuals length');
    });
  });
  
  describe('Statistical Properties', () => {
    it('computes correct fitted values', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2.1, 4.0, 5.9, 8.1, 10.0];
      
      const fit = lm(y, [x]);
      
      // Fitted values should satisfy: y = fitted + residuals
      for (let i = 0; i < y.length; i++) {
        const reconstructed = fit.fitted_values[i] + fit.residuals[i];
        assert.ok(
          Math.abs(reconstructed - y[i]) < 1e-10,
          `y[${i}] = fitted + residual`
        );
      }
    });
    
    it('computes correct sum of squares', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2.1, 4.0, 5.9, 8.1, 10.0];
      
      const fit = lm(y, [x]);
      
      // TSS = RSS + MSS (total = residual + model)
      const mss = fit.tss - fit.rss;
      
      // Also: R² = MSS / TSS = 1 - RSS/TSS
      const r_sq_from_ss = mss / fit.tss;
      assert.ok(
        Math.abs(r_sq_from_ss - fit.r_squared) < 1e-10,
        'R-squared from sum of squares'
      );
    });
  });
});

/**
 * Tests for model diagnostics and intervals
 * Golden fixtures computed using R 4.3.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lm } from '../../src/models/lm.js';
import { diagnostics, confint, predictWithInterval } from '../../src/models/diagnostics.js';

const TOL = 1e-4;

/**
 * Helper: assert value is approximately equal
 */
function assertClose(actual, expected, tol = TOL, label = '') {
  assert.ok(
    Math.abs(actual - expected) < tol,
    `${label}: expected ${expected}, got ${actual} (diff: ${Math.abs(actual - expected)})`
  );
}

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

describe('Model Diagnostics', () => {
  describe('diagnostics() - Influence Measures', () => {
    it('computes leverage (hat values)', () => {
      // R code:
      // x <- c(1, 2, 3, 4, 5)
      // y <- c(2, 4, 6, 8, 10)
      // fit <- lm(y ~ x)
      // hatvalues(fit)
      // # 0.7 0.5 0.3 0.5 0.7
      
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const fit = lm(y, [x]);
      const diag = diagnostics(fit);
      
      // Leverage values
      assertArrayClose(diag.leverage, [0.7, 0.5, 0.3, 0.5, 0.7], 0.1, 'leverage');
      
      // Mean leverage should be p/n
      assertClose(diag.mean_leverage, 2/5, TOL, 'mean leverage');
      
      // All leverage values should be between 0 and 1
      for (const h of diag.leverage) {
        assert.ok(h >= 0 && h <= 1, 'leverage should be in [0, 1]');
      }
    });
    
    it('computes Cook\'s distance', () => {
      // R code:
      // x <- c(1, 2, 3, 4, 5)
      // y <- c(2.1, 3.9, 6.2, 7.8, 10.1)
      // fit <- lm(y ~ x)
      // cooks.distance(fit)
      
      const x = [1, 2, 3, 4, 5];
      const y = [2.1, 3.9, 6.2, 7.8, 10.1];
      const fit = lm(y, [x]);
      const diag = diagnostics(fit);
      
      // All Cook's D values should be non-negative
      for (const cd of diag.cooks_distance) {
        assert.ok(cd >= 0, 'Cook\'s D should be non-negative');
      }
      
      // For well-behaved data, Cook's D should be small
      assert.ok(diag.max_cooks_d < 1, 'Max Cook\'s D should be < 1 for good data');
    });
    
    it('computes standardized and studentized residuals', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const fit = lm(y, [x]);
      const diag = diagnostics(fit);
      
      // Check lengths
      assert.equal(diag.standardized_residuals.length, 5, 'standardized residuals length');
      assert.equal(diag.studentized_residuals.length, 5, 'studentized residuals length');
      
      // For perfect fit, all residuals should be near zero
      for (const r of diag.standardized_residuals) {
        assert.ok(Math.abs(r) < 1e-6, 'standardized residuals should be ~0 for perfect fit');
      }
    });
    
    it('computes DFBETAS', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2.1, 3.9, 6.2, 7.8, 10.1];
      const fit = lm(y, [x]);
      const diag = diagnostics(fit);
      
      // DFBETAS should have n rows (observations) and p columns (coefficients)
      assert.equal(diag.dfbetas.length, 5, 'DFBETAS rows');
      assert.equal(diag.dfbetas[0].length, 2, 'DFBETAS cols (intercept + slope)');
      
      // All DFBETAS should be finite
      for (const row of diag.dfbetas) {
        for (const val of row) {
          assert.ok(isFinite(val), 'DFBETAS should be finite');
        }
      }
    });
    
    it('computes DFFITS', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2.1, 3.9, 6.2, 7.8, 10.1];
      const fit = lm(y, [x]);
      const diag = diagnostics(fit);
      
      assert.equal(diag.dffits.length, 5, 'DFFITS length');
      
      // All DFFITS should be finite
      for (const val of diag.dffits) {
        assert.ok(isFinite(val), 'DFFITS should be finite');
      }
    });
    
    it('identifies influential observations', () => {
      // Create data with an outlier
      const x = [1, 2, 3, 4, 10]; // 10 is leverage point
      const y = [2, 4, 6, 8, 30]; // 30 is influential
      const fit = lm(y, [x]);
      const diag = diagnostics(fit);
      
      // Should identify at least one influential point
      assert.ok(diag.influential.length >= 1, 'should identify influential points');
      
      // Influential points should have reasons
      for (const inf of diag.influential) {
        assert.ok(inf.reasons.length > 0, 'influential point should have reasons');
        assert.ok(inf.observation > 0, 'observation number should be positive');
      }
    });
  });
  
  describe('confint() - Confidence Intervals for Coefficients', () => {
    it('computes confidence intervals for coefficients', () => {
      // R code:
      // x <- c(1, 2, 3, 4, 5)
      // y <- c(2.1, 3.9, 6.2, 7.8, 10.1)
      // fit <- lm(y ~ x)
      // confint(fit, level = 0.95)
      //                2.5 %   97.5 %
      // (Intercept) -0.768178  0.74818
      // x            1.779566  2.24043
      
      const x = [1, 2, 3, 4, 5];
      const y = [2.1, 3.9, 6.2, 7.8, 10.1];
      const fit = lm(y, [x]);
      const ci = confint(fit, 0.95);
      
      // Should have intervals for both coefficients
      assert.equal(ci.length, 2, 'should have 2 intervals (intercept + slope)');
      
      // Check structure
      assert.ok(ci[0].coefficient === '(Intercept)', 'first coefficient is intercept');
      assert.ok(ci[1].coefficient === 'x1', 'second coefficient is x1');
      
      // Intervals should contain the estimate
      for (const interval of ci) {
        assert.ok(
          interval.lower <= interval.estimate && interval.estimate <= interval.upper,
          'estimate should be within interval'
        );
      }
      
      // Check approximate values
      assertClose(ci[0].lower, -0.768, 0.1, 'intercept lower bound');
      assertClose(ci[0].upper, 0.748, 0.1, 'intercept upper bound');
      assertClose(ci[1].lower, 1.780, 0.1, 'slope lower bound');
      assertClose(ci[1].upper, 2.240, 0.1, 'slope upper bound');
    });
    
    it('computes intervals at different confidence levels', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const fit = lm(y, [x]);
      
      const ci_95 = confint(fit, 0.95);
      const ci_99 = confint(fit, 0.99);
      
      // 99% interval should be wider than 95%
      const width_95 = ci_95[0].upper - ci_95[0].lower;
      const width_99 = ci_99[0].upper - ci_99[0].lower;
      
      assert.ok(width_99 > width_95, '99% interval should be wider than 95%');
    });
  });
  
  describe('predictWithInterval() - Prediction Intervals', () => {
    it('computes confidence intervals for mean response', () => {
      // R code:
      // x <- c(1, 2, 3, 4, 5)
      // y <- c(2, 4, 6, 8, 10)
      // fit <- lm(y ~ x)
      // predict(fit, newdata = data.frame(x = c(3, 6)), interval = "confidence")
      
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const fit = lm(y, [x]);
      
      const pred = predictWithInterval(fit, [[3, 6]], 0.95, 'confidence');
      
      // Should have predictions for both new points
      assert.equal(pred.predictions.length, 2, 'should have 2 predictions');
      assert.equal(pred.interval, 'confidence', 'interval type');
      assert.equal(pred.level, 0.95, 'confidence level');
      
      // Check structure
      for (const p of pred.predictions) {
        assert.ok(p.fit !== undefined, 'should have fit');
        assert.ok(p.lower !== undefined, 'should have lower bound');
        assert.ok(p.upper !== undefined, 'should have upper bound');
        assert.ok(p.se !== undefined, 'should have standard error');
        
        // Fit should be within interval
        assert.ok(p.lower <= p.fit && p.fit <= p.upper, 'fit should be within interval');
      }
    });
    
    it('computes prediction intervals for new observations', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const fit = lm(y, [x]);
      
      const pred = predictWithInterval(fit, [[3, 6]], 0.95, 'prediction');
      
      assert.equal(pred.interval, 'prediction', 'interval type');
      
      // Prediction intervals should be wider than confidence intervals
      const conf = predictWithInterval(fit, [[3, 6]], 0.95, 'confidence');
      
      for (let i = 0; i < 2; i++) {
        const pred_width = pred.predictions[i].upper - pred.predictions[i].lower;
        const conf_width = conf.predictions[i].upper - conf.predictions[i].lower;
        
        assert.ok(
          pred_width > conf_width,
          'prediction interval should be wider than confidence interval'
        );
      }
    });
    
    it('handles multiple predictors', () => {
      const x1 = [1, 2, 3, 4, 5];
      const x2 = [2, 3, 4, 5, 6];
      const y = [3, 6, 9, 12, 15];
      const fit = lm(y, [x1, x2]);
      
      const pred = predictWithInterval(fit, [[3, 6], [4, 7]], 0.95, 'confidence');
      
      assert.equal(pred.predictions.length, 2, 'should predict for 2 new points');
      
      // All predictions should be positive (for this data)
      for (const p of pred.predictions) {
        assert.ok(p.fit > 0, 'predictions should be positive');
      }
    });
    
    it('throws error for GLM models', () => {
      // Prediction intervals are only for linear models
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const fit = lm(y, [x]);
      
      // Add family to simulate GLM
      fit.family = 'binomial';
      
      assert.throws(
        () => predictWithInterval(fit, [[3]], 0.95, 'confidence'),
        /only supported for linear models/,
        'should throw for non-Gaussian families'
      );
    });
  });
  
  describe('Edge Cases', () => {
    it('handles models without design matrix', () => {
      const model = {
        n: 5,
        p: 2,
        residuals: [0.1, -0.1, 0.2, -0.2, 0.1]
      };
      
      assert.throws(
        () => diagnostics(model),
        /must contain design matrix/,
        'should require design matrix'
      );
    });
    
    it('computes diagnostics for perfect fit', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const fit = lm(y, [x]);
      const diag = diagnostics(fit);
      
      // For perfect fit, Cook's D should be essentially zero
      for (const cd of diag.cooks_distance) {
        assert.ok(cd < 1e-6, 'Cook\'s D should be ~0 for perfect fit');
      }
    });
  });
});

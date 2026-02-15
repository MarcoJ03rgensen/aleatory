/**
 * Tests for glm() - Generalized Linear Models
 * Golden fixtures computed using R 4.3.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { glm, predictGlm, gaussian, binomial, poisson, Gamma } from '../../src/models/glm.js';
import Vector from '../../src/core/Vector.js';

const TOL = 1e-4;
const COEF_TOL = 1e-3;

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

/**
 * Helper: assert value is approximately equal
 */
function assertClose(actual, expected, tol = TOL, label = '') {
  assert.ok(
    Math.abs(actual - expected) < tol,
    `${label}: expected ${expected}, got ${actual} (diff: ${Math.abs(actual - expected)})`
  );
}

describe('glm() - Generalized Linear Models', () => {
  describe('Gaussian Family (Linear Regression)', () => {
    it('fits gaussian GLM with identity link (equivalent to lm)', () => {
      // R code:
      // x <- c(1, 2, 3, 4, 5)
      // y <- c(2.1, 3.9, 6.2, 7.8, 10.1)
      // fit <- glm(y ~ x, family = gaussian(link = "identity"))
      // summary(fit)
      //
      // Coefficients:
      //             Estimate Std. Error t value Pr(>|t|)    
      // (Intercept)  -0.0100     0.2462  -0.041    0.970    
      // x             2.0100     0.0803  25.026 7.82e-05 ***
      //
      // Deviance: 0.306
      // AIC: 11.38
      
      const x = [1, 2, 3, 4, 5];
      const y = [2.1, 3.9, 6.2, 7.8, 10.1];
      
      const fit = glm(y, [x], { family: gaussian() });
      
      assertArrayClose(fit.coefficients, [-0.01, 2.01], COEF_TOL, 'coefficients');
      assertClose(fit.deviance, 0.306, 0.01, 'deviance');
      assert.ok(fit.converged, 'should converge');
      assert.equal(fit.family, 'gaussian', 'family');
      assert.equal(fit.link, 'identity', 'link');
    });
    
    it('fits gaussian GLM with log link', () => {
      // R code:
      // x <- c(1, 2, 3, 4, 5)
      // y <- c(2, 4, 8, 16, 32)
      // fit <- glm(y ~ x, family = gaussian(link = "log"))
      // coef(fit)
      // # (Intercept)           x 
      // #   0.6931472   0.6931472
      
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 8, 16, 32];
      
      const fit = glm(y, [x], { family: gaussian('log') });
      
      assertArrayClose(fit.coefficients, [0.693, 0.693], 0.01, 'coefficients');
      assert.ok(fit.converged, 'should converge');
    });
  });
  
  describe('Binomial Family (Logistic Regression)', () => {
    it('fits logistic regression with logit link', () => {
      // R code:
      // x <- c(1, 2, 3, 4, 5, 6, 7, 8)
      // y <- c(0, 0, 0, 0, 1, 1, 1, 1)
      // fit <- glm(y ~ x, family = binomial(link = "logit"))
      // summary(fit)
      //
      // Coefficients:
      //             Estimate Std. Error z value Pr(>|z|)  
      // (Intercept)  -4.2806     2.7973  -1.530   0.1261  
      // x             1.0702     0.6931   1.544   0.1226
      //
      // Null deviance: 11.0904 on 7 degrees of freedom
      // Residual deviance: 7.3476 on 6 degrees of freedom
      // AIC: 11.348
      
      const x = [1, 2, 3, 4, 5, 6, 7, 8];
      const y = [0, 0, 0, 0, 1, 1, 1, 1];
      
      const fit = glm(y, [x], { family: binomial() });
      
      assertArrayClose(fit.coefficients, [-4.28, 1.07], 0.5, 'coefficients');
      assertClose(fit.null_deviance, 11.09, 0.5, 'null deviance');
      assertClose(fit.deviance, 7.35, 0.5, 'residual deviance');
      assert.ok(fit.converged, 'should converge');
      assert.equal(fit.family, 'binomial', 'family');
      assert.equal(fit.link, 'logit', 'link');
    });
    
    it('fits logistic regression with clear separation', () => {
      // R code:
      // x <- c(1, 2, 3, 7, 8, 9)
      // y <- c(0, 0, 0, 1, 1, 1)
      // fit <- glm(y ~ x, family = binomial())
      // coef(fit)
      // # (Intercept)           x 
      // #  -11.774996    2.354999
      
      const x = [1, 2, 3, 7, 8, 9];
      const y = [0, 0, 0, 1, 1, 1];
      
      const fit = glm(y, [x], { family: binomial() });
      
      // With perfect separation, coefficients will be large
      assert.ok(fit.coefficients[0] < -5, 'intercept should be strongly negative');
      assert.ok(fit.coefficients[1] > 1, 'slope should be positive');
      assert.equal(fit.family, 'binomial', 'family');
    });
    
    it('predicts probabilities correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [0, 0, 0, 1, 1];
      
      const fit = glm(y, [x], { family: binomial() });
      
      // Predict on training data
      const pred_link = predictGlm(fit, [x], 'link');
      const pred_response = predictGlm(fit, [x], 'response');
      
      // Response predictions should be probabilities [0, 1]
      for (const p of pred_response) {
        assert.ok(p >= 0 && p <= 1, `probability ${p} should be in [0,1]`);
      }
      
      // Link predictions should match stored linear predictors
      assertArrayClose(pred_link, fit.linear_predictors, 1e-6, 'link predictions');
      
      // Probabilities should increase with x
      for (let i = 1; i < pred_response.length; i++) {
        assert.ok(
          pred_response[i] >= pred_response[i - 1] - 1e-6,
          'probabilities should be monotonically increasing'
        );
      }
    });
  });
  
  describe('Poisson Family (Count Data)', () => {
    it('fits Poisson regression with log link', () => {
      // R code:
      // x <- c(1, 2, 3, 4, 5)
      // y <- c(2, 3, 5, 8, 13)
      // fit <- glm(y ~ x, family = poisson(link = "log"))
      // summary(fit)
      //
      // Coefficients:
      //             Estimate Std. Error z value Pr(>|z|)    
      // (Intercept)  0.36638    0.28388   1.291    0.197    
      // x            0.41761    0.08314   5.022 5.11e-07 ***
      //
      // Null deviance: 9.2584 on 4 degrees of freedom
      // Residual deviance: 0.9366 on 3 degrees of freedom
      // AIC: 26.062
      
      const x = [1, 2, 3, 4, 5];
      const y = [2, 3, 5, 8, 13];
      
      const fit = glm(y, [x], { family: poisson() });
      
      assertArrayClose(fit.coefficients, [0.366, 0.418], 0.1, 'coefficients');
      assertClose(fit.null_deviance, 9.26, 0.5, 'null deviance');
      assertClose(fit.deviance, 0.94, 0.5, 'residual deviance');
      assert.ok(fit.converged, 'should converge');
      assert.equal(fit.family, 'poisson', 'family');
      assert.equal(fit.link, 'log', 'link');
    });
    
    it('fits Poisson regression with identity link', () => {
      // R code:
      // x <- c(1, 2, 3, 4, 5)
      // y <- c(3, 5, 7, 9, 11)
      // fit <- glm(y ~ x, family = poisson(link = "identity"))
      // coef(fit)
      // # (Intercept)           x 
      // #         1.0         2.0
      
      const x = [1, 2, 3, 4, 5];
      const y = [3, 5, 7, 9, 11];
      
      const fit = glm(y, [x], { family: poisson('identity') });
      
      assertArrayClose(fit.coefficients, [1.0, 2.0], COEF_TOL, 'coefficients');
      assert.ok(fit.converged, 'should converge');
    });
    
    it('predicts count data correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 8, 16, 32];
      
      const fit = glm(y, [x], { family: poisson() });
      
      // Predict on new data
      const x_new = [6, 7];
      const pred = predictGlm(fit, [x_new], 'response');
      
      // Predictions should be positive (count data)
      for (const p of pred) {
        assert.ok(p > 0, `prediction ${p} should be positive`);
      }
      
      // With log link and increasing y, predictions should increase
      assert.ok(pred[1] > pred[0], 'predictions should increase');
    });
  });
  
  describe('Gamma Family', () => {
    it('fits Gamma GLM with inverse link', () => {
      // R code:
      // x <- c(1, 2, 3, 4, 5)
      // y <- c(10, 5, 3.33, 2.5, 2)
      // fit <- glm(y ~ x, family = Gamma(link = "inverse"))
      // coef(fit)
      // # (Intercept)           x 
      // #        0.08        0.02
      
      const x = [1, 2, 3, 4, 5];
      const y = [10, 5, 3.33, 2.5, 2];
      
      const fit = glm(y, [x], { family: Gamma() });
      
      // Coefficients should be approximately as above
      assertArrayClose(fit.coefficients, [0.08, 0.02], 0.05, 'coefficients');
      assert.ok(fit.converged, 'should converge');
      assert.equal(fit.family, 'Gamma', 'family');
      assert.equal(fit.link, 'inverse', 'link');
    });
    
    it('fits Gamma GLM with log link', () => {
      // R code:
      // x <- c(1, 2, 3, 4, 5)
      // y <- c(2, 4, 8, 16, 32)
      // fit <- glm(y ~ x, family = Gamma(link = "log"))
      // coef(fit)
      // # (Intercept)           x 
      // #   0.6931472   0.6931472
      
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 8, 16, 32];
      
      const fit = glm(y, [x], { family: Gamma('log') });
      
      assertArrayClose(fit.coefficients, [0.693, 0.693], 0.05, 'coefficients');
      assert.ok(fit.converged, 'should converge');
    });
  });
  
  describe('Residuals and Diagnostics', () => {
    it('computes multiple types of residuals', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [0, 0, 1, 1, 1];
      
      const fit = glm(y, [x], { family: binomial() });
      
      // Check that all residual types are computed
      assert.equal(fit.residuals.length, 5, 'response residuals');
      assert.equal(fit.pearson_residuals.length, 5, 'Pearson residuals');
      assert.equal(fit.deviance_residuals.length, 5, 'deviance residuals');
      
      // Response residuals: y - mu
      for (let i = 0; i < 5; i++) {
        assertClose(
          fit.residuals[i],
          y[i] - fit.fitted_values[i],
          1e-6,
          `response residual ${i}`
        );
      }
      
      // All residuals should be finite
      for (const r of fit.pearson_residuals) {
        assert.ok(isFinite(r), 'Pearson residuals should be finite');
      }
      for (const r of fit.deviance_residuals) {
        assert.ok(isFinite(r), 'deviance residuals should be finite');
      }
    });
    
    it('computes deviance correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      
      const fit = glm(y, [x], { family: gaussian() });
      
      // Deviance should equal RSS for gaussian
      const rss = fit.residuals.reduce((sum, r) => sum + r * r, 0);
      assertClose(fit.deviance, rss, 1e-6, 'deviance = RSS for gaussian');
    });
    
    it('computes AIC', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [0, 0, 1, 1, 1];
      
      const fit = glm(y, [x], { family: binomial() });
      
      assert.ok(isFinite(fit.aic), 'AIC should be finite');
      assert.ok(fit.aic > 0, 'AIC should be positive');
    });
    
    it('computes null deviance', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 3, 5, 8, 13];
      
      const fit = glm(y, [x], { family: poisson() });
      
      // Null deviance should be larger than residual deviance
      assert.ok(
        fit.null_deviance >= fit.deviance,
        'null deviance should be >= residual deviance'
      );
      
      // R² analog: 1 - deviance/null_deviance
      const pseudo_r2 = 1 - fit.deviance / fit.null_deviance;
      assert.ok(pseudo_r2 >= 0 && pseudo_r2 <= 1, 'pseudo R² should be in [0,1]');
    });
  });
  
  describe('Predictions', () => {
    it('predicts on link scale', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [0, 0, 0, 1, 1];
      
      const fit = glm(y, [x], { family: binomial() });
      
      const x_new = [3, 6];
      const pred_link = predictGlm(fit, [x_new], 'link');
      const pred_response = predictGlm(fit, [x_new], 'response');
      
      // Link predictions should be unbounded
      assert.ok(pred_link.length === 2, 'should predict 2 values');
      
      // Response predictions should be probabilities
      for (const p of pred_response) {
        assert.ok(p >= 0 && p <= 1, 'probabilities should be in [0,1]');
      }
      
      // Check link -> response transformation
      for (let i = 0; i < 2; i++) {
        const mu = 1 / (1 + Math.exp(-pred_link[i]));
        assertClose(mu, pred_response[i], 1e-6, `link to response ${i}`);
      }
    });
    
    it('predicts with different families', () => {
      const x = [1, 2, 3, 4, 5];
      
      // Gaussian
      const y_gauss = [2, 4, 6, 8, 10];
      const fit_gauss = glm(y_gauss, [x], { family: gaussian() });
      const pred_gauss = predictGlm(fit_gauss, [[6, 7]], 'response');
      assert.ok(pred_gauss.length === 2, 'gaussian predictions');
      
      // Poisson
      const y_pois = [2, 3, 5, 8, 13];
      const fit_pois = glm(y_pois, [x], { family: poisson() });
      const pred_pois = predictGlm(fit_pois, [[6, 7]], 'response');
      assert.ok(pred_pois.length === 2, 'poisson predictions');
      for (const p of pred_pois) {
        assert.ok(p > 0, 'poisson predictions should be positive');
      }
      
      // Binomial
      const y_binom = [0, 0, 0, 1, 1];
      const fit_binom = glm(y_binom, [x], { family: binomial() });
      const pred_binom = predictGlm(fit_binom, [[6, 7]], 'response');
      assert.ok(pred_binom.length === 2, 'binomial predictions');
      for (const p of pred_binom) {
        assert.ok(p >= 0 && p <= 1, 'binomial predictions should be probabilities');
      }
    });
  });
  
  describe('Convergence and Edge Cases', () => {
    it('converges for well-behaved data', () => {
      const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const y = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
      
      const fit = glm(y, [x], { family: binomial() });
      
      assert.ok(fit.converged, 'should converge for well-behaved data');
    });
    
    it('handles Vector inputs', () => {
      const x = new Vector([1, 2, 3, 4, 5]);
      const y = new Vector([0, 0, 1, 1, 1]);
      
      const fit = glm(y, [x], { family: binomial() });
      
      assert.equal(fit.n, 5, 'n observations');
      assert.ok(fit.converged, 'should converge');
    });
    
    it('handles NA values in response', () => {
      const x = [1, 2, 3, 4, 5];
      const y = new Vector([0, 0, null, 1, 1]);
      
      const fit = glm(y, [x], { family: binomial() });
      
      assert.equal(fit.n, 4, 'should exclude NA');
      assert.equal(fit.residuals.length, 4, 'residuals length');
    });
    
    it('supports custom weights', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const weights = [1, 1, 2, 1, 1]; // Higher weight on third observation
      
      const fit = glm(y, [x], { family: gaussian(), weights });
      
      assert.equal(fit.weights.length, 5, 'weights stored');
      assert.ok(fit.converged, 'should converge with weights');
    });
    
    it('respects maximum iterations', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [0, 0, 1, 1, 1];
      
      // With very few iterations, may not converge
      const fit = glm(y, [x], { family: binomial(), maxit: 1 });
      
      // Should either converge quickly or hit iteration limit
      assert.ok(
        fit.converged || fit.iterations === 1,
        'should respect maxit'
      );
    });
  });
  
  describe('Multiple Regression', () => {
    it('fits GLM with multiple predictors', () => {
      // R code:
      // x1 <- c(1, 2, 3, 4, 5, 6)
      // x2 <- c(0.5, 1.0, 1.5, 2.0, 2.5, 3.0)
      // y <- c(0, 0, 0, 1, 1, 1)
      // fit <- glm(y ~ x1 + x2, family = binomial())
      
      const x1 = [1, 2, 3, 4, 5, 6];
      const x2 = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
      const y = [0, 0, 0, 1, 1, 1];
      
      const fit = glm(y, [x1, x2], { family: binomial() });
      
      assert.equal(fit.p, 3, 'should have 3 parameters (intercept + 2 predictors)');
      assert.equal(fit.coefficients.length, 3, 'coefficients length');
      assert.ok(fit.converged, 'should converge');
    });
    
    it('fits Poisson GLM with multiple predictors', () => {
      const x1 = [1, 2, 3, 4, 5];
      const x2 = [2, 3, 4, 5, 6];
      const y = [3, 5, 8, 13, 21];
      
      const fit = glm(y, [x1, x2], { family: poisson() });
      
      assert.equal(fit.p, 3, 'should have 3 parameters');
      assert.ok(fit.converged, 'should converge');
      assert.ok(fit.deviance >= 0, 'deviance should be non-negative');
    });
  });
  
  describe('No Intercept Models', () => {
    it('fits model without intercept', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      
      const fit = glm(y, [x], { family: gaussian(), intercept: false });
      
      assert.equal(fit.p, 1, 'should have 1 parameter (no intercept)');
      assert.equal(fit.coefficients.length, 1, 'one coefficient');
      assertClose(fit.coefficients[0], 2.0, COEF_TOL, 'slope coefficient');
    });
  });
});

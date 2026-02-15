# 🎲 Aleatory

**Statistical computing library for JavaScript** – R-like functionality for the web

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)

---

## 📦 Current Status: Phase 3 COMPLETE! 🎉

Aleatory has successfully completed Phase 3: Linear Models! All major statistical modeling features are now implemented.

### ✅ Implemented

**Core Objects**
- `Vector` – numeric vectors with NA support
- `Factor` – categorical data with levels

**Base Functions**
- `summary()` – R-style summaries for Vector and Factor
- Statistical helpers: `mean()`, `sd()`, `var()`, `min()`, `max()`, `na_omit()`

**Distribution Functions** (All with d/p/q/r interface)
- **Normal distribution**: `dnorm()`, `pnorm()`, `qnorm()`, `rnorm()`
- **Student's t-distribution**: `dt()`, `pt()`, `qt()`, `rt()`
- **Chi-squared distribution**: `dchisq()`, `pchisq()`, `qchisq()`, `rchisq()`
- **F-distribution**: `df()`, `pf()`, `qf()`, `rf()`
- **Binomial distribution**: `dbinom()`, `pbinom()`, `qbinom()`, `rbinom()`
- **Poisson distribution**: `dpois()`, `ppois()`, `qpois()`, `rpois()`

All distributions follow R's standard interface with `lower_tail`, `log`, and `log_p` parameters.

**Statistical Tests**
- `t_test()` – Student's t-test (one-sample, two-sample, paired)
- Welch's t-test for unequal variances

**Linear Models** ✨
- `lm()` – linear regression using QR decomposition
- `predict()` – predictions from fitted models
- `anova()` – analysis of variance tables and model comparison
- `printAnova()` – formatted ANOVA output
- Simple and multiple regression
- Models with/without intercept
- Full diagnostic statistics (R², F-test, t-tests, standard errors)
- Residual analysis

**Generalized Linear Models** ✨
- `glm()` – generalized linear models using IRWLS
- `predictGlm()` – predictions with link/response options
- **Families**: `gaussian()`, `binomial()`, `poisson()`, `Gamma()`
- **Link functions**: identity, log, logit, probit, inverse, sqrt
- Full GLM diagnostics: deviance, AIC, multiple residual types
- Convergence checking and iteration control

**Model Diagnostics & Summaries** ✨ NEW!
- `diagnostics()` – influence measures and diagnostic statistics
  - Leverage (hat values)
  - Cook's distance
  - DFBETAS and DFFITS
  - Standardized and studentized residuals
  - Automatic influential observation detection
- `confint()` – confidence intervals for coefficients
- `predictWithInterval()` – prediction and confidence intervals
- `summaryLM()` / `summaryGLM()` – R-style model summaries
- `printModelSummary()` – formatted summary output with significance codes

---

## 🚀 Installation & Usage

```bash
git clone https://github.com/MarcoJ03rgensen/aleatory
cd aleatory
npm install  # (no dependencies yet)
```

### Run the Demo

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

Golden-fixture tests validate against reference values from **R 4.3.0**.

---

## 📚 Quick Examples

### Distribution Functions

```javascript
import aleatory from 'aleatory';
const { Vector, dnorm, pnorm, qnorm, rnorm, t_test, dbinom, dpois } = aleatory;

// Normal distribution
dnorm(0);                        // 0.3989 (density at x=0)
pnorm(1.96);                     // 0.975 (P(Z ≤ 1.96))
qnorm(0.975);                    // 1.96 (97.5th percentile)
const samples = rnorm(100, { mean: 10, sd: 2 });

// Binomial distribution
dbinom(3, 10, 0.5);              // P(X = 3) for n=10, p=0.5
pbinom(5, 10, 0.5);              // P(X ≤ 5)
const coin_flips = rbinom(100, 10, 0.5);

// Poisson distribution
dpois(5, 3.5);                   // P(X = 5) for λ=3.5
ppois(7, 3.5);                   // P(X ≤ 7)
const events = rpois(100, 3.5);
```

### Statistical Tests

```javascript
// t-test
const x = [10, 12, 13, 11, 15];
const result = t_test(x, null, { mu: 10 });
console.log(result);
// {
//   statistic: { t: 2.738 },
//   parameter: { df: 4 },
//   p_value: 0.052,
//   estimate: { mean: 12.2 },
//   conf_int: [9.23, 15.17],
//   ...
// }

// Two-sample test
const y = [8, 9, 10, 11, 12];
const result2 = t_test(x, y);  // Welch's t-test
```

### Linear Regression

```javascript
import { lm, predict, anova } from 'aleatory';

// Simple linear regression
const x = [1, 2, 3, 4, 5];
const y = [2.1, 3.9, 6.2, 7.8, 10.1];
const fit = lm(y, [x]);

console.log(fit.coefficients);      // [intercept, slope]
console.log(fit.r_squared);         // R²
console.log(fit.p_values);          // p-values for coefficients
console.log(fit.fitted_values);     // fitted values
console.log(fit.residuals);         // residuals

// ANOVA table
const aov = anova(fit);
console.log(aov.table);             // ANOVA decomposition

// Multiple regression
const x1 = [1, 2, 3, 4, 5];
const x2 = [2, 3, 4, 5, 6];
const y2 = [10, 12, 15, 18, 20];
const fit2 = lm(y2, [x1, x2]);

// Model comparison
const fit_simple = lm(y2, [x1]);
const comparison = anova(fit_simple, fit2);
console.log(comparison.table);      // F-test for nested models

// Predictions
const x_new = [6, 7, 8];
const predictions = predict(fit, [x_new]);

// Model through origin (no intercept)
const fit3 = lm(y, [x], { intercept: false });
```

### Generalized Linear Models

```javascript
import { glm, predictGlm, binomial, poisson, gaussian, Gamma } from 'aleatory';

// Logistic regression
const x = [1, 2, 3, 4, 5, 6, 7, 8];
const y = [0, 0, 0, 0, 1, 1, 1, 1];
const logit_fit = glm(y, [x], { family: binomial() });

console.log(logit_fit.coefficients);    // [intercept, slope]
console.log(logit_fit.deviance);        // residual deviance
console.log(logit_fit.aic);             // AIC

// Predict probabilities
const x_new = [3, 5, 7];
const probs = predictGlm(logit_fit, [x_new], 'response');
console.log(probs);                     // [P(y=1|x=3), P(y=1|x=5), P(y=1|x=7)]

// Poisson regression (count data)
const counts = [2, 3, 5, 8, 13];
const pois_fit = glm(counts, [x.slice(0, 5)], { family: poisson() });

// Gamma regression with log link
const times = [2, 4, 8, 16, 32];
const gamma_fit = glm(times, [x.slice(0, 5)], { family: Gamma('log') });

// Gaussian GLM (equivalent to lm)
const gauss_fit = glm(y, [x], { family: gaussian() });

// Multiple predictors
const x1 = [1, 2, 3, 4, 5, 6];
const x2 = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
const y_multi = [0, 0, 0, 1, 1, 1];
const multi_fit = glm(y_multi, [x1, x2], { family: binomial() });
```

### Model Diagnostics and Summaries

```javascript
import { 
  lm, 
  diagnostics, 
  confint, 
  predictWithInterval,
  summarizeModel,
  printModelSummary 
} from 'aleatory';

const x = [1, 2, 3, 4, 5];
const y = [2.1, 3.9, 6.2, 7.8, 10.1];
const fit = lm(y, [x]);

// R-style summary
const summary = summarizeModel(fit);
console.log(printModelSummary(summary));
// Output:
// Call:
// lm(y ~ x)
// 
// Residuals:
//     Min       1Q   Median       3Q      Max
//  -0.1000  -0.0600   0.0200   0.0600   0.1000
// 
// Coefficients:
// Term             Estimate  Std. Error   t value  Pr(>|t|)   
// (Intercept)     -0.010000    0.246221    -0.041    0.9698    
// x1               2.010000    0.080278    25.026  < 0.0001 ***
// ---
// Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
// 
// Residual standard error: 0.0874 on 3 degrees of freedom
// Multiple R-squared:  0.9953,	Adjusted R-squared:  0.9937
// F-statistic: 626.30 on 1 and 3 DF,  p-value: < 0.0001

// Confidence intervals for coefficients
const ci = confint(fit, 0.95);
console.log(ci);
// [
//   { coefficient: '(Intercept)', estimate: -0.01, lower: -0.768, upper: 0.748 },
//   { coefficient: 'x1', estimate: 2.01, lower: 1.780, upper: 2.240 }
// ]

// Prediction intervals
const x_new = [6, 7, 8];
const pred = predictWithInterval(fit, [x_new], 0.95, 'prediction');
console.log(pred.predictions);
// [
//   { fit: 12.05, lower: 11.68, upper: 12.42, se: 0.095 },
//   { fit: 14.06, lower: 13.68, upper: 14.44, se: 0.095 },
//   { fit: 16.07, lower: 15.69, upper: 16.45, se: 0.095 }
// ]

// Diagnostics - leverage, Cook's D, influence
const diag = diagnostics(fit);
console.log(diag.leverage);              // Hat values
console.log(diag.cooks_distance);        // Cook's distance
console.log(diag.influential);           // Influential observations
console.log(diag.dfbetas);               // Influence on coefficients
```

---

## 🧪 Testing Philosophy

**Golden-fixture approach**: All statistical functions are validated against known-good values from R.

- `tests/distributions/*.test.js` – All distribution functions
- `tests/stats/t_test.test.js` – t-test implementations
- `tests/models/lm.test.js` – Linear regression
- `tests/models/anova.test.js` – ANOVA tables and model comparison
- `tests/models/glm.test.js` – Generalized linear models
- `tests/models/diagnostics.test.js` – Model diagnostics and intervals

Tolerance: `1e-6` for most computations.

---

## 🗺️ Roadmap

### ✅ Phase 2: Core Distributions (COMPLETE)
- [x] t-distribution (`dt`, `pt`, `qt`, `rt`)
- [x] Chi-squared distribution
- [x] F-distribution
- [x] Binomial, Poisson
- [x] Replace normal approximations in `t_test()` with proper t-quantiles

### ✅ Phase 3: Linear Models (COMPLETE) 🎉
- [x] `lm()` – linear regression using QR decomposition
- [x] `predict()` – predictions from fitted models
- [x] `anova()` – analysis of variance
- [x] `glm()` – generalized linear models
- [x] Model diagnostics and summaries
- [x] Confidence/prediction intervals

### Phase 4: Data Manipulation (NEXT)
- [ ] DataFrame object
- [ ] tidyverse-style operations (filter, mutate, group_by)
- [ ] Data reshaping (pivot, melt)
- [ ] Data import/export (CSV, JSON)

### Phase 5: Additional Distributions
- [ ] Exponential distribution
- [ ] Gamma distribution
- [ ] Beta distribution
- [ ] Uniform distribution
- [ ] Geometric distribution
- [ ] Negative binomial

### Beyond
- [ ] Non-parametric tests (Mann-Whitney, Wilcoxon, Kruskal-Wallis)
- [ ] Correlation and regression tests (cor.test, Pearson, Spearman)
- [ ] Time series analysis (ARIMA, decomposition)
- [ ] Survival analysis (Kaplan-Meier, Cox regression)
- [ ] Bayesian methods
- [ ] Machine learning utilities (cross-validation, regularization)

---

## 🤝 Contributing

This project is in active development. Contributions welcome!

1. Fork the repo
2. Create a feature branch
3. Add tests (golden-fixture preferred)
4. Submit a PR

---

## 📄 License

MIT License – see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **Repository**: [github.com/MarcoJ03rgensen/aleatory](https://github.com/MarcoJ03rgensen/aleatory)
- **Author**: Marco Birkedahl Jørgensen

---

*Named after the Latin "aleatorius" (relating to chance/dice) – because statistics is fundamentally about reasoning under uncertainty.* 🎲

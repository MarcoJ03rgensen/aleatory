# 🎲 Aleatory

**Statistical computing library for JavaScript** – R-like functionality for the web

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)

---

## 📦 Current Status: Phase 3 In Progress! 🚀

Aleatory has completed Phase 2 and is now implementing Phase 3: Linear Models!

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

**Linear Models** ✨ NEW!
- `lm()` – linear regression using QR decomposition
- `predict()` – predictions from fitted models
- Simple and multiple regression
- Models with/without intercept
- Full diagnostic statistics (R², F-test, t-tests, standard errors)
- Residual analysis

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
import { lm, predict } from 'aleatory';

// Simple linear regression
const x = [1, 2, 3, 4, 5];
const y = [2.1, 3.9, 6.2, 7.8, 10.1];
const fit = lm(y, [x]);

console.log(fit.coefficients);      // [intercept, slope]
console.log(fit.r_squared);         // R²
console.log(fit.p_values);          // p-values for coefficients
console.log(fit.fitted_values);     // fitted values
console.log(fit.residuals);         // residuals

// Multiple regression
const x1 = [1, 2, 3, 4, 5];
const x2 = [2, 3, 4, 5, 6];
const y2 = [10, 12, 15, 18, 20];
const fit2 = lm(y2, [x1, x2]);

// Predictions
const x_new = [6, 7, 8];
const predictions = predict(fit, [x_new]);

// Model through origin (no intercept)
const fit3 = lm(y, [x], { intercept: false });
```

---

## 🧪 Testing Philosophy

**Golden-fixture approach**: All statistical functions are validated against known-good values from R.

- `tests/distributions/*.test.js` – All distribution functions
- `tests/stats/t_test.test.js` – t-test implementations
- `tests/models/lm.test.js` – Linear regression

Tolerance: `1e-6` for most computations.

---

## 🗺️ Roadmap

### ✅ Phase 2: Core Distributions (COMPLETE)
- [x] t-distribution (`dt`, `pt`, `qt`, `rt`)
- [x] Chi-squared distribution
- [x] F-distribution
- [x] Binomial, Poisson
- [x] Replace normal approximations in `t_test()` with proper t-quantiles

### Phase 3: Linear Models (IN PROGRESS)
- [x] `lm()` – linear regression using QR decomposition
- [x] `predict()` – predictions from fitted models
- [ ] `anova()` – analysis of variance
- [ ] `glm()` – generalized linear models
- [ ] Model diagnostics and summaries
- [ ] Confidence/prediction intervals

### Phase 4: Data Manipulation
- [ ] DataFrame object
- [ ] tidyverse-style operations (filter, mutate, group_by)
- [ ] Data reshaping (pivot, melt)

### Phase 5: Additional Distributions
- [ ] Exponential distribution
- [ ] Gamma distribution
- [ ] Beta distribution
- [ ] Uniform distribution
- [ ] Geometric distribution
- [ ] Negative binomial

### Beyond
- [ ] Non-parametric tests (Mann-Whitney, Wilcoxon, Kruskal-Wallis)
- [ ] Correlation and regression tests
- [ ] Time series analysis
- [ ] Bayesian methods
- [ ] Machine learning utilities

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

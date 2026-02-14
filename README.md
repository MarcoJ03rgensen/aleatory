# 🎲 Aleatory

**Statistical computing library for JavaScript** – R-like functionality for the web

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)

---

## 📦 Current Status: Phase 2 Complete! 🎉

Aleatory has completed Phase 2 of development. All core statistical distributions are now implemented!

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
- ✅ Now uses proper t-distribution (no approximations!)

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

## 📖 Quick Examples

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

// F-distribution (for ANOVA)
df(2.5, 5, 10);                  // F density
pf(2.5, 5, 10);                  // P(F ≤ 2.5)
qf(0.95, 5, 10);                 // 95th percentile

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

---

## 🧪 Testing Philosophy

**Golden-fixture approach**: All statistical functions are validated against known-good values from R.

- `tests/distributions/*.test.js` – All distribution functions
- `tests/stats/t_test.test.js` – t-test implementations

Tolerance: `1e-6` for most computations.

---

## 🗺️ Roadmap

### ✅ Phase 2: Core Distributions (COMPLETE)
- [x] t-distribution (`dt`, `pt`, `qt`, `rt`)
- [x] Chi-squared distribution
- [x] F-distribution
- [x] Binomial, Poisson
- [x] Replace normal approximations in `t_test()` with proper t-quantiles

### Phase 3: Linear Models
- [ ] `lm()` – linear regression
- [ ] `glm()` – generalized linear models
- [ ] `anova()` – analysis of variance
- [ ] Model diagnostics and summaries

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

# 🎲 Aleatory

**Statistical computing library for JavaScript** – R-like functionality for the web

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)

---

## 📦 Current Status: Phase 1 Kernel

Aleatory is in active early development. Current implementation includes:

### ✅ Implemented

**Core Objects**
- `Vector` – numeric vectors with NA support
- `Factor` – categorical data with levels

**Base Functions**
- `summary()` – R-style summaries for Vector and Factor
- Statistical helpers: `mean()`, `sd()`, `var()`, `min()`, `max()`, `na_omit()`

**Distribution Functions**
- Normal distribution: `dnorm()`, `pnorm()`, `qnorm()`, `rnorm()`
- Full R-compatible interface with `mean`, `sd`, `lower_tail`, `log_p` parameters

**Statistical Tests**
- `t_test()` – Student's t-test (one-sample, two-sample, paired)
- Welch's t-test for unequal variances
- ⚠️ Currently uses normal approximation for p-values (t-distribution coming soon)

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
const { Vector, dnorm, pnorm, qnorm, rnorm, t_test } = aleatory;

// Normal distribution
dnorm(0);                        // 0.3989 (density at x=0)
pnorm(1.96);                     // 0.975 (P(Z ≤ 1.96))
qnorm(0.975);                    // 1.96 (97.5th percentile)
const samples = rnorm(100, { mean: 10, sd: 2 });

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

- `tests/distributions/normal.test.js` – Normal distribution functions
- `tests/stats/t_test.test.js` – t-test implementations

Tolerance: `1e-6` for most computations, `1e-4` for tests using normal approximation placeholders.

---

## 🗺️ Roadmap

### Phase 2: Core Distributions
- [ ] t-distribution (`dt`, `pt`, `qt`, `rt`)
- [ ] Chi-squared distribution
- [ ] F-distribution
- [ ] Binomial, Poisson
- [ ] Replace normal approximations in `t_test()` with proper t-quantiles

### Phase 3: Linear Models
- [ ] `lm()` – linear regression
- [ ] `glm()` – generalized linear models
- [ ] `anova()` – analysis of variance

### Phase 4: Data Manipulation
- [ ] DataFrame object
- [ ] tidyverse-style operations (filter, mutate, group_by)

### Beyond
- [ ] Time series analysis
- [ ] Bayesian methods
- [ ] Machine learning utilities

---

## 🤝 Contributing

This project is in early development. Contributions welcome!

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

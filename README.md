# 🎲 Aleatory

**Statistical computing library for JavaScript** – R-like functionality for the web

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![CI](https://github.com/MarcoJ03rgensen/aleatory/workflows/CI/badge.svg)](https://github.com/MarcoJ03rgensen/aleatory/actions)

---

## 📦 Current Status: Phase 4 COMPLETE! 🎉

Aleatory has successfully completed **Phase 4: Data Manipulation**! Now featuring a full-powered DataFrame with tidyverse-style operations, window functions, and seamless integration with statistical models.

### ✅ Implemented

**Core Objects**
- `Vector` – numeric vectors with NA support
- `Factor` – categorical data with levels
- `DataFrame` – tabular data structure with R/tidyverse-style operations ✨ NEW!

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

**Linear Models**
- `lm()` – linear regression using QR decomposition
- `predict()` – predictions from fitted models
- `anova()` – analysis of variance tables and model comparison
- `printAnova()` – formatted ANOVA output
- Simple and multiple regression
- Models with/without intercept
- Full diagnostic statistics (R², F-test, t-tests, standard errors)
- Residual analysis

**Generalized Linear Models**
- `glm()` – generalized linear models using IRWLS
- `predictGlm()` – predictions with link/response options
- **Families**: `gaussian()`, `binomial()`, `poisson()`, `Gamma()`
- **Link functions**: identity, log, logit, probit, inverse, sqrt
- Full GLM diagnostics: deviance, AIC, multiple residual types
- Convergence checking and iteration control

**Model Diagnostics & Summaries**
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

**DataFrame Operations** ✨ NEW!
- `DataFrame` – column-oriented tabular data structure
- `select()` – select columns
- `filter()` – filter rows by condition
- `mutate()` – add or modify columns
- `arrange()` – sort by one or more columns
- `groupBy()` – group data for aggregation
- `summarize()` – aggregate grouped data
- `rename()` – rename columns
- `head()` / `tail()` – preview data
- `slice()` – subset by row indices

**Window Functions** ✨ NEW!
- `row_number()` – row numbers within groups
- `rank()` – ranking with tie handling
- `lag()` / `lead()` – access previous/next values
- `cumsum()` – cumulative sum
- `cummean()` – cumulative mean
- `first()` / `last()` – first/last value in groups
- All support partitioning for grouped operations

**Data Reshaping** ✨ NEW!
- `pivotLonger()` / `pivotWider()` – reshape data
- `separate()` / `unite()` – split/combine columns
- `dropNA()` / `fillNA()` – handle missing data

**Data Joins** ✨ NEW!
- `innerJoin()`, `leftJoin()`, `rightJoin()`, `fullJoin()`
- `semiJoin()`, `antiJoin()` – filtering joins
- `bindRows()`, `bindCols()` – combine DataFrames

**Data I/O** ✨ NEW!
- `readCSV()` / `writeCSV()` – CSV import/export
- `readJSON()` / `writeJSON()` – JSON import/export

**Functional Composition** ✨ NEW!
- `pipe()` – functional composition of operations
- `chain()` – method chaining wrapper

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

# Or try the new DataFrame demo!
node examples/dataframe_demo.js
```

### Run Tests

```bash
npm test
```

Golden-fixture tests validate against reference values from **R 4.3.0**.

---

## 📚 Quick Examples

### DataFrame Operations

```javascript
import { DataFrame, chain, pipe } from 'aleatory';

// Create a DataFrame
const df = new DataFrame({
  name: ['Alice', 'Bob', 'Charlie', 'Diana'],
  age: [25, 30, 35, 28],
  salary: [50000, 60000, 75000, 55000],
  dept: ['Engineering', 'Sales', 'Engineering', 'Sales']
});

// Basic operations
const filtered = df
  .filter(row => row.age >= 28)
  .select('name', 'age', 'salary')
  .arrange('salary', { decreasing: true });

console.log(filtered.toString());
// DataFrame [3 x 3]
// name <factor>  age <numeric>  salary <numeric>
// ------------------------------------------------
// Charlie        35.00          75000.00
// Diana          28.00          55000.00
// Bob            30.00          60000.00

// Method chaining
const result = chain(df)
  .filter(row => row.salary > 50000)
  .mutate({
    salary_k: row => row.salary / 1000
  })
  .groupBy('dept')
  .value()
  .summarize({
    avg_salary: gdf => {
      const salaries = gdf.colArray('salary');
      return salaries.reduce((a, b) => a + b) / salaries.length;
    }
  });

// Functional composition
const addBonus = df => df.mutate({ bonus: row => row.salary * 0.1 });
const filterSenior = df => df.filter(row => row.age >= 30);

const seniorWithBonus = pipe(df, filterSenior, addBonus);
```

### Window Functions

```javascript
import { DataFrame, lag, lead, cumsum, rank } from 'aleatory';

const timeSeries = new DataFrame({
  date: ['2024-01', '2024-02', '2024-03', '2024-04'],
  value: [100, 120, 115, 130]
});

// Add window function columns
const withWindows = timeSeries.mutate({
  previous: () => lag(timeSeries, 'value', 1, null),
  next: () => lead(timeSeries, 'value', 1, null),
  running_total: () => cumsum(timeSeries, 'value'),
  rank: () => rank(timeSeries, 'value', [], true) // decreasing
});

console.log(withWindows.toString());

// Grouped window functions
const sales = new DataFrame({
  product: ['A', 'A', 'B', 'B'],
  month: [1, 2, 1, 2],
  revenue: [100, 120, 80, 95]
});

const ranked = sales.mutate({
  rank_in_product: () => rank(sales, 'revenue', ['product'], true),
  cumulative: () => cumsum(sales, 'revenue', ['product'])
});
```

### Distribution Functions

```javascript
import { dnorm, pnorm, qnorm, rnorm, dbinom, dpois } from 'aleatory';

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
import { t_test } from 'aleatory';

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
import { lm, predict, anova, DataFrame } from 'aleatory';

// Simple linear regression
const x = [1, 2, 3, 4, 5];
const y = [2.1, 3.9, 6.2, 7.8, 10.1];
const fit = lm(y, [x]);

console.log(fit.coefficients);      // [intercept, slope]
console.log(fit.r_squared);         // R²
console.log(fit.p_values);          // p-values for coefficients

// Use with DataFrame
const df = new DataFrame({ x, y });
const X = df.colArray('x');
const Y = df.colArray('y');
const model = lm(Y, [X]);

// Add predictions back to DataFrame
const withPred = df.mutate({
  predicted: model.fitted_values,
  residual: model.residuals
});

// ANOVA table
const aov = anova(fit);
console.log(aov.table);             // ANOVA decomposition

// Multiple regression
const x1 = [1, 2, 3, 4, 5];
const x2 = [2, 3, 4, 5, 6];
const y2 = [10, 12, 15, 18, 20];
const fit2 = lm(y2, [x1, x2]);
```

### Generalized Linear Models

```javascript
import { glm, predictGlm, binomial, poisson, DataFrame } from 'aleatory';

// Logistic regression
const creditData = new DataFrame({
  income: [30, 45, 60, 75, 90, 105, 120, 135],
  debt: [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1],
  approved: [0, 0, 0, 0, 1, 1, 1, 1]
});

const X = [creditData.colArray('income'), creditData.colArray('debt')];
const y = creditData.colArray('approved');

const logit_fit = glm(y, X, { family: binomial() });

console.log(logit_fit.coefficients);    // [intercept, income, debt]
console.log(logit_fit.deviance);        // residual deviance
console.log(logit_fit.aic);             // AIC

// Predict probabilities
const x_new = [[50, 70, 90], [0.6, 0.4, 0.3]];
const probs = predictGlm(logit_fit, x_new, 'response');

// Poisson regression (count data)
const counts = [2, 3, 5, 8, 13];
const pois_fit = glm(counts, [x.slice(0, 5)], { family: poisson() });
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
- `tests/data/dataframe.test.js` – DataFrame operations ✨ NEW!
- `tests/data/window.test.js` – Window functions ✨ NEW!

Tolerance: `1e-6` for most computations.

---

## 🗺️ Roadmap

### ✅ Phase 2: Core Distributions (COMPLETE)
- [x] t-distribution (`dt`, `pt`, `qt`, `rt`)
- [x] Chi-squared distribution
- [x] F-distribution
- [x] Binomial, Poisson
- [x] Replace normal approximations in `t_test()` with proper t-quantiles

### ✅ Phase 3: Linear Models (COMPLETE)
- [x] `lm()` – linear regression using QR decomposition
- [x] `predict()` – predictions from fitted models
- [x] `anova()` – analysis of variance
- [x] `glm()` – generalized linear models
- [x] Model diagnostics and summaries
- [x] Confidence/prediction intervals

### ✅ Phase 4: Data Manipulation (COMPLETE) 🎉
- [x] DataFrame object
- [x] tidyverse-style operations (filter, mutate, group_by, summarize)
- [x] Window functions (lag, lead, rank, cumsum, etc.)
- [x] Data reshaping (pivot, separate, unite)
- [x] Data joins (inner, left, right, full, semi, anti)
- [x] Data import/export (CSV, JSON)
- [x] Method chaining and functional composition

### Phase 5: Additional Distributions (NEXT)
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

## 📜 License

MIT License – see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **Repository**: [github.com/MarcoJ03rgensen/aleatory](https://github.com/MarcoJ03rgensen/aleatory)
- **Author**: Marco Birkedahl Jørgensen
- **CI/CD**: Automated testing on Node.js 18.x, 20.x, 22.x

---

*Named after the Latin "aleatorius" (relating to chance/dice) – because statistics is fundamentally about reasoning under uncertainty.* 🎲

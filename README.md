# 🎲 Aleatory

**Statistical computing library for JavaScript** – R-like functionality for the web

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![CI](https://github.com/MarcoJ03rgensen/aleatory/workflows/CI/badge.svg)](https://github.com/MarcoJ03rgensen/aleatory/actions)

---

## 📦 Current Status: Phase 5 - Visualization! 🎨

Aleatory now features a **comprehensive visualization module** with beautiful, publication-quality charts for every statistical feature!

### ✅ Implemented

**Core Objects**
- `Vector` – numeric vectors with NA support
- `Factor` – categorical data with levels
- `DataFrame` – tabular data structure with R/tidyverse-style operations

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

**DataFrame Operations**
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

**Window Functions**
- `row_number()` – row numbers within groups
- `rank()` – ranking with tie handling
- `lag()` / `lead()` – access previous/next values
- `cumsum()` – cumulative sum
- `cummean()` – cumulative mean
- `first()` / `last()` – first/last value in groups
- All support partitioning for grouped operations

**Data Reshaping**
- `pivotLonger()` / `pivotWider()` – reshape data
- `separate()` / `unite()` – split/combine columns
- `dropNA()` / `fillNA()` – handle missing data

**Data Joins**
- `innerJoin()`, `leftJoin()`, `rightJoin()`, `fullJoin()`
- `semiJoin()`, `antiJoin()` – filtering joins
- `bindRows()`, `bindCols()` – combine DataFrames

**Data I/O**
- `readCSV()` / `writeCSV()` – CSV import/export
- `readJSON()` / `writeJSON()` – JSON import/export

**Functional Composition**
- `pipe()` – functional composition of operations
- `chain()` – method chaining wrapper

**Visualization Module** ✨ NEW!
- `createHistogram()` – histograms with density overlays
- `createDensityPlot()` – kernel density estimation
- `createQQPlot()` – Q-Q plots for normality assessment
- `createDistributionPlot()` – distribution function plots
- `createScatterPlot()` – scatter plots with regression lines
- `createResidualsPlot()` – residuals vs fitted diagnostic plots
- `createFittedPlot()` – observed vs fitted plots
- `createLeveragePlot()` – Cook's distance and leverage plots
- `createBoxPlot()` – box plots for categorical comparisons
- `createViolinPlot()` – violin plots with density
- `createBarPlot()` – bar plots
- `createHeatmap()` – heatmaps for matrix data
- `createCorrelationMatrix()` – correlation matrix heatmaps
- **6 Built-in Themes**: default, dark, minimal, colorblind, publication, ggplot2
- **Full Customization**: colors, fonts, sizes, scales, interactions
- **Export-ready**: SVG, PNG with configurable DPI

---

## 🚀 Installation & Usage

### Using CDN (Recommended for Web)

Include Aleatory in any webpage using the CDN:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Aleatory Project</title>
    <!-- Include Plotly.js for visualization -->
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <!-- Include Aleatory from your custom domain -->
    <script src="https://aleatory.marcojorgensen.com/dist/aleatory.min.js"></script>
</head>
<body>
    <div id="plot"></div>
    
    <script>
        // Aleatory is now available globally
        const data = aleatory.rnorm(100);
        const config = aleatory.vis.applyTheme('publication');
        const fig = aleatory.vis.createHistogram(data, config, {
            showDensity: true,
            showNormal: true
        });
        Plotly.newPlot('plot', fig.data, fig.layout);
    </script>
</body>
</html>
```

### ES Module Import

```html
<script type="module">
    import * as aleatory from 'https://aleatory.marcojorgensen.com/src/index.js';
    
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 5, 4, 5];
    const fit = aleatory.lm(y, [x]);
    console.log('R² =', fit.r_squared);
</script>
```

### Local Development

```bash
git clone https://github.com/MarcoJ03rgensen/aleatory
cd aleatory
npm install  # (no dependencies yet)
```

### Run the Demo

```bash
npm run dev

# Or try the new visualization gallery!
open examples/visualization_gallery.html

# Or run the Node.js vis demo
node examples/vis_demo.js
```

### Run Tests

```bash
npm test
```

Golden-fixture tests validate against reference values from **R 4.3.0**.

---

## 📚 Quick Examples

### Visualization Examples

```javascript
import * as aleatory from 'aleatory';

// Generate sample data
const data = aleatory.rnorm(200, { mean: 0, sd: 1 });

// Create themed configuration
const config = aleatory.vis.applyTheme('publication');

// Histogram with density overlay
const histFig = aleatory.vis.createHistogram(data, config, {
  title: 'Normal Distribution',
  showDensity: true,
  showNormal: true,
  xlab: 'Value',
  ylab: 'Density'
});
Plotly.newPlot('plot1', histFig.data, histFig.layout);

// Q-Q plot for normality assessment
const qqFig = aleatory.vis.createQQPlot(data, config);
Plotly.newPlot('plot2', qqFig.data, qqFig.layout);

// Regression with diagnostics
const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const y = [2.1, 3.9, 6.2, 7.8, 10.1, 11.9, 14.2, 15.8, 18.1, 19.9];
const fit = aleatory.lm(y, [x]);

// Scatter plot with regression line
const scatterFig = aleatory.vis.createScatterPlot({ x, y }, config, {
  fit: fit,
  title: 'Linear Regression',
  xlab: 'X',
  ylab: 'Y'
});
Plotly.newPlot('plot3', scatterFig.data, scatterFig.layout);

// Residuals diagnostic plot
const residualsFig = aleatory.vis.createResidualsPlot(fit, config, {
  showSmooth: true
});
Plotly.newPlot('plot4', residualsFig.data, residualsFig.layout);

// Custom theme
const customTheme = aleatory.vis.createTheme({
  colors: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    background: '#F7FFF7'
  },
  lineWidth: 3,
  markerSize: 8
});

const customFig = aleatory.vis.createDensityPlot(data, customTheme, {
  fill: true
});
Plotly.newPlot('plot5', customFig.data, customFig.layout);
```

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

// Visualize grouped data
const boxFig = aleatory.vis.createBoxPlot(df, config, {
  groupBy: 'dept',
  y: 'salary',
  title: 'Salary by Department',
  showMean: true
});
Plotly.newPlot('plot', boxFig.data, boxFig.layout);
```

### Distribution Functions

```javascript
import { dnorm, pnorm, qnorm, rnorm, dbinom, dpois } from 'aleatory';

// Normal distribution
dnorm(0);                        // 0.3989 (density at x=0)
pnorm(1.96);                     // 0.975 (P(Z ≤ 1.96))
qnorm(0.975);                    // 1.96 (97.5th percentile)
const samples = rnorm(100, { mean: 10, sd: 2 });

// Visualize distribution
const distFig = aleatory.vis.createDistributionPlot(aleatory.dnorm, config, {
  xMin: -4,
  xMax: 4,
  params: [0, 1],
  title: 'Standard Normal Distribution'
});
Plotly.newPlot('plot', distFig.data, distFig.layout);
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

// Comprehensive diagnostic plots
const diag = aleatory.diagnostics(fit);
const leverageFig = aleatory.vis.createLeveragePlot(diag, config);
Plotly.newPlot('plot', leverageFig.data, leverageFig.layout);
```

---

## 🎨 Visualization Themes

Aleatory includes 6 professional themes:

- **default** – Modern, colorful (default)
- **dark** – Dark background with vibrant colors
- **minimal** – Clean, monochromatic
- **colorblind** – ColorBrewer colorblind-safe palette
- **publication** – Nature/Science journal style
- **ggplot2** – R ggplot2 aesthetic

```javascript
// Use a built-in theme
const config = aleatory.vis.applyTheme('publication');

// Or create a custom theme
const customConfig = aleatory.vis.createTheme({
  width: 1200,
  height: 800,
  colors: { primary: '#FF5733', secondary: '#33FF57' },
  fonts: { title: { size: 24 } },
  lineWidth: 3
});
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
- `tests/data/dataframe.test.js` – DataFrame operations
- `tests/data/window.test.js` – Window functions

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

### ✅ Phase 4: Data Manipulation (COMPLETE)
- [x] DataFrame object
- [x] tidyverse-style operations (filter, mutate, group_by, summarize)
- [x] Window functions (lag, lead, rank, cumsum, etc.)
- [x] Data reshaping (pivot, separate, unite)
- [x] Data joins (inner, left, right, full, semi, anti)
- [x] Data import/export (CSV, JSON)
- [x] Method chaining and functional composition

### ✅ Phase 5: Visualization (IN PROGRESS) 🎨
- [x] Core visualization infrastructure
- [x] Distribution plots (histogram, density, Q-Q)
- [x] Regression diagnostics (scatter, residuals, leverage)
- [x] Categorical plots (box, violin, bar)
- [x] Matrix visualizations (heatmap, correlation)
- [x] Theme system (6 built-in themes)
- [x] Interactive gallery
- [ ] Additional plot types (pair plots, forest plots)
- [ ] Animation support
- [ ] 3D visualizations

### Phase 6: Additional Distributions (NEXT)
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
- **CDN**: [aleatory.marcojorgensen.com](https://aleatory.marcojorgensen.com)
- **Visualization Gallery**: [aleatory.marcojorgensen.com/examples/visualization_gallery.html](https://aleatory.marcojorgensen.com/examples/visualization_gallery.html)
- **Author**: Marco Birkedahl Jørgensen
- **CI/CD**: Automated testing on Node.js 18.x, 20.x, 22.x

---

*Named after the Latin "aleatorius" (relating to chance/dice) – because statistics is fundamentally about reasoning under uncertainty.* 🎲

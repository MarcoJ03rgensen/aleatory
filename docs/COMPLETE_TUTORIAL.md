# 📚 Complete Aleatory Tutorial

**A comprehensive guide to statistical computing in JavaScript**

This tutorial walks through every feature in Aleatory, from basic operations to advanced statistical modeling. Each section includes detailed explanations, practical examples, and test datasets you can use immediately.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Core Objects: Vector and Factor](#2-core-objects-vector-and-factor)
3. [Base Statistical Functions](#3-base-statistical-functions)
4. [Distribution Functions](#4-distribution-functions)
5. [Statistical Tests](#5-statistical-tests)
6. [Linear Models](#6-linear-models)
7. [Generalized Linear Models](#7-generalized-linear-models)
8. [Model Diagnostics](#8-model-diagnostics)
9. [DataFrame Operations](#9-dataframe-operations)
10. [Data Reshaping](#10-data-reshaping)
11. [Data Joins](#11-data-joins)
12. [Window Functions](#12-window-functions)
13. [R Dataset Compatibility](#13-r-dataset-compatibility)
14. [Visualization](#14-visualization)
15. [Real-World Examples](#15-real-world-examples)

---

## 1. Getting Started

### Installation Methods

#### Option A: CDN (Browser)

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <script src="https://aleatory.marcojorgensen.com/dist/aleatory.min.js"></script>
</head>
<body>
    <script>
        // Aleatory is available globally
        const data = aleatory.rnorm(100);
        console.log('Mean:', aleatory.mean(data));
    </script>
</body>
</html>
```

#### Option B: ES Module (Browser)

```html
<script type="module">
    import * as aleatory from 'https://aleatory.marcojorgensen.com/src/index.js';
    
    const x = aleatory.c([1, 2, 3, 4, 5]);
    console.log('Sum:', x.sum());
</script>
```

#### Option C: Local Development (Node.js)

```bash
git clone https://github.com/MarcoJ03rgensen/aleatory
cd aleatory
npm install
node examples/demo.js
```

---

## 2. Core Objects: Vector and Factor

### 2.1 Vector - Numeric Data

The `Vector` class is the fundamental data structure in Aleatory, similar to R's atomic vectors.

```javascript
import { Vector, c } from 'aleatory';

// Create a vector
const v1 = new Vector([1, 2, 3, 4, 5]);
const v2 = c([1, 2, 3, 4, 5]);  // Shorthand, like R's c()

console.log(v1.toString());
// Output: [1.00, 2.00, 3.00, 4.00, 5.00]
```

**What it does**: Vector stores numeric data and provides methods for statistical operations. It automatically handles missing values (`NA`).

#### Vector Operations

```javascript
const x = c([10, 20, 30, 40, 50]);

// Basic statistics
console.log('Mean:', x.mean());        // 30
console.log('Sum:', x.sum());          // 150
console.log('Variance:', x.variance()); // 250
console.log('SD:', x.sd());            // 15.81
console.log('Min:', x.min());          // 10
console.log('Max:', x.max());          // 50

// Element access
console.log('First element:', x.get(0));   // 10
console.log('Length:', x.length);          // 5

// Vector arithmetic
const y = c([1, 2, 3, 4, 5]);
const z = x.add(y);  // Element-wise addition
console.log(z.toString());
// Output: [11.00, 22.00, 33.00, 44.00, 55.00]
```

#### Handling Missing Values

```javascript
import { c, na_omit } from 'aleatory';

// Create vector with NA values
const withNA = c([1, 2, null, 4, 5]);

console.log('Mean (with NA):', withNA.mean());      // 3 (NA ignored by default)
console.log('Mean (NA fails):', withNA.mean(false)); // NaN

// Remove NA values
const cleaned = na_omit(withNA);
console.log(cleaned.toString());
// Output: [1.00, 2.00, 4.00, 5.00]
```

**Why it matters**: Real-world data often has missing values. Vector handles this automatically using R's `na.rm` convention.

### 2.2 Factor - Categorical Data

Factors represent categorical variables with defined levels (like R factors).

```javascript
import { Factor, factor } from 'aleatory';

// Create a factor
const gender = factor(['Male', 'Female', 'Female', 'Male', 'Male']);

console.log(gender.toString());
// Output: [Male, Female, Female, Male, Male]
// Levels: Female Male

console.log('Levels:', gender.levels);     // ['Female', 'Male']
console.log('Length:', gender.length);     // 5
```

**What it does**: Factors efficiently store categorical data and track unique categories (levels).

#### Factor with Explicit Levels

```javascript
// Define levels explicitly (useful for ordered categories)
const education = factor(
    ['High School', 'Bachelor', 'High School', 'Master'],
    ['High School', 'Bachelor', 'Master', 'PhD']  // All possible levels
);

console.log('Levels:', education.levels);
// Output: ['High School', 'Bachelor', 'Master', 'PhD']
// Note: 'PhD' is included even though it's not in the data
```

#### Factor Statistics

```javascript
import { summary } from 'aleatory';

const dept = factor(['Sales', 'Engineering', 'Sales', 'HR', 'Engineering', 'Sales']);

const s = summary(dept);
console.log(s);
// Output:
// Factor with 3 levels:
//   Engineering: 2
//   HR: 1
//   Sales: 3
```

**Use case**: Factors are essential for regression models with categorical predictors and for grouping in DataFrames.

---

## 3. Base Statistical Functions

Aleatory provides R-style convenience functions for common operations.

### Test Dataset: Student Exam Scores

```javascript
import { c, mean, sd, var_, sum, min, max, summary } from 'aleatory';

// Exam scores for 10 students
const scores = c([78, 85, 92, 68, 95, 73, 88, 91, 76, 84]);

// Calculate statistics
console.log('Mean score:', mean(scores));          // 83
console.log('Standard deviation:', sd(scores));     // 8.76
console.log('Variance:', var_(scores));            // 76.67
console.log('Total points:', sum(scores));         // 830
console.log('Lowest score:', min(scores));         // 68
console.log('Highest score:', max(scores));        // 95

// Comprehensive summary
const s = summary(scores);
console.log(s);
// Output:
// Min: 68.00
// Q1: 76.50
// Median: 84.50
// Mean: 83.00
// Q3: 90.75
// Max: 95.00
```

**What each function tells you**:
- `mean()`: Average score - central tendency
- `sd()`: How spread out scores are - variability measure
- `var_()`: Variance (SD squared) - used in statistical tests
- `sum()`: Total of all values
- `min()`/`max()`: Range boundaries
- `summary()`: Five-number summary plus mean - complete overview

### Using with NA Values

```javascript
const scoresWithAbsent = c([78, 85, null, 68, 95, null, 88, 91, 76, 84]);

console.log('Mean (NA removed):', mean(scoresWithAbsent, { na_rm: true }));
// Output: 83.13

console.log('Mean (NA not removed):', mean(scoresWithAbsent, { na_rm: false }));
// Output: NaN
```

**Default behavior**: By default, `na_rm = true`, so NA values are automatically ignored.

---

## 4. Distribution Functions

Aleatory implements probability distributions with R's four-function interface:
- `d*()` - density/mass function
- `p*()` - cumulative distribution function (CDF)
- `q*()` - quantile function (inverse CDF)
- `r*()` - random number generation

### 4.1 Normal Distribution

The normal (Gaussian) distribution is the foundation of parametric statistics.

```javascript
import { dnorm, pnorm, qnorm, rnorm } from 'aleatory';

// Density: P(X = x) for continuous distributions
console.log('Density at 0:', dnorm(0));              // 0.3989 (peak of standard normal)
console.log('Density at 1:', dnorm(1));              // 0.2420
console.log('Density at 1.96:', dnorm(1.96));        // 0.0584

// CDF: P(X ≤ x)
console.log('P(Z ≤ 0):', pnorm(0));                  // 0.5 (median)
console.log('P(Z ≤ 1.96):', pnorm(1.96));            // 0.975 (95th percentile)
console.log('P(Z ≤ -1.96):', pnorm(-1.96));          // 0.025 (2.5th percentile)

// Quantile: Find x where P(X ≤ x) = p
console.log('95th percentile:', qnorm(0.95));        // 1.645
console.log('97.5th percentile:', qnorm(0.975));     // 1.96 (critical value for 95% CI)

// Random sampling
const samples = rnorm(1000, { mean: 100, sd: 15 });  // IQ scores
console.log('Sample mean:', mean(samples));          // ≈ 100
console.log('Sample SD:', sd(samples));              // ≈ 15
```

**Real-world example**: IQ scores follow a normal distribution with mean 100 and SD 15.

```javascript
// What percentage of people have IQ above 130?
const pAbove130 = 1 - pnorm(130, { mean: 100, sd: 15 });
console.log('P(IQ > 130):', pAbove130);  // 0.0228 (2.28%, about 1 in 44)

// What IQ score is at the 90th percentile?
const iq90 = qnorm(0.90, { mean: 100, sd: 15 });
console.log('90th percentile IQ:', iq90);  // 119.2
```

### 4.2 Student's t-Distribution

Used when sample size is small or population variance is unknown.

```javascript
import { dt, pt, qt, rt } from 'aleatory';

const df = 9;  // degrees of freedom (n - 1 for sample of 10)

// Critical value for 95% confidence interval
const tCrit = qt(0.975, { df });
console.log('t(9, 0.975):', tCrit);  // 2.262

// Compare to normal distribution
const zCrit = qnorm(0.975);
console.log('z(0.975):', zCrit);     // 1.96
// t-distribution has fatter tails (2.262 > 1.96)
```

**Why it matters**: Small samples (n < 30) require t-distribution instead of normal for accurate confidence intervals.

### 4.3 Chi-Squared Distribution

Used in goodness-of-fit tests and variance tests.

```javascript
import { dchisq, pchisq, qchisq, rchisq } from 'aleatory';

// Test statistic from chi-square test
const chiSq = 7.815;
const df = 3;

const pValue = 1 - pchisq(chiSq, { df });
console.log('p-value:', pValue);  // 0.050 (exactly at significance threshold)

// Critical value for α = 0.05
const chiCrit = qchisq(0.95, { df });
console.log('Critical value:', chiCrit);  // 7.815
```

### 4.4 F-Distribution

Used in ANOVA and regression F-tests.

```javascript
import { df as dF, pf, qf, rf } from 'aleatory';

// ANOVA F-statistic
const fStat = 4.256;
const df1 = 2;   // numerator df (groups - 1)
const df2 = 27;  // denominator df (total - groups)

const pValue = 1 - pf(fStat, { df1, df2 });
console.log('ANOVA p-value:', pValue);  // 0.0245 (significant at α = 0.05)
```

### 4.5 Binomial Distribution

Discrete distribution for number of successes in n trials.

```javascript
import { dbinom, pbinom, qbinom, rbinom } from 'aleatory';

// Coin flips: What's probability of exactly 7 heads in 10 flips?
const prob7heads = dbinom(7, { size: 10, prob: 0.5 });
console.log('P(X = 7):', prob7heads);  // 0.117 (11.7%)

// What's probability of 7 or fewer heads?
const probAtMost7 = pbinom(7, { size: 10, prob: 0.5 });
console.log('P(X ≤ 7):', probAtMost7);  // 0.945

// Simulate 1000 experiments of 10 coin flips each
const experiments = rbinom(1000, { size: 10, prob: 0.5 });
console.log('Mean successes:', mean(experiments));  // ≈ 5 (n × p)
```

**Real-world example**: Quality control - if 5% of products are defective, what's the probability that a sample of 20 has 2 or more defects?

```javascript
const pDefective = 1 - pbinom(1, { size: 20, prob: 0.05 });
console.log('P(X ≥ 2 defects):', pDefective);  // 0.264 (26.4%)
```

### 4.6 Poisson Distribution

Discrete distribution for count data (events per time period).

```javascript
import { dpois, ppois, qpois, rpois } from 'aleatory';

// Website gets average 3 visitors per minute
const lambda = 3;

// Probability of exactly 5 visitors in next minute?
const prob5 = dpois(5, { lambda });
console.log('P(X = 5):', prob5);  // 0.101

// Probability of 2 or fewer visitors?
const probAtMost2 = ppois(2, { lambda });
console.log('P(X ≤ 2):', probAtMost2);  // 0.423

// Simulate visitor counts for 100 minutes
const visitors = rpois(100, { lambda });
console.log('Average visitors/min:', mean(visitors));  // ≈ 3
```

---

## 5. Statistical Tests

### 5.1 Student's t-Test

Compares means to test hypotheses about population parameters.

#### One-Sample t-Test

Tests if sample mean differs from hypothesized value.

```javascript
import { t_test, c } from 'aleatory';

// Manufacturer claims batteries last 100 hours
// Test 12 batteries:
const batteryLife = c([98, 102, 101, 97, 103, 99, 105, 100, 96, 104, 101, 98]);

// H0: μ = 100 vs H1: μ ≠ 100
const result = t_test(batteryLife, null, { mu: 100 });

console.log('Test statistic:', result.statistic.t);    // -0.268
console.log('p-value:', result.p_value);               // 0.793
console.log('Sample mean:', result.estimate.mean);     // 100.33
console.log('95% CI:', result.conf_int);               // [98.32, 102.35]

// Interpretation: p > 0.05, fail to reject H0
// No evidence batteries differ from claimed 100 hours
```

**What the output means**:
- **t-statistic**: How many standard errors the sample mean is from hypothesized mean
- **p-value**: Probability of observing this result if H0 is true
- **95% CI**: Range where true population mean likely lies

#### Two-Sample t-Test

Compares means of two independent groups.

```javascript
// Compare two teaching methods
const methodA = c([78, 85, 82, 79, 88, 84, 81, 86]);  // Traditional
const methodB = c([88, 92, 89, 91, 95, 87, 93, 90]);  // New method

const result = t_test(methodA, methodB);

console.log('Difference in means:', result.estimate.mean_x - result.estimate.mean_y);
// Output: -7.25 (Method B scores 7.25 points higher)

console.log('p-value:', result.p_value);  // 0.0003 (highly significant)
console.log('95% CI for difference:', result.conf_int);  // [-10.68, -3.82]

// Interpretation: New method significantly improves scores
```

#### Paired t-Test

Compares measurements on same subjects before/after intervention.

```javascript
// Blood pressure before and after medication
const before = c([145, 138, 152, 148, 140, 155, 142, 149]);
const after  = c([132, 130, 140, 138, 128, 142, 135, 139]);

const result = t_test(before, after, { paired: true });

console.log('Mean reduction:', result.estimate.mean);  // 11.75 mmHg
console.log('p-value:', result.p_value);  // 0.0001
console.log('95% CI:', result.conf_int);  // [8.15, 15.35]

// Interpretation: Medication significantly reduces blood pressure
```

**When to use each**:
- **One-sample**: Compare sample to known value
- **Two-sample**: Compare two independent groups
- **Paired**: Compare before/after or matched pairs

---

## 6. Linear Models

Linear regression models the relationship between predictors (X) and response (Y).

### 6.1 Simple Linear Regression

One predictor variable.

```javascript
import { lm, predict, c } from 'aleatory';

// Advertising spend (thousands $) vs Sales (thousands units)
const adSpend = c([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const sales = c([2.1, 3.8, 6.2, 7.9, 10.1, 11.8, 14.3, 15.7, 18.2, 19.9]);

// Fit model: sales ~ adSpend
const fit = lm(sales, [adSpend]);

console.log('Coefficients:', fit.coefficients);
// Output: [0.145, 1.998]
// Model: sales = 0.145 + 1.998 × adSpend

console.log('R²:', fit.r_squared);  // 0.999 (99.9% of variance explained)
console.log('p-values:', fit.p_values);
// [0.587, 0.000] - intercept not significant, slope highly significant

// Interpretation: Each $1000 increase in ad spend increases sales by ~2000 units
```

**Key metrics explained**:
- **Coefficients**: Intercept and slope(s)
- **R²**: Proportion of variance explained (0-1, higher is better)
- **p-values**: Test if each coefficient is significantly different from 0

#### Making Predictions

```javascript
// Predict sales for $12k ad spend
const newX = [c([12])];
const predictions = predict(fit, newX);

console.log('Predicted sales:', predictions.get(0));  // 24.1k units

// Predict for multiple values
const futureSpend = [c([11, 12, 13, 14, 15])];
const futureSales = predict(fit, futureSpend);
console.log(futureSales.toString());
// Output: [22.12, 24.12, 26.12, 28.11, 30.11]
```

### 6.2 Multiple Linear Regression

Multiple predictor variables.

```javascript
import { lm, DataFrame, c } from 'aleatory';

// House prices based on size and age
const size = c([1200, 1500, 1800, 2000, 2200, 2500, 2800, 3000]);  // sq ft
const age = c([10, 8, 15, 5, 3, 12, 7, 2]);  // years
const price = c([180, 220, 200, 280, 320, 260, 340, 380]);  // thousands $

// Fit model: price ~ size + age
const fit = lm(price, [size, age]);

console.log('Coefficients:', fit.coefficients);
// Output: [50.5, 0.118, -4.23]
// Model: price = 50.5 + 0.118×size - 4.23×age

console.log('R²:', fit.r_squared);  // 0.984

// Interpretation:
// - Each 1 sq ft increases price by $118
// - Each year of age decreases price by $4,230
// - 98.4% of price variation explained
```

### 6.3 ANOVA: Comparing Models

Analysis of Variance tests if adding predictors improves model fit.

```javascript
import { lm, anova, printAnova } from 'aleatory';

// Full model
const fullModel = lm(price, [size, age]);

// Reduced model (size only)
const reducedModel = lm(price, [size]);

// Compare models
const anovaResult = anova(reducedModel, fullModel);
printAnova(anovaResult);

// Output shows:
// - Does adding 'age' significantly improve model?
// - F-statistic and p-value for comparison
// - If p < 0.05, full model is significantly better
```

### 6.4 Model Summaries

```javascript
import { summaryLM, printSummaryLM } from 'aleatory';

const summary = summaryLM(fit);
printSummaryLM(summary);

// Output (formatted):
// Call:
// lm(y ~ x1 + x2)
//
// Residuals:
//     Min      1Q  Median      3Q     Max
//  -15.3   -8.2    0.5    7.8    18.2
//
// Coefficients:
//             Estimate Std. Error t value Pr(>|t|)
// (Intercept)  50.456     12.345   4.088   0.0102 *
// x1            0.118      0.008  14.750   0.0001 ***
// x2           -4.231      0.892  -4.743   0.0065 **
//
// Residual standard error: 10.2 on 5 degrees of freedom
// Multiple R-squared: 0.984, Adjusted R-squared: 0.978
// F-statistic: 158.3 on 2 and 5 DF, p-value: 0.0001
```

---

## 7. Generalized Linear Models

GLMs extend linear regression to non-normal response variables.

### 7.1 Logistic Regression (Binary Outcomes)

Models probability of binary outcome (success/failure).

```javascript
import { glm, binomial, predictGlm, c } from 'aleatory';

// Medical study: Does dosage predict recovery?
const dosage = c([1, 2, 3, 4, 5, 6, 7, 8]);  // mg
const recovered = c([0, 0, 0, 1, 1, 1, 1, 1]);  // 0=no, 1=yes

// Fit logistic regression
const fit = glm(recovered, [dosage], { family: binomial() });

console.log('Coefficients:', fit.coefficients);
// Output: [-4.23, 1.12]
// log-odds(recovery) = -4.23 + 1.12×dosage

console.log('AIC:', fit.aic);  // Akaike Information Criterion (lower is better)
console.log('Deviance:', fit.deviance);  // Model fit measure

// Predict probability of recovery
const newDosage = [c([3, 5, 7])];
const probs = predictGlm(fit, newDosage, { type: 'response' });

console.log('P(recovery | 3mg):', probs.get(0));  // 0.23
console.log('P(recovery | 5mg):', probs.get(1));  // 0.67
console.log('P(recovery | 7mg):', probs.get(2));  // 0.93
```

**Interpretation**: 
- Each 1mg increase multiplies odds of recovery by e^1.12 = 3.06
- At 5mg, 67% probability of recovery

### 7.2 Poisson Regression (Count Data)

Models count outcomes (0, 1, 2, ...).

```javascript
import { glm, poisson } from 'aleatory';

// Number of customer complaints vs wait time
const waitTime = c([5, 10, 15, 20, 25, 30, 35, 40]);  // minutes
const complaints = c([1, 2, 3, 5, 7, 10, 14, 18]);    // count

// Fit Poisson regression
const fit = glm(complaints, [waitTime], { family: poisson() });

console.log('Coefficients:', fit.coefficients);
// log(complaints) = β0 + β1×waitTime

// Predict complaint count at 45 minutes
const newTime = [c([45])];
const predicted = predictGlm(fit, newTime, { type: 'response' });
console.log('Expected complaints:', predicted.get(0));  // ~24
```

### 7.3 Gamma Regression (Positive Continuous Data)

For skewed positive data (e.g., income, survival time).

```javascript
import { glm, Gamma } from 'aleatory';

// Insurance claims vs age
const age = c([25, 35, 45, 55, 65]);
const claims = c([1200, 1800, 2500, 3200, 4100]);  // $ amount

const fit = glm(claims, [age], { family: Gamma() });

console.log('AIC:', fit.aic);
console.log('Deviance:', fit.deviance);
```

---

## 8. Model Diagnostics

Diagnostics help assess model validity and identify problematic observations.

### 8.1 Confidence and Prediction Intervals

```javascript
import { confint, predictWithInterval, lm, c } from 'aleatory';

const x = c([1, 2, 3, 4, 5]);
const y = c([2, 4, 5, 4, 5]);
const fit = lm(y, [x]);

// Confidence intervals for coefficients
const ci = confint(fit, { level: 0.95 });
console.log('95% CI for slope:', ci[1]);
// Output: [0.12, 1.28]
// True slope likely between 0.12 and 1.28

// Prediction with confidence interval
const newX = [c([6])];
const pred = predictWithInterval(fit, newX, { interval: 'confidence', level: 0.95 });

console.log('Predicted value:', pred.fit.get(0));    // 5.8
console.log('95% CI:', [pred.lwr.get(0), pred.upr.get(0)]);
// Output: [4.9, 6.7]
// Mean response at x=6 is between 4.9 and 6.7

// Prediction interval (wider - for individual observations)
const pred2 = predictWithInterval(fit, newX, { interval: 'prediction', level: 0.95 });
console.log('95% PI:', [pred2.lwr.get(0), pred2.upr.get(0)]);
// Output: [3.2, 8.4]
// Individual observation at x=6 will be between 3.2 and 8.4
```

**Difference**:
- **Confidence interval**: Where mean response lies
- **Prediction interval**: Where individual observation lies (always wider)

### 8.2 Influence Diagnostics

Identify influential observations that strongly affect model fit.

```javascript
import { diagnostics, lm, c } from 'aleatory';

const x = c([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const y = c([2, 4, 5, 4, 5, 7, 8, 7, 9, 20]);  // Note: outlier at y=20

const fit = lm(y, [x]);
const diag = diagnostics(fit);

// Leverage: How far x is from mean
console.log('Leverage values:', diag.leverage.toString());
// High leverage = unusual x value

// Cook's distance: Overall influence
console.log('Cooks distance:', diag.cooks_distance.toString());
// Cook's D > 1 indicates influential point

console.log('Influential observations:', diag.influential_observations);
// Output: [9] (observation 10 with y=20 is influential)

// Standardized residuals
console.log('Standardized residuals:', diag.standardized_residuals.toString());
// Large absolute value indicates outlier
```

**What to look for**:
- **Cook's D > 1**: Very influential, investigate
- **Cook's D > 4/n**: Potentially influential
- **High leverage + large residual**: Most problematic

---

## 9. DataFrame Operations

DataFrame provides R/tidyverse-style tabular data manipulation.

### 9.1 Creating DataFrames

```javascript
import { DataFrame } from 'aleatory';

// From object
const df = new DataFrame({
    name: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
    age: [25, 30, 35, 28, 32],
    salary: [50000, 60000, 75000, 55000, 65000],
    dept: ['Sales', 'Engineering', 'Engineering', 'Sales', 'HR']
});

console.log(df.toString());
// Output:
// DataFrame [5 x 4]
// name <factor>  age <numeric>  salary <numeric>  dept <factor>
// ----------------------------------------------------------------
// Alice          25.00          50000.00          Sales
// Bob            30.00          60000.00          Engineering
// Charlie        35.00          75000.00          Engineering
// Diana          28.00          55000.00          Sales
// Eve            32.00          65000.00          HR
```

### 9.2 Select - Choose Columns

```javascript
// Select specific columns
const nameAge = df.select('name', 'age');
console.log(nameAge.toString());
// DataFrame [5 x 2]
// name <factor>  age <numeric>
// -------------------------------
// Alice          25.00
// Bob            30.00
// ...
```

### 9.3 Filter - Choose Rows

```javascript
// Filter by condition
const highSalary = df.filter(row => row.salary >= 60000);
console.log(highSalary.toString());
// DataFrame [3 x 4] - Bob, Charlie, Eve

// Multiple conditions
const seniorEngineers = df.filter(row => 
    row.age >= 30 && row.dept === 'Engineering'
);
console.log(seniorEngineers.toString());
// DataFrame [2 x 4] - Bob, Charlie
```

### 9.4 Mutate - Add/Modify Columns

```javascript
// Add new column
const withBonus = df.mutate({
    bonus: row => row.salary * 0.1  // 10% bonus
});

console.log(withBonus.toString());
// Now has 5 columns including 'bonus'

// Multiple new columns
const enhanced = df.mutate({
    bonus: row => row.salary * 0.1,
    total_comp: row => row.salary + row.bonus,
    senior: row => row.age >= 30
});
```

### 9.5 Arrange - Sort Rows

```javascript
// Sort by salary (ascending)
const sorted = df.arrange('salary');

// Sort descending
const sortedDesc = df.arrange('salary', { decreasing: true });
console.log(sortedDesc.toString());
// Charlie (75k), Eve (65k), Bob (60k), Diana (55k), Alice (50k)

// Sort by multiple columns
const multiSort = df
    .arrange('dept')              // First by department
    .arrange('salary', { decreasing: true });  // Then by salary within dept
```

### 9.6 Group By and Summarize

```javascript
import { mean, max, min } from 'aleatory';

// Group by department and calculate statistics
const deptStats = df
    .groupBy('dept')
    .summarize({
        n: rows => rows.length,
        avg_salary: rows => mean(rows.map(r => r.salary)),
        max_salary: rows => max(rows.map(r => r.salary)),
        avg_age: rows => mean(rows.map(r => r.age))
    });

console.log(deptStats.toString());
// Output:
// DataFrame [3 x 5]
// dept          n      avg_salary  max_salary  avg_age
// ---------------------------------------------------
// Engineering   2.00   67500.00    75000.00    32.50
// Sales         2.00   52500.00    55000.00    26.50
// HR            1.00   65000.00    65000.00    32.00
```

### 9.7 Method Chaining

```javascript
// Complex pipeline
const result = df
    .filter(row => row.age >= 28)              // Adults 28+
    .mutate({ bonus: row => row.salary * 0.1 }) // Add bonus
    .arrange('salary', { decreasing: true })    // Sort by salary
    .select('name', 'salary', 'bonus')          // Keep only these columns
    .head(3);                                   // Top 3

console.log(result.toString());
```

### 9.8 Additional Operations

```javascript
// Rename columns
const renamed = df.rename({ name: 'employee_name', dept: 'department' });

// Slice rows by index
const subset = df.slice([0, 2, 4]);  // Rows 1, 3, 5

// Head and tail
const first3 = df.head(3);
const last2 = df.tail(2);

// Get column as Vector
const ages = df.col('age');
console.log('Mean age:', ages.mean());
```

---

## 10. Data Reshaping

### 10.1 Pivot Longer - Wide to Long

Converts wide format (multiple columns) to long format (one column).

```javascript
import { DataFrame, pivotLonger } from 'aleatory';

// Sales data in wide format
const wide = new DataFrame({
    product: ['A', 'B', 'C'],
    jan: [100, 150, 200],
    feb: [110, 160, 190],
    mar: [120, 155, 210]
});

console.log('Wide format:');
console.log(wide.toString());
// product  jan    feb    mar
// A        100    110    120
// B        150    160    155
// C        200    190    210

// Convert to long format
const long = pivotLonger(wide, ['jan', 'feb', 'mar'], {
    names_to: 'month',
    values_to: 'sales'
});

console.log('Long format:');
console.log(long.toString());
// product  month  sales
// A        jan    100
// A        feb    110
// A        mar    120
// B        jan    150
// B        feb    160
// ...
```

**Use case**: Plotting, analysis, and modeling often require long format.

### 10.2 Pivot Wider - Long to Wide

```javascript
import { pivotWider } from 'aleatory';

// Convert back to wide
const wideAgain = pivotWider(long, {
    names_from: 'month',
    values_from: 'sales'
});

console.log(wideAgain.toString());
// Back to original wide format
```

### 10.3 Separate - Split Column

```javascript
import { separate } from 'aleatory';

const df = new DataFrame({
    name: ['John_Smith', 'Jane_Doe', 'Bob_Jones'],
    score: [85, 92, 78]
});

// Split name into first and last
const separated = separate(df, 'name', ['first', 'last'], { sep: '_' });

console.log(separated.toString());
// first  last   score
// John   Smith  85
// Jane   Doe    92
// Bob    Jones  78
```

### 10.4 Unite - Combine Columns

```javascript
import { unite } from 'aleatory';

// Combine first and last back into full name
const united = unite(separated, 'full_name', ['first', 'last'], { sep: ' ' });

console.log(united.toString());
// full_name    score
// John Smith   85
// Jane Doe     92
// Bob Jones    78
```

### 10.5 Handle Missing Values

```javascript
import { dropNA, fillNA } from 'aleatory';

const withNA = new DataFrame({
    x: [1, 2, null, 4, 5],
    y: [10, null, 30, 40, null]
});

// Drop rows with any NA
const dropped = dropNA(withNA);
console.log(dropped.nrow);  // 2 (rows 1 and 4)

// Fill NA with value
const filled = fillNA(withNA, 0);
console.log(filled.toString());
// x  y
// 1  10
// 2  0
// 0  30
// 4  40
// 5  0

// Fill with column mean
const filledMean = fillNA(withNA, { strategy: 'mean' });
```

---

## 11. Data Joins

Combine DataFrames like SQL joins.

### Test Datasets

```javascript
import { DataFrame, innerJoin, leftJoin, rightJoin, fullJoin } from 'aleatory';

const employees = new DataFrame({
    emp_id: [1, 2, 3, 4],
    name: ['Alice', 'Bob', 'Charlie', 'Diana'],
    dept_id: [10, 20, 10, 30]
});

const departments = new DataFrame({
    dept_id: [10, 20, 40],
    dept_name: ['Sales', 'Engineering', 'HR']
});
```

### 11.1 Inner Join - Matching Rows Only

```javascript
const inner = innerJoin(employees, departments, 'dept_id');

console.log(inner.toString());
// emp_id  name     dept_id  dept_name
// 1       Alice    10       Sales
// 2       Bob      20       Engineering
// 3       Charlie  10       Sales
// (Diana excluded - no match for dept_id=30)
```

### 11.2 Left Join - Keep All Left Rows

```javascript
const left = leftJoin(employees, departments, 'dept_id');

console.log(left.toString());
// emp_id  name     dept_id  dept_name
// 1       Alice    10       Sales
// 2       Bob      20       Engineering
// 3       Charlie  10       Sales
// 4       Diana    30       NA          <- Diana kept with NA dept
```

### 11.3 Right Join - Keep All Right Rows

```javascript
const right = rightJoin(employees, departments, 'dept_id');

console.log(right.toString());
// emp_id  name     dept_id  dept_name
// 1       Alice    10       Sales
// 3       Charlie  10       Sales
// 2       Bob      20       Engineering
// NA      NA       40       HR          <- HR kept with NA employee
```

### 11.4 Full Join - Keep All Rows

```javascript
const full = fullJoin(employees, departments, 'dept_id');

console.log(full.toString());
// All rows from both DataFrames, NAs where no match
```

### 11.5 Filtering Joins

```javascript
import { semiJoin, antiJoin } from 'aleatory';

// Semi join: Keep left rows that have match in right
const semi = semiJoin(employees, departments, 'dept_id');
// Returns: Alice, Bob, Charlie (have matching departments)

// Anti join: Keep left rows that DON'T have match in right
const anti = antiJoin(employees, departments, 'dept_id');
// Returns: Diana (no matching department)
```

### 11.6 Binding DataFrames

```javascript
import { bindRows, bindCols } from 'aleatory';

// Stack DataFrames vertically (must have same columns)
const df1 = new DataFrame({ x: [1, 2], y: [3, 4] });
const df2 = new DataFrame({ x: [5, 6], y: [7, 8] });
const stacked = bindRows([df1, df2]);
// Result: 4 rows, 2 columns

// Combine horizontally (must have same number of rows)
const df3 = new DataFrame({ z: [9, 10] });
const combined = bindCols([df1, df3]);
// Result: 2 rows, 3 columns (x, y, z)
```

---

## 12. Window Functions

SQL-style analytic functions for grouped operations.

```javascript
import { DataFrame, row_number, rank, lag, lead, cumsum } from 'aleatory';

const sales = new DataFrame({
    rep: ['Alice', 'Alice', 'Bob', 'Bob', 'Alice', 'Bob'],
    month: [1, 2, 1, 2, 3, 3],
    amount: [100, 150, 120, 180, 140, 200]
});
```

### 12.1 Row Number

```javascript
const withRowNum = sales.mutate({
    row_num: row_number(sales.col('rep'), sales.col('rep'))
});

console.log(withRowNum.toString());
// rep    month  amount  row_num
// Alice  1      100     1
// Alice  2      150     2
// Bob    1      120     1
// Bob    2      180     2
// Alice  3      140     3
// Bob    3      200     3
```

### 12.2 Rank

```javascript
const withRank = sales.mutate({
    rank: rank(sales.col('amount'), sales.col('rep'))
});

// Ranks amount within each rep
```

### 12.3 Lag and Lead

```javascript
const withLag = sales.mutate({
    prev_amount: lag(sales.col('amount'), sales.col('rep'), { n: 1 }),
    next_amount: lead(sales.col('amount'), sales.col('rep'), { n: 1 })
});

console.log(withLag.toString());
// rep    month  amount  prev_amount  next_amount
// Alice  1      100     NA           150
// Alice  2      150     100          140
// Bob    1      120     NA           180
// ...
```

### 12.4 Cumulative Functions

```javascript
const withCumulative = sales.mutate({
    cumulative_sales: cumsum(sales.col('amount'), sales.col('rep')),
    avg_to_date: cummean(sales.col('amount'), sales.col('rep'))
});

console.log(withCumulative.toString());
// rep    month  amount  cumulative_sales  avg_to_date
// Alice  1      100     100               100.00
// Alice  2      150     250               125.00
// Bob    1      120     120               120.00
// Bob    2      180     300               150.00
// Alice  3      140     390               130.00
// Bob    3      200     500               166.67
```

### 12.5 First and Last

```javascript
import { first, last } from 'aleatory';

const withBoundaries = sales.mutate({
    first_sale: first(sales.col('amount'), sales.col('rep')),
    last_sale: last(sales.col('amount'), sales.col('rep'))
});

// Each row gets first and last value within its group
```

---

## 13. R Dataset Compatibility

Work with R's built-in datasets and CSV files in R format.

### 13.1 Built-in R Datasets

```javascript
import { RDatasets } from 'aleatory';

// Load mtcars dataset
const mtcars = RDatasets.mtcars();

console.log(mtcars.toString());
// DataFrame with car data: mpg, cyl, disp, hp, etc.
console.log('Dimensions:', mtcars.nrow, 'x', mtcars.ncol);

// Use for analysis
const avgMPG = mtcars.col('mpg').mean();
console.log('Average MPG:', avgMPG);

// Group by cylinders
const byMPG = mtcars
    .groupBy('cyl')
    .summarize({
        n: rows => rows.length,
        avg_mpg: rows => mean(rows.map(r => r.mpg)),
        avg_hp: rows => mean(rows.map(r => r.hp))
    });

console.log(byMPG.toString());
```

### 13.2 Load R CSV Files

```javascript
import { readRDataset, writeRDataset } from 'aleatory';

// Read R-formatted CSV
const df = readRDataset('path/to/data.csv');

// Handles R conventions:
// - NA values
// - Factor columns
// - Row names
// - R data types

console.log(df.toString());
```

### 13.3 Save R-Compatible Files

```javascript
import { DataFrame, writeRDataset } from 'aleatory';

const df = new DataFrame({
    x: [1, 2, 3, 4, 5],
    y: ['A', 'B', 'A', 'C', 'B'],
    z: [10.5, 20.3, null, 40.1, 50.9]
});

// Write in R format
writeRDataset(df, 'output.csv');

// R users can read with:
// data <- read.csv('output.csv')
```

### 13.4 Type Conversion

```javascript
import { convertRType } from 'aleatory';

// Convert R type string to JS
const jsType = convertRType('integer');
console.log(jsType);  // 'numeric'

const jsType2 = convertRType('factor');
console.log(jsType2);  // 'factor'
```

### 13.5 Format Detection

```javascript
import { detectRFormat } from 'aleatory';

const csvContent = `
"mpg","cyl","disp"
21.0,6,160
21.0,6,160
NA,8,360
`;

const format = detectRFormat(csvContent);
console.log('Has NA:', format.hasNA);  // true
console.log('Has row names:', format.hasRowNames);  // false
```

---

## 14. Visualization

Create publication-quality plots with Plotly.js integration.

### Setup

```html
<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
<script src="https://aleatory.marcojorgensen.com/dist/aleatory.min.js"></script>
<div id="plot"></div>
```

### 14.1 Histogram

```javascript
import { rnorm, vis } from 'aleatory';

const data = rnorm(200, { mean: 0, sd: 1 });
const config = vis.applyTheme('publication');

const fig = vis.createHistogram(data, config, {
    title: 'Normal Distribution',
    xlab: 'Value',
    ylab: 'Frequency',
    bins: 30,
    showDensity: true,    // Overlay kernel density
    showNormal: true      // Overlay theoretical normal
});

Plotly.newPlot('plot', fig.data, fig.layout);
```

### 14.2 Q-Q Plot

```javascript
const qqFig = vis.createQQPlot(data, config, {
    title: 'Normal Q-Q Plot',
    showLine: true  // Reference line
});

Plotly.newPlot('plot', qqFig.data, qqFig.layout);
```

**Use case**: Check if data follows normal distribution. Points on line = normal.

### 14.3 Scatter Plot with Regression

```javascript
import { lm, c, vis } from 'aleatory';

const x = c([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const y = c([2, 4, 5, 4, 5, 7, 8, 7, 9, 10]);
const fit = lm(y, [x]);

const fig = vis.createScatterPlot({ x, y }, config, {
    fit: fit,
    title: 'Linear Regression',
    xlab: 'X',
    ylab: 'Y',
    showEquation: true,  // Display equation on plot
    showR2: true         // Display R²
});

Plotly.newPlot('plot', fig.data, fig.layout);
```

### 14.4 Residuals Plot

```javascript
const residFig = vis.createResidualsPlot(fit, config, {
    title: 'Residuals vs Fitted',
    showSmooth: true  // LOWESS smoother
});

Plotly.newPlot('plot', residFig.data, residFig.layout);
```

**Use case**: Check assumptions - want random scatter around zero.

### 14.5 Box Plot

```javascript
import { DataFrame } from 'aleatory';

const df = new DataFrame({
    group: ['A', 'A', 'A', 'B', 'B', 'B', 'C', 'C', 'C'],
    value: [5, 7, 6, 8, 10, 9, 3, 4, 5]
});

const boxFig = vis.createBoxPlot(df, config, {
    groupBy: 'group',
    y: 'value',
    title: 'Value by Group',
    showMean: true  // Show mean marker
});

Plotly.newPlot('plot', boxFig.data, boxFig.layout);
```

### 14.6 Correlation Heatmap

```javascript
import { DataFrame } from 'aleatory';

const df = new DataFrame({
    x1: [1, 2, 3, 4, 5],
    x2: [2, 4, 6, 8, 10],
    x3: [1, 4, 2, 8, 5]
});

const corrFig = vis.createCorrelationMatrix(df, config, {
    title: 'Correlation Matrix',
    method: 'pearson',  // or 'spearman'
    showValues: true    // Display correlation coefficients
});

Plotly.newPlot('plot', corrFig.data, corrFig.layout);
```

### 14.7 Themes

```javascript
// Built-in themes
const themes = ['default', 'dark', 'minimal', 'colorblind', 'publication', 'ggplot2'];

themes.forEach(theme => {
    const config = vis.applyTheme(theme);
    const fig = vis.createHistogram(data, config);
    Plotly.newPlot(`plot-${theme}`, fig.data, fig.layout);
});

// Custom theme
const custom = vis.createTheme({
    width: 1200,
    height: 800,
    colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        background: '#F7FFF7'
    },
    fonts: {
        title: { size: 24, family: 'Arial' },
        axis: { size: 14 }
    },
    lineWidth: 3,
    markerSize: 10
});
```

---

## 15. Real-World Examples

### Example 1: Complete Analysis Pipeline

```javascript
import * as aleatory from 'aleatory';

// Load data
const data = aleatory.RDatasets.mtcars();

// Explore
console.log('=== DATA SUMMARY ===');
console.log(data.head(5).toString());

const mpgSummary = aleatory.summary(data.col('mpg'));
console.log('MPG Summary:', mpgSummary);

// Visualize
const histFig = aleatory.vis.createHistogram(
    data.col('mpg'),
    aleatory.vis.applyTheme('publication'),
    { title: 'MPG Distribution', xlab: 'Miles per Gallon' }
);
Plotly.newPlot('plot1', histFig.data, histFig.layout);

// Model: Predict MPG from weight and cylinders
const fit = aleatory.lm(
    data.col('mpg'),
    [data.col('wt'), data.col('cyl')]
);

console.log('\n=== REGRESSION MODEL ===');
const summary = aleatory.summaryLM(fit);
aleatory.printSummaryLM(summary);

// Diagnostics
const diag = aleatory.diagnostics(fit);
console.log('\nInfluential cars:', 
    diag.influential_observations.map(i => data.col('_rownames').get(i))
);

// Visualize fit
const residFig = aleatory.vis.createResidualsPlot(
    fit,
    aleatory.vis.applyTheme('publication')
);
Plotly.newPlot('plot2', residFig.data, residFig.layout);

// Predictions
const newCars = [
    aleatory.c([3.0, 3.5, 4.0]),  // weight
    aleatory.c([4, 6, 8])          // cylinders
];
const predicted = aleatory.predict(fit, newCars);
console.log('\nPredicted MPG for new cars:', predicted.toString());
```

### Example 2: A/B Test Analysis

```javascript
import { DataFrame, t_test, c, vis } from 'aleatory';

// Conversion rates for two website versions
const df = new DataFrame({
    version: ['A', 'A', 'A', 'A', 'A', 'B', 'B', 'B', 'B', 'B'],
    conversions: [12, 15, 14, 13, 16, 18, 20, 19, 21, 17]
});

// Split by version
const versionA = df.filter(r => r.version === 'A').col('conversions');
const versionB = df.filter(r => r.version === 'B').col('conversions');

// Statistical test
const result = t_test(versionA, versionB);

console.log('=== A/B TEST RESULTS ===');
console.log('Version A mean:', result.estimate.mean_x);
console.log('Version B mean:', result.estimate.mean_y);
console.log('Difference:', result.estimate.mean_y - result.estimate.mean_x);
console.log('p-value:', result.p_value);
console.log('95% CI for difference:', result.conf_int);

if (result.p_value < 0.05) {
    console.log('Result: Version B is significantly better!');
} else {
    console.log('Result: No significant difference');
}

// Visualize
const boxFig = vis.createBoxPlot(df, vis.applyTheme('publication'), {
    groupBy: 'version',
    y: 'conversions',
    title: 'A/B Test: Conversion Rates'
});
Plotly.newPlot('plot', boxFig.data, boxFig.layout);
```

### Example 3: Logistic Regression for Classification

```javascript
import { glm, binomial, predictGlm, c } from 'aleatory';

// Medical diagnosis: predict disease from biomarker levels
const biomarker = c([1.2, 1.8, 2.5, 3.1, 3.8, 4.2, 4.9, 5.3, 5.8, 6.2]);
const disease = c([0, 0, 0, 0, 1, 1, 1, 1, 1, 1]);  // 0=healthy, 1=disease

// Fit logistic regression
const fit = glm(disease, [biomarker], { family: binomial() });

console.log('=== LOGISTIC REGRESSION ===');
console.log('Coefficients:', fit.coefficients);
console.log('AIC:', fit.aic);

// Predict probabilities for new patients
const newPatients = [c([2.0, 3.5, 5.0, 6.5])];
const probs = predictGlm(fit, newPatients, { type: 'response' });

console.log('\nRisk predictions:');
for (let i = 0; i < newPatients[0].length; i++) {
    const level = newPatients[0].get(i);
    const risk = probs.get(i);
    console.log(`Biomarker ${level}: ${(risk * 100).toFixed(1)}% risk`);
}

// Decision threshold
const threshold = 0.5;
console.log('\nClassifications (threshold = 0.5):');
for (let i = 0; i < probs.length; i++) {
    const prediction = probs.get(i) >= threshold ? 'DISEASE' : 'HEALTHY';
    console.log(`Patient ${i + 1}: ${prediction}`);
}
```

### Example 4: Time Series Analysis

```javascript
import { DataFrame, lag, c, mean } from 'aleatory';

// Monthly sales data
const df = new DataFrame({
    month: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    sales: [100, 120, 115, 130, 145, 140, 155, 160, 150, 170, 180, 175]
});

// Add lagged values and moving average
const partition = c(Array(df.nrow).fill(1));  // Single group

const enhanced = df.mutate({
    prev_month: lag(df.col('sales'), partition, { n: 1 }),
    change: row => row.sales - (row.prev_month || row.sales),
    pct_change: row => row.prev_month ? 
        ((row.sales - row.prev_month) / row.prev_month * 100) : 0
});

console.log('=== TIME SERIES ANALYSIS ===');
console.log(enhanced.toString());

// Calculate 3-month moving average
const ma3 = [];
for (let i = 0; i < enhanced.nrow; i++) {
    if (i < 2) {
        ma3.push(null);
    } else {
        const window = [
            enhanced.col('sales').get(i - 2),
            enhanced.col('sales').get(i - 1),
            enhanced.col('sales').get(i)
        ];
        ma3.push(mean(c(window)));
    }
}

const withMA = enhanced.mutate({ ma_3: () => ma3.shift() });
console.log('\nWith 3-month moving average:');
console.log(withMA.toString());
```

---

## Next Steps

### Practice Exercises

1. **Basic Statistics**: Calculate summary statistics for `RDatasets.iris()`
2. **Hypothesis Testing**: Compare sepal lengths between species
3. **Regression**: Model sepal width from sepal length and species
4. **Data Manipulation**: Create a grouped summary by species
5. **Visualization**: Create a scatter plot matrix

### Resources

- **GitHub**: [github.com/MarcoJ03rgensen/aleatory](https://github.com/MarcoJ03rgensen/aleatory)
- **Visualization Gallery**: [aleatory.marcojorgensen.com/examples/visualization_gallery.html](https://aleatory.marcojorgensen.com/examples/visualization_gallery.html)
- **Test Files**: Check `tests/` directory for more examples
- **Demo Files**: Run examples in `examples/` directory

### Getting Help

- Review test files for usage patterns
- Check function docstrings in source code
- Open issues on GitHub for bugs or questions
- Compare with R documentation for equivalent functions

---

## Appendix: Quick Reference

### Distribution Functions

| Distribution | Density | CDF | Quantile | Random |
|-------------|---------|-----|----------|--------|
| Normal | `dnorm()` | `pnorm()` | `qnorm()` | `rnorm()` |
| t | `dt()` | `pt()` | `qt()` | `rt()` |
| Chi-squared | `dchisq()` | `pchisq()` | `qchisq()` | `rchisq()` |
| F | `df()` | `pf()` | `qf()` | `rf()` |
| Binomial | `dbinom()` | `pbinom()` | `qbinom()` | `rbinom()` |
| Poisson | `dpois()` | `ppois()` | `qpois()` | `rpois()` |

### DataFrame Operations

| Operation | Function | Purpose |
|-----------|----------|----------|
| Select columns | `.select()` | Choose specific columns |
| Filter rows | `.filter()` | Choose rows by condition |
| Add columns | `.mutate()` | Create/modify columns |
| Sort | `.arrange()` | Order rows |
| Group | `.groupBy()` | Group for aggregation |
| Summarize | `.summarize()` | Aggregate grouped data |
| Rename | `.rename()` | Rename columns |
| Preview | `.head()` / `.tail()` | View first/last rows |

### Joins

| Join | Keeps |
|------|-------|
| `innerJoin()` | Matching rows only |
| `leftJoin()` | All left + matches |
| `rightJoin()` | All right + matches |
| `fullJoin()` | All rows |
| `semiJoin()` | Left with matches |
| `antiJoin()` | Left without matches |

### Model Functions

| Function | Purpose |
|----------|----------|
| `lm()` | Linear regression |
| `glm()` | Generalized linear model |
| `predict()` | Make predictions |
| `anova()` | ANOVA table / model comparison |
| `diagnostics()` | Influence measures |
| `confint()` | Confidence intervals |
| `summaryLM()` | Model summary |

---

**End of Tutorial**

This covers all major features in Aleatory. Start with Section 2-3 for basics, then explore sections based on your needs. Good luck with your statistical computing! 🎲

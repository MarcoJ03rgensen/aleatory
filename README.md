# Aleatory

**Statistical Computing for JavaScript**

Aleatory is a comprehensive JavaScript library that brings R-style statistical computing to the web. It eliminates the need for Python or R backends in data applications by providing native JavaScript implementations of essential statistical methods.

## Vision

This library aims to be a foundational piece of software for web-based data science, enabling:

- **Privacy**: Analyze sensitive data locally without server uploads
- **Cost**: Eliminate backend infrastructure for statistical computing
- **Familiarity**: R-like syntax for statisticians and data scientists
- **Performance**: TypedArray-based vectors for efficient computation

## Architecture

Aleatory is built on four core layers:

### 1. Vector Core
- Custom `Vector` class backed by `Float64Array`
- Native support for missing values (NA) via bitmasks
- Efficient memory layout for large datasets

### 2. Formula Parser
- Parses R-style formula strings: `y ~ x + age + interaction`
- Automatically converts categorical variables to dummy codes
- Generates design matrices for modeling

### 3. Math Kernel
- Linear algebra operations (matrix multiplication, inversion)
- Matrix decomposition (QR, SVD, Cholesky)
- Optimized for statistical computing workloads

### 4. API Layer
- R-compatible functions: `lm()`, `glm()`, `t.test()`, `anova()`
- Statistical distributions (PDF, CDF, quantile functions)
- Summary and diagnostic outputs

## Development Roadmap

### Phase 1: The "Student" Release (Months 1-3)
**Goal**: Replace R for basic university statistics courses

- ✅ Vector data structure with NA support
- Statistical distributions (Normal, T, Chi-Square, F, Binomial)
- T-tests (one-sample, two-sample, paired)
- Summary statistics and formatting

### Phase 2: The "Modeler" Release (Months 4-6)
**Goal**: Enable linear regression and ANOVA

- Formula parser (`y ~ x` syntax)
- Linear models: `lm()`
- Matrix operations and QR decomposition
- ANOVA tables and correlation matrices
- Residual analysis

### Phase 3: The "Data Scientist" Release (Months 7-9)
**Goal**: Complex datasets and generalized linear models

- DataFrame object with joins and filtering
- Generalized Linear Models: `glm()`
- Logistic and Poisson regression
- Missing data imputation

### Phase 4: The "Visual" Release (Months 10+)
**Goal**: Automatic diagnostic plots

- Residuals vs Fitted plots
- Q-Q plots for normality assessment
- Cook's Distance for outlier detection
- Automatic plot generation: `plot(model)`

## Example Usage (Planned)

```javascript
import { lm, Vector, DataFrame } from 'aleatory';

// Create data
const data = [
  { sales: 10, region: "North", temperature: 15 },
  { sales: 20, region: "South", temperature: 25 },
  { sales: 15, region: "North", temperature: 18 }
];

// R-style formula interface - automatic categorical handling
const model = lm('sales ~ region + temperature', { data });

console.log(model.summary());
// Automatically converts 'region' to dummy variables
// Outputs R-style summary with coefficients, p-values, R²
```

## Why Aleatory?

The name "Aleatory" comes from the Latin *aleatorius* ("depending on chance"), reflecting the library's focus on probability and statistical inference. It sounds sophisticated and captures the essence of uncertainty in data analysis.

## Current Status

**Phase 1 - In Development**

The core `Vector` class is implemented with:
- TypedArray foundation (Float64Array)
- NA/missing value support via bitmasks
- Basic statistical methods (mean, variance, sd, min, max)
- Vector arithmetic operations
- NA removal (`naOmit()`)

## Contributing

This is an ambitious project that aims to democratize statistical computing on the web. Contributions are welcome!

## License

MIT

## Inspiration

Inspired by R's statistical computing ecosystem and the need for privacy-preserving, client-side data analysis tools.

/**
 * DataFrame Demo - Phase 4 Features
 * 
 * Showcases the power of Aleatory's DataFrame with:
 * - Data manipulation (filter, mutate, arrange)
 * - Window functions (lag, lead, rank, cumsum)
 * - Grouping and aggregation
 * - Method chaining with pipe()
 * - Integration with statistical models
 */

import { 
  DataFrame, 
  chain,
  pipe,
  lag,
  lead,
  rank,
  cumsum,
  cummean,
  row_number,
  lm,
  glm,
  binomial
} from '../src/index.js';

console.log('🎲 Aleatory DataFrame Demo - Phase 4\n');
console.log('='.repeat(50) + '\n');

// ============================================================================
// Example 1: Basic DataFrame Operations
// ============================================================================

console.log('📊 Example 1: Basic DataFrame Operations\n');

const sales = new DataFrame({
  date: ['2024-01', '2024-01', '2024-02', '2024-02', '2024-03', '2024-03'],
  product: ['A', 'B', 'A', 'B', 'A', 'B'],
  revenue: [1000, 1500, 1200, 1600, 1100, 1700],
  units: [50, 60, 55, 65, 52, 68]
});

console.log('Original data:');
console.log(sales.toString());
console.log();

// Filter and mutate
const enriched = sales
  .filter(row => row.revenue > 1000)
  .mutate({
    price_per_unit: row => row.revenue / row.units,
    is_premium: row => row.product === 'B'
  });

console.log('Filtered and enriched:');
console.log(enriched.toString());
console.log();

// ============================================================================
// Example 2: Window Functions - Time Series Analysis
// ============================================================================

console.log('\n📈 Example 2: Window Functions - Time Series Analysis\n');

const timeSeries = new DataFrame({
  date: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'],
  value: [100, 120, 115, 130, 125, 140]
});

// Add window function columns
const withWindows = timeSeries.mutate({
  lag_1: () => lag(timeSeries, 'value', 1, null),
  lead_1: () => lead(timeSeries, 'value', 1, null),
  change: (row, i) => {
    const lagged = lag(timeSeries, 'value', 1, null);
    return lagged[i] !== null ? row.value - lagged[i] : null;
  },
  cumulative: () => cumsum(timeSeries, 'value'),
  moving_avg: () => cummean(timeSeries, 'value')
});

console.log('Time series with window functions:');
console.log(withWindows.toString());
console.log();

// ============================================================================
// Example 3: Grouped Operations with Window Functions
// ============================================================================

console.log('\n📊 Example 3: Grouped Window Functions\n');

const multiProduct = new DataFrame({
  product: ['A', 'A', 'A', 'B', 'B', 'B'],
  month: [1, 2, 3, 1, 2, 3],
  sales: [100, 120, 115, 80, 95, 90]
});

const withGroupedWindows = multiProduct.mutate({
  rank_in_product: () => rank(multiProduct, 'sales', ['product'], true),
  cumsum_by_product: () => cumsum(multiProduct, 'sales', ['product']),
  lag_by_product: () => lag(multiProduct, 'sales', 1, null, ['product']),
  row_num: () => row_number(multiProduct, ['product'])
});

console.log('Grouped window functions:');
console.log(withGroupedWindows.toString());
console.log();

// ============================================================================
// Example 4: Method Chaining with chain()
// ============================================================================

console.log('\n⛓️ Example 4: Fluent Method Chaining\n');

const employees = new DataFrame({
  name: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'],
  dept: ['Engineering', 'Sales', 'Engineering', 'Sales', 'Engineering', 'Sales'],
  salary: [95000, 75000, 105000, 85000, 92000, 78000],
  experience: [5, 3, 8, 4, 6, 2]
});

const analysis = chain(employees)
  .filter(row => row.salary >= 80000)
  .mutate({
    salary_per_year: row => row.salary / row.experience
  })
  .arrange(['dept', 'salary'], { decreasing: [false, true] })
  .select('name', 'dept', 'salary', 'salary_per_year')
  .value();

console.log('Chained operations result:');
console.log(analysis.toString());
console.log();

// ============================================================================
// Example 5: Functional Composition with pipe()
// ============================================================================

console.log('\n🔧 Example 5: Functional Composition\n');

const filterHighPerformers = df => df.filter(row => row.salary > 90000);
const addBonus = df => df.mutate({ bonus: row => row.salary * 0.1 });
const selectRelevant = df => df.select('name', 'dept', 'salary', 'bonus');

const bonusReport = pipe(
  employees,
  filterHighPerformers,
  addBonus,
  selectRelevant
);

console.log('Functional pipeline result:');
console.log(bonusReport.toString());
console.log();

// ============================================================================
// Example 6: Group-by and Aggregation
// ============================================================================

console.log('\n📁 Example 6: Grouping and Aggregation\n');

const departmentStats = employees.groupBy('dept').summarize({
  count: gdf => gdf.nrow,
  avg_salary: gdf => {
    const salaries = gdf.colArray('salary');
    return salaries.reduce((a, b) => a + b, 0) / salaries.length;
  },
  total_experience: gdf => {
    const exp = gdf.colArray('experience');
    return exp.reduce((a, b) => a + b, 0);
  },
  max_salary: gdf => Math.max(...gdf.colArray('salary'))
});

console.log('Department statistics:');
console.log(departmentStats.toString());
console.log();

// ============================================================================
// Example 7: Integration with Linear Models
// ============================================================================

console.log('\n📊 Example 7: DataFrame → Linear Regression\n');

const experimentData = new DataFrame({
  temperature: [20, 25, 30, 35, 40, 45, 50],
  yield: [45, 52, 58, 65, 71, 76, 82]
});

// Extract data for modeling
const X = experimentData.colArray('temperature');
const y = experimentData.colArray('yield');

// Fit linear model
const model = lm(y, [X]);

console.log('Linear Model Results:');
console.log(`  R²: ${model.r_squared.toFixed(4)}`);
console.log(`  Coefficients:`);
console.log(`    Intercept: ${model.coefficients[0].toFixed(3)}`);
console.log(`    Slope: ${model.coefficients[1].toFixed(3)}`);
console.log(`  P-values:`);
console.log(`    Intercept: ${model.p_values[0].toFixed(4)}`);
console.log(`    Slope: ${model.p_values[1].toFixed(6)}`);
console.log();

// Add predictions back to DataFrame
const withPredictions = experimentData.mutate({
  predicted: model.fitted_values,
  residual: model.residuals
});

console.log('Data with predictions:');
console.log(withPredictions.toString());
console.log();

// ============================================================================
// Example 8: Advanced - Logistic Regression with DataFrame
// ============================================================================

console.log('\n🤖 Example 8: Logistic Regression for Classification\n');

const creditData = new DataFrame({
  income: [30, 45, 60, 75, 90, 105, 120, 135],
  debt_ratio: [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1],
  approved: [0, 0, 0, 0, 1, 1, 1, 1]
});

const X_credit = [creditData.colArray('income'), creditData.colArray('debt_ratio')];
const y_credit = creditData.colArray('approved');

const logitModel = glm(y_credit, X_credit, { family: binomial() });

console.log('Logistic Regression Results:');
console.log(`  Deviance: ${logitModel.deviance.toFixed(4)}`);
console.log(`  AIC: ${logitModel.aic.toFixed(2)}`);
console.log(`  Coefficients:`);
logitModel.coefficients.forEach((coef, i) => {
  const names = ['Intercept', 'Income', 'Debt Ratio'];
  console.log(`    ${names[i]}: ${coef.toFixed(4)}`);
});
console.log();

// ============================================================================
// Example 9: Complex Data Pipeline
// ============================================================================

console.log('\n🚀 Example 9: Complete Data Analysis Pipeline\n');

const rawData = new DataFrame({
  id: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  category: ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'],
  value: [12, 15, 18, 14, 20, 16, 22, 19, 25, 21],
  cost: [5, 7, 6, 8, 7, 9, 8, 10, 9, 11]
});

const pipeline = pipe(
  rawData,
  // 1. Add derived columns
  df => df.mutate({
    profit: row => row.value - row.cost,
    margin: row => (row.value - row.cost) / row.value
  }),
  // 2. Add window functions
  df => df.mutate({
    rank_in_category: () => rank(df, 'profit', ['category'], true),
    cumulative_profit: () => cumsum(df, 'profit', ['category'])
  }),
  // 3. Filter top performers
  df => df.filter(row => row.rank_in_category <= 3),
  // 4. Sort by category and profit
  df => df.arrange(['category', 'profit'], { decreasing: [false, true] })
);

console.log('Complete pipeline result:');
console.log(pipeline.toString());
console.log();

console.log('✅ Demo complete! Phase 4 is fully functional.');
console.log('\n🎉 Aleatory now has R/tidyverse-level data manipulation!');

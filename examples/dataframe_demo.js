/**
 * Comprehensive DataFrame Demo - Phase 4 Complete!
 * 
 * Showcases all data manipulation capabilities:
 * - Creating and manipulating DataFrames
 * - Selection, filtering, and sorting
 * - Transformations with mutate()
 * - Grouping and aggregation
 * - Reshaping (pivot, separate, unite)
 * - All join types
 * - I/O operations (CSV, JSON)
 * - Method chaining for fluent workflows
 * 
 * Run with: node examples/dataframe_demo.js
 */

import {
  DataFrame,
  pivotLonger,
  pivotWider,
  separate,
  unite,
  dropNA,
  fillNA,
  innerJoin,
  leftJoin,
  bindRows,
  writeCSV,
  readCSV
} from '../src/index.js';

console.log('\n' + '='.repeat(80));
console.log('  DATAFRAME DEMO - TIDYVERSE-STYLE DATA MANIPULATION');
console.log('='.repeat(80) + '\n');

// ============================================================================
// Example 1: Creating DataFrames
// ============================================================================

console.log('-'.repeat(80));
console.log('Example 1: Creating DataFrames');
console.log('-'.repeat(80) + '\n');

// From object (most common)
const df1 = new DataFrame({
  id: [1, 2, 3, 4, 5],
  name: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
  age: [25, 30, 35, 28, 32],
  score: [85.5, 92.0, 78.5, 88.0, 95.5]
});

console.log('Created from object:');
console.log(df1.toString());
console.log(`\nDimensions: ${df1.nrow} rows x ${df1.ncol} columns`);

// From array of objects
const people = [
  { name: 'Frank', city: 'NYC', salary: 75000 },
  { name: 'Grace', city: 'LA', salary: 82000 },
  { name: 'Henry', city: 'SF', salary: 95000 }
];

const df2 = DataFrame.fromObjects(people);

console.log('\nCreated from array of objects:');
console.log(df2.toString(5));

// ============================================================================
// Example 2: Selection and Filtering (tidyverse style)
// ============================================================================

console.log('\n' + '-'.repeat(80));
console.log('Example 2: Selection and Filtering');
console.log('-'.repeat(80) + '\n');

// Select specific columns
const selected = df1.select('name', 'score');
console.log('Select name and score columns:');
console.log(selected.toString(5));

// Filter rows
const filtered = df1.filter(row => row.age >= 30);
console.log('\nFilter: age >= 30:');
console.log(filtered.toString(5));

// Head and tail
console.log('\nFirst 3 rows:');
console.log(df1.head(3).toString(5));

// ============================================================================
// Example 3: Transformations with mutate()
// ============================================================================

console.log('\n' + '-'.repeat(80));
console.log('Example 3: Transformations with mutate()');
console.log('-'.repeat(80) + '\n');

const transformed = df1
  .mutate({
    // Computed columns
    age_category: row => row.age < 30 ? 'Young' : 'Experienced',
    score_grade: row => {
      if (row.score >= 90) return 'A';
      if (row.score >= 80) return 'B';
      return 'C';
    },
    // Constant column
    year: 2026
  });

console.log('Added computed columns:');
console.log(transformed.toString());

// ============================================================================
// Example 4: Sorting with arrange()
// ============================================================================

console.log('\n' + '-'.repeat(80));
console.log('Example 4: Sorting with arrange()');
console.log('-'.repeat(80) + '\n');

console.log('Sort by score (descending):');
const sorted = df1.arrange('score', { decreasing: true });
console.log(sorted.toString(5));

console.log('\nSort by age (ascending), then score (descending):');
const multiSort = df1.arrange(['age', 'score'], { decreasing: [false, true] });
console.log(multiSort.toString(5));

// ============================================================================
// Example 5: Grouping and Aggregation (dplyr style)
// ============================================================================

console.log('\n' + '-'.repeat(80));
console.log('Example 5: Grouping and Aggregation');
console.log('-'.repeat(80) + '\n');

const sales = new DataFrame({
  region: ['North', 'North', 'South', 'South', 'East', 'East'],
  product: ['A', 'B', 'A', 'B', 'A', 'B'],
  revenue: [1000, 1500, 1200, 1800, 900, 1300],
  quantity: [10, 15, 12, 18, 9, 13]
});

console.log('Sales data:');
console.log(sales.toString());

// Group by region
const byRegion = sales.groupBy('region').summarize({
  total_revenue: g => g.col('revenue').sum(),
  total_quantity: g => g.col('quantity').sum(),
  avg_revenue: g => g.col('revenue').mean(),
  count: g => g.nrow
});

console.log('\nGrouped by region:');
console.log(byRegion.toString());

// Group by multiple columns
const byRegionProduct = sales.groupBy('region', 'product').summarize({
  total_revenue: g => g.col('revenue').sum()
});

console.log('\nGrouped by region AND product:');
console.log(byRegionProduct.toString());

// ============================================================================
// Example 6: Method Chaining for Fluent Workflows
// ============================================================================

console.log('\n' + '-'.repeat(80));
console.log('Example 6: Method Chaining (the power of fluent API!)');
console.log('-'.repeat(80) + '\n');

const result = sales
  .filter(row => row.revenue > 1000)     // Filter high revenue
  .mutate({
    price_per_unit: row => row.revenue / row.quantity  // Add computed column
  })
  .arrange('price_per_unit', { decreasing: true })   // Sort by price
  .select('region', 'product', 'revenue', 'price_per_unit');  // Select columns

console.log('Chained: filter -> mutate -> arrange -> select:');
console.log(result.toString());

// ============================================================================
// Example 7: Reshaping - Pivot Operations
// ============================================================================

console.log('\n' + '-'.repeat(80));
console.log('Example 7: Reshaping - Pivot Operations');
console.log('-'.repeat(80) + '\n');

// Wide to long
const wide = new DataFrame({
  id: [1, 2, 3],
  Q1: [10, 15, 12],
  Q2: [12, 18, 14],
  Q3: [15, 20, 16],
  Q4: [18, 22, 19]
});

console.log('Wide format (quarterly sales):');
console.log(wide.toString());

const long = pivotLonger(wide, ['Q1', 'Q2', 'Q3', 'Q4'], {
  names_to: 'quarter',
  values_to: 'sales'
});

console.log('\nLong format (pivotLonger):');
console.log(long.toString(12));

// Long to wide
const wideAgain = pivotWider(long, {
  names_from: 'quarter',
  values_from: 'sales'
});

console.log('\nBack to wide (pivotWider):');
console.log(wideAgain.toString());

// ============================================================================
// Example 8: String Operations - Separate and Unite
// ============================================================================

console.log('\n' + '-'.repeat(80));
console.log('Example 8: String Operations');
console.log('-'.repeat(80) + '\n');

const names = new DataFrame({
  id: [1, 2, 3],
  full_name: ['John Doe', 'Jane Smith', 'Bob Johnson']
});

console.log('Original names:');
console.log(names.toString());

// Separate into first and last
const separated = separate(names, 'full_name', ['first', 'last'], { sep: ' ' });

console.log('\nSeparated into first and last:');
console.log(separated.toString());

// Unite back together
const united = unite(separated, 'name', ['first', 'last'], { sep: ', ' });

console.log('\nUnited back (Last, First format):');
console.log(united.toString());

// ============================================================================
// Example 9: Missing Data Handling
// ============================================================================

console.log('\n' + '-'.repeat(80));
console.log('Example 9: Missing Data Handling');
console.log('-'.repeat(80) + '\n');

const withNA = new DataFrame({
  id: [1, 2, 3, 4, 5],
  value: [10, null, 30, null, 50],
  category: ['A', 'B', null, 'C', 'D']
});

console.log('Data with missing values:');
console.log(withNA.toString());

// Drop rows with any NA
const dropped = dropNA(withNA);
console.log('\nAfter dropNA():');
console.log(dropped.toString());

// Fill NA with specific values
const filled = fillNA(withNA, {
  value: 0,
  category: 'Unknown'
});

console.log('\nAfter fillNA():');
console.log(filled.toString());

// ============================================================================
// Example 10: Join Operations (all types!)
// ============================================================================

console.log('\n' + '-'.repeat(80));
console.log('Example 10: Join Operations');
console.log('-'.repeat(80) + '\n');

const employees = new DataFrame({
  id: [1, 2, 3, 4],
  name: ['Alice', 'Bob', 'Charlie', 'Diana'],
  dept_id: [10, 20, 10, 30]
});

const departments = new DataFrame({
  dept_id: [10, 20, 40],
  dept_name: ['Engineering', 'Sales', 'Marketing']
});

console.log('Employees:');
console.log(employees.toString());

console.log('\nDepartments:');
console.log(departments.toString());

// Inner join
const inner = innerJoin(employees, departments, { by: 'dept_id' });
console.log('\nInner Join (matching rows only):');
console.log(inner.toString());

// Left join
const left = leftJoin(employees, departments, { by: 'dept_id' });
console.log('\nLeft Join (all employees):');
console.log(left.toString());

// ============================================================================
// Example 11: Binding DataFrames
// ============================================================================

console.log('\n' + '-'.repeat(80));
console.log('Example 11: Binding DataFrames');
console.log('-'.repeat(80) + '\n');

const batch1 = new DataFrame({
  id: [1, 2, 3],
  value: [10, 20, 30]
});

const batch2 = new DataFrame({
  id: [4, 5, 6],
  value: [40, 50, 60]
});

console.log('Batch 1:');
console.log(batch1.toString());

console.log('\nBatch 2:');
console.log(batch2.toString());

const combined = bindRows(batch1, batch2);
console.log('\nCombined (bindRows):');
console.log(combined.toString());

// ============================================================================
// Example 12: I/O Operations (CSV)
// ============================================================================

console.log('\n' + '-'.repeat(80));
console.log('Example 12: I/O Operations');
console.log('-'.repeat(80) + '\n');

// Create sample data
const ioData = new DataFrame({
  id: [1, 2, 3],
  name: ['Alice', 'Bob', 'Charlie'],
  value: [10.5, 20.75, 30.25]
});

// Write to CSV string
const csvString = writeCSV(ioData, null, { digits: 2 });
console.log('CSV output:');
console.log(csvString);

// Read from CSV string
const fromCSV = readCSV(csvString, { isString: true });
console.log('\nRead back from CSV:');
console.log(fromCSV.toString());

// ============================================================================
// Example 13: Real-World Workflow - Sales Analysis
// ============================================================================

console.log('\n' + '-'.repeat(80));
console.log('Example 13: Real-World Workflow - Sales Analysis');
console.log('-'.repeat(80) + '\n');

const transactions = new DataFrame({
  date: ['2026-01-01', '2026-01-01', '2026-01-02', '2026-01-02', '2026-01-03', '2026-01-03'],
  product: ['Laptop', 'Mouse', 'Laptop', 'Keyboard', 'Mouse', 'Laptop'],
  quantity: [2, 5, 1, 3, 8, 1],
  price: [1000, 25, 1000, 50, 25, 1000],
  region: ['North', 'North', 'South', 'South', 'East', 'East']
});

console.log('Raw transaction data:');
console.log(transactions.toString());

// Complex analysis pipeline
const analysis = transactions
  // Calculate revenue per transaction
  .mutate({
    revenue: row => row.quantity * row.price
  })
  // Group by product and region
  .groupBy('product', 'region')
  .summarize({
    total_quantity: g => g.col('quantity').sum(),
    total_revenue: g => g.col('revenue').sum(),
    avg_price: g => g.col('price').mean(),
    transactions: g => g.nrow
  });

console.log('\nSales analysis (grouped by product and region):');
console.log(analysis.arrange('total_revenue', { decreasing: true }).toString());

// Top products by revenue
const topProducts = analysis
  .groupBy('product')
  .summarize({
    total_revenue: g => g.col('total_revenue').sum()
  })
  .arrange('total_revenue', { decreasing: true });

console.log('\nTop products by total revenue:');
console.log(topProducts.toString());

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('  PHASE 4 COMPLETE - DATA MANIPULATION MASTERY!');
console.log('='.repeat(80));
console.log('\n✓ DataFrame class with column-oriented storage');
console.log('✓ Selection: select(), filter(), slice(), head(), tail()');
console.log('✓ Transformation: mutate(), rename(), arrange()');
console.log('✓ Grouping: groupBy() with summarize()');
console.log('✓ Reshaping: pivotLonger(), pivotWider()');
console.log('✓ String ops: separate(), unite()');
console.log('✓ Missing data: dropNA(), fillNA()');
console.log('✓ Joins: inner, left, right, full, anti, semi');
console.log('✓ Binding: bindRows(), bindCols()');
console.log('✓ I/O: readCSV(), writeCSV(), readJSON(), writeJSON()');
console.log('✓ Fluent API with method chaining');
console.log('✓ Pretty printing with toString()');
console.log('\n🎉 Tidyverse-style data manipulation in JavaScript!');
console.log('\n');

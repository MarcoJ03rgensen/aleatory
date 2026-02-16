/**
 * R Datasets Demo
 * Demonstrates how to use aleatory with R datasets
 */

import { 
  RDatasets, 
  readRDataset, 
  writeRDataset, 
  detectRFormat,
  lm,
  t_test,
  summary,
  mean,
  sd
} from '../src/index.js';

// Example 1: Load built-in R datasets
async function example1_builtInDatasets() {
  console.log('\n=== Example 1: Built-in R Datasets ===\n');
  
  // Load the famous iris dataset
  const iris = await RDatasets.iris();
  console.log('Iris dataset loaded:');
  console.log(iris.toString());
  console.log('\nFirst 5 rows:');
  console.log(iris.head(5).toString());
  
  // Summary statistics
  console.log('\nSpecies distribution:');
  const speciesCounts = iris.groupBy('species')
    .summarize({ count: rows => rows.length });
  console.log(speciesCounts.toString());
  
  // Statistical analysis
  console.log('\nMean sepal length by species:');
  const sepalStats = iris.groupBy('species')
    .summarize({
      mean_sepal_length: rows => mean(rows.map(r => r.sepal_length)),
      sd_sepal_length: rows => sd(rows.map(r => r.sepal_length))
    });
  console.log(sepalStats.toString());
}

// Example 2: Load mtcars and perform regression analysis
async function example2_mtcarsRegression() {
  console.log('\n=== Example 2: mtcars Regression Analysis ===\n');
  
  const mtcars = await RDatasets.mtcars();
  console.log('mtcars dataset loaded:');
  console.log(mtcars.head(5).toString());
  
  // Linear regression: mpg ~ hp + wt
  const model = lm(mtcars.data.mpg, [mtcars.data.hp, mtcars.data.wt]);
  
  console.log('\nLinear Model: mpg ~ hp + wt');
  console.log(`R² = ${model.r_squared.toFixed(4)}`);
  console.log(`Adjusted R² = ${model.adj_r_squared.toFixed(4)}`);
  console.log(`F-statistic = ${model.fstatistic.toFixed(2)}`);
  console.log(`p-value = ${model.f_p_value.toExponential(3)}`);
  
  console.log('\nCoefficients:');
  const coefNames = ['(Intercept)', 'hp', 'wt'];
  for (let i = 0; i < model.coefficients.length; i++) {
    console.log(`  ${coefNames[i]}: ${model.coefficients[i].toFixed(4)} (p=${model.p_values[i].toExponential(3)})`);
  }
}

// Example 3: Custom R dataset from URL
async function example3_customDataset() {
  console.log('\n=== Example 3: Custom R Dataset ===\n');
  
  try {
    // Load penguins dataset
    const penguins = await RDatasets.penguins();
    console.log('Penguins dataset loaded:');
    console.log(penguins.head(5).toString());
    
    // Filter out NA values and perform t-test
    const adelie = penguins
      .filter(row => row.species === 'Adelie' && row.bill_length_mm !== null)
      .data.bill_length_mm;
    
    const chinstrap = penguins
      .filter(row => row.species === 'Chinstrap' && row.bill_length_mm !== null)
      .data.bill_length_mm;
    
    console.log('\nTwo-sample t-test: Adelie vs Chinstrap bill length');
    const result = t_test(adelie, chinstrap);
    console.log(`t = ${result.statistic.t.toFixed(3)}`);
    console.log(`df = ${result.parameter.df.toFixed(1)}`);
    console.log(`p-value = ${result.p_value.toExponential(3)}`);
    console.log(`Mean difference = ${(result.estimate.mean_x - result.estimate.mean_y).toFixed(2)} mm`);
  } catch (error) {
    console.log('Could not load penguins dataset:', error.message);
  }
}

// Example 4: Read and write R-formatted CSV files
async function example4_readWriteRCSV() {
  console.log('\n=== Example 4: Read/Write R-formatted CSV ===\n');
  
  // Simulate R CSV with row names (using string instead of file)
  const rStyleCSV = `"",mpg,cyl,hp
"Mazda RX4",21.0,6,110
"Mazda RX4 Wag",21.0,6,110
"Datsun 710",22.8,4,93
"Hornet 4 Drive",21.4,6,110
"Hornet Sportabout",18.7,8,175`;
  
  console.log('R-style CSV input:');
  console.log(rStyleCSV.substring(0, 150) + '...');
  
  // Read with R conventions
  const df = readRDataset(rStyleCSV, {
    isString: true,
    rowNames: true
  });
  
  console.log('\nParsed DataFrame:');
  console.log(df.toString());
  
  // Write back to R format
  const outputCSV = writeRDataset(df, null, {
    rowNames: true,
    na: 'NA'
  });
  
  console.log('\nExported to R-style CSV:');
  console.log(outputCSV.substring(0, 150) + '...');
}

// Example 5: Detect R format automatically
async function example5_autoDetect() {
  console.log('\n=== Example 5: Auto-detect R Format ===\n');
  
  const csvWithRowNames = `"",x,y,z
1,10,NA,5
2,20,15,NA
3,30,25,15`;
  
  const info = detectRFormat(csvWithRowNames);
  
  console.log('CSV content:');
  console.log(csvWithRowNames);
  console.log('\nDetection results:');
  console.log(`  Has row names: ${info.hasRowNames}`);
  console.log(`  Has NA values: ${info.hasNAValues}`);
  console.log(`  Suggested options:`, info.suggestedOptions);
  
  // Load with detected options
  const df = readRDataset(csvWithRowNames, {
    isString: true,
    ...info.suggestedOptions
  });
  
  console.log('\nParsed DataFrame:');
  console.log(df.toString());
}

// Example 6: Working with factors (R categorical data)
async function example6_factors() {
  console.log('\n=== Example 6: Working with Factors ===\n');
  
  const iris = await RDatasets.iris();
  
  // Species is already a factor
  const speciesCol = iris.data.species;
  console.log('Species factor:');
  console.log(`  Type: ${speciesCol.constructor.name}`);
  console.log(`  Levels: ${speciesCol.levels.join(', ')}`);
  console.log(`  Number of levels: ${speciesCol.nlevels()}`);
  
  // Get counts per level
  console.log('\nCounts per level:');
  const counts = {};
  for (let i = 0; i < speciesCol.length; i++) {
    const level = speciesCol.get(i);
    counts[level] = (counts[level] || 0) + 1;
  }
  for (const [level, count] of Object.entries(counts)) {
    console.log(`  ${level}: ${count}`);
  }
}

// Example 7: Complex data manipulation with R datasets
async function example7_tidyverse() {
  console.log('\n=== Example 7: Tidyverse-style Operations ===\n');
  
  const mtcars = await RDatasets.mtcars();
  
  // Chain multiple operations
  const result = mtcars
    .filter(row => row.cyl >= 6)  // Only 6 and 8 cylinder cars
    .mutate({
      hp_per_cyl: row => row.hp / row.cyl,  // Add new column
      kpl: row => row.mpg * 0.425  // Convert mpg to km/L
    })
    .arrange('hp_per_cyl', { decreasing: true })  // Sort by power per cylinder
    .select('mpg', 'cyl', 'hp', 'hp_per_cyl', 'kpl')  // Select columns
    .head(10);  // Top 10
  
  console.log('Top 10 cars by horsepower per cylinder (6+ cylinders):');
  console.log(result.toString());
}

// Run all examples
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     Aleatory R Datasets Compatibility Demo        ║');
  console.log('╚════════════════════════════════════════════════════╝');
  
  try {
    await example1_builtInDatasets();
    await example2_mtcarsRegression();
    await example3_customDataset();
    await example4_readWriteRCSV();
    await example5_autoDetect();
    await example6_factors();
    await example7_tidyverse();
    
    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    console.error(error.stack);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  example1_builtInDatasets,
  example2_mtcarsRegression,
  example3_customDataset,
  example4_readWriteRCSV,
  example5_autoDetect,
  example6_factors,
  example7_tidyverse
};

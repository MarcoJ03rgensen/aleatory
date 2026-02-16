/**
 * Aleatory Visualization Demo
 * Run with: node examples/vis_demo.js
 * 
 * Note: This demo shows the API. For actual rendering in Node.js,
 * you would need to use plotly.js-dist-min or export specs to JSON.
 */

import * as aleatory from '../src/index.js';

console.log('🎲 Aleatory Visualization Demo\n');

// Generate sample data
console.log('Generating sample data...');
const normalData = aleatory.rnorm(100, { mean: 0, sd: 1 });
const x = Array.from({ length: 50 }, (_, i) => i / 5);
const y = x.map((xi, i) => 2 + 3 * xi + aleatory.rnorm(1, { mean: 0, sd: 1 })[0]);

// Create histogram
console.log('\n📊 Creating Histogram...');
const config = aleatory.vis.applyTheme('publication');
const histFig = aleatory.vis.createHistogram(normalData, config, {
  title: 'Normal Distribution Sample',
  showDensity: true,
  showNormal: true,
  xlab: 'Value',
  ylab: 'Density'
});
console.log('Histogram spec:', JSON.stringify(histFig, null, 2).slice(0, 500) + '...');

// Create Q-Q plot
console.log('\n📈 Creating Q-Q Plot...');
const qqFig = aleatory.vis.createQQPlot(normalData, config);
console.log('Q-Q plot has', qqFig.data.length, 'traces');

// Fit linear model and create diagnostic plots
console.log('\n📉 Fitting Linear Model...');
const fit = aleatory.lm(y, [x]);
console.log('Model R² =', fit.r_squared.toFixed(4));
console.log('Coefficients:', fit.coefficients.map(c => c.toFixed(3)));

// Create scatter plot with regression line
console.log('\n🎯 Creating Scatter Plot...');
const scatterFig = aleatory.vis.createScatterPlot({ x, y }, config, {
  title: 'Linear Regression',
  fit: fit,
  xlab: 'X',
  ylab: 'Y'
});
console.log('Scatter plot has', scatterFig.data.length, 'traces');

// Create residuals plot
console.log('\n🔍 Creating Residuals Plot...');
const residualsFig = aleatory.vis.createResidualsPlot(fit, config, {
  showSmooth: true
});
console.log('Residuals plot created');

// Demonstrate theme switching
console.log('\n🎨 Theme Showcase:');
const themes = aleatory.vis.getThemes();
themes.forEach(theme => {
  const themeConfig = aleatory.vis.applyTheme(theme);
  console.log(`  - ${theme}: primary color = ${themeConfig.colors.primary}`);
});

// Create DataFrame visualization
console.log('\n📊 DataFrame Visualization...');
const df = new aleatory.DataFrame({
  group: ['A', 'A', 'A', 'B', 'B', 'B', 'C', 'C', 'C'],
  value: [10, 12, 11, 15, 14, 16, 8, 9, 10]
});

const boxFig = aleatory.vis.createBoxPlot(df, config, {
  groupBy: 'group',
  y: 'value',
  title: 'Values by Group',
  showMean: true
});
console.log('Box plot created for', Object.keys(boxFig.data).length, 'groups');

// Export figure specs to JSON (for use in web)
console.log('\n💾 Figure specs can be exported to JSON:');
console.log('Example: JSON.stringify(histFig) -> use in Plotly.newPlot()');
console.log('\n✅ Demo complete! Open examples/visualization_gallery.html in a browser to see interactive plots.');

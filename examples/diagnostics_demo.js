/**
 * Demonstration of Model Diagnostics and Summaries in Aleatory
 * 
 * This demo shows:
 * - R-style model summaries for lm and glm
 * - Influence diagnostics (leverage, Cook's D, DFBETAS)
 * - Confidence intervals for coefficients
 * - Prediction and confidence intervals
 * - Identifying influential observations
 * 
 * Run with: node examples/diagnostics_demo.js
 */

import { 
  lm, 
  glm, 
  binomial,
  diagnostics, 
  confint, 
  predictWithInterval,
  summarizeModel,
  printModelSummary
} from '../src/index.js';

console.log('\n' + '='.repeat(70));
console.log('  MODEL DIAGNOSTICS AND SUMMARIES DEMO');
console.log('='.repeat(70) + '\n');

// ============================================================================
// Example 1: Linear Model Summary (R-style)
// ============================================================================

console.log('-'.repeat(70));
console.log('Example 1: Linear Model Summary (R-style output)');
console.log('-'.repeat(70));

const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const y = [2.1, 4.2, 5.9, 8.1, 10.3, 12.1, 13.8, 16.2, 18.1, 19.9];

const fit1 = lm(y, [x]);
const summary1 = summarizeModel(fit1);

console.log(printModelSummary(summary1));

// ============================================================================
// Example 2: Coefficient Confidence Intervals
// ============================================================================

console.log('-'.repeat(70));
console.log('Example 2: Confidence Intervals for Coefficients');
console.log('-'.repeat(70) + '\n');

const ci_95 = confint(fit1, 0.95);
const ci_99 = confint(fit1, 0.99);

console.log('95% Confidence Intervals:');
for (const interval of ci_95) {
  console.log(`  ${interval.coefficient}:`);
  console.log(`    Estimate: ${interval.estimate.toFixed(4)}`);
  console.log(`    95% CI: [${interval.lower.toFixed(4)}, ${interval.upper.toFixed(4)}]`);
}

console.log('\n99% Confidence Intervals:');
for (const interval of ci_99) {
  console.log(`  ${interval.coefficient}:`);
  console.log(`    99% CI: [${interval.lower.toFixed(4)}, ${interval.upper.toFixed(4)}]`);
}

// ============================================================================
// Example 3: Prediction Intervals
// ============================================================================

console.log('\n' + '-'.repeat(70));
console.log('Example 3: Confidence vs. Prediction Intervals');
console.log('-'.repeat(70) + '\n');

const new_x = [5, 11, 15];

// Confidence interval (for mean response)
const conf_int = predictWithInterval(fit1, [new_x], 0.95, 'confidence');

console.log('Confidence Intervals (for mean response):');
for (let i = 0; i < new_x.length; i++) {
  const p = conf_int.predictions[i];
  console.log(`  x = ${new_x[i]}:`);
  console.log(`    Predicted: ${p.fit.toFixed(4)}`);
  console.log(`    95% CI: [${p.lower.toFixed(4)}, ${p.upper.toFixed(4)}]`);
  console.log(`    SE: ${p.se.toFixed(4)}`);
}

// Prediction interval (for individual observation)
const pred_int = predictWithInterval(fit1, [new_x], 0.95, 'prediction');

console.log('\nPrediction Intervals (for individual observation):');
for (let i = 0; i < new_x.length; i++) {
  const p = pred_int.predictions[i];
  console.log(`  x = ${new_x[i]}:`);
  console.log(`    Predicted: ${p.fit.toFixed(4)}`);
  console.log(`    95% PI: [${p.lower.toFixed(4)}, ${p.upper.toFixed(4)}]`);
  console.log(`    SE: ${p.se.toFixed(4)}`);
}

console.log('\nNote: Prediction intervals are wider because they account for');
console.log('      individual observation variability, not just mean estimation.');

// ============================================================================
// Example 4: Influence Diagnostics
// ============================================================================

console.log('\n' + '-'.repeat(70));
console.log('Example 4: Influence Diagnostics');
console.log('-'.repeat(70) + '\n');

const diag1 = diagnostics(fit1);

console.log('Leverage (Hat Values):');
console.log('  Mean leverage:', diag1.mean_leverage.toFixed(4));
console.log('  Max leverage:', diag1.max_leverage.toFixed(4));
console.log('  Threshold (2p/n):', (2 * fit1.p / fit1.n).toFixed(4));

console.log('\nCook\'s Distance:');
console.log('  Max Cook\'s D:', diag1.max_cooks_d.toFixed(6));
console.log('  Threshold (4/n):', (4 / fit1.n).toFixed(4));

if (diag1.influential.length > 0) {
  console.log('\nInfluential Observations:');
  for (const inf of diag1.influential) {
    console.log(`  Observation ${inf.observation}:`);
    console.log(`    Reasons: ${inf.reasons.join(', ')}`);
    console.log(`    Leverage: ${inf.leverage.toFixed(4)}`);
    console.log(`    Cook's D: ${inf.cooks_d.toFixed(6)}`);
  }
} else {
  console.log('\nNo influential observations detected.');
}

console.log('\nFirst 5 observations - detailed diagnostics:');
for (let i = 0; i < Math.min(5, fit1.n); i++) {
  console.log(`  Obs ${i + 1}:`);
  console.log(`    Leverage: ${diag1.leverage[i].toFixed(4)}`);
  console.log(`    Cook's D: ${diag1.cooks_distance[i].toFixed(6)}`);
  console.log(`    Std. residual: ${diag1.standardized_residuals[i].toFixed(4)}`);
  console.log(`    Student residual: ${diag1.studentized_residuals[i].toFixed(4)}`);
}

// ============================================================================
// Example 5: Detecting Outliers and Influential Points
// ============================================================================

console.log('\n' + '-'.repeat(70));
console.log('Example 5: Dataset with Outlier');
console.log('-'.repeat(70) + '\n');

// Create data with an outlier
const x2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 15]; // 15 is leverage point
const y2 = [2, 4, 6, 8, 10, 12, 14, 16, 18, 50]; // 50 is outlier

const fit2 = lm(y2, [x2]);
const diag2 = diagnostics(fit2);

console.log('Dataset includes:');
console.log('  - Leverage point: x = 15');
console.log('  - Outlier: y = 50');

console.log('\nInfluential observations detected:');
if (diag2.influential.length > 0) {
  for (const inf of diag2.influential) {
    console.log(`  Observation ${inf.observation}: ${inf.reasons.join(', ')}`);
    console.log(`    x = ${x2[inf.observation - 1]}, y = ${y2[inf.observation - 1]}`);
    console.log(`    Leverage: ${inf.leverage.toFixed(4)}`);
    console.log(`    Cook's D: ${inf.cooks_d.toFixed(4)}`);
    console.log(`    DFFITS: ${inf.dffits.toFixed(4)}`);
  }
} else {
  console.log('  None detected');
}

// Compare models with and without outlier
console.log('\nModel comparison (with vs. without outlier):');
const x2_clean = x2.slice(0, -1);
const y2_clean = y2.slice(0, -1);
const fit2_clean = lm(y2_clean, [x2_clean]);

console.log('  With outlier:');
console.log(`    Intercept: ${fit2.coefficients[0].toFixed(4)}`);
console.log(`    Slope: ${fit2.coefficients[1].toFixed(4)}`);
console.log(`    R²: ${fit2.r_squared.toFixed(4)}`);

console.log('  Without outlier:');
console.log(`    Intercept: ${fit2_clean.coefficients[0].toFixed(4)}`);
console.log(`    Slope: ${fit2_clean.coefficients[1].toFixed(4)}`);
console.log(`    R²: ${fit2_clean.r_squared.toFixed(4)}`);

console.log('\nNote: Outlier significantly affects model estimates!');

// ============================================================================
// Example 6: GLM Summary
// ============================================================================

console.log('\n' + '-'.repeat(70));
console.log('Example 6: Generalized Linear Model Summary');
console.log('-'.repeat(70));

const x3 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const y3 = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];

const fit3 = glm(y3, [x3], { family: binomial() });
const summary3 = summarizeModel(fit3);

console.log(printModelSummary(summary3));

// ============================================================================
// Example 7: Multiple Regression Diagnostics
// ============================================================================

console.log('-'.repeat(70));
console.log('Example 7: Multiple Regression Diagnostics');
console.log('-'.repeat(70) + '\n');

const x1_multi = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const x2_multi = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const y_multi = [5, 8, 11, 14, 17, 20, 23, 26, 29, 32];

const fit_multi = lm(y_multi, [x1_multi, x2_multi]);
const diag_multi = diagnostics(fit_multi);

console.log('Model: y ~ x1 + x2');
console.log('\nCoefficients:');
console.log(`  Intercept: ${fit_multi.coefficients[0].toFixed(4)}`);
console.log(`  x1: ${fit_multi.coefficients[1].toFixed(4)}`);
console.log(`  x2: ${fit_multi.coefficients[2].toFixed(4)}`);

console.log('\nDFBETAS (influence on each coefficient):');
console.log('  Obs  |  Intercept  |     x1      |     x2');
console.log('  ' + '-'.repeat(50));
for (let i = 0; i < Math.min(5, fit_multi.n); i++) {
  const dfb = diag_multi.dfbetas[i];
  console.log(
    `  ${(i + 1).toString().padStart(3)}  | ` +
    `${dfb[0].toFixed(6).padStart(11)} | ` +
    `${dfb[1].toFixed(6).padStart(11)} | ` +
    `${dfb[2].toFixed(6).padStart(11)}`
  );
}

// Confidence intervals for multiple regression
console.log('\n95% Confidence Intervals:');
const ci_multi = confint(fit_multi, 0.95);
for (const interval of ci_multi) {
  console.log(
    `  ${interval.coefficient.padEnd(12)}: ` +
    `[${interval.lower.toFixed(4)}, ${interval.upper.toFixed(4)}]`
  );
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('  DIAGNOSTICS DEMO COMPLETE');
console.log('='.repeat(70));
console.log('\nKey Features Demonstrated:');
console.log('  ✓ R-style model summaries');
console.log('  ✓ Coefficient confidence intervals');
console.log('  ✓ Prediction vs. confidence intervals');
console.log('  ✓ Leverage and Cook\'s distance');
console.log('  ✓ DFBETAS and DFFITS');
console.log('  ✓ Automatic influential observation detection');
console.log('  ✓ Outlier impact analysis');
console.log('  ✓ Multiple regression diagnostics');
console.log('  ✓ GLM summaries');
console.log('\n');

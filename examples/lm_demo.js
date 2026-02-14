/**
 * Demonstration of lm() - Linear Models
 * Shows simple and multiple regression with real-world examples
 */

import aleatory from '../src/index.js';
const { lm, predict } = aleatory;

console.log('\n=== ALEATORY LINEAR MODELS DEMO ===\n');

// ============================================
// Example 1: Simple Linear Regression
// Predicting house prices from square footage
// ============================================
console.log('\n--- Example 1: Simple Linear Regression ---');
console.log('Predicting house prices from square footage\n');

const sqft = [1000, 1200, 1400, 1600, 1800, 2000, 2200];
const price = [150, 170, 195, 220, 240, 270, 295]; // in thousands

const fit1 = lm(price, [sqft]);

console.log('Model: price = β₀ + β₁ × sqft\n');
console.log('Coefficients:');
console.log(`  Intercept: ${fit1.coefficients[0].toFixed(4)}`);
console.log(`  sqft:      ${fit1.coefficients[1].toFixed(4)}`);
console.log(`\nInterpretation: Each additional square foot increases price by $${(fit1.coefficients[1] * 1000).toFixed(0)}`);

console.log('\nModel Fit:');
console.log(`  R²:                ${fit1.r_squared.toFixed(4)} (${(fit1.r_squared * 100).toFixed(2)}% variance explained)`);
console.log(`  Adjusted R²:       ${fit1.adj_r_squared.toFixed(4)}`);
console.log(`  Residual Std Err:  ${fit1.sigma.toFixed(4)}`);
console.log(`  F-statistic:       ${fit1.f_statistic.toFixed(2)} (p = ${fit1.f_pvalue.toExponential(3)})`);

console.log('\nCoefficient Tests (H₀: β = 0):');
for (let i = 0; i < fit1.coefficients.length; i++) {
  const significance = fit1.p_values[i] < 0.001 ? '***' : fit1.p_values[i] < 0.01 ? '**' : fit1.p_values[i] < 0.05 ? '*' : '';
  console.log(`  ${fit1.coef_names[i].padEnd(12)}: t = ${fit1.t_values[i].toFixed(3)}, p = ${fit1.p_values[i].toExponential(3)} ${significance}`);
}

// Make predictions
console.log('\nPredictions:');
const new_sqft = [1500, 2500, 3000];
const predictions = predict(fit1, [new_sqft]);
for (let i = 0; i < new_sqft.length; i++) {
  console.log(`  ${new_sqft[i]} sqft → $${predictions[i].toFixed(2)}k`);
}

// ============================================
// Example 2: Multiple Linear Regression
// Predicting exam scores from study hours and attendance
// ============================================
console.log('\n\n--- Example 2: Multiple Linear Regression ---');
console.log('Predicting exam scores from study hours and attendance rate\n');

const study_hours = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const attendance = [60, 70, 75, 80, 85, 90, 92, 95, 98]; // percentage
const exam_score = [55, 62, 68, 72, 78, 83, 87, 91, 95];

const fit2 = lm(exam_score, [study_hours, attendance]);

console.log('Model: score = β₀ + β₁ × hours + β₂ × attendance\n');
console.log('Coefficients:');
console.log(`  Intercept:   ${fit2.coefficients[0].toFixed(4)}`);
console.log(`  hours:       ${fit2.coefficients[1].toFixed(4)}`);
console.log(`  attendance:  ${fit2.coefficients[2].toFixed(4)}`);

console.log('\nInterpretation:');
console.log(`  - Each additional study hour increases score by ${fit2.coefficients[1].toFixed(2)} points`);
console.log(`  - Each 1% increase in attendance increases score by ${fit2.coefficients[2].toFixed(2)} points`);

console.log('\nModel Fit:');
console.log(`  R²:                ${fit2.r_squared.toFixed(4)} (${(fit2.r_squared * 100).toFixed(2)}% variance explained)`);
console.log(`  Adjusted R²:       ${fit2.adj_r_squared.toFixed(4)}`);
console.log(`  Residual Std Err:  ${fit2.sigma.toFixed(4)}`);
console.log(`  F-statistic:       ${fit2.f_statistic.toFixed(2)} (p = ${fit2.f_pvalue.toExponential(3)})`);

console.log('\nCoefficient Tests:');
for (let i = 0; i < fit2.coefficients.length; i++) {
  const se = fit2.std_errors[i];
  const ci_lower = fit2.coefficients[i] - 1.96 * se;
  const ci_upper = fit2.coefficients[i] + 1.96 * se;
  const significance = fit2.p_values[i] < 0.001 ? '***' : fit2.p_values[i] < 0.01 ? '**' : fit2.p_values[i] < 0.05 ? '*' : '';
  console.log(`  ${fit2.coef_names[i].padEnd(12)}: ${fit2.coefficients[i].toFixed(4)} ± ${se.toFixed(4)} (95% CI: [${ci_lower.toFixed(2)}, ${ci_upper.toFixed(2)}]) ${significance}`);
}

// ============================================
// Example 3: Model Without Intercept
// Physics: Distance vs Time (should pass through origin)
// ============================================
console.log('\n\n--- Example 3: Model Through Origin ---');
console.log('Physics: Distance = velocity × time (no intercept)\n');

const time = [1, 2, 3, 4, 5, 6, 7]; // seconds
const distance = [9.8, 20.1, 29.5, 40.2, 49.8, 59.7, 70.3]; // meters (g ≈ 9.8 m/s²)

const fit3 = lm(distance, [time], { intercept: false });

console.log('Model: distance = β₁ × time (forced through origin)\n');
console.log('Coefficients:');
console.log(`  velocity: ${fit3.coefficients[0].toFixed(4)} m/s`);
console.log(`\nCompare to theoretical: ~9.8 m/s² (acceleration due to gravity)`);

console.log('\nModel Fit:');
console.log(`  R²:                ${fit3.r_squared.toFixed(4)}`);
console.log(`  Residual Std Err:  ${fit3.sigma.toFixed(4)}`);

// ============================================
// Example 4: Residual Analysis
// ============================================
console.log('\n\n--- Example 4: Residual Analysis ---');
console.log('Examining model fit quality\n');

const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const y = [2.3, 4.1, 5.8, 8.2, 9.9, 12.1, 13.8, 16.2, 17.9, 20.1];

const fit4 = lm(y, [x]);

console.log('Residual Statistics:');
const residuals = fit4.residuals;
const mean_residual = residuals.reduce((a, b) => a + b, 0) / residuals.length;
const abs_residuals = residuals.map(r => Math.abs(r));
const max_residual = Math.max(...abs_residuals);
const min_residual = Math.min(...residuals);
const max_residual_val = Math.max(...residuals);

console.log(`  Mean residual:     ${mean_residual.toFixed(6)} (should be ≈0)`);
console.log(`  Min residual:      ${min_residual.toFixed(4)}`);
console.log(`  Max residual:      ${max_residual_val.toFixed(4)}`);
console.log(`  Max |residual|:    ${max_residual.toFixed(4)}`);

console.log('\nFitted vs Actual:');
console.log('  x      Actual   Fitted   Residual');
for (let i = 0; i < x.length; i++) {
  console.log(`  ${x[i].toString().padStart(2)}     ${y[i].toFixed(2).padStart(6)}   ${fit4.fitted_values[i].toFixed(2).padStart(6)}   ${fit4.residuals[i].toFixed(3).padStart(7)}`);
}

console.log('\n\n=== DEMO COMPLETE ===\n');

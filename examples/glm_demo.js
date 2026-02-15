/**
 * Demonstration of Generalized Linear Models (GLM) in Aleatory
 * 
 * This demo shows:
 * - Logistic regression for binary outcomes
 * - Poisson regression for count data
 * - Gamma regression for positive continuous data
 * - Model diagnostics and predictions
 * 
 * Run with: node examples/glm_demo.js
 */

import { glm, predictGlm, gaussian, binomial, poisson, Gamma } from '../src/index.js';

console.log('\n' + '='.repeat(60));
console.log('  GENERALIZED LINEAR MODELS (GLM) DEMO');
console.log('='.repeat(60) + '\n');

// ============================================================================
// Example 1: Logistic Regression (Binary Classification)
// ============================================================================

console.log('\n' + '-'.repeat(60));
console.log('Example 1: Logistic Regression');
console.log('-'.repeat(60));
console.log('\nPredicting pass/fail based on study hours\n');

const study_hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const passed = [0, 0, 0, 0, 1, 0, 1, 1, 1, 1]; // 0 = fail, 1 = pass

const logit_model = glm(passed, [study_hours], { family: binomial() });

console.log('Model Summary:');
console.log('  Family:', logit_model.family);
console.log('  Link:', logit_model.link);
console.log('\nCoefficients:');
console.log('  Intercept:', logit_model.coefficients[0].toFixed(4));
console.log('  study_hours:', logit_model.coefficients[1].toFixed(4));

console.log('\nModel Fit:');
console.log('  Null deviance:', logit_model.null_deviance.toFixed(4));
console.log('  Residual deviance:', logit_model.deviance.toFixed(4));
console.log('  AIC:', logit_model.aic.toFixed(4));
console.log('  Converged:', logit_model.converged);

// Pseudo R-squared (McFadden's)
const pseudo_r2 = 1 - (logit_model.deviance / logit_model.null_deviance);
console.log('  Pseudo R²:', pseudo_r2.toFixed(4));

// Predictions
console.log('\nPredictions (probability of passing):');
const new_hours = [3, 5, 7, 9];
const pass_probs = predictGlm(logit_model, [new_hours], 'response');

for (let i = 0; i < new_hours.length; i++) {
  console.log(`  ${new_hours[i]} hours: ${(pass_probs[i] * 100).toFixed(1)}% chance of passing`);
}

// Linear predictors (logit scale)
console.log('\nLinear predictors (logit scale):');
const logits = predictGlm(logit_model, [new_hours], 'link');
for (let i = 0; i < new_hours.length; i++) {
  console.log(`  ${new_hours[i]} hours: log-odds = ${logits[i].toFixed(4)}`);
}

// ============================================================================
// Example 2: Poisson Regression (Count Data)
// ============================================================================

console.log('\n' + '-'.repeat(60));
console.log('Example 2: Poisson Regression');
console.log('-'.repeat(60));
console.log('\nModeling website visits based on advertising spend\n');

const ad_spend = [10, 20, 30, 40, 50, 60, 70, 80];
const visits = [15, 22, 35, 48, 62, 75, 95, 108];

const poisson_model = glm(visits, [ad_spend], { family: poisson() });

console.log('Model Summary:');
console.log('  Family:', poisson_model.family);
console.log('  Link:', poisson_model.link);
console.log('\nCoefficients:');
console.log('  Intercept:', poisson_model.coefficients[0].toFixed(4));
console.log('  ad_spend:', poisson_model.coefficients[1].toFixed(4));

console.log('\nModel Fit:');
console.log('  Null deviance:', poisson_model.null_deviance.toFixed(4));
console.log('  Residual deviance:', poisson_model.deviance.toFixed(4));
console.log('  AIC:', poisson_model.aic.toFixed(4));
console.log('  Dispersion:', poisson_model.dispersion.toFixed(4));

// Check for overdispersion
if (poisson_model.dispersion > 1.5) {
  console.log('  Warning: Possible overdispersion detected!');
}

// Predictions
console.log('\nPredicted visits for new ad spend levels:');
const new_spend = [25, 50, 75, 100];
const predicted_visits = predictGlm(poisson_model, [new_spend], 'response');

for (let i = 0; i < new_spend.length; i++) {
  console.log(`  $${new_spend[i]}: ${predicted_visits[i].toFixed(1)} visits`);
}

// Rate of change
const rate_multiplier = Math.exp(poisson_model.coefficients[1]);
console.log('\nInterpretation:');
console.log(`  Each $1 increase in ad spend multiplies expected visits by ${rate_multiplier.toFixed(4)}`);
console.log(`  (${((rate_multiplier - 1) * 100).toFixed(2)}% increase per dollar)`);

// ============================================================================
// Example 3: Gamma Regression (Positive Continuous Data)
// ============================================================================

console.log('\n' + '-'.repeat(60));
console.log('Example 3: Gamma Regression');
console.log('-'.repeat(60));
console.log('\nModeling response time vs. system load\n');

const system_load = [10, 20, 30, 40, 50, 60, 70, 80];
const response_time = [50, 55, 65, 80, 110, 150, 210, 300]; // milliseconds

const gamma_model = glm(response_time, [system_load], { family: Gamma('log') });

console.log('Model Summary:');
console.log('  Family:', gamma_model.family);
console.log('  Link:', gamma_model.link);
console.log('\nCoefficients:');
console.log('  Intercept:', gamma_model.coefficients[0].toFixed(4));
console.log('  system_load:', gamma_model.coefficients[1].toFixed(4));

console.log('\nModel Fit:');
console.log('  Deviance:', gamma_model.deviance.toFixed(4));
console.log('  AIC:', gamma_model.aic.toFixed(4));

// Predictions
console.log('\nPredicted response times:');
const new_loads = [25, 50, 75, 90];
const predicted_times = predictGlm(gamma_model, [new_loads], 'response');

for (let i = 0; i < new_loads.length; i++) {
  console.log(`  Load ${new_loads[i]}%: ${predicted_times[i].toFixed(1)} ms`);
}

// ============================================================================
// Example 4: Multiple Predictors (Multiple Logistic Regression)
// ============================================================================

console.log('\n' + '-'.repeat(60));
console.log('Example 4: Multiple Logistic Regression');
console.log('-'.repeat(60));
console.log('\nPredicting loan approval based on income and credit score\n');

const income = [30, 40, 50, 60, 70, 80, 90, 100]; // thousands
const credit_score = [550, 600, 650, 700, 720, 750, 780, 800];
const approved = [0, 0, 0, 1, 1, 1, 1, 1];

const multi_logit = glm(approved, [income, credit_score], { family: binomial() });

console.log('Model Summary:');
console.log('\nCoefficients:');
console.log('  Intercept:', multi_logit.coefficients[0].toFixed(4));
console.log('  income:', multi_logit.coefficients[1].toFixed(4));
console.log('  credit_score:', multi_logit.coefficients[2].toFixed(4));

console.log('\nModel Fit:');
console.log('  Deviance:', multi_logit.deviance.toFixed(4));
console.log('  AIC:', multi_logit.aic.toFixed(4));

// Predictions for different scenarios
console.log('\nApproval probability scenarios:');
const scenarios = [
  { income: 45, credit: 620, label: 'Low income, fair credit' },
  { income: 60, credit: 700, label: 'Medium income, good credit' },
  { income: 85, credit: 780, label: 'High income, excellent credit' }
];

for (const scenario of scenarios) {
  const prob = predictGlm(multi_logit, [[scenario.income], [scenario.credit]], 'response');
  console.log(`  ${scenario.label}:`);
  console.log(`    Income: $${scenario.income}k, Credit: ${scenario.credit}`);
  console.log(`    Approval probability: ${(prob[0] * 100).toFixed(1)}%`);
}

// ============================================================================
// Example 5: Gaussian GLM (equivalent to linear regression)
// ============================================================================

console.log('\n' + '-'.repeat(60));
console.log('Example 5: Gaussian GLM (Linear Regression)');
console.log('-'.repeat(60));
console.log('\nGaussian GLM is equivalent to OLS regression\n');

const x = [1, 2, 3, 4, 5];
const y = [2.1, 3.9, 6.2, 7.8, 10.1];

const gaussian_model = glm(y, [x], { family: gaussian() });

console.log('Coefficients:');
console.log('  Intercept:', gaussian_model.coefficients[0].toFixed(4));
console.log('  Slope:', gaussian_model.coefficients[1].toFixed(4));

console.log('\nModel Fit:');
console.log('  Deviance (RSS):', gaussian_model.deviance.toFixed(4));
console.log('  AIC:', gaussian_model.aic.toFixed(4));

// ============================================================================
// Residual Diagnostics
// ============================================================================

console.log('\n' + '-'.repeat(60));
console.log('Residual Diagnostics (Logistic Model)');
console.log('-'.repeat(60) + '\n');

console.log('First few observations:');
for (let i = 0; i < Math.min(5, logit_model.n); i++) {
  console.log(`  Obs ${i + 1}:`);
  console.log(`    Observed: ${passed[i]}`);
  console.log(`    Fitted: ${logit_model.fitted_values[i].toFixed(4)}`);
  console.log(`    Response residual: ${logit_model.residuals[i].toFixed(4)}`);
  console.log(`    Deviance residual: ${logit_model.deviance_residuals[i].toFixed(4)}`);
  console.log(`    Pearson residual: ${logit_model.pearson_residuals[i].toFixed(4)}`);
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('  GLM DEMO COMPLETE');
console.log('='.repeat(60));
console.log('\nKey Takeaways:');
console.log('  ✓ Logistic regression for binary outcomes');
console.log('  ✓ Poisson regression for count data');
console.log('  ✓ Gamma regression for positive continuous data');
console.log('  ✓ Multiple predictors supported');
console.log('  ✓ Link and response scale predictions');
console.log('  ✓ Multiple residual types for diagnostics');
console.log('  ✓ Full convergence checking and AIC');
console.log('\n');

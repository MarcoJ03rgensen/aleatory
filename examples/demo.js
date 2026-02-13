// Aleatory demo - Phase 1 kernel showcase
import aleatory from '../src/index.js';

const { Vector, Factor, summary, dnorm, pnorm, qnorm, rnorm, t_test, mean, sd } = aleatory;

console.log('═══════════════════════════════════════════════');
console.log('  Aleatory Demo - Phase 1 Kernel');
console.log('═══════════════════════════════════════════════\n');

// ─────────────────────────────────────────────────
// Base objects (from previous step)
// ─────────────────────────────────────────────────
console.log('📊 Base Objects\n');

const vec = new Vector([1, 2, 3, 4, 5]);
console.log('Vector:', vec.data);
console.log('Summary:', summary(vec));
console.log();

const fac = new Factor(['a', 'b', 'a', 'c', 'b']);
console.log('Factor:', fac.values);
console.log('Summary:', summary(fac));
console.log();

// ─────────────────────────────────────────────────
// Normal distribution functions
// ─────────────────────────────────────────────────
console.log('📈 Normal Distribution Functions\n');

// Density
console.log('dnorm(0):', dnorm(0));
console.log('dnorm([-2, -1, 0, 1, 2]):', dnorm([-2, -1, 0, 1, 2]).map(x => x.toFixed(4)));
console.log();

// Cumulative probability
console.log('pnorm(1.96):', pnorm(1.96).toFixed(4));
console.log('pnorm([0, 1, 2]):', pnorm([0, 1, 2]).map(x => x.toFixed(4)));
console.log();

// Quantiles
console.log('qnorm(0.975):', qnorm(0.975).toFixed(4));
console.log('qnorm([0.025, 0.5, 0.975]):', qnorm([0.025, 0.5, 0.975]).map(x => x.toFixed(4)));
console.log();

// Random generation
const random_sample = rnorm(5, { mean: 10, sd: 2 });
console.log('rnorm(5, mean=10, sd=2):', random_sample.map(x => x.toFixed(2)));
console.log();

// ─────────────────────────────────────────────────
// t-test examples
// ─────────────────────────────────────────────────
console.log('🔬 t-test Examples\n');

// One-sample t-test
const sample1 = [10, 12, 13, 11, 15, 14, 12];
console.log('Sample 1:', sample1);
const result1 = t_test(sample1, null, { mu: 10 });
console.log('One-sample t-test (H0: μ = 10):');
console.log('  t =', result1.statistic.t.toFixed(4));
console.log('  df =', result1.parameter.df);
console.log('  p-value =', result1.p_value.toFixed(4));
console.log('  mean =', result1.estimate.mean.toFixed(2));
console.log('  95% CI:', result1.conf_int.map(x => x.toFixed(2)));
console.log();

// Two-sample t-test
const sample2 = [8, 9, 10, 11, 12];
const sample3 = [12, 14, 15, 13, 16];
console.log('Sample 2:', sample2);
console.log('Sample 3:', sample3);
const result2 = t_test(sample2, sample3);
console.log('Two-sample t-test (Welch):');
console.log('  t =', result2.statistic.t.toFixed(4));
console.log('  df =', result2.parameter.df.toFixed(2));
console.log('  p-value =', result2.p_value.toFixed(4));
console.log('  mean(x) =', result2.estimate['mean of x'].toFixed(2));
console.log('  mean(y) =', result2.estimate['mean of y'].toFixed(2));
console.log();

// Paired t-test
const before = [10, 12, 11, 13, 14];
const after = [12, 13, 12, 15, 16];
console.log('Before:', before);
console.log('After:', after);
const result3 = t_test(before, after, { paired: true });
console.log('Paired t-test:');
console.log('  t =', result3.statistic.t.toFixed(4));
console.log('  df =', result3.parameter.df);
console.log('  p-value =', result3.p_value.toFixed(4));
console.log();

// ─────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────
console.log('✅ Phase 1 kernel complete!');
console.log('   - Normal distribution: dnorm, pnorm, qnorm, rnorm');
console.log('   - t-test: one-sample, two-sample, paired');
console.log('   - Golden-fixture tests: npm test');
console.log();
console.log('⚠️  Note: t-test uses normal approximation for p-values');
console.log('   (t-distribution functions coming in Phase 2)');
console.log();

// Aleatory public API entrypoint

import Vector from './core/Vector.js';
import Factor from './core/Factor.js';
import { summary } from './base/summary.js';
import { dnorm, pnorm, qnorm, rnorm } from './distributions/normal.js';
import { dt, pt, qt, rt } from './distributions/t.js';
import { dchisq, pchisq, qchisq, rchisq } from './distributions/chisq.js';
import { df, pf, qf, rf } from './distributions/f.js';
import { dbinom, pbinom, qbinom, rbinom } from './distributions/binomial.js';
import { dpois, ppois, qpois, rpois } from './distributions/poisson.js';
import { t_test } from './stats/t_test.js';
import { lm, predict } from './models/lm.js';
import { anova, printAnova } from './models/anova.js';

export { Vector, Factor, summary };

// Distribution functions
export { dnorm, pnorm, qnorm, rnorm };
export { dt, pt, qt, rt };
export { dchisq, pchisq, qchisq, rchisq };
export { df, pf, qf, rf };
export { dbinom, pbinom, qbinom, rbinom };
export { dpois, ppois, qpois, rpois };

// Statistical tests
export { t_test };

// Models
export { lm, predict, anova, printAnova };

// Base-R-ish convenience constructors
export function c(x) {
  return x instanceof Vector ? x : new Vector(x);
}

export function factor(x, levels) {
  return x instanceof Factor ? x : new Factor(x, { levels });
}

// Base functions (thin wrappers over Vector for now)
export function mean(x, { na_rm = true } = {}) {
  return c(x).mean(na_rm);
}

export function sum(x, { na_rm = true } = {}) {
  return c(x).sum(na_rm);
}

export function var_(x, { na_rm = true } = {}) {
  return c(x).variance(na_rm);
}

export function sd(x, { na_rm = true } = {}) {
  return c(x).sd(na_rm);
}

export function min(x, { na_rm = true } = {}) {
  return c(x).min(na_rm);
}

export function max(x, { na_rm = true } = {}) {
  return c(x).max(na_rm);
}

export function na_omit(x) {
  return c(x).naOmit();
}

// Optional default export for "namespace style" usage
export default {
  Vector,
  Factor,
  summary,
  c,
  factor,
  mean,
  sum,
  var: var_,
  sd,
  min,
  max,
  na_omit,
  // Distributions
  dnorm,
  pnorm,
  qnorm,
  rnorm,
  dt,
  pt,
  qt,
  rt,
  dchisq,
  pchisq,
  qchisq,
  rchisq,
  df,
  pf,
  qf,
  rf,
  dbinom,
  pbinom,
  qbinom,
  rbinom,
  dpois,
  ppois,
  qpois,
  rpois,
  // Tests
  t_test,
  // Models
  lm,
  predict,
  anova,
  printAnova,
};

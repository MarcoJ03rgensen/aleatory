// Aleatory public API entrypoint

import Vector from './core/Vector.js';
import Factor from './core/Factor.js';
import { summary } from './base/summary.js';

export { Vector, Factor, summary };

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

// Optional default export for “namespace style” usage
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
};

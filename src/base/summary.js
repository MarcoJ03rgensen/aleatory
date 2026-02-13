// src/base/summary.js

import Vector from '../core/Vector.js';
import Factor from '../core/Factor.js';

export function summary(x) {
  if (x instanceof Vector) {
    const n = x.length;
    const nNA = n - x.countValid();

    const mn = x.min(true);
    const mx = x.max(true);
    const m = x.mean(true);
    const s = x.sd(true);

    return [
      'Numeric vector',
      `Length: ${n}`,
      `NA\'s: ${nNA}`,
      `Min.: ${mn ?? 'NA'}`,
      `Max.: ${mx ?? 'NA'}`,
      `Mean: ${m ?? 'NA'}`,
      `SD: ${s ?? 'NA'}`,
    ].join('\n');
  }

  if (x instanceof Factor) {
    const n = x.length;
    let nNA = 0;
    for (let i = 0; i < x.na_mask.length; i++) nNA += x.na_mask[i];

    return [
      'Factor',
      `Length: ${n}`,
      `NA\'s: ${nNA}`,
      `Levels (${x.levels.length}): ${x.levels.join(', ')}`,
    ].join('\n');
  }

  return `summary(): Unsupported type ${typeof x}`;
}

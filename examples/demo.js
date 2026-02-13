// examples/demo.js

import aleatory, { Vector, factor, summary, mean } from '../src/index.js';

const v = new Vector([1, 2, null, 4]);
console.log(v.toString());
console.log('mean:', mean(v));
console.log(summary(v));

const f = factor(['North', 'South', 'North', null]);
console.log(f.toString());
console.log(summary(f));

console.log('namespace mean:', aleatory.mean(v));

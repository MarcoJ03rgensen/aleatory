import { dchisq, pchisq } from './src/distributions/chisq.js';
import { dt, pt } from './src/distributions/t.js';

console.log('dchisq(4,3)=', dchisq(4,3));
console.log('pchisq(5,3)=', pchisq(5,3));
console.log('dt(-1,5)=', dt(-1,5));
console.log('pt(-1,5)=', pt(-1,5));

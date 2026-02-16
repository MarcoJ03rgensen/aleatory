import { Matrix } from './src/math/matrix.js';
import { qr, backsolve } from './src/math/qr.js';

const A = new Matrix(5, 3, [
  1,1,2,
  1,2,3,
  1,3,4,
  1,4,5,
  1,5,6
]);
const b = new Float64Array(5);
for (let i = 0; i < 5; i++) {
  const x1 = A.get(i, 1);
  const x2 = A.get(i, 2);
  b[i] = 1 + 2 * x1 + 3 * x2;
}

const { Q, R } = qr(A);
const Qt = Q.transpose();
const Qtb = Qt.multiplyVector(b);

console.log('Q^T b:');
console.log(Array.from(Qtb).map(v => v.toPrecision(12)).join('\t'));

console.log('\nAttempt backsolve on top-left 3x3 R:');
const R3 = new Matrix(3,3);
for (let i=0;i<3;i++) for (let j=0;j<3;j++) R3.set(i,j,R.get(i,j));

try {
  const x = backsolve(R3, new Float64Array([Qtb[0], Qtb[1], Qtb[2]]));
  console.log('backsolve result:', x);
} catch (e) {
  console.error('backsolve error:', e.message);
}

console.log('\nAttempt tolerant backsolve (set tiny diagonals to 1 and adjust):');
const R3copy = new Matrix(3,3, Array.from(R3.data));
for (let i=0;i<3;i++) if (Math.abs(R3copy.get(i,i)) < 1e-12) R3copy.set(i,i,1);
try {
  // naive fix: set tiny diag to 1 and corresponding rhs to 0
  const b3 = new Float64Array([Qtb[0], Qtb[1], Qtb[2]]);
  for (let i=0;i<3;i++) if (Math.abs(R.get(i,i)) < 1e-12) b3[i] = 0;
  const x2 = backsolve(R3copy, b3);
  console.log('tolerant backsolve result:', x2);
} catch(e){ console.error('tolerant error', e.message); }

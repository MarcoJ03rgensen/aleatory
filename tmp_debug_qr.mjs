import { Matrix } from './src/math/matrix.js';
import { qr } from './src/math/qr.js';

const A = new Matrix(5, 3, [
  1,1,2,
  1,2,3,
  1,3,4,
  1,4,5,
  1,5,6
]);

const { Q, R } = qr(A);
console.log('R matrix:');
for (let i = 0; i < R.rows; i++) {
  let row = [];
  for (let j = 0; j < R.cols; j++) {
    row.push(R.get(i,j).toPrecision(12));
  }
  console.log(row.join('\t'));
}

console.log('\nDiagonal:');
for (let i = 0; i < Math.min(R.rows, R.cols); i++) {
  console.log(R.get(i,i));
}

console.log('\nQ^T * Q (first 3x3):');
const Qt = Q.transpose();
const QtQ = Qt.multiply(Q);
for (let i = 0; i < 3; i++) {
  let row = [];
  for (let j = 0; j < 3; j++) row.push(QtQ.get(i,j).toPrecision(12));
  console.log(row.join('\t'));
}

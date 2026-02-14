/**
 * Tests for QR decomposition
 * Validates against known decompositions and R output
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { qr, backsolve, leastSquares } from '../../src/math/qr.js';
import { Matrix } from '../../src/math/matrix.js';

const TOL = 1e-10;

/**
 * Helper: check if two matrices are approximately equal
 */
function assertMatrixClose(A, B, tol = TOL) {
  assert.equal(A.rows, B.rows, 'row mismatch');
  assert.equal(A.cols, B.cols, 'col mismatch');
  
  for (let i = 0; i < A.rows; i++) {
    for (let j = 0; j < A.cols; j++) {
      assert.ok(
        Math.abs(A.get(i, j) - B.get(i, j)) < tol,
        `Element (${i},${j}): expected ${B.get(i, j)}, got ${A.get(i, j)}`
      );
    }
  }
}

/**
 * Helper: check if matrix is upper triangular
 */
function isUpperTriangular(R, tol = TOL) {
  for (let i = 1; i < R.rows; i++) {
    for (let j = 0; j < Math.min(i, R.cols); j++) {
      if (Math.abs(R.get(i, j)) > tol) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Helper: check if matrix is orthogonal (Q'Q = I)
 */
function isOrthogonal(Q, tol = TOL) {
  const Qt = Q.transpose();
  const QtQ = Qt.multiply(Q);
  const I = Matrix.identity(Q.cols);
  
  for (let i = 0; i < I.rows; i++) {
    for (let j = 0; j < I.cols; j++) {
      if (Math.abs(QtQ.get(i, j) - I.get(i, j)) > tol) {
        return false;
      }
    }
  }
  return true;
}

describe('QR Decomposition', () => {
  describe('qr()', () => {
    it('decomposes simple 2x2 matrix', () => {
      // [1 0]
      // [0 1] = I (already QR)
      const A = Matrix.identity(2);
      const { Q, R } = qr(A);
      
      // Q should be orthogonal
      assert.ok(isOrthogonal(Q), 'Q should be orthogonal');
      
      // R should be upper triangular
      assert.ok(isUpperTriangular(R), 'R should be upper triangular');
      
      // A = Q * R
      const QR = Q.multiply(R);
      assertMatrixClose(QR, A);
    });

    it('decomposes 3x2 tall matrix', () => {
      // Standard test case
      const A = new Matrix(3, 2, [
        1, 1,
        1, 2,
        1, 3
      ]);
      
      const { Q, R } = qr(A);
      
      // Check orthogonality of Q
      assert.ok(isOrthogonal(Q), 'Q should be orthogonal');
      
      // Check R is upper triangular
      assert.ok(isUpperTriangular(R), 'R should be upper triangular');
      
      // Check A = Q * R
      const QR = Q.multiply(R);
      assertMatrixClose(QR, A, 1e-9);
    });

    it('decomposes square matrix', () => {
      const A = new Matrix(3, 3, [
        1, 2, 3,
        4, 5, 6,
        7, 8, 9
      ]);
      
      const { Q, R } = qr(A);
      
      assert.ok(isOrthogonal(Q), 'Q should be orthogonal');
      assert.ok(isUpperTriangular(R), 'R should be upper triangular');
      
      const QR = Q.multiply(R);
      assertMatrixClose(QR, A, 1e-9);
    });

    it('handles design matrix from linear regression', () => {
      // Design matrix with intercept column
      const A = new Matrix(5, 2, [
        1, 1,
        1, 2,
        1, 3,
        1, 4,
        1, 5
      ]);
      
      const { Q, R } = qr(A);
      
      assert.ok(isOrthogonal(Q), 'Q should be orthogonal');
      assert.ok(isUpperTriangular(R), 'R should be upper triangular');
      
      const QR = Q.multiply(R);
      assertMatrixClose(QR, A, 1e-9);
    });
  });

  describe('backsolve()', () => {
    it('solves upper triangular system', () => {
      // [2 3] [x1]   [8]
      // [0 1] [x2] = [2]
      // Solution: x2 = 2, x1 = (8 - 3*2)/2 = 1
      
      const R = new Matrix(2, 2, [2, 3, 0, 1]);
      const b = new Float64Array([8, 2]);
      const x = backsolve(R, b);
      
      assert.ok(Math.abs(x[0] - 1) < TOL, 'x1 should be 1');
      assert.ok(Math.abs(x[1] - 2) < TOL, 'x2 should be 2');
    });

    it('solves 3x3 system', () => {
      // [1 2 3] [x1]   [14]
      // [0 1 2] [x2] = [8]
      // [0 0 1] [x3]   [3]
      // Back substitution: x3=3, x2=8-2*3=2, x1=14-2*2-3*3=1
      
      const R = new Matrix(3, 3, [1, 2, 3, 0, 1, 2, 0, 0, 1]);
      const b = new Float64Array([14, 8, 3]);
      const x = backsolve(R, b);
      
      assert.ok(Math.abs(x[0] - 1) < TOL, 'x1 should be 1');
      assert.ok(Math.abs(x[1] - 2) < TOL, 'x2 should be 2');
      assert.ok(Math.abs(x[2] - 3) < TOL, 'x3 should be 3');
    });
  });

  describe('leastSquares()', () => {
    it('solves exact linear system', () => {
      // y = 2*x (exact fit, no noise)
      const A = new Matrix(5, 2, [
        1, 1,  // intercept, x=1
        1, 2,
        1, 3,
        1, 4,
        1, 5
      ]);
      const b = new Float64Array([2, 4, 6, 8, 10]);
      
      const x = leastSquares(A, b);
      
      // Should get [0, 2] (intercept=0, slope=2)
      assert.ok(Math.abs(x[0] - 0) < TOL, 'intercept should be 0');
      assert.ok(Math.abs(x[1] - 2) < TOL, 'slope should be 2');
    });

    it('solves linear system with noise', () => {
      // Approximate fit
      const A = new Matrix(5, 2, [
        1, 1,
        1, 2,
        1, 3,
        1, 4,
        1, 5
      ]);
      const b = new Float64Array([2.1, 4.0, 5.9, 8.1, 10.0]);
      
      const x = leastSquares(A, b);
      
      // Should be close to [0, 2]
      assert.ok(Math.abs(x[0] - 0) < 0.1, 'intercept close to 0');
      assert.ok(Math.abs(x[1] - 2) < 0.1, 'slope close to 2');
    });

    it('solves multiple regression problem', () => {
      // y = 1 + 2*x1 + 3*x2 (exact)
      const A = new Matrix(5, 3, [
        1, 1, 2,  // intercept, x1, x2
        1, 2, 3,
        1, 3, 4,
        1, 4, 5,
        1, 5, 6
      ]);
      // Compute exact y values
      const b = new Float64Array(5);
      for (let i = 0; i < 5; i++) {
        const x1 = A.get(i, 1);
        const x2 = A.get(i, 2);
        b[i] = 1 + 2 * x1 + 3 * x2;
      }
      
      const x = leastSquares(A, b);
      
      // Should recover [1, 2, 3]
      assert.ok(Math.abs(x[0] - 1) < TOL, 'intercept should be 1');
      assert.ok(Math.abs(x[1] - 2) < TOL, 'coef1 should be 2');
      assert.ok(Math.abs(x[2] - 3) < TOL, 'coef2 should be 3');
    });
  });
});

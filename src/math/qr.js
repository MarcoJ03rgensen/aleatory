/**
 * QR decomposition using Householder reflections
 * Used for solving least squares problems in linear regression
 */

import { Matrix, dot, norm, scale, subtract } from './matrix.js';
import { pseudoInverseSolve } from './svd.js';

/**
 * QR decomposition of matrix A
 * Returns { Q, R } where A = Q * R
 * Q is orthogonal (Q'Q = I), R is upper triangular
 * 
 * @param {Matrix} A - Input matrix (will be copied, not modified)
 * @returns {{ Q: Matrix, R: Matrix }}
 */
export function qr(A) {
  const m = A.rows;
  const n = A.cols;
  
  // Make a copy since we'll modify it
  const R = A.clone();
  
  // Q will be built up as product of Householder reflections
  const Q = Matrix.identity(m);
  
  // For each column
  for (let k = 0; k < Math.min(m - 1, n); k++) {
    // Get column k from row k onwards
    const x = new Float64Array(m - k);
    for (let i = k; i < m; i++) {
      x[i - k] = R.get(i, k);
    }
    
    // Compute Householder vector
    const normX = norm(x);
    if (Math.abs(normX) < 1e-14) continue; // Skip if column is zero
    
    // Stable Householder vector construction
    // Choose sign to avoid cancellation: v = x + sign(x0)*||x||*e1
    const s = x[0] >= 0 ? 1 : -1;
    const v = new Float64Array(m - k);
    v[0] = x[0] + s * normX;
    for (let i = 1; i < m - k; i++) {
      v[i] = x[i];
    }

    // If v is effectively zero, skip
    const vnorm2 = dot(v, v);
    if (Math.abs(vnorm2) < 1e-20) continue;

    const beta = 2 / vnorm2;
    
    // Apply Householder reflection to R (columns k to n-1)
    for (let j = k; j < n; j++) {
      // Get column j from row k onwards
      const col = new Float64Array(m - k);
      for (let i = k; i < m; i++) {
        col[i - k] = R.get(i, j);
      }
      
      // Compute v' * col
      const vDotCol = dot(v, col);
      
      // Update column: col = col - beta * v * (v' * col)
      for (let i = k; i < m; i++) {
        R.set(i, j, R.get(i, j) - beta * v[i - k] * vDotCol);
      }
    }
    
    // Apply Householder reflection to Q
    // Q = Q * H where H = I - beta * v * v'
    for (let j = 0; j < m; j++) {
      // Get row j of Q, columns k onwards
      const row = new Float64Array(m - k);
      for (let i = k; i < m; i++) {
        row[i - k] = Q.get(j, i);
      }
      
      // Compute row * v
      const rowDotV = dot(row, v);
      
      // Update row: row = row - beta * (row * v) * v'
      for (let i = k; i < m; i++) {
        Q.set(j, i, Q.get(j, i) - beta * rowDotV * v[i - k]);
      }
    }
  }
  
  return { Q, R };
}

/**
 * Solve linear system Rx = b where R is upper triangular
 * Used after QR decomposition: solve Rx = Q'b
 * 
 * @param {Matrix} R - Upper triangular matrix
 * @param {Float64Array} b - Right-hand side vector
 * @returns {Float64Array} - Solution vector x
 */
export function backsolve(R, b) {
  const n = R.cols;
  if (R.rows < n) {
    throw new Error('Matrix must have at least as many rows as columns');
  }
  if (b.length !== R.rows) {
    throw new Error('Right-hand side must match number of rows');
  }
  
  const x = new Float64Array(n);
  
  // Back substitution
  for (let i = n - 1; i >= 0; i--) {
    let sum = b[i];
    for (let j = i + 1; j < n; j++) {
      sum -= R.get(i, j) * x[j];
    }
    
    const rii = R.get(i, i);
    if (Math.abs(rii) < 1e-14) {
      throw new Error(`Matrix is singular or nearly singular at row ${i}`);
    }
    
    x[i] = sum / rii;
  }
  
  return x;
}

/**
 * Solve least squares problem: min ||Ax - b||₂
 * Uses QR decomposition
 * 
 * @param {Matrix} A - Design matrix
 * @param {Float64Array} b - Response vector
 * @returns {Float64Array} - Coefficients that minimize residuals
 */
export function leastSquares(A, b) {
  if (A.rows !== b.length) {
    throw new Error('Number of rows in A must match length of b');
  }
  
  // QR decomposition: A = QR
  const { Q, R } = qr(A);

  // Solve Rx = Q'b (attempt)
  try {
    const Qt = Q.transpose();
    const Qtb = Qt.multiplyVector(b);
    return backsolve(R, Qtb);
  } catch (e) {
    // Fallback to pseudoinverse-based least-norm solution for rank-deficient cases
    return pseudoInverseSolve(A, b);
  }
}

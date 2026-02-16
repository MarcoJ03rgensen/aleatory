// Lightweight SVD-based least-squares solver (uses eigen-decomposition of A^T A)
// Returns least-norm solution for possibly rank-deficient A

import { Matrix } from './matrix.js';

// Jacobi eigenvalue algorithm for symmetric matrices
function jacobiEigen(A) {
  const n = A.length;
  const V = Array.from({ length: n }, (_, i) => {
    const row = new Array(n).fill(0);
    row[i] = 1;
    return row;
  });

  const M = A.map(row => row.slice());
  const eps = 1e-12;
  const maxIter = 5 * n * n;

  function maxOffdiag() {
    let max = 0;
    let p = 0, q = 1;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const v = Math.abs(M[i][j]);
        if (v > max) { max = v; p = i; q = j; }
      }
    }
    return { max, p, q };
  }

  for (let iter = 0; iter < maxIter; iter++) {
    const { max, p, q } = maxOffdiag();
    if (max < eps) break;

    const app = M[p][p];
    const aqq = M[q][q];
    const apq = M[p][q];
    const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
    const c = Math.cos(phi);
    const s = Math.sin(phi);

    // Rotate rows/cols p and q
    for (let i = 0; i < n; i++) {
      const mip = M[i][p];
      const miq = M[i][q];
      M[i][p] = c * mip - s * miq;
      M[i][q] = s * mip + c * miq;
    }
    for (let j = 0; j < n; j++) {
      const mpj = M[p][j];
      const mqj = M[q][j];
      M[p][j] = c * mpj - s * mqj;
      M[q][j] = s * mpj + c * mqj;
    }

    // Enforce symmetry
    M[p][q] = 0;
    M[q][p] = 0;

    // Update eigenvector matrix V
    for (let i = 0; i < n; i++) {
      const vip = V[i][p];
      const viq = V[i][q];
      V[i][p] = c * vip - s * viq;
      V[i][q] = s * vip + c * viq;
    }
  }

  const eigenvalues = new Array(n);
  for (let i = 0; i < n; i++) eigenvalues[i] = M[i][i];

  return { V, eigenvalues };
}

// Convert Matrix to 2D array
function matrixToArray(A) {
  const n = A.rows;
  const m = A.cols;
  const out = Array.from({ length: n }, () => new Array(m));
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) out[i][j] = A.get(i, j);
  return out;
}

export function pseudoInverseSolve(A, b) {
  // A: Matrix (m x n), b: Float64Array length m
  const m = A.rows;
  const n = A.cols;

  // Build ATA (n x n)
  const ATA = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < m; k++) sum += A.get(k, i) * A.get(k, j);
      ATA[i][j] = sum;
    }
  }

  const { V, eigenvalues } = jacobiEigen(ATA);

  // Sort eigenvalues (and vectors) descending
  const idx = eigenvalues.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v).map(x => x.i);
  const VV = Array.from({ length: n }, () => new Array(n));
  const S = new Array(n).fill(0);
  for (let ii = 0; ii < n; ii++) {
    const i = idx[ii];
    S[ii] = Math.sqrt(Math.max(0, eigenvalues[i]));
    for (let j = 0; j < n; j++) VV[j][ii] = V[j][i];
  }

  // Compute U = A * V * diag(1/S)  (m x n)
  const U = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let k = 0; k < n; k++) {
    const sigma = S[k];
    if (sigma <= 0) continue;
    for (let i = 0; i < m; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) sum += A.get(i, j) * VV[j][k];
      U[i][k] = sum / sigma;
    }
  }

  // Compute Ut_b = U^T * b
  const Ut_b = new Array(n).fill(0);
  for (let k = 0; k < n; k++) {
    let sum = 0;
    for (let i = 0; i < m; i++) sum += U[i][k] * b[i];
    Ut_b[k] = sum;
  }

  // x = V * diag(1/S) * Ut_b  (compute directly into xout)
  const xout = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      if (S[j] > 0) sum += VV[i][j] * (Ut_b[j] / S[j]);
    }
    xout[i] = sum;
  }

  return xout;
}

/**
 * Tests for Matrix operations
 * Core linear algebra functionality
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Matrix, dot, norm, scale, add, subtract } from '../../src/math/matrix.js';

const TOL = 1e-10;

describe('Matrix', () => {
  describe('Construction', () => {
    it('creates matrix with specified dimensions', () => {
      const m = new Matrix(3, 4);
      assert.equal(m.rows, 3);
      assert.equal(m.cols, 4);
      assert.equal(m.data.length, 12);
    });

    it('creates matrix from data array', () => {
      const m = new Matrix(2, 3, [1, 2, 3, 4, 5, 6]);
      assert.equal(m.get(0, 0), 1);
      assert.equal(m.get(0, 2), 3);
      assert.equal(m.get(1, 0), 4);
      assert.equal(m.get(1, 2), 6);
    });

    it('creates identity matrix', () => {
      const I = Matrix.identity(3);
      assert.equal(I.get(0, 0), 1);
      assert.equal(I.get(1, 1), 1);
      assert.equal(I.get(2, 2), 1);
      assert.equal(I.get(0, 1), 0);
      assert.equal(I.get(1, 0), 0);
    });

    it('creates matrix from columns', () => {
      const col1 = new Float64Array([1, 2, 3]);
      const col2 = new Float64Array([4, 5, 6]);
      const m = Matrix.fromColumns([col1, col2]);
      
      assert.equal(m.rows, 3);
      assert.equal(m.cols, 2);
      assert.equal(m.get(0, 0), 1);
      assert.equal(m.get(2, 0), 3);
      assert.equal(m.get(0, 1), 4);
      assert.equal(m.get(2, 1), 6);
    });
  });

  describe('Access and Mutation', () => {
    it('gets and sets elements', () => {
      const m = new Matrix(2, 2);
      m.set(0, 0, 1);
      m.set(0, 1, 2);
      m.set(1, 0, 3);
      m.set(1, 1, 4);
      
      assert.equal(m.get(0, 0), 1);
      assert.equal(m.get(0, 1), 2);
      assert.equal(m.get(1, 0), 3);
      assert.equal(m.get(1, 1), 4);
    });

    it('gets column as array', () => {
      const m = new Matrix(3, 2, [1, 2, 3, 4, 5, 6]);
      const col = m.getColumn(1);
      
      assert.equal(col.length, 3);
      assert.equal(col[0], 2);
      assert.equal(col[1], 4);
      assert.equal(col[2], 6);
    });

    it('sets column from array', () => {
      const m = new Matrix(3, 2);
      m.setColumn(0, new Float64Array([1, 2, 3]));
      
      assert.equal(m.get(0, 0), 1);
      assert.equal(m.get(1, 0), 2);
      assert.equal(m.get(2, 0), 3);
    });
  });

  describe('Matrix Operations', () => {
    it('transposes matrix', () => {
      const m = new Matrix(2, 3, [1, 2, 3, 4, 5, 6]);
      const mt = m.transpose();
      
      assert.equal(mt.rows, 3);
      assert.equal(mt.cols, 2);
      assert.equal(mt.get(0, 0), 1);
      assert.equal(mt.get(0, 1), 4);
      assert.equal(mt.get(1, 0), 2);
      assert.equal(mt.get(2, 1), 6);
    });

    it('multiplies matrices', () => {
      // [1 2]   [5 6]
      // [3 4] * [7 8] = [19 22]
      //                  [43 50]
      const A = new Matrix(2, 2, [1, 2, 3, 4]);
      const B = new Matrix(2, 2, [5, 6, 7, 8]);
      const C = A.multiply(B);
      
      assert.equal(C.get(0, 0), 19);
      assert.equal(C.get(0, 1), 22);
      assert.equal(C.get(1, 0), 43);
      assert.equal(C.get(1, 1), 50);
    });

    it('multiplies matrix by vector', () => {
      // [1 2] [5]   [19]
      // [3 4] [7] = [43]
      const A = new Matrix(2, 2, [1, 2, 3, 4]);
      const v = new Float64Array([5, 7]);
      const result = A.multiplyVector(v);
      
      assert.equal(result[0], 19);
      assert.equal(result[1], 43);
    });

    it('clones matrix', () => {
      const A = new Matrix(2, 2, [1, 2, 3, 4]);
      const B = A.clone();
      
      // Same values
      assert.equal(B.get(0, 0), A.get(0, 0));
      assert.equal(B.get(1, 1), A.get(1, 1));
      
      // But different objects
      B.set(0, 0, 999);
      assert.equal(A.get(0, 0), 1); // A unchanged
    });
  });
});

describe('Vector Operations', () => {
  describe('dot', () => {
    it('computes dot product', () => {
      const a = new Float64Array([1, 2, 3]);
      const b = new Float64Array([4, 5, 6]);
      // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
      assert.equal(dot(a, b), 32);
    });

    it('handles zero vector', () => {
      const a = new Float64Array([1, 2, 3]);
      const b = new Float64Array([0, 0, 0]);
      assert.equal(dot(a, b), 0);
    });
  });

  describe('norm', () => {
    it('computes L2 norm', () => {
      const v = new Float64Array([3, 4]);
      // sqrt(3^2 + 4^2) = sqrt(25) = 5
      assert.equal(norm(v), 5);
    });

    it('handles unit vector', () => {
      const v = new Float64Array([1, 0, 0]);
      assert.equal(norm(v), 1);
    });
  });

  describe('scale', () => {
    it('scales vector by scalar', () => {
      const v = new Float64Array([1, 2, 3]);
      const scaled = scale(v, 2);
      
      assert.equal(scaled[0], 2);
      assert.equal(scaled[1], 4);
      assert.equal(scaled[2], 6);
    });
  });

  describe('add', () => {
    it('adds two vectors', () => {
      const a = new Float64Array([1, 2, 3]);
      const b = new Float64Array([4, 5, 6]);
      const c = add(a, b);
      
      assert.equal(c[0], 5);
      assert.equal(c[1], 7);
      assert.equal(c[2], 9);
    });
  });

  describe('subtract', () => {
    it('subtracts two vectors', () => {
      const a = new Float64Array([5, 7, 9]);
      const b = new Float64Array([1, 2, 3]);
      const c = subtract(a, b);
      
      assert.equal(c[0], 4);
      assert.equal(c[1], 5);
      assert.equal(c[2], 6);
    });
  });
});

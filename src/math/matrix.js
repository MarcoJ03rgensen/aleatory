/**
 * Matrix operations for linear algebra
 * Used primarily for linear models (QR decomposition, matrix inversion, etc.)
 */

/**
 * Simple Matrix class for linear algebra operations
 */
export class Matrix {
  /**
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   * @param {Array<number>} [data] - Flat array of data (row-major order)
   */
  constructor(rows, cols, data = null) {
    this.rows = rows;
    this.cols = cols;
    this.data = data ? Float64Array.from(data) : new Float64Array(rows * cols);
    
    if (this.data.length !== rows * cols) {
      throw new Error(`Data length ${this.data.length} doesn't match dimensions ${rows}×${cols}`);
    }
  }

  /**
   * Get element at (i, j)
   */
  get(i, j) {
    if (i < 0 || i >= this.rows || j < 0 || j >= this.cols) {
      throw new Error(`Index (${i},${j}) out of bounds for ${this.rows}×${this.cols} matrix`);
    }
    return this.data[i * this.cols + j];
  }

  /**
   * Set element at (i, j)
   */
  set(i, j, value) {
    if (i < 0 || i >= this.rows || j < 0 || j >= this.cols) {
      throw new Error(`Index (${i},${j}) out of bounds for ${this.rows}×${this.cols} matrix`);
    }
    this.data[i * this.cols + j] = value;
  }

  /**
   * Get column as array
   */
  getColumn(j) {
    const col = new Float64Array(this.rows);
    for (let i = 0; i < this.rows; i++) {
      col[i] = this.get(i, j);
    }
    return col;
  }

  /**
   * Get row as array
   */
  getRow(i) {
    const row = new Float64Array(this.cols);
    for (let j = 0; j < this.cols; j++) {
      row[j] = this.get(i, j);
    }
    return row;
  }

  /**
   * Set column from array
   */
  setColumn(j, values) {
    if (values.length !== this.rows) {
      throw new Error(`Column length ${values.length} doesn't match matrix rows ${this.rows}`);
    }
    for (let i = 0; i < this.rows; i++) {
      this.set(i, j, values[i]);
    }
  }

  /**
   * Matrix transpose
   */
  transpose() {
    const result = new Matrix(this.cols, this.rows);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.set(j, i, this.get(i, j));
      }
    }
    return result;
  }

  /**
   * Matrix-matrix multiplication
   */
  multiply(other) {
    if (this.cols !== other.rows) {
      throw new Error(`Cannot multiply ${this.rows}×${this.cols} by ${other.rows}×${other.cols}`);
    }

    const result = new Matrix(this.rows, other.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        let sum = 0;
        for (let k = 0; k < this.cols; k++) {
          sum += this.get(i, k) * other.get(k, j);
        }
        result.set(i, j, sum);
      }
    }
    return result;
  }

  /**
   * Matrix-vector multiplication
   */
  multiplyVector(vec) {
    if (this.cols !== vec.length) {
      throw new Error(`Cannot multiply ${this.rows}×${this.cols} matrix by vector of length ${vec.length}`);
    }

    const result = new Float64Array(this.rows);
    for (let i = 0; i < this.rows; i++) {
      let sum = 0;
      for (let j = 0; j < this.cols; j++) {
        sum += this.get(i, j) * vec[j];
      }
      result[i] = sum;
    }
    return result;
  }

  /**
   * Create identity matrix
   */
  static identity(n) {
    const result = new Matrix(n, n);
    for (let i = 0; i < n; i++) {
      result.set(i, i, 1);
    }
    return result;
  }

  /**
   * Create matrix from column vectors
   */
  static fromColumns(cols) {
    if (cols.length === 0) {
      throw new Error('Need at least one column');
    }
    const rows = cols[0].length;
    const result = new Matrix(rows, cols.length);
    
    for (let j = 0; j < cols.length; j++) {
      if (cols[j].length !== rows) {
        throw new Error('All columns must have same length');
      }
      result.setColumn(j, cols[j]);
    }
    return result;
  }

  /**
   * Clone this matrix
   */
  clone() {
    return new Matrix(this.rows, this.cols, Array.from(this.data));
  }

  /**
   * Pretty print matrix
   */
  toString() {
    const lines = [];
    for (let i = 0; i < Math.min(5, this.rows); i++) {
      const row = [];
      for (let j = 0; j < Math.min(5, this.cols); j++) {
        row.push(this.get(i, j).toFixed(4));
      }
      if (this.cols > 5) row.push('...');
      lines.push('  [' + row.join(', ') + ']');
    }
    if (this.rows > 5) lines.push('  ...');
    return `Matrix(${this.rows}×${this.cols}):\n` + lines.join('\n');
  }
}

/**
 * Compute dot product of two vectors
 */
export function dot(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Compute L2 norm of a vector
 */
export function norm(v) {
  return Math.sqrt(dot(v, v));
}

/**
 * Scale vector by scalar
 */
export function scale(v, s) {
  const result = new Float64Array(v.length);
  for (let i = 0; i < v.length; i++) {
    result[i] = v[i] * s;
  }
  return result;
}

/**
 * Add two vectors
 */
export function add(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }
  const result = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] + b[i];
  }
  return result;
}

/**
 * Subtract two vectors: a - b
 */
export function subtract(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }
  const result = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] - b[i];
  }
  return result;
}

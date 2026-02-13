/**
 * Aleatory - Statistical Computing for JavaScript
 * Core Vector class with TypedArray foundation
 */

/**
 * Vector class: R-style vector with NA support
 * Backed by Float64Array for performance on large datasets
 */
class Vector {
  /**
   * @param {Array|TypedArray|number} data - Input data or length
   * @param {string} [type='numeric'] - Vector type: 'numeric', 'integer', 'logical'
   */
  constructor(data, type = 'numeric') {
    this.type = type;
    
    if (typeof data === 'number') {
      // Create empty vector of specified length
      this.length = data;
      this.data = new Float64Array(data);
      this.na_mask = new Uint8Array(data); // 1 = NA, 0 = valid
    } else {
      // Create from array-like input
      this.length = data.length;
      this.data = new Float64Array(this.length);
      this.na_mask = new Uint8Array(this.length);
      
      for (let i = 0; i < this.length; i++) {
        const val = data[i];
        if (val === null || val === undefined || Number.isNaN(val)) {
          this.na_mask[i] = 1;
          this.data[i] = 0; // Placeholder value
        } else {
          this.na_mask[i] = 0;
          this.data[i] = Number(val);
        }
      }
    }
  }

  /**
   * Get value at index (returns null for NA)
   */
  get(i) {
    if (i < 0 || i >= this.length) {
      throw new Error(`Index ${i} out of bounds [0, ${this.length})`);
    }
    return this.na_mask[i] === 1 ? null : this.data[i];
  }

  /**
   * Set value at index
   */
  set(i, value) {
    if (i < 0 || i >= this.length) {
      throw new Error(`Index ${i} out of bounds [0, ${this.length})`);
    }
    
    if (value === null || value === undefined || Number.isNaN(value)) {
      this.na_mask[i] = 1;
      this.data[i] = 0;
    } else {
      this.na_mask[i] = 0;
      this.data[i] = Number(value);
    }
  }

  /**
   * Check if value at index is NA
   */
  isNA(i) {
    return this.na_mask[i] === 1;
  }

  /**
   * Convert to plain JavaScript array
   */
  toArray() {
    const arr = new Array(this.length);
    for (let i = 0; i < this.length; i++) {
      arr[i] = this.get(i);
    }
    return arr;
  }

  /**
   * Count non-NA values
   */
  countValid() {
    let count = 0;
    for (let i = 0; i < this.length; i++) {
      if (this.na_mask[i] === 0) count++;
    }
    return count;
  }

  /**
   * Create a copy of this vector
   */
  clone() {
    const v = new Vector(this.length, this.type);
    v.data.set(this.data);
    v.na_mask.set(this.na_mask);
    return v;
  }

  // ===== Statistical Operations =====

  /**
   * Calculate mean (excluding NAs by default)
   */
  mean(na_rm = true) {
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < this.length; i++) {
      if (this.na_mask[i] === 0) {
        sum += this.data[i];
        count++;
      } else if (!na_rm) {
        return null; // Return NA if any NA present and na_rm=false
      }
    }
    
    return count > 0 ? sum / count : null;
  }

  /**
   * Calculate sum (excluding NAs by default)
   */
  sum(na_rm = true) {
    let sum = 0;
    
    for (let i = 0; i < this.length; i++) {
      if (this.na_mask[i] === 0) {
        sum += this.data[i];
      } else if (!na_rm) {
        return null;
      }
    }
    
    return sum;
  }

  /**
   * Calculate variance (excluding NAs by default)
   */
  variance(na_rm = true) {
    const m = this.mean(na_rm);
    if (m === null) return null;
    
    let sumSq = 0;
    let count = 0;
    
    for (let i = 0; i < this.length; i++) {
      if (this.na_mask[i] === 0) {
        const diff = this.data[i] - m;
        sumSq += diff * diff;
        count++;
      }
    }
    
    return count > 1 ? sumSq / (count - 1) : null;
  }

  /**
   * Calculate standard deviation
   */
  sd(na_rm = true) {
    const v = this.variance(na_rm);
    return v !== null ? Math.sqrt(v) : null;
  }

  /**
   * Find minimum value
   */
  min(na_rm = true) {
    let min = Infinity;
    let hasValue = false;
    
    for (let i = 0; i < this.length; i++) {
      if (this.na_mask[i] === 0) {
        if (this.data[i] < min) min = this.data[i];
        hasValue = true;
      } else if (!na_rm) {
        return null;
      }
    }
    
    return hasValue ? min : null;
  }

  /**
   * Find maximum value
   */
  max(na_rm = true) {
    let max = -Infinity;
    let hasValue = false;
    
    for (let i = 0; i < this.length; i++) {
      if (this.na_mask[i] === 0) {
        if (this.data[i] > max) max = this.data[i];
        hasValue = true;
      } else if (!na_rm) {
        return null;
      }
    }
    
    return hasValue ? max : null;
  }

  /**
   * Remove NA values, returning new vector
   */
  naOmit() {
    const validCount = this.countValid();
    const result = new Vector(validCount, this.type);
    let idx = 0;
    
    for (let i = 0; i < this.length; i++) {
      if (this.na_mask[i] === 0) {
        result.data[idx] = this.data[i];
        result.na_mask[idx] = 0;
        idx++;
      }
    }
    
    return result;
  }

  // ===== Vector Operations =====

  /**
   * Add scalar or vector
   */
  add(other) {
    if (typeof other === 'number') {
      // Scalar addition
      const result = this.clone();
      for (let i = 0; i < this.length; i++) {
        if (result.na_mask[i] === 0) {
          result.data[i] += other;
        }
      }
      return result;
    } else if (other instanceof Vector) {
      // Vector addition
      const result = new Vector(this.length);
      for (let i = 0; i < this.length; i++) {
        if (this.na_mask[i] === 1 || other.na_mask[i] === 1) {
          result.na_mask[i] = 1;
        } else {
          result.data[i] = this.data[i] + other.data[i];
        }
      }
      return result;
    }
    throw new Error('Invalid operand type');
  }

  /**
   * Multiply by scalar or vector
   */
  multiply(other) {
    if (typeof other === 'number') {
      const result = this.clone();
      for (let i = 0; i < this.length; i++) {
        if (result.na_mask[i] === 0) {
          result.data[i] *= other;
        }
      }
      return result;
    } else if (other instanceof Vector) {
      const result = new Vector(this.length);
      for (let i = 0; i < this.length; i++) {
        if (this.na_mask[i] === 1 || other.na_mask[i] === 1) {
          result.na_mask[i] = 1;
        } else {
          result.data[i] = this.data[i] * other.data[i];
        }
      }
      return result;
    }
    throw new Error('Invalid operand type');
  }

  /**
   * Pretty print vector
   */
  toString() {
    const values = [];
    for (let i = 0; i < Math.min(10, this.length); i++) {
      values.push(this.isNA(i) ? 'NA' : this.data[i].toFixed(2));
    }
    if (this.length > 10) values.push('...');
    return `Vector(${this.length}): [${values.join(', ')}]`;
  }
}

module.exports = Vector;

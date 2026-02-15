/**
 * Window Functions - SQL-style analytical functions for DataFrames
 * 
 * Provides row_number, rank, lag, lead, cumsum, and other window operations
 */

import Vector from '../core/Vector.js';

/**
 * Add row numbers within groups
 * @param {DataFrame} df - Input DataFrame
 * @param {Array<string>} partitionBy - Columns to partition by
 * @param {Array<string>} orderBy - Columns to order by
 * @param {Object} options - Options for ordering
 * @returns {Array<number>} Row numbers
 */
export function row_number(df, partitionBy = [], orderBy = [], options = {}) {
  const n = df.nrow;
  const result = new Array(n);
  
  if (partitionBy.length === 0) {
    // No partitioning - simple row numbers
    for (let i = 0; i < n; i++) {
      result[i] = i + 1;
    }
    return result;
  }
  
  // Group by partition columns
  const grouped = df.groupBy(...partitionBy);
  
  for (const group of grouped.groups) {
    const indices = group.indices;
    
    // Sort within group if needed
    if (orderBy.length > 0) {
      const groupDf = df.slice(indices);
      const sorted = groupDf.arrange(orderBy, options);
      const sortedIndices = Array.from({ length: indices.length }, (_, i) => i);
      
      for (let i = 0; i < indices.length; i++) {
        result[indices[i]] = i + 1;
      }
    } else {
      // Just number them in order
      for (let i = 0; i < indices.length; i++) {
        result[indices[i]] = i + 1;
      }
    }
  }
  
  return result;
}

/**
 * Compute ranks within groups (ties get average rank)
 * @param {DataFrame} df - Input DataFrame
 * @param {string} col - Column to rank
 * @param {Array<string>} partitionBy - Columns to partition by
 * @param {boolean} decreasing - Rank in decreasing order
 * @returns {Array<number>} Ranks
 */
export function rank(df, col, partitionBy = [], decreasing = false) {
  const n = df.nrow;
  const result = new Array(n);
  
  if (partitionBy.length === 0) {
    // Simple ranking
    const values = df.colArray(col);
    const indexed = values.map((v, i) => ({ v, i }));
    indexed.sort((a, b) => {
      if (a.v === null || a.v === undefined) return 1;
      if (b.v === null || b.v === undefined) return -1;
      const cmp = a.v < b.v ? -1 : a.v > b.v ? 1 : 0;
      return decreasing ? -cmp : cmp;
    });
    
    // Assign ranks (average for ties)
    let r = 1;
    for (let i = 0; i < indexed.length; i++) {
      let j = i;
      // Find end of tied group
      while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) {
        j++;
      }
      
      // Average rank for tied group
      const avgRank = (r + r + (j - i)) / 2;
      for (let k = i; k <= j; k++) {
        result[indexed[k].i] = avgRank;
      }
      
      r += j - i + 1;
      i = j;
    }
    
    return result;
  }
  
  // Grouped ranking
  const grouped = df.groupBy(...partitionBy);
  
  for (const group of grouped.groups) {
    const indices = group.indices;
    const values = indices.map(i => ({ v: df.col(col).at(i), i }));
    
    values.sort((a, b) => {
      if (a.v === null || a.v === undefined) return 1;
      if (b.v === null || b.v === undefined) return -1;
      const cmp = a.v < b.v ? -1 : a.v > b.v ? 1 : 0;
      return decreasing ? -cmp : cmp;
    });
    
    let r = 1;
    for (let i = 0; i < values.length; i++) {
      let j = i;
      while (j + 1 < values.length && values[j + 1].v === values[i].v) {
        j++;
      }
      
      const avgRank = (r + r + (j - i)) / 2;
      for (let k = i; k <= j; k++) {
        result[values[k].i] = avgRank;
      }
      
      r += j - i + 1;
      i = j;
    }
  }
  
  return result;
}

/**
 * Get previous row's value (lag)
 * @param {DataFrame} df - Input DataFrame
 * @param {string} col - Column name
 * @param {number} n - Number of rows to lag (default: 1)
 * @param {any} fill - Fill value for missing (default: null)
 * @param {Array<string>} partitionBy - Columns to partition by
 * @returns {Array} Lagged values
 */
export function lag(df, col, n = 1, fill = null, partitionBy = []) {
  const nrows = df.nrow;
  const result = new Array(nrows).fill(fill);
  
  if (partitionBy.length === 0) {
    // Simple lag
    const values = df.colArray(col);
    for (let i = n; i < nrows; i++) {
      result[i] = values[i - n];
    }
  } else {
    // Grouped lag
    const grouped = df.groupBy(...partitionBy);
    for (const group of grouped.groups) {
      const indices = group.indices;
      for (let i = n; i < indices.length; i++) {
        result[indices[i]] = df.col(col).at(indices[i - n]);
      }
    }
  }
  
  return result;
}

/**
 * Get next row's value (lead)
 * @param {DataFrame} df - Input DataFrame
 * @param {string} col - Column name
 * @param {number} n - Number of rows to lead (default: 1)
 * @param {any} fill - Fill value for missing (default: null)
 * @param {Array<string>} partitionBy - Columns to partition by
 * @returns {Array} Lead values
 */
export function lead(df, col, n = 1, fill = null, partitionBy = []) {
  const nrows = df.nrow;
  const result = new Array(nrows).fill(fill);
  
  if (partitionBy.length === 0) {
    // Simple lead
    const values = df.colArray(col);
    for (let i = 0; i < nrows - n; i++) {
      result[i] = values[i + n];
    }
  } else {
    // Grouped lead
    const grouped = df.groupBy(...partitionBy);
    for (const group of grouped.groups) {
      const indices = group.indices;
      for (let i = 0; i < indices.length - n; i++) {
        result[indices[i]] = df.col(col).at(indices[i + n]);
      }
    }
  }
  
  return result;
}

/**
 * Cumulative sum within groups
 * @param {DataFrame} df - Input DataFrame
 * @param {string} col - Column name
 * @param {Array<string>} partitionBy - Columns to partition by
 * @returns {Array<number>} Cumulative sums
 */
export function cumsum(df, col, partitionBy = []) {
  const nrows = df.nrow;
  const result = new Array(nrows);
  
  if (partitionBy.length === 0) {
    // Simple cumsum
    const values = df.colArray(col);
    let sum = 0;
    for (let i = 0; i < nrows; i++) {
      const val = values[i];
      if (val !== null && val !== undefined && !isNaN(val)) {
        sum += val;
      }
      result[i] = sum;
    }
  } else {
    // Grouped cumsum
    const grouped = df.groupBy(...partitionBy);
    for (const group of grouped.groups) {
      const indices = group.indices;
      let sum = 0;
      for (const idx of indices) {
        const val = df.col(col).at(idx);
        if (val !== null && val !== undefined && !isNaN(val)) {
          sum += val;
        }
        result[idx] = sum;
      }
    }
  }
  
  return result;
}

/**
 * Cumulative mean within groups
 * @param {DataFrame} df - Input DataFrame
 * @param {string} col - Column name
 * @param {Array<string>} partitionBy - Columns to partition by
 * @returns {Array<number>} Cumulative means
 */
export function cummean(df, col, partitionBy = []) {
  const nrows = df.nrow;
  const result = new Array(nrows);
  
  if (partitionBy.length === 0) {
    const values = df.colArray(col);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < nrows; i++) {
      const val = values[i];
      if (val !== null && val !== undefined && !isNaN(val)) {
        sum += val;
        count++;
      }
      result[i] = count > 0 ? sum / count : null;
    }
  } else {
    const grouped = df.groupBy(...partitionBy);
    for (const group of grouped.groups) {
      const indices = group.indices;
      let sum = 0;
      let count = 0;
      for (const idx of indices) {
        const val = df.col(col).at(idx);
        if (val !== null && val !== undefined && !isNaN(val)) {
          sum += val;
          count++;
        }
        result[idx] = count > 0 ? sum / count : null;
      }
    }
  }
  
  return result;
}

/**
 * First value in group
 * @param {DataFrame} df - Input DataFrame
 * @param {string} col - Column name
 * @param {Array<string>} partitionBy - Columns to partition by
 * @returns {Array} First values
 */
export function first(df, col, partitionBy = []) {
  const nrows = df.nrow;
  const result = new Array(nrows);
  
  if (partitionBy.length === 0) {
    const firstVal = df.col(col).at(0);
    result.fill(firstVal);
  } else {
    const grouped = df.groupBy(...partitionBy);
    for (const group of grouped.groups) {
      const indices = group.indices;
      const firstVal = df.col(col).at(indices[0]);
      for (const idx of indices) {
        result[idx] = firstVal;
      }
    }
  }
  
  return result;
}

/**
 * Last value in group
 * @param {DataFrame} df - Input DataFrame
 * @param {string} col - Column name
 * @param {Array<string>} partitionBy - Columns to partition by
 * @returns {Array} Last values
 */
export function last(df, col, partitionBy = []) {
  const nrows = df.nrow;
  const result = new Array(nrows);
  
  if (partitionBy.length === 0) {
    const lastVal = df.col(col).at(nrows - 1);
    result.fill(lastVal);
  } else {
    const grouped = df.groupBy(...partitionBy);
    for (const group of grouped.groups) {
      const indices = group.indices;
      const lastVal = df.col(col).at(indices[indices.length - 1]);
      for (const idx of indices) {
        result[idx] = lastVal;
      }
    }
  }
  
  return result;
}

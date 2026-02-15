/**
 * DataFrame - Tabular data structure inspired by R/tidyverse and pandas
 * 
 * A DataFrame is a column-oriented data structure with labeled axes (rows and columns).
 * Each column can be a Vector or Factor, providing type safety and statistical operations.
 */

import Vector from '../core/Vector.js';
import Factor from '../core/Factor.js';

export default class DataFrame {
  /**
   * Create a new DataFrame
   * @param {Object} data - Object with column names as keys and arrays/Vectors/Factors as values
   * @param {Object} options - Optional configuration
   * @param {Array<string>} options.rowNames - Optional row names
   */
  constructor(data = {}, options = {}) {
    this._columns = new Map();
    this._rowNames = options.rowNames || null;
    this._nrows = 0;
    
    // Initialize from data object
    const entries = Object.entries(data);
    
    if (entries.length > 0) {
      // Determine number of rows from first column
      const firstCol = entries[0][1];
      this._nrows = Array.isArray(firstCol) ? firstCol.length : firstCol.length();
      
      // Add each column
      for (const [name, values] of entries) {
        this.addColumn(name, values);
      }
    }
  }
  
  /**
   * Get number of rows
   */
  get nrow() {
    return this._nrows;
  }
  
  /**
   * Get number of columns
   */
  get ncol() {
    return this._columns.size;
  }
  
  /**
   * Get column names
   */
  get names() {
    return Array.from(this._columns.keys());
  }
  
  /**
   * Get dimensions [nrow, ncol]
   */
  get dim() {
    return [this._nrows, this._columns.size];
  }
  
  /**
   * Add a column to the DataFrame
   * @param {string} name - Column name
   * @param {Array|Vector|Factor} values - Column values
   */
  addColumn(name, values) {
    let col;
    
    if (values instanceof Vector || values instanceof Factor) {
      col = values;
    } else if (Array.isArray(values)) {
      // Try to detect if it should be a Factor
      const uniqueCount = new Set(values.filter(v => v !== null && v !== undefined)).size;
      if (uniqueCount <= Math.min(10, values.length / 2) && uniqueCount > 0) {
        // Looks categorical
        col = new Factor(values);
      } else {
        col = new Vector(values);
      }
    } else {
      throw new Error('Column values must be an Array, Vector, or Factor');
    }
    
    // Check length
    if (this._nrows === 0) {
      this._nrows = col.length();
    } else if (col.length() !== this._nrows) {
      throw new Error(`Column length (${col.length()}) does not match DataFrame rows (${this._nrows})`);
    }
    
    this._columns.set(name, col);
    return this;
  }
  
  /**
   * Get a column by name
   * @param {string} name - Column name
   * @returns {Vector|Factor}
   */
  col(name) {
    if (!this._columns.has(name)) {
      throw new Error(`Column '${name}' not found`);
    }
    return this._columns.get(name);
  }
  
  /**
   * Get column as array
   * @param {string} name - Column name
   * @returns {Array}
   */
  colArray(name) {
    return this.col(name).toArray();
  }
  
  /**
   * Select specific columns
   * @param {...string} colNames - Column names to select
   * @returns {DataFrame}
   */
  select(...colNames) {
    const newData = {};
    
    for (const name of colNames) {
      if (!this._columns.has(name)) {
        throw new Error(`Column '${name}' not found`);
      }
      newData[name] = this._columns.get(name);
    }
    
    return new DataFrame(newData, { rowNames: this._rowNames });
  }
  
  /**
   * Filter rows based on a condition
   * @param {Function} predicate - Function that takes a row object and returns boolean
   * @returns {DataFrame}
   */
  filter(predicate) {
    const indices = [];
    
    for (let i = 0; i < this._nrows; i++) {
      const row = this.row(i);
      if (predicate(row, i)) {
        indices.push(i);
      }
    }
    
    return this.slice(indices);
  }
  
  /**
   * Get row as object
   * @param {number} index - Row index
   * @returns {Object}
   */
  row(index) {
    if (index < 0 || index >= this._nrows) {
      throw new Error(`Row index ${index} out of bounds [0, ${this._nrows})`);
    }
    
    const rowObj = {};
    for (const [name, col] of this._columns.entries()) {
      rowObj[name] = col.at(index);
    }
    return rowObj;
  }
  
  /**
   * Slice DataFrame by row indices
   * @param {Array<number>} indices - Row indices to keep
   * @returns {DataFrame}
   */
  slice(indices) {
    const newData = {};
    
    for (const [name, col] of this._columns.entries()) {
      const values = indices.map(i => col.at(i));
      newData[name] = col instanceof Factor 
        ? new Factor(values, { levels: col.levels })
        : new Vector(values);
    }
    
    const newRowNames = this._rowNames ? indices.map(i => this._rowNames[i]) : null;
    return new DataFrame(newData, { rowNames: newRowNames });
  }
  
  /**
   * Add or modify columns using expressions
   * @param {Object} expressions - Object mapping column names to functions or values
   * @returns {DataFrame}
   */
  mutate(expressions) {
    // Clone existing data
    const newData = {};
    for (const [name, col] of this._columns.entries()) {
      newData[name] = col;
    }
    
    // Apply mutations
    for (const [name, expr] of Object.entries(expressions)) {
      if (typeof expr === 'function') {
        // Function: compute for each row
        const values = [];
        for (let i = 0; i < this._nrows; i++) {
          const row = this.row(i);
          values.push(expr(row, i));
        }
        newData[name] = values;
      } else if (Array.isArray(expr)) {
        // Array: use directly
        if (expr.length !== this._nrows) {
          throw new Error(`Array length (${expr.length}) does not match DataFrame rows (${this._nrows})`);
        }
        newData[name] = expr;
      } else {
        // Scalar: replicate for all rows
        newData[name] = new Array(this._nrows).fill(expr);
      }
    }
    
    return new DataFrame(newData, { rowNames: this._rowNames });
  }
  
  /**
   * Rename columns
   * @param {Object} mapping - Object mapping old names to new names
   * @returns {DataFrame}
   */
  rename(mapping) {
    const newData = {};
    
    for (const [oldName, col] of this._columns.entries()) {
      const newName = mapping[oldName] || oldName;
      newData[newName] = col;
    }
    
    return new DataFrame(newData, { rowNames: this._rowNames });
  }
  
  /**
   * Sort DataFrame by one or more columns
   * @param {string|Array<string>} cols - Column name(s) to sort by
   * @param {Object} options - Sort options
   * @param {boolean|Array<boolean>} options.decreasing - Sort in decreasing order
   * @returns {DataFrame}
   */
  arrange(cols, options = {}) {
    const colNames = Array.isArray(cols) ? cols : [cols];
    const decreasing = Array.isArray(options.decreasing) 
      ? options.decreasing 
      : new Array(colNames.length).fill(options.decreasing || false);
    
    // Create indices
    const indices = Array.from({ length: this._nrows }, (_, i) => i);
    
    // Sort indices
    indices.sort((a, b) => {
      for (let i = 0; i < colNames.length; i++) {
        const col = this.col(colNames[i]);
        const valA = col.at(a);
        const valB = col.at(b);
        
        // Handle nulls
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        let cmp = 0;
        if (valA < valB) cmp = -1;
        else if (valA > valB) cmp = 1;
        
        if (cmp !== 0) {
          return decreasing[i] ? -cmp : cmp;
        }
      }
      return 0;
    });
    
    return this.slice(indices);
  }
  
  /**
   * Group DataFrame by one or more columns
   * @param {...string} colNames - Column names to group by
   * @returns {GroupedDataFrame}
   */
  groupBy(...colNames) {
    return new GroupedDataFrame(this, colNames);
  }
  
  /**
   * Get first n rows
   * @param {number} n - Number of rows (default: 6)
   * @returns {DataFrame}
   */
  head(n = 6) {
    const indices = Array.from({ length: Math.min(n, this._nrows) }, (_, i) => i);
    return this.slice(indices);
  }
  
  /**
   * Get last n rows
   * @param {number} n - Number of rows (default: 6)
   * @returns {DataFrame}
   */
  tail(n = 6) {
    const start = Math.max(0, this._nrows - n);
    const indices = Array.from({ length: this._nrows - start }, (_, i) => start + i);
    return this.slice(indices);
  }
  
  /**
   * Convert DataFrame to array of row objects
   * @returns {Array<Object>}
   */
  toArray() {
    return Array.from({ length: this._nrows }, (_, i) => this.row(i));
  }
  
  /**
   * Convert DataFrame to plain object
   * @returns {Object}
   */
  toObject() {
    const obj = {};
    for (const [name, col] of this._columns.entries()) {
      obj[name] = col.toArray();
    }
    return obj;
  }
  
  /**
   * Pretty print DataFrame
   * @param {number} maxRows - Maximum rows to display
   * @returns {string}
   */
  toString(maxRows = 10) {
    if (this._nrows === 0) {
      return 'Empty DataFrame [0 x 0]';
    }
    
    const names = this.names;
    const lines = [];
    
    // Header
    lines.push(`DataFrame [${this._nrows} x ${this.ncol}]`);
    
    // Column names with types
    const header = names.map(name => {
      const col = this._columns.get(name);
      const type = col instanceof Factor ? 'factor' : 'numeric';
      return `${name} <${type}>`;
    }).join('  ');
    lines.push(header);
    lines.push('-'.repeat(Math.min(80, header.length)));
    
    // Rows
    const displayRows = Math.min(maxRows, this._nrows);
    for (let i = 0; i < displayRows; i++) {
      const row = this.row(i);
      const values = names.map(name => {
        const val = row[name];
        if (val === null || val === undefined) return 'NA';
        if (typeof val === 'number') return val.toFixed(2);
        return String(val);
      }).join('  ');
      lines.push(values);
    }
    
    if (this._nrows > maxRows) {
      lines.push(`... with ${this._nrows - maxRows} more rows`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Create DataFrame from array of objects
   * @param {Array<Object>} data - Array of row objects
   * @returns {DataFrame}
   */
  static fromObjects(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return new DataFrame();
    }
    
    // Get column names from first object
    const names = Object.keys(data[0]);
    
    // Extract columns
    const columns = {};
    for (const name of names) {
      columns[name] = data.map(row => row[name]);
    }
    
    return new DataFrame(columns);
  }
}

/**
 * GroupedDataFrame - Represents a grouped DataFrame for aggregation
 */
class GroupedDataFrame {
  constructor(df, groupCols) {
    this.df = df;
    this.groupCols = groupCols;
    this.groups = this._computeGroups();
  }
  
  /**
   * Compute group indices
   */
  _computeGroups() {
    const groupMap = new Map();
    
    for (let i = 0; i < this.df.nrow; i++) {
      // Create group key
      const keyParts = this.groupCols.map(col => {
        const val = this.df.col(col).at(i);
        return val === null || val === undefined ? '__NA__' : String(val);
      });
      const key = keyParts.join('|');
      
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key: keyParts,
          indices: []
        });
      }
      groupMap.get(key).indices.push(i);
    }
    
    return Array.from(groupMap.values());
  }
  
  /**
   * Summarize grouped data
   * @param {Object} aggregations - Object mapping result column names to aggregation functions
   * @returns {DataFrame}
   */
  summarize(aggregations) {
    const resultData = {};
    
    // Initialize group columns
    for (let i = 0; i < this.groupCols.length; i++) {
      resultData[this.groupCols[i]] = [];
    }
    
    // Initialize result columns
    for (const name of Object.keys(aggregations)) {
      resultData[name] = [];
    }
    
    // Process each group
    for (const group of this.groups) {
      // Add group keys
      for (let i = 0; i < this.groupCols.length; i++) {
        const key = group.key[i];
        resultData[this.groupCols[i]].push(key === '__NA__' ? null : key);
      }
      
      // Compute aggregations
      const groupDf = this.df.slice(group.indices);
      
      for (const [name, aggFn] of Object.entries(aggregations)) {
        const result = aggFn(groupDf);
        resultData[name].push(result);
      }
    }
    
    return new DataFrame(resultData);
  }
  
  /**
   * Number of groups
   */
  get ngroups() {
    return this.groups.length;
  }
}

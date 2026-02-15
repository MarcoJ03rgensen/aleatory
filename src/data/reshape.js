/**
 * Data reshaping operations for DataFrames
 * Inspired by tidyr (pivot_longer, pivot_wider)
 */

import DataFrame from './DataFrame.js';
import Vector from '../core/Vector.js';
import Factor from '../core/Factor.js';

/**
 * Pivot DataFrame from wide to long format
 * 
 * @param {DataFrame} df - Input DataFrame
 * @param {Array<string>} cols - Columns to pivot
 * @param {Object} options - Options
 * @param {string} options.names_to - Name for column containing old column names (default: 'name')
 * @param {string} options.values_to - Name for column containing values (default: 'value')
 * @returns {DataFrame}
 * 
 * Example:
 *   wide: {id: [1,2], x: [10,20], y: [30,40]}
 *   pivotLonger(wide, ['x', 'y'])
 *   => {id: [1,1,2,2], name: ['x','y','x','y'], value: [10,30,20,40]}
 */
export function pivotLonger(df, cols, options = {}) {
  const names_to = options.names_to || 'name';
  const values_to = options.values_to || 'value';
  
  // Get columns to keep
  const keepCols = df.names.filter(name => !cols.includes(name));
  
  // Build result data
  const result = {};
  
  // Initialize keep columns with repeated values
  for (const col of keepCols) {
    result[col] = [];
  }
  result[names_to] = [];
  result[values_to] = [];
  
  // Pivot each row
  for (let i = 0; i < df.nrow; i++) {
    const row = df.row(i);
    
    for (const pivotCol of cols) {
      // Add keep column values
      for (const keepCol of keepCols) {
        result[keepCol].push(row[keepCol]);
      }
      
      // Add name and value
      result[names_to].push(pivotCol);
      result[values_to].push(row[pivotCol]);
    }
  }
  
  return new DataFrame(result);
}

/**
 * Pivot DataFrame from long to wide format
 * 
 * @param {DataFrame} df - Input DataFrame
 * @param {Object} options - Options
 * @param {string} options.names_from - Column containing new column names
 * @param {string} options.values_from - Column containing values
 * @param {Function} options.values_fn - Aggregation function if duplicates exist (default: first value)
 * @returns {DataFrame}
 * 
 * Example:
 *   long: {id: [1,1,2,2], name: ['x','y','x','y'], value: [10,30,20,40]}
 *   pivotWider(long, {names_from: 'name', values_from: 'value'})
 *   => {id: [1,2], x: [10,20], y: [30,40]}
 */
export function pivotWider(df, options = {}) {
  const { names_from, values_from, values_fn } = options;
  
  if (!names_from || !values_from) {
    throw new Error('Both names_from and values_from must be specified');
  }
  
  // Get ID columns (all columns except names_from and values_from)
  const idCols = df.names.filter(name => name !== names_from && name !== values_from);
  
  // Get unique values for new columns
  const newColNames = [...new Set(df.colArray(names_from))];
  
  // Group by ID columns
  const groups = new Map();
  
  for (let i = 0; i < df.nrow; i++) {
    const row = df.row(i);
    
    // Create key from ID columns
    const key = idCols.map(col => row[col]).join('|');
    
    if (!groups.has(key)) {
      groups.set(key, {
        ids: idCols.map(col => row[col]),
        values: new Map()
      });
    }
    
    const group = groups.get(key);
    const colName = row[names_from];
    const value = row[values_from];
    
    // Handle duplicates
    if (!group.values.has(colName)) {
      group.values.set(colName, []);
    }
    group.values.get(colName).push(value);
  }
  
  // Build result
  const result = {};
  
  // Initialize ID columns
  for (const col of idCols) {
    result[col] = [];
  }
  
  // Initialize value columns
  for (const col of newColNames) {
    result[col] = [];
  }
  
  // Fill in data
  for (const group of groups.values()) {
    // Add ID values
    for (let i = 0; i < idCols.length; i++) {
      result[idCols[i]].push(group.ids[i]);
    }
    
    // Add value columns
    for (const colName of newColNames) {
      const values = group.values.get(colName) || [null];
      
      // Aggregate if multiple values
      let finalValue;
      if (values.length === 1) {
        finalValue = values[0];
      } else if (values_fn) {
        finalValue = values_fn(values);
      } else {
        // Default: take first value
        finalValue = values[0];
      }
      
      result[colName].push(finalValue);
    }
  }
  
  return new DataFrame(result);
}

/**
 * Separate a column into multiple columns
 * 
 * @param {DataFrame} df - Input DataFrame
 * @param {string} col - Column to separate
 * @param {Array<string>} into - Names for new columns
 * @param {Object} options - Options
 * @param {string|RegExp} options.sep - Separator (default: /\s+/)
 * @param {boolean} options.remove - Remove original column (default: true)
 * @returns {DataFrame}
 */
export function separate(df, col, into, options = {}) {
  const sep = options.sep || /\s+/;
  const remove = options.remove !== false;
  
  // Extract values and split
  const values = df.colArray(col);
  const splitValues = values.map(v => {
    if (v === null || v === undefined) {
      return new Array(into.length).fill(null);
    }
    const parts = String(v).split(sep);
    // Pad or truncate to match into.length
    while (parts.length < into.length) parts.push(null);
    return parts.slice(0, into.length);
  });
  
  // Build new columns
  const newData = {};
  
  // Copy existing columns
  for (const name of df.names) {
    if (name === col && remove) continue;
    newData[name] = df.col(name);
  }
  
  // Add new columns
  for (let i = 0; i < into.length; i++) {
    newData[into[i]] = splitValues.map(parts => parts[i]);
  }
  
  return new DataFrame(newData);
}

/**
 * Unite multiple columns into one
 * 
 * @param {DataFrame} df - Input DataFrame
 * @param {string} col - Name for new column
 * @param {Array<string>} cols - Columns to unite
 * @param {Object} options - Options
 * @param {string} options.sep - Separator (default: '_')
 * @param {boolean} options.remove - Remove original columns (default: true)
 * @param {boolean} options.na_rm - Remove NA before uniting (default: false)
 * @returns {DataFrame}
 */
export function unite(df, col, cols, options = {}) {
  const sep = options.sep || '_';
  const remove = options.remove !== false;
  const na_rm = options.na_rm || false;
  
  // Build united values
  const unitedValues = [];
  
  for (let i = 0; i < df.nrow; i++) {
    const row = df.row(i);
    let parts = cols.map(c => row[c]);
    
    if (na_rm) {
      parts = parts.filter(v => v !== null && v !== undefined);
    }
    
    // Check if all are null/undefined
    if (parts.every(v => v === null || v === undefined)) {
      unitedValues.push(null);
    } else {
      unitedValues.push(parts.map(v => v === null || v === undefined ? '' : String(v)).join(sep));
    }
  }
  
  // Build new DataFrame
  const newData = {};
  
  // Copy existing columns
  for (const name of df.names) {
    if (cols.includes(name) && remove) continue;
    newData[name] = df.col(name);
  }
  
  // Add united column
  newData[col] = unitedValues;
  
  return new DataFrame(newData);
}

/**
 * Drop rows with missing values
 * 
 * @param {DataFrame} df - Input DataFrame
 * @param {Array<string>} cols - Columns to check (default: all columns)
 * @returns {DataFrame}
 */
export function dropNA(df, cols = null) {
  const checkCols = cols || df.names;
  
  return df.filter(row => {
    for (const col of checkCols) {
      const val = row[col];
      if (val === null || val === undefined || Number.isNaN(val)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Fill missing values
 * 
 * @param {DataFrame} df - Input DataFrame
 * @param {Object} values - Object mapping column names to fill values or functions
 * @returns {DataFrame}
 */
export function fillNA(df, values) {
  return df.mutate(
    Object.fromEntries(
      Object.entries(values).map(([col, fillValue]) => [
        col,
        row => {
          const val = row[col];
          if (val === null || val === undefined || Number.isNaN(val)) {
            return typeof fillValue === 'function' ? fillValue(row) : fillValue;
          }
          return val;
        }
      ])
    )
  );
}

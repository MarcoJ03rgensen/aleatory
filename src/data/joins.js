/**
 * Join operations for DataFrames
 * Inspired by dplyr (left_join, inner_join, full_join, etc.)
 */

import DataFrame from './DataFrame.js';

/**
 * Inner join - keep only rows with keys in both DataFrames
 * 
 * @param {DataFrame} left - Left DataFrame
 * @param {DataFrame} right - Right DataFrame
 * @param {Object} options - Join options
 * @param {string|Array<string>} options.by - Column(s) to join by
 * @param {string} options.suffix - Suffix for duplicate column names (default: ['.x', '.y'])
 * @returns {DataFrame}
 */
export function innerJoin(left, right, options = {}) {
  return performJoin(left, right, 'inner', options);
}

/**
 * Left join - keep all rows from left, add matching from right
 * 
 * @param {DataFrame} left - Left DataFrame
 * @param {DataFrame} right - Right DataFrame
 * @param {Object} options - Join options
 * @returns {DataFrame}
 */
export function leftJoin(left, right, options = {}) {
  return performJoin(left, right, 'left', options);
}

/**
 * Right join - keep all rows from right, add matching from left
 * 
 * @param {DataFrame} left - Left DataFrame
 * @param {DataFrame} right - Right DataFrame
 * @param {Object} options - Join options
 * @returns {DataFrame}
 */
export function rightJoin(left, right, options = {}) {
  return performJoin(left, right, 'right', options);
}

/**
 * Full join - keep all rows from both DataFrames
 * 
 * @param {DataFrame} left - Left DataFrame
 * @param {DataFrame} right - Right DataFrame
 * @param {Object} options - Join options
 * @returns {DataFrame}
 */
export function fullJoin(left, right, options = {}) {
  return performJoin(left, right, 'full', options);
}

/**
 * Anti join - keep rows from left that DON'T have a match in right
 * 
 * @param {DataFrame} left - Left DataFrame
 * @param {DataFrame} right - Right DataFrame
 * @param {Object} options - Join options
 * @returns {DataFrame}
 */
export function antiJoin(left, right, options = {}) {
  return performJoin(left, right, 'anti', options);
}

/**
 * Semi join - keep rows from left that have a match in right
 * 
 * @param {DataFrame} left - Left DataFrame
 * @param {DataFrame} right - Right DataFrame
 * @param {Object} options - Join options
 * @returns {DataFrame}
 */
export function semiJoin(left, right, options = {}) {
  return performJoin(left, right, 'semi', options);
}

/**
 * Core join implementation
 */
function performJoin(left, right, type, options) {
  const { by } = options;
  const suffix = options.suffix || ['.x', '.y'];
  
  if (!by) {
    throw new Error('Join key(s) must be specified with "by" option');
  }
  
  const joinKeys = Array.isArray(by) ? by : [by];
  
  // Validate join keys exist
  for (const key of joinKeys) {
    if (!left.names.includes(key)) {
      throw new Error(`Join key '${key}' not found in left DataFrame`);
    }
    if (!right.names.includes(key)) {
      throw new Error(`Join key '${key}' not found in right DataFrame`);
    }
  }
  
  // Build index for right DataFrame
  const rightIndex = buildIndex(right, joinKeys);
  
  // Determine columns for result
  const leftOnlyCols = left.names.filter(name => !joinKeys.includes(name));
  const rightOnlyCols = right.names.filter(name => !joinKeys.includes(name));
  
  // Check for column name conflicts and apply suffix
  const leftColMap = new Map();
  const rightColMap = new Map();
  
  for (const col of leftOnlyCols) {
    if (rightOnlyCols.includes(col)) {
      leftColMap.set(col, col + suffix[0]);
      rightColMap.set(col, col + suffix[1]);
    } else {
      leftColMap.set(col, col);
    }
  }
  
  for (const col of rightOnlyCols) {
    if (!leftOnlyCols.includes(col)) {
      rightColMap.set(col, col);
    }
  }
  
  // Initialize result data
  const result = {};
  
  // Add join key columns
  for (const key of joinKeys) {
    result[key] = [];
  }
  
  // Add left columns
  for (const [origName, newName] of leftColMap.entries()) {
    result[newName] = [];
  }
  
  // Add right columns
  for (const [origName, newName] of rightColMap.entries()) {
    result[newName] = [];
  }
  
  // Track which right rows were matched (for full join)
  const matchedRightRows = new Set();
  
  // Process left rows
  for (let i = 0; i < left.nrow; i++) {
    const leftRow = left.row(i);
    const key = makeKey(leftRow, joinKeys);
    const rightIndices = rightIndex.get(key) || [];
    
    if (rightIndices.length === 0) {
      // No match in right
      if (type === 'inner' || type === 'semi') {
        continue; // Skip this row
      } else if (type === 'anti') {
        // Anti join: include this row
        addRow(result, joinKeys, leftRow, null, leftColMap, rightColMap);
      } else {
        // Left or full join: include with NAs for right
        addRow(result, joinKeys, leftRow, null, leftColMap, rightColMap);
      }
    } else {
      // Has match(es) in right
      if (type === 'anti') {
        continue; // Anti join: skip matched rows
      } else if (type === 'semi') {
        // Semi join: include left row once (no right columns)
        addRow(result, joinKeys, leftRow, null, leftColMap, new Map());
      } else {
        // Include all matches
        for (const j of rightIndices) {
          const rightRow = right.row(j);
          addRow(result, joinKeys, leftRow, rightRow, leftColMap, rightColMap);
          matchedRightRows.add(j);
        }
      }
    }
  }
  
  // Full join: add unmatched right rows
  if (type === 'full') {
    for (let j = 0; j < right.nrow; j++) {
      if (!matchedRightRows.has(j)) {
        const rightRow = right.row(j);
        addRow(result, joinKeys, null, rightRow, leftColMap, rightColMap);
      }
    }
  }
  
  // Right join: add unmatched right rows
  if (type === 'right') {
    for (let j = 0; j < right.nrow; j++) {
      if (!matchedRightRows.has(j)) {
        const rightRow = right.row(j);
        addRow(result, joinKeys, null, rightRow, leftColMap, rightColMap);
      }
    }
  }
  
  return new DataFrame(result);
}

/**
 * Build index mapping keys to row indices
 */
function buildIndex(df, keys) {
  const index = new Map();
  
  for (let i = 0; i < df.nrow; i++) {
    const row = df.row(i);
    const key = makeKey(row, keys);
    
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key).push(i);
  }
  
  return index;
}

/**
 * Create key string from row values
 */
function makeKey(row, keys) {
  return keys.map(k => {
    const val = row[k];
    return val === null || val === undefined ? '__NA__' : String(val);
  }).join('|');
}

/**
 * Add row to result
 */
function addRow(result, joinKeys, leftRow, rightRow, leftColMap, rightColMap) {
  // Add join key values (from left if available, otherwise from right)
  for (const key of joinKeys) {
    const val = leftRow ? leftRow[key] : rightRow[key];
    result[key].push(val);
  }
  
  // Add left columns
  for (const [origName, newName] of leftColMap.entries()) {
    const val = leftRow ? leftRow[origName] : null;
    result[newName].push(val);
  }
  
  // Add right columns
  for (const [origName, newName] of rightColMap.entries()) {
    const val = rightRow ? rightRow[origName] : null;
    result[newName].push(val);
  }
}

/**
 * Bind DataFrames by rows (stack vertically)
 * 
 * @param {...DataFrame} dfs - DataFrames to bind
 * @returns {DataFrame}
 */
export function bindRows(...dfs) {
  if (dfs.length === 0) {
    return new DataFrame();
  }
  
  // Get all column names
  const allCols = new Set();
  for (const df of dfs) {
    for (const name of df.names) {
      allCols.add(name);
    }
  }
  
  // Build result
  const result = {};
  for (const col of allCols) {
    result[col] = [];
  }
  
  // Append rows from each DataFrame
  for (const df of dfs) {
    for (let i = 0; i < df.nrow; i++) {
      const row = df.row(i);
      
      for (const col of allCols) {
        result[col].push(row[col] !== undefined ? row[col] : null);
      }
    }
  }
  
  return new DataFrame(result);
}

/**
 * Bind DataFrames by columns (concatenate horizontally)
 * 
 * @param {...DataFrame} dfs - DataFrames to bind
 * @returns {DataFrame}
 */
export function bindCols(...dfs) {
  if (dfs.length === 0) {
    return new DataFrame();
  }
  
  // Check all have same number of rows
  const nrow = dfs[0].nrow;
  for (const df of dfs) {
    if (df.nrow !== nrow) {
      throw new Error(`All DataFrames must have same number of rows (got ${nrow} and ${df.nrow})`);
    }
  }
  
  // Check for duplicate column names
  const allNames = [];
  for (const df of dfs) {
    allNames.push(...df.names);
  }
  
  const uniqueNames = new Set(allNames);
  if (uniqueNames.size !== allNames.length) {
    throw new Error('Duplicate column names found. Use rename() to avoid conflicts.');
  }
  
  // Build result
  const result = {};
  for (const df of dfs) {
    for (const name of df.names) {
      result[name] = df.col(name);
    }
  }
  
  return new DataFrame(result);
}

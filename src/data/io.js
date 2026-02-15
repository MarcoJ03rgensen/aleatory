/**
 * I/O operations for DataFrames
 * Support for CSV and JSON formats
 */

import DataFrame from './DataFrame.js';
import * as fs from 'fs';

/**
 * Read DataFrame from CSV file or string
 * 
 * @param {string} input - File path or CSV string
 * @param {Object} options - Options
 * @param {boolean} options.header - First row is header (default: true)
 * @param {string} options.sep - Delimiter (default: ',')
 * @param {Array<string>} options.colNames - Custom column names
 * @param {Object} options.colTypes - Object mapping column names to 'numeric' or 'factor'
 * @param {boolean} options.stringsAsFactors - Convert strings to factors (default: false)
 * @param {boolean} options.isString - Input is CSV string not file path (default: false)
 * @returns {DataFrame}
 */
export function readCSV(input, options = {}) {
  const header = options.header !== false;
  const sep = options.sep || ',';
  const colNames = options.colNames;
  const colTypes = options.colTypes || {};
  const stringsAsFactors = options.stringsAsFactors || false;
  const isString = options.isString || false;
  
  // Read content
  let content;
  if (isString) {
    content = input;
  } else {
    try {
      content = fs.readFileSync(input, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file '${input}': ${error.message}`);
    }
  }
  
  // Parse CSV
  const lines = content.trim().split('\n');
  
  if (lines.length === 0) {
    return new DataFrame();
  }
  
  // Parse rows
  const rows = lines.map(line => parseCSVLine(line, sep));
  
  // Get column names
  let names;
  let dataRows;
  
  if (header) {
    names = rows[0];
    dataRows = rows.slice(1);
  } else {
    if (colNames) {
      names = colNames;
    } else {
      names = rows[0].map((_, i) => `V${i + 1}`);
    }
    dataRows = rows;
  }
  
  // Override with custom column names if provided
  if (colNames && header) {
    names = colNames;
  }
  
  // Build columns
  const data = {};
  
  for (let i = 0; i < names.length; i++) {
    const colName = names[i];
    const values = dataRows.map(row => row[i]);
    
    // Determine type
    let typedValues;
    const specifiedType = colTypes[colName];
    
    if (specifiedType === 'numeric') {
      typedValues = values.map(v => parseNumber(v));
    } else if (specifiedType === 'factor') {
      typedValues = values;
    } else {
      // Auto-detect
      if (values.every(v => v === '' || v === null || !isNaN(parseFloat(v)))) {
        // All numeric
        typedValues = values.map(v => parseNumber(v));
      } else if (stringsAsFactors) {
        typedValues = values;
      } else {
        // Keep as strings
        typedValues = values;
      }
    }
    
    data[colName] = typedValues;
  }
  
  return new DataFrame(data);
}

/**
 * Write DataFrame to CSV file or string
 * 
 * @param {DataFrame} df - DataFrame to write
 * @param {string} path - File path (or null to return string)
 * @param {Object} options - Options
 * @param {string} options.sep - Delimiter (default: ',')
 * @param {boolean} options.header - Include header row (default: true)
 * @param {boolean} options.rowNames - Include row names (default: false)
 * @param {number} options.digits - Number of decimal places for numbers (default: 6)
 * @returns {string|undefined} - Returns CSV string if path is null
 */
export function writeCSV(df, path, options = {}) {
  const sep = options.sep || ',';
  const header = options.header !== false;
  const rowNames = options.rowNames || false;
  const digits = options.digits !== undefined ? options.digits : 6;
  
  const lines = [];
  
  // Header
  if (header) {
    const headerCols = rowNames ? [''] : [];
    headerCols.push(...df.names);
    lines.push(headerCols.join(sep));
  }
  
  // Rows
  for (let i = 0; i < df.nrow; i++) {
    const row = df.row(i);
    const rowData = rowNames ? [String(i + 1)] : [];
    
    for (const name of df.names) {
      const val = row[name];
      
      if (val === null || val === undefined) {
        rowData.push('');
      } else if (typeof val === 'number') {
        rowData.push(val.toFixed(digits));
      } else {
        // Escape if contains delimiter or quotes
        const str = String(val);
        if (str.includes(sep) || str.includes('"') || str.includes('\n')) {
          rowData.push('"' + str.replace(/"/g, '""') + '"');
        } else {
          rowData.push(str);
        }
      }
    }
    
    lines.push(rowData.join(sep));
  }
  
  const csvString = lines.join('\n');
  
  // Write to file or return string
  if (path) {
    try {
      fs.writeFileSync(path, csvString, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file '${path}': ${error.message}`);
    }
  } else {
    return csvString;
  }
}

/**
 * Read DataFrame from JSON file or string
 * 
 * @param {string} input - File path or JSON string
 * @param {Object} options - Options
 * @param {string} options.orient - JSON orientation: 'records', 'columns' (default: 'records')
 * @param {boolean} options.isString - Input is JSON string not file path (default: false)
 * @returns {DataFrame}
 */
export function readJSON(input, options = {}) {
  const orient = options.orient || 'records';
  const isString = options.isString || false;
  
  // Read content
  let content;
  if (isString) {
    content = input;
  } else {
    try {
      content = fs.readFileSync(input, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file '${input}': ${error.message}`);
    }
  }
  
  // Parse JSON
  let data;
  try {
    data = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
  
  // Convert to DataFrame based on orientation
  if (orient === 'records') {
    // Array of objects: [{a: 1, b: 2}, {a: 3, b: 4}]
    return DataFrame.fromObjects(data);
  } else if (orient === 'columns') {
    // Object of arrays: {a: [1, 3], b: [2, 4]}
    return new DataFrame(data);
  } else {
    throw new Error(`Unknown orient: ${orient}. Use 'records' or 'columns'.`);
  }
}

/**
 * Write DataFrame to JSON file or string
 * 
 * @param {DataFrame} df - DataFrame to write
 * @param {string} path - File path (or null to return string)
 * @param {Object} options - Options
 * @param {string} options.orient - JSON orientation: 'records', 'columns' (default: 'records')
 * @param {number} options.indent - Indentation spaces (default: 2)
 * @returns {string|undefined} - Returns JSON string if path is null
 */
export function writeJSON(df, path, options = {}) {
  const orient = options.orient || 'records';
  const indent = options.indent !== undefined ? options.indent : 2;
  
  let data;
  
  if (orient === 'records') {
    // Array of objects
    data = df.toArray();
  } else if (orient === 'columns') {
    // Object of arrays
    data = df.toObject();
  } else {
    throw new Error(`Unknown orient: ${orient}. Use 'records' or 'columns'.`);
  }
  
  const jsonString = JSON.stringify(data, null, indent);
  
  // Write to file or return string
  if (path) {
    try {
      fs.writeFileSync(path, jsonString, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file '${path}': ${error.message}`);
    }
  } else {
    return jsonString;
  }
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line, sep) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === sep && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  
  return result;
}

/**
 * Parse number from string
 */
function parseNumber(str) {
  if (str === '' || str === null || str === undefined) {
    return null;
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

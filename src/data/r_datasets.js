/**
 * R Dataset Compatibility Module
 * Provides seamless integration with R datasets and R-style data conventions
 */

import DataFrame from './DataFrame.js';
import Factor from '../core/Factor.js';
import { readCSV, writeCSV } from './io.js';

/**
 * Enhanced CSV reader with R dataset compatibility
 * Handles R-specific conventions like row names, NA values, and factor columns
 * 
 * @param {string} input - File path or CSV string
 * @param {Object} options - R-specific options
 * @param {string[]} options.factorColumns - Columns to convert to factors
 * @param {Object} options.levels - Factor levels per column {colName: [level1, level2, ...]}
 * @param {string[]} options.naStrings - Strings to treat as NA (default: ['NA', '', 'NaN'])
 * @param {boolean} options.rowNames - Whether first column is row names (default: false)
 * @param {boolean} options.stringsAsFactors - Auto-convert string columns to factors (default: false)
 * @param {string} options.sep - Delimiter (default: ',')
 * @param {boolean} options.header - First row is header (default: true)
 * @param {boolean} options.isString - Input is CSV string not file path (default: false)
 * @returns {DataFrame}
 * 
 * @example
 * // Load R dataset with factor columns
 * const iris = readRDataset('iris.csv', {
 *   factorColumns: ['Species'],
 *   levels: { Species: ['setosa', 'versicolor', 'virginica'] }
 * });
 * 
 * @example
 * // Load with row names (R default)
 * const mtcars = readRDataset('mtcars.csv', {
 *   rowNames: true
 * });
 */
export function readRDataset(input, options = {}) {
  const {
    factorColumns = [],
    levels = {},
    naStrings = ['NA', '', 'NaN', 'NULL', 'null'],
    rowNames = false,
    stringsAsFactors = false,
    sep = ',',
    header = true,
    isString = false
  } = options;

  // Read CSV with basic parsing
  let df = readCSV(input, { 
    sep, 
    header, 
    isString,
    stringsAsFactors: false // We'll handle factor conversion ourselves
  });
  
  // Handle row names (R exports with row names as first column by default)
  if (rowNames && df.ncol > 0) {
    const firstCol = df.names[0];
    // Store row names as metadata if needed (for now just remove)
    const rowNameValues = df.data[firstCol];
    
    // Remove the row names column
    const remainingCols = df.names.slice(1);
    df = df.select(...remainingCols);
  }
  
  // Replace R NA strings with null throughout the dataset
  const colNames = df.names;
  for (const col of colNames) {
    df.data[col] = df.data[col].map(val => {
      if (val === null || val === undefined) return null;
      const strVal = String(val).trim();
      return naStrings.includes(strVal) ? null : val;
    });
  }
  
  // Convert specified columns to factors with explicit levels
  for (const col of factorColumns) {
    if (df.data[col]) {
      const columnLevels = levels[col] || getUniqueLevels(df.data[col]);
      df.data[col] = new Factor(df.data[col], { levels: columnLevels });
    }
  }
  
  // Auto-convert string columns to factors if requested (R's stringsAsFactors=TRUE)
  if (stringsAsFactors) {
    for (const col of colNames) {
      if (factorColumns.includes(col)) continue; // Already handled
      
      const column = df.data[col];
      const sample = column.find(v => v !== null && v !== undefined);
      
      // Check if column is string-like and not already a Factor
      if (sample && typeof sample === 'string' && !(column instanceof Factor)) {
        const columnLevels = getUniqueLevels(column);
        df.data[col] = new Factor(column, { levels: columnLevels });
      }
    }
  }
  
  return df;
}

/**
 * Convert aleatory DataFrame to R-compatible CSV format
 * Follows R conventions for row names and NA representation
 * 
 * @param {DataFrame} df - DataFrame to export
 * @param {string} path - File path (or null to return string)
 * @param {Object} options
 * @param {boolean} options.rowNames - Include 1-indexed row names as first column (default: true)
 * @param {string} options.na - String to use for NA/null values (default: 'NA')
 * @param {string} options.sep - Delimiter (default: ',')
 * @param {number} options.digits - Decimal places for numbers (default: 6)
 * @returns {string|undefined} - Returns CSV string if path is null
 * 
 * @example
 * // Export to R-compatible CSV
 * writeRDataset(df, 'output.csv', { rowNames: true, na: 'NA' });
 * 
 * // Get CSV string
 * const csvString = writeRDataset(df, null, { rowNames: false });
 */
export function writeRDataset(df, path = null, options = {}) {
  const { 
    rowNames = true, 
    na = 'NA',
    sep = ',',
    digits = 6
  } = options;
  
  const lines = [];
  const colNames = df.names;
  const nrow = df.nrow;
  
  // Header row
  const headerCols = rowNames ? [''] : [];
  headerCols.push(...colNames);
  lines.push(headerCols.join(sep));
  
  // Data rows
  for (let i = 0; i < nrow; i++) {
    const row = df.row(i);
    const rowData = rowNames ? [String(i + 1)] : [];
    
    for (const colName of colNames) {
      const val = row[colName];
      
      // Handle null/undefined as NA
      if (val === null || val === undefined) {
        rowData.push(na);
      }
      // Handle Factor values
      else if (val instanceof Factor) {
        const factorVal = val.get(0);
        rowData.push(factorVal === null ? na : factorVal);
      }
      // Handle numbers
      else if (typeof val === 'number') {
        rowData.push(isNaN(val) ? na : val.toFixed(digits));
      }
      // Handle strings (escape if needed)
      else {
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
    return writeCSV(df, path, { ...options, rowNames, sep });
  } else {
    return csvString;
  }
}

/**
 * Built-in R datasets from popular packages
 * Provides easy access to commonly-used R datasets for testing and examples
 */
export const RDatasets = {
  /**
   * Load the iris dataset (Edgar Anderson's Iris Data)
   * 150 observations of 4 measurements on 3 species of iris flowers
   * @returns {Promise<DataFrame>}
   * 
   * @example
   * const iris = await RDatasets.iris();
   * console.log(iris.head());
   */
  async iris() {
    const url = 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv';
    const response = await fetch(url);
    const text = await response.text();
    return readRDataset(text, {
      isString: true,
      factorColumns: ['species'],
      levels: { species: ['setosa', 'versicolor', 'virginica'] }
    });
  },
  
  /**
   * Load the mtcars dataset (Motor Trend Car Road Tests)
   * 32 automobiles with 11 measurements (mpg, cylinders, horsepower, etc.)
   * @returns {Promise<DataFrame>}
   * 
   * @example
   * const mtcars = await RDatasets.mtcars();
   * const model = lm(mtcars.data.mpg, [mtcars.data.hp, mtcars.data.wt]);
   */
  async mtcars() {
    // Using a reliable source for mtcars
    const csvData = `"",mpg,cyl,disp,hp,drat,wt,qsec,vs,am,gear,carb
"Mazda RX4",21,6,160,110,3.9,2.62,16.46,0,1,4,4
"Mazda RX4 Wag",21,6,160,110,3.9,2.875,17.02,0,1,4,4
"Datsun 710",22.8,4,108,93,3.85,2.32,18.61,1,1,4,1
"Hornet 4 Drive",21.4,6,258,110,3.08,3.215,19.44,1,0,3,1
"Hornet Sportabout",18.7,8,360,175,3.15,3.44,17.02,0,0,3,2
"Valiant",18.1,6,225,105,2.76,3.46,20.22,1,0,3,1
"Duster 360",14.3,8,360,245,3.21,3.57,15.84,0,0,3,4
"Merc 240D",24.4,4,146.7,62,3.69,3.19,20,1,0,4,2
"Merc 230",22.8,4,140.8,95,3.92,3.15,22.9,1,0,4,2
"Merc 280",19.2,6,167.6,123,3.92,3.44,18.3,1,0,4,4
"Merc 280C",17.8,6,167.6,123,3.92,3.44,18.9,1,0,4,4
"Merc 450SE",16.4,8,275.8,180,3.07,4.07,17.4,0,0,3,3
"Merc 450SL",17.3,8,275.8,180,3.07,3.73,17.6,0,0,3,3
"Merc 450SLC",15.2,8,275.8,180,3.07,3.78,18,0,0,3,3
"Cadillac Fleetwood",10.4,8,472,205,2.93,5.25,17.98,0,0,3,4
"Lincoln Continental",10.4,8,460,215,3,5.424,17.82,0,0,3,4
"Chrysler Imperial",14.7,8,440,230,3.23,5.345,17.42,0,0,3,4
"Fiat 128",32.4,4,78.7,66,4.08,2.2,19.47,1,1,4,1
"Honda Civic",30.4,4,75.7,52,4.93,1.615,18.52,1,1,4,2
"Toyota Corolla",33.9,4,71.1,65,4.22,1.835,19.9,1,1,4,1
"Toyota Corona",21.5,4,120.1,97,3.7,2.465,20.01,1,0,3,1
"Dodge Challenger",15.5,8,318,150,2.76,3.52,16.87,0,0,3,2
"AMC Javelin",15.2,8,304,150,3.15,3.435,17.3,0,0,3,2
"Camaro Z28",13.3,8,350,245,3.73,3.84,15.41,0,0,3,4
"Pontiac Firebird",19.2,8,400,175,3.08,3.845,17.05,0,0,3,2
"Fiat X1-9",27.3,4,79,66,4.08,1.935,18.9,1,1,4,1
"Porsche 914-2",26,4,120.3,91,4.43,2.14,16.7,0,1,5,2
"Lotus Europa",30.4,4,95.1,113,3.77,1.513,16.9,1,1,5,2
"Ford Pantera L",15.8,8,351,264,4.22,3.17,14.5,0,1,5,4
"Ferrari Dino",19.7,6,145,175,3.62,2.77,15.5,0,1,5,6
"Maserati Bora",15,8,301,335,3.54,3.57,14.6,0,1,5,8
"Volvo 142E",21.4,4,121,109,4.11,2.78,18.6,1,1,4,2`;
    
    return readRDataset(csvData, {
      isString: true,
      rowNames: true
    });
  },
  
  /**
   * Load the diamonds dataset (prices and attributes of ~54,000 diamonds)
   * @returns {Promise<DataFrame>}
   * 
   * @example
   * const diamonds = await RDatasets.diamonds();
   * const model = lm(diamonds.data.price, [diamonds.data.carat, diamonds.data.depth]);
   */
  async diamonds() {
    const url = 'https://raw.githubusercontent.com/tidyverse/ggplot2/main/data-raw/diamonds.csv';
    try {
      const response = await fetch(url);
      const text = await response.text();
      return readRDataset(text, {
        isString: true,
        factorColumns: ['cut', 'color', 'clarity'],
        stringsAsFactors: true
      });
    } catch (error) {
      throw new Error(`Failed to load diamonds dataset: ${error.message}`);
    }
  },
  
  /**
   * Load the mpg dataset (fuel economy data from 1999-2008)
   * 234 cars with manufacturer, model, engine, and fuel economy data
   * @returns {Promise<DataFrame>}
   * 
   * @example
   * const mpg = await RDatasets.mpg();
   * const grouped = mpg.groupBy('manufacturer').summarize({ avg_hwy: row => mean(row.hwy) });
   */
  async mpg() {
    const url = 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/mpg.csv';
    const response = await fetch(url);
    const text = await response.text();
    return readRDataset(text, {
      isString: true,
      factorColumns: ['manufacturer', 'model', 'trans', 'drv', 'fl', 'class'],
      stringsAsFactors: false // Explicitly set since we're specifying factor columns
    });
  },
  
  /**
   * Load the penguins dataset (Palmer Archipelago penguins)
   * 344 penguins with species, island, and body measurements
   * @returns {Promise<DataFrame>}
   * 
   * @example
   * const penguins = await RDatasets.penguins();
   * const result = t_test(penguins.data.bill_length_mm, null, { mu: 40 });
   */
  async penguins() {
    const url = 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/penguins.csv';
    const response = await fetch(url);
    const text = await response.text();
    return readRDataset(text, {
      isString: true,
      factorColumns: ['species', 'island', 'sex'],
      naStrings: ['NA', '', 'NaN', 'null']
    });
  },
  
  /**
   * Load the titanic dataset (Titanic passenger survival data)
   * @returns {Promise<DataFrame>}
   * 
   * @example
   * const titanic = await RDatasets.titanic();
   * const survived = titanic.filter(row => row.survived === 1);
   */
  async titanic() {
    const url = 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/titanic.csv';
    const response = await fetch(url);
    const text = await response.text();
    return readRDataset(text, {
      isString: true,
      factorColumns: ['sex', 'embarked', 'class', 'who', 'deck', 'embark_town', 'alive'],
      stringsAsFactors: false
    });
  },
  
  /**
   * Load a custom R dataset from a URL
   * Provides full control over R-specific parsing options
   * 
   * @param {string} url - URL to CSV file
   * @param {Object} options - Same options as readRDataset
   * @returns {Promise<DataFrame>}
   * 
   * @example
   * // Load custom dataset with specific factor columns
   * const myData = await RDatasets.fromURL('https://example.com/data.csv', {
   *   factorColumns: ['treatment', 'group'],
   *   rowNames: true,
   *   naStrings: ['NA', 'missing', '-']
   * });
   */
  async fromURL(url, options = {}) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset from ${url}: ${response.statusText}`);
    }
    const text = await response.text();
    return readRDataset(text, { ...options, isString: true });
  }
};

/**
 * Helper function to extract unique non-null levels from a column
 * @param {Array} column - Column data
 * @returns {Array<string>} - Sorted unique levels
 */
function getUniqueLevels(column) {
  const uniqueSet = new Set();
  
  for (const val of column) {
    if (val !== null && val !== undefined) {
      uniqueSet.add(String(val));
    }
  }
  
  // Sort levels alphabetically (R default behavior)
  return Array.from(uniqueSet).sort();
}

/**
 * Utility: Convert R data types to aleatory types
 * Useful for understanding R dataset structure
 * 
 * @param {string} rType - R type name (e.g., 'numeric', 'factor', 'character')
 * @returns {string} - Aleatory type ('numeric', 'factor', 'string')
 */
export function convertRType(rType) {
  const typeMap = {
    'numeric': 'numeric',
    'integer': 'numeric',
    'double': 'numeric',
    'factor': 'factor',
    'ordered': 'factor',
    'character': 'string',
    'logical': 'boolean'
  };
  
  return typeMap[rType.toLowerCase()] || 'string';
}

/**
 * Utility: Detect if a CSV file follows R conventions
 * Checks for row names and R-style NA values
 * 
 * @param {string} csvContent - CSV file content
 * @returns {Object} - Detection results { hasRowNames, hasNAValues, suggestedOptions }
 * 
 * @example
 * const content = fs.readFileSync('data.csv', 'utf-8');
 * const info = detectRFormat(content);
 * if (info.hasRowNames) {
 *   df = readRDataset('data.csv', { rowNames: true });
 * }
 */
export function detectRFormat(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    return { hasRowNames: false, hasNAValues: false, suggestedOptions: {} };
  }
  
  // Check header for empty first column (indicates row names)
  const headerLine = lines[0];
  const hasEmptyFirstCol = headerLine.startsWith(',') || headerLine.startsWith('""');
  
  // Check for NA values in data
  const dataContent = lines.slice(1).join(' ');
  const hasNAValues = /\bNA\b/.test(dataContent);
  
  // Build suggested options
  const suggestedOptions = {};
  if (hasEmptyFirstCol) {
    suggestedOptions.rowNames = true;
  }
  if (hasNAValues) {
    suggestedOptions.naStrings = ['NA', '', 'NaN'];
  }
  
  return {
    hasRowNames: hasEmptyFirstCol,
    hasNAValues: hasNAValues,
    suggestedOptions: suggestedOptions
  };
}

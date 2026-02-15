/**
 * Pipe and chainable operations for DataFrames
 * 
 * Enables functional composition of DataFrame operations
 */

/**
 * Apply a sequence of functions to a DataFrame
 * @param {DataFrame} df - Input DataFrame
 * @param {...Function} fns - Functions to apply in sequence
 * @returns {DataFrame} Result after applying all functions
 */
export function pipe(df, ...fns) {
  return fns.reduce((result, fn) => fn(result), df);
}

/**
 * Create a chainable wrapper for DataFrame operations
 * @param {DataFrame} df - Input DataFrame
 * @returns {ChainableDataFrame} Chainable wrapper
 */
export function chain(df) {
  return new ChainableDataFrame(df);
}

/**
 * ChainableDataFrame - Wrapper that makes all DataFrame operations chainable
 */
class ChainableDataFrame {
  constructor(df) {
    this._df = df;
  }
  
  /**
   * Get the underlying DataFrame
   */
  value() {
    return this._df;
  }
  
  /**
   * Chainable select
   */
  select(...cols) {
    this._df = this._df.select(...cols);
    return this;
  }
  
  /**
   * Chainable filter
   */
  filter(predicate) {
    this._df = this._df.filter(predicate);
    return this;
  }
  
  /**
   * Chainable mutate
   */
  mutate(expressions) {
    this._df = this._df.mutate(expressions);
    return this;
  }
  
  /**
   * Chainable arrange
   */
  arrange(cols, options) {
    this._df = this._df.arrange(cols, options);
    return this;
  }
  
  /**
   * Chainable rename
   */
  rename(mapping) {
    this._df = this._df.rename(mapping);
    return this;
  }
  
  /**
   * Chainable head
   */
  head(n = 6) {
    this._df = this._df.head(n);
    return this;
  }
  
  /**
   * Chainable tail
   */
  tail(n = 6) {
    this._df = this._df.tail(n);
    return this;
  }
  
  /**
   * Apply custom function
   */
  then(fn) {
    this._df = fn(this._df);
    return this;
  }
  
  /**
   * Group by
   */
  groupBy(...cols) {
    return this._df.groupBy(...cols);
  }
}

export default { pipe, chain };

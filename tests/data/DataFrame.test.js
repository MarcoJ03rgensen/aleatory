/**
 * Tests for DataFrame and data manipulation operations
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import DataFrame from '../../src/data/DataFrame.js';
import Factor from '../../src/core/Factor.js';
import { pivotLonger, pivotWider, separate, unite, dropNA, fillNA } from '../../src/data/reshape.js';
import { innerJoin, leftJoin, rightJoin, fullJoin, antiJoin, semiJoin, bindRows, bindCols } from '../../src/data/joins.js';
import { readCSV, writeCSV, readJSON, writeJSON } from '../../src/data/io.js';

describe('DataFrame', () => {
  describe('Constructor and Basic Operations', () => {
    it('creates DataFrame from object', () => {
      const df = new DataFrame({
        x: [1, 2, 3],
        y: [4, 5, 6]
      });
      
      assert.equal(df.nrow, 3, 'should have 3 rows');
      assert.equal(df.ncol, 2, 'should have 2 columns');
      assert.deepEqual(df.names, ['x', 'y'], 'should have correct column names');
    });
    
    it('creates empty DataFrame', () => {
      const df = new DataFrame();
      
      assert.equal(df.nrow, 0);
      assert.equal(df.ncol, 0);
    });
    
    it('gets column', () => {
      const df = new DataFrame({ x: [1, 2, 3] });
      const col = df.col('x');
      
      assert.equal(col.length, 3);
      assert.equal(col.at(0), 1);
    });

    it('preserves numeric type for low-cardinality numeric arrays', () => {
      const df = new DataFrame({ small: [6, 6, 4, 6] });
      const col = df.col('small');

      // should remain a numeric Vector (not a Factor) and preserve values
      assert.ok(!(col instanceof Factor));
      assert.equal(col.type, 'numeric');
      assert.deepEqual(df.colArray('small'), [6, 6, 4, 6]);
    });
    
    it('gets row', () => {
      const df = new DataFrame({
        x: [1, 2, 3],
        y: ['a', 'b', 'c']
      });
      
      const row = df.row(1);
      assert.equal(row.x, 2);
      assert.equal(row.y, 'b');
    });
    
    it('throws error for non-existent column', () => {
      const df = new DataFrame({ x: [1, 2, 3] });
      
      assert.throws(
        () => df.col('y'),
        /Column 'y' not found/
      );
    });
  });
  
  describe('Selection and Filtering', () => {
    const df = new DataFrame({
      id: [1, 2, 3, 4, 5],
      name: ['A', 'B', 'C', 'D', 'E'],
      value: [10, 20, 30, 40, 50]
    });
    
    it('selects columns', () => {
      const result = df.select('id', 'value');
      
      assert.equal(result.ncol, 2);
      assert.deepEqual(result.names, ['id', 'value']);
      assert.equal(result.nrow, 5);
    });
    
    it('filters rows', () => {
      const result = df.filter(row => row.value > 25);
      
      assert.equal(result.nrow, 3);
      assert.deepEqual(result.colArray('id'), [3, 4, 5]);
    });
    
    it('slices by indices', () => {
      const result = df.slice([0, 2, 4]);
      
      assert.equal(result.nrow, 3);
      assert.deepEqual(result.colArray('id'), [1, 3, 5]);
    });
    
    it('gets head', () => {
      const result = df.head(3);
      
      assert.equal(result.nrow, 3);
      assert.deepEqual(result.colArray('id'), [1, 2, 3]);
    });
    
    it('gets tail', () => {
      const result = df.tail(2);
      
      assert.equal(result.nrow, 2);
      assert.deepEqual(result.colArray('id'), [4, 5]);
    });
  });
  
  describe('Transformation', () => {
    it('mutates with function', () => {
      const df = new DataFrame({
        x: [1, 2, 3],
        y: [4, 5, 6]
      });
      
      const result = df.mutate({
        z: row => row.x + row.y
      });
      
      assert.equal(result.ncol, 3);
      assert.deepEqual(result.colArray('z'), [5, 7, 9]);
    });
    
    it('mutates with array', () => {
      const df = new DataFrame({ x: [1, 2, 3] });
      const result = df.mutate({ y: [10, 20, 30] });
      
      assert.deepEqual(result.colArray('y'), [10, 20, 30]);
    });
    
    it('mutates with scalar', () => {
      const df = new DataFrame({ x: [1, 2, 3] });
      const result = df.mutate({ y: 42 });
      
      assert.deepEqual(result.colArray('y'), [42, 42, 42]);
    });
    
    it('renames columns', () => {
      const df = new DataFrame({ x: [1, 2, 3], y: [4, 5, 6] });
      const result = df.rename({ x: 'a', y: 'b' });
      
      assert.deepEqual(result.names, ['a', 'b']);
    });
    
    it('arranges by column', () => {
      const df = new DataFrame({
        x: [3, 1, 2],
        y: ['c', 'a', 'b']
      });
      
      const result = df.arrange('x');
      assert.deepEqual(result.colArray('x'), [1, 2, 3]);
      assert.deepEqual(result.colArray('y'), ['a', 'b', 'c']);
    });
    
    it('arranges descending', () => {
      const df = new DataFrame({ x: [1, 3, 2] });
      const result = df.arrange('x', { decreasing: true });
      
      assert.deepEqual(result.colArray('x'), [3, 2, 1]);
    });
  });

  describe('Grouping and Aggregation', () => {
    const df = new DataFrame({
      group: ['A', 'A', 'B', 'B', 'B'],
      value: [1, 2, 3, 4, 5]
    });

    it('groups by column', () => {
      const grouped = df.groupBy('group');

      assert.equal(grouped.ngroups, 2);
    });

    it('summarizes grouped data', () => {
      const result = df.groupBy('group').summarize({
        mean: g => g.col('value').mean(),
        count: g => g.nrow
      });

      assert.equal(result.nrow, 2);
      assert.deepEqual(result.colArray('group'), ['A', 'B']);
      assert.deepEqual(result.colArray('mean'), [1.5, 4]);
      assert.deepEqual(result.colArray('count'), [2, 3]);
    });

    it('groups by multiple columns', () => {
      const df2 = new DataFrame({
        g1: ['A', 'A', 'B', 'B'],
        g2: ['X', 'Y', 'X', 'Y'],
        val: [1, 2, 3, 4]
      });

      const result = df2.groupBy('g1', 'g2').summarize({
        sum: g => g.col('val').sum()
      });

      assert.equal(result.nrow, 4);
    });
  });

  describe('Conversion Methods', () => {
    it('converts to array', () => {
      const df = new DataFrame({
        x: [1, 2, 3],
        y: ['a', 'b', 'c']
      });

      const arr = df.toArray();
      assert.equal(arr.length, 3);
      assert.deepEqual(arr[0], { x: 1, y: 'a' });
    });

    it('converts to object', () => {
      const df = new DataFrame({
        x: [1, 2, 3],
        y: ['a', 'b', 'c']
      });

      const obj = df.toObject();
      assert.deepEqual(obj.x, [1, 2, 3]);
      assert.deepEqual(obj.y, ['a', 'b', 'c']);
    });

    it('creates from objects', () => {
      const data = [
        { x: 1, y: 'a' },
        { x: 2, y: 'b' },
        { x: 3, y: 'c' }
      ];

      const df = DataFrame.fromObjects(data);
      assert.equal(df.nrow, 3);
      assert.equal(df.ncol, 2);
    });
  });

  describe('Reshaping Operations', () => {
    it('pivots longer', () => {
      const wide = new DataFrame({
        id: [1, 2],
        x: [10, 20],
        y: [30, 40]
      });

      const long = pivotLonger(wide, ['x', 'y']);

      assert.equal(long.nrow, 4);
      assert.deepEqual(long.colArray('id'), [1, 1, 2, 2]);
      assert.deepEqual(long.colArray('name'), ['x', 'y', 'x', 'y']);
      assert.deepEqual(long.colArray('value'), [10, 30, 20, 40]);
    });

    it('pivots wider', () => {
      const long = new DataFrame({
        id: [1, 1, 2, 2],
        name: ['x', 'y', 'x', 'y'],
        value: [10, 30, 20, 40]
      });

      const wide = pivotWider(long, {
        names_from: 'name',
        values_from: 'value'
      });

      assert.equal(wide.nrow, 2);
      assert.deepEqual(wide.colArray('x'), [10, 20]);
      assert.deepEqual(wide.colArray('y'), [30, 40]);
    });

    it('separates column', () => {
      const df = new DataFrame({
        id: [1, 2],
        name: ['John Doe', 'Jane Smith']
      });

      const result = separate(df, 'name', ['first', 'last'], { sep: ' ' });

      assert.equal(result.ncol, 3);
      assert.deepEqual(result.colArray('first'), ['John', 'Jane']);
      assert.deepEqual(result.colArray('last'), ['Doe', 'Smith']);
    });

    it('unites columns', () => {
      const df = new DataFrame({
        first: ['John', 'Jane'],
        last: ['Doe', 'Smith']
      });

      const result = unite(df, 'name', ['first', 'last'], { sep: ' ' });

      assert.equal(result.ncol, 1);
      assert.deepEqual(result.colArray('name'), ['John Doe', 'Jane Smith']);
    });

    it('drops NA', () => {
      const df = new DataFrame({
        x: [1, 2, null, 4],
        y: [5, null, 7, 8]
      });

      const result = dropNA(df);
      assert.equal(result.nrow, 2); // Only rows 0 and 3
    });

    it('fills NA', () => {
      const df = new DataFrame({
        x: [1, null, 3]
      });

      const result = fillNA(df, { x: 0 });
      assert.deepEqual(result.colArray('x'), [1, 0, 3]);
    });
  });
  
  describe('Join Operations', () => {
    const left = new DataFrame({
      id: [1, 2, 3],
      x: ['a', 'b', 'c']
    });
    
    const right = new DataFrame({
      id: [2, 3, 4],
      y: ['d', 'e', 'f']
    });
    
    it('inner join', () => {
      const result = innerJoin(left, right, { by: 'id' });
      
      assert.equal(result.nrow, 2);
      assert.deepEqual(result.colArray('id'), [2, 3]);
      assert.deepEqual(result.colArray('x'), ['b', 'c']);
      assert.deepEqual(result.colArray('y'), ['d', 'e']);
    });
    
    it('left join', () => {
      const result = leftJoin(left, right, { by: 'id' });
      
      assert.equal(result.nrow, 3);
      assert.deepEqual(result.colArray('id'), [1, 2, 3]);
      assert.equal(result.row(0).y, null); // No match for id=1
    });
    
    it('right join', () => {
      const result = rightJoin(left, right, { by: 'id' });
      
      assert.equal(result.nrow, 3);
      assert.deepEqual(result.colArray('id'), [2, 3, 4]);
    });
    
    it('full join', () => {
      const result = fullJoin(left, right, { by: 'id' });
      
      assert.equal(result.nrow, 4);
      assert.deepEqual(result.colArray('id'), [1, 2, 3, 4]);
    });
    
    it('anti join', () => {
      const result = antiJoin(left, right, { by: 'id' });
      
      assert.equal(result.nrow, 1);
      assert.deepEqual(result.colArray('id'), [1]);
    });
    
    it('semi join', () => {
      const result = semiJoin(left, right, { by: 'id' });
      
      assert.equal(result.nrow, 2);
      assert.deepEqual(result.colArray('id'), [2, 3]);
      assert.equal(result.ncol, 2); // No columns from right
    });
    
    it('binds rows', () => {
      const df1 = new DataFrame({ x: [1, 2] });
      const df2 = new DataFrame({ x: [3, 4] });
      
      const result = bindRows(df1, df2);
      
      assert.equal(result.nrow, 4);
      assert.deepEqual(result.colArray('x'), [1, 2, 3, 4]);
    });
    
    it('binds columns', () => {
      const df1 = new DataFrame({ x: [1, 2] });
      const df2 = new DataFrame({ y: [3, 4] });
      
      const result = bindCols(df1, df2);
      
      assert.equal(result.nrow, 2);
      assert.equal(result.ncol, 2);
    });
  });
  
  describe('I/O Operations', () => {
    it('reads CSV string', () => {
      const csv = `x,y
1,a
2,b
3,c`;
      const df = readCSV(csv, { isString: true });
            console.log('DEBUG[reads CSV string] df.names=', df.names, 'nrow=', df.nrow);      assert.equal(df.nrow, 3);
      assert.equal(df.ncol, 2);
      assert.deepEqual(df.names, ['x', 'y']);
    });
    
    it('writes CSV string', () => {
      const df = new DataFrame({
        x: [1, 2, 3],
        y: ['a', 'b', 'c']
      });
      
      const csv = writeCSV(df, null);
      
      assert.ok(csv.includes('x,y'));
      assert.ok(csv.includes('1'));
    });
    
    it('reads JSON string (records)', () => {
      const json = '[{\"x\":1,\"y\":\"a\"},{\"x\":2,\"y\":\"b\"}]';
      const df = readJSON(json, { isString: true });
      
      assert.equal(df.nrow, 2);
      assert.equal(df.ncol, 2);
    });
    
    it('writes JSON string (records)', () => {
      const df = new DataFrame({
        x: [1, 2],
        y: ['a', 'b']
      });
      
      const json = writeJSON(df, null);
      const data = JSON.parse(json);
      
      assert.equal(data.length, 2);
      assert.equal(data[0].x, 1);
    });
    
    it('reads JSON columns format', () => {
      const json = '{\"x\":[1,2],\"y\":[\"a\",\"b\"]}';
      const df = readJSON(json, { isString: true, orient: 'columns' });
      
      assert.equal(df.nrow, 2);
      assert.deepEqual(df.colArray('x'), [1, 2]);
    });
  });
});

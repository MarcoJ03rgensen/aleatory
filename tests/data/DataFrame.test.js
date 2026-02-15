/**
 * Tests for DataFrame and data manipulation operations
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import DataFrame from '../../src/data/DataFrame.js';
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
      
      assert.equal(col.length(), 3);
      assert.equal(col.at(0), 1);
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
      const result = df.arrange('x', { decreasing: true });\n      \n      assert.deepEqual(result.colArray('x'), [3, 2, 1]);\n    });\n  });\n  \n  describe('Grouping and Aggregation', () => {\n    const df = new DataFrame({\n      group: ['A', 'A', 'B', 'B', 'B'],\n      value: [1, 2, 3, 4, 5]\n    });\n    \n    it('groups by column', () => {\n      const grouped = df.groupBy('group');\n      \n      assert.equal(grouped.ngroups, 2);\n    });\n    \n    it('summarizes grouped data', () => {\n      const result = df.groupBy('group').summarize({\n        mean: g => g.col('value').mean(),\n        count: g => g.nrow\n      });\n      \n      assert.equal(result.nrow, 2);\n      assert.deepEqual(result.colArray('group'), ['A', 'B']);\n      assert.deepEqual(result.colArray('mean'), [1.5, 4]);\n      assert.deepEqual(result.colArray('count'), [2, 3]);\n    });\n    \n    it('groups by multiple columns', () => {\n      const df2 = new DataFrame({\n        g1: ['A', 'A', 'B', 'B'],\n        g2: ['X', 'Y', 'X', 'Y'],\n        val: [1, 2, 3, 4]\n      });\n      \n      const result = df2.groupBy('g1', 'g2').summarize({\n        sum: g => g.col('val').sum()\n      });\n      \n      assert.equal(result.nrow, 4);\n    });\n  });\n  \n  describe('Conversion Methods', () => {\n    it('converts to array', () => {\n      const df = new DataFrame({\n        x: [1, 2, 3],\n        y: ['a', 'b', 'c']\n      });\n      \n      const arr = df.toArray();\n      assert.equal(arr.length, 3);\n      assert.deepEqual(arr[0], { x: 1, y: 'a' });\n    });\n    \n    it('converts to object', () => {\n      const df = new DataFrame({\n        x: [1, 2, 3],\n        y: ['a', 'b', 'c']\n      });\n      \n      const obj = df.toObject();\n      assert.deepEqual(obj.x, [1, 2, 3]);\n      assert.deepEqual(obj.y, ['a', 'b', 'c']);\n    });\n    \n    it('creates from objects', () => {\n      const data = [\n        { x: 1, y: 'a' },\n        { x: 2, y: 'b' },\n        { x: 3, y: 'c' }\n      ];\n      \n      const df = DataFrame.fromObjects(data);\n      assert.equal(df.nrow, 3);\n      assert.equal(df.ncol, 2);\n    });\n  });\n  \n  describe('Reshaping Operations', () => {\n    it('pivots longer', () => {\n      const wide = new DataFrame({\n        id: [1, 2],\n        x: [10, 20],\n        y: [30, 40]\n      });\n      \n      const long = pivotLonger(wide, ['x', 'y']);\n      \n      assert.equal(long.nrow, 4);\n      assert.deepEqual(long.colArray('id'), [1, 1, 2, 2]);\n      assert.deepEqual(long.colArray('name'), ['x', 'y', 'x', 'y']);\n      assert.deepEqual(long.colArray('value'), [10, 30, 20, 40]);\n    });\n    \n    it('pivots wider', () => {\n      const long = new DataFrame({\n        id: [1, 1, 2, 2],\n        name: ['x', 'y', 'x', 'y'],\n        value: [10, 30, 20, 40]\n      });\n      \n      const wide = pivotWider(long, {\n        names_from: 'name',\n        values_from: 'value'\n      });\n      \n      assert.equal(wide.nrow, 2);\n      assert.deepEqual(wide.colArray('x'), [10, 20]);\n      assert.deepEqual(wide.colArray('y'), [30, 40]);\n    });\n    \n    it('separates column', () => {\n      const df = new DataFrame({\n        id: [1, 2],\n        name: ['John Doe', 'Jane Smith']\n      });\n      \n      const result = separate(df, 'name', ['first', 'last'], { sep: ' ' });\n      \n      assert.equal(result.ncol, 3);\n      assert.deepEqual(result.colArray('first'), ['John', 'Jane']);\n      assert.deepEqual(result.colArray('last'), ['Doe', 'Smith']);\n    });\n    \n    it('unites columns', () => {\n      const df = new DataFrame({\n        first: ['John', 'Jane'],\n        last: ['Doe', 'Smith']\n      });\n      \n      const result = unite(df, 'name', ['first', 'last'], { sep: ' ' });\n      \n      assert.equal(result.ncol, 1);\n      assert.deepEqual(result.colArray('name'), ['John Doe', 'Jane Smith']);\n    });\n    \n    it('drops NA', () => {\n      const df = new DataFrame({\n        x: [1, 2, null, 4],\n        y: [5, null, 7, 8]\n      });\n      \n      const result = dropNA(df);\n      assert.equal(result.nrow, 2); // Only rows 0 and 3\n    });\n    \n    it('fills NA', () => {\n      const df = new DataFrame({\n        x: [1, null, 3]\n      });\n      \n      const result = fillNA(df, { x: 0 });\n      assert.deepEqual(result.colArray('x'), [1, 0, 3]);\n    });\n  });\n  \n  describe('Join Operations', () => {\n    const left = new DataFrame({\n      id: [1, 2, 3],\n      x: ['a', 'b', 'c']\n    });\n    \n    const right = new DataFrame({\n      id: [2, 3, 4],\n      y: ['d', 'e', 'f']\n    });\n    \n    it('inner join', () => {\n      const result = innerJoin(left, right, { by: 'id' });\n      \n      assert.equal(result.nrow, 2);\n      assert.deepEqual(result.colArray('id'), [2, 3]);\n      assert.deepEqual(result.colArray('x'), ['b', 'c']);\n      assert.deepEqual(result.colArray('y'), ['d', 'e']);\n    });\n    \n    it('left join', () => {\n      const result = leftJoin(left, right, { by: 'id' });\n      \n      assert.equal(result.nrow, 3);\n      assert.deepEqual(result.colArray('id'), [1, 2, 3]);\n      assert.equal(result.row(0).y, null); // No match for id=1\n    });\n    \n    it('right join', () => {\n      const result = rightJoin(left, right, { by: 'id' });\n      \n      assert.equal(result.nrow, 3);\n      assert.deepEqual(result.colArray('id'), [2, 3, 4]);\n    });\n    \n    it('full join', () => {\n      const result = fullJoin(left, right, { by: 'id' });\n      \n      assert.equal(result.nrow, 4);\n      assert.deepEqual(result.colArray('id'), [1, 2, 3, 4]);\n    });\n    \n    it('anti join', () => {\n      const result = antiJoin(left, right, { by: 'id' });\n      \n      assert.equal(result.nrow, 1);\n      assert.deepEqual(result.colArray('id'), [1]);\n    });\n    \n    it('semi join', () => {\n      const result = semiJoin(left, right, { by: 'id' });\n      \n      assert.equal(result.nrow, 2);\n      assert.deepEqual(result.colArray('id'), [2, 3]);\n      assert.equal(result.ncol, 2); // No columns from right\n    });\n    \n    it('binds rows', () => {\n      const df1 = new DataFrame({ x: [1, 2] });\n      const df2 = new DataFrame({ x: [3, 4] });\n      \n      const result = bindRows(df1, df2);\n      \n      assert.equal(result.nrow, 4);\n      assert.deepEqual(result.colArray('x'), [1, 2, 3, 4]);\n    });\n    \n    it('binds columns', () => {\n      const df1 = new DataFrame({ x: [1, 2] });\n      const df2 = new DataFrame({ y: [3, 4] });\n      \n      const result = bindCols(df1, df2);\n      \n      assert.equal(result.nrow, 2);\n      assert.equal(result.ncol, 2);\n    });\n  });\n  \n  describe('I/O Operations', () => {\n    it('reads CSV string', () => {\n      const csv = 'x,y\\n1,a\\n2,b\\n3,c';\n      const df = readCSV(csv, { isString: true });\n      \n      assert.equal(df.nrow, 3);\n      assert.equal(df.ncol, 2);\n      assert.deepEqual(df.names, ['x', 'y']);\n    });\n    \n    it('writes CSV string', () => {\n      const df = new DataFrame({\n        x: [1, 2, 3],\n        y: ['a', 'b', 'c']\n      });\n      \n      const csv = writeCSV(df, null);\n      \n      assert.ok(csv.includes('x,y'));\n      assert.ok(csv.includes('1'));\n    });\n    \n    it('reads JSON string (records)', () => {\n      const json = '[{\"x\":1,\"y\":\"a\"},{\"x\":2,\"y\":\"b\"}]';\n      const df = readJSON(json, { isString: true });\n      \n      assert.equal(df.nrow, 2);\n      assert.equal(df.ncol, 2);\n    });\n    \n    it('writes JSON string (records)', () => {\n      const df = new DataFrame({\n        x: [1, 2],\n        y: ['a', 'b']\n      });\n      \n      const json = writeJSON(df, null);\n      const data = JSON.parse(json);\n      \n      assert.equal(data.length, 2);\n      assert.equal(data[0].x, 1);\n    });\n    \n    it('reads JSON columns format', () => {\n      const json = '{\"x\":[1,2],\"y\":[\"a\",\"b\"]}';\n      const df = readJSON(json, { isString: true, orient: 'columns' });\n      \n      assert.equal(df.nrow, 2);\n      assert.deepEqual(df.colArray('x'), [1, 2]);\n    });\n  });\n});

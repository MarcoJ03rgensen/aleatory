/**
 * Tests for DataFrame
 * 
 * Golden-fixture tests validated against R/tidyverse behavior
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import DataFrame from '../../src/data/DataFrame.js';
import Vector from '../../src/core/Vector.js';
import Factor from '../../src/core/Factor.js';

describe('DataFrame', () => {
  describe('Construction', () => {
    it('should create empty DataFrame', () => {
      const df = new DataFrame();
      assert.strictEqual(df.nrow, 0);
      assert.strictEqual(df.ncol, 0);
    });
    
    it('should create DataFrame from arrays', () => {
      const df = new DataFrame({
        x: [1, 2, 3],
        y: [4, 5, 6]
      });
      
      assert.strictEqual(df.nrow, 3);
      assert.strictEqual(df.ncol, 2);
      assert.deepStrictEqual(df.names, ['x', 'y']);
    });
    
    it('should create DataFrame from Vectors', () => {
      const df = new DataFrame({
        x: new Vector([1, 2, 3]),
        y: new Vector([4, 5, 6])
      });
      
      assert.strictEqual(df.nrow, 3);
      assert.strictEqual(df.ncol, 2);
    });
    
    it('should detect categorical data', () => {
      const df = new DataFrame({
        group: ['A', 'B', 'A', 'B', 'A']
      });
      
      const col = df.col('group');
      assert.ok(col instanceof Factor);
    });
    
    it('should create from objects', () => {
      const data = [
        { x: 1, y: 'A' },
        { x: 2, y: 'B' },
        { x: 3, y: 'C' }
      ];
      
      const df = DataFrame.fromObjects(data);
      assert.strictEqual(df.nrow, 3);
      assert.strictEqual(df.ncol, 2);
      assert.deepStrictEqual(df.colArray('x'), [1, 2, 3]);
    });
  });
  
  describe('Selection', () => {
    it('should select columns', () => {
      const df = new DataFrame({
        x: [1, 2, 3],
        y: [4, 5, 6],
        z: [7, 8, 9]
      });
      
      const selected = df.select('x', 'z');
      assert.strictEqual(selected.ncol, 2);
      assert.deepStrictEqual(selected.names, ['x', 'z']);
    });
    
    it('should get row as object', () => {
      const df = new DataFrame({
        x: [1, 2, 3],
        y: ['A', 'B', 'C']
      });
      
      const row = df.row(1);
      assert.deepStrictEqual(row, { x: 2, y: 'B' });
    });
    
    it('should slice by indices', () => {
      const df = new DataFrame({
        x: [1, 2, 3, 4, 5]
      });
      
      const sliced = df.slice([0, 2, 4]);
      assert.strictEqual(sliced.nrow, 3);
      assert.deepStrictEqual(sliced.colArray('x'), [1, 3, 5]);
    });
    
    it('should get head and tail', () => {
      const df = new DataFrame({
        x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      });
      
      const head = df.head(3);
      assert.strictEqual(head.nrow, 3);
      assert.deepStrictEqual(head.colArray('x'), [1, 2, 3]);
      
      const tail = df.tail(3);
      assert.strictEqual(tail.nrow, 3);
      assert.deepStrictEqual(tail.colArray('x'), [8, 9, 10]);
    });
  });
  
  describe('Filtering', () => {
    it('should filter rows', () => {
      const df = new DataFrame({
        x: [1, 2, 3, 4, 5],
        y: ['A', 'B', 'A', 'B', 'A']
      });
      
      const filtered = df.filter(row => row.x > 2);
      assert.strictEqual(filtered.nrow, 3);
      assert.deepStrictEqual(filtered.colArray('x'), [3, 4, 5]);
    });
    
    it('should filter with complex conditions', () => {
      const df = new DataFrame({
        x: [1, 2, 3, 4, 5],
        y: [10, 20, 30, 40, 50]
      });
      
      const filtered = df.filter(row => row.x > 2 && row.y < 45);
      assert.strictEqual(filtered.nrow, 2);
      assert.deepStrictEqual(filtered.colArray('x'), [3, 4]);
    });
  });
  
  describe('Mutation', () => {
    it('should mutate with functions', () => {
      const df = new DataFrame({
        x: [1, 2, 3]
      });
      
      const mutated = df.mutate({
        x_squared: row => row.x * row.x
      });
      
      assert.strictEqual(mutated.ncol, 2);
      assert.deepStrictEqual(mutated.colArray('x_squared'), [1, 4, 9]);
    });
    
    it('should mutate with scalars', () => {
      const df = new DataFrame({
        x: [1, 2, 3]
      });
      
      const mutated = df.mutate({
        group: 'A'
      });
      
      assert.deepStrictEqual(mutated.colArray('group'), ['A', 'A', 'A']);
    });
    
    it('should mutate with arrays', () => {
      const df = new DataFrame({
        x: [1, 2, 3]
      });
      
      const mutated = df.mutate({
        y: [10, 20, 30]
      });
      
      assert.deepStrictEqual(mutated.colArray('y'), [10, 20, 30]);
    });
    
    it('should overwrite existing columns', () => {
      const df = new DataFrame({
        x: [1, 2, 3]
      });
      
      const mutated = df.mutate({
        x: row => row.x * 2
      });
      
      assert.deepStrictEqual(mutated.colArray('x'), [2, 4, 6]);
    });
  });
  
  describe('Sorting', () => {
    it('should sort by single column', () => {
      const df = new DataFrame({
        x: [3, 1, 2]
      });
      
      const sorted = df.arrange('x');
      assert.deepStrictEqual(sorted.colArray('x'), [1, 2, 3]);
    });
    
    it('should sort in decreasing order', () => {
      const df = new DataFrame({
        x: [1, 3, 2]
      });
      
      const sorted = df.arrange('x', { decreasing: true });
      assert.deepStrictEqual(sorted.colArray('x'), [3, 2, 1]);
    });
    
    it('should sort by multiple columns', () => {
      const df = new DataFrame({
        x: [1, 2, 1, 2],
        y: [2, 1, 1, 2]
      });
      
      const sorted = df.arrange(['x', 'y']);
      assert.deepStrictEqual(sorted.colArray('x'), [1, 1, 2, 2]);
      assert.deepStrictEqual(sorted.colArray('y'), [1, 2, 1, 2]);
    });
  });
  
  describe('Grouping', () => {
    it('should group by single column', () => {
      const df = new DataFrame({
        group: ['A', 'B', 'A', 'B'],
        value: [1, 2, 3, 4]
      });
      
      const grouped = df.groupBy('group');
      assert.strictEqual(grouped.ngroups, 2);
    });
    
    it('should summarize groups', () => {
      const df = new DataFrame({
        group: ['A', 'B', 'A', 'B'],
        value: [1, 2, 3, 4]
      });
      
      const summary = df.groupBy('group').summarize({
        mean_value: gdf => {
          const vals = gdf.colArray('value');
          return vals.reduce((a, b) => a + b, 0) / vals.length;
        },
        count: gdf => gdf.nrow
      });
      
      assert.strictEqual(summary.nrow, 2);
      assert.deepStrictEqual(summary.colArray('group'), ['A', 'B']);
      assert.deepStrictEqual(summary.colArray('mean_value'), [2, 3]);
      assert.deepStrictEqual(summary.colArray('count'), [2, 2]);
    });
    
    it('should group by multiple columns', () => {
      const df = new DataFrame({
        x: ['A', 'A', 'B', 'B'],
        y: ['X', 'Y', 'X', 'Y'],
        value: [1, 2, 3, 4]
      });
      
      const grouped = df.groupBy('x', 'y');
      assert.strictEqual(grouped.ngroups, 4);
    });
  });
  
  describe('Renaming', () => {
    it('should rename columns', () => {
      const df = new DataFrame({
        old_name: [1, 2, 3]
      });
      
      const renamed = df.rename({ old_name: 'new_name' });
      assert.deepStrictEqual(renamed.names, ['new_name']);
    });
    
    it('should keep unrenamed columns', () => {
      const df = new DataFrame({
        x: [1, 2, 3],
        y: [4, 5, 6]
      });
      
      const renamed = df.rename({ x: 'a' });
      assert.deepStrictEqual(renamed.names, ['a', 'y']);
    });
  });
  
  describe('Conversion', () => {
    it('should convert to array of objects', () => {
      const df = new DataFrame({
        x: [1, 2],
        y: ['A', 'B']
      });
      
      const arr = df.toArray();
      assert.deepStrictEqual(arr, [
        { x: 1, y: 'A' },
        { x: 2, y: 'B' }
      ]);
    });
    
    it('should convert to plain object', () => {
      const df = new DataFrame({
        x: [1, 2],
        y: [3, 4]
      });
      
      const obj = df.toObject();
      assert.deepStrictEqual(obj, {
        x: [1, 2],
        y: [3, 4]
      });
    });
  });
});

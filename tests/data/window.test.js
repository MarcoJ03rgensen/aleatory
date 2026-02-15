/**
 * Tests for Window Functions
 * 
 * Validates SQL-style analytical functions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import DataFrame from '../../src/data/DataFrame.js';
import { row_number, rank, lag, lead, cumsum, cummean, first, last } from '../../src/data/window.js';

describe('Window Functions', () => {
  describe('row_number', () => {
    it('should number rows without grouping', () => {
      const df = new DataFrame({
        x: [10, 20, 30]
      });
      
      const rn = row_number(df);
      assert.deepStrictEqual(rn, [1, 2, 3]);
    });
    
    it('should number rows within groups', () => {
      const df = new DataFrame({
        group: ['A', 'A', 'B', 'B'],
        value: [1, 2, 3, 4]
      });
      
      const rn = row_number(df, ['group']);
      assert.deepStrictEqual(rn, [1, 2, 1, 2]);
    });
  });
  
  describe('rank', () => {
    it('should rank values', () => {
      const df = new DataFrame({
        x: [10, 30, 20, 40]
      });
      
      const r = rank(df, 'x');
      assert.deepStrictEqual(r, [1, 3, 2, 4]);
    });
    
    it('should handle ties with average rank', () => {
      const df = new DataFrame({
        x: [10, 20, 20, 30]
      });
      
      const r = rank(df, 'x');
      assert.deepStrictEqual(r, [1, 2.5, 2.5, 4]);
    });
    
    it('should rank in decreasing order', () => {
      const df = new DataFrame({
        x: [10, 30, 20, 40]
      });
      
      const r = rank(df, 'x', [], true);
      assert.deepStrictEqual(r, [4, 2, 3, 1]);
    });
    
    it('should rank within groups', () => {
      const df = new DataFrame({
        group: ['A', 'A', 'B', 'B'],
        value: [10, 30, 20, 40]
      });
      
      const r = rank(df, 'value', ['group']);
      assert.deepStrictEqual(r, [1, 2, 1, 2]);
    });
  });
  
  describe('lag', () => {
    it('should lag by 1', () => {
      const df = new DataFrame({
        x: [10, 20, 30, 40]
      });
      
      const lagged = lag(df, 'x');
      assert.deepStrictEqual(lagged, [null, 10, 20, 30]);
    });
    
    it('should lag by n', () => {
      const df = new DataFrame({
        x: [10, 20, 30, 40, 50]
      });
      
      const lagged = lag(df, 'x', 2);
      assert.deepStrictEqual(lagged, [null, null, 10, 20, 30]);
    });
    
    it('should lag with custom fill', () => {
      const df = new DataFrame({
        x: [10, 20, 30]
      });
      
      const lagged = lag(df, 'x', 1, 0);
      assert.deepStrictEqual(lagged, [0, 10, 20]);
    });
    
    it('should lag within groups', () => {
      const df = new DataFrame({
        group: ['A', 'A', 'B', 'B'],
        value: [10, 20, 30, 40]
      });
      
      const lagged = lag(df, 'value', 1, null, ['group']);
      assert.deepStrictEqual(lagged, [null, 10, null, 30]);
    });
  });
  
  describe('lead', () => {
    it('should lead by 1', () => {
      const df = new DataFrame({
        x: [10, 20, 30, 40]
      });
      
      const led = lead(df, 'x');
      assert.deepStrictEqual(led, [20, 30, 40, null]);
    });
    
    it('should lead by n', () => {
      const df = new DataFrame({
        x: [10, 20, 30, 40, 50]
      });
      
      const led = lead(df, 'x', 2);
      assert.deepStrictEqual(led, [30, 40, 50, null, null]);
    });
    
    it('should lead within groups', () => {
      const df = new DataFrame({
        group: ['A', 'A', 'B', 'B'],
        value: [10, 20, 30, 40]
      });
      
      const led = lead(df, 'value', 1, null, ['group']);
      assert.deepStrictEqual(led, [20, null, 40, null]);
    });
  });
  
  describe('cumsum', () => {
    it('should compute cumulative sum', () => {
      const df = new DataFrame({
        x: [1, 2, 3, 4]
      });
      
      const cs = cumsum(df, 'x');
      assert.deepStrictEqual(cs, [1, 3, 6, 10]);
    });
    
    it('should handle nulls in cumsum', () => {
      const df = new DataFrame({
        x: [1, null, 3, 4]
      });
      
      const cs = cumsum(df, 'x');
      assert.deepStrictEqual(cs, [1, 1, 4, 8]);
    });
    
    it('should compute cumsum within groups', () => {
      const df = new DataFrame({
        group: ['A', 'A', 'B', 'B'],
        value: [1, 2, 3, 4]
      });
      
      const cs = cumsum(df, 'value', ['group']);
      assert.deepStrictEqual(cs, [1, 3, 3, 7]);
    });
  });
  
  describe('cummean', () => {
    it('should compute cumulative mean', () => {
      const df = new DataFrame({
        x: [1, 2, 3, 4]
      });
      
      const cm = cummean(df, 'x');
      assert.deepStrictEqual(cm, [1, 1.5, 2, 2.5]);
    });
    
    it('should compute cummean within groups', () => {
      const df = new DataFrame({
        group: ['A', 'A', 'B', 'B'],
        value: [2, 4, 6, 8]
      });
      
      const cm = cummean(df, 'value', ['group']);
      assert.deepStrictEqual(cm, [2, 3, 6, 7]);
    });
  });
  
  describe('first and last', () => {
    it('should get first value', () => {
      const df = new DataFrame({
        x: [10, 20, 30]
      });
      
      const f = first(df, 'x');
      assert.deepStrictEqual(f, [10, 10, 10]);
    });
    
    it('should get last value', () => {
      const df = new DataFrame({
        x: [10, 20, 30]
      });
      
      const l = last(df, 'x');
      assert.deepStrictEqual(l, [30, 30, 30]);
    });
    
    it('should get first within groups', () => {
      const df = new DataFrame({
        group: ['A', 'A', 'B', 'B'],
        value: [10, 20, 30, 40]
      });
      
      const f = first(df, 'value', ['group']);
      assert.deepStrictEqual(f, [10, 10, 30, 30]);
    });
    
    it('should get last within groups', () => {
      const df = new DataFrame({
        group: ['A', 'A', 'B', 'B'],
        value: [10, 20, 30, 40]
      });
      
      const l = last(df, 'value', ['group']);
      assert.deepStrictEqual(l, [20, 20, 40, 40]);
    });
  });
});

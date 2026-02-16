/**
 * Tests for R dataset compatibility module
 */

import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import { readRDataset, writeRDataset, detectRFormat, convertRType, RDatasets } from '../../src/data/r_datasets.js';
import Factor from '../../src/core/Factor.js';

describe('R Datasets Compatibility', () => {
  
  describe('readRDataset()', () => {
    
    it('should read CSV with R-style row names', () => {
      const csv = `"",x,y,z\n1,10,20,30\n2,40,50,60`;
      const df = readRDataset(csv, { isString: true, rowNames: true });
      
      assert.equal(df.ncol, 3);
      assert.equal(df.nrow, 2);
      assert.deepEqual(df.names, ['x', 'y', 'z']);
      assert.deepEqual(df.data.x, [10, 40]);
    });
    
    it('should handle NA values correctly', () => {
      const csv = `x,y,z\n10,NA,30\n40,50,NaN\n70,,90`;
      const df = readRDataset(csv, { 
        isString: true, 
        naStrings: ['NA', 'NaN', ''] 
      });
      
      assert.equal(df.data.y[0], null);
      assert.equal(df.data.z[1], null);
      assert.equal(df.data.z[2], 90);
    });
    
    it('should convert specified columns to factors', () => {
      const csv = `species,sepal_length\nsetosa,5.1\nversicolor,6.2\nsetosa,4.9`;
      const df = readRDataset(csv, { 
        isString: true,
        factorColumns: ['species'],
        levels: { species: ['setosa', 'versicolor', 'virginica'] }
      });
      
      assert.ok(df.data.species instanceof Factor);
      assert.equal(df.data.species.nlevels(), 3);
      assert.deepEqual(df.data.species.levels, ['setosa', 'versicolor', 'virginica']);
    });
    
    it('should auto-convert string columns to factors when stringsAsFactors=true', () => {
      const csv = `name,age,city\nAlice,25,NYC\nBob,30,LA\nCharlie,35,NYC`;
      const df = readRDataset(csv, { 
        isString: true,
        stringsAsFactors: true 
      });
      
      assert.ok(df.data.name instanceof Factor);
      assert.ok(df.data.city instanceof Factor);
      assert.equal(df.data.city.nlevels(), 2);
    });
    
    it('should handle mixed NA strings', () => {
      const csv = `x,y\nNA,1\nnull,2\nNULL,3\n,4\n5,5`;
      const df = readRDataset(csv, { 
        isString: true,
        naStrings: ['NA', 'null', 'NULL', '']
      });
      
      assert.equal(df.data.x[0], null);
      assert.equal(df.data.x[1], null);
      assert.equal(df.data.x[2], null);
      assert.equal(df.data.x[3], null);
      assert.equal(df.data.x[4], 5);
    });
    
    it('should preserve numeric columns', () => {
      const csv = `a,b,c\n1.5,2.7,3.9\n4.1,5.3,6.5`;
      const df = readRDataset(csv, { isString: true });
      
      assert.equal(typeof df.data.a[0], 'number');
      assert.equal(df.data.a[0], 1.5);
      assert.equal(df.data.c[1], 6.5);
    });
  });
  
  describe('writeRDataset()', () => {
    
    it('should write CSV with R-style row names', () => {
      const csv = `x,y\n10,20\n30,40`;
      const df = readRDataset(csv, { isString: true });
      
      const output = writeRDataset(df, null, { rowNames: true });
      
      assert.ok(output.includes(',x,y'));
      assert.ok(output.includes('1,10'));
      assert.ok(output.includes('2,30'));
    });
    
    it('should write NA for null values', () => {
      const csv = `x,y\n10,NA\nNA,40`;
      const df = readRDataset(csv, { isString: true });
      
      const output = writeRDataset(df, null, { rowNames: false, na: 'NA' });
      
      assert.ok(output.includes(',NA'));
      assert.ok(output.includes('NA,'));
    });
    
    it('should format numbers with specified digits', () => {
      const csv = `x\n1.23456789\n2.98765432`;
      const df = readRDataset(csv, { isString: true });
      
      const output = writeRDataset(df, null, { rowNames: false, digits: 2 });
      
      assert.ok(output.includes('1.23'));
      assert.ok(output.includes('2.99'));
    });
    
    it('should handle custom NA string', () => {
      const csv = `x,y\n10,NA\nNA,40`;
      const df = readRDataset(csv, { isString: true });
      
      const output = writeRDataset(df, null, { na: 'MISSING' });
      
      assert.ok(output.includes('MISSING'));
      assert.ok(!output.includes(',NA'));
    });
  });
  
  describe('detectRFormat()', () => {
    
    it('should detect row names', () => {
      const csv = `"",x,y\n1,10,20\n2,30,40`;
      const info = detectRFormat(csv);
      
      assert.equal(info.hasRowNames, true);
      assert.equal(info.suggestedOptions.rowNames, true);
    });
    
    it('should detect NA values', () => {
      const csv = `x,y\n10,NA\n20,30`;
      const info = detectRFormat(csv);
      
      assert.equal(info.hasNAValues, true);
      assert.ok(info.suggestedOptions.naStrings);
    });
    
    it('should detect both row names and NA values', () => {
      const csv = `"",x,y\n1,10,NA\n2,NA,40`;
      const info = detectRFormat(csv);
      
      assert.equal(info.hasRowNames, true);
      assert.equal(info.hasNAValues, true);
    });
    
    it('should return false for standard CSV', () => {
      const csv = `x,y,z\n10,20,30\n40,50,60`;
      const info = detectRFormat(csv);
      
      assert.equal(info.hasRowNames, false);
      assert.equal(info.hasNAValues, false);
    });
  });
  
  describe('convertRType()', () => {
    
    it('should convert R numeric types', () => {
      assert.equal(convertRType('numeric'), 'numeric');
      assert.equal(convertRType('integer'), 'numeric');
      assert.equal(convertRType('double'), 'numeric');
    });
    
    it('should convert R factor types', () => {
      assert.equal(convertRType('factor'), 'factor');
      assert.equal(convertRType('ordered'), 'factor');
    });
    
    it('should convert R character type', () => {
      assert.equal(convertRType('character'), 'string');
    });
    
    it('should convert R logical type', () => {
      assert.equal(convertRType('logical'), 'boolean');
    });
    
    it('should handle unknown types', () => {
      assert.equal(convertRType('unknown'), 'string');
    });
    
    it('should be case-insensitive', () => {
      assert.equal(convertRType('NUMERIC'), 'numeric');
      assert.equal(convertRType('Factor'), 'factor');
    });
  });
  
  describe('RDatasets.mtcars()', () => {
    
    it('should load mtcars dataset', async () => {
      const mtcars = await RDatasets.mtcars();
      
      assert.ok(mtcars);
      assert.equal(mtcars.nrow, 32);
      assert.ok(mtcars.names.includes('mpg'));
      assert.ok(mtcars.names.includes('cyl'));
      assert.ok(mtcars.names.includes('hp'));
    });
    
    it('should have correct data types', async () => {
      const mtcars = await RDatasets.mtcars();
      
      // All columns should be numeric
      assert.equal(typeof mtcars.data.mpg[0], 'number');
      assert.equal(typeof mtcars.data.hp[0], 'number');
    });
    
    it('should have correct Mazda RX4 values', async () => {
      const mtcars = await RDatasets.mtcars();
      
      // First row is Mazda RX4
      assert.equal(mtcars.data.mpg[0], 21);
      assert.equal(mtcars.data.cyl[0], 6);
      assert.equal(mtcars.data.hp[0], 110);
    });
  });
  
  describe('RDatasets.iris()', () => {
    
    it('should load iris dataset', async () => {
      const iris = await RDatasets.iris();
      
      assert.ok(iris);
      assert.equal(iris.nrow, 150);
      assert.ok(iris.names.includes('sepal_length'));
      assert.ok(iris.names.includes('species'));
    });
    
    it('should have species as factor', async () => {
      const iris = await RDatasets.iris();
      
      assert.ok(iris.data.species instanceof Factor);
      assert.equal(iris.data.species.nlevels(), 3);
    });
    
    it('should have correct species distribution', async () => {
      const iris = await RDatasets.iris();
      
      const counts = {};
      for (let i = 0; i < iris.data.species.length; i++) {
        const species = iris.data.species.get(i);
        counts[species] = (counts[species] || 0) + 1;
      }
      
      // Each species should have 50 observations
      assert.equal(counts['setosa'], 50);
      assert.equal(counts['versicolor'], 50);
      assert.equal(counts['virginica'], 50);
    });
  });
  
  describe('Integration: Round-trip conversion', () => {
    
    it('should preserve data through read-write cycle', () => {
      const originalCSV = `x,y,z\n1.5,2.7,3.9\n4.1,NA,6.5`;
      
      // Read
      const df = readRDataset(originalCSV, { isString: true });
      
      // Write
      const outputCSV = writeRDataset(df, null, { rowNames: false });
      
      // Read again
      const df2 = readRDataset(outputCSV, { isString: true });
      
      // Compare
      assert.deepEqual(df.names, df2.names);
      assert.equal(df.nrow, df2.nrow);
      assert.equal(df.data.x[0], df2.data.x[0]);
      assert.equal(df.data.y[1], df2.data.y[1]); // Both should be null
    });
    
    it('should preserve factors through round-trip', () => {
      const csv = `species,value\nsetosa,5.1\nversicolor,6.2`;
      
      const df = readRDataset(csv, { 
        isString: true,
        factorColumns: ['species']
      });
      
      const outputCSV = writeRDataset(df, null, { rowNames: false });
      
      const df2 = readRDataset(outputCSV, { 
        isString: true,
        factorColumns: ['species']
      });
      
      assert.ok(df2.data.species instanceof Factor);
      assert.equal(df2.data.species.get(0), 'setosa');
    });
  });
});

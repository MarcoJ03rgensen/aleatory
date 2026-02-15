/**
 * Import verification test - diagnose what's failing
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Import Verification', () => {
  it('should import DataFrame', async () => {
    const { default: DataFrame } = await import('../../src/data/DataFrame.js');
    assert.ok(DataFrame, 'DataFrame should be defined');
    
    const df = new DataFrame({ x: [1, 2, 3] });
    assert.equal(df.nrow, 3);
  });
  
  it('should import window functions', async () => {
    const window = await import('../../src/data/window.js');
    assert.ok(window.lag, 'lag should be defined');
    assert.ok(window.lead, 'lead should be defined');
    assert.ok(window.rank, 'rank should be defined');
    assert.ok(window.cumsum, 'cumsum should be defined');
  });
  
  it('should import pipe functions', async () => {
    const pipe = await import('../../src/data/pipe.js');
    assert.ok(pipe.pipe, 'pipe should be defined');
    assert.ok(pipe.chain, 'chain should be defined');
  });
  
  it('should import reshape functions', async () => {
    const reshape = await import('../../src/data/reshape.js');
    assert.ok(reshape.pivotLonger, 'pivotLonger should be defined');
    assert.ok(reshape.pivotWider, 'pivotWider should be defined');
  });
  
  it('should import join functions', async () => {
    const joins = await import('../../src/data/joins.js');
    assert.ok(joins.innerJoin, 'innerJoin should be defined');
    assert.ok(joins.leftJoin, 'leftJoin should be defined');
  });
  
  it('should import io functions', async () => {
    const io = await import('../../src/data/io.js');
    assert.ok(io.readCSV, 'readCSV should be defined');
    assert.ok(io.writeCSV, 'writeCSV should be defined');
  });
});

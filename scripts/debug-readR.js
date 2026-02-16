import { readRDataset } from '../src/data/r_datasets.js';

const csv = `x,y,z
10,NA,30
40,50,NaN
70,,90`;
const df = readRDataset(csv, { isString: true, naStrings: ['NA','NaN',''] });
console.log('toObject:', JSON.stringify(df.toObject(), null, 2));
console.log('data.y instanceof Array?', Array.isArray(df.data.y));
console.log('data.y:', df.data.y);
console.log('data.y[0] === null?', df.data.y[0] === null);
console.log('data.y[0] === undefined?', df.data.y[0] === undefined);

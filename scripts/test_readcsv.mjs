import { readCSV } from '../src/data/io.js';
const csv = 'x,y\n1,a\n2,b\n3,c';
const df = readCSV(csv, { isString: true });
console.log('nrow =', df.nrow, 'ncol =', df.ncol, 'names =', df.names);
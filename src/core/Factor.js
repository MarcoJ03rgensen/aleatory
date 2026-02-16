// src/core/Factor.js
// Minimal categorical vector (Factor) with NA support.

export default class Factor {
  /**
   * @param {Array} values
   * @param {{levels?: Array}} opts
   */
  constructor(values, opts = {}) {
    const arr = Array.from(values ?? []);
    this.length = arr.length;

    const providedLevels = Array.isArray(opts.levels) ? opts.levels.map(String) : null;

    // Map level -> code
    const levelMap = new Map();
    if (providedLevels) {
      for (let i = 0; i < providedLevels.length; i++) {
        levelMap.set(providedLevels[i], i);
      }
    } else {
      for (const v of arr) {
        if (v === null || v === undefined) continue;
        const key = String(v);
        if (!levelMap.has(key)) levelMap.set(key, levelMap.size);
      }
    }

    this.levels = Array.from(levelMap.keys());
    this.codes = new Int32Array(this.length);
    this.na_mask = new Uint8Array(this.length);

    for (let i = 0; i < this.length; i++) {
      const v = arr[i];
      if (v === null || v === undefined) {
        this.na_mask[i] = 1;
        this.codes[i] = -1;
        continue;
      }

      const key = String(v);
      const code = levelMap.get(key);
      if (code === undefined) {
        // Value not in provided levels: treat as NA for now (strict mode).
        this.na_mask[i] = 1;
        this.codes[i] = -1;
      } else {
        this.na_mask[i] = 0;
        this.codes[i] = code;
      }
    }
  }

  isNA(i) {
    return this.na_mask[i] === 1;
  }

  get(i) {
    return this.isNA(i) ? null : this.levels[this.codes[i]];
  }

  nlevels() {
    return this.levels.length;
  }

  toArray() {
    const out = new Array(this.length);
    for (let i = 0; i < this.length; i++) out[i] = this.get(i);
    return out;
  }

  toString() {
    return `Factor(${this.length}) with ${this.nlevels()} levels`;
  }
}

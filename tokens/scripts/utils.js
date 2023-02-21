const fs = require("fs");
const path = require("path");

module.exports = {
  isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  },
  
  mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
  
    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
  
    return this.mergeDeep(target, ...sources);
  },
  
  indexOfFirst(str, ...arr) {
    let min = -1;
    for (const char of arr) {
      const i = str.indexOf(char);
      if (i > -1 && (i < min || min == -1)) min = i;
    }
    return min;
  },
  
  removeQuotes(str) {
    return str.replace(/"|'/g, "");
  },
  
  getIndexOfClosingScope(str, openChar, closingChar) {
    let i = 0;
    let open = 0;
    for (const char of str) {
      if (char === openChar) open++;
      if (char === closingChar) open--;
      if (open === 0) return i;
      i++;
    }
    return -1;
  },

  get (object, path, value) {
    const pathArray = Array.isArray(path) ? path : path.split('.').filter(key => key)
    const pathArrayFlat = pathArray.flatMap(part => typeof part === 'string' ? part.split('.') : part)
  
    return pathArrayFlat.reduce((obj, key) => obj && obj[key], object) || value
  },

  yellow(...args) {
    return args.map(a => `\x1b[33m${a}\x1b[0m`).join(' ')
  },

  red(...args) {
    return args.map(a => `\x1b[31m${a}\x1b[0m`).join(' ')
  },

  green(...args) {
    return args.map(a => `\x1b[32m${a}\x1b[0m`).join(' ')
  },

  log(...args) {
    console.log(this.yellow('[dsm]'), ...args)
  },

  throw(...args) {
    console.error(this.red(this.yellow('[dsm]'), '❌', ...args))
    process.exit(1)
  },

  getCompositons(themeObj) {
    const findComposInObj = (obj) => {
      const compos = [];
  
      for (const val of Object.values(obj)) {
        if (val.type === "composition") {
          compos.push(val);
        }
        else if (this.isObject(val)) {
          compos.push(...findComposInObj(val));
        }
      }
  
      return compos;
    }
  
    return findComposInObj(themeObj);
  },
  
  tryEval(str) {
    try {
      return eval(str);
    }
    catch {
      return null;
    }
  },

  readdirRecursive(dir) {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    const files = dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? this.readdirRecursive(res) : res;
    });
    return Array.prototype.concat(...files);
  },
}
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
  
}
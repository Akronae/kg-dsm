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

  get(object, path, value) {
    const pathArray = Array.isArray(path)
      ? path
      : path.split(".").filter((key) => key);
    const pathArrayFlat = pathArray.flatMap((part) =>
      typeof part === "string" ? part.split(".") : part
    );

    return pathArrayFlat.reduce((obj, key) => obj && obj[key], object) || value;
  },

  set(obj, path, value) {
    if (Object(obj) !== obj) return obj;
    if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || [];
    path
      .slice(0, -1)
      .reduce(
        (a, c, i) =>
          Object(a[c]) === a[c]
            ? a[c]
            : (a[c] = Math.abs(path[i + 1]) >> 0 === +path[i + 1] ? [] : {}),
        obj
      )[path[path.length - 1]] = value;
    return obj;
  },

  yellow(...args) {
    return args.map((a) => `\x1b[33m${a}\x1b[0m`).join(" ");
  },

  red(...args) {
    return args.map((a) => `\x1b[31m${a}\x1b[0m`).join(" ");
  },

  green(...args) {
    return args.map((a) => `\x1b[32m${a}\x1b[0m`).join(" ");
  },

  gray(...args) {
    return args.map((a) => `\x1b[90m${a}\x1b[0m`).join(" ");
  },

  log(...args) {
    console.log(this.yellow("[dsm]"), ...args);
  },

  throw(...args) {
    console.error(this.red(this.yellow("[dsm]"), "❌", ...args));
    process.exit(1);
  },

  /**
   * @template T
   * @param {Obj} obj
   * @param {function({key: string, value: any, path: string}): T} callback
   * @returns {T[]}
   */
  mapForEachEntry(obj, callback) {
    const res = [];

    const recursive = (obj, callback, path) => {
      for (const [key, value] of Object.entries(obj)) {
        if (this.isObject(value)) {
          recursive(value, callback, [path, key].filter((e) => !!e).join("."));
        } else res.push(callback({ key, value, path }));
      }
    };
    recursive(obj, callback, "");

    return res;
  },

  /**
   * @param {object} themeObj
   * @returns {Array<{ compo: object, path: string }>}
   */
  getCompositons(themeObj) {
    const findComposInObj = (obj, basepath) => {
      const compos = [];

      for (const [key, val] of Object.entries(obj)) {
        const path = [basepath, key].filter((e) => !!e).join(".");

        if (val.type === "composition") {
          compos.push({ compo: val, path });
        } else if (this.isObject(val)) {
          compos.push(...findComposInObj(val, path));
        }
      }

      return compos;
    };

    return findComposInObj(themeObj);
  },

  tryEval(str) {
    try {
      return eval(str);
    } catch {
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
};

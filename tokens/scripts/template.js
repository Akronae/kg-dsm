const fs = require("fs");

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

function indexOfFirst(str, ...arr) {
  let min = -1;
  for (const char of arr) {
    const i = str.indexOf(char);
    if (i > -1 && (i < min || min == -1)) min = i;
  }
  return min;
}

function appendToBuds(obj, val, path = []) {
  if (JSON.stringify(obj) === "{}") return val;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value == "object") {
      if (JSON.stringify(value) === "{}") {
        const pathes = [...path, key];
        let replaceVal = JSON.stringify(val);
        const currPathQueries = {};
        for (const p of ctx.path) {
          if (p.name) {
            currPathQueries[p.name] = pathes[ctx.path.indexOf(p)];
          }
        }
        const currPathJsCtx = Object.entries(currPathQueries)
          .map(([key, value]) => `const ${key} = '${value}'`)
          .join(";");
        for (const match of replaceVal.matchAll(/{{(.*?)}}/g)) {
          replaceVal = replaceVal.replaceAll(
            match[0],
            eval(`${currPathJsCtx}; ${match[1]}`)
          );
        }
        obj[key] = JSON.parse(replaceVal);
      } else {
        appendToBuds(value, val, [...path, key]);
      }
    }
  }

  return obj;
}

function removeQuotes(str) {
  return str.replace(/"|'/g, "");
}

function getIndexOfClosingScope(str, openChar, closingChar) {
  let i = 0;
  let open = 0;
  for (const char of str) {
    if (char === openChar) open++;
    if (char === closingChar) open--;
    if (open === 0) return i;
    i++;
  }
  return -1;
}

//////////////////////////////////////////////////////////////////////////////////////////////////

const filepath = process.argv[2];
let tree = fs.readFileSync(filepath, "utf8");
const comments = tree.match(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm);

const res = {};
const ctx = {
  path: [],
};

let i = 0;

while (tree) {
  if (i++ > 1000) {
    throw new Error("Infinite loop");
  }

  tree = tree.trim();

  if (tree.startsWith("//")) {
    tree = tree.substring(tree.indexOf("\n") + 1);
    continue;
  }

  let eat = "";
  if (tree.startsWith("[")) {
    eat = tree.substring(0, getIndexOfClosingScope(tree, '[', "]") + 1);
  } else {
    eat = tree.substring(0, indexOfFirst(tree, ".", "["));
  }
  tree = tree.substring(eat.length).trim();

  if (!eat) break;

  let parsed = {};

  eat = eat.trim();
  if (eat.startsWith("[")) {
    eat = eat.substring(1, eat.length - 1).trim();

    if (eat.startsWith("{") && eat.endsWith("}")) {
      parsed = JSON.parse(eat);
      ctx.path.push({ value: parsed });
    } else {
      const reg = eat.match(/^[a-zA-Z0-9]+/);
      const name = reg?.[0];
      if (name) eat = eat.substring(eat.indexOf(":") + 1);
      const args = eat.split("|").map((arg) => removeQuotes(arg).trim());
      parsed = {};
      for (const arg of args) {
        parsed[arg] = {};
      }
      ctx.path.push({ name, value: Object.keys(parsed) });
    }
  } else {
    parsed[eat] = {};
    tree = tree.trim();
    if (tree.startsWith(".")) tree = tree.substring(1).trim();
    ctx.path.push({ value: eat });
  }

  Object.assign(res, appendToBuds(res, parsed));
}

console.log(JSON.stringify(res, null, 2));

const replacepathComment = comments.find((comment) =>
  comment.includes("@replacepath:")
);
const replacepath = replacepathComment.match(/@replacepath:(.*)/)[1].trim();

if (replacepath) {
  const replacefileContent = fs.readFileSync(replacepath, "utf8");
  const replacefileJSON = JSON.parse(replacefileContent);
  mergeDeep(replacefileJSON, res);
  fs.writeFileSync(replacepath, JSON.stringify(replacefileJSON, null, 2));
}

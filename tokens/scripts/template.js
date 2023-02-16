const fs = require('fs')

const filepath = process.argv[2];
let tree = fs.readFileSync(filepath, 'utf8')

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
    if (typeof value == 'object') {
      if (JSON.stringify(value) === "{}") {
        const pathes = [...path, key];
        let replaceVal = JSON.stringify(val);
        const currPathQueries = {}
        for (const p of ctx.path) {
          if (p.name) {
            currPathQueries[p.name] = pathes[ctx.path.indexOf(p)];
          }
        }
        const currPathJsCtx = Object.entries(currPathQueries).map(([key, value]) => `const ${key} = '${value}'`).join(";");
        for (const match of replaceVal.matchAll(/{{(.*?)}}/g)) {
          replaceVal = replaceVal.replaceAll(match[0], eval(`${currPathJsCtx}; ${match[1]}`));
        }
        obj[key] = JSON.parse(replaceVal);
      }
      else {
        appendToBuds(value, val, [...path, key]);
      }
    }
  }
  
  return obj;
}

function removeQuotes(str) {
  return str.replace(/"|'/g, "");
}

const res = {};
const ctx = {
  path: []
}

let i = 0;

while (tree) {
  if (i++ > 1000) {
    throw new Error("Infinite loop");
  }

  tree = tree.replaceAll("\n", "").trim();
  let eat = "";
  if (tree.startsWith("[")) {
    eat = tree.substring(0, indexOfFirst(tree, "]") + 1);
  } else {
    eat = tree.substring(0, indexOfFirst(tree, ".", "["));
  }
  tree = tree.substring(eat.length);

  if (!eat) break;

  let parsed = {};

  if (eat.startsWith("[")) {
    eat = eat.substring(1, eat.length - 1);

    if (eat.startsWith("{") && eat.endsWith("}")) {
      parsed = JSON.parse(eat);
      ctx.path.push({value: parsed})
    } else {
      const reg = eat.match(/^[a-zA-Z0-9]+/);
      const name = reg?.[0];
      if (name) eat = eat.substring(eat.indexOf(":") + 1);
      const args = eat.split("|").map((arg) => removeQuotes(arg).trim());
      parsed = {};
      for (const arg of args) {
        parsed[arg] = {};
      }
      ctx.path.push({name, value: Object.keys(parsed)});
    }
  } else {
    parsed[eat] = {};
    tree = tree.trim();
    if (tree.startsWith(".")) tree = tree.substring(1);
    ctx.path.push({value: eat})
  }

  Object.assign(res, appendToBuds(res, parsed));
}

console.log('./res.json', JSON.stringify(res, null, 2));
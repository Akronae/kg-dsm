const fs = require("fs");
const utils = require("./utils");
const templateParser = require("./template-parser");
const { set } = require("./utils");

function appendToBuds(tokens, obj, val, path = []) {
  if (JSON.stringify(obj) === "{}") return val;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value == "object") {
      if (JSON.stringify(value) === "{}") {
        const pathes = [...path, key];
        let replaceVal = JSON.stringify(val);
        const currPathQueries = {};
        const indexers = tokens
          .filter((t) => t.type == "property" || t.type == "indexer")
          .map((t) => t.value);
        for (const p of indexers) {
          if (p.name) currPathQueries[p.name] = pathes[indexers.indexOf(p)];
        }
        const currPathJsCtx = Object.entries(currPathQueries)
          .map(([key, value]) => `const ${key} = '${value}'`)
          .join(";");
        for (const match of replaceVal.matchAll(/<<(.*?)>>/g)) {
          replaceVal = replaceVal.replaceAll(
            match[0],
            eval(`${currPathJsCtx}; ${match[1]}`)
          );
        }

        obj[key] = JSON.parse(replaceVal);
        utils.mapForEachEntry(obj[key], ({ key: kkk, value, path }) => {
          if (value.toString().trim() == "undefined") {
            set(obj[key], [path, kkk].join('.'), undefined)
          }
        });
      } else {
        appendToBuds(tokens, value, val, [...path, key]);
      }
    }
  }

  return obj;
}

//////////////////////////////////////////////////////////////////////////////////////////////////

function generate(templatepath, options = { output: "fs" }) {
  let template = fs.readFileSync(templatepath, "utf8");
  const tokens = templateParser.parse(template);
  const res = {};

  for (const token of tokens) {
    if (token.type == "comment") continue;

    let parsed = null;
    if (token.type == "property") parsed = { [token.value]: {} };
    if (token.type == "object") parsed = token.value;
    if (token.type == "indexer") {
      parsed = {};
      for (const branch of token.value.branches) {
        parsed[branch] = {};
      }
    }

    Object.assign(res, appendToBuds(tokens, res, parsed));
  }

  if (!options.output == "stdout") console.log(JSON.stringify(res, null, 2));

  const replacepathComment = tokens
    .filter((t) => t.type == "comment")
    .map((t) => t.value)
    .find((comment) => comment.includes("@replacepath:"));
  const replacepath = replacepathComment.match(/@replacepath:(.*)/)[1].trim();

  if (replacepath && options.output == "fs") {
    const replacefileContent = fs.readFileSync(replacepath, "utf8");
    const replacefileJSON = JSON.parse(replacefileContent);
    utils.mergeDeep(replacefileJSON, res);
    fs.writeFileSync(replacepath, JSON.stringify(replacefileJSON, null, 2));
  }

  return res;
}

if (require.main == module) {
  if (!process.argv[2])
    throw new Error("Please provide a template path as argument");

  process.argv
    .slice(2)
    .forEach((templatepath) => generate(templatepath, { output: "fs" }));
}

module.exports = { generate };
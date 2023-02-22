const fs = require("fs");
const path = require("path");
const utils = require("./utils");
const templateParser = require("./template-parser");
const templateProc = require("./template-proc");

function regen(templatepath) {
  if (!fs.statSync(templatepath).isFile()) return;
  const templatecontent = fs.readFileSync(templatepath, "utf8");
  const tokens = templateParser.parse(templatecontent);
  let propsChain = [];
  for (const token of tokens) {
    if (token.type == "property") {
      propsChain.push(token.value);
    } else if (propsChain.length > 0) break;
  }

  const replacePath = tokens
    .find((t) => t.type == "comment" && t.value.includes("@replacepath:"))
    .value.replace("@replacepath:", "")
    .trim();
  const jsonPath = propsChain.join(".");
  const templateJson = JSON.parse(fs.readFileSync(replacePath, "utf8"));
  utils.set(templateJson, jsonPath, {});
  fs.writeFileSync(replacePath, JSON.stringify(templateJson, null, 2));
  utils.log("🚮 deleted", utils.yellow(jsonPath));

  templateProc.generate(templatepath, { silent: true });
  utils.log("✅ regenerated", utils.yellow(jsonPath));
}

if (require.main == module) {
  if (!process.argv[2])
    throw new Error("Please provide a template path as argument");

  process.argv.slice(2).forEach((templatepath) => {
    regen(templatepath);
  });
}

module.exports = { regen };

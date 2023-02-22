const utils = require("./utils");

function parse(template) {
  const tokens = [];

  let i = 0;

  while (template) {
    if (i++ > 10000) {
      throw new Error("Infinite loop");
    }

    template = template.trim();

    if (template.startsWith("//")) {
      tokens.push({
        type: "comment",
        value: template.substring(2, template.indexOf("\n")),
      });
      template = template.substring(template.indexOf("\n") + 1);
      continue;
    }

    let eat = "";
    if (template.startsWith("[")) {
      eat = template.substring(
        0,
        utils.getIndexOfClosingScope(template, "[", "]") + 1
      );
    } else {
      eat = template.substring(0, utils.indexOfFirst(template, ".", "["));
    }
    template = template.substring(eat.length).trim();

    if (!eat) break;

    let parsed = {};

    eat = eat.trim();
    if (eat.startsWith("[")) {
      eat = eat.substring(1, eat.length - 1).trim();

      if (eat.startsWith("{") && eat.endsWith("}")) {
        parsed = JSON.parse(eat);
        tokens.push({ type: "object", value: parsed });
      } else {
        const reg = eat.match(/^[a-zA-Z0-9]+/);
        const name = reg?.[0];
        if (name) eat = eat.substring(eat.indexOf(":") + 1);
        const args = eat
          .split("|")
          .map((arg) => utils.removeQuotes(arg).trim());
        parsed = {};
        for (const arg of args) {
          parsed[arg] = {};
        }
        tokens.push({
          type: "indexer",
          value: { name, branches: Object.keys(parsed) },
        });
      }
    } else {
      parsed[eat] = {};
      template = template.trim();
      if (template.startsWith(".")) template = template.substring(1).trim();
      tokens.push({ type: "property", value: eat });
    }
  }

  return tokens;
}

module.exports = {
  parse,
};

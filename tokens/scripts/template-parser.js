const utils = require("./utils");

/**
 * @param {string} content
 * @returns {Array<{ type: "comment" | "object" | "indexer" | "property", value: string | object }>}
 */
function parse(content) {
  const tokens = [];

  let i = 0;

  while (content) {
    if (i++ > 10000) {
      throw new Error("Infinite loop");
    }

    content = content.trim();

    if (content.startsWith("//")) {
      tokens.push({
        type: "comment",
        value: content.substring(2, content.indexOf("\n")),
      });
      content = content.substring(content.indexOf("\n") + 1);
      continue;
    }

    let eat = "";
    if (content.startsWith("[")) {
      eat = content.substring(
        0,
        utils.getIndexOfClosingScope(content, "[", "]") + 1
      );
    } else {
      eat = content.substring(0, utils.indexOfFirst(content, ".", "["));
    }
    content = content.substring(eat.length).trim();

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
      content = content.trim();
      if (content.startsWith(".")) content = content.substring(1).trim();
      tokens.push({ type: "property", value: eat });
    }
  }

  return tokens;
}

function getPropertyChain(tokens) {
  let propsChain = [];
  for (const token of tokens) {
    if (token.type == "property") {
      propsChain.push(token.value);
    } else if (propsChain.length > 0) break;
  }

  return propsChain;
}

module.exports = {
  parse,
  getPropertyChain,
};

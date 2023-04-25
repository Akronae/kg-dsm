const fs = require("fs");
const path = require("path");
const utils = require("./utils");
const templateParser = require("./template-parser");
const templateProc = require("./template-proc");
const extend = require("./extends");

/**
 * @param {stirng} templatepath
 */
function regen(templatepath) {
  if (!fs.statSync(templatepath).isFile()) return;

  utils.log(utils.gray("checking", templatepath));
  const templatecontent = fs.readFileSync(templatepath, "utf8");
  const tokens = templateParser.parse(templatecontent);
  const replacePath = tokens
    .find((t) => t.type == "comment" && t.value.includes("@replacepath:"))
    .value.replace("@replacepath:", "")
    .trim();
  const jsonPath = templateParser.getPropertyChain(tokens).join(".");
  const templateJson = JSON.parse(fs.readFileSync(replacePath, "utf8") || "{}");
  utils.set(templateJson, jsonPath, {});
  fs.writeFileSync(replacePath, JSON.stringify(templateJson, null, 2));
  utils.log("🚮 deleted", utils.yellow(jsonPath));

  templateProc.generate(templatepath, { output: "fs" });
  utils.log("✨ regenerated", utils.yellow(jsonPath));

  try {
    extend.extend(replacePath);
  } catch (e) {
    utils.log(utils.red("Error extending", replacePath));
    utils.log(e);
  }
}

/**
 * @param {string[]} templates
 */
function regenAll(templates) {
  const parsed = [];

  for (const template of templates) {
    if (!fs.statSync(template).isFile()) continue;
    utils.log(utils.gray("computing order of", template));

    const content = fs.readFileSync(template, "utf8");
    const proc = templateProc.generate(template, { output: "none" });
    const tokens = templateParser.parse(content);
    const propsPath = templateParser.getPropertyChain(tokens);
    const extendedComps = utils
      .mapForEachEntry(proc, (entry) => {
        if (entry.key == "description")
          return utils.tryEval(entry.value)?.extends;
      })
      .filter((e) => !!e);

    parsed.push({ path: template, tokens, propsPath, extendedComps });
  }

  for (const p of parsed) {
    const extendedTemplates = [];
    for (const comp of p.extendedComps) {
      const a = parsed
        .slice(0)
        .sort(
          (a, b) => b.propsPath.join(".").length - a.propsPath.join(".").length
        )
        .find((p) => comp.includes(p.propsPath.join(".")));

      if (a && !extendedTemplates.includes(a.path))
        extendedTemplates.push(a.path);
    }
    p.extendedTemplates = extendedTemplates;
    delete p.extendedComps;
  }

  const ordered = parsed.slice(0).sort((a, b) => {
    const isBase = a.extendedTemplates.includes(b.path)
      ? 1
      : b.extendedTemplates.includes(a.path)
      ? -1
      : 0;

    const isParent = a.propsPath.join(".").includes(b.propsPath.join("."))
      ? 1
      : b.propsPath.join(".").includes(a.propsPath.join("."))
      ? -1
      : 0;

    return isParent * 100000 + isBase * 1;
  });

  // JS .sort() is not checking every pairs against each other
  // so we need to double check it here.
  const doubleCheckOrder = () => {
    for (const o of ordered) {
      for (const oo of ordered) {
        if (o == oo) continue;

        if (o.extendedTemplates.includes(oo.path)) {
          if (ordered.indexOf(o) < ordered.indexOf(oo)) {
            utils.arrayElemMove(
              ordered,
              ordered.indexOf(o),
              ordered.indexOf(oo)
            );
            doubleCheckOrder();
          }
        }

        if (o.propsPath.join(".").includes(oo.propsPath.join("."))) {
          if (ordered.indexOf(o) < ordered.indexOf(oo)) {
            console.log("moving", o.path, "before", oo.path);
            utils.arrayElemMove(
              ordered,
              ordered.indexOf(o),
              ordered.indexOf(oo)
            );
            doubleCheckOrder();
          }
        }
      }
    }
  };
  doubleCheckOrder();

  console.log(
    "templates will be executed in this order:",
    ordered.map((o) => o.propsPath)
  );

  for (const { path } of ordered) {
    regen(path);
  }
}

if (require.main == module) {
  if (!process.argv[2])
    throw new Error("Please provide a template path as argument");

  regenAll(process.argv.slice(2));
}

module.exports = { regen, regenAll };

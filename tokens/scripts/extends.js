const fs = require("fs");
const path = require("path");
const { mergeDeep } = require("./utils");
const utils = require("./utils");

/**
 * @param {string} readpath
 */
function extend(readpath) {
  const toExtend = JSON.parse(fs.readFileSync(readpath, "utf8"));
  const extendCtx = {}
  const ctxFiles = utils.readdirRecursive(path.dirname(readpath)).filter((file) => file.endsWith(".json"));
  for (const file of ctxFiles) {
    const content = JSON.parse(fs.readFileSync(file, 'utf-8') || "{}")
    mergeDeep(extendCtx, content)
  }

  const compoWithExtend = utils
    .getCompositons(toExtend)
    .filter((res) => res.compo.description && eval(res.compo.description)?.extends);

  for (const res of compoWithExtend) {
    const compo = res.compo;
    const extendPath = eval(compo.description).extends;
    const extended = utils.get(extendCtx, extendPath);
    if (!extended) {
      console.error(compo);
      // this should be an errror, and the script should exit
      // yet, until we have a proper template dependency system tree, we just log it.
      console.error(utils.throw(
        utils.yellow(res.path),
        "extends",
        utils.yellow(extendPath),
        "which does not exist"
      ));
    }
    compo.value = utils.mergeDeep(
      JSON.parse(JSON.stringify(extended.value)),
      compo.value
    );
  }

  const res = JSON.stringify(toExtend, null, 2);

  fs.writeFileSync(readpath, res, "utf8");

  utils.log(
    utils.green(
      "✅ done extending",
      utils.yellow(compoWithExtend.length),
      "compositions"
    )
  );
}

if (require.main == module) {
  process.argv.slice(2).forEach((readpath) => {
    extend(readpath);
  });

  if (!process.argv[2]) throw new Error("No path provided");
}

module.exports = { extend };

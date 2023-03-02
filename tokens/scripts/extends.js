const fs = require("fs");
const utils = require("./utils");

/**
 * @param {string} readpath
 */
function extend(readpath) {
  const read = JSON.parse(fs.readFileSync(readpath, "utf8"));

  const compoWithExtend = utils
    .getCompositons(read)
    .filter((res) => res.compo.description && eval(res.compo.description)?.extends);

  for (const res of compoWithExtend) {
    const compo = res.compo;
    const extendPath = eval(compo.description).extends;
    const extended = utils.get(read, extendPath);
    if (!extended) {
      console.error(compo);
      throw utils.throw(
        utils.yellow(res.path),
        "extends",
        utils.yellow(extendPath),
        "which does not exist"
      );
    }
    compo.value = utils.mergeDeep(
      JSON.parse(JSON.stringify(extended.value)),
      compo.value
    );
  }

  const res = JSON.stringify(read, null, 2);

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

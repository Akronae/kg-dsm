const fs = require("fs");
const utils = require("./utils");

const readpath = process.argv[2];
if (!readpath) throw new Error("No path provided");
const read = JSON.parse(fs.readFileSync(readpath, "utf8"));

const compoWithExtend = utils
  .getCompositons(read)
  .filter((compo) => compo.description && eval(compo.description)?.extends);

for (const compo of compoWithExtend) {
  const extendPath = eval(compo.description).extends;
  const extended = utils.get(read, extendPath);
  if (!extended) {
    console.error(compo);
    throw utils.throw(
      "Composition extends",
      utils.yellow(extendPath),
      "but it does not exist"
    );
  }
  compo.value = utils.mergeDeep(JSON.parse(JSON.stringify(extended.value)), compo.value);
}

const res = JSON.stringify(read, null, 2);

fs.writeFileSync(readpath, res, "utf8");

utils.log(utils.green('✅ done extending', utils.yellow(compoWithExtend.length), 'compositions'))
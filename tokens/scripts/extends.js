const fs = require("fs");
const utils = require("./utils");

const readpath = process.argv[2];
if (!readpath)
  throw new Error("No path provided");
const read = JSON.parse(fs.readFileSync(readpath, "utf8"))

function getCompositons(themeObj) {
  const findComposInObj = (obj) => {
    const compos = [];

    for (const val of Object.values(obj)) {
      if (val.type === "composition") {
        compos.push(val);
      }
      else if (utils.isObject(val)) {
        compos.push(...findComposInObj(val));
      }
    }

    return compos;
  }

  return findComposInObj(themeObj);
}

function tryEval(str) {
  try {
    return eval(str);
  }
  catch {
    return null;
  }
}

const compoWithExtend = getCompositons(read).filter(compo => tryEval(compo.description)?.extends);

for (const compo of compoWithExtend) {
  const extendPath = tryEval(compo.description).extends;
  const extended = utils.get(read, extendPath);
  if (!extended) continue;
  utils.mergeDeep(compo.value, extended.value)
}

const res = JSON.stringify(read, null, 2)

fs.writeFileSync(readpath, res, "utf8");
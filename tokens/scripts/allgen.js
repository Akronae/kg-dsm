const fs = require("fs");
const path = require("path");
const utils = require("./utils");

const templatespath = process.argv[2];
if (!templatespath)
  throw new Error("No templates dir path provided");

for (const templatefile of utils.readdirRecursive(templatespath)) {
  console.log(templatefile)
}
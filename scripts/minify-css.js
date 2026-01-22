const { transform } = require("lightningcss");
const { readFileSync, writeFileSync } = require("fs");

const css = readFileSync("./styles.css", "utf-8");

let { code } = transform({
    filename: "styles.css",
    code: Buffer.from(css),
    minify: true,
    sourceMap: false,
    errorRecovery: true
});

writeFileSync("./styles.css", code);

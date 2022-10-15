import { existsSync, readFileSync, writeFileSync } from "fs";

import { build, list } from "../lib/subsrt.js";

export const Build = (test) => {
    const formats = list();
    for (let i = 0; i < formats.length; i++) {
        const ext = formats[i];
        console.log(`Build .${ext}`);
        const json = readFileSync("./test/fixtures/sample.json", "utf8");
        const captions = JSON.parse(json);
        const content = build(captions, { format: ext });
        test.ok(captions.length, "Expected length > 0");
        if (existsSync("./test/output")) {
            writeFileSync(`./test/output/build.${ext}`, content);
        }
    }
    test.done();
};

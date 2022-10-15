import { existsSync, readFileSync, writeFileSync } from "fs";

import { list, parse } from "../lib/subsrt.js";

export const Parse = (test) => {
    const formats = list();
    for (let i = 0; i < formats.length; i++) {
        const ext = formats[i];
        console.log(`Parse .${ext}`);
        const content = readFileSync(`./test/fixtures/sample.${ext}`, "utf8");
        const captions = parse(content, { format: ext });
        test.ok(captions.length, "Expected length > 0");

        if (existsSync("./test/output")) {
            writeFileSync(`./test/output/parse.${ext}.json`, JSON.stringify(captions, " ", 2));
        }
    }
    test.done();
};

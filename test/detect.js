import { readFileSync } from "fs";

import { detect, list } from "../lib/subsrt.js";

export const Detect = (test) => {
    const formats = list();
    for (let i = 0; i < formats.length; i++) {
        const ext = formats[i];
        console.log(`Detect .${ext}`);
        const content = readFileSync(`./test/fixtures/sample.${ext}`, "utf8");

        const expected = ext;
        const actual = detect(content);

        test.ok(actual === expected, `Expected '${expected}' but got '${actual}'!`);
    }
    test.done();
};

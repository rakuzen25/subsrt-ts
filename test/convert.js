import { existsSync, readFileSync, writeFileSync } from "fs";

import { convert, detect, list, parse } from "../lib/subsrt.js";

export const Convert = (test) => {
    const extensions = list();
    for (let i = 0; i < extensions.length; i++) {
        for (let j = 0; j < extensions.length; j++) {
            const ext1 = extensions[i];
            const ext2 = extensions[j];

            console.log(`Convert .${ext1} to .${ext2}`);

            const content1 = readFileSync(`./test/fixtures/sample.${ext1}`, "utf8");
            const content2 = convert(content1, { from: ext1, to: ext2 });

            test.ok(typeof content2 === "string", "Expected a string");
            test.ok(content2.length > 0, "Expected a string with length > 0");

            const format = detect(content2);
            test.ok(format === ext2, `Expected a '${ext2}' format but got '${format}'!`);

            const captions = parse(content2, { format: ext2 });
            test.ok(typeof captions !== "undefined", "Expected an object!");
            test.ok(captions.length > 0, "Expected at least one caption!");

            if (existsSync("./test/output")) {
                writeFileSync(`./test/output/convert.${ext1}.${ext2}`, content2);
            }
        }
    }
    test.done();
};

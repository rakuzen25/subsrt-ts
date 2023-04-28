import { readFileSync } from "fs";

import { list, parse } from "../lib/subsrt";

describe("Parse", () => {
    const formats = list();
    test.each(formats)("should parse a subtitle file", (ext) => {
        console.log(`Parse .${ext}`);
        const content = readFileSync(`./test/fixtures/sample.${ext}`, "utf8");
        const captions = parse(content, { format: ext });
        expect(captions.length).toBeGreaterThan(1);
    });
});

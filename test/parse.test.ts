import { readFileSync } from "fs";

import { list, parse } from "../lib/subsrt";

describe("Parse", () => {
    it("should parse a subtitle file", () => {
        const formats = list();
        for (const ext of formats) {
            console.log(`Parse .${ext}`);
            const content = readFileSync(`./test/fixtures/sample.${ext}`, "utf8");
            const captions = parse(content, { format: ext });
            expect(captions.length).toBeGreaterThan(1);
        }
    });
});

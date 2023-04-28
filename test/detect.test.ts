import { readFileSync } from "fs";

import { detect, list } from "../lib/subsrt";

describe("Detect", () => {
    it("should detect a subtitle file", () => {
        const formats = list();
        for (const ext of formats) {
            console.log(`Detect .${ext}`);
            const content = readFileSync(`./test/fixtures/sample.${ext}`, "utf8");

            const expected = ext;
            const actual = detect(content);

            expect(actual).toBe(expected);
        }
    });
});

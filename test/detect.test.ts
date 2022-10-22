import { readFileSync } from "fs";

import { detect, list } from "../dist/subsrt.js";

describe("Detect", () => {
    it("should detect a subtitle file", () => {
        const formats = list();
        for (let i = 0; i < formats.length; i++) {
            const ext = formats[i];
            console.log(`Detect .${ext}`);
            const content = readFileSync(`./test/fixtures/sample.${ext}`, "utf8");

            const expected = ext;
            const actual = detect(content);

            expect(actual).toBe(expected);
        }
    });
});

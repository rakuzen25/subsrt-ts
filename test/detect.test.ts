import { readFileSync } from "fs";

import { detect, list } from "../lib/subsrt";

describe("Detect", () => {
    const formats = list();
    test.each(formats)("should detect a subtitle file", (ext) => {
        console.log(`Detect .${ext}`);
        const content = readFileSync(`./test/fixtures/sample.${ext}`, "utf8");

        const expected = ext;
        const actual = detect(content);

        expect(actual).toBe(expected);
    });
});

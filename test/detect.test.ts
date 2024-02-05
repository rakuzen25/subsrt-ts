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

    test("should return an empty string when the format is not supported", () => {
        expect(detect("Hello\nWorld")).toBe("");
    });

    test("should throw an error when the input is not a string", () => {
        // @ts-expect-error For testing purposes
        expect(() => detect(1)).toThrow(TypeError);
    });
});

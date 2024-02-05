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

    test("should throw an error when the format is not supported", () => {
        expect(() => parse("Hello\nWorld")).toThrow(TypeError);
        expect(() => {
            parse("Hello\nWorld", { format: "unsupported" });
        }).toThrow(TypeError);
    });

    test("should throw an error when the input is not a string", () => {
        // @ts-expect-error For testing purposes
        expect(() => parse(1)).toThrow(TypeError);
    });
});

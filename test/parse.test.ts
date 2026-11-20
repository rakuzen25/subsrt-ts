import { readFileSync } from "fs";

import { SUBParseOptions } from "../lib/format/types/sub.js";
import { build, convert, list, parse } from "../lib/subsrt.js";
import { ContentCaption } from "../lib/types/handler.js";

describe("Parse", () => {
    const formats = list();
    test.each(formats)("should parse a subtitle file", (ext) => {
        console.log(`Parse .${ext}`);
        const content = readFileSync(`./test/fixtures/sample.${ext}`, "utf8");
        const captions = parse(content, { format: ext });
        expect(captions.length).toBeGreaterThan(1);
    });

    test("should keep the first caption of a file with a byte order mark", () => {
        const srt = readFileSync("./test/fixtures/sample.srt", "utf8");

        expect((parse(`\uFEFF${srt}`) as ContentCaption[]).map(({ start }) => start)).toEqual([599, 4160, 6770, 10880, 16700]);
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

describe("Parse MicroDVD", () => {
    const timesOf = (content: string, options: SUBParseOptions = {}) =>
        (parse(content, { format: "sub", ...options }) as ContentCaption[]).map(({ start, end, text }) => [start, end, text]);

    test("should read frames as milliseconds at the given fps", () => {
        expect(timesOf("{15}{104}Hi\r\n{104}{169}There", { fps: 25 })).toEqual([
            [600, 4160, "Hi"],
            [4160, 6760, "There"],
        ]);
    });

    test("should use the frame rate declared on the first line", () => {
        expect(timesOf("{1}{1}23.976\r\n{3352}{3400}Hello")).toEqual([[139806, 141808, "Hello"]]);
        expect(timesOf("{0}{0}25\n{250}{300}Hello")).toEqual([[10000, 12000, "Hello"]]);
    });

    test("should detect a file with a byte order mark and read its declared frame rate", () => {
        const captions = parse("\uFEFF{1}{1}23.976\r\n{3352}{3400}Hello") as ContentCaption[];

        expect(captions.map(({ start, end, text }) => [start, end, text])).toEqual([[139806, 141808, "Hello"]]);
    });

    test("should prefer the given fps over the declared one", () => {
        expect(timesOf("{1}{1}23.976\r\n{3352}{3400}Hello", { fps: 25 })).toEqual([[134080, 136000, "Hello"]]);
    });

    test("should keep a first caption that is not a frame rate", () => {
        expect(timesOf("{1}{1}Hello\r\n{25}{50}There")).toEqual([
            [40, 40, "Hello"],
            [1000, 2000, "There"],
        ]);
    });

    test("should write the same file it read", () => {
        const sub = readFileSync("./test/fixtures/sample.sub", "utf8");

        expect(build(parse(sub, { format: "sub" }), { format: "sub", eol: "\n" })).toBe(sub);
    });

    test("should convert SRT to MicroDVD and back to the nearest frame", () => {
        const srt = readFileSync("./test/fixtures/sample.srt", "utf8");
        const after = parse(convert(convert(srt, { from: "srt", to: "sub" }), { from: "sub", to: "srt" }), { format: "srt" }) as ContentCaption[];

        expect(after.map(({ start, end }) => [start, end])).toEqual([
            [600, 4160],
            [4160, 6760],
            [6760, 10880],
            [10880, 16720],
            [16720, 21480],
        ]);
    });
});

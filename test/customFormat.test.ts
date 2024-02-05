import { build, convert, detect, format, parse, resync } from "../lib/subsrt";
import { ContentCaption } from "../lib/types/handler";

describe("Custom format", () => {
    beforeAll(() => {
        format.line = {
            name: "line",
            parse: (content, _options) =>
                content.split("\n").map((text, index) => ({
                    type: "caption",
                    index,
                    start: index * 10,
                    end: (index + 1) * 10 - 1,
                    duration: 10,
                    content: text,
                    text,
                })),
            build: (captions, options) => captions.map((caption) => (caption as ContentCaption).text).join(options.eol ?? "\n"),
            detect: (content) => content.includes("\n"),
        };
    });

    test("should parse a custom format", () => {
        const content = "Hello\nWorld";
        const captions = parse(content, { format: "line" }) as ContentCaption[];

        expect(typeof captions).toBe("object");
        expect(captions.length).toBeGreaterThan(0);
        expect(captions).toHaveLength(2);
        expect(captions[0].start).toBe(0);
        expect(captions[0].end).toBe(9);
        expect(captions[1].start).toBe(10);
        expect(captions[1].end).toBe(19);
    });

    test("should build a custom format", () => {
        const captions = [
            {
                type: "caption",
                index: 0,
                start: 0,
                end: 9,
                duration: 10,
                content: "Hello",
                text: "Hello",
            },
            {
                type: "caption",
                index: 1,
                start: 10,
                end: 19,
                duration: 10,
                content: "World",
                text: "World",
            },
        ] as ContentCaption[];
        const content = build(captions, { format: "line" });

        expect(typeof content).toBe("string");
        expect(content.length).toBeGreaterThan(0);
        expect(content).toBe("Hello\nWorld");
    });

    test("should detect a custom format", () => {
        const content = "Hello\nWorld";
        const detected = detect(content);

        expect(typeof detected).toBe("string");
        expect(detected.length).toBeGreaterThan(0);
        expect(detected).toBe("line");
    });

    test("should convert a custom format", () => {
        const content = "Hello\nWorld";
        const converted = convert(content, { from: "line", to: "srt" });

        expect(typeof converted).toBe("string");
        expect(converted.length).toBeGreaterThan(0);

        const convertedAndResynced = convert(content, {
            from: "line",
            to: "srt",
            resync: {
                offset: 3000,
            },
        });
        expect(typeof convertedAndResynced).toBe("string");
        expect(convertedAndResynced.length).toBeGreaterThan(0);
        expect(convertedAndResynced).toHaveLength(converted.length);

        const format = detect(convertedAndResynced);
        expect(format).toBe("srt");

        const resynced = parse(convertedAndResynced, { format });
        expect(typeof resynced).toBe("object");
        expect(resynced.length).toBeGreaterThan(0);
        expect(resynced).toHaveLength(2);
        expect((resynced[0] as ContentCaption).start).toBe(3000);
        expect((resynced[0] as ContentCaption).end).toBe(3009);
    });

    test("should resync a custom format", () => {
        const content = "Hello\nWorld";
        const captions = parse(content, { format: "line" }) as ContentCaption[];
        const resynced = resync(captions, +3000);

        expect(typeof resynced).toBe("object");
        expect(resynced.length).toBeGreaterThan(0);
        expect(resynced).toHaveLength(captions.length);
        expect((resynced[0] as ContentCaption).start).toBe(captions[0].start + 3000);
        expect((resynced[0] as ContentCaption).end).toBe(captions[0].end + 3000);

        const content2 = build(resynced, { format: "line" });
        expect(typeof content2).toBe("string");
        expect(content2.length).toBeGreaterThan(0);
        expect(content2).toBe("Hello\nWorld");
    });

    test("should throw an error or skip when the format does not have corresponding methods", () => {
        // @ts-expect-error For testing purposes
        format.line.build = undefined;
        expect(() => {
            build([], { format: "line" });
        }).toThrow(TypeError);

        // @ts-expect-error For testing purposes
        format.line.parse = undefined;
        expect(() => {
            parse("Hello\nWorld", { format: "line" });
        }).toThrow(TypeError);

        // @ts-expect-error For testing purposes
        format.line.detect = undefined;
        expect(detect("Hello\nWorld")).toBe("");
    });
});

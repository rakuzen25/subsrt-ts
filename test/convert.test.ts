import { readFileSync } from "fs";

import { convert, detect, list, parse } from "../lib/subsrt";
import { ContentCaption } from "../lib/types/handler";

describe("Convert", () => {
    const extensions = list();
    const cases = extensions.map((ext1) => extensions.map((ext2) => [ext1, ext2])).flat();
    test.each(cases)("should convert a subtitle file", (ext1, ext2) => {
        if (ext1 === ext2) {
            return;
        }

        console.log(`Convert .${ext1} to .${ext2}`);

        const content1 = readFileSync(`./test/fixtures/sample.${ext1}`, "utf8");
        const content2 = convert(content1, { from: ext1, to: ext2 });

        expect(typeof content2).toBe("string");
        expect(content2.length).toBeGreaterThan(0);

        const format = detect(content2);
        expect(format).toBe(ext2);

        const captions = parse(content2, { format: ext2 });
        expect(typeof captions).not.toBe("undefined");
        expect(captions.length).toBeGreaterThan(0);

        // String "to" format as second argument
        const content3 = convert(content1, ext2);
        expect(content3).toBe(content2);
    });

    test("should resync +3000 ms after conversion", () => {
        const srt = readFileSync("./test/fixtures/sample.srt", "utf8");
        const captions = parse(srt, { format: "srt" });
        const convertedAndResynced = convert(srt, {
            from: "srt",
            to: "vtt",
            resync: {
                offset: 3000,
            },
        });

        expect(typeof convertedAndResynced).toBe("string");
        expect(convertedAndResynced.length).toBeGreaterThan(0);

        const format = detect(convertedAndResynced);
        expect(format).toBe("vtt");

        const resynced = parse(convertedAndResynced, { format });
        expect(typeof resynced).toBe("object");
        expect(resynced.length).toBeGreaterThan(0);
        expect(resynced).toHaveLength(captions.length + 1); // Extra WEBVTT header

        expect((resynced[1] as ContentCaption).start).toBe((captions[0] as ContentCaption).start + 3000);
        expect((resynced[1] as ContentCaption).end).toBe((captions[0] as ContentCaption).end + 3000);
    });
});

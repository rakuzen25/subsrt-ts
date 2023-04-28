import { readFileSync } from "fs";

import { convert, detect, list, parse } from "../lib/subsrt";

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
    });
});

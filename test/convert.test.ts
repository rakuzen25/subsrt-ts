import { readFileSync } from "fs";

import { convert, detect, list, parse } from "../lib/subsrt";

describe("Convert", () => {
    it("should convert a subtitle file", () => {
        const extensions = list();
        for (const ext1 of extensions) {
            for (const ext2 of extensions) {
                if (ext1 === ext2) {
                    continue;
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
            }
        }
    });
});

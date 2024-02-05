import { readFileSync } from "fs";

import { build, list } from "../lib/subsrt";
import { Caption } from "../lib/types/handler";

describe("Build", () => {
    const formats = list();
    test.each(formats)("Build a subtitle file", (ext) => {
        console.log(`Build .${ext}`);
        const json = readFileSync("./test/fixtures/sample.json", "utf8");
        const captions = JSON.parse(json) as Caption[];
        const content = build(captions, { format: ext });
        expect(content.length).toBeGreaterThan(0);
    });
});

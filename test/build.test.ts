import { readFileSync } from "fs";

import { build, list } from "../lib/subsrt";

describe("Build", () => {
    it("should build a subtitle file", () => {
        const formats = list();
        for (let i = 0; i < formats.length; i++) {
            const ext = formats[i];
            console.log(`Build .${ext}`);
            const json = readFileSync("./test/fixtures/sample.json", "utf8");
            const captions = JSON.parse(json);
            const content = build(captions, { format: ext });
            expect(content.length).toBeGreaterThan(0);
        }
    });
});

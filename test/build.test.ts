import { readFileSync } from "fs";

import { build, list, parse } from "../lib/subsrt";
import { BuildOptions, Caption } from "../lib/types/handler";

describe("Build", () => {
    const formats = list();
    test.each(formats)("should build a subtitle file", (ext) => {
        console.log(`Build .${ext}`);
        const json = readFileSync("./test/fixtures/sample.json", "utf8");
        const captions = JSON.parse(json) as Caption[];
        const content = build(captions, {
            format: ext,
            closeTags: ext === "smi" ? true : undefined,
        } as BuildOptions);
        expect(content.length).toBeGreaterThan(0);
    });

    test("should build LRC tags", () => {
        const captions = [
            { type: "meta", tag: "ar", data: "Artist" },
            { type: "meta", tag: "ti", data: "Title" },
            { type: "meta", tag: "au", data: "Author" },
            { type: "meta", tag: "al", data: "Album" },
            { type: "meta", tag: "by", data: "Creator" },
            { type: "meta", tag: "offset", data: "100" },
            { type: "caption", start: 0, text: "Lyrics" },
        ] as Caption[];
        const content = build(captions, { format: "lrc" });
        expect(content).toMatch(/\[ar:.*\]/);
        expect(content).toMatch(/\[ti:.*\]/);
        expect(content).toMatch(/\[au:.*\]/);
        expect(content).toMatch(/\[al:.*\]/);
        expect(content).toMatch(/\[by:.*\]/);
        expect(content).toMatch(/\[offset:.*\]/);
    });

    test("should not have duplicate WEBVTT header", () => {
        const vtt = readFileSync("./test/fixtures/sample.vtt", "utf8");
        const captions = parse(vtt, { format: "vtt" });
        const content = build(captions, { format: "vtt" });
        expect(content).not.toMatch(/WEBVTT\r?\nWEBVTT/);
    });
});

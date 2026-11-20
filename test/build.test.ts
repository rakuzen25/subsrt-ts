import { readFileSync } from "fs";

import { build, list, parse } from "../lib/subsrt.js";
import { BuildOptions, Caption } from "../lib/types/handler.js";

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

    test("should write MicroDVD times as frames at the given fps", () => {
        const captions = [{ type: "caption", start: 600, end: 4160, text: "Hi" }] as Caption[];
        expect(build(captions, { format: "sub", fps: 25 } as BuildOptions)).toBe("{15}{104}Hi\r\n");
    });
});

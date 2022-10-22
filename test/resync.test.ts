import { readFileSync } from "fs";

import { SUBParseOptions } from "../dist/format/types/sub";
import { parse, resync } from "../dist/subsrt.js";
import { ContentCaption } from "../dist/types/handler.js";

describe("Resync", () => {
    it("should resync +3000 ms", () => {
        const srt = readFileSync("./test/fixtures/sample.srt", "utf8");
        const captions = parse(srt);
        const resynced = resync(captions, +3000);

        expect(typeof resynced).toBe("object");
        expect(resynced.length).toBeGreaterThan(0);
        expect(resynced.length).toBe(captions.length);

        expect((resynced[0] as ContentCaption).start).toBe((captions[0] as ContentCaption).start + 3000);
        expect((resynced[0] as ContentCaption).end).toBe((captions[0] as ContentCaption).end + 3000);
    });

    it("should resync -250 ms", () => {
        const sbv = readFileSync("./test/fixtures/sample.sbv", "utf8");
        const captions = parse(sbv);
        const resynced = resync(captions, -250);

        expect(typeof resynced).toBe("object");
        expect(resynced.length).toBeGreaterThan(0);
        expect(resynced.length).toBe(captions.length);

        expect((resynced[3] as ContentCaption).start).toBe((captions[3] as ContentCaption).start - 250);
        expect((resynced[3] as ContentCaption).end).toBe((captions[3] as ContentCaption).end - 250);
    });

    it("should resync 25 to 30 FPS", () => {
        const sub = readFileSync("./test/fixtures/sample.sub", "utf8");
        const captions = parse(sub, <SUBParseOptions>{ fps: 25 });
        const resynced = resync(captions, { ratio: 30 / 25, frame: true });

        expect(typeof resynced).toBe("object");
        expect(resynced.length).toBeGreaterThan(0);
        expect(resynced.length).toBe(captions.length);

        expect((resynced[3] as ContentCaption).frame).toBeDefined();
        expect((resynced[3] as ContentCaption).frame?.start).toBe((((captions[3] as ContentCaption)?.frame?.start || 0) * 30) / 25);
        expect((resynced[3] as ContentCaption).frame?.end).toBe((((captions[3] as ContentCaption)?.frame?.end || 0) * 30) / 25);
        expect((resynced[3] as ContentCaption).frame?.count).toBe((((captions[3] as ContentCaption)?.frame?.count || 0) * 30) / 25);
    });

    it("should resync with non-linear function", () => {
        const vtt = readFileSync("./test/fixtures/sample.vtt", "utf8");
        const captions = parse(vtt);
        const resynced = resync(captions, (a) => [
            a[0] + 0, // Keep the start time
            a[1] + 500, // Extend each end time by 500 ms
        ]);

        expect(typeof resynced).toBe("object");
        expect(resynced.length).toBeGreaterThan(0);
        expect(resynced.length).toBe(captions.length);

        expect((resynced[3] as ContentCaption).start).toBe((captions[3] as ContentCaption).start);
        expect((resynced[3] as ContentCaption).end).toBe((captions[3] as ContentCaption).end + 500);
    });
});

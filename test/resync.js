import { existsSync, readFileSync, writeFileSync } from "fs";

import { parse, resync } from "../lib/subsrt.js";

// Resync +3000 ms
export const Resync1 = (test) => {
    const srt = readFileSync("./test/fixtures/sample.srt", "utf8");
    const captions = parse(srt);
    const resynced = resync(captions, +3000);

    if (existsSync("./test/output")) {
        writeFileSync("./test/output/resync-add-3000.json", JSON.stringify(resynced, " ", 2));
    }

    test.ok(typeof resynced === "object", "Expected an object");
    test.ok(resynced.length > 0, "Expected array length > 0");
    test.ok(resynced.length === captions.length, `Expected array of length == ${captions.length}`);

    test.ok(resynced[0].start !== captions[0].start, "Expected start frame value shift!");
    test.ok(resynced[0].end !== captions[0].end, "Expected end frame value shift!");

    test.done();
};

// Resync -250 ms
export const Resync2 = (test) => {
    const sbv = readFileSync("./test/fixtures/sample.sbv", "utf8");
    const captions = parse(sbv);
    const resynced = resync(captions, -250);

    if (existsSync("./test/output")) {
        writeFileSync("./test/output/resync-sub-250.json", JSON.stringify(resynced, " ", 2));
    }

    test.ok(typeof resynced === "object", "Expected an object");
    test.ok(resynced.length > 0, "Expected array length > 0");
    test.ok(resynced.length === captions.length, `Expected array of length == ${captions.length}`);

    test.ok(resynced[3].start !== captions[3].start, "Expected start frame value shift!");
    test.ok(resynced[3].end !== captions[3].end, "Expected end frame value shift!");

    test.done();
};

// Resync 25 to 30 FPS
export const Resync3 = (test) => {
    const sub = readFileSync("./test/fixtures/sample.sub", "utf8");
    const captions = parse(sub, { fps: 25 });
    const resynced = resync(captions, { ratio: 30 / 25, frame: true });

    if (existsSync("./test/output")) {
        writeFileSync("./test/output/resync-fps-30.json", JSON.stringify(resynced, " ", 2));
    }

    test.ok(typeof resynced === "object", "Expected an object");
    test.ok(resynced.length > 0, "Expected array length > 0");
    test.ok(resynced.length === captions.length, `Expected array of length == ${captions.length}`);

    test.ok(resynced[3].frame.start !== captions[3].frame.start, "Expected start frame value shift!");
    test.ok(resynced[3].frame.end !== captions[3].frame.end, "Expected end frame value shift!");
    test.ok(resynced[3].frame.count > captions[3].frame.count, "Expected increased frame count number!");

    test.done();
};

// Resync with non-linear function
export const Resync4 = (test) => {
    const vtt = readFileSync("./test/fixtures/sample.vtt", "utf8");
    const captions = parse(vtt);
    const resynced = resync(captions, (a) => {
        return [
            a[0] + 0, //Keep the start time
            a[1] + 500, //Extend each end time by 500 ms
        ];
    });

    if (existsSync("./test/output")) {
        writeFileSync("./test/output/resync-extend.json", JSON.stringify(resynced, " ", 2));
    }

    test.ok(typeof resynced === "object", "Expected an object");
    test.ok(resynced.length > 0, "Expected array length > 0");
    test.ok(resynced.length === captions.length, `Expected array of length == ${captions.length}`);

    test.ok(resynced[3].start === captions[3].start + 0, "Expected start frame value shift!");
    test.ok(resynced[3].end === captions[3].end + 500, "Expected end frame value shift!");

    test.done();
};

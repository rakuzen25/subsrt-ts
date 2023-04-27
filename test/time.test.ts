import { format, list } from "../lib/subsrt";

describe("Time", () => {
    it("should convert time to milliseconds", () => {
        const formats = list();
        const fixtures = [0, 90, 1000, 60000, 3600000, 7236250];
        for (let i = 0; i < formats.length; i++) {
            const ext = formats[i];
            console.log(`Time .${ext}`);
            const handler = format[ext];
            if (!handler.helper) {
                console.log(`Time .${ext} skipped`);
                continue;
            }
            const toMilliseconds = handler.helper.toMilliseconds,
                toTimeString = handler.helper.toTimeString;
            if (typeof toMilliseconds !== "function" || typeof toTimeString !== "function") {
                console.log(`Time .${ext} skipped`);
                continue;
            }
            for (let f = 0; f < fixtures.length; f++) {
                const value = fixtures[f];
                const s = toTimeString(value);
                const t = toMilliseconds(s);
                expect(t).toBe(value);
            }
        }
    });
});

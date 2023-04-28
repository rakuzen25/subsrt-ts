import { format, list } from "../lib/subsrt";

describe("Time", () => {
    it("should convert time to milliseconds", () => {
        const formats = list();
        const fixtures = [0, 90, 1000, 60000, 3600000, 7236250];
        for (const ext of formats) {
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
            for (const value of fixtures) {
                const str = toTimeString(value);
                const ms = toMilliseconds(str);
                expect(ms).toBe(value);
            }
        }
    });
});

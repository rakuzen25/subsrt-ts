import { format, list } from "../lib/subsrt";

describe("Time", () => {
    const formats = list();
    const fixtures = [0, 90, 1000, 60000, 3600000, 7236250];
    test.each(formats)("should convert time to milliseconds", (ext) => {
        console.log(`Time .${ext}`);
        const handler = format[ext];
        if (!handler.helper) {
            console.log(`Time .${ext} skipped`);
            return;
        }
        const toMilliseconds = handler.helper.toMilliseconds,
            toTimeString = handler.helper.toTimeString;
        if (typeof toMilliseconds !== "function" || typeof toTimeString !== "function") {
            console.log(`Time .${ext} skipped`);
            return;
        }
        for (const value of fixtures) {
            const str = toTimeString(value);
            const ms = toMilliseconds(str);
            expect(ms).toBe(value);
        }

        // Test for invalid time
        expect(() => {
            toMilliseconds("Hello");
        }).toThrow(TypeError);
    });
});

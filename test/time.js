import { format, list } from "../lib/subsrt.js";

export const Time = (test) => {
    const formats = list();
    const fixtures = [0, 90, 1000, 60000, 3600000, 7236250];
    for (let i = 0; i < formats.length; i++) {
        const ext = formats[i];
        console.log(`Time .${ext}`);
        const handler = format[ext];
        if (handler.helper) {
            const toMilliseconds = handler.helper.toMilliseconds;
            const toTimeString = handler.helper.toTimeString;
            if (typeof toMilliseconds === "function" && typeof toTimeString === "function") {
                for (let f = 0; f < fixtures.length; f++) {
                    const value = fixtures[f];
                    const s = toTimeString(value);
                    const t = toMilliseconds(s);
                    test.ok(t === value, `Expected '${value}' but got '${t}' for '${s}'`);
                }
            }
        }
    }
    test.done();
};

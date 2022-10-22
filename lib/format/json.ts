import { buildHandler } from "../handler.js";
import { BuildOptions, Caption, ParseOptions } from "../types/handler.js";

const FORMAT_NAME = "json";

/**
 * Parses captions in JSON format.
 */
const parse = (content: string, _options: ParseOptions): Caption[] => JSON.parse(content);

/**
 * Builds captions in JSON format.
 */
const build = (captions: Caption[], _options: BuildOptions) => JSON.stringify(captions, undefined, 2);

/**
 * Detects a subtitle format from the content.
 */
const detect = (content: string) => {
    /*
    [
        { ... }
    ]
    */
    // return /^\[[\s\r\n]*\{[\s\S]*\}[\s\r\n]*\]$/g.test(content);
    try {
        const res = JSON.parse(content);
        return Array.isArray(res) && res.length > 0 && typeof res[0] === "object";
    } catch (e) {
        return false;
    }
};

export default buildHandler({ name: FORMAT_NAME, build, detect, parse });
export { FORMAT_NAME as name, build, detect, parse };

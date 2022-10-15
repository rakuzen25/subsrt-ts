const FORMAT_NAME = "json";

/**
 * Parses captions in JSON format.
 */
const parse = (content, _options) => JSON.parse(content);

/**
 * Builds captions in JSON format.
 */
const build = (captions, _options) => JSON.stringify(captions, " ", 2);

/**
 * Detects a subtitle format from the content.
 */
const detect = (content) => {
    if (typeof content === "string") {
        if (/^\[[\s\r\n]*\{[\s\S]*\}[\s\r\n]*\]$/g.test(content)) {
            /*
            [
                { ... }
            ]
            */
            return "json";
        }
    }
};

export { FORMAT_NAME as name, build, detect, parse };

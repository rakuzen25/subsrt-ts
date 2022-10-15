const subsrt = {
    format: {},
};

const clone = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Loads the subtitle format parsers and builders.
 */
(() => {
    // Load in the predefined order
    const formats = ["vtt", "lrc", "smi", "ssa", "ass", "sub", "srt", "sbv", "json"];
    for (let i = 0; i < formats.length; i++) {
        const f = formats[i];
        const handler = require(`./format/${f}.js`);
        subsrt.format[handler.name] = handler;
    }
})();

/**
 * Gets a list of supported subtitle formats.
 */
subsrt.list = () => Object.keys(subsrt.format);

/**
 * Detects a subtitle format from the content.
 */
subsrt.detect = (content) => {
    const formats = subsrt.list();
    for (let i = 0; i < formats.length; i++) {
        const f = formats[i];
        const handler = subsrt.format[f];
        if (typeof handler === "undefined") {
            continue;
        }
        if (typeof handler.detect !== "function") {
            continue;
        }
        // Function "detect" can return true or format name
        const d = handler.detect(content);
        if (d === true || d === f) {
            return f;
        }
    }
};

/**
 * Parses a subtitle content.
 */
subsrt.parse = (content, options = {}) => {
    const format = options.format || subsrt.detect(content);
    if (!format || format.trim().length === 0) {
        throw new Error("Cannot determine subtitle format!");
    }

    const handler = subsrt.format[format];
    if (typeof handler === "undefined") {
        throw new Error(`Unsupported subtitle format: ${format}`);
    }

    const func = handler.parse;
    if (typeof func !== "function") {
        throw new Error(`Subtitle format does not support 'parse' op: ${format}`);
    }

    return func(content, options);
};

/**
 * Builds a subtitle content.
 */
subsrt.build = (captions, options = {}) => {
    const format = options.format || "srt";
    if (!format || format.trim().length === 0) {
        throw new Error("Cannot determine subtitle format!");
    }

    const handler = subsrt.format[format];
    if (typeof handler === "undefined") {
        throw new Error(`Unsupported subtitle format: ${format}`);
    }

    const func = handler.build;
    if (typeof func !== "function") {
        throw new Error(`Subtitle format does not support 'build' op: ${format}`);
    }

    return func(captions, options);
};

/**
 * Converts subtitle format.
 */
subsrt.convert = (content, _options) => {
    let options;
    if (typeof _options === "string") {
        options = { to: _options };
    }
    options = options || {};

    const opt = clone(options);
    delete opt.format;

    if (opt.from) {
        opt.format = opt.from;
    }

    let captions = subsrt.parse(content, opt);
    if (opt.resync) {
        captions = subsrt.resync(captions, opt.resync);
    }

    opt.format = opt.to || options.format;
    const result = subsrt.build(captions, opt);

    return result;
};

/**
 * Shifts the time of the captions.
 */
subsrt.resync = (captions, options = {}) => {
    let func, ratio, frame, offset;
    if (typeof options === "function") {
        func = options; //User's function to handle time shift
    } else if (typeof options === "number") {
        offset = options; //Time shift (+/- offset)
        func = (a) => [a[0] + offset, a[1] + offset];
    } else if (typeof options === "object") {
        offset = (options.offset || 0) * (options.frame ? options.fps || 25 : 1);
        ratio = options.ratio || 1.0;
        frame = options.frame;
        func = (a) => [Math.round(a[0] * ratio + offset), Math.round(a[1] * ratio + offset)];
    } else {
        throw new Error("Argument 'options' not defined!");
    }

    const resynced = [];
    for (let i = 0; i < captions.length; i++) {
        const caption = clone(captions[i]);
        if (typeof caption.type === "undefined" || caption.type === "caption") {
            if (frame) {
                const shift = func([caption.frame.start, caption.frame.end]);
                if (shift && shift.length === 2) {
                    caption.frame.start = shift[0];
                    caption.frame.end = shift[1];
                    caption.frame.count = caption.frame.end - caption.frame.start;
                }
            } else {
                const shift = func([caption.start, caption.end]);
                if (shift && shift.length === 2) {
                    caption.start = shift[0];
                    caption.end = shift[1];
                    caption.duration = caption.end - caption.start;
                }
            }
        }
        resynced.push(caption);
    }

    return resynced;
};

module.exports = subsrt;

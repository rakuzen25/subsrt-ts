import { Handler } from "./handler.js";
import { BuildOptions, Caption, ConvertOptions, ParseOptions, ResyncOptions } from "./types/handler.js";
import { ResyncFunction, SubsrtFormats, SubsrtInterface } from "./types/subsrt.js";

const clone = (obj: object) => JSON.parse(JSON.stringify(obj));

class Subsrt implements SubsrtInterface {
    format = <SubsrtFormats>{};

    /**
     * Loads the subtitle format parsers and builders.
     */
    async init() {
        // Load in the predefined order
        const formats = ["vtt", "lrc", "smi", "ssa", "ass", "sub", "srt", "sbv", "json"];
        for (let i = 0; i < formats.length; i++) {
            const f = formats[i];
            const handler: Handler = (await import(`./format/${f}.js`)).default;
            this.format[handler.name] = handler;
        }
    }

    /**
     * Gets a list of supported subtitle formats.
     */
    list = () => Object.keys(this.format);

    /**
     * Detects a subtitle format from the content.
     */
    detect = (content: string) => {
        const formats = this.list();
        for (let i = 0; i < formats.length; i++) {
            const f = formats[i];
            const handler = this.format[f];
            if (typeof handler === "undefined") {
                continue;
            }
            if (typeof handler.detect !== "function") {
                continue;
            }
            // Function 'detect' can return true or format name
            const d = handler.detect(content);
            if (d === true || d === f) {
                return f;
            }
        }
        return "";
    };

    /**
     * Parses a subtitle content.
     */
    parse = (content: string, options = <ParseOptions>{}) => {
        const format = options.format || this.detect(content);
        if (!format || format.trim().length === 0) {
            throw new Error("Cannot determine subtitle format!");
        }

        const handler = this.format[format];
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
    build = (captions: Caption[], options = <BuildOptions>{}) => {
        const format = options.format || "srt";
        if (!format || format.trim().length === 0) {
            throw new Error("Cannot determine subtitle format!");
        }

        const handler = this.format[format];
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
    convert = (content: string, _options: ConvertOptions | string = <ConvertOptions>{}) => {
        let options = <ConvertOptions>{};
        if (typeof _options === "string") {
            options.to = _options;
        } else {
            options = _options;
        }

        const parseOptions = <ParseOptions>{
            format: options.from || undefined,
            verbose: options.verbose,
            eol: options.eol,
        };
        let captions = this.parse(content, parseOptions);

        if (options.resync) {
            captions = this.resync(captions, options.resync);
        }

        const buildOptions = <BuildOptions>{
            format: options.to || options.format,
            verbose: options.verbose,
            eol: options.eol,
        };
        const result = this.build(captions, buildOptions);

        return result;
    };

    /**
     * Shifts the time of the captions.
     */
    resync = (captions: Caption[], options: ResyncFunction | number | ResyncOptions = <ResyncOptions>{}) => {
        let func: ResyncFunction,
            ratio: number,
            frame = false,
            offset: number;
        if (typeof options === "function") {
            func = options; // User's function to handle time shift
        } else if (typeof options === "number") {
            offset = options; // Time shift (+/- offset)
            func = (a) => [a[0] + offset, a[1] + offset];
        } else if (typeof options === "object") {
            offset = (options.offset || 0) * (options.frame ? options.fps || 25 : 1);
            ratio = options.ratio || 1.0;
            frame = options.frame || false;
            func = (a) => [Math.round(a[0] * ratio + offset), Math.round(a[1] * ratio + offset)];
        } else {
            throw new Error("Argument 'options' not defined!");
        }

        const resynced: Caption[] = [];
        for (let i = 0; i < captions.length; i++) {
            const caption = clone(captions[i]);
            if (!caption.type || caption.type === "caption") {
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
}

const subsrt = new Subsrt();
await subsrt.init();

export default subsrt;
export const { format, list, detect, parse, build, convert, resync } = subsrt;

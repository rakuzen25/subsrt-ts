import formats from "./format/index.js";
import { BuildOptions, Caption, ConvertOptions, ParseOptions, ResyncOptions } from "./types/handler.js";
import { ResyncFunction, SubsrtInterface } from "./types/subsrt.js";

/**
 * Clones an object.
 * @param obj - The object to clone
 * @returns The cloned object
 */
const clone = <T extends object>(obj: T) => JSON.parse(JSON.stringify(obj)) as T;

/**
 * Main subsrt class.
 */
class Subsrt implements SubsrtInterface {
    format = formats;

    /**
     * Gets a list of supported subtitle formats.
     * @returns The list of supported subtitle formats
     */
    list = () => Object.keys(this.format);

    /**
     * Detects a subtitle format from the content.
     * @param content - The subtitle content
     * @returns The detected format
     */
    detect = (content: string) => {
        const formats = this.list();
        for (const format of formats) {
            const handler = this.format[format];
            if (typeof handler === "undefined") {
                continue;
            }
            if (typeof handler.detect !== "function") {
                continue;
            }
            // Function 'detect' can return true or format name
            const detected = handler.detect(content);
            if (detected === true || detected === format) {
                return format;
            }
        }
        return "";
    };

    /**
     * Parses a subtitle content.
     * @param content - The subtitle content
     * @param options - The parsing options
     * @throws TypeError If the format cannot be determined
     * @throws TypeError If the format is not supported
     * @throws TypeError If the handler does not support 'parse' op
     * @returns The parsed captions
     */
    parse = (content: string, options = {} as ParseOptions) => {
        const format = options.format ?? this.detect(content);
        if (!format || format.trim().length === 0) {
            throw new TypeError("Cannot determine subtitle format");
        }

        const handler = this.format[format];
        if (typeof handler === "undefined") {
            throw new TypeError(`Unsupported subtitle format: ${format}`);
        }

        const func = handler.parse;
        if (typeof func !== "function") {
            throw new TypeError(`Subtitle format does not support 'parse' op: ${format}`);
        }

        return func(content, options);
    };

    /**
     * Builds a subtitle content.
     * @param captions - The captions to build
     * @param options - The building options
     * @throws TypeError If the format cannot be determined
     * @throws TypeError If the format is not supported
     * @throws TypeError If the handler does not support 'build' op
     * @returns The built subtitle content
     */
    build = (captions: Caption[], options = {} as BuildOptions) => {
        const format = options.format ?? "srt";
        if (!format || format.trim().length === 0) {
            throw new TypeError("Cannot determine subtitle format");
        }

        const handler = this.format[format];
        if (typeof handler === "undefined") {
            throw new TypeError(`Unsupported subtitle format: ${format}`);
        }

        const func = handler.build;
        if (typeof func !== "function") {
            throw new TypeError(`Subtitle format does not support 'build' op: ${format}`);
        }

        return func(captions, options);
    };

    /**
     * Converts subtitle format.
     * @param content - The subtitle content
     * @param options - The conversion options
     * @returns The converted subtitle content
     */
    convert = (content: string, _options: ConvertOptions | string = {} as ConvertOptions) => {
        let options = {} as ConvertOptions;
        if (typeof _options === "string") {
            options.to = _options;
        } else {
            options = _options;
        }

        const parseOptions = {
            format: options.from ?? undefined,
            verbose: options.verbose,
            eol: options.eol,
        } as ParseOptions;
        let captions = this.parse(content, parseOptions);

        if (options.resync) {
            captions = this.resync(captions, options.resync);
        }

        const buildOptions = {
            format: options.to || options.format,
            verbose: options.verbose,
            eol: options.eol,
        } as BuildOptions;
        const result = this.build(captions, buildOptions);

        return result;
    };

    /**
     * Shifts the time of the captions.
     * @param captions - The captions to resync
     * @param options - The resync options
     * @throws TypeError If the 'options' argument is not defined
     * @returns The resynced captions
     */
    // skipcq: JS-0105
    resync = (captions: Caption[], options: ResyncFunction | number | ResyncOptions = {} as ResyncOptions) => {
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
            offset = (options.offset ?? 0) * (options.frame ? options.fps ?? 25 : 1);
            ratio = options.ratio ?? 1.0;
            frame = options.frame ?? false;
            func = (a) => [Math.round(a[0] * ratio + offset), Math.round(a[1] * ratio + offset)];
        } else {
            throw new TypeError("Argument 'options' not defined");
        }

        const resynced: Caption[] = [];
        for (const _caption of captions) {
            const caption = clone(_caption);
            if (!caption.type || caption.type === "caption") {
                if (frame && caption.frame) {
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
export default subsrt;
export const { format, list, detect, parse, build, convert, resync } = subsrt;

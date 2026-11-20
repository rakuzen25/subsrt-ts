import { buildHandler } from "../handler.js";
import { Caption, ContentCaption } from "../types/handler.js";

import { SUBBuildOptions, SUBParseOptions } from "./types/sub.js";

const FORMAT_NAME = "sub";
const DEFAULT_FPS = 25;

/**
 * Parses captions in MicroDVD format.
 * @param content - The subtitle content
 * @param options - Parse options
 * @returns Parsed captions
 * @see https://en.wikipedia.org/wiki/MicroDVD
 */
const parse = (content: string, options: SUBParseOptions) => {
    const parts = content.split(/\r?\n/);
    const header = parts.findIndex((part) => part.trim() !== "");
    const declared = /^\{[01]\}\{[01]\}(\d+(?:\.\d+)?)\s*$/.exec(parts[header] ?? "");
    const fileFps = declared ? parseFloat(declared[1]) : DEFAULT_FPS;
    const fps = options.fps && options.fps > 0 ? options.fps : fileFps;
    /**
     * Converts a frame number to milliseconds at the file's frame rate.
     * @param frame - The frame number
     * @returns The time in milliseconds
     */
    const toMilliseconds = (frame: number) => Math.round((frame / fps) * 1000);
    const captions = [];
    const eol = options.eol ?? "\r\n";
    for (let i = 0; i < parts.length; i++) {
        if (declared && i === header) {
            continue;
        }

        const regex = /^\{(\d+)\}\{(\d+)\}(.*)$/;
        const match = regex.exec(parts[i]);
        if (match) {
            const caption = {} as ContentCaption;
            caption.type = "caption";
            caption.index = i + 1;
            caption.frame = {
                start: parseInt(match[1], 10),
                end: parseInt(match[2], 10),
                count: parseInt(match[2]) - parseInt(match[1], 10),
            };
            caption.start = toMilliseconds(caption.frame.start);
            caption.end = toMilliseconds(caption.frame.end);
            caption.duration = caption.end - caption.start;
            const lines = match[3].split(/\|/);
            caption.content = lines.join(eol);
            caption.text = caption.content.replace(/\{[^}]+\}/g, ""); // {0}{25}{c:$0000ff}{y:b,u}{f:DeJaVuSans}{s:12}Hello!
            captions.push(caption);
            continue;
        }

        if (options.verbose) {
            console.warn("Unknown part", parts[i]);
        }
    }
    return captions;
};

/**
 * Builds captions in MicroDVD format.
 * @param captions - The captions to build
 * @param options - Build options
 * @returns The built captions string in MicroDVD format
 * @see https://en.wikipedia.org/wiki/MicroDVD
 */
const build = (captions: Caption[], options: SUBBuildOptions) => {
    const fps = options.fps && options.fps > 0 ? options.fps : DEFAULT_FPS;
    /**
     * Converts a time in milliseconds to the nearest frame number.
     * @param milliseconds - The time in milliseconds
     * @returns The frame number
     */
    const toFrame = (milliseconds: number) => Math.round((milliseconds * fps) / 1000);

    let sub = "";
    const eol = options.eol ?? "\r\n";
    for (const caption of captions) {
        if (!caption.type || caption.type === "caption") {
            const startFrame = typeof caption.frame === "object" && caption.frame.start >= 0 ? caption.frame.start : toFrame(caption.start);
            const endFrame = typeof caption.frame === "object" && caption.frame.end >= 0 ? caption.frame.end : toFrame(caption.end);
            const text = caption.text.replace(/\r?\n/, "|");
            sub += `{${startFrame}}{${endFrame}}${text}${eol}`;
            continue;
        }

        if (options.verbose) {
            console.log("SKIP:", caption);
        }
    }

    return sub;
};

/**
 * Detects whether the content is in MicroDVD format.
 * @param content - The subtitle content
 * @returns Whether it's MicroDVD format
 */
const detect = (content: string) => {
    /*
    {7207}{7262}Sister, perfume?
    */
    return /^\{\d+\}\{\d+\}.*/.test(content);
};

export default buildHandler({ name: FORMAT_NAME, build, detect, parse });
export { FORMAT_NAME as name, build, detect, parse };

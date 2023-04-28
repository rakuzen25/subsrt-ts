import { buildHandler } from "../handler.js";
import { BuildOptions, Caption, ContentCaption, ParseOptions } from "../types/handler.js";

const FORMAT_NAME = "srt";

const helper = {
    /**
     * Converts a time string in format of hh:mm:ss, hh:mm:ss.sss or hh:mm:ss,sss to milliseconds.
     * @param s The time string to convert
     * @throws {TypeError} If the time string is invalid
     * @returns Milliseconds
     */
    toMilliseconds: (s: string) => {
        const match = /^\s*(\d{1,2}):(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?\s*$/.exec(s);
        if (!match) {
            throw new TypeError(`Invalid time format: ${s}`);
        }
        const hh = parseInt(match[1], 10);
        const mm = parseInt(match[2], 10);
        const ss = parseInt(match[3], 10);
        const ff = match[4] ? parseInt(match[4], 10) : 0;
        const ms = hh * 3600 * 1000 + mm * 60 * 1000 + ss * 1000 + ff;
        return ms;
    },
    /**
     * Converts milliseconds to a time string in format of hh:mm:ss,sss.
     * @param ms Milliseconds
     * @returns Time string in format of hh:mm:ss,sss
     */
    toTimeString: (ms: number) => {
        const hh = Math.floor(ms / 1000 / 3600);
        const mm = Math.floor((ms / 1000 / 60) % 60);
        const ss = Math.floor((ms / 1000) % 60);
        const ff = Math.floor(ms % 1000);
        const time = `${(hh < 10 ? "0" : "") + hh}:${mm < 10 ? "0" : ""}${mm}:${ss < 10 ? "0" : ""}${ss},${ff < 100 ? "0" : ""}${
            ff < 10 ? "0" : ""
        }${ff}`;
        return time;
    },
};

/**
 * Parses captions in SubRip format (.srt).
 * @param content The subtitle content
 * @param options Parse options
 * @returns Parsed captions
 */
const parse = (content: string, options: ParseOptions) => {
    const captions = [];
    const eol = options.eol || "\r\n";
    const parts = content.split(/\r?\n\s*\n/g);
    for (const part of parts) {
        const regex = /^(\d+)\r?\n(\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\s*-->\s*(\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\r?\n([\s\S]*)$/;
        const match = regex.exec(part);
        if (match) {
            const caption = <ContentCaption>{};
            caption.type = "caption";
            caption.index = parseInt(match[1], 10);
            caption.start = helper.toMilliseconds(match[2]);
            caption.end = helper.toMilliseconds(match[3]);
            caption.duration = caption.end - caption.start;
            const lines = match[4].split(/\r?\n/);
            caption.content = lines.join(eol);
            caption.text = caption.content
                .replace(/<[^>]+>/g, "") // <b>bold</b> or <i>italic</i>
                .replace(/\{[^}]+\}/g, "") // {b}bold{/b} or {i}italic{/i}
                .replace(/>>[^:]*:\s*/g, ""); // >> SPEAKER NAME:
            captions.push(caption);
            continue;
        }

        if (options.verbose) {
            console.warn("Unknown part", part);
        }
    }
    return captions;
};

/**
 * Builds captions in SubRip format (.srt).
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in SubRip format
 */
const build = (captions: Caption[], options: BuildOptions) => {
    let srt = "";
    const eol = options.eol || "\r\n";
    for (let i = 0; i < captions.length; i++) {
        const caption = captions[i];
        if (!caption.type || caption.type === "caption") {
            srt += (i + 1).toString() + eol;
            srt += `${helper.toTimeString(caption.start)} --> ${helper.toTimeString(caption.end)}${eol}`;
            srt += caption.text + eol;
            srt += eol;
            continue;
        }
        if (options.verbose) {
            console.log("SKIP:", caption);
        }
    }

    return srt;
};

/**
 * Detects whether the content is in SubRip format.
 * @param content The subtitle content
 * @returns Whether the content is in SubRip format
 */
const detect = (content: string) => {
    /*
    3
    00:04:48,280 --> 00:04:50,510
    Sister, perfume?
    */
    return /\d+\r?\n\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?\s*-->\s*\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?/.test(content);
};

export default buildHandler({ name: FORMAT_NAME, build, detect, helper, parse });
export { FORMAT_NAME as name, build, detect, helper, parse };

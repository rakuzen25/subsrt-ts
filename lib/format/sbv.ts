import { buildHandler } from "../handler.js";
import { BuildOptions, Caption, ContentCaption, ParseOptions } from "../types/handler.js";

const FORMAT_NAME = "sbv";

const helper = {
    /**
     * Converts a time string in format of hh:mm:ss.sss or hh:mm:ss,sss to milliseconds.
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
     * Converts milliseconds to a time string in format of hh:mm:ss.sss.
     * @param ms Milliseconds
     * @returns Time string in format of hh:mm:ss.sss
     */
    toTimeString: (ms: number) => {
        const hh = Math.floor(ms / 1000 / 3600);
        const mm = Math.floor((ms / 1000 / 60) % 60);
        const ss = Math.floor((ms / 1000) % 60);
        const ff = Math.floor(ms % 1000);
        const time = `${(hh < 10 ? "0" : "") + hh}:${mm < 10 ? "0" : ""}${mm}:${ss < 10 ? "0" : ""}${ss}.${ff < 100 ? "0" : ""}${
            ff < 10 ? "0" : ""
        }${ff}`;
        return time;
    },
};

/**
 * Parses captions in SubViewer format (.sbv).
 * @param content The subtitle content
 * @param options Parse options
 * @returns Parsed captions
 */
const parse = (content: string, options: ParseOptions) => {
    const captions = [];
    const eol = options.eol || "\r\n";
    const parts = content.split(/\r?\n\s*\n/);
    for (const part of parts) {
        const regex = /^(\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\s*[,;]\s*(\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\r?\n([\s\S]*)$/;
        const match = regex.exec(part);
        if (match) {
            const caption = <ContentCaption>{};
            caption.type = "caption";
            caption.start = helper.toMilliseconds(match[1]);
            caption.end = helper.toMilliseconds(match[2]);
            caption.duration = caption.end - caption.start;
            const lines = match[3].split(/\[br\]|\r?\n/gi);
            caption.content = lines.join(eol);
            caption.text = caption.content.replace(/>>[^:]+:\s*/g, ""); // >> SPEAKER NAME:
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
 * Builds captions in SubViewer format (.sbv).
 * @param captions The captions to build
 * @param options Build options
 * @returns The built captions string in SubViewer format
 */
const build = (captions: Caption[], options: BuildOptions) => {
    let content = "";
    const eol = options.eol || "\r\n";
    for (const caption of captions) {
        if (!caption.type || caption.type === "caption") {
            content += `${helper.toTimeString(caption.start)},${helper.toTimeString(caption.end)}${eol}`;
            content += caption.text + eol;
            content += eol;
            continue;
        }
        if (options.verbose) {
            console.log("SKIP:", caption);
        }
    }

    return content;
};

/**
 * Detects whether the content is in SubViewer format.
 * @param content The subtitle content
 * @returns Whether the subtitle format is SubViewer
 */
const detect = (content: string) => {
    /*
    00:04:48.280,00:04:50.510
    Sister, perfume?
    */
    return /\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?\s*[,;]\s*\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?/.test(content);
};

export default buildHandler({ name: FORMAT_NAME, build, detect, helper, parse });
export { FORMAT_NAME as name, build, detect, helper, parse };

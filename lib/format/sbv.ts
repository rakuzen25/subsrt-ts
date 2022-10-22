import { buildHandler } from "../handler.js";
import { BuildOptions, Caption, ContentCaption, ParseOptions } from "../types/handler.js";

const FORMAT_NAME = "sbv";

const helper = {
    toMilliseconds: (s: string) => {
        const match = /^\s*(\d{1,2}):(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?\s*$/.exec(s);
        if (!match) {
            throw new Error(`Invalid time format: ${s}`);
        }
        const hh = parseInt(match[1]);
        const mm = parseInt(match[2]);
        const ss = parseInt(match[3]);
        const ff = match[4] ? parseInt(match[4]) : 0;
        const ms = hh * 3600 * 1000 + mm * 60 * 1000 + ss * 1000 + ff;
        return ms;
    },
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
 */
const parse = (content: string, options: ParseOptions) => {
    const captions = [];
    const eol = options.eol || "\r\n";
    const parts = content.split(/\r?\n\s*\n/);
    for (let i = 0; i < parts.length; i++) {
        const regex = /^(\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\s*[,;]\s*(\d{1,2}:\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\r?\n([\s\S]*)$/;
        const match = regex.exec(parts[i]);
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
            console.log("WARN: Unknown part", parts[i]);
        }
    }
    return captions;
};

/**
 * Builds captions in SubViewer format (.sbv).
 */
const build = (captions: Caption[], options: BuildOptions) => {
    let content = "";
    const eol = options.eol || "\r\n";
    for (let i = 0; i < captions.length; i++) {
        const caption = captions[i];
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
 * Detects a subtitle format from the content.
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

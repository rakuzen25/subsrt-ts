import { buildHandler } from "../handler.js";
import { BuildOptions, Caption, ContentCaption, MetaCaption, ParseOptions } from "../types/handler.js";

const FORMAT_NAME = "lrc";

const helper = {
    toMilliseconds: (s: string) => {
        const match = /^\s*(\d+):(\d{1,2})(?:[.,](\d{1,3}))?\s*$/.exec(s);
        if (!match) {
            throw new Error(`Invalid time format: ${s}`);
        }
        const mm = parseInt(match[1]);
        const ss = parseInt(match[2]);
        const ff = match[3] ? parseInt(match[3]) : 0;
        const ms = mm * 60 * 1000 + ss * 1000 + ff * 10;
        return ms;
    },
    toTimeString: (ms: number) => {
        const mm = Math.floor(ms / 1000 / 60);
        const ss = Math.floor((ms / 1000) % 60);
        const ff = Math.floor(ms % 1000);
        const time = `${(mm < 10 ? "0" : "") + mm}:${ss < 10 ? "0" : ""}${ss}.${ff < 100 ? "0" : ""}${ff < 10 ? "0" : Math.floor(ff / 10)}`;
        return time;
    },
};

/**
 * Parses captions in LRC format.
 * @see https://en.wikipedia.org/wiki/LRC_%28file_format%29
 */
const parse = (content: string, options: ParseOptions) => {
    let prev = null;
    const captions = [];
    // const eol = options.eol || "\r\n";
    const parts = content.split(/\r?\n/);
    for (const part of parts) {
        if (!part || part.trim().length === 0) {
            continue;
        }

        // LRC content
        const regex = /^\[(\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\](.*)(?:\r?\n)*$/;
        const match = regex.exec(part);
        if (match) {
            const caption = <ContentCaption>{};
            caption.type = "caption";
            caption.start = helper.toMilliseconds(match[1]);
            caption.end = caption.start + 2000;
            caption.duration = caption.end - caption.start;
            caption.content = match[2];
            caption.text = caption.content;
            captions.push(caption);

            // Update previous
            if (prev) {
                prev.end = caption.start;
                prev.duration = prev.end - prev.start;
            }
            prev = caption;
            continue;
        }

        // LRC meta
        const meta = /^\[(\w+):([^\]]*)\](?:\r?\n)*$/.exec(part);
        if (meta) {
            const caption = <MetaCaption>{};
            caption.type = "meta";
            caption.tag = meta[1];
            if (meta[2]) {
                caption.data = meta[2];
            }
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
 * Builds captions in LRC format
 * @see https://en.wikipedia.org/wiki/LRC_%28file_format%29
 */
const build = (captions: Caption[], options: BuildOptions) => {
    let content = "";
    let lyrics = false;
    const eol = options.eol || "\r\n";
    for (const caption of captions) {
        if (caption.type === "meta") {
            if (caption.tag && caption.data && typeof caption.data === "string") {
                content += `[${caption.tag}:${caption.data.replace(/[\r\n]+/g, " ")}]${eol}`;
            }
            continue;
        }

        if (!caption.type || caption.type === "caption") {
            if (!lyrics) {
                content += eol; //New line when lyrics start
                lyrics = true;
            }
            content += `[${helper.toTimeString(caption.start)}]${caption.text}${eol}`;
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
    [04:48.28]Sister, perfume?
    */
    return /\r?\n\[\d+:\d{1,2}(?:[.,]\d{1,3})?\].*\r?\n/.test(content);
};

export default buildHandler({ name: FORMAT_NAME, build, detect, helper, parse });
export { FORMAT_NAME as name, build, detect, helper, parse };

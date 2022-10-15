const FORMAT_NAME = "srt";

const helper = {
    toMilliseconds: (s) => {
        const match = /^\s*(\d{1,2}):(\d{1,2}):(\d{1,2})([.,](\d{1,3}))?\s*$/.exec(s);
        const hh = parseInt(match[1]);
        const mm = parseInt(match[2]);
        const ss = parseInt(match[3]);
        const ff = match[5] ? parseInt(match[5]) : 0;
        const ms = hh * 3600 * 1000 + mm * 60 * 1000 + ss * 1000 + ff;
        return ms;
    },
    toTimeString: (ms) => {
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
 */
const parse = (content, options) => {
    const captions = [];
    const eol = options.eol || "\r\n";
    const parts = content.split(/\r?\n\s+\r?\n/g);
    for (let i = 0; i < parts.length; i++) {
        const regex = /^(\d+)\r?\n(\d{1,2}:\d{1,2}:\d{1,2}([.,]\d{1,3})?)\s*-->\s*(\d{1,2}:\d{1,2}:\d{1,2}([.,]\d{1,3})?)\r?\n([\s\S]*)(\r?\n)*$/gi;
        const match = regex.exec(parts[i]);
        if (match) {
            const caption = {};
            caption.type = "caption";
            caption.index = parseInt(match[1]);
            caption.start = helper.toMilliseconds(match[2]);
            caption.end = helper.toMilliseconds(match[4]);
            caption.duration = caption.end - caption.start;
            const lines = match[6].split(/\r?\n/);
            caption.content = lines.join(eol);
            caption.text = caption.content
                .replace(/<[^>]+>/g, "") //<b>bold</b> or <i>italic</i>
                .replace(/\{[^}]+}/g, "") //{b}bold{/b} or {i}italic{/i}
                .replace(/>>\s*[^:]*:\s*/g, ""); //>> SPEAKER NAME:
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
 * Builds captions in SubRip format (.srt).
 */
const build = (captions, options) => {
    let srt = "";
    const eol = options.eol || "\r\n";
    for (let i = 0; i < captions.length; i++) {
        const caption = captions[i];
        if (typeof caption.type === "undefined" || caption.type === "caption") {
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
 * Detects a subtitle format from the content.
 */
const detect = (content) => {
    if (typeof content === "string") {
        if (/\d+\r?\n\d{1,2}:\d{1,2}:\d{1,2}([.,]\d{1,3})?\s*-->\s*\d{1,2}:\d{1,2}:\d{1,2}([.,]\d{1,3})?/g.test(content)) {
            /*
      3
      00:04:48,280 --> 00:04:50,510
      Sister, perfume?
      */
            return FORMAT_NAME;
        }
    }
};

export { FORMAT_NAME as name, build, detect, helper, parse };

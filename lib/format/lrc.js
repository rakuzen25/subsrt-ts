const FORMAT_NAME = "lrc";

const helper = {
    toMilliseconds: (s) => {
        const match = /^\s*(\d+):(\d{1,2})([.,](\d{1,3}))?\s*$/.exec(s);
        const mm = parseInt(match[1]);
        const ss = parseInt(match[2]);
        const ff = match[4] ? parseInt(match[4]) : 0;
        const ms = mm * 60 * 1000 + ss * 1000 + ff * 10;
        return ms;
    },
    toTimeString: (ms) => {
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
const parse = (content, options) => {
    let prev = null;
    const captions = [];
    // const eol = options.eol || "\r\n";
    const parts = content.split(/\r?\n/);
    for (let i = 0; i < parts.length; i++) {
        if (!parts[i] || parts[i].trim().length === 0) {
            continue;
        }

        //LRC content
        const regex = /^\[(\d{1,2}:\d{1,2}([.,]\d{1,3})?)\](.*)(\r?\n)*$/gi;
        const match = regex.exec(parts[i]);
        if (match) {
            const caption = {};
            caption.type = "caption";
            caption.start = helper.toMilliseconds(match[1]);
            caption.end = caption.start + 2000;
            caption.duration = caption.end - caption.start;
            caption.content = match[3];
            caption.text = caption.content;
            captions.push(caption);

            //Update previous
            if (prev) {
                prev.end = caption.start;
                prev.duration = prev.end - prev.start;
            }
            prev = caption;
            continue;
        }

        //LRC meta
        const meta = /^\[([\w\d]+):([^\]]*)\](\r?\n)*$/gi.exec(parts[i]);
        if (meta) {
            const caption = {};
            caption.type = "meta";
            caption.tag = meta[1];
            if (meta[2]) {
                caption.data = meta[2];
            }
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
 * Builds captions in LRC format
 * @see https://en.wikipedia.org/wiki/LRC_%28file_format%29
 */
const build = (captions, options) => {
    let content = "";
    let lyrics = false;
    const eol = options.eol || "\r\n";
    for (let i = 0; i < captions.length; i++) {
        const caption = captions[i];
        if (caption.type === "meta") {
            if (caption.tag && caption.data) {
                content += `[${caption.tag}:${caption.data.replace(/[\r\n]+/g, " ")}]${eol}`;
            }
            continue;
        }

        if (typeof caption.type === "undefined" || caption.type === "caption") {
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
const detect = (content) => {
    if (typeof content === "string") {
        if (/\r?\n\[\d+:\d{1,2}(?:[.,]\d{1,3})?\].*\r?\n/.test(content)) {
            /*
                [04:48.28]Sister, perfume?
            */
            //return "lrc";
            return true;
        }
    }
};

export { FORMAT_NAME as name, build, detect, helper, parse };

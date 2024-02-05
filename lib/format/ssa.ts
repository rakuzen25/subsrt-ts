import { buildHandler } from "../handler.js";
import { BuildOptions, Caption, ContentCaption, MetaCaption, ParseOptions, StyleCaption } from "../types/handler.js";

const FORMAT_NAME = "ssa";

const helper = {
    /**
     * Converts a time string in format of hh:mm:ss.fff or hh:mm:ss,fff to milliseconds.
     * @param s - The time string to convert
     * @throws TypeError If the time string is invalid
     * @returns Milliseconds
     */
    toMilliseconds: (s: string) => {
        const match = /^\s*(\d+:)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?\s*$/.exec(s);
        if (!match) {
            throw new TypeError(`Invalid time format: ${s}`);
        }
        const hh = match[1] ? parseInt(match[1].replace(":", "")) : 0;
        const mm = parseInt(match[2], 10);
        const ss = parseInt(match[3], 10);
        const ff = match[4] ? parseInt(match[4], 10) : 0;
        const ms = hh * 3600 * 1000 + mm * 60 * 1000 + ss * 1000 + ff * 10;
        return ms;
    },
    /**
     * Converts milliseconds to a time string in format of hh:mm:ss.fff.
     * @param ms - Milliseconds
     * @returns Time string in format of hh:mm:ss.fff
     */
    toTimeString: (ms: number) => {
        const hh = Math.floor(ms / 1000 / 3600);
        const mm = Math.floor((ms / 1000 / 60) % 60);
        const ss = Math.floor((ms / 1000) % 60);
        const ff = Math.floor((ms % 1000) / 10); // 2 digits
        const time = `${hh}:${mm < 10 ? "0" : ""}${mm}:${ss < 10 ? "0" : ""}${ss}.${ff < 10 ? "0" : ""}${ff}`;
        return time;
    },
};

/**
 * Internal helper function for building caption data.
 * @param columns - Columns
 * @param values - Values
 * @returns Caption data
 * @internal
 */
const _buildCaptionData = (columns: string[], values: string[]) => {
    const data: Record<string, string> = {};
    for (let c = 0; c < columns.length && c < values.length; c++) {
        data[columns[c]] = values[c];
    }
    return data;
};

/**
 * Parses captions in SubStation Alpha format (.ssa).
 * @param content - The subtitle content
 * @param options - Parse options
 * @throws TypeError If the meta data is in invalid format
 * @returns Parsed captions
 */
const parse = (content: string, options: ParseOptions) => {
    let meta;
    let columns = null;
    const captions = [];
    const eol = options.eol ?? "\r\n";
    const parts = content.split(/\r?\n\s*\n/);
    for (const part of parts) {
        const regex = /^\s*\[([^\]]+)\]\r?\n([\s\S]*)$/;
        const match = regex.exec(part);
        if (!match) {
            if (options.verbose) {
                console.warn("Unknown part", part);
            }
            continue;
        }

        const tag = match[1];
        const lines = match[2].split(/\r?\n/);
        for (const line of lines) {
            if (/^\s*;/.test(line)) {
                continue; // Skip comment
            }
            // FIXME: prevent backtracking
            // eslint-disable-next-line regexp/no-super-linear-backtracking
            const lineMatch = /^\s*([^\s:]+):\s*(.*)$/.exec(line);
            if (!lineMatch) {
                continue;
            }
            if (tag === "Script Info") {
                if (!meta) {
                    meta = {} as MetaCaption;
                    meta.type = "meta";
                    meta.data = {};
                    captions.push(meta);
                }
                if (typeof meta.data === "object") {
                    const name = lineMatch[1].trim();
                    const value = lineMatch[2].trim();
                    meta.data[name] = value;
                }
            } else if (tag === "V4 Styles" || tag === "V4+ Styles") {
                const name = lineMatch[1].trim();
                const value = lineMatch[2].trim();
                if (name === "Format") {
                    columns = value.split(/\s*,\s*/);
                } else if (name === "Style" && columns) {
                    const values = value.split(/\s*,\s*/);
                    const caption = {} as StyleCaption;
                    caption.type = "style";
                    caption.data = _buildCaptionData(columns, values);
                    captions.push(caption);
                }
            } else if (tag === "Events") {
                const name = lineMatch[1].trim();
                const value = lineMatch[2].trim();
                if (name === "Format") {
                    columns = value.split(/\s*,\s*/);
                } else if (name === "Dialogue" && columns) {
                    const values = value.split(/\s*,\s*/);
                    const caption = {} as ContentCaption;
                    caption.type = "caption";
                    caption.data = _buildCaptionData(columns, values);
                    caption.start = helper.toMilliseconds(caption.data.Start);
                    caption.end = helper.toMilliseconds(caption.data.End);
                    caption.duration = caption.end - caption.start;
                    caption.content = caption.data.Text;

                    // Work-around for missing text (when the text contains ',' char)
                    const indexOfText = value.split(",", columns.length - 1).join(",").length + 1 + 1;
                    caption.content = value.substring(indexOfText);
                    caption.data.Text = caption.content;

                    caption.text = caption.content
                        .replace(/\\N/g, eol) // "\N" for new line
                        .replace(/\{[^}]+\}/g, ""); // {\pos(400,570)}
                    captions.push(caption);
                }
            }
        }
    }
    return captions;
};

/**
 * Builds captions in SubStation Alpha format (.ssa).
 * @param captions - The captions to build
 * @param options - Build options
 * @returns The built captions string in SubStation Alpha format
 */
const build = (captions: Caption[], options: BuildOptions) => {
    const eol = options.eol ?? "\r\n";
    const ass = options.format === "ass";

    let content = "";
    content += `[Script Info]${eol}`;
    content += `; Script generated by subsrt ${eol}`;
    content += `ScriptType: v4.00${ass ? "+" : ""}${eol}`;
    content += `Collisions: Normal${eol}`;
    content += eol;
    if (ass) {
        content += `[V4+ Styles]${eol}`;
        content += `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding${eol}`;
        content += `Style: DefaultVCD, Arial,28,&H00B4FCFC,&H00B4FCFC,&H00000008,&H80000008,-1,0,0,0,100,100,0.00,0.00,1,1.00,2.00,2,30,30,30,0${eol}`;
    } else {
        content += `[V4 Styles]${eol}`;
        content += `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, TertiaryColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, AlphaLevel, Encoding${eol}`;
        content += `Style: DefaultVCD, Arial,28,11861244,11861244,11861244,-2147483640,-1,0,1,1,2,2,30,30,30,0,0${eol}`;
    }
    content += eol;
    content += `[Events]${eol}`;
    content += `Format: ${ass ? "Layer" : "Marked"}, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text${eol}`;

    for (const caption of captions) {
        if (caption.type === "meta") {
            continue;
        }

        if (!caption.type || caption.type === "caption") {
            content += `Dialogue: ${ass ? "0" : "Marked=0"},${helper.toTimeString(caption.start)},${helper.toTimeString(
                caption.end,
            )},DefaultVCD, NTP,0000,0000,0000,,${caption.text.replace(/\r?\n/g, "\\N")}${eol}`;
            continue;
        }

        if (options.verbose) {
            console.log("SKIP:", caption);
        }
    }

    return content;
};

/**
 * Detects whether the content is in ASS or SSA format.
 * @param content - The subtitle content
 * @returns Whether the content is in "ass", "ssa" or neither
 */
const detect = (content: string) => {
    if (/^\s*\[Script Info\]\r?\n/.test(content) && /\s*\[Events\]\r?\n/.test(content)) {
        /*
        [Script Info]
        ...
        [Events]
        */
        // Advanced (V4+) styles for ASS format
        return content.indexOf("[V4+ Styles]") > 0 ? "ass" : "ssa";
    }
    return false;
};

export default buildHandler({ name: FORMAT_NAME, build, detect, helper, parse });
export { FORMAT_NAME as name, build, detect, helper, parse };

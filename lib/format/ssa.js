const FORMAT_NAME = "ssa";

const helper = {
    toMilliseconds: (s) => {
        const match = /^\s*(\d+:)?(\d{1,2}):(\d{1,2})([.,](\d{1,3}))?\s*$/.exec(s);
        const hh = match[1] ? parseInt(match[1].replace(":", "")) : 0;
        const mm = parseInt(match[2]);
        const ss = parseInt(match[3]);
        const ff = match[5] ? parseInt(match[5]) : 0;
        const ms = hh * 3600 * 1000 + mm * 60 * 1000 + ss * 1000 + ff * 10;
        return ms;
    },
    toTimeString: (ms) => {
        const hh = Math.floor(ms / 1000 / 3600);
        const mm = Math.floor((ms / 1000 / 60) % 60);
        const ss = Math.floor((ms / 1000) % 60);
        const ff = Math.floor((ms % 1000) / 10); //2 digits
        const time = `${hh}:${mm < 10 ? "0" : ""}${mm}:${ss < 10 ? "0" : ""}${ss}.${ff < 10 ? "0" : ""}${ff}`;
        return time;
    },
};

/**
 * Parses captions in SubStation Alpha format (.ssa).
 */
const parse = (content, options) => {
    let meta;
    let columns = null;
    const captions = [];
    const eol = options.eol || "\r\n";
    const parts = content.split(/\r?\n\s*\r?\n/);
    for (let i = 0; i < parts.length; i++) {
        const regex = /^\s*\[([^\]]+)\]\r?\n([\s\S]*)(\r?\n)*$/gi;
        const match = regex.exec(parts[i]);
        if (match) {
            const tag = match[1];
            const lines = match[2].split(/\r?\n/);
            for (let l = 0; l < lines.length; l++) {
                const line = lines[l];
                if (/^\s*;/.test(line)) {
                    continue; //Skip comment
                }
                const m = /^\s*([^:]+):\s*(.*)(\r?\n)?$/.exec(line);
                if (m) {
                    if (tag === "Script Info") {
                        if (!meta) {
                            meta = {};
                            meta.type = "meta";
                            meta.data = {};
                            captions.push(meta);
                        }
                        const name = m[1].trim();
                        const value = m[2].trim();
                        meta.data[name] = value;
                        continue;
                    }
                    if (tag === "V4 Styles" || tag === "V4+ Styles") {
                        const name = m[1].trim();
                        const value = m[2].trim();
                        if (name === "Format") {
                            columns = value.split(/\s*,\s*/g);
                            continue;
                        }
                        if (name === "Style") {
                            const values = value.split(/\s*,\s*/g);
                            const caption = {};
                            caption.type = "style";
                            caption.data = {};
                            for (let c = 0; c < columns.length && c < values.length; c++) {
                                caption.data[columns[c]] = values[c];
                            }
                            captions.push(caption);
                            continue;
                        }
                    }
                    if (tag === "Events") {
                        const name = m[1].trim();
                        const value = m[2].trim();
                        if (name === "Format") {
                            columns = value.split(/\s*,\s*/g);
                            continue;
                        }
                        if (name === "Dialogue") {
                            const values = value.split(/\s*,\s*/g);
                            const caption = {};
                            caption.type = "caption";
                            caption.data = {};
                            for (let c = 0; c < columns.length && c < values.length; c++) {
                                caption.data[columns[c]] = values[c];
                            }
                            caption.start = helper.toMilliseconds(caption.data.Start);
                            caption.end = helper.toMilliseconds(caption.data.End);
                            caption.duration = caption.end - caption.start;
                            caption.content = caption.data.Text;

                            //Work-around for missing text (when the text contains ',' char)
                            const getPosition = (s, search, index) => {
                                return s.split(search, index).join(search).length;
                            };

                            const indexOfText = getPosition(value, ",", columns.length - 1) + 1;
                            caption.content = value.substr(indexOfText);
                            caption.data.Text = caption.content;

                            caption.text = caption.content
                                .replace(/\\N/g, eol) //"\N" for new line
                                .replace(/\{[^}]+\}/g, ""); //{\pos(400,570)}
                            captions.push(caption);
                            continue;
                        }
                    }
                }
            }
        }

        if (options.verbose) {
            console.log("WARN: Unknown part", parts[i]);
        }
    }
    return captions;
};

/**
 * Builds captions in SubStation Alpha format (.ssa).
 */
const build = (captions, options) => {
    const eol = options.eol || "\r\n";
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

    for (let i = 0; i < captions.length; i++) {
        const caption = captions[i];
        if (caption.type === "meta") {
            continue;
        }

        if (typeof caption.type === "undefined" || caption.type === "caption") {
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
 * Detects a subtitle format from the content.
 */
const detect = (content) => {
    if (typeof content !== "string") {
        throw new Error("Expected string content!");
    }

    if (/^[\s\r\n]*\[Script Info\]\r?\n/g.test(content) && /[\s\r\n]*\[Events\]\r?\n/g.test(content)) {
        /*
    [Script Info]
    ...
    [Events]
    */

        //Advanced (V4+) styles for ASS format
        return content.indexOf("[V4+ Styles]") > 0 ? "ass" : "ssa";
    }
};

export { FORMAT_NAME as name, build, detect, helper, parse };

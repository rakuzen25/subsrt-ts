import { readFileSync, writeFileSync } from "fs";
import { extname } from "path";

// eslint-disable-next-line import/no-unresolved
import { build as _build, convert as _convert, detect as _detect, list as _list, parse as _parse } from "./dist/subsrt.js";

const config = {
    verbose: process.env.NODE_VERBOSE === "true" || process.env.NODE_VERBOSE === "1",
};

// Command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case "list":
        case "parse":
        case "build":
        case "detect":
        case "resync":
        case "convert":
            if (config.command) {
                console.error(`Cannot run more than one command: ${args[i]}`);
                process.exit(1);
            }
            config.command = args[i];
            break;

        case "--eol":
            config.eol = args[++i];
            if (config.eol) {
                config.eol = config.eol.replace(/\\r/g, "\r").replace(/\\n/g, "\n");
            }
            break;

        case "--fps": {
            let fps = args[++i];
            if (fps.indexOf("-") > 0) {
                fps = fps.split("-");
                config.fpsFrom = parseFloat(fps[0]);
                config.fpsTo = parseFloat(fps[1]);
            } else {
                config.fps = parseFloat(fps);
            }
            break;
        }

        case "--offset":
            config.offset = parseInt(args[++i]);
            break;

        case "--format":
            config.format = args[++i];
            break;

        case "--help":
            help();
            process.exit(0);
            break;

        case "--verbose":
            config.verbose = true;
            break;

        case "--version":
            console.log((await import("./package.json")).version);
            process.exit(0);
            break;

        default:
            if (!config.src) {
                config.src = args[i];
                continue;
            }
            if (!config.dst) {
                config.dst = args[i];
                continue;
            }
            console.error(`Unknown command line argument: ${args[i]}`);
            process.exit(1);
            break;
    }
}

// Prints help message
const help = () => {
    console.log("Usage:");
    console.log("  subsrt [command] [options]");
    console.log("");
    console.log("Commands:");
    console.log("  list                   List supported formats");
    console.log("  parse [src] [json]     Parse a subtitle file");
    console.log("  build [json] [dst]     Create a subtitle file from captions");
    console.log("  detect [src]           Detect subtitle file format, if supported");
    console.log("  resync [src] [dst]     Resync FPS or shift time (+/- offset)");
    console.log("  convert [src] [dst]    Converts a subtitle format");
    console.log("");
    console.log("Options:");
    console.log("  --help                 Print this message");
    console.log("  --eol [chars]          End of line chars, e.g. \\r\\n");
    console.log("  --fps [fps]            Frames per second for .sub format");
    console.log("  --offset [time]        Resync time shift offset in ms");
    console.log("  --format [ext]         Subtitle format to convert/build/parse");
    console.log("  --verbose              Enable detailed logging");
    console.log("  --version              Print version number");
    console.log("");
    console.log("Examples:");
    console.log("  subsrt parse sample.sbv");
    console.log("  subsrt parse sample.srt output.json");
    console.log("  subsrt parse sample.sub --fps 30");
    console.log("  subsrt build input.json output.vtt");
    console.log("  subsrt build input.json --format sbv");
    console.log("  subsrt detect unknown.txt");
    console.log("  subsrt convert sample.srt sample.vtt");
    console.log("  subsrt convert --offset -250 sample.srt sample.ssa");
    console.log("  subsrt resync --offset +3000 input.srt output.srt");
    console.log("  subsrt resync --fps 25-30 input.sub output.sub");
};

const commands = {
    list: () => {
        console.log(_list().join(", "));
    },
    parse: () => {
        const content = readFileSync(config.src, "utf8");

        const options = {
            verbose: config.verbose,
        };
        if (config.fps) {
            options.fps = config.fps;
        }

        const captions = _parse(content, options);
        const json = JSON.stringify(captions, " ", 2);
        if (config.dst) {
            writeFileSync(config.dst, json);
        } else {
            console.log(json);
        }
    },
    build: () => {
        const json = readFileSync(config.src, "utf8");
        const captions = JSON.parse(json);
        if (!config.format && config.dst) {
            const ext = extname(config.dst);
            config.format = ext.replace(/\./, "").toLowerCase();
        }

        const options = {
            verbose: config.verbose,
            format: config.format,
        };
        if (config.fps) {
            options.fps = config.fps;
        }
        if (config.eol) {
            options.eol = config.eol;
        }

        const content = _build(captions, options);
        if (config.dst) {
            writeFileSync(config.dst, content);
        } else {
            console.log(content);
        }
    },
    detect: () => {
        const content = readFileSync(config.src, "utf8");
        const format = _detect(content);
        console.log(format || "unknown");
    },
    resync: () => {
        const options = {};
        if (config.offset) {
            options.offset = config.offset;
        }
        if (config.fpsFrom && config.fpsTo) {
            options.ratio = config.fpsTo / config.fpsFrom;
            options.frame = true;
        }
        if (config.fps) {
            options.fps = config.fps;
        }
        if (config.fpsFrom) {
            options.fps = config.fpsFrom;
            options.frame = true;
        }
        config.resync = options;
        commands.convert();
    },
    convert: () => {
        const content = readFileSync(config.src, "utf8");
        if (!config.format && config.dst) {
            const ext = extname(config.dst);
            config.format = ext.replace(/\./, "").toLowerCase();
        }

        const options = {
            verbose: config.verbose,
            format: config.format,
        };
        if (config.fps) {
            options.fps = config.fps;
        }
        if (config.eol) {
            options.eol = config.eol;
        }
        if (config.resync) {
            options.resync = config.resync;
        }

        const converted = _convert(content, options);
        if (config.dst) {
            writeFileSync(config.dst, converted);
        } else {
            console.log(converted);
        }
    },
};

const func = commands[config.command];
if (typeof func === "function") {
    func();
} else {
    help();
}

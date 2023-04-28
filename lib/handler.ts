import { BaseHandler, BuildFunction, DetectFunction, Helper, ParseFunction, ParseOptions } from "./types/handler.js";

/**
 * Handler class.
 */
export class Handler implements BaseHandler {
    name: string;
    helper?: Helper;
    build: BuildFunction;
    detect: DetectFunction;
    parse: ParseFunction;
    constructor({ name, build, detect, helper, parse }: BaseHandler) {
        this.name = name;
        this.helper = helper;
        this.build = build;
        this.detect = (content: string) => {
            if (typeof content !== "string") {
                throw new Error("Expected string content!");
            }

            return detect(content);
        };
        this.parse = (content: string, _options: ParseOptions) => {
            if (typeof content !== "string") {
                throw new Error("Expected string content!");
            }

            return parse(content, _options);
        };
    }
}

/**
 * Build a handler
 * @param args The handler properties
 * @returns The handler
 */
export const buildHandler = (args: BaseHandler) => {
    return new Handler(args);
};

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

    /**
     * Creates a new handler.
     * @param args - The handler properties (`name`, `build`, `detect`, `helper` and `parse`)
     * @see
     * - {@link BaseHandler}
     * - {@link BuildFunction}
     * - {@link DetectFunction}
     * - {@link Helper}
     * - {@link ParseFunction}
     * - {@link ParseOptions}
     * @example
     * ```ts
     * const handler = new Handler({
     *     name: "ext",
     *     build: (captions: Caption[], options: BuildOptions): string => {
     *         // ...
     *     },
     *     detect: (content: string): boolean | string => {
     *         // ...
     *     },
     *     parse: (content: string, options: ParseOptions): Caption[] => {
     *         // ...
     *     },
     * });
     * ```
     */
    constructor({ name, build, detect, helper, parse }: BaseHandler) {
        this.name = name;
        this.helper = helper;
        this.build = build;
        this.detect = (content: string) => {
            if (typeof content !== "string") {
                throw new TypeError(`Expected string, got ${typeof content}!`);
            }

            return detect(content);
        };
        this.parse = (content: string, _options: ParseOptions) => {
            if (typeof content !== "string") {
                throw new TypeError(`Expected string, got ${typeof content}!`);
            }

            return parse(content, _options);
        };
    }
}

/**
 * Build a handler.
 * @param args - The handler properties
 * @returns The handler
 * @see {@link Handler}
 */
export const buildHandler = (args: BaseHandler) => {
    return new Handler(args);
};

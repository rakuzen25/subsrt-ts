import { Handler } from "../handler.js";

import { BaseHandler, Caption, ConvertOptions, ResyncOptions } from "./handler";

export type ResyncFunction = (a: number[]) => number[];

export type SubsrtFormats = Record<string, Handler>;

export interface SubsrtInterface extends Omit<BaseHandler, "name" | "helper"> {
    format: SubsrtFormats;
    list: () => string[];
    convert: (content: string, options?: ConvertOptions | string) => string;
    resync: (captions: Caption[], options?: ResyncFunction | number | ResyncOptions) => Caption[];
}

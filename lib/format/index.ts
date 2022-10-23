import { SubsrtFormats } from "../types/subsrt.js";

import ass from "./ass.js";
import json from "./json.js";
import lrc from "./lrc.js";
import sbv from "./sbv.js";
import smi from "./smi.js";
import srt from "./srt.js";
import ssa from "./ssa.js";
import sub from "./sub.js";
import vtt from "./vtt.js";

const formats = <SubsrtFormats>{
    vtt,
    lrc,
    smi,
    ssa,
    ass,
    sub,
    srt,
    sbv,
    json,
};

export default formats;

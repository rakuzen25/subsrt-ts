import { buildHandler } from "../handler.js";

const FORMAT_NAME = "ass";

// Compatible format
import { build, detect, helper, parse } from "./ssa.js";

export default buildHandler({ name: FORMAT_NAME, build, detect, helper, parse });
export { FORMAT_NAME as name, build, detect, helper, parse };

import { execaSync } from "@esm2cjs/execa";

export default function subset(options: string[]) {
  return execaSync("pyftsubset", options);
}

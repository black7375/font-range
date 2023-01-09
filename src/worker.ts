import { execaSync } from "@esm2cjs/execa";

export interface SubsetI {
  options: string[],
  log?:     string
}
export default function subset({options, log = ""}: SubsetI) {
  if(log !== "") {
    console.log(log);
  }
  return execaSync("pyftsubset", options);
}

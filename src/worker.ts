import { execSync } from 'child_process';

export default function subset(options: string) {
  return execSync("pyftsubset" + options);
}

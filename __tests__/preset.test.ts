import { targets } from '../src/main';
import fetch from 'node-fetch';
import commandExists from 'command-exists';

describe("Preset Check", () => {
  it("Target URLs access check", async () => {
    for ( const targetName in targets ) {
      const res = await fetch(targets[targetName]);
      expect(res.status).toBe(200);
    }
  });

  it("Python command check", async () => {
    commandExists("pyftsubset", (err, commandExists) => {
      expect(commandExists).toBe(true);
      if (err) {
        console.log(err);
      }
    });
  });
});

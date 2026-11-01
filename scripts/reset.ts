import fs from "node:fs";
import path from "node:path";

const target = path.join(process.cwd(), ".data", "pglite");
fs.rmSync(target, { recursive: true, force: true });
console.log("Local database removed. It will be recreated and seeded on next start.");

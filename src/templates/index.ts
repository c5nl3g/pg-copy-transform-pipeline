import fs from "node:fs";
import path from "node:path";

export function initTemplate(filename: string, template: string) {
  const target = path.join(process.cwd(), filename);

  if (fs.existsSync(target)) {
    console.log(`${filename} exists, skipped`);
    return;
  }

  fs.writeFileSync(target, template, "utf8");
  console.log(`created ${filename}:${target}`);
}

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const injectiveRangePatch = String.raw`
  // injective/polkachu
  match = sError.match(/maximum \[from, to\] blocks distance: ([\d,.]+)/i);
  if (match !== null) {
    const ranges = chunk({
      params,
      range: BigInt(match[1].replace(/[,.]/g, "")) - 1n,
    });

    if (isRangeUnchanged(params, ranges)) {
      return { shouldRetry: false };
    }

    return {
      shouldRetry: true,
      ranges,
      isSuggestedRange: true,
    };
  }

`;

const targets = ["node_modules/@ponder/utils/dist/index.js"];

for (const relativePath of targets) {
  const filePath = resolve(process.cwd(), relativePath);
  const source = readFileSync(filePath, "utf8");

  if (source.includes("maximum \\[from, to\\] blocks distance")) {
    continue;
  }

  const needle = /(\n\s*return \{\n\s*shouldRetry: false\n\s*\};\n\};)/;
  if (!needle.test(source)) {
    throw new Error(`Unable to find patch anchor in ${relativePath}`);
  }

  writeFileSync(
    filePath,
    source.replace(needle, `${injectiveRangePatch}$1`),
    "utf8",
  );
}

import fs from "node:fs/promises";
import path from "node:path";
import prettier from "prettier";
import repoConfig from "../prettier.config.mjs";

async function main() {
    const [, , inputPath] = process.argv;
    if (!inputPath) {
        console.error("Usage: npm run format:file -- path/to/file.ts");
        process.exit(1);
    }

    const absolutePath = path.resolve(inputPath);
    const source = await fs.readFile(absolutePath, "utf8");

    const formatted = await prettier.format(source, {
        ...repoConfig,
        filepath: absolutePath,
    });

    await fs.writeFile(absolutePath, formatted, "utf8");
    console.info(`Formatted ${absolutePath}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

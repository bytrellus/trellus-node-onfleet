import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const dirs = ["dist/cjs", "dist/esm", "dist/types"];
dirs.forEach((dir) => {
	const fullPath = path.join(rootDir, dir);
	if (!fs.existsSync(fullPath)) {
		fs.mkdirSync(fullPath, { recursive: true });
	}
});

// Create package.json for CJS
fs.writeFileSync(
	path.join(rootDir, "dist/cjs/package.json"),
	JSON.stringify({ type: "commonjs" }, null, 2),
);

// Write package.json for ESM
fs.writeFileSync(
	path.join(rootDir, "dist/esm/package.json"),
	JSON.stringify({ type: "module" }, null, 2),
);

console.log("Package files created successfully");

const fs = require("fs/promises");
const path = require("path");

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function copyDirectory(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      const link = await fs.readlink(srcPath);
      await fs.symlink(link, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  const sourceDir = path.resolve(__dirname, "../src/@types");
  const destinationDir = path.resolve(__dirname, "../dist/@types");

  if (!(await pathExists(sourceDir))) {
    console.warn(`copy-types: source directory not found, skipping (${sourceDir})`);
    return;
  }

  await fs.rm(destinationDir, { recursive: true, force: true });
  await fs.mkdir(path.dirname(destinationDir), { recursive: true });
  await copyDirectory(sourceDir, destinationDir);

  console.log(`copy-types: copied type definitions to ${destinationDir}`);
}

main().catch((error) => {
  console.error("copy-types: failed to copy type definitions");
  console.error(error);
  process.exit(1);
});

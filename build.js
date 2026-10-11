
const fs = require("fs");
const path = require("path");
const { minify: minifyHTML } = require("html-minifier-terser");
const CleanCSS = require("clean-css");
const { minify: minifyJS } = require("terser");

const root = __dirname;
const dist = path.join(root, "dist");

const htmlFiles = [
  "index.html",
  "menu.html",
  "cart.html",
  "checkout.html",
  "success.html",
  "faq.html"
];

const cssFiles = [
  "style.css"
];

// Add standalone JavaScript filenames here if the site uses them.
const jsFiles = [
];

const assetFiles = [
  "logo.png",
  "images"
];

function copyAsset(file) {
  const source = path.join(root, file);
  const destination = path.join(dist, file);

  if (!fs.existsSync(source)) {
    throw new Error(`Required website file missing: ${file}`);
  }

  fs.cpSync(source, destination, { recursive: true });
}

async function build() {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });

  for (const file of htmlFiles) {
    const source = path.join(root, file);

    if (!fs.existsSync(source)) {
      throw new Error(`Required website file missing: ${file}`);
    }

    const html = fs.readFileSync(source, "utf8");

    const output = await minifyHTML(html, {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true
    });

    fs.writeFileSync(path.join(dist, file), output);
    console.log(`Built ${file}`);
  }

  for (const file of cssFiles) {
    const source = path.join(root, file);

    if (!fs.existsSync(source)) {
      throw new Error(`Required website file missing: ${file}`);
    }

    const result = new CleanCSS().minify(
      fs.readFileSync(source, "utf8")
    );

    if (result.errors.length) {
      throw new Error(`${file}: ${result.errors.join("\n")}`);
    }

    fs.writeFileSync(path.join(dist, file), result.styles);
    console.log(`Built ${file}`);
  }

  for (const file of jsFiles) {
    const source = path.join(root, file);

    if (!fs.existsSync(source)) {
      throw new Error(`Required website file missing: ${file}`);
    }

    const result = await minifyJS(
      fs.readFileSync(source, "utf8")
    );

    if (!result.code) {
      throw new Error(`JavaScript build produced no output: ${file}`);
    }

    fs.writeFileSync(path.join(dist, file), result.code);
    console.log(`Built ${file}`);
  }

  for (const file of assetFiles) {
    copyAsset(file);
    console.log(`Copied ${file}`);
  }

  console.log("Cassidy's Reserve build complete.");
}

build().catch(error => {
  console.error("Build failed:", error);
  process.exitCode = 1;
});

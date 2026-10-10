
const fs = require("fs");
const path = require("path");

const root = __dirname;
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const files = [
  "index.html",
  "menu.html",
  "cart.html",
  "checkout.html",
  "success.html",
  "faq.html",
  "style.css",
  "logo.png",
  "images"
];

for (const file of files) {
  const source = path.join(root, file);
  const destination = path.join(dist, file);

  if (!fs.existsSync(source)) {
    throw new Error(`Required website file missing: ${file}`);
  }

  fs.cpSync(source, destination, { recursive: true });
}

console.log("Cassidy's Reserve build complete: dist/");

// Reads the "images" folder and writes gallery-data.js.
// GitHub runs this automatically whenever you add or remove an image.
//
// File naming (all optional):
//   2026-10-13_Mushroom-Friend.png  ->  title "Mushroom Friend", date Oct 2026
//   2026-10_Mushroom-Friend.png     ->  same, date without a day
//   Mushroom-Friend.png             ->  title "Mushroom Friend", no date
// Newest dates come first. Undated drawings go at the end.

const fs = require("fs");
const path = require("path");

const IMAGE_DIR = "images";
const OUTPUT = "gallery-data.js";
const EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

function parseName(file) {
  const base = path.basename(file, path.extname(file));
  const match = base.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?[_\s-]+(.+)$/);

  let date = "";
  let rawTitle = base;

  if (match) {
    date = match[3] ? `${match[1]}-${match[2]}-${match[3]}` : `${match[1]}-${match[2]}`;
    rawTitle = match[4];
  }

  const title = rawTitle.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return { file, title: title || base, date };
}

let files = [];
if (fs.existsSync(IMAGE_DIR)) {
  files = fs
    .readdirSync(IMAGE_DIR)
    .filter((f) => EXTENSIONS.has(path.extname(f).toLowerCase()));
}

const items = files.map(parseName).sort((a, b) => {
  if (a.date && b.date) return b.date.localeCompare(a.date) || a.title.localeCompare(b.title);
  if (a.date) return -1;
  if (b.date) return 1;
  return a.title.localeCompare(b.title);
});

const output =
  "// Generated automatically. Do not edit by hand.\n" +
  "window.GALLERY = " + JSON.stringify(items, null, 2) + ";\n";

fs.writeFileSync(OUTPUT, output);
console.log(`Wrote ${items.length} drawing(s) to ${OUTPUT}`);
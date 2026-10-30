// Builds the gallery from gallery-data.js, adds theme filters, and powers the viewer.
// Viewer: click a drawing to enlarge. Close with X, outside click or Escape.
// Navigate with the arrow buttons, left/right keys, or swipe on a phone.

const NEW_LABEL_DAYS = 30; // drawings newer than this get a "New" label

// Optional: how a tag is displayed. Tags not listed here show as written.
// Example: file tag "asd" is shown on the button as "ASD".
const TAG_LABELS = {
  asd: "ASD",
};

const gallery = document.getElementById("gallery");
const emptyMessage = document.getElementById("empty-message");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbTitle = document.getElementById("lb-title");
const lbDate = document.getElementById("lb-date");
const btnClose = document.getElementById("lb-close");
const btnPrev = document.getElementById("lb-prev");
const btnNext = document.getElementById("lb-next");

const items = Array.isArray(window.GALLERY) ? window.GALLERY : [];
let visible = items.map((_, i) => i); // positions of drawings currently shown
let current = 0;
let lastFocused = null;

// ---------- Dates ----------
function parseDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatDate(date, long) {
  if (!date) return "";
  return date.toLocaleDateString("en-CA", {
    month: long ? "long" : "short",
    year: "numeric",
  });
}

function isNew(date) {
  if (!date) return false;
  const ageDays = (Date.now() - date.getTime()) / 86400000;
  return ageDays <= NEW_LABEL_DAYS;
}

// ---------- Build the gallery ----------
const cards = items.map((item, i) => {
  const date = parseDate(item.date);
  const card = document.createElement("figure");
  card.className = "card" + (isNew(date) ? " is-new" : "");
  card.tabIndex = 0;

  const img = document.createElement("img");
  img.src = "images/" + encodeURIComponent(item.file);
  img.alt = item.title;
  img.loading = "lazy";
  card.appendChild(img);

  const caption = document.createElement("figcaption");
  caption.textContent = formatDate(date, false) || item.title;
  card.appendChild(caption);

  card.addEventListener("click", () => open(i));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open(i);
    }
  });

  gallery.appendChild(card);
  return card;
});

if (items.length === 0) emptyMessage.hidden = false;

// ---------- Theme filters ----------
const allTags = [...new Set(items.flatMap((item) => item.tags || []))].sort();
const filterButtons = [];

function labelFor(tag) {
  return TAG_LABELS[tag] || tag;
}

function applyFilter(tag) {
  visible = items
    .map((item, i) => i)
    .filter((i) => tag === "all" || (items[i].tags || []).includes(tag));

  cards.forEach((card, i) => {
    card.hidden = !visible.includes(i);
  });

  filterButtons.forEach(({ button, value }) => {
    const active = value === tag;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  // Keep the chosen theme in the web address so it can be shared (e.g. ...#asd)
  try {
    const url = tag === "all" ? location.pathname + location.search : "#" + encodeURIComponent(tag);
    history.replaceState(null, "", url);
  } catch (e) {
    // Ignore: some browsers block this when opening the file directly
  }
}

if (allTags.length > 0) {
  const bar = document.createElement("nav");
  bar.className = "filters";
  bar.setAttribute("aria-label", "Filter drawings by theme");

  ["all", ...allTags].forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-btn";
    button.textContent = value === "all" ? "all" : labelFor(value);
    button.addEventListener("click", () => applyFilter(value));
    bar.appendChild(button);
    filterButtons.push({ button, value });
  });

  gallery.parentNode.insertBefore(bar, gallery);

  const fromAddress = decodeURIComponent(location.hash.replace("#", "")).toLowerCase();
  applyFilter(allTags.includes(fromAddress) ? fromAddress : "all");
}

// ---------- Viewer ----------
function show(index) {
  current = index;
  const item = items[current];
  lbImg.src = "images/" + encodeURIComponent(item.file);
  lbImg.alt = item.title;
  lbTitle.textContent = item.title;
  lbDate.textContent = formatDate(parseDate(item.date), true);
}

// Move to the previous (-1) or next (+1) drawing among those currently shown
function step(direction) {
  if (visible.length === 0) return;
  const position = visible.indexOf(current);
  const next = visible[(position + direction + visible.length) % visible.length];
  show(next);
}

function open(index) {
  lastFocused = document.activeElement;
  show(index);
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  btnClose.focus();
}

function close() {
  lightbox.hidden = true;
  lbImg.src = "";
  document.body.style.overflow = "";
  if (lastFocused) lastFocused.focus();
}

btnClose.addEventListener("click", close);
btnPrev.addEventListener("click", () => step(-1));
btnNext.addEventListener("click", () => step(1));

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) close();
});

document.addEventListener("keydown", (e) => {
  if (lightbox.hidden) return;
  if (e.key === "Escape") close();
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});

// Swipe support for phones
let touchStartX = 0;
lightbox.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].clientX;
}, { passive: true });

lightbox.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) step(dx > 0 ? -1 : 1);
}, { passive: true });
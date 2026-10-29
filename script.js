// Builds the gallery from gallery-data.js, then powers the viewer.
// Viewer: click a drawing to enlarge. Close with X, outside click or Escape.
// Navigate with the arrow buttons, left/right keys, or swipe on a phone.

const NEW_LABEL_DAYS = 30; // drawings newer than this get a "New" label

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

// ---------- Viewer ----------
function show(index) {
  current = (index + items.length) % items.length; // wraps around
  const item = items[current];
  lbImg.src = "images/" + encodeURIComponent(item.file);
  lbImg.alt = item.title;
  lbTitle.textContent = item.title;
  lbDate.textContent = formatDate(parseDate(item.date), true);
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
btnPrev.addEventListener("click", () => show(current - 1));
btnNext.addEventListener("click", () => show(current + 1));

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) close();
});

document.addEventListener("keydown", (e) => {
  if (lightbox.hidden) return;
  if (e.key === "Escape") close();
  if (e.key === "ArrowLeft") show(current - 1);
  if (e.key === "ArrowRight") show(current + 1);
});

// Swipe support for phones
let touchStartX = 0;
lightbox.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].clientX;
}, { passive: true });

lightbox.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) show(dx > 0 ? current - 1 : current + 1);
}, { passive: true });

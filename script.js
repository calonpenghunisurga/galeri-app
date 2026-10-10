/* ===== Data =====
   Ganti `src` dengan foto kamu (disarankan rasio 3:4, mis. images/foto-1.jpg).
   `colors` = 3 warna untuk frame gradient saat foto itu aktif. */
const photos = [
  { src: 'foto/download (8).jpg', loc: 'Michie, Thailand',     colors: ['#5b3fd0', '#b06bff', '#ff8fd0'] },
  { src: 'foto/Michie JKT48 (1).jpg ', loc: 'Michie, Cafe',         colors: ['#e8d84a', '#ff9a3c', '#ffd9a0'] },
  { src: 'foto/download (9).jpg', loc: 'Love, Indonesia',      colors: ['#e0268a', '#ff7ac0', '#f5b942'] },
  { src: 'foto/grosir.jpg', loc: 'Michie, Austria',      colors: ['#ff1f4b', '#ff7a1a', '#ff6f91'] },
  { src: 'foto/love.jpg', loc: 'Michie, Indonesia',   colors: ['#ffb300', '#ff7a1a', '#ffe34d'] },
  { src: 'foto/messy.jpg', loc: 'Michie, Netherlands', colors: ['#f06292', '#ff9ec0', '#2f7a3d'] },
  { src: 'foto/michie.jpg', loc: 'Michie, Czechia',      colors: ['#5a6fe0', '#9fb0ff', '#e6ebff'] },
  { src: 'foto/Michie JKT48 (2).jpg', loc: 'Michie, Bali',      colors: ['#e8461c', '#ff9a3c', '#ffd08a'] },
  { src: 'foto/Michie JKT48 (3).jpg', loc: 'Michie, Bali', colors: ['#b3122e', '#ff4d5e', '#ff9a8a'] },
];

/* ===== Setup ===== */
const $ = s => document.querySelector(s);
const stage = $('#stage'), track = $('#track'), caption = $('#caption');
const capNo = $('#cap-no'), capLoc = $('#cap-loc');
const n = photos.length;
const pad = v => String(v).padStart(3, '0');

const items = photos.map((p, i) => {
  const li = document.createElement('li');
  li.className = 'item';
  li.innerHTML = `<img src="${p.src}" alt="${p.loc}" draggable="false">`;
  li.addEventListener('click', () => { if (!moved) goTo(i); });
  track.appendChild(li);
  return li;
});

let cur = 3;          // posisi saat ini (float, untuk animasi halus)
let target = 3;       // posisi tujuan (integer)
let W = 0, H = 0, raf = null, shown = -1;

/* ===== Layout (meniru proporsi referensi) =====
   Skala tiap posisi relatif ke foto tengah: 1 → 0.61 → 0.39
   Posisi X dan Y juga di-interpolasi per jarak (d) dari tengah. */
const SCALE = [1, 0.61, 0.39, 0.39];
const lerp = (a, b, t) => a + (b - a) * t;
function at(arr, d) {                       // interpolasi linear di array
  const i = Math.min(Math.floor(d), arr.length - 2);
  return lerp(arr[i], arr[i + 1], d - i);
}

function measure() {
  const r = stage.getBoundingClientRect();
  W = r.width; H = r.height;
}

function layout() {
  const small = W < 700;
  const cw = small ? Math.min(W * 0.52, H * 0.36) : Math.min(W * 0.1878, H * 0.33);
  const ch = cw * 4 / 3;
  const X = small ? [0, W * 0.46, W * 0.8, W * 1.1] : [0, W * 0.208, W * 0.343, W * 0.46];
  const Y = [0, 0, -H * 0.085, -H * 0.085];
  const cy = H * 0.515;

  items.forEach((el, i) => {
    let d = i - cur;
    d = ((d + n / 2) % n + n) % n - n / 2;            // wrap melingkar
    const a = Math.min(Math.abs(d), 3), s = Math.sign(d) || 1;
    const w = cw * at(SCALE, a), h = w * 4 / 3;
    const x = W / 2 + s * at(X, a) - w / 2;
    const y = cy + at(Y, a) - h / 2;
    const op = a <= 2 ? 1 : Math.max(0, 3 - a);
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    el.style.opacity = el.classList.contains('ready') ? op : 0;
    el.style.zIndex = 10 - Math.round(a);
    el.style.pointerEvents = op ? 'auto' : 'none';
    el.classList.toggle('is-active', Math.abs(d) < 0.5);
  });

  caption.style.left = (W / 2 - cw / 2) + 'px';
  caption.style.top = (cy + ch / 2 + 16) + 'px';
}

/* ===== Animation loop ===== */
function tick() {
  cur += (target - cur) * 0.11;
  if (Math.abs(target - cur) < 0.0008) cur = target;
  layout();
  updateInfo();
  raf = cur === target ? null : requestAnimationFrame(tick);
}
function run() { if (!raf) raf = requestAnimationFrame(tick); }

function updateInfo() {
  const idx = ((Math.round(cur) % n) + n) % n;
  if (idx === shown) return;
  shown = idx;
  caption.classList.add('swap');
  setTimeout(() => {
    capNo.textContent = pad(idx + 1);
    capLoc.textContent = photos[idx].loc;
    caption.classList.remove('swap');
  }, 180);
  const [a, b, c] = photos[idx].colors;
  const r = document.documentElement.style;
  r.setProperty('--c1', a); r.setProperty('--c2', b); r.setProperty('--c3', c);
}

/* ===== Navigation ===== */
const step = d => { target += d; run(); };
function goTo(i) {                                   // lompat lewat jalur terdekat
  let d = i - (((Math.round(target) % n) + n) % n);
  if (d > n / 2) d -= n; if (d < -n / 2) d += n;
  step(d);
}

// wheel / trackpad
let acc = 0, lock = false;
stage.addEventListener('wheel', e => {
  e.preventDefault();
  if (lock) return;
  acc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (Math.abs(acc) > 30) {
    step(acc > 0 ? 1 : -1);
    acc = 0; lock = true; setTimeout(() => lock = false, 420);
  }
}, { passive: false });

// keyboard
addEventListener('keydown', e => {
  if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) step(1);
  if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) step(-1);
});
$('#next').onclick = () => step(1);
$('#prev').onclick = () => step(-1);

// drag / swipe (mouse + touch)
let sx = 0, sy = 0, dragging = false, moved = false;
stage.addEventListener('pointerdown', e => { dragging = true; moved = false; sx = e.clientX; sy = e.clientY; });
addEventListener('pointermove', e => {
  if (!dragging) return;
  if (Math.abs(e.clientX - sx) > 6) { moved = true; stage.classList.add('drag'); }
});
addEventListener('pointerup', e => {
  if (!dragging) return;
  dragging = false; stage.classList.remove('drag');
  const dx = e.clientX - sx, dy = e.clientY - sy;
  const v = Math.abs(dx) > Math.abs(dy) ? dx : dy;
  if (Math.abs(v) > 40) step(v < 0 ? 1 : -1);
  setTimeout(() => moved = false, 0);
});

/* ===== Nav: gallery / about / contact ===== */
const links = document.querySelectorAll('nav a');
links.forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  const v = a.dataset.view;
  links.forEach(l => l.classList.toggle('active', l === a));
  document.querySelectorAll('.panel').forEach(p => {
    const open = p.id === v;
    p.classList.toggle('open', open);
    p.setAttribute('aria-hidden', String(!open));
  });
}));
$('.logo').addEventListener('click', e => { e.preventDefault(); document.querySelector('[data-view="gallery"]').click(); });

/* ===== Init ===== */
addEventListener('resize', () => { measure(); layout(); });
measure(); layout(); updateInfo();
requestAnimationFrame(() => items.forEach((el, i) => setTimeout(() => { el.classList.add('ready'); layout(); }, 80 * i)));


const soundToggle = document.getElementById("soundToggle");
const soundLabel = document.getElementById("soundLabel");
const ambientSound = document.getElementById("ambientSound");

let soundEnabled = false;

soundToggle.addEventListener("click", async () => {
  if (!soundEnabled) {
    try {
      ambientSound.volume = 0.25;
      await ambientSound.play();

      soundEnabled = true;
      soundToggle.setAttribute("aria-pressed", "true");
      soundToggle.setAttribute(
        "aria-label",
        "Turn ambient sound off"
      );
      soundLabel.textContent = "SOUND ON";
    } catch (error) {
      soundLabel.textContent = "AUDIO UNAVAILABLE";
      console.error("Audio gagal diputar:", error);
    }
  } else {
    ambientSound.pause();

    soundEnabled = false;
    soundToggle.setAttribute("aria-pressed", "false");
    soundToggle.setAttribute(
      "aria-label",
      "Turn ambient sound on"
    );
    soundLabel.textContent = "SOUND OFF";
  }
});

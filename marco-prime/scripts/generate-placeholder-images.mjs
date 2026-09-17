/**
 * Gera as imagens placeholder do site (skyline do hero, fotos dos imóveis e
 * foto da equipe) como SVG determinístico, no mesmo vocabulário visual do
 * projeto: preto, branco e dourado. Rode com `npm run images` depois de
 * alterar qualquer cena. Para trocar por fotografia real, basta substituir os
 * arquivos em `public/images` mantendo os nomes.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "images");
mkdirSync(OUT, { recursive: true });

const GOLD = "#c9a961";
const GOLD_SOFT = "#e8dcc0";

/** PRNG determinístico: as imagens são sempre idênticas entre builds. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const n = (v) => Math.round(v * 10) / 10;

/**
 * Malhas de caixilho como <pattern>: a fachada inteira vira um único rect,
 * o que mantém o arquivo leve e a leitura arquitetônica em qualquer escala.
 */
function glassPattern(id, { cw, ch, mullion = 0.12, floor = 0.07 }) {
  return `<pattern id="${id}" width="${cw}" height="${ch}" patternUnits="userSpaceOnUse">
      <rect width="${cw}" height="${ch}" fill="none"/>
      <rect x="0" y="0" width="1" height="${ch}" fill="#f4f2ee" opacity="${mullion}"/>
      <rect x="0" y="0" width="${cw}" height="1" fill="#f4f2ee" opacity="${floor}"/>
    </pattern>`;
}

function baseDefs(id, extra = "", { skyTop = "#1a1a1a", skyMid = "#0e0e0e" } = {}) {
  return `<defs>
    <linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${skyTop}"/>
      <stop offset="55%" stop-color="${skyMid}"/>
      <stop offset="100%" stop-color="#060606"/>
    </linearGradient>
    <radialGradient id="haze-${id}" cx="50%" cy="88%" r="70%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.16"/>
      <stop offset="60%" stop-color="${GOLD}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="vignette-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0a0a" stop-opacity="0.4"/>
      <stop offset="45%" stop-color="#0a0a0a" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0a0a0a" stop-opacity="0.75"/>
    </linearGradient>
    ${extra}
  </defs>`;
}

/**
 * Iluminação de fachada com leitura arquitetônica: faixas de andar acesas,
 * prumadas de circulação e algumas salas isoladas. Bem diferente de pontos
 * aleatórios, que a essa escala viram ruído.
 */
function litFacade(
  rand,
  x,
  y,
  w,
  h,
  { cw, ch, floors = 2, cores = 1, spots = 8, band = 0.12, spot = 0.4 },
) {
  const cols = Math.max(1, Math.floor(w / cw));
  const rows = Math.max(1, Math.floor(h / ch));
  let out = "";

  // Andares inteiros iluminados.
  for (let i = 0; i < floors; i++) {
    const r = 1 + Math.floor(rand() * (rows - 1));
    out += `<rect x="${n(x + 1)}" y="${n(y + r * ch + 1)}" width="${n(w - 2)}" height="${n(ch - 2)}" fill="${GOLD_SOFT}" opacity="${n(band + rand() * 0.08)}"/>`;
  }

  // Prumada de circulação (elevadores/escada), sempre acesa.
  for (let i = 0; i < cores; i++) {
    const c = Math.floor(rand() * cols);
    out += `<rect x="${n(x + c * cw + 1)}" y="${n(y + ch)}" width="${n(cw - 2)}" height="${n(h - ch * 1.5)}" fill="${GOLD_SOFT}" opacity="${n(0.08 + rand() * 0.06)}"/>`;
  }

  // Salas isoladas, em blocos de uma a três janelas contíguas.
  const seen = new Set();
  for (let i = 0; i < spots; i++) {
    const r = Math.floor(rand() * rows);
    const c = Math.floor(rand() * cols);
    if (seen.has(`${c}:${r}`)) continue;
    const span = Math.min(1 + Math.floor(rand() * 3), cols - c);
    for (let k = 0; k < span; k++) seen.add(`${c + k}:${r}`);
    out += `<rect x="${n(x + c * cw + 1)}" y="${n(y + r * ch + 1)}" width="${n(span * cw - 2)}" height="${n(ch - 2)}" fill="${GOLD_SOFT}" opacity="${n(spot + rand() * 0.22)}"/>`;
  }

  return out;
}

function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" preserveAspectRatio="xMidYMid slice">${body}</svg>\n`;
}

/* ---------------------------------------------------------------- cenas --- */

/** Skyline em três planos de profundidade — fundo do hero. */
function skyline(seed, w, h) {
  const rand = rng(seed);
  const id = seed;
  const horizon = h * 0.95;

  const extra = [
    glassPattern(`g-far-${id}`, { cw: 9, ch: 11, mullion: 0.06, floor: 0.04 }),
    glassPattern(`g-mid-${id}`, { cw: 13, ch: 16, mullion: 0.1, floor: 0.06 }),
    glassPattern(`g-near-${id}`, { cw: 18, ch: 22, mullion: 0.12, floor: 0.07 }),
    `<linearGradient id="face-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#111"/>
      <stop offset="50%" stop-color="#2e2e2e"/>
      <stop offset="100%" stop-color="#141414"/>
    </linearGradient>`,
  ].join("");

  let out = baseDefs(id, extra);
  out += `<rect width="${w}" height="${h}" fill="url(#sky-${id})"/>`;
  out += `<rect width="${w}" height="${h}" fill="url(#haze-${id})"/>`;

  const layers = [
    { key: "far", tone: "#1b1b1b", minH: 0.2, maxH: 0.42, minW: 0.045, maxW: 0.08, lit: 8, cw: 9, ch: 11, opacity: 0.75 },
    { key: "mid", tone: "url(#face-" + id + ")", minH: 0.32, maxH: 0.66, minW: 0.055, maxW: 0.095, lit: 14, cw: 13, ch: 16, opacity: 1 },
    { key: "near", tone: "#0e0e0e", minH: 0.14, maxH: 0.3, minW: 0.08, maxW: 0.14, lit: 12, cw: 18, ch: 22, opacity: 1 },
  ];

  for (const layer of layers) {
    let x = -w * 0.05;
    let group = "";
    while (x < w * 1.02) {
      const bw = w * (layer.minW + rand() * (layer.maxW - layer.minW));
      const bh = h * (layer.minH + rand() * (layer.maxH - layer.minH));
      const y = horizon - bh;
      group += `<rect x="${n(x)}" y="${n(y)}" width="${n(bw)}" height="${n(bh)}" fill="${layer.tone}"/>`;
      group += `<rect x="${n(x)}" y="${n(y)}" width="${n(bw)}" height="${n(bh)}" fill="url(#g-${layer.key}-${id})"/>`;
      // Coroamento em dourado desenha a silhueta contra o céu.
      group += `<rect x="${n(x)}" y="${n(y)}" width="${n(bw)}" height="1.5" fill="${GOLD}" opacity="0.22"/>`;
      group += litFacade(rand, x, y, bw, bh, {
        cw: layer.cw,
        ch: layer.ch,
        floors: layer.key === "far" ? 1 : 2,
        cores: 1,
        spots: layer.lit,
      });
      // Aresta iluminada dá volume à torre contra a vizinha.
      group += `<rect x="${n(x)}" y="${n(y)}" width="1" height="${n(bh)}" fill="#f4f2ee" opacity="0.07"/>`;
      if (layer.key === "mid" && rand() < 0.3) {
        const ax = n(x + bw / 2);
        group += `<rect x="${ax}" y="${n(y - h * 0.045)}" width="1.5" height="${n(h * 0.045)}" fill="#1f1f1f"/>`;
        group += `<circle cx="${ax}" cy="${n(y - h * 0.045)}" r="2" fill="${GOLD}" opacity="0.65"/>`;
      }
      x += bw + w * (0.002 + rand() * 0.008);
    }
    out += `<g opacity="${layer.opacity}">${group}</g>`;
  }

  out += `<rect x="0" y="${n(horizon)}" width="${w}" height="${n(h - horizon)}" fill="#050505"/>`;
  out += `<rect x="0" y="${n(horizon)}" width="${w}" height="1" fill="${GOLD}" opacity="0.28"/>`;
  out += `<rect width="${w}" height="${h}" fill="url(#vignette-${id})"/>`;
  return out;
}

/** Fachada envidraçada em contra-plongée. */
function facade(seed, w, h, { slabs = 3 } = {}) {
  const rand = rng(seed);
  const id = seed;
  const cw = slabs === 1 ? 46 : slabs === 2 ? 38 : 30;
  const ch = Math.round(cw * 1.25);

  const extra = [
    glassPattern(`g-${id}`, { cw, ch, mullion: 0.07, floor: 0.045 }),
    `<linearGradient id="face-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#171717"/>
      <stop offset="40%" stop-color="#3c3c3c"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>`,
  ].join("");

  let out = baseDefs(id, extra, { skyTop: "#2f2f2f", skyMid: "#171717" });
  out += `<rect width="${w}" height="${h}" fill="url(#sky-${id})"/>`;
  out += `<rect width="${w}" height="${h}" fill="url(#haze-${id})"/>`;

  const gap = w * 0.018;
  // Com um volume só, a torre ocupa parte da largura para o céu aparecer.
  const spread = slabs === 1 ? w * 0.64 : w;
  const originX = (w - spread) / 2;
  const slabW = (spread - gap * (slabs - 1)) / slabs;
  for (let i = 0; i < slabs; i++) {
    const x = originX + i * (slabW + gap);
    // Alturas bem distintas desenham uma silhueta legível contra o céu.
    const top = h * (0.04 + rand() * (slabs === 1 ? 0.12 : 0.26));
    const hh = h - top;
    out += `<rect x="${n(x)}" y="${n(top)}" width="${n(slabW)}" height="${n(hh)}" fill="url(#face-${id})"/>`;
    out += `<rect x="${n(x)}" y="${n(top)}" width="${n(slabW)}" height="${n(hh)}" fill="url(#g-${id})"/>`;
    out += litFacade(rand, x, top, slabW, hh, {
      cw,
      ch,
      floors: 3,
      cores: slabs === 1 ? 2 : 1,
      spots: Math.round((slabW / cw) * (hh / ch) * 0.06),
      band: 0.07,
      spot: 0.22,
    });
    // Coroamento, aresta iluminada e sombra do lado oposto: volume.
    out += `<rect x="${n(x)}" y="${n(top)}" width="${n(slabW)}" height="3" fill="${GOLD}" opacity="0.45"/>`;
    out += `<rect x="${n(x)}" y="${n(top)}" width="2" height="${n(hh)}" fill="#f4f2ee" opacity="0.1"/>`;
    out += `<rect x="${n(x + slabW - 3)}" y="${n(top)}" width="3" height="${n(hh)}" fill="#000" opacity="0.45"/>`;
    // Brise vertical marcando o ritmo da fachada.
    for (const frac of [0.34, 0.67]) {
      out += `<rect x="${n(x + slabW * frac)}" y="${n(top)}" width="1.5" height="${n(hh)}" fill="${GOLD}" opacity="0.12"/>`;
    }
  }

  out += `<rect width="${w}" height="${h}" fill="url(#vignette-${id})"/>`;
  return out;
}

/** Galpão logístico com docas e pátio de manobras. */
function warehouse(seed, w, h) {
  const rand = rng(seed);
  const id = seed;
  const ground = h * 0.76;
  const eave = h * 0.42;
  const ridge = h * 0.34;

  const extra = `<linearGradient id="wall-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3d3d3d"/>
      <stop offset="100%" stop-color="#191919"/>
    </linearGradient>
    <pattern id="rib-${id}" width="22" height="10" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="1" height="10" fill="#f4f2ee" opacity="0.1"/>
    </pattern>`;

  let out = baseDefs(id, extra, { skyTop: "#2b2b2b", skyMid: "#141414" });
  out += `<rect width="${w}" height="${h}" fill="url(#sky-${id})"/>`;
  out += `<rect width="${w}" height="${h}" fill="url(#haze-${id})"/>`;

  // Linha de galpões ao fundo situa o complexo na paisagem.
  let hx = -w * 0.02;
  while (hx < w) {
    const hw = w * (0.1 + rand() * 0.12);
    const hh2 = h * (0.05 + rand() * 0.05);
    out += `<rect x="${n(hx)}" y="${n(eave - hh2)}" width="${n(hw)}" height="${n(hh2)}" fill="#1a1a1a"/>`;
    out += `<rect x="${n(hx)}" y="${n(eave - hh2)}" width="${n(hw)}" height="1" fill="${GOLD}" opacity="0.15"/>`;
    hx += hw + w * 0.02;
  }

  // Volume principal + cumeeira.
  out += `<polygon points="0,${n(eave)} ${n(w * 0.5)},${n(ridge)} ${w},${n(eave)} ${w},${n(ground)} 0,${n(ground)}" fill="url(#wall-${id})"/>`;
  out += `<rect x="0" y="${n(eave)}" width="${w}" height="${n(ground - eave)}" fill="url(#rib-${id})"/>`;
  out += `<polyline points="0,${n(eave)} ${n(w * 0.5)},${n(ridge)} ${w},${n(eave)}" fill="none" stroke="${GOLD}" stroke-opacity="0.3" stroke-width="2"/>`;
  out += `<rect x="0" y="${n(eave)}" width="${w}" height="1" fill="${GOLD}" opacity="0.12"/>`;

  // Faixa de docas.
  const docks = 8;
  const bandTop = ground - (ground - eave) * 0.5;
  const dw = (w * 0.9) / docks;
  for (let i = 0; i < docks; i++) {
    const x = w * 0.05 + i * dw;
    const dh = ground - bandTop;
    out += `<rect x="${n(x + dw * 0.14)}" y="${n(bandTop)}" width="${n(dw * 0.72)}" height="${n(dh)}" fill="#060606"/>`;
    const on = rand() < 0.4;
    out += `<rect x="${n(x + dw * 0.14)}" y="${n(bandTop)}" width="${n(dw * 0.72)}" height="3" fill="${GOLD}" opacity="${on ? 0.7 : 0.18}"/>`;
    if (on) {
      out += `<rect x="${n(x + dw * 0.14)}" y="${n(bandTop + 3)}" width="${n(dw * 0.72)}" height="${n(dh - 3)}" fill="${GOLD_SOFT}" opacity="0.1"/>`;
    }
    // Defensa da doca.
    out += `<rect x="${n(x + dw * 0.14)}" y="${n(ground - 6)}" width="${n(dw * 0.72)}" height="3" fill="#f4f2ee" opacity="0.07"/>`;
  }

  // Carretas encostadas nas docas dão escala ao galpão.
  for (const slot of [1, 4, 6]) {
    const tx = w * 0.05 + slot * dw;
    const tw = dw * 0.72;
    const th = (h - ground) * 0.5;
    out += `<rect x="${n(tx + dw * 0.14)}" y="${n(ground - 2)}" width="${n(tw)}" height="${n(th)}" fill="#2c2c2c"/>`;
    out += `<rect x="${n(tx + dw * 0.14)}" y="${n(ground - 2)}" width="${n(tw)}" height="2" fill="#f4f2ee" opacity="0.14"/>`;
    out += `<rect x="${n(tx + dw * 0.14)}" y="${n(ground - 2 + th)}" width="${n(tw)}" height="2" fill="${GOLD}" opacity="0.3"/>`;
  }

  // Pátio.
  out += `<rect x="0" y="${n(ground)}" width="${w}" height="${n(h - ground)}" fill="#151515"/>`;
  out += `<rect x="0" y="${n(ground)}" width="${w}" height="1" fill="${GOLD}" opacity="0.35"/>`;
  for (let i = 0; i < 8; i++) {
    out += `<rect x="${n(w * 0.05 + i * w * 0.115)}" y="${n(ground + (h - ground) * 0.5)}" width="${n(w * 0.06)}" height="2" fill="#f4f2ee" opacity="0.08"/>`;
  }
  out += `<rect width="${w}" height="${h}" fill="url(#vignette-${id})"/>`;
  return out;
}

/** Laje corporativa entregue vazia. */
function interior(seed, w, h) {
  const id = seed;
  const floor = h * 0.72;
  const ceiling = h * 0.14;
  const bays = 7;

  const extra = `<linearGradient id="light-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GOLD_SOFT}" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="${GOLD_SOFT}" stop-opacity="0.12"/>
    </linearGradient>
    <linearGradient id="reflect-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </linearGradient>`;

  let out = baseDefs(id, extra, { skyTop: "#1d1d1d", skyMid: "#0e0e0e" });
  out += `<rect width="${w}" height="${h}" fill="url(#sky-${id})"/>`;

  // Forro e parede de vidro.
  out += `<rect x="0" y="0" width="${w}" height="${n(ceiling)}" fill="#151515"/>`;
  out += `<rect x="0" y="${n(ceiling - 2)}" width="${w}" height="2" fill="${GOLD}" opacity="0.22"/>`;
  for (let i = 0; i < bays; i++) {
    const bw = w / bays;
    const x = i * bw;
    out += `<rect x="${n(x + 4)}" y="${n(ceiling)}" width="${n(bw - 8)}" height="${n(floor - ceiling)}" fill="url(#light-${id})"/>`;
    out += `<rect x="${n(x)}" y="${n(ceiling)}" width="4" height="${n(floor - ceiling)}" fill="#050505"/>`;
  }
  // Skyline distante atrás do vidro.
  const rand = rng(seed + 3);
  let bx = 0;
  while (bx < w) {
    const bw = w * (0.05 + rand() * 0.06);
    const bh = (floor - ceiling) * (0.2 + rand() * 0.35);
    out += `<rect x="${n(bx)}" y="${n(floor - bh)}" width="${n(bw)}" height="${n(bh)}" fill="#0c0c0c" opacity="0.85"/>`;
    bx += bw + w * 0.014;
  }
  out += `<rect x="0" y="${n(floor - 4)}" width="${w}" height="4" fill="${GOLD}" opacity="0.32"/>`;

  // Pilares em primeiro plano.
  for (const px of [w * 0.14, w * 0.68]) {
    out += `<rect x="${n(px)}" y="0" width="${n(w * 0.05)}" height="${n(floor)}" fill="#0b0b0b"/>`;
    out += `<rect x="${n(px)}" y="0" width="1.5" height="${n(floor)}" fill="${GOLD}" opacity="0.22"/>`;
  }

  // Piso polido com reflexo.
  out += `<rect x="0" y="${n(floor)}" width="${w}" height="${n(h - floor)}" fill="#131313"/>`;
  out += `<rect x="0" y="${n(floor)}" width="${w}" height="${n((h - floor) * 0.7)}" fill="url(#reflect-${id})"/>`;
  out += `<rect width="${w}" height="${h}" fill="url(#vignette-${id})" opacity="0.6"/>`;
  return out;
}

/** Complexo industrial visto do alto. */
function aerial(seed, w, h) {
  const rand = rng(seed);
  const id = seed;
  const extra = `<pattern id="roof-${id}" width="26" height="26" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="1" height="26" fill="#f4f2ee" opacity="0.1"/>
    </pattern>
    <linearGradient id="slab-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#343434"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>`;

  let out = baseDefs(id, extra, { skyTop: "#0e0e0e", skyMid: "#0a0a0a" });
  out += `<rect width="${w}" height="${h}" fill="#101010"/>`;
  out += `<rect width="${w}" height="${h}" fill="url(#haze-${id})" opacity="0.6"/>`;

  const blocks = [
    [0.05, 0.08, 0.36, 0.3],
    [0.5, 0.06, 0.44, 0.28],
    [0.05, 0.56, 0.34, 0.34],
    [0.47, 0.44, 0.47, 0.46],
  ];
  for (const [bx, by, bw, bh] of blocks) {
    const x = w * bx;
    const y = h * by;
    const ww = w * bw;
    const hh = h * bh;
    out += `<rect x="${n(x)}" y="${n(y)}" width="${n(ww)}" height="${n(hh)}" fill="url(#slab-${id})"/>`;
    out += `<rect x="${n(x)}" y="${n(y)}" width="${n(ww)}" height="${n(hh)}" fill="url(#roof-${id})"/>`;
    out += `<rect x="${n(x)}" y="${n(y)}" width="${n(ww)}" height="${n(hh)}" fill="none" stroke="${GOLD}" stroke-opacity="0.3" stroke-width="1.5"/>`;

    // Fileiras de lanternins ao longo da cobertura.
    const rows = 3;
    for (let r = 1; r <= rows; r++) {
      const ly = y + (hh / (rows + 1)) * r;
      out += `<rect x="${n(x + ww * 0.06)}" y="${n(ly)}" width="${n(ww * 0.88)}" height="4" fill="${GOLD_SOFT}" opacity="0.16"/>`;
    }

    // Casa de máquinas e equipamentos de cobertura.
    for (let k = 0; k < 3; k++) {
      const ex = x + ww * (0.12 + rand() * 0.7);
      const ey = y + hh * (0.12 + rand() * 0.7);
      const es = Math.min(ww, hh) * (0.06 + rand() * 0.05);
      out += `<rect x="${n(ex)}" y="${n(ey)}" width="${n(es)}" height="${n(es * 0.7)}" fill="#3f3f3f"/>`;
      out += `<rect x="${n(ex)}" y="${n(ey)}" width="${n(es)}" height="1.5" fill="#f4f2ee" opacity="0.14"/>`;
    }

    // Carretas estacionadas rente à doca.
    const trailers = Math.floor(ww / (w * 0.06));
    for (let t = 0; t < trailers; t++) {
      const tx = x + ww * 0.04 + t * (ww * 0.92) / trailers;
      out += `<rect x="${n(tx)}" y="${n(y + hh + 4)}" width="${n((ww * 0.92) / trailers - 6)}" height="${n(h * 0.022)}" fill="#f4f2ee" opacity="0.1"/>`;
    }
  }

  // Vias e pátios.
  out += `<rect x="0" y="${n(h * 0.4)}" width="${w}" height="${n(h * 0.04)}" fill="#050505"/>`;
  out += `<rect x="${n(w * 0.41)}" y="0" width="${n(w * 0.035)}" height="${h}" fill="#050505"/>`;
  for (let i = 0; i < 16; i++) {
    out += `<rect x="${n(w * 0.02 + i * w * 0.062)}" y="${n(h * 0.418)}" width="${n(w * 0.026)}" height="1.5" fill="${GOLD}" opacity="0.3"/>`;
  }
  out += `<rect width="${w}" height="${h}" fill="url(#vignette-${id})" opacity="0.7"/>`;
  return out;
}

/** Equipe em contraluz diante do vidro do escritório. */
function team(seed, w, h) {
  const rand = rng(seed);
  const id = seed;
  const floor = h * 0.88;
  const ceiling = h * 0.06;
  const bays = 4;

  const extra = `<linearGradient id="light-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GOLD_SOFT}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${GOLD_SOFT}" stop-opacity="0.1"/>
    </linearGradient>`;

  let out = baseDefs(id, extra, { skyTop: "#202020", skyMid: "#101010" });
  out += `<rect width="${w}" height="${h}" fill="url(#sky-${id})"/>`;

  out += `<rect x="0" y="0" width="${w}" height="${n(ceiling)}" fill="#0b0b0b"/>`;
  out += `<rect x="0" y="${n(ceiling)}" width="${w}" height="1.5" fill="${GOLD}" opacity="0.2"/>`;
  for (let i = 0; i < bays; i++) {
    const bw = w / bays;
    const x = i * bw;
    out += `<rect x="${n(x + 5)}" y="${n(ceiling)}" width="${n(bw - 10)}" height="${n(floor - ceiling)}" fill="url(#light-${id})"/>`;
    out += `<rect x="${n(x)}" y="${n(ceiling)}" width="5" height="${n(floor - ceiling)}" fill="#040404"/>`;
  }

  // Cidade ao fundo, vista através do vidro.
  let bx = 0;
  while (bx < w) {
    const bw = w * (0.045 + rand() * 0.05);
    const bh = (floor - ceiling) * (0.18 + rand() * 0.3);
    out += `<rect x="${n(bx)}" y="${n(floor - bh)}" width="${n(bw)}" height="${n(bh)}" fill="#070707" opacity="0.85"/>`;
    bx += bw + w * 0.012;
  }

  // Silhuetas da equipe em contraluz.
  const people = [0.2, 0.33, 0.47, 0.61, 0.76];
  people.forEach((p, i) => {
    const cx = w * p;
    const scale = i % 2 === 0 ? 1 : 0.93;
    const headR = w * 0.021 * scale;
    const bodyH = h * 0.4 * scale;
    const bodyW = w * 0.07 * scale;
    const top = floor - bodyH;
    out += `<circle cx="${n(cx)}" cy="${n(top - headR * 1.15)}" r="${n(headR)}" fill="#030303"/>`;
    out += `<path d="M ${n(cx - bodyW / 2)} ${n(floor)} L ${n(cx - bodyW / 2.4)} ${n(top + bodyH * 0.05)} Q ${n(cx)} ${n(top - headR * 0.25)} ${n(cx + bodyW / 2.4)} ${n(top + bodyH * 0.05)} L ${n(cx + bodyW / 2)} ${n(floor)} Z" fill="#030303"/>`;
  });

  out += `<rect x="0" y="${n(floor)}" width="${w}" height="${n(h - floor)}" fill="#070707"/>`;
  out += `<rect x="0" y="${n(floor)}" width="${w}" height="1.5" fill="${GOLD}" opacity="0.32"/>`;
  out += `<rect width="${w}" height="${h}" fill="url(#vignette-${id})" opacity="0.5"/>`;
  return out;
}

/* --------------------------------------------------------------- saída --- */

const files = [
  ["hero-skyline.svg", 2400, 1350, skyline],
  ["imovel-01.svg", 1200, 900, (s, w, h) => facade(s, w, h, { slabs: 3 })],
  ["imovel-02.svg", 1200, 900, (s, w, h) => facade(s, w, h, { slabs: 2 })],
  ["imovel-03.svg", 1200, 900, warehouse],
  ["imovel-04.svg", 1200, 900, (s, w, h) => facade(s, w, h, { slabs: 1 })],
  ["imovel-05.svg", 1200, 900, interior],
  ["imovel-06.svg", 1200, 900, aerial],
  ["equipe.svg", 1400, 1050, team],
];

const seeds = [7, 11, 23, 31, 43, 59, 71, 83];

files.forEach(([name, w, h, scene], i) => {
  writeFileSync(join(OUT, name), svg(w, h, scene(seeds[i], w, h)));
});
console.log("imagens geradas");

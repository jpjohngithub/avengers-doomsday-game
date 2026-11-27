// ============================================================================
// AVENGERS: DOOMSDAY — STYLIZED GRAPHIC-NOVEL SHADERS, VFX & PAINTERLY TEXTURES
// ============================================================================

const GLOBAL_LIGHT_UNIFORMS = {
  uTime: { value: 0 },
  uSunDir: { value: new THREE.Vector3(-0.62, 0.58, 0.53).normalize() },
  uSunColor: { value: new THREE.Color('#fff5d6') },
  uSkyColor: { value: new THREE.Color('#60a5fa') },
  uGroundColor: { value: new THREE.Color('#2e5b20') },
  uShadowTint: { value: new THREE.Color('#1e293b') },
  uFogColorHorizon: { value: new THREE.Color('#93c5fd') },
  uFogColorZenith: { value: new THREE.Color('#1d4ed8') },
  uFogNear: { value: 340.0 },
  uFogFar: { value: 1600.0 },
  uIndoorMix: { value: 0.0 },
  uIndoorShadowTint: { value: new THREE.Color('#0f172a') },
  uIndoorFogColor: { value: new THREE.Color('#090d16') },
  uDynLightsPos: {
    value: [
      new THREE.Vector3(0, -100, 0),
      new THREE.Vector3(0, -100, 0),
      new THREE.Vector3(0, -100, 0),
      new THREE.Vector3(0, -100, 0)
    ]
  },
  uDynLightsColor: {
    value: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]
  },
  uDynLightsRange: { value: [1.0, 1.0, 1.0, 1.0] },
  uGradeLift: { value: new THREE.Vector3(0.0, 0.0, 0.015) },
  uGradeGamma: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
  uGradeGain: { value: new THREE.Vector3(1.04, 1.01, 0.96) },
  uDangerFlash: { value: 0.0 }
};

// Deterministic pseudo-random helper for painterly procedural textures
function _seededNoise(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const ProceduralTextures = {
  _cache: {},

  createArmorCarbonTexture(baseHex = '#1e293b', accentHex = '#334155') {
    return this._cached('carbon_' + baseHex + '_' + accentHex, () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = baseHex;
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 2;
        for (let i = 0; i < 128; i += 16) {
          ctx.beginPath();
          ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke();
        }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      return tex;
    });
  },

  createSpiderSuitTexture() {
    return this._cached('spidersuit', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        for (let i = 0; i <= 256; i += 32) {
          ctx.beginPath();
          ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
        }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      return tex;
    });
  },

  createBuildingFacadeTexture(wallHex = '#94a3b8', winColor = '#d97706') {
    return this._cached('facade_' + wallHex + '_' + winColor, () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = wallHex;
        ctx.fillRect(0, 0, 256, 512);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 8;
        for (let y = 0; y <= 512; y += 128) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
        }
        for (let x = 0; x <= 256; x += 128) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
        }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  },

  ironmanArmor() {
    return this.createArmorCarbonTexture('#b91c1c', '#f59e0b');
  },

  captainSuit() {
    return this.createArmorCarbonTexture('#1e40af', '#dc2626');
  },

  wolverineSuit() {
    return this.createArmorCarbonTexture('#eab308', '#1d4ed8');
  },

  scarletSuit() {
    return this.createArmorCarbonTexture('#be123c', '#4c0519');
  },

  _cached(key, builder) {
    if (!this._cache[key]) {
      this._cache[key] = builder();
    }
    return this._cache[key];
  },

  createDetailNoiseTexture() {
    return this._cached('detailNoise', () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const rand = _seededNoise(4217);

      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, size, size);

      // Subtle painterly brush & weave strokes
      for (let i = 0; i < 3200; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const w = 4 + rand() * 22;
        const h = 1.5 + rand() * 4;
        const v = Math.floor(108 + rand() * 42);
        ctx.fillStyle = `rgba(${v},${v},${v},0.16)`;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rand() - 0.5) * 0.45);
        ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
        ctx.restore();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      return tex;
    });
  },

  createCobblestoneTexture() {
    return this._cached('cobble', () => {
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const rand = _seededNoise(913);

      // Mortar base
      ctx.fillStyle = '#252b3d';
      ctx.fillRect(0, 0, size, size);

      const rows = 14;
      const rowH = size / rows;
      const palette = ['#64708a', '#57627a', '#707b96', '#5e6b82', '#6a748c', '#4e5970'];

      for (let r = 0; r < rows; r++) {
        const y = r * rowH;
        const offset = (r % 2) * (rowH * 0.65);
        let x = -offset;
        while (x < size) {
          const w = rowH * (1.1 + rand() * 0.75);
          const pad = 4;
          const baseCol = palette[Math.floor(rand() * palette.length)];

          // Stone block with hand-painted bevel highlight & cool shadow bottom
          ctx.fillStyle = baseCol;
          ctx.beginPath();
          ctx.roundRect(x + pad, y + pad, w - pad * 2, rowH - pad * 2, 10);
          ctx.fill();

          // Top warm highlight edge
          ctx.strokeStyle = 'rgba(226, 232, 240, 0.24)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + pad + 8, y + pad + 3);
          ctx.lineTo(x + w - pad - 8, y + pad + 3);
          ctx.stroke();

          // Bottom cool shadow edge
          ctx.strokeStyle = 'rgba(18, 22, 36, 0.42)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x + pad + 6, y + rowH - pad - 2);
          ctx.lineTo(x + w - pad - 6, y + rowH - pad - 2);
          ctx.stroke();

          // Subtle moss / dust flecks
          if (rand() > 0.68) {
            ctx.fillStyle = 'rgba(67, 112, 92, 0.22)';
            ctx.beginPath();
            ctx.arc(x + pad + 10, y + rowH - pad - 6, 8 + rand() * 8, 0, Math.PI * 2);
            ctx.fill();
          }

          x += w;
        }
      }

      // Subtle gilded imperial trim strip along stone border
      const grad = ctx.createLinearGradient(0, 0, 72, 0);
      grad.addColorStop(0, '#c89b3c');
      grad.addColorStop(0.5, '#f0cc6e');
      grad.addColorStop(1, '#856120');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 26, size);
      ctx.fillRect(size - 26, 0, 26, size);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 14);
      tex.anisotropy = 8;
      return tex;
    });
  },

  createAlpineTerrainTexture() {
    return this._cached('terrain', () => {
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const rand = _seededNoise(554);

      const bg = ctx.createLinearGradient(0, 0, size, size);
      bg.addColorStop(0, '#5a6f59');
      bg.addColorStop(0.5, '#4b614b');
      bg.addColorStop(1, '#435844');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);

      // Neutral monochrome/earth modulation patches so vertexColors tint cleanly per biome
      for (let i = 0; i < 2600; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = 8 + rand() * 32;
        const roll = rand();
        ctx.fillStyle = roll > 0.62
          ? 'rgba(218, 232, 205, 0.24)'
          : roll > 0.28
            ? 'rgba(56, 68, 52, 0.26)'
            : 'rgba(132, 118, 96, 0.20)';
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.56, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crisp ground pebbles, fracture lines & micro-tuft strokes
      for (let i = 0; i < 650; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const rx = 2.5 + rand() * 6.5;
        ctx.fillStyle = rand() > 0.5 ? 'rgba(38, 42, 46, 0.26)' : 'rgba(214, 219, 224, 0.20)';
        ctx.beginPath();
        ctx.ellipse(x, y, rx, rx * 0.68, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.lineWidth = 2.4;
      for (let i = 0; i < 1900; i++) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.strokeStyle = rand() > 0.42 ? 'rgba(225, 240, 210, 0.30)' : 'rgba(24, 34, 28, 0.34)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rand() - 0.5) * 9, y - 8 - rand() * 12);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(84, 84);
      tex.anisotropy = 8;
      return tex;
    });
  },

  createVillagePlasterTexture(wallHex = '#dfd7c8', timberHex = '#2c2233') {
    return this._cached(`plaster_${wallHex}_${timberHex}`, () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const rand = _seededNoise(wallHex.charCodeAt(1) * 97);

      ctx.fillStyle = wallHex;
      ctx.fillRect(0, 0, size, size);

      // Warm plaster brush clouds & subtle bottom grime
      for (let i = 0; i < 450; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = 14 + rand() * 44;
        ctx.fillStyle = rand() > 0.5 ? 'rgba(255,248,235,0.09)' : 'rgba(65,55,75,0.08)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stone foundation plinth at bottom
      ctx.fillStyle = '#4a4e64';
      ctx.fillRect(0, size * 0.80, size, size * 0.20);
      ctx.fillStyle = 'rgba(20, 22, 34, 0.28)';
      for (let x = 0; x < size; x += 64) {
        ctx.strokeRect(x + 2, size * 0.81, 60, size * 0.09);
        ctx.strokeRect(x - 28, size * 0.90, 60, size * 0.09);
      }

      // European half-timbering beams
      ctx.fillStyle = timberHex;
      ctx.fillRect(0, 0, size, 22);
      ctx.fillRect(0, size * 0.44, size, 20);
      ctx.fillRect(0, size * 0.78, size, 18);
      ctx.fillRect(0, 0, 22, size * 0.80);
      ctx.fillRect(size - 22, 0, 22, size * 0.80);
      ctx.fillRect(size * 0.5 - 9, 0, 18, size * 0.80);

      // Diagonal timber braces
      ctx.strokeStyle = timberHex;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(22, size * 0.44);
      ctx.lineTo(size * 0.26, 22);
      ctx.moveTo(size - 22, size * 0.44);
      ctx.lineTo(size * 0.74, 22);
      ctx.stroke();

      // Glowing warm amber windows (will pop softly against cool dusk shadows)
      const winPositions = [
        [68, 72, 130, 118],
        [size - 198, 72, 130, 118],
        [68, 258, 126, 112],
        [size - 194, 258, 126, 112]
      ];
      winPositions.forEach(([wx, wy, ww, wh]) => {
        ctx.fillStyle = '#1b1d2b';
        ctx.fillRect(wx - 8, wy - 8, ww + 16, wh + 16);

        const wg = ctx.createRadialGradient(
          wx + ww * 0.5, wy + wh * 0.45, 6,
          wx + ww * 0.5, wy + wh * 0.5, ww * 0.75
        );
        wg.addColorStop(0, '#fff4cc');
        wg.addColorStop(0.55, '#f59e0b');
        wg.addColorStop(1, '#92400e');
        ctx.fillStyle = wg;
        ctx.fillRect(wx, wy, ww, wh);

        // Mullion crossbars
        ctx.fillStyle = '#1b1d2b';
        ctx.fillRect(wx + ww * 0.5 - 4, wy, 8, wh);
        ctx.fillRect(wx, wy + wh * 0.5 - 4, ww, 8);
      });

      const tex = new THREE.CanvasTexture(canvas);
      tex.anisotropy = 4;
      return tex;
    });
  },

  createTerracottaRoofTexture(baseHex = '#9e4737', highlightHex = '#c76148') {
    return this._cached(`roof_${baseHex}`, () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const rand = _seededNoise(baseHex.charCodeAt(1) * 131);

      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, size, size);

      const rows = 14;
      const cols = 12;
      const rw = size / cols;
      const rh = size / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = -1; c <= cols; c++) {
          const x = c * rw + (r % 2) * (rw * 0.5);
          const y = r * rh;
          ctx.fillStyle = rand() > 0.55 ? highlightHex : baseHex;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, rw - 4, rh - 2, [3, 3, 12, 12]);
          ctx.fill();

          ctx.strokeStyle = 'rgba(20, 12, 18, 0.36)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      tex.anisotropy = 4;
      return tex;
    });
  },

  createGothicStoneTexture() {
    return this._cached('gothicStone', () => {
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const rand = _seededNoise(773);

      ctx.fillStyle = '#141926';
      ctx.fillRect(0, 0, size, size);

      const rows = 12;
      const rowH = size / rows;
      const cols = 6;
      const colW = size / cols;

      for (let r = 0; r < rows; r++) {
        const off = (r % 2) * (colW * 0.5);
        for (let c = -1; c <= cols; c++) {
          const x = c * colW + off;
          const y = r * rowH;
          const tone = 38 + Math.floor(rand() * 20);
          ctx.fillStyle = `rgb(${tone}, ${tone + 7}, ${tone + 20})`;
          ctx.fillRect(x + 4, y + 4, colW - 8, rowH - 8);

          // Highlight bevel top/left
          ctx.fillStyle = 'rgba(148, 175, 215, 0.16)';
          ctx.fillRect(x + 4, y + 4, colW - 8, 5);
          ctx.fillRect(x + 4, y + 4, 5, rowH - 8);

          // Cracks & weathering
          if (rand() > 0.70) {
            ctx.strokeStyle = 'rgba(8, 11, 18, 0.55)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x + 18, y + 12);
            ctx.lineTo(x + 36, y + 34);
            ctx.lineTo(x + 28, y + 54);
            ctx.stroke();
          }
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 2);
      tex.anisotropy = 8;
      return tex;
    });
  },

  createCapeTexture(baseHex = '#991b1b', trimHex = '#d4a848') {
    return this._cached(`cape_${baseHex}_${trimHex}`, () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, baseHex);
      grad.addColorStop(1, '#110b14');
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, size, size);

      // Subtle vertical silk fold shading
      for (let x = 0; x < size; x += 64) {
        const fg = ctx.createLinearGradient(x, 0, x + 64, 0);
        fg.addColorStop(0, 'rgba(0,0,0,0.22)');
        fg.addColorStop(0.5, 'rgba(255,255,255,0.06)');
        fg.addColorStop(1, 'rgba(0,0,0,0.22)');
        ctx.fillStyle = fg;
        ctx.fillRect(x, 0, 64, size);
      }

      // Ornate gold/emerald trim borders on sides & bottom hem
      ctx.fillStyle = trimHex;
      ctx.fillRect(0, size - 28, size, 18);
      ctx.fillRect(8, 0, 14, size);
      ctx.fillRect(size - 22, 0, 14, size);

      // Geometric mystic motif along hem
      ctx.strokeStyle = 'rgba(15, 18, 30, 0.45)';
      ctx.lineWidth = 3;
      for (let x = 28; x < size - 28; x += 40) {
        ctx.strokeRect(x, size - 24, 24, 10);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.anisotropy = 4;
      return tex;
    });
  },

  createThroneMarbleTexture() {
    return this._cached('throneMarble', () => {
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const rand = _seededNoise(881);

      ctx.fillStyle = '#18212c';
      ctx.fillRect(0, 0, size, size);

      const tile = 128;
      for (let y = 0; y < size; y += tile) {
        for (let x = 0; x < size; x += tile) {
          const checker = ((x / tile) + (y / tile)) % 2 === 0;
          ctx.fillStyle = checker ? '#1b2633' : '#141d28';
          ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);

          // Subtle marble veins
          ctx.strokeStyle = checker ? 'rgba(52, 211, 153, 0.08)' : 'rgba(148, 163, 184, 0.09)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + rand() * tile, y);
          ctx.bezierCurveTo(
            x + rand() * tile, y + tile * 0.4,
            x + rand() * tile, y + tile * 0.7,
            x + rand() * tile, y + tile
          );
          ctx.stroke();
        }
      }

      // Gold/emerald trim lines
      ctx.strokeStyle = 'rgba(212, 168, 72, 0.25)';
      ctx.lineWidth = 3;
      for (let i = 0; i <= size; i += tile * 2) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 5);
      tex.anisotropy = 8;
      return tex;
    });
  },

  createStainedGlassTexture() {
    return this._cached('stainedGlass', () => {
      const w = 256;
      const h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#6ee7b7');
      grad.addColorStop(0.35, '#10b981');
      grad.addColorStop(0.7, '#0f766e');
      grad.addColorStop(1, '#064e3b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Geometric rose medallion at top + gothic lancet ribs
      ctx.strokeStyle = '#090e14';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.25, 76, 0, Math.PI * 2);
      ctx.stroke();

      // Inner golden diamond accents
      ctx.fillStyle = 'rgba(251, 191, 36, 0.55)';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(w * 0.5 + Math.cos(a) * 44, h * 0.25 + Math.sin(a) * 44, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Vertical & diamond leadwork
      for (let x = 32; x < w; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, h * 0.42);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = h * 0.45; y < h; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      return new THREE.CanvasTexture(canvas);
    });
  },

  createDoomBannerTexture() {
    return this._cached('doomBanner', () => {
      const w = 256;
      const h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0f3d28';
      ctx.fillRect(0, 0, w, h);

      // Gold ornate border
      ctx.strokeStyle = '#d4a848';
      ctx.lineWidth = 12;
      ctx.strokeRect(14, 14, w - 28, h - 28);

      // Latverian crest center
      ctx.fillStyle = '#0a2419';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.36, 66, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f5cc66';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Stylized Doom crown / geometric mask sigil
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - 32, h * 0.36 - 24);
      ctx.lineTo(w * 0.5 + 32, h * 0.36 - 24);
      ctx.lineTo(w * 0.5 + 24, h * 0.36 + 34);
      ctx.lineTo(w * 0.5, h * 0.36 + 44);
      ctx.lineTo(w * 0.5 - 24, h * 0.36 + 34);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#34d399';
      ctx.fillRect(w * 0.5 - 20, h * 0.36 - 8, 14, 7);
      ctx.fillRect(w * 0.5 + 6, h * 0.36 - 8, 14, 7);

      // Vertical imperial ribbons
      ctx.fillStyle = '#d4a848';
      ctx.fillRect(w * 0.5 - 4, h * 0.56, 8, h * 0.32);

      return new THREE.CanvasTexture(canvas);
    });
  },

  createSuitTexture(heroId) {
    return this._cached(`suit_${heroId}`, () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (heroId === 'spider_man') {
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(0, 0, size, size);
        // Subtle hexagonal tech micro-weave
        ctx.strokeStyle = 'rgba(255, 215, 130, 0.16)';
        ctx.lineWidth = 2;
        for (let y = 0; y < size; y += 32) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(size, y);
          ctx.stroke();
        }
        // Crisp Spider-Verse comic web lines
        ctx.strokeStyle = 'rgba(18, 12, 20, 0.72)';
        ctx.lineWidth = 3;
        for (let x = 0; x <= size; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, size);
          ctx.stroke();
        }
        for (let y = 0; y <= size; y += 54) {
          ctx.beginPath();
          for (let x = 0; x <= size; x += 64) {
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + 32, y + 14, x + 64, y);
          }
          ctx.stroke();
        }
      } else if (heroId === 'reed_richards') {
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(0, 0, size, size);
        // Unstable-molecule ribbed tactical weave
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.18)';
        ctx.lineWidth = 3;
        for (let y = 0; y < size; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(size, y);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(size * 0.25, 0);
        ctx.lineTo(size * 0.25, size);
        ctx.moveTo(size * 0.75, 0);
        ctx.lineTo(size * 0.75, size);
        ctx.stroke();
      } else if (heroId === 'thor') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, size, size);
        // Asgardian scale armor pattern
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
        ctx.lineWidth = 3;
        for (let y = 0; y < size; y += 36) {
          for (let x = 0; x < size; x += 48) {
            const ox = (Math.floor(y / 36) % 2) * 24;
            ctx.beginPath();
            ctx.arc(x + ox, y, 22, 0, Math.PI);
            ctx.stroke();
          }
        }
      } else if (heroId === 'doctor_strange') {
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(0, 0, size, size);
        // Kamar-Taj mystic fabric cross-stitch & gold trim
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.lineWidth = 3;
        for (let i = -size; i < size * 2; i += 48) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + size, size);
          ctx.stroke();
        }
      } else if (heroId === 'black_panther') {
        ctx.fillStyle = '#14141f';
        ctx.fillRect(0, 0, size, size);
        // Wakandan vibranium triangle micro-weave
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.22)';
        ctx.lineWidth = 2;
        const step = 44;
        for (let y = 0; y < size; y += step) {
          for (let x = 0; x < size; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, y + step);
            ctx.lineTo(x + step * 0.5, y);
            ctx.lineTo(x + step, y + step);
            ctx.closePath();
            ctx.stroke();
          }
        }
      } else {
        // Doctor Doom riveted green-steel tunic (inspired by live-action reference)
        ctx.fillStyle = '#153024';
        ctx.fillRect(0, 0, size, size);
        const step = 56;
        for (let y = 0; y < size; y += step) {
          for (let x = 0; x < size; x += step) {
            ctx.fillStyle = '#1b3e2e';
            ctx.fillRect(x + 4, y + 4, step - 8, step - 8);
            ctx.strokeStyle = '#09140f';
            ctx.lineWidth = 4;
            ctx.strokeRect(x + 4, y + 4, step - 8, step - 8);
            ctx.strokeStyle = 'rgba(148, 180, 160, 0.22)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 12, y + 12, step - 24, step - 24);
          }
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = 4;
      return tex;
    });
  },

  // Crisp SVG emblems — ZERO emojis anywhere in the game UI
  getHeroSvgEmblem(heroId) {
    const svgs = {
      spider_man: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 10L40 20L32 28L24 20L32 10Z" fill="currentColor"/>
        <ellipse cx="32" cy="37" rx="7" ry="12" fill="currentColor"/>
        <path d="M25 25L12 12M24 31L8 28M24 37L10 47M26 43L18 56M39 25L52 12M40 31L56 28M40 37L54 47M38 43L46 56" stroke="currentColor" stroke-width="3.6" stroke-linecap="square"/>
      </svg>`,
      reed_richards: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="4.5"/>
        <path d="M37 46V18L20 38H43" stroke="currentColor" stroke-width="5.2" stroke-linecap="square" stroke-linejoin="miter"/>
      </svg>`,
      thor: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 14H50L54 21V31L50 37H14L10 31V21L14 14Z" fill="currentColor"/>
        <rect x="28" y="37" width="8" height="20" rx="2" fill="currentColor"/>
        <path d="M22 25L30 20L28 27L38 22L31 32" stroke="#090d16" stroke-width="2.6" stroke-linecap="round"/>
      </svg>`,
      doctor_strange: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="23" stroke="currentColor" stroke-width="3.2"/>
        <polygon points="32,11 52,32 32,53 12,32" stroke="currentColor" stroke-width="3"/>
        <path d="M16 32C21 24 43 24 48 32C43 40 21 40 16 32Z" stroke="currentColor" stroke-width="3"/>
        <circle cx="32" cy="32" r="5.5" fill="currentColor"/>
      </svg>`,
      black_panther: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 14L23 23L32 20L41 23L48 14L50 35L32 54L14 35L16 14Z" stroke="currentColor" stroke-width="3.6" fill="rgba(168,85,247,0.18)"/>
        <path d="M21 31L28 34L22 36Z" fill="currentColor"/>
        <path d="M43 31L36 34L42 36Z" fill="currentColor"/>
        <path d="M25 46L32 51L39 46" stroke="currentColor" stroke-width="3"/>
      </svg>`,
      iron_man: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="18,12 46,12 52,26 44,50 32,54 20,50 12,26" stroke="currentColor" stroke-width="3.6" fill="rgba(239,68,68,0.18)"/>
        <polygon points="32,20 42,26 42,38 32,44 22,38 22,26" stroke="currentColor" stroke-width="3" fill="rgba(56,189,248,0.3)"/>
        <polygon points="32,25 38,35 26,35" fill="currentColor"/>
        <path d="M18 24H25M39 24H46" stroke="currentColor" stroke-width="3.2" stroke-linecap="square"/>
      </svg>`,
      captain_america: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="4"/>
        <circle cx="32" cy="32" r="16" stroke="currentColor" stroke-width="3.2"/>
        <circle cx="32" cy="32" r="9" stroke="currentColor" stroke-width="2.5" fill="rgba(37,99,235,0.28)"/>
        <polygon points="32,23 34.4,29.5 41,29.5 35.8,33.5 37.6,40 32,36 26.4,40 28.2,33.5 23,29.5 29.6,29.5" fill="currentColor"/>
      </svg>`,
      wolverine: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 48L42 12L46 16L22 50Z" fill="currentColor"/>
        <path d="M24 52L50 16L54 20L32 54Z" fill="currentColor"/>
        <path d="M10 38L32 10L36 14L17 41Z" fill="currentColor"/>
        <path d="M12 46L34 52" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
      </svg>`,
      scarlet_witch: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="34" r="20" stroke="currentColor" stroke-width="3" stroke-dasharray="6 4"/>
        <path d="M14 26L22 10L32 22L42 10L50 26L44 38L32 30L20 38Z" stroke="currentColor" stroke-width="3.2" fill="rgba(225,29,72,0.25)"/>
        <circle cx="32" cy="38" r="5" fill="currentColor"/>
      </svg>`
    };
    return svgs[heroId] || svgs.spider_man;
  },

  getIconSvg(name) {
    const icons = {
      audioOn: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 9H8L14 4V20L8 15H4V9Z" fill="currentColor"/><path d="M17.5 8.5C19 10 19 14 17.5 15.5M20 6C22.8 9 22.8 15 20 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
      audioOff: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 9H8L14 4V20L8 15H4V9Z" fill="currentColor"/><path d="M17 9L22 15M22 9L17 15" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>`,
      sword: `<svg viewBox="0 0 24 24" fill="none"><path d="M19 3L21 5L10 16L8 14L19 3Z" fill="currentColor"/><path d="M6 12L12 18M4 20L8 16" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg>`,
      unique: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" stroke="currentColor" stroke-width="2" fill="rgba(255,255,255,0.15)"/></svg>`,
      skill: `<svg viewBox="0 0 24 24" fill="none"><polygon points="12,2 21,7 21,17 12,22 3,17 3,7" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>`,
      ult: `<svg viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" fill="currentColor"/></svg>`,
      dash: `<svg viewBox="0 0 24 24" fill="none"><path d="M3 8H15L12 4M5 13H20L17 17M4 18H12" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      heal: `<svg viewBox="0 0 24 24" fill="none"><path d="M10 4H14V10H20V14H14V20H10V14H4V10H10V4Z" fill="currentColor"/></svg>`,
      crown: `<svg viewBox="0 0 24 24" fill="none"><path d="M3 18L5 7L10 12L12 5L14 12L19 7L21 18H3Z" fill="currentColor"/></svg>`,
      play: `<svg viewBox="0 0 24 24" fill="none"><polygon points="6,4 20,12 6,20" fill="currentColor"/></svg>`
    };
    return icons[name] || icons.skill;
  }
};

// ============================================================================
// CUSTOM GLSL STYLIZED SHADERS, SMOOTH INK OUTLINES, REAL VFX & COLOR GRADING
// ============================================================================
const CustomShaders = {
  updateFrameUniforms(time, indoorMix, dynLights = []) {
    GLOBAL_LIGHT_UNIFORMS.uTime.value = time;
    GLOBAL_LIGHT_UNIFORMS.uIndoorMix.value = indoorMix;
    for (let i = 0; i < 4; i++) {
      if (i < dynLights.length) {
        const l = dynLights[i];
        GLOBAL_LIGHT_UNIFORMS.uDynLightsPos.value[i].copy(l.pos);
        GLOBAL_LIGHT_UNIFORMS.uDynLightsColor.value[i].set(l.r, l.g, l.b);
        GLOBAL_LIGHT_UNIFORMS.uDynLightsRange.value[i] = l.range || 10.0;
      } else {
        GLOBAL_LIGHT_UNIFORMS.uDynLightsPos.value[i].set(0, -120, 0);
        GLOBAL_LIGHT_UNIFORMS.uDynLightsColor.value[i].set(0, 0, 0);
        GLOBAL_LIGHT_UNIFORMS.uDynLightsRange.value[i] = 1.0;
      }
    }
  },

  // 3-Tone Graphic Novel Cel Shader + Halftone Shadows + Rim Light + Metallic Sheen + Aerial Fog
  createStylizedMaterial(opts = {}) {
    const color = new THREE.Color(opts.color !== undefined ? opts.color : 0xffffff);
    const emissive = new THREE.Color(opts.emissive !== undefined ? opts.emissive : 0x000000);
    const specColor = new THREE.Color(opts.specColor !== undefined ? opts.specColor : 0xfff5e0);
    const rimColor = new THREE.Color(opts.rimColor !== undefined ? opts.rimColor : 0xffe4b5);
    const map = opts.map || null;
    const detailMap = opts.detailMap || ProceduralTextures.createDetailNoiseTexture();

    return new THREE.ShaderMaterial({
      extensions: { derivatives: true },
      uniforms: {
        uTime: GLOBAL_LIGHT_UNIFORMS.uTime,
        uSunDir: GLOBAL_LIGHT_UNIFORMS.uSunDir,
        uSunColor: GLOBAL_LIGHT_UNIFORMS.uSunColor,
        uSkyColor: GLOBAL_LIGHT_UNIFORMS.uSkyColor,
        uGroundColor: GLOBAL_LIGHT_UNIFORMS.uGroundColor,
        uShadowTint: GLOBAL_LIGHT_UNIFORMS.uShadowTint,
        uIndoorShadowTint: GLOBAL_LIGHT_UNIFORMS.uIndoorShadowTint,
        uIndoorFogColor: GLOBAL_LIGHT_UNIFORMS.uIndoorFogColor,
        uFogColorHorizon: GLOBAL_LIGHT_UNIFORMS.uFogColorHorizon,
        uFogColorZenith: GLOBAL_LIGHT_UNIFORMS.uFogColorZenith,
        uFogNear: GLOBAL_LIGHT_UNIFORMS.uFogNear,
        uFogFar: GLOBAL_LIGHT_UNIFORMS.uFogFar,
        uIndoorMix: GLOBAL_LIGHT_UNIFORMS.uIndoorMix,
        uDynLightsPos: GLOBAL_LIGHT_UNIFORMS.uDynLightsPos,
        uDynLightsColor: GLOBAL_LIGHT_UNIFORMS.uDynLightsColor,
        uDynLightsRange: GLOBAL_LIGHT_UNIFORMS.uDynLightsRange,

        uColor: { value: color },
        uHasMap: { value: map ? 1.0 : 0.0 },
        uHasVertexColors: { value: opts.vertexColors ? 1.0 : 0.0 },
        uMap: { value: map },
        uDetailMap: { value: detailMap },
        uDetailScale: { value: opts.detailScale !== undefined ? opts.detailScale : 3.5 },
        uDetailStrength: { value: opts.detailStrength !== undefined ? opts.detailStrength : 0.14 },
        uBumpStrength: { value: opts.bumpStrength !== undefined ? opts.bumpStrength : 0.32 },
        uEmissive: { value: emissive },
        uEmissiveIntensity: { value: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 0.0 },
        uMetalness: { value: opts.metalness !== undefined ? opts.metalness : 0.0 },
        uRoughness: { value: opts.roughness !== undefined ? opts.roughness : 0.55 },
        uSpecColor: { value: specColor },
        uRimColor: { value: rimColor },
        uRimStrength: { value: opts.rimStrength !== undefined ? opts.rimStrength : 0.42 },
        uRimPower: { value: opts.rimPower !== undefined ? opts.rimPower : 3.0 },
        uHalftone: { value: opts.halftone !== undefined ? opts.halftone : 0.13 },
        uEnvBoost: { value: opts.envBoost !== undefined ? opts.envBoost : 0.0 },
        uOpacity: { value: opts.opacity !== undefined ? opts.opacity : 1.0 },
        uClothWave: { value: opts.clothWave !== undefined ? opts.clothWave : 0.0 },
        uFlatShading: { value: opts.flatShading ? 1.0 : 0.0 }
      },
      vertexColors: opts.vertexColors === true,
      transparent: opts.transparent === true,
      side: opts.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      extensions: { derivatives: true },
      vertexShader: `
        uniform float uTime;
        uniform float uClothWave;
        uniform float uHasVertexColors;
        varying vec3 vWorldPos;
        varying vec3 vNormalW;
        varying vec2 vUv;
        varying vec3 vVColor;

        void main() {
          vUv = uv;
          #ifdef USE_COLOR
            vVColor = color;
          #else
            vVColor = vec3(1.0);
          #endif
          vec3 pos = position;
          if (uClothWave > 0.001) {
            float pin = clamp(1.0 - uv.y, 0.0, 1.0);
            float w = sin(uTime * 3.4 + pos.x * 2.1 + pos.y * 1.4) * 0.12
                    + cos(uTime * 5.2 + pos.x * 3.8) * 0.05;
            pos.z += w * pin * uClothWave;
            pos.x += sin(uTime * 2.3 + pos.y * 2.0) * 0.05 * pin * uClothWave;
          }
          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPos = worldPos.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform vec3 uSkyColor;
        uniform vec3 uGroundColor;
        uniform vec3 uShadowTint;
        uniform vec3 uIndoorShadowTint;
        uniform vec3 uIndoorFogColor;
        uniform vec3 uFogColorHorizon;
        uniform vec3 uFogColorZenith;
        uniform float uFogNear;
        uniform float uFogFar;
        uniform float uIndoorMix;

        uniform vec3 uDynLightsPos[4];
        uniform vec3 uDynLightsColor[4];
        uniform float uDynLightsRange[4];

        uniform vec3 uColor;
        uniform float uHasMap;
        uniform float uHasVertexColors;
        uniform sampler2D uMap;
        uniform sampler2D uDetailMap;
        uniform float uDetailScale;
        uniform float uDetailStrength;
        uniform float uBumpStrength;
        uniform vec3 uEmissive;
        uniform float uEmissiveIntensity;
        uniform float uMetalness;
        uniform float uRoughness;
        uniform vec3 uSpecColor;
        uniform vec3 uRimColor;
        uniform float uRimStrength;
        uniform float uRimPower;
        uniform float uHalftone;
        uniform float uEnvBoost;
        uniform float uOpacity;
        uniform float uFlatShading;

        varying vec3 vWorldPos;
        varying vec3 vNormalW;
        varying vec2 vUv;
        varying vec3 vVColor;

        void main() {
          vec3 N = normalize(vNormalW);
          #ifdef GL_OES_standard_derivatives
            vec3 flatN = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
            if (dot(flatN, flatN) > 0.001 && dot(flatN, N) > 0.0) {
              float flatMix = uFlatShading > 0.5 ? 0.92 : 0.0;
              N = normalize(mix(N, flatN, flatMix));
            }
          #endif
          vec3 V = normalize(cameraPosition - vWorldPos);
          vec3 L = normalize(uSunDir);

          vec3 albedo = uColor;
          if (uHasVertexColors > 0.5) {
            albedo *= vVColor;
            if (vWorldPos.y < 1.5 && abs(vWorldPos.x) > 12.5) {
              float meadow = sin(vWorldPos.x * 0.075) * cos(vWorldPos.z * 0.075) * 0.5 + 0.5;
              albedo *= mix(vec3(0.90, 0.97, 0.90), vec3(1.14, 1.18, 0.88), meadow);
            }
          }
          if (uHasMap > 0.5) {
            albedo *= texture2D(uMap, vUv).rgb;
          }
          float detail = texture2D(uDetailMap, vUv * uDetailScale).r;
          albedo *= mix(1.0, 0.85 + detail * 0.30, uDetailStrength);

          // Procedural Micro-Bump via screen-space derivatives
          #ifdef GL_OES_standard_derivatives
          if (uBumpStrength > 0.01) {
            vec3 dPosX = dFdx(vWorldPos);
            vec3 dPosY = dFdy(vWorldPos);
            float dDetX = dFdx(detail);
            float dDetY = dFdy(detail);
            vec3 surfGrad = cross(N, dPosY) * dDetX + cross(dPosX, N) * dDetY;
            float det = dot(dPosX, cross(N, dPosY));
            if (abs(det) > 0.00001) {
              N = normalize(N - (surfGrad / det) * (uBumpStrength * (0.35 + uRoughness * 0.65) * 0.14));
            }
          }
          #endif

          // 3-Tone Stylized Anime Cel Lighting + Dynamic Cloud Shadows
          float cloudN = sin(vWorldPos.x * 0.028 + uTime * 0.38) * cos(vWorldPos.z * 0.025 - uTime * 0.24)
                       + 0.45 * sin((vWorldPos.x + vWorldPos.z) * 0.018 + uTime * 0.16);
          float cloudShadow = mix(0.82, 1.10, smoothstep(-0.35, 0.55, cloudN));
          float cloudTerm = mix(cloudShadow, 1.0, uIndoorMix);

          float NdotL = dot(N, L);
          float litBand = smoothstep(0.05, 0.12, NdotL);
          float midBand = smoothstep(-0.28, -0.15, NdotL);

          float hemi = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 ambient = mix(uGroundColor, uSkyColor, hemi) * mix(0.62 + uEnvBoost, 0.36 + uEnvBoost, uIndoorMix);
          vec3 sunTerm = uSunColor * mix(1.22, 0.44, uIndoorMix) * cloudTerm;

          vec3 shadowHue = mix(uShadowTint, uIndoorShadowTint, uIndoorMix);
          vec3 darkTone = albedo * (shadowHue * 1.15 + ambient * 0.42);
          vec3 midTone = albedo * (ambient * 0.82 + sunTerm * 0.42);
          vec3 litTone = albedo * (sunTerm * 1.06 + ambient * 0.38);
          float sunScatter = pow(max(dot(-V, L), 0.0), 4.0) * (1.0 - uIndoorMix);
          litTone += uSunColor * albedo * sunScatter * 0.22;

          vec3 color = mix(darkTone, midTone, midBand);
          color = mix(color, litTone, litBand);

          // Graphic-Novel 45-degree Halftone dots inside shadow regions
          if (uHalftone > 0.001 && NdotL < 0.02) {
            float shadowMask = smoothstep(0.02, -0.25, NdotL);
            vec2 rotP = vec2(
              gl_FragCoord.x * 0.7071 - gl_FragCoord.y * 0.7071,
              gl_FragCoord.x * 0.7071 + gl_FragCoord.y * 0.7071
            ) * 0.24;
            vec2 cell = fract(rotP) - 0.5;
            float dotR = length(cell);
            float dotAlpha = 1.0 - smoothstep(0.18, 0.27, dotR);
            color = mix(color, color * 0.62, dotAlpha * shadowMask * uHalftone);
          }

          // Banded Stylized Specular + Pseudo-Environment Reflection for Metals
          vec3 H = normalize(L + V);
          float NdotH = max(dot(N, H), 0.0);
          float specPower = mix(18.0, 72.0, 1.0 - clamp(uRoughness, 0.05, 0.95));
          float rawSpec = pow(NdotH, specPower);
          float bandedSpec = smoothstep(0.32, 0.44, rawSpec);
          float specStrength = mix(0.14, 0.88, uMetalness);
          color += uSpecColor * bandedSpec * specStrength * (0.35 + 0.65 * litBand);

          if (uMetalness > 0.2) {
            vec3 R = reflect(-V, N);
            float envStripe = smoothstep(-0.15, 0.55, R.y) * 0.5 + smoothstep(0.35, 0.85, R.x) * 0.3;
            color += mix(albedo, uSpecColor, 0.4) * envStripe * uMetalness * 0.42;
          }

          // 4 Dynamic Real-Time Colored Point Lights (Powers, Doom, Braziers)
          for (int i = 0; i < 4; i++) {
            vec3 toL = uDynLightsPos[i] - vWorldPos;
            float dist = length(toL);
            float range = max(uDynLightsRange[i], 0.1);
            if (dist < range) {
              float att = pow(clamp(1.0 - dist / range, 0.0, 1.0), 1.65);
              float dNdotL = smoothstep(-0.2, 0.55, dot(N, normalize(toL)));
              color += albedo * uDynLightsColor[i] * att * (0.35 + 0.65 * dNdotL) * 1.15;
            }
          }

          // Heroic Rim Light
          float fresnel = pow(1.0 - max(dot(N, V), 0.0), uRimPower);
          float rimDir = clamp(N.y * 0.45 + dot(N, L) * 0.35 + 0.45, 0.0, 1.0);
          color += uRimColor * fresnel * uRimStrength * rimDir;

          // Selective Emissive (HDR > 1.0 feeds UnrealBloomPass cleanly)
          color += uEmissive * uEmissiveIntensity;

          // Aerial Perspective Atmospheric Fog
          float viewDist = length(cameraPosition - vWorldPos);
          float fogFactor = smoothstep(uFogNear, uFogFar, viewDist);
          float heightMix = clamp((vWorldPos.y + 4.0) / 55.0, 0.0, 1.0);
          vec3 outdoorFog = mix(uFogColorHorizon, uFogColorZenith, heightMix * 0.65);
          vec3 fogCol = mix(outdoorFog, uIndoorFogColor, uIndoorMix);
          color = mix(color, fogCol, fogFactor * (1.0 - min(uEmissiveIntensity * 0.45, 0.8)));

          gl_FragColor = vec4(color, uOpacity);
        }
      `
    });
  },

  // Smooth vertex-averaged outline geometry so ink outlines never split at sharp corners
  createSmoothOutlineGeometry(geometry) {
    const geom = geometry.clone();
    if (!geom.attributes.normal) {
      geom.computeVertexNormals();
    }
    const pos = geom.attributes.position;
    const norm = geom.attributes.normal;
    const smooth = new Float32Array(pos.count * 3);
    const accum = new Map();

    for (let i = 0; i < pos.count; i++) {
      const key = `${Math.round(pos.getX(i) * 350)}_${Math.round(pos.getY(i) * 350)}_${Math.round(pos.getZ(i) * 350)}`;
      let vec = accum.get(key);
      if (!vec) {
        vec = [0, 0, 0];
        accum.set(key, vec);
      }
      vec[0] += norm.getX(i);
      vec[1] += norm.getY(i);
      vec[2] += norm.getZ(i);
    }

    for (let i = 0; i < pos.count; i++) {
      const key = `${Math.round(pos.getX(i) * 350)}_${Math.round(pos.getY(i) * 350)}_${Math.round(pos.getZ(i) * 350)}`;
      const vec = accum.get(key);
      const len = Math.hypot(vec[0], vec[1], vec[2]) || 1;
      smooth[i * 3] = vec[0] / len;
      smooth[i * 3 + 1] = vec[1] / len;
      smooth[i * 3 + 2] = vec[2] / len;
    }

    geom.setAttribute('aSmoothNormal', new THREE.BufferAttribute(smooth, 3));
    return geom;
  },

  createInkOutlineMesh(geometry, thickness = 0.025, color = 0x090b15) {
    const outlineGeo = this.createSmoothOutlineGeometry(geometry);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uThickness: { value: thickness },
        uFogNear: GLOBAL_LIGHT_UNIFORMS.uFogNear,
        uFogFar: GLOBAL_LIGHT_UNIFORMS.uFogFar,
        uFogColorHorizon: GLOBAL_LIGHT_UNIFORMS.uFogColorHorizon,
        uIndoorFogColor: GLOBAL_LIGHT_UNIFORMS.uIndoorFogColor,
        uIndoorMix: GLOBAL_LIGHT_UNIFORMS.uIndoorMix
      },
      side: THREE.BackSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      vertexShader: `
        attribute vec3 aSmoothNormal;
        uniform float uThickness;
        varying float vDist;
        void main() {
          vec4 worldBase = modelMatrix * vec4(position, 1.0);
          float camDist = length(cameraPosition - worldBase.xyz);
          vDist = camDist;
          float scale = clamp(camDist * 0.075, 0.72, 2.2);
          vec3 extruded = position + aSmoothNormal * (uThickness * scale);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(extruded, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uFogNear;
        uniform float uFogFar;
        uniform vec3 uFogColorHorizon;
        uniform vec3 uIndoorFogColor;
        uniform float uIndoorMix;
        varying float vDist;
        void main() {
          float f = smoothstep(uFogNear, uFogFar, vDist);
          vec3 fogC = mix(uFogColorHorizon, uIndoorFogColor, uIndoorMix);
          gl_FragColor = vec4(mix(uColor, fogC, f * 0.85), 1.0);
        }
      `
    });
    const m = new THREE.Mesh(outlineGeo, mat);
    m.castShadow = false;
    m.receiveShadow = false;
    return m;
  },

  // Stylized Latverian Dusk Sky Dome with Cel Clouds & Multiversal Incursion Rift
  createSkyDomeMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: GLOBAL_LIGHT_UNIFORMS.uTime,
        uSunDir: GLOBAL_LIGHT_UNIFORMS.uSunDir,
        uIndoorMix: GLOBAL_LIGHT_UNIFORMS.uIndoorMix
      },
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSunDir;
        uniform float uIndoorMix;
        varying vec3 vDir;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        void main() {
          vec3 d = normalize(vDir);
          float h = clamp(d.y, -0.2, 1.0);

          // Sunset gradient inspired by Latveria reference art
          vec3 horizon = vec3(0.89, 0.62, 0.49);
          vec3 midSky  = vec3(0.42, 0.47, 0.72);
          vec3 zenith  = vec3(0.11, 0.14, 0.30);

          vec3 sky = mix(horizon, midSky, smoothstep(0.0, 0.28, h));
          sky = mix(sky, zenith, smoothstep(0.24, 0.80, h));

          // Warm western sun halo + crisp golden-hour sun disc
          float sunDot = max(dot(d, normalize(uSunDir)), 0.0);
          sky += vec3(1.0, 0.78, 0.46) * pow(sunDot, 7.5) * 0.68;
          sky += vec3(1.0, 0.96, 0.84) * smoothstep(0.994, 0.9985, sunDot) * 1.6;

          // Layered comic clouds with golden silver-lining near the sun
          if (h > 0.02) {
            vec2 uvC = d.xz / (h + 0.25) * 1.65 + vec2(uTime * 0.008, -uTime * 0.004);
            float n = noise(uvC) * 0.65 + noise(uvC * 2.4) * 0.35;
            float cloudBand = smoothstep(0.49, 0.58, n) * smoothstep(0.02, 0.16, h) * (1.0 - smoothstep(0.55, 0.92, h));
            vec3 cloudLight = mix(vec3(1.0, 0.84, 0.68), vec3(0.64, 0.72, 0.92), smoothstep(0.0, 0.45, h));
            cloudLight += vec3(1.0, 0.76, 0.42) * pow(sunDot, 4.0) * 0.42;
            vec3 cloudDark = vec3(0.24, 0.27, 0.46);
            vec3 cloudCol = mix(cloudDark, cloudLight, smoothstep(0.50, 0.72, n));
            sky = mix(sky, cloudCol, cloudBand * 0.82);
          }

          // Emerald-gold Incursion Fracture above Castle Doom (-Z sky)
          vec3 riftCenter = normalize(vec3(0.12, 0.38, -0.92));
          float riftDist = length(d - riftCenter);
          float angle = atan(d.y - riftCenter.y, d.x - riftCenter.x);
          float swirl = sin(angle * 5.0 - uTime * 1.3 + riftDist * 14.0) * 0.03;
          float core = 1.0 - smoothstep(0.04, 0.24, riftDist + swirl);
          float halo = 1.0 - smoothstep(0.12, 0.50, riftDist);
          sky += vec3(0.18, 0.95, 0.58) * halo * 0.42;
          sky += vec3(0.75, 1.0, 0.82) * core * 1.35;

          sky = mix(sky, vec3(0.04, 0.09, 0.12), uIndoorMix * 0.85);
          gl_FragColor = vec4(sky, 1.0);
        }
      `
    });
  },

  // ============================================================================
  // REAL SHADER VFX SUITE (Zero cheap primitive powers)
  // ============================================================================

  createSlashRibbonMaterial(coreHex, edgeHex) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uCore: { value: new THREE.Color(coreHex) },
        uEdge: { value: new THREE.Color(edgeHex) },
        uProgress: { value: 0.0 },
        uTime: GLOBAL_LIGHT_UNIFORMS.uTime
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uCore;
        uniform vec3 uEdge;
        uniform float uProgress;
        uniform float uTime;
        varying vec2 vUv;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
        }

        void main() {
          // vUv.x = arc angle [0..1], vUv.y = blade width [0..1]
          float head = smoothstep(uProgress * 1.35 - 0.85, uProgress * 1.35 - 0.10, vUv.x);
          float tailFade = 1.0 - smoothstep(0.65, 1.0, uProgress);
          float n = noise(vec2(vUv.x * 10.0 - uTime * 8.0, vUv.y * 6.0));
          float bladeProfile = sin(vUv.x * 3.14159);
          float edgeMask = smoothstep(0.05, 0.45, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
          float streak = smoothstep(0.28 + uProgress * 0.45, 0.88, n + bladeProfile * 0.65);

          float alpha = bladeProfile * edgeMask * head * tailFade * (0.45 + 0.55 * streak);
          vec3 col = mix(uEdge, uCore * 1.85, smoothstep(0.32, 0.85, vUv.y * bladeProfile));
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        }
      `
    });
  },

  createEldritchMandalaMaterial(colorHex = 0xf59e0b) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: GLOBAL_LIGHT_UNIFORMS.uTime,
        uColor: { value: new THREE.Color(colorHex) },
        uAlpha: { value: 0.95 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uAlpha;
        varying vec2 vUv;

        float ring(float r, float rad, float w) {
          return 1.0 - smoothstep(w * 0.35, w, abs(r - rad));
        }
        float polyDist(vec2 p, float n) {
          float a = atan(p.y, p.x) + 3.14159;
          float r = 6.28318 / n;
          return cos(floor(0.5 + a / r) * r - a) * length(p);
        }

        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float r = length(p);
          if (r > 0.99) discard;
          float ang = atan(p.y, p.x);

          float c1 = cos(uTime * 1.9), s1 = sin(uTime * 1.9);
          vec2 p1 = mat2(c1, -s1, s1, c1) * p;
          float c2 = cos(-uTime * 1.4), s2 = sin(-uTime * 1.4);
          vec2 p2 = mat2(c2, -s2, s2, c2) * p;

          float outerRing = ring(r, 0.91, 0.045) + ring(r, 0.82, 0.025);
          float midRing = ring(r, 0.56, 0.032) + ring(r, 0.25, 0.024);
          float runes = step(0.32, sin(ang * 16.0 + uTime * 3.5)) * ring(r, 0.865, 0.055);
          float sq1 = 1.0 - smoothstep(0.015, 0.042, abs(polyDist(p1, 4.0) - 0.55));
          float sq2 = 1.0 - smoothstep(0.015, 0.042, abs(polyDist(p2, 4.0) - 0.55));
          float hex = 1.0 - smoothstep(0.015, 0.04, abs(polyDist(p2, 6.0) - 0.36));

          float glow = (1.0 - smoothstep(0.0, 0.96, r)) * 0.22;
          float lineSum = clamp(outerRing + midRing + runes * 0.85 + sq1 + sq2 + hex + glow, 0.0, 1.8);
          vec3 col = mix(uColor, vec3(1.0, 0.97, 0.85), clamp(lineSum - 0.55, 0.0, 1.0));
          gl_FragColor = vec4(col * 1.35, clamp(lineSum * uAlpha, 0.0, 1.0));
        }
      `
    });
  },

  createMysticRuneMaterial(colorHex = 0x10b981) {
    return this.createEldritchMandalaMaterial(colorHex);
  },

  createEnergyShieldMaterial(colorHex = 0xf59e0b) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: GLOBAL_LIGHT_UNIFORMS.uTime,
        uColor: { value: new THREE.Color(colorHex) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        varying vec2 vUv;
        void main() {
          vec3 V = normalize(cameraPosition - vWorldPos);
          float rim = pow(1.0 - abs(dot(normalize(vNormalW), V)), 2.4);
          float wave = sin(vUv.y * 28.0 - uTime * 5.0) * 0.5 + 0.5;
          float alpha = clamp(rim * 0.95 + wave * 0.10, 0.0, 0.9);
          vec3 col = mix(uColor, vec3(1.0, 0.96, 0.8), rim * 0.65);
          gl_FragColor = vec4(col * 1.4, alpha);
        }
      `
    });
  },

  createShockwaveRingMaterial(colorHex = 0x38bdf8) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(colorHex) },
        uProgress: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uProgress;
        varying vec2 vUv;
        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float r = length(p);
          if (r > 1.0) discard;
          float ang = atan(p.y, p.x);
          float wobble = sin(ang * 12.0 + uProgress * 12.0) * 0.025;
          float mainRing = 1.0 - smoothstep(0.02, 0.14, abs(r - 0.84 + wobble));
          float innerRing = 1.0 - smoothstep(0.02, 0.10, abs(r - 0.62));
          float fade = 1.0 - smoothstep(0.45, 1.0, uProgress);
          float intensity = (mainRing * 1.3 + innerRing * 0.6) * fade;
          vec3 col = mix(uColor, vec3(1.0), mainRing * 0.55);
          gl_FragColor = vec4(col * 1.5, clamp(intensity, 0.0, 1.0));
        }
      `
    });
  },

  createBeamShaderMaterial(coreHex = 0xffffff, outerHex = 0x10b981) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: GLOBAL_LIGHT_UNIFORMS.uTime,
        uCore: { value: new THREE.Color(coreHex) },
        uOuter: { value: new THREE.Color(outerHex) },
        uAlpha: { value: 1.0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uCore;
        uniform vec3 uOuter;
        uniform float uAlpha;
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        void main() {
          vec3 V = normalize(cameraPosition - vWorldPos);
          float facing = abs(dot(normalize(vNormalW), V));
          float streak = sin(vUv.y * 26.0 - uTime * 18.0) * 0.5 + 0.5;
          float pulse = sin(vUv.y * 10.0 - uTime * 28.0) * 0.25 + 0.75;
          vec3 col = mix(uOuter, uCore * 1.8, pow(facing, 1.6));
          float a = (0.35 + 0.65 * facing) * (0.65 + 0.35 * streak) * pulse * uAlpha;
          gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
        }
      `
    });
  },

  createFlameMaterial(coreHex = 0xa7f3d0, edgeHex = 0x059669) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: GLOBAL_LIGHT_UNIFORMS.uTime,
        uCore: { value: new THREE.Color(coreHex) },
        uEdge: { value: new THREE.Color(edgeHex) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float sway = sin(uTime * 6.5 + pos.y * 3.8 + pos.x * 2.0) * 0.14 * uv.y;
          pos.x += sway;
          pos.z += cos(uTime * 5.2 + pos.y * 4.0) * 0.10 * uv.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uCore;
        uniform vec3 uEdge;
        varying vec2 vUv;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
        }
        void main() {
          float n = noise(vec2(vUv.x * 5.0, vUv.y * 4.5 - uTime * 3.8));
          float shape = (1.0 - vUv.y) * (1.0 - abs(vUv.x - 0.5) * 1.9);
          float flame = smoothstep(0.18, 0.65, shape + n * 0.42);
          vec3 col = mix(uEdge, uCore * 1.8, smoothstep(0.45, 0.92, flame));
          gl_FragColor = vec4(col, clamp(flame * 0.95, 0.0, 1.0));
        }
      `
    });
  },

  createGodRayMaterial(colorHex = 0x6ee7b7, opacity = 0.22) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(colorHex) },
        uOpacity: { value: opacity },
        uTime: GLOBAL_LIGHT_UNIFORMS.uTime
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        void main() {
          vec3 V = normalize(cameraPosition - vWorldPos);
          float edgeSoft = pow(abs(dot(normalize(vNormalW), V)), 1.5);
          float verticalFade = smoothstep(0.0, 0.22, vUv.y) * (1.0 - smoothstep(0.45, 1.0, vUv.y));
          float shimmer = 0.85 + 0.15 * sin(uTime * 1.2 + vUv.x * 6.0);
          gl_FragColor = vec4(uColor * 1.25, edgeSoft * verticalFade * shimmer * uOpacity);
        }
      `
    });
  },

  createContactShadowMaterial() {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          float r = length(vUv - 0.5) * 2.0;
          float a = (1.0 - smoothstep(0.15, 0.98, r)) * 0.48;
          gl_FragColor = vec4(0.07, 0.05, 0.15, a);
        }
      `
    });
  },

  // Post-processing Color Grading (3-Way Lift/Gamma/Gain) + ACES Filmic + Micro-Sharpen + Chromatic Pulse
  CinematicColorGradeShader: {
    uniforms: {
      tDiffuse: { value: null },
      uResolution: { value: new THREE.Vector2(1280, 720) },
      uIndoorMix: GLOBAL_LIGHT_UNIFORMS.uIndoorMix,
      uGradeLift: GLOBAL_LIGHT_UNIFORMS.uGradeLift,
      uGradeGamma: GLOBAL_LIGHT_UNIFORMS.uGradeGamma,
      uGradeGain: GLOBAL_LIGHT_UNIFORMS.uGradeGain,
      uDangerFlash: GLOBAL_LIGHT_UNIFORMS.uDangerFlash,
      uChromaPulse: { value: 0.0 },
      uSlowMoMix: { value: 0.0 },
      uTime: GLOBAL_LIGHT_UNIFORMS.uTime
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 uResolution;
      uniform float uIndoorMix;
      uniform vec3 uGradeLift;
      uniform vec3 uGradeGamma;
      uniform vec3 uGradeGain;
      uniform float uDangerFlash;
      uniform float uChromaPulse;
      uniform float uSlowMoMix;
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        vec2 texel = 1.0 / max(uResolution, vec2(1.0));
        vec2 centerVec = vUv - 0.5;
        float dist = length(centerVec);

        // Clean subtle radial chromatic aberration (never blurs houses/grass)
        float ca = (0.00015 + min(uChromaPulse, 0.3) * 0.0015) * dist;
        vec2 dir = dist > 0.0001 ? centerVec / dist : vec2(0.0);
        float r = texture2D(tDiffuse, vUv + dir * ca).r;
        float g = texture2D(tDiffuse, vUv).g;
        float b = texture2D(tDiffuse, vUv - dir * ca).b;
        vec3 col = vec3(r, g, b);

        // Subtle Unsharp Mask for crisp comic ink edges & texture detail
        vec3 blur = (
          texture2D(tDiffuse, vUv + vec2(texel.x, 0.0)).rgb +
          texture2D(tDiffuse, vUv - vec2(texel.x, 0.0)).rgb +
          texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).rgb +
          texture2D(tDiffuse, vUv - vec2(0.0, texel.y)).rgb
        ) * 0.25;
        col += (col - blur) * 0.22;

        // 3-Way Color Grading (Lift / Gamma / Gain per biome)
        col = max(col, vec3(0.0));
        col = col * uGradeGain + uGradeLift * (1.0 - smoothstep(0.0, 0.65, dot(col, vec3(0.333))));
        col = pow(max(col, vec3(0.0001)), 1.0 / max(uGradeGamma, vec3(0.5)));

        // Single-Pass ACES Filmic Tone Mapping (Narkowicz)
        col *= mix(1.06, 0.96, uIndoorMix);
        col = clamp((col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14), 0.0, 1.0);
        col = pow(col, vec3(0.97));

        float luma = dot(col, vec3(0.299, 0.587, 0.114));
        float sat = mix(1.26, 0.45, uSlowMoMix);
        col = mix(vec3(luma), col, sat);

        // Subtle danger red edge pulse on unblockable attacks
        if (uDangerFlash > 0.001) {
          float edgeMask = smoothstep(0.34, 0.72, dist);
          col = mix(col, vec3(0.95, 0.12, 0.20), edgeMask * uDangerFlash * 0.48);
        }

        // Subtle cinematic vignette + micro film grain
        float vig = 1.0 - smoothstep(0.52, 0.96, dist) * (0.24 + uSlowMoMix * 0.24);
        col *= vig;

        float grain = (fract(sin(dot(vUv * uResolution + uTime * 37.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.018;
        col += grain;

        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }
    `
  }
};

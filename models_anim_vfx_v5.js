// ============================================================================
// AVENGERS: DOOMSDAY — V5: ANATOMICAL DETAIL LAYER, PROCEDURAL ANIM 2.0, PRO VFX
// ============================================================================
(function () {
  if (typeof CharacterBuilder === 'undefined' || typeof THREE === 'undefined') return;
  const CB = CharacterBuilder;

  // ---------- shared soft radial texture for additive VFX ----------
  function radialTex(inner, outer) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, inner); g.addColorStop(0.25, inner); g.addColorStop(1, outer);
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }
  const TEX_GLOW = radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  const TEX_STAR = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'); x.translate(64, 64);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    for (let i = 0; i < 4; i++) { x.rotate(Math.PI / 4); x.beginPath(); x.ellipse(0, 0, 64, 6, 0, 0, Math.PI * 2); x.fill(); }
    x.beginPath(); x.arc(0, 0, 18, 0, Math.PI * 2); x.fill();
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  })();
  const TEX_RING = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 70, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.75, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  })();
  const TEX_RUNE = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const x = c.getContext('2d'); x.translate(256, 256); x.strokeStyle = '#fff'; x.fillStyle = '#fff';
    x.lineWidth = 6; x.beginPath(); x.arc(0, 0, 240, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 205, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.arc(0, 0, 120, 0, Math.PI * 2); x.stroke();
    for (let k = 0; k < 2; k++) { x.beginPath(); for (let i = 0; i <= 3; i++) { const a = i / 3 * Math.PI * 2 + k * Math.PI / 3; x.lineTo(Math.cos(a) * 205, Math.sin(a) * 205); } x.stroke(); }
    x.font = 'bold 26px serif'; x.textAlign = 'center';
    const glyphs = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
    for (let i = 0; i < 24; i++) { x.save(); x.rotate(i / 24 * Math.PI * 2); x.fillText(glyphs[i], 0, -214); x.restore(); }
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  })();

  function addMat(color, tex, op = 1) {
    return new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  }

  // ---------- 1. ANATOMICAL DETAIL LAYER REPLACED BY CHARACTERS_V2 ANIME LOW-POLY ----------
  // Legacy sculptedBlob detailHero/detailBoss removed so models stay crisp, low-poly, and high-FPS.

  // ---------- 2. PROCEDURAL ANIMATION DELEGATED TO UNIFIED RIG IN characters.js ----------
  // Removed duplicate additive animation wrapper that caused limb Z-rotation conflicts.

  // ---------- 3. PROFESSIONAL VFX LAYER (game hooks) ----------
  if (typeof DoomsdayGame === 'undefined') return;
  const G = DoomsdayGame.prototype;
  G._v5fx = function () { if (!this._fxList) this._fxList = []; return this._fxList; };

  const _SHARED_PLANE = new THREE.PlaneGeometry(1, 1);

  G._ensurePools = function () {
    if (this._dashGhostPool) return;
    // Pre-allocated low-poly anime dash silhouette pool (zero runtime clone/allocations!)
    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.2, 1.35, 6);
    bodyGeo.translate(0, 1.05, 0);
    const headGeo = new THREE.OctahedronGeometry(0.24, 0);
    headGeo.translate(0, 1.92, 0);
    const finGeo = new THREE.ConeGeometry(0.16, 0.9, 4);
    finGeo.rotateX(-Math.PI * 0.42);
    finGeo.translate(0, 1.35, -0.36);

    this._dashGhostPool = [];
    for (let i = 0; i < 5; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        wireframe: i % 2 === 1
      });
      const g = new THREE.Group();
      g.add(new THREE.Mesh(bodyGeo, mat));
      g.add(new THREE.Mesh(headGeo, mat));
      g.add(new THREE.Mesh(finGeo, mat));
      g.visible = false;
      this.scene.add(g);
      this._dashGhostPool.push({ group: g, mat, life: 0, max: 0.26, active: false });
    }
    this._dashGhostCursor = 0;

    // Pre-allocated Sprite & Decal pools to avoid per-hit geometry/material churn
    this._v5SpritePool = [];
    for (let i = 0; i < 28; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: TEX_GLOW, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      sp.visible = false;
      this.scene.add(sp);
      this._v5SpritePool.push({ o: sp, life: 0, max: 0.2, size: 1, grow: 1, spin: 0, active: false });
    }
    this._v5DecalPool = [];
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(_SHARED_PLANE, addMat(0xffffff, TEX_RING, 1));
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      this.scene.add(m);
      this._v5DecalPool.push({ o: m, life: 0, max: 0.3, size: 1, grow: 1, spin: 0, active: false });
    }
  };

  G.v5Sprite = function (pos, color, tex, size, life, opts = {}) {
    this._ensurePools();
    let slot = null;
    for (let i = 0; i < this._v5SpritePool.length; i++) {
      if (!this._v5SpritePool[i].active) { slot = this._v5SpritePool[i]; break; }
    }
    if (!slot) slot = this._v5SpritePool[0];
    const sp = slot.o;
    sp.material.map = tex;
    sp.material.color.set(color);
    sp.material.opacity = 1;
    sp.material.rotation = Math.random() * 6.28;
    sp.position.copy(pos);
    sp.scale.setScalar(size * (opts.start || 0.3));
    sp.visible = true;
    slot.life = life; slot.max = life; slot.size = size;
    slot.grow = opts.grow || 1; slot.spin = opts.spin || 0; slot.active = true;
  };

  G.v5Decal = function (pos, color, tex, size, life, opts = {}) {
    this._ensurePools();
    let slot = null;
    for (let i = 0; i < this._v5DecalPool.length; i++) {
      if (!this._v5DecalPool[i].active) { slot = this._v5DecalPool[i]; break; }
    }
    if (!slot) slot = this._v5DecalPool[0];
    const m = slot.o;
    m.material.map = tex;
    m.material.color.set(color);
    m.material.opacity = 1;
    m.position.set(pos.x, pos.y + 0.08, pos.z);
    m.scale.setScalar(size * (opts.start || 0.2));
    m.visible = true;
    slot.life = life; slot.max = life; slot.size = size;
    slot.grow = opts.grow || 1; slot.spin = opts.spin || 0; slot.active = true;
  };

  // Layered impact: flash + star burst + expanding ring + GPU sparks + ground decal
  G.v5Impact = function (pos, color, heavy) {
    const k = heavy ? 1.6 : 1;
    const c = new THREE.Color(color);
    this.v5Sprite(pos, 0xffffff, TEX_GLOW, 2.4 * k, 0.12, { start: 0.6 });
    this.v5Sprite(pos, c, TEX_STAR, 3.6 * k, 0.2, { start: 0.4, spin: 6 });
    this.v5Sprite(pos, c, TEX_RING, 4.2 * k, 0.28, { start: 0.15 });
    if (this.vfx) {
      this.vfx.emitBurst(pos, { color: c.getHex(), count: heavy ? 46 : 22, speed: heavy ? 22 : 15, size: 1.6, life: 0.5 });
      this.vfx.emitBurst(pos, { color: 0xffffff, count: heavy ? 14 : 6, speed: 30, size: 0.9, life: 0.18 });
    }
    if (heavy) {
      const g = pos.clone(); g.y = this.world.getGroundHeight(g.x, g.z);
      this.v5Decal(g, c, TEX_RING, 7, 0.45, { start: 0.2 });
    }
  };

  // Magic circle under caster for skills/ults
  G.v5Cast = function (color, size = 6, life = 0.9) {
    const g = this.playerState.pos.clone(); g.y = this.world.getGroundHeight(g.x, g.z) + 0.05;
    if (this.playerState.isFlying) g.y = this.playerState.pos.y - 0.1;
    this.v5Decal(g, color, TEX_RUNE, size, life, { start: 0.3, spin: 1.8 });
    this.v5Sprite(this.playerState.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), color, TEX_GLOW, size * 0.8, 0.35, { start: 0.2 });
    if (this.vfx) this.vfx.emitRing(g, size * 0.5, { color, count: 40, speed: -6 });
  };

  const hookOnce = (name, fn) => { const o = G[name]; if (!o) return; G[name] = function (...a) { const r = o.apply(this, a); try { fn.apply(this, a); } catch (e) {} return r; }; };

  hookOnce('applyTargetHit', function (target, dmg, color, heavy) {
    if (!target || !target.pos) return;
    const big = target.ref && target.ref.type === 'sentinel';
    const col = color || '#ffffff';
    const p = target.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, big ? 6 : 1.5, (Math.random() - 0.5) * 0.6));
    this.v5Impact(p, col, heavy);
    // Punch de escala seguro nos inimigos atingidos + anel duplo + faíscas direcionais GPU
    if (target.ref && target.ref.mesh && !target.ref.isEnergyTower) {
      const m = target.ref.mesh;
      if (!target.ref._baseScale) target.ref._baseScale = m.scale.clone();
      target.ref._punchTimer = 0.14;
      this._punchedRefs = this._punchedRefs || [];
      if (this._punchedRefs.indexOf(target.ref) === -1) this._punchedRefs.push(target.ref);
      m.scale.copy(target.ref._baseScale).multiplyScalar(heavy ? 1.13 : 1.07);
    }
    this.v5Decal(p, col, TEX_RING, heavy ? 4.4 : 2.6, heavy ? 0.34 : 0.22);
    if (this.vfxPro && this.vfxPro.p) {
      this.vfxPro.p.cone(p.x, p.y, p.z, 0, 0.55, 0, new THREE.Color(col).getHex(), heavy ? 18 : 9, heavy ? 16 : 11, 0.45, 0.36, 1.35);
    }
  });
  hookOnce('toggleFlight', function () {
    if (this.playerState && this.playerState.isFlying && this.vfxPro && this.vfxPro.p) {
      const p = this.playerState.pos;
      const hex = HEROES_DATA[this.selectedHeroId].colorHex;
      this.vfxPro.p.ring(p.x, p.y + 0.35, p.z, hex, 22, 2.2, 6.5, 0.48, 0.35);
    }
  });
  hookOnce('startSpiderWebSwing', function () {
    if (this.playerState && this.playerState.isSwinging && this.vfxPro && this.vfxPro.p) {
      const p = this.playerState.pos;
      this.vfxPro.p.ring(p.x, p.y + 0.7, p.z, 0xf8fafc, 16, 1.8, 3.0, 0.42, 0.28);
    }
  });
  hookOnce('triggerSpecialSkill', function () { const h = HEROES_DATA[this.selectedHeroId]; this.v5Cast(h.colorHex, 7, 1.0); });
  hookOnce('triggerUltimate', function () {
    const h = HEROES_DATA[this.selectedHeroId];
    this.v5Cast(h.colorHex, 14, 1.6);
    this.v5Cast(h.accentHex || 0xffffff, 9, 1.3);
    if (this.vfx) this.vfx.spawnVolumetricBeam(this.playerState.pos.clone(), this.playerState.pos.clone().add(new THREE.Vector3(0, 40, 0)), { color: h.colorHex, coreColor: 0xffffff, width: 2.4, duration: 0.6 });
  });
  hookOnce('triggerDash', function () {
    this._ensurePools();
    const h = HEROES_DATA[this.selectedHeroId];
    this._dashGhosts = 5; this._ghostCd = 0; this._ghostCol = h.colorHex;
    const p = this.playerState.pos.clone(); p.y += 0.2;
    this.v5Decal(p, h.colorHex, TEX_RING, 3.8, 0.28);
    if (this.vfxPro && this.vfxPro.p) {
      const fwd = new THREE.Vector3(Math.sin(this.playerState.yaw), 0, Math.cos(this.playerState.yaw));
      this.vfxPro.p.cone(p.x, p.y + 1.0, p.z, -fwd.x, 0.2, -fwd.z, h.colorHex, 16, 12, 0.55, 0.35, 0.5);
    }
  });

  // Zero-allocation pooled low-poly anime dash afterimages (no clone(true) lag!)
  G.v5Ghost = function () {
    if (!this.playerMesh) return;
    this._ensurePools();
    const slot = this._dashGhostPool[this._dashGhostCursor % this._dashGhostPool.length];
    this._dashGhostCursor++;
    slot.group.position.copy(this.playerState.pos);
    slot.group.rotation.y = this.playerState.yaw;
    slot.group.rotation.x = 0.42;
    slot.group.scale.set(0.95, 1.05, 1.15);
    slot.mat.color.setHex(this._ghostCol || 0x38bdf8);
    slot.mat.opacity = 0.58;
    slot.life = slot.max;
    slot.active = true;
    slot.group.visible = true;
  };

  const _upd = G.updateWorldFXAndProjectiles;
  G.updateWorldFXAndProjectiles = function (delta, time) {
    _upd.call(this, delta, time);
    if (this._dashGhosts > 0) {
      this._ghostCd -= delta;
      if (this._ghostCd <= 0) { this._ghostCd = 0.045; this._dashGhosts--; this.v5Ghost(); }
    }
    if (this._dashGhostPool) {
      for (let i = 0; i < this._dashGhostPool.length; i++) {
        const g = this._dashGhostPool[i];
        if (!g.active) continue;
        g.life -= delta;
        if (g.life <= 0) { g.active = false; g.group.visible = false; continue; }
        const t = 1 - g.life / g.max;
        g.mat.opacity = 0.58 * (1 - t) * (1 - t);
        g.group.scale.multiplyScalar(1 + delta * 0.6);
      }
    }
    if (this._v5SpritePool) {
      for (let i = 0; i < this._v5SpritePool.length; i++) {
        const f = this._v5SpritePool[i];
        if (!f.active) continue;
        f.life -= delta;
        if (f.life <= 0) { f.active = false; f.o.visible = false; continue; }
        const t = 1 - f.life / f.max;
        const ease = 1 - Math.pow(1 - t, 3);
        const s = f.size * (0.3 + ease * 0.7 * f.grow);
        f.o.scale.set(s, s, s);
        f.o.material.opacity = (1 - t) * (1 - t);
        f.o.material.rotation += f.spin * delta;
      }
    }
    if (this._v5DecalPool) {
      for (let i = 0; i < this._v5DecalPool.length; i++) {
        const f = this._v5DecalPool[i];
        if (!f.active) continue;
        f.life -= delta;
        if (f.life <= 0) { f.active = false; f.o.visible = false; continue; }
        const t = 1 - f.life / f.max;
        const ease = 1 - Math.pow(1 - t, 3);
        const s = f.size * (0.3 + ease * 0.7 * f.grow);
        f.o.scale.set(s, s, s);
        f.o.material.opacity = (1 - t) * (1 - t);
        f.o.rotation.z += f.spin * delta;
      }
    }
    if (this._punchedRefs && this._punchedRefs.length > 0) {
      for (let i = this._punchedRefs.length - 1; i >= 0; i--) {
        const ref = this._punchedRefs[i];
        ref._punchTimer -= delta;
        if (!ref.mesh || !ref._baseScale || ref._punchTimer <= 0) {
          if (ref.mesh && ref._baseScale) ref.mesh.scale.copy(ref._baseScale);
          this._punchedRefs.splice(i, 1);
        } else {
          ref.mesh.scale.lerp(ref._baseScale, Math.min(1, delta * 18));
        }
      }
    }
    if (this.playerState && this.vfxPro && this.vfxPro.p && this.playerState.vel.lengthSq() > 260 && Math.random() < 0.28) {
      const ps = this.playerState;
      const col = ps.isGrounded ? 0xdbeafe : HEROES_DATA[this.selectedHeroId].colorHex;
      this.vfxPro.p.cone(ps.pos.x, ps.pos.y + 0.35, ps.pos.z, -ps.vel.x * 0.04, 0.25, -ps.vel.z * 0.04, col, 3, 5.5, 0.32, 0.26, 0.6);
    }
  };

  // Clean selective bloom so powers glow crisply without whiteout
  const _start = G.startGame;
  G.startGame = function () { const r = _start.apply(this, arguments); if (this.bloomPass) { this.bloomPass.strength = 0.18; this.bloomPass.radius = 0.36; this.bloomPass.threshold = 0.92; } return r; };
})();

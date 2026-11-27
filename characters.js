// ============================================================================
// AVENGERS: DOOMSDAY — CARTOON LOW-POLY PROFESSIONAL HEROES, UV TEXTURES & RIG
// ============================================================================

class ClothSim {
  constructor(opts = {}) {
    this.cols = opts.cols || 7;
    this.rows = opts.rows || 9;
    this.widthTop = opts.widthTop || 0.78;
    this.widthBot = opts.widthBot || 1.48;
    this.length = opts.length || 1.72;
    this.gravity = opts.gravity !== undefined ? opts.gravity : -21.0;
    this.damping = opts.damping !== undefined ? opts.damping : 0.945;
    this.windStrength = opts.windStrength !== undefined ? opts.windStrength : 1.0;

    this.detached = false;
    this.detachedCenter = new THREE.Vector3();

    this.points = [];
    this.prevPoints = [];
    this.pinned = new Uint8Array(this.cols * this.rows);
    this.constraints = [];

    for (let r = 0; r < this.rows; r++) {
      const ty = r / (this.rows - 1);
      const rowW = this.widthTop + (this.widthBot - this.widthTop) * Math.pow(ty, 0.85);
      for (let c = 0; c < this.cols; c++) {
        const tx = c / (this.cols - 1) - 0.5;
        const p = new THREE.Vector3(tx * rowW, -ty * this.length, -0.18 - ty * 0.14);
        this.points.push(p);
        this.prevPoints.push(p.clone());
        this.pinned[r * this.cols + c] = r === 0 ? 1 : 0;
      }
    }

    const addConstraint = (a, b, stiffness = 1.0) => {
      const rest = this.points[a].distanceTo(this.points[b]);
      this.constraints.push({ a, b, rest, stiffness });
    };

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const idx = r * this.cols + c;
        if (c < this.cols - 1) addConstraint(idx, idx + 1, 0.98);
        if (r < this.rows - 1) addConstraint(idx, idx + this.cols, 1.0);
        if (c < this.cols - 1 && r < this.rows - 1) {
          addConstraint(idx, idx + this.cols + 1, 0.72);
          addConstraint(idx + 1, idx + this.cols, 0.72);
        }
        if (r < this.rows - 2) {
          addConstraint(idx, idx + this.cols * 2, 0.45);
        }
      }
    }

    this.geometry = new THREE.BufferGeometry();
    const vertCount = this.cols * this.rows;
    this.positions = new Float32Array(vertCount * 3);
    const uvs = new Float32Array(vertCount * 2);
    const indices = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = r * this.cols + c;
        uvs[i * 2] = c / (this.cols - 1);
        uvs[i * 2 + 1] = 1.0 - r / (this.rows - 1);
      }
    }
    for (let r = 0; r < this.rows - 1; r++) {
      for (let c = 0; c < this.cols - 1; c++) {
        const a = r * this.cols + c;
        const b = a + 1;
        const d = a + this.cols;
        const e = d + 1;
        indices.push(a, d, b);
        indices.push(b, d, e);
      }
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    this.geometry.setIndex(indices);

    this.material = opts.material || new THREE.MeshStandardMaterial({
      color: opts.color || 0x064e3b,
      roughness: 0.62,
      metalness: 0.14,
      side: THREE.DoubleSide
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;
    this.mesh.frustumCulled = false;

    this._tmpDiff = new THREE.Vector3();
    this._tmpAnchor = new THREE.Vector3();
    this._tmpBack = new THREE.Vector3(0, 0, -1);
    this._initializedWorld = false;
  }

  update(delta, time, leftWorld, rightWorld, backDir, bodyCenter, bodyRadius = 0.45, groundY = 0) {
    const dt = Math.min(Math.max(delta || 0.016, 0.001), 0.033);
    const t = typeof time === 'number' ? time : 0;

    if (time && typeof time === 'object' && typeof time.elements !== 'undefined') {
      const mat = time;
      for (let c = 0; c < this.cols; c++) {
        const tx = c / (this.cols - 1) - 0.5;
        this._tmpAnchor.set(tx * this.widthTop, 0, -0.16).applyMatrix4(mat);
        this.points[c].copy(this._tmpAnchor);
        this.prevPoints[c].copy(this._tmpAnchor);
      }
      const posAttr = this.geometry.attributes.position;
      for (let i = 0; i < this.points.length; i++) {
        posAttr.setXYZ(i, this.points[i].x, this.points[i].y, this.points[i].z);
      }
      posAttr.needsUpdate = true;
      this.geometry.computeVertexNormals();
      return;
    }

    const back = backDir && backDir.isVector3 ? backDir : this._tmpBack;

    if (this.detached) {
      const center = this.detachedCenter || this._tmpAnchor;
      for (let c = 0; c < this.cols; c++) {
        const ang = (c / (this.cols - 1) - 0.5) * Math.PI * 1.4 + t * 5.0;
        const p = this.points[c];
        p.set(
          center.x + Math.cos(ang) * 0.52,
          center.y + 0.35 + Math.sin(t * 7 + c) * 0.12,
          center.z + Math.sin(ang) * 0.52
        );
        this.prevPoints[c].copy(p);
      }
    } else if (leftWorld && rightWorld && leftWorld.isVector3 && rightWorld.isVector3) {
      if (!this._initializedWorld || this.points[0].distanceToSquared(leftWorld) > 140) {
        this._initializedWorld = true;
        for (let r = 0; r < this.rows; r++) {
          const ty = r / (this.rows - 1);
          for (let c = 0; c < this.cols; c++) {
            const u = c / (this.cols - 1);
            const p = this.points[r * this.cols + c];
            p.lerpVectors(leftWorld, rightWorld, u);
            p.y -= ty * this.length;
            p.addScaledVector(back, 0.14 + ty * 0.24);
            this.prevPoints[r * this.cols + c].copy(p);
          }
        }
      } else {
        for (let c = 0; c < this.cols; c++) {
          const u = c / (this.cols - 1);
          this.points[c].lerpVectors(leftWorld, rightWorld, u);
          this.prevPoints[c].copy(this.points[c]);
        }
      }
    }

    const dt2 = dt * dt;
    const windX = Math.sin(t * 2.4) * 4.5 * this.windStrength;
    const windZ = Math.cos(t * 1.9) * 3.5 * this.windStrength;

    for (let i = this.cols; i < this.points.length; i++) {
      if (this.pinned[i]) continue;
      const p = this.points[i];
      const prev = this.prevPoints[i];
      const vx = (p.x - prev.x) * this.damping;
      const vy = (p.y - prev.y) * this.damping;
      const vz = (p.z - prev.z) * this.damping;
      prev.copy(p);

      const flutter = Math.sin(t * 6.5 + i * 0.6) * 2.8 * this.windStrength;
      p.x += vx + (windX + back.x * 5.2 + flutter * 0.25) * dt2;
      p.y += vy + (this.detached ? -4.0 : this.gravity) * dt2;
      p.z += vz + (windZ + back.z * 5.2 + flutter * 0.25) * dt2;
    }

    const minY = (typeof groundY === 'number' ? groundY : 0) + 0.05;
    for (let iter = 0; iter < 3; iter++) {
      for (let k = 0; k < this.constraints.length; k++) {
        const ct = this.constraints[k];
        const pa = this.points[ct.a];
        const pb = this.points[ct.b];
        this._tmpDiff.subVectors(pb, pa);
        const dist = this._tmpDiff.length();
        if (dist < 0.0001) continue;
        const diff = ((dist - ct.rest) / dist) * ct.stiffness;
        const pinA = this.pinned[ct.a];
        const pinB = this.pinned[ct.b];
        if (pinA && pinB) continue;
        if (pinA) {
          pb.addScaledVector(this._tmpDiff, -diff);
        } else if (pinB) {
          pa.addScaledVector(this._tmpDiff, diff);
        } else {
          pa.addScaledVector(this._tmpDiff, diff * 0.5);
          pb.addScaledVector(this._tmpDiff, -diff * 0.5);
        }
      }

      if (!this.detached && bodyCenter && bodyCenter.isVector3) {
        for (let i = this.cols; i < this.points.length; i++) {
          const p = this.points[i];
          const dx = p.x - bodyCenter.x;
          const dz = p.z - bodyCenter.z;
          const dSq = dx * dx + dz * dz;
          if (dSq < bodyRadius * bodyRadius && p.y > bodyCenter.y - 1.1 && p.y < bodyCenter.y + 0.65) {
            const d = Math.sqrt(dSq) || 0.001;
            const push = (bodyRadius - d) / d;
            p.x += dx * push;
            p.z += dz * push;
          }
          if (p.y < minY) p.y = minY;
        }
      }
    }

    const posAttr = this.geometry.attributes.position;
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      posAttr.setXYZ(i, p.x, p.y, p.z);
    }
    posAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}

// ============================================================================
// CLEAN CARTOON LOW-POLY GEOMETRY BUILDER (CENTERED FRONT UV AT U=0.5, +Z)
// ============================================================================
class SculptGeo {
  static cartoonLoft(profiles, radialSegs = 22) {
    const geo = new THREE.BufferGeometry();
    const rings = profiles.length;
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let r = 0; r < rings; r++) {
      const p = profiles[r];
      const y = p.y;
      const rx = p.rx || 0.25;
      const rz = p.rz || rx;
      const ox = p.ox || 0;
      const oz = p.oz || 0;
      const frontFlat = p.frontFlat || 0;
      const backFlat = p.backFlat || 0;
      const v = rings > 1 ? r / (rings - 1) : 0;

      for (let s = 0; s <= radialSegs; s++) {
        const u = s / radialSegs;
        // Map u=0.5 directly to +Z (front face), u=0 and u=1 to -Z (back seam)
        const theta = (u - 0.5) * Math.PI * 2 + Math.PI * 0.5;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        let localRx = rx;
        let localRz = rz;
        if (p.latV && Math.abs(cosT) > 0.35 && sinT < 0.35) {
          localRx += p.latV * Math.pow(Math.abs(cosT), 1.4);
        }
        if (p.pecShelf && sinT > 0.20) {
          localRz += p.pecShelf * Math.pow(sinT, 1.3);
        }
        if (p.gluteCurve && sinT < -0.18) {
          localRz += p.gluteCurve * Math.pow(-sinT, 1.4);
        }
        if (p.calfCurve && sinT < -0.15) {
          localRz += p.calfCurve * Math.pow(-sinT, 1.3);
        }
        if (p.jawChisel && sinT > 0.12) {
          localRx *= (1.0 - p.jawChisel * 0.42 * sinT);
          localRz += p.jawChisel * 0.045 * Math.pow(sinT, 2.2);
        }
        if (p.browRidge && sinT > 0.50) {
          localRz += p.browRidge * Math.pow((sinT - 0.50) * 2.0, 1.5);
        }

        let x = ox + cosT * localRx;
        let z = sinT * localRz;
        if (frontFlat && z > 0) z *= (1 - frontFlat);
        if (backFlat && z < 0) z *= (1 - backFlat);
        if (p.chestCrease && sinT > 0.35) {
          z -= p.chestCrease * Math.exp(-Math.pow(cosT * 3.8, 2));
        }
        positions.push(x, y, oz + z);
        uvs.push(1 - u, v);
      }
    }

    const cols = radialSegs + 1;
    for (let r = 0; r < rings - 1; r++) {
      for (let s = 0; s < radialSegs; s++) {
        const a = r * cols + s;
        const b = a + 1;
        const c = (r + 1) * cols + s;
        const d = c + 1;
        const dy = profiles[r + 1].y - profiles[r].y;
        if (dy >= 0) {
          indices.push(a, c, b, b, c, d);
        } else {
          indices.push(a, b, c, b, d, c);
        }
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  static heroHead(scale = 1.0, opts = {}) {
    const chiseled = opts.chiseled !== undefined ? opts.chiseled : 1.0;
    return this.cartoonLoft([
      { y: -0.185 * scale, rx: 0.088 * scale, rz: 0.105 * scale, oz: 0.032 * scale, jawChisel: 0.28 * chiseled, frontFlat: 0.10 },
      { y: -0.115 * scale, rx: 0.132 * scale, rz: 0.148 * scale, oz: 0.020 * scale, jawChisel: 0.20 * chiseled, frontFlat: 0.12 },
      { y: -0.025 * scale, rx: 0.158 * scale, rz: 0.172 * scale, oz: 0.008 * scale, jawChisel: 0.08 * chiseled, frontFlat: 0.10 },
      { y: 0.055 * scale,  rx: 0.172 * scale, rz: 0.184 * scale, oz: 0.002 * scale, browRidge: 0.016 * chiseled, frontFlat: 0.08 },
      { y: 0.135 * scale,  rx: 0.176 * scale, rz: 0.188 * scale, oz: -0.006 * scale, frontFlat: 0.06 },
      { y: 0.215 * scale,  rx: 0.148 * scale, rz: 0.162 * scale, oz: -0.014 * scale },
      { y: 0.265 * scale,  rx: 0.072 * scale, rz: 0.084 * scale, oz: -0.016 * scale }
    ], 22);
  }

  static muscleLimb(len, rTop, rMid, rBot, opts = {}) {
    const isLeg = !!opts.isLeg;
    const isUpper = !!opts.isUpper;
    if (isUpper && !isLeg) {
      return this.cartoonLoft([
        { y: 0.045,        rx: rTop * 0.90, rz: rTop * 0.88 },
        { y: -len * 0.16,  rx: rTop * 1.15, rz: rTop * 1.08, pecShelf: 0.008 },
        { y: -len * 0.48,  rx: rTop * 1.02, rz: rTop * 1.06, pecShelf: 0.014 },
        { y: -len * 0.78,  rx: rMid * 0.98, rz: rMid * 0.96 },
        { y: -len,         rx: rMid * 0.90, rz: rMid * 0.88 }
      ], 16);
    }
    if (!isUpper && !isLeg) {
      const flare = opts.gauntlet ? 1.18 : 1.0;
      return this.cartoonLoft([
        { y: 0.025,        rx: rMid * 0.94, rz: rMid * 0.92 },
        { y: -len * 0.28,  rx: rMid * 1.10, rz: rMid * 1.08, pecShelf: 0.008 },
        { y: -len * 0.68,  rx: rBot * 1.04 * flare, rz: rBot * 1.02 * flare },
        { y: -len,         rx: rBot * 0.95 * flare, rz: rBot * 0.90 * flare }
      ], 16);
    }
    if (isUpper && isLeg) {
      return this.cartoonLoft([
        { y: 0.055,        rx: rTop * 0.96, rz: rTop * 0.98, gluteCurve: 0.02 },
        { y: -len * 0.30,  rx: rTop * 1.10, rz: rTop * 1.14, pecShelf: 0.016, ox: 0, oz: 0.008 },
        { y: -len * 0.68,  rx: rMid * 1.04, rz: rMid * 1.05, pecShelf: 0.010 },
        { y: -len,         rx: rMid * 0.92, rz: rMid * 0.94 }
      ], 16);
    }
    return this.cartoonLoft([
      { y: 0.025,        rx: rMid * 0.95, rz: rMid * 0.96 },
      { y: -len * 0.28,  rx: rMid * 1.06, rz: rMid * 1.05, calfCurve: 0.026 },
      { y: -len * 0.68,  rx: rBot * 1.08, rz: rBot * 1.06, calfCurve: 0.012 },
      { y: -len,         rx: rBot * 0.98, rz: rBot * 0.98 }
    ], 16);
  }

  static limbSegment(upperLen = 0.4, rTop = 0.12, rBot = 0.08, radialSegs = 12) {
    return this.cartoonLoft([
      { y: 0.0,           rx: rTop, rz: rTop * 0.95 },
      { y: -upperLen * 0.5, rx: (rTop + rBot) * 0.5, rz: (rTop + rBot) * 0.48 },
      { y: -upperLen,     rx: rBot, rz: rBot * 0.95 }
    ], radialSegs);
  }

  static loftProfile(profiles, radialSegs = 16) {
    return this.cartoonLoft(profiles, radialSegs);
  }

  static beveledShape(points, depth = 0.08, bevel = 0.015) {
    const shape = new THREE.Shape();
    if (points.length > 0) {
      shape.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i][0], points[i][1]);
      }
      shape.closePath();
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevel > 0,
      bevelSegments: 2,
      steps: 1,
      bevelSize: bevel,
      bevelThickness: bevel
    });
    geo.translate(0, 0, -depth * 0.5);
    return geo;
  }
}

// ============================================================================
// HERO CARTOON VECTOR TEXTURE ATLAS (512x512 CRISP HAND-CRAFTED COSTUMES & FACES)
// ============================================================================
const HeroCartoonTextures = {
  _cache: {},

  _make(key, drawFn) {
    if (this._cache[key]) return this._cache[key];
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');
    if (ctx) drawFn(ctx, 512, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    this._cache[key] = tex;
    return tex;
  },

  _drawStar(ctx, cx, cy, spikes, outerR, innerR, fill, stroke) {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 4; ctx.stroke(); }
  },

  _drawCartoonFace(ctx, opts) {
    const skin = opts.skin || '#eeb48c';
    ctx.fillStyle = skin;
    ctx.fillRect(0, 0, 512, 512);

    // Hair / Cap Top (Note: in Canvas Y=0 is top, and in Three.js CanvasTexture flipY=true -> v=1 is canvas Y=0!)
    if (opts.hair) {
      ctx.fillStyle = opts.hair;
      ctx.fillRect(0, 0, 512, 185);
      ctx.fillRect(0, 0, 130, 410);
      ctx.fillRect(382, 0, 130, 410);
      ctx.beginPath();
      ctx.moveTo(155, 185);
      ctx.quadraticCurveTo(256, 130, 357, 185);
      ctx.lineTo(357, 145);
      ctx.lineTo(155, 145);
      ctx.closePath();
      ctx.fill();
    }
    if (opts.helmetColor) {
      ctx.fillStyle = opts.helmetColor;
      ctx.fillRect(0, 0, 512, 315);
      ctx.fillRect(0, 290, 175, 222);
      ctx.fillRect(337, 290, 175, 222);
    }
    if (opts.whiteTemples) {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(140, 165, 28, 120);
      ctx.fillRect(344, 165, 28, 120);
    }

    // Brow & Cartoon Eyes (cx = 256, centered eyes at 256 +/- 27, y ~ 258)
    const eyeY = 258;
    const eyeCol = opts.eyeColor || '#1e293b';
    [-1, 1].forEach(s => {
      const ex = 256 + s * 27;
      // Eyebrow
      ctx.strokeStyle = opts.browColor || '#1e1b18';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - s * 15, eyeY - 22);
      ctx.lineTo(ex + s * 15, eyeY - 16);
      ctx.stroke();

      if (opts.glowEyes) {
        ctx.fillStyle = '#090b15';
        ctx.beginPath();
        ctx.ellipse(ex, eyeY, 16, 10, s * -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = eyeCol;
        ctx.beginPath();
        ctx.ellipse(ex, eyeY, 12, 6.5, s * -0.15, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sclera + Iris + Anime Catchlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(ex, eyeY, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = eyeCol;
        ctx.beginPath();
        ctx.arc(ex, eyeY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#090b15';
        ctx.beginPath();
        ctx.arc(ex, eyeY, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex + 2.5, eyeY - 2.5, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Nose & Beard / Mouth
    ctx.strokeStyle = 'rgba(120, 62, 36, 0.55)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(256, 272);
    ctx.lineTo(250, 314);
    ctx.lineTo(264, 318);
    ctx.stroke();

    if (opts.beard) {
      ctx.fillStyle = opts.beard;
      ctx.beginPath();
      ctx.moveTo(190, 325);
      ctx.quadraticCurveTo(256, 338, 322, 325);
      ctx.lineTo(312, 435);
      ctx.quadraticCurveTo(256, 465, 200, 435);
      ctx.closePath();
      ctx.fill();
    } else if (opts.goatee) {
      ctx.fillStyle = opts.goatee;
      ctx.fillRect(222, 330, 68, 18);
      ctx.beginPath();
      ctx.moveTo(222, 362);
      ctx.lineTo(290, 362);
      ctx.lineTo(272, 428);
      ctx.lineTo(240, 428);
      ctx.closePath();
      ctx.fill();
    }

    // Expressive Cartoon Mouth
    ctx.strokeStyle = opts.lipColor || '#7c2d12';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(234, 348);
    ctx.quadraticCurveTo(256, 355, 278, 346);
    ctx.stroke();

    if (opts.capA) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = '900 74px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A', 256, 178);
    }
  },

  getHeadTex(heroId) {
    return this._make('head_' + heroId, (ctx) => {
      if (heroId === 'spider_man') {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 0, 512, 512);
        // Clean comic web lines radiating from nose bridge
        ctx.strokeStyle = '#1e1b18';
        ctx.lineWidth = 3;
        for (let a = 0; a < 16; a++) {
          const ang = (a / 16) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(256, 278);
          ctx.lineTo(256 + Math.cos(ang) * 280, 278 + Math.sin(ang) * 280);
          ctx.stroke();
        }
        [68, 125, 190].forEach(r => {
          ctx.beginPath();
          ctx.arc(256, 278, r, 0, Math.PI * 2);
          ctx.stroke();
        });
        // Iconic Large White Expressive Comic Spider Lenses (centered at 256 +/- 28)
        [-1, 1].forEach(s => {
          ctx.save();
          ctx.translate(256 + s * 28, 246);
          ctx.scale(s, 1);
          ctx.beginPath();
          ctx.moveTo(-16, 16);
          ctx.quadraticCurveTo(-2, -32, 32, -18);
          ctx.quadraticCurveTo(28, 26, -16, 16);
          ctx.closePath();
          ctx.fillStyle = '#0f172a';
          ctx.lineWidth = 10;
          ctx.strokeStyle = '#0f172a';
          ctx.stroke();
          ctx.fill();
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(-10, 11);
          ctx.quadraticCurveTo(0, -22, 24, -12);
          ctx.quadraticCurveTo(21, 18, -10, 11);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      } else if (heroId === 'iron_man') {
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(0, 0, 512, 512);
        // Gold Mark 85 Faceplate
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(185, 130);
        ctx.lineTo(226, 130);
        ctx.lineTo(236, 175);
        ctx.lineTo(276, 175);
        ctx.lineTo(286, 130);
        ctx.lineTo(327, 130);
        ctx.lineTo(334, 315);
        ctx.lineTo(298, 435);
        ctx.lineTo(214, 435);
        ctx.lineTo(178, 315);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1e1b18';
        ctx.lineWidth = 5;
        ctx.stroke();
        // Cheek & Chin Panel Lines + Centered Cyan Arc Eyes (256 +/- 29)
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(214, 340); ctx.lineTo(298, 340);
        ctx.moveTo(220, 385); ctx.lineTo(292, 385);
        ctx.stroke();
        [-1, 1].forEach(s => {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(256 + s * 29 - 20, 242, 40, 18);
          ctx.fillStyle = '#7dd3fc';
          ctx.fillRect(256 + s * 29 - 16, 246, 32, 10);
        });
      } else if (heroId === 'black_panther') {
        ctx.fillStyle = '#14161f';
        ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(205, 160); ctx.lineTo(256, 210); ctx.lineTo(307, 160);
        ctx.moveTo(192, 320); ctx.lineTo(256, 365); ctx.lineTo(320, 320);
        ctx.stroke();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(222, 140); ctx.lineTo(256, 182); ctx.lineTo(290, 140);
        ctx.stroke();
        [-1, 1].forEach(s => {
          ctx.save();
          ctx.translate(256 + s * 29, 250);
          ctx.rotate(s * -0.18);
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(-16, 5); ctx.lineTo(16, -6); ctx.lineTo(10, 9); ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      } else if (heroId === 'wolverine') {
        this._drawCartoonFace(ctx, {
          skin: '#e7ad85', helmetColor: '#eab308', glowEyes: true, eyeColor: '#f8fafc', browColor: '#0f172a'
        });
        // Iconic Black Mask Cheek Wings
        ctx.fillStyle = '#0f172a';
        [-1, 1].forEach(s => {
          ctx.beginPath();
          ctx.moveTo(256 + s * 16, 246);
          ctx.lineTo(256 + s * 98, 170);
          ctx.lineTo(256 + s * 108, 275);
          ctx.lineTo(256 + s * 36, 292);
          ctx.closePath();
          ctx.fill();
        });
        // Re-draw crisp white Wolverine eyes over black mask flaps (256 +/- 29)
        [-1, 1].forEach(s => {
          ctx.save();
          ctx.translate(256 + s * 29, 252);
          ctx.rotate(s * -0.22);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-16, 4); ctx.lineTo(16, -5); ctx.lineTo(11, 8); ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      } else if (heroId === 'captain_america') {
        this._drawCartoonFace(ctx, {
          skin: '#eeb48c', helmetColor: '#1d4ed8', eyeColor: '#38bdf8', capA: true, browColor: '#1e293b'
        });
        // Side jaw helmet straps + bottom chin trim (never blocks mouth)
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(184, 300, 18, 185);
        ctx.fillRect(310, 300, 18, 185);
        ctx.fillRect(184, 470, 144, 42);
      } else if (heroId === 'thor') {
        this._drawCartoonFace(ctx, {
          skin: '#f0b892', hair: '#eab308', beard: '#d99b06', eyeColor: '#38bdf8', browColor: '#b45309'
        });
      } else if (heroId === 'doctor_strange') {
        this._drawCartoonFace(ctx, {
          skin: '#ebb28c', hair: '#1c1917', whiteTemples: true, goatee: '#1c1917', eyeColor: '#475569'
        });
      } else if (heroId === 'reed_richards') {
        this._drawCartoonFace(ctx, {
          skin: '#e8ad86', hair: '#292524', whiteTemples: true, goatee: '#292524', eyeColor: '#334155'
        });
      } else if (heroId === 'scarlet_witch') {
        this._drawCartoonFace(ctx, {
          skin: '#f3c2a4', hair: '#6d2e1b', eyeColor: '#f43f5e', browColor: '#4a1d10', lipColor: '#be123c'
        });
      }
    });
  },

  getTorsoTex(heroId) {
    return this._make('torso_' + heroId, (ctx) => {
      if (heroId === 'spider_man') {
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(0, 0, 512, 512);
        // Front Red Chest V-Panel + Back Red Panel
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(148, 0); ctx.lineTo(364, 0);
        ctx.lineTo(318, 420); ctx.lineTo(194, 420);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(0, 0, 88, 390);
        ctx.fillRect(424, 0, 88, 390);
        // Subtle Web Grid
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.lineWidth = 3;
        for (let y = 40; y < 440; y += 56) {
          ctx.beginPath(); ctx.moveTo(155, y); ctx.quadraticCurveTo(256, y + 18, 357, y); ctx.stroke();
        }
        // Iron Spider Gold Chest Piping + Gold Spider Emblem
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(148, 0); ctx.lineTo(194, 420);
        ctx.moveTo(364, 0); ctx.lineTo(318, 420);
        ctx.stroke();
        // Stylized Gold Spider Centerpiece
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.ellipse(256, 175, 22, 34, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 8;
        [-1, 1].forEach(s => {
          [[-62, -75], [-84, -18], [-82, 48], [-58, 102]].forEach(([dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(256 + s * 16, 175 + dy * 0.25);
            ctx.lineTo(256 + s * Math.abs(dx) * 0.55, 175 + dy * 0.6);
            ctx.lineTo(256 + s * Math.abs(dx), 175 + dy);
            ctx.stroke();
          });
        });
        // Cartoon Muscle Contour Lines (clean ink, zero geometry bumps)
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(185, 215); ctx.quadraticCurveTo(256, 230, 327, 215);
        ctx.stroke();
      } else if (heroId === 'iron_man') {
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(0, 0, 512, 512);
        // Gold Mark 85 Armor Trim & Abdominal Ribbed Plates
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(180, 260, 152, 165);
        ctx.beginPath();
        ctx.moveTo(150, 12); ctx.lineTo(215, 85); ctx.lineTo(185, 120); ctx.lineTo(135, 50); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(362, 12); ctx.lineTo(297, 85); ctx.lineTo(327, 120); ctx.lineTo(377, 50); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 5;
        ctx.strokeRect(180, 260, 152, 165);
        for (let y = 305; y < 420; y += 38) {
          ctx.beginPath(); ctx.moveTo(185, y); ctx.lineTo(327, y); ctx.stroke();
        }
        // Central Arc Reactor
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(256, 165, 42, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(256, 165, 29, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath(); ctx.arc(256, 165, 14, 0, Math.PI * 2); ctx.fill();
      } else if (heroId === 'captain_america') {
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(0, 0, 512, 512);
        // Red & White Abdominal Stripes
        const stripeW = 32;
        [-2, -1, 0, 1, 2].forEach(i => {
          ctx.fillStyle = (Math.abs(i) % 2 === 0) ? '#dc2626' : '#f8fafc';
          ctx.fillRect(256 + i * stripeW - stripeW * 0.5, 290, stripeW, 195);
        });
        // Tactical Shoulder Straps + Crisp White Chest Star
        ctx.fillStyle = '#78350f';
        ctx.fillRect(175, 0, 24, 155);
        ctx.fillRect(313, 0, 24, 155);
        this._drawStar(ctx, 256, 168, 5, 62, 25, '#f8fafc', '#0f172a');
      } else if (heroId === 'thor') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.strokeRect(170, 50, 172, 290);
        // 6 Asgardian Silver Armor Discs
        [-58, 58].forEach(dx => {
          [110, 200, 290].forEach(dy => {
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath(); ctx.arc(256 + dx, dy, 30, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 5; ctx.stroke();
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath(); ctx.arc(256 + dx, dy, 10, 0, Math.PI * 2); ctx.fill();
          });
        });
      } else if (heroId === 'doctor_strange') {
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(0, 0, 512, 512);
        // Overlapping Mystic Robe Folds + Crimson Waist Sash
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(170, 20); ctx.lineTo(310, 320);
        ctx.moveTo(342, 20); ctx.lineTo(256, 200);
        ctx.stroke();
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(0, 355, 512, 95);
      } else if (heroId === 'reed_richards') {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, 0, 512, 512);
        // Dark Navy Side Panels + White Collar Band + Crisp "4" Chest Emblem
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(105, 0, 62, 512);
        ctx.fillRect(345, 0, 62, 512);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 512, 46);
        ctx.beginPath(); ctx.arc(256, 170, 58, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 6; ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 84px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('4', 256, 200);
      } else if (heroId === 'black_panther') {
        ctx.fillStyle = '#14161f';
        ctx.fillRect(0, 0, 512, 512);
        // Wakanda Geometric Weave & Glowing Kinetic Purple Lines
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        for (let y = 40; y < 480; y += 44) {
          ctx.beginPath(); ctx.moveTo(150, y); ctx.lineTo(256, y + 32); ctx.lineTo(362, y); ctx.stroke();
        }
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(175, 115); ctx.lineTo(256, 195); ctx.lineTo(337, 115);
        ctx.moveTo(195, 240); ctx.lineTo(256, 305); ctx.lineTo(317, 240);
        ctx.stroke();
      } else if (heroId === 'wolverine') {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(150, 0, 212, 85);
        // Classic Black Tiger Stripes on Sides
        ctx.fillStyle = '#0f172a';
        [-1, 1].forEach(s => {
          [165, 245, 325].forEach(y => {
            ctx.beginPath();
            ctx.moveTo(256 + s * 135, y - 22);
            ctx.lineTo(256 + s * 52, y + 8);
            ctx.lineTo(256 + s * 135, y + 26);
            ctx.closePath();
            ctx.fill();
          });
        });
      } else if (heroId === 'scarlet_witch') {
        ctx.fillStyle = '#9f1239';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#4c0519';
        ctx.fillRect(0, 250, 175, 262);
        ctx.fillRect(337, 250, 175, 262);
        ctx.strokeStyle = '#fda4af';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(185, 95); ctx.lineTo(256, 175); ctx.lineTo(327, 95);
        ctx.moveTo(205, 195); ctx.lineTo(256, 315); ctx.lineTo(307, 195);
        ctx.stroke();
      }
    });
  }
};

// ============================================================================
// CANONICAL AVENGERS: DOOMSDAY HERO METADATA (ALL 9 HEROES COMPLETE)
// ============================================================================
const HEROES_DATA = window.HEROES_DATA = {
  reed_richards: {
    id: 'reed_richards',
    name: 'Senhor Fantástico',
    subtitle: 'REED RICHARDS // QUARTETO FANTÁSTICO',
    actor: 'Pedro Pascal • Quarteto Fantástico',
    role: 'Líder do Quarteto Fantástico',
    classTag: 'ELÁSTICO',
    resourceName: 'ELASTICIDADE',
    color: '#38bdf8',
    colorHex: 0x38bdf8,
    accentHex: 0xf8fafc,
    glowColor: 'rgba(56, 189, 248, 0.45)',
    avatarEmoji: '4',
    portraitBg: 'url("the-avengers-doomsday-official-cast-whats-your-thoughts-v0-dwj8ejbzc6re1.webp")',
    portraitPos: '80% 18%',
    health: 580,
    speed: 19,
    attackType: 'elastic',
    primaryName: 'Punho-Martelo Elástico',
    primaryDesc: 'Estica os braços em socos longos e infla punhos gigantes (2.6x) no 3º golpe.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Estilingue & Agarrão Elástico',
    uniqueDesc: 'Prende os dois braços à frente e lança o corpo como projétil esmagando inimigos.',
    skillName: 'Ciclone Giroscópico (1.8s)',
    skillDesc: 'Gira com braços esticados puxando inimigos, aplicando hits contínuos e refletindo tiros.',
    ultName: 'Singularidade da Zona Negativa',
    ultDesc: 'Portal gravitacional suga toda a arena por 2s antes de implodir em dano subatômico.',
    stats: { atk: 92, def: 88, spd: 85 }
  },
  spider_man: {
    id: 'spider_man',
    name: 'Homem-Aranha',
    subtitle: 'PETER PARKER // ARANHA DE FERRO',
    actor: 'Tom Holland • Peter Parker',
    role: 'Aranha de Ferro',
    classTag: 'ACROBATA',
    resourceName: 'FLUIDO DE TEIA',
    color: '#ef4444',
    colorHex: 0xef4444,
    accentHex: 0xfacc15,
    glowColor: 'rgba(239, 68, 68, 0.45)',
    avatarEmoji: '🕷️',
    portraitBg: 'url("the-avengers-doomsday-official-cast-whats-your-thoughts-v0-dwj8ejbzc6re1.webp")',
    portraitPos: '62% 92%',
    health: 540,
    speed: 24,
    attackType: 'web',
    primaryName: 'Combo Aranha & Lâminas Waldoes',
    primaryDesc: 'Cortes ágeis + chute giratório; o 3º hit puxa alvos com teia e crava as 4 Waldoes.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Web Zip (M2) / Web Swing (E)',
    uniqueDesc: 'E balança em pêndulo 3D; M2 dispara fio de teia puxando-se em voadora de impacto.',
    skillName: 'Prisão de Teia & Blitz Waldoes',
    skillDesc: 'Prende inimigos em rede de teias no solo (3.5s) seguido de 5 cortes relâmpagos.',
    ultName: 'Maximum Spider (Tempestade Sônica)',
    ultDesc: '8 avanços supersônicos entre todos os inimigos da área culminando em choque sísmico.',
    stats: { atk: 91, def: 80, spd: 100 }
  },
  thor: {
    id: 'thor',
    name: 'Thor Odinson',
    subtitle: 'FILHO DE ODIN // DEUS DO TROVÃO',
    actor: 'Chris Hemsworth • Deus do Trovão',
    role: 'Filho de Odin',
    classTag: 'TROVÃO',
    resourceName: 'FORÇA DE ODIN',
    color: '#06b6d4',
    colorHex: 0x06b6d4,
    accentHex: 0xfef08a,
    glowColor: 'rgba(6, 182, 212, 0.45)',
    avatarEmoji: '⚡',
    portraitBg: 'url("the-avengers-doomsday-official-cast-whats-your-thoughts-v0-dwj8ejbzc6re1.webp")',
    portraitPos: '20% 18%',
    health: 720,
    speed: 18,
    attackType: 'lightning',
    primaryName: 'Combo Mjolnir & Raio em Cadeia',
    primaryDesc: 'Marteladas elétricas cujo choque salta em relâmpagos ramificados entre até 3 alvos.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Arremesso Mjolnir & Voo Tempestade',
    uniqueDesc: 'M2 arremessa o martelo perfurando alvos ida/volta com raios; E ativa Voo do Trovão.',
    skillName: 'Ira do Trovão (Thunderclap)',
    skillDesc: 'Salta e esmaga o chão invocando 6 pilares de relâmpagos ramificados ao redor.',
    ultName: 'Tempestade da Bifrost + Stormbreaker',
    ultDesc: 'Levita na coluna da Bifrost com Stormbreaker e Mjolnir orbitando e chuva de raios.',
    stats: { atk: 99, def: 95, spd: 76 }
  },
  doctor_strange: {
    id: 'doctor_strange',
    name: 'Doutor Estranho',
    subtitle: 'STEPHEN STRANGE // MAGO SUPREMO',
    actor: 'Benedict Cumberbatch • Stephen Strange',
    role: 'Mestre das Artes Místicas',
    classTag: 'ARCANA',
    resourceName: 'ENERGIA MÍSTICA',
    color: '#f59e0b',
    colorHex: 0xf59e0b,
    accentHex: 0x22c55e,
    glowColor: 'rgba(245, 158, 11, 0.45)',
    avatarEmoji: '🔮',
    portraitBg: 'url("the-avengers-doomsday-official-cast-whats-your-thoughts-v0-dwj8ejbzc6re1.webp")',
    portraitPos: '38% 92%',
    health: 560,
    speed: 19,
    attackType: 'magic',
    primaryName: 'Chicote & Leque de Mandalas',
    primaryDesc: 'Arcos solares e discos arcanos que disparam em leque triplo no 3º golpe.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Capa Viva & Voo Astral',
    uniqueDesc: 'M2 envia a Capa para prender alvos enquanto ataca; E alterna Voo Astral.',
    skillName: 'Faixas de Cyttorak & Escudo Serafim',
    skillDesc: 'Vórtice carmesim que puxa inimigos e ativa escudo refletor de projéteis (3x dano).',
    ultName: 'Olho de Agamotto: Parada Temporal',
    ultDesc: 'Congela o tempo por 4.5s e invoca 3 Clones Astrais disparando feixes FBM sincronizados.',
    stats: { atk: 95, def: 84, spd: 80 }
  },
  black_panther: {
    id: 'black_panther',
    name: 'Pantera Negra',
    subtitle: 'T\'CHALLA // PROTETOR DE WAKANDA',
    actor: 'Realeza de Wakanda • Vibranium',
    role: 'Protetor de Wakanda',
    classTag: 'VIBRANIUM',
    resourceName: 'CARGA DE VIBRANIUM',
    color: '#a855f7',
    colorHex: 0xa855f7,
    accentHex: 0xe879f9,
    glowColor: 'rgba(168, 85, 247, 0.45)',
    avatarEmoji: '🐾',
    portraitBg: 'url("qkyii3egmbme1.jpeg")',
    portraitPos: '94% 88%',
    health: 630,
    speed: 22.5,
    attackType: 'claw',
    primaryName: 'Garras Relâmpago de Wakanda',
    primaryDesc: 'Cortes ultrarrápidos com rastros violeta carregando Energia Cinética no traje.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Bote Predador (Reset por Marca)',
    uniqueDesc: 'Atravessa inimigos aplicando Marca de Bast; acertar alvo marcado reseta o M2 na hora!',
    skillName: 'Explosão Cinética & Lanças',
    skillDesc: 'Descarrega a carga do traje em explosão esférica e dispara 5 lanças perfurantes.',
    ultName: 'Avatar da Deusa Bast',
    ultDesc: 'Invoca Pantera Espiritual gigante que avança marcando todos os alvos e resetando M2.',
    stats: { atk: 94, def: 90, spd: 96 }
  }
};

// ============================================================================
// CHARACTER BUILDER — CLEAN PROFESSIONAL CARTOON LOW-POLY HEROES & BOSSES
// ============================================================================
class CharacterBuilder {
  static createContactShadow(radius = 1.0) {
    const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(0,0,0,0.52)');
      grad.addColorStop(0.55, 'rgba(0,0,0,0.18)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      opacity: 0.72
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.025;
    mesh.renderOrder = -1;
    return mesh;
  }

  static stylized(color, opts = {}) {
    if (typeof CustomShaders !== 'undefined' && CustomShaders.createStylizedMaterial) {
      return CustomShaders.createStylizedMaterial({
        color,
        roughness: opts.roughness !== undefined ? opts.roughness : 0.44,
        metalness: opts.metalness !== undefined ? opts.metalness : 0.16,
        rimColor: opts.rimColor !== undefined ? opts.rimColor : 0xffffff,
        rimStrength: opts.rimStrength !== undefined ? opts.rimStrength : 0.45,
        halftone: opts.halftone !== undefined ? opts.halftone : 0.05,
        flatShading: opts.flatShading !== undefined ? opts.flatShading : false,
        doubleSided: !!opts.doubleSided,
        emissive: opts.emissive || 0x000000,
        emissiveIntensity: opts.emissiveIntensity || 0,
        map: opts.map || null,
        bumpMap: opts.bumpMap || null,
        bumpScale: opts.bumpScale || 0.015
      });
    }
    const m = this.mat(color, opts.roughness || 0.44, opts.metalness || 0.2, opts.emissive || 0, opts.emissiveIntensity || 0);
    if (opts.map) m.map = opts.map;
    if (opts.doubleSided) m.side = THREE.DoubleSide;
    return m;
  }

  static addOutlined(parent, geo, material, outline = 0.011, outlineColor = 0x090b15) {
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const effOutline = outline * 0.56;
    if (effOutline > 0.0018) {
      const inkMat = new THREE.MeshBasicMaterial({
        color: outlineColor,
        side: THREE.BackSide
      });
      const inkMesh = new THREE.Mesh(geo, inkMat);
      inkMesh.scale.setScalar(1.0 + effOutline * 2.0);
      mesh.add(inkMesh);
    }
    if (parent) parent.add(mesh);
    return mesh;
  }

  // Clean Heroic Graphic-Novel Torso & Pelvis (sculpted V-taper + shoulder deltoid transition)
  static buildCartoonTorso(chest, hips, mats, opts = {}) {
    const sc = opts.scale || 1.0;
    const wFem = opts.feminine ? 0.84 : 1.0;
    const torsoMat = mats.torsoMat;
    const legMat = mats.legMat || torsoMat;
    const beltMat = mats.beltMat || torsoMat;
    const accentMat = mats.accentMat || beltMat;

    const pelvisGeo = SculptGeo.cartoonLoft([
      { y: -0.10, rx: 0.165 * sc, rz: 0.132 * sc, gluteCurve: 0.018 },
      { y: 0.01,  rx: 0.212 * sc, rz: 0.158 * sc, frontFlat: 0.10, gluteCurve: 0.028 },
      { y: 0.13,  rx: 0.194 * sc * wFem, rz: 0.146 * sc, frontFlat: 0.12 }
    ], 20);
    this.addOutlined(hips, pelvisGeo, legMat, 0.011);

    const beltGeo = SculptGeo.cartoonLoft([
      { y: 0.088, rx: 0.208 * sc * wFem, rz: 0.156 * sc, frontFlat: 0.08 },
      { y: 0.162, rx: 0.212 * sc * wFem, rz: 0.160 * sc, frontFlat: 0.08 }
    ], 18);
    this.addOutlined(hips, beltGeo, beltMat, 0.009);

    if (opts.beltBuckle !== false) {
      const buckle = new THREE.Mesh(
        SculptGeo.beveledShape([[-0.048 * sc, -0.032 * sc], [0.048 * sc, -0.032 * sc], [0.038 * sc, 0.032 * sc], [-0.038 * sc, 0.032 * sc]], 0.028, 0.006),
        accentMat
      );
      buckle.position.set(0, 0.125, 0.152 * sc);
      hips.add(buckle);
    }

    const torsoGeo = SculptGeo.cartoonLoft([
      { y: -0.15, rx: 0.188 * sc * wFem, rz: 0.138 * sc, frontFlat: 0.10 },
      { y: 0.03,  rx: 0.218 * sc * wFem, rz: 0.148 * sc, frontFlat: 0.12, latV: 0.012 },
      { y: 0.22,  rx: 0.292 * sc * wFem, rz: 0.172 * sc, frontFlat: 0.10, pecShelf: 0.038 * (opts.feminine ? 1.15 : 1.0), latV: 0.026, chestCrease: 0.020 },
      { y: 0.37,  rx: 0.326 * sc * wFem, rz: 0.178 * sc, frontFlat: 0.08, pecShelf: 0.022, latV: 0.018 },
      { y: 0.45,  rx: 0.148 * sc,        rz: 0.128 * sc }
    ], 22);
    this.addOutlined(chest, torsoGeo, torsoMat, 0.012);

    // Sculpted deltoid shoulder caps + dorsal scapula armor & spine plates
    [-1, 1].forEach(side => {
      const deltGeo = SculptGeo.cartoonLoft([
        { y: -0.075 * sc, rx: 0.095 * sc, rz: 0.096 * sc },
        { y: 0.015 * sc,  rx: 0.118 * sc, rz: 0.112 * sc, pecShelf: 0.012 },
        { y: 0.075 * sc,  rx: 0.078 * sc, rz: 0.082 * sc }
      ], 14);
      const delt = this.addOutlined(chest, deltGeo, torsoMat, 0.008);
      delt.position.set(side * 0.325 * sc * wFem, 0.365, 0);
      delt.rotation.z = side * -0.44;
    });
    const spineGeo = SculptGeo.cartoonLoft([
      { y: -0.08, rx: 0.048 * sc, rz: 0.034 * sc },
      { y: 0.16,  rx: 0.068 * sc, rz: 0.042 * sc },
      { y: 0.35,  rx: 0.076 * sc, rz: 0.040 * sc }
    ], 10);
    const spine = this.addOutlined(chest, spineGeo, accentMat, 0.006);
    spine.position.set(0, 0.0, -0.155 * sc);
  }

  // Sculpted 3D Head Features (bridge of nose, hairline volume, jawline continuity)
  static addSculptedFacialDetail(headGroup, skinMat, hairMat, opts = {}) {
    if (!opts.coveredNose) {
      const noseGeo = SculptGeo.cartoonLoft([
        { y: -0.022, rx: 0.022, rz: 0.036, oz: 0.165 },
        { y: 0.008,  rx: 0.018, rz: 0.026, oz: 0.168 },
        { y: 0.055,  rx: 0.014, rz: 0.018, oz: 0.162 }
      ], 8);
      const nose = new THREE.Mesh(noseGeo, skinMat);
      headGroup.add(nose);
    }
    if (opts.ears !== false) {
      [-1, 1].forEach(side => {
        const earGeo = SculptGeo.cartoonLoft([
          { y: -0.035, rx: 0.018, rz: 0.028 },
          { y: 0.005,  rx: 0.024, rz: 0.036 },
          { y: 0.042,  rx: 0.019, rz: 0.026 }
        ], 8);
        const ear = new THREE.Mesh(earGeo, skinMat);
        ear.position.set(side * 0.170, 0.01, -0.01);
        headGroup.add(ear);
      });
    }
    if (opts.hairStyle && hairMat) {
      const hs = opts.hairStyle;
      if (hs === 'swept' || hs === 'long' || hs === 'flowing') {
        const crown = this.addOutlined(headGroup, SculptGeo.cartoonLoft([
          { y: 0.06,  rx: 0.184, rz: 0.194, oz: -0.012 },
          { y: 0.18,  rx: 0.194, rz: 0.205, oz: -0.016, browRidge: 0.018 },
          { y: 0.27,  rx: 0.148, rz: 0.168, oz: -0.022 },
          { y: 0.30,  rx: 0.065, rz: 0.085, oz: -0.020 }
        ], 16), hairMat, 0.009);
        crown.rotation.x = -0.06;
        // Layered sculpted comic hair locks framing forehead & sides
        for (let i = -2; i <= 2; i++) {
          const lock = this.addOutlined(headGroup, SculptGeo.cartoonLoft([
            { y: hs === 'long' ? -0.32 : hs === 'flowing' ? -0.26 : -0.04, rx: 0.035, rz: 0.038 },
            { y: 0.08,  rx: 0.056, rz: 0.052 },
            { y: 0.21,  rx: 0.042, rz: 0.044 }
          ], 8), hairMat, 0.007);
          const ang = Math.PI + i * 0.42;
          lock.position.set(Math.sin(ang) * 0.168, 0.02, Math.cos(ang) * 0.172 - 0.01);
          lock.rotation.z = i * 0.14;
        }
        if (hs === 'swept' || hs === 'long') {
          const quiff = this.addOutlined(headGroup, SculptGeo.beveledShape([
            [-0.10, -0.01], [0.0, 0.08], [0.11, 0.02], [0.06, -0.03], [-0.07, -0.03]
          ], 0.12, 0.016), hairMat, 0.007);
          quiff.position.set(0.01, 0.22, 0.09);
          quiff.rotation.x = 0.35;
        }
      }
      if (opts.beardMat) {
        const bStyle = opts.beardStyle || 'goatee';
        if (bStyle === 'full') {
          const beard = this.addOutlined(headGroup, SculptGeo.cartoonLoft([
            { y: -0.20, rx: 0.075, rz: 0.095, oz: 0.045, jawChisel: 0.22 },
            { y: -0.11, rx: 0.132, rz: 0.145, oz: 0.025, frontFlat: 0.08 },
            { y: -0.04, rx: 0.144, rz: 0.152, oz: 0.018 }
          ], 14), opts.beardMat, 0.006);
          beard.position.z = 0.008;
        } else {
          const goat = new THREE.Mesh(SculptGeo.beveledShape([
            [-0.045, -0.07], [0.045, -0.07], [0.032, 0.025], [-0.032, 0.025]
          ], 0.035, 0.008), opts.beardMat);
          goat.position.set(0, -0.105, 0.148);
          headGroup.add(goat);
        }
      }
    }
  }

  // Sculpted Graphic-Novel Limbs with continuous muscle S-curves, 3D curved hands & boots
  static createLimb(opts = {}) {
    const root = new THREE.Group();
    const upperLen = opts.upperLen || (opts.isLeg ? 0.47 : 0.34);
    const lowerLen = opts.lowerLen || (opts.isLeg ? 0.45 : 0.32);
    const rTop = opts.rTop || 0.11;
    const rMid = opts.rMid || 0.09;
    const rBot = opts.rBot || 0.074;
    const upperMat = opts.upperMat || this.stylized(0x334155);
    const lowerMat = opts.lowerMat || upperMat;
    const jointMat = opts.jointMat || lowerMat;
    const outline = opts.outline !== undefined ? opts.outline : 0.010;

    const upperGeo = SculptGeo.muscleLimb(upperLen, rTop, rMid, rBot, { isLeg: !!opts.isLeg, isUpper: true });
    this.addOutlined(root, upperGeo, upperMat, outline);

    const joint = new THREE.Group();
    joint.position.y = -upperLen;
    root.add(joint);

    if (opts.kneePad === true && opts.isLeg) {
      const padGeo = SculptGeo.beveledShape([
        [-rMid * 0.46, -rMid * 0.38], [rMid * 0.46, -rMid * 0.38], [rMid * 0.38, rMid * 0.44], [0, rMid * 0.56], [-rMid * 0.38, rMid * 0.44]
      ], rMid * 0.35, 0.015);
      const pad = new THREE.Mesh(padGeo, jointMat);
      pad.position.set(0, 0.01, rMid * 0.88);
      joint.add(pad);
    }

    const lowerGeo = SculptGeo.muscleLimb(lowerLen, rTop, rMid, rBot, { isLeg: !!opts.isLeg, isUpper: false, gauntlet: !!opts.gauntlet });
    this.addOutlined(joint, lowerGeo, lowerMat, outline);

    if (opts.cuffMat) {
      const cuffGeo = SculptGeo.cartoonLoft([
        { y: -lowerLen * 0.55, rx: rMid * 1.12, rz: rMid * 1.08 },
        { y: -lowerLen * 0.96, rx: rBot * 1.16, rz: rBot * 1.12 }
      ], 14);
      this.addOutlined(joint, cuffGeo, opts.cuffMat, outline * 0.65);
    }

    const tip = new THREE.Group();
    tip.position.y = -lowerLen;
    joint.add(tip);

    if (opts.isLeg) {
      const soleMat = opts.soleMat || this.stylized(0x0f172a, { roughness: 0.72 });
      const bootGeo = SculptGeo.cartoonLoft([
        { y: 0.03,   rx: rBot * 1.12, rz: rBot * 1.14, oz: 0.01 },
        { y: -0.035, rx: rBot * 1.16, rz: rBot * 1.48, oz: 0.048, jawChisel: 0.12 },
        { y: -0.095, rx: rBot * 1.18, rz: rBot * 1.82, oz: 0.078, jawChisel: 0.14 },
        { y: -0.118, rx: rBot * 1.12, rz: rBot * 1.76, oz: 0.075 }
      ], 16);
      this.addOutlined(tip, bootGeo, lowerMat, outline * 0.85);

      const soleGeo = SculptGeo.cartoonLoft([
        { y: -0.105, rx: rBot * 1.19, rz: rBot * 1.86, oz: 0.078 },
        { y: -0.125, rx: rBot * 1.16, rz: rBot * 1.84, oz: 0.076 }
      ], 14);
      tip.add(new THREE.Mesh(soleGeo, soleMat));

      const shinCuff = this.addOutlined(joint, SculptGeo.cartoonLoft([
        { y: -lowerLen * 0.42, rx: rMid * 1.13, rz: rMid * 1.12 },
        { y: -lowerLen * 0.56, rx: rMid * 1.18, rz: rMid * 1.18 }
      ], 12), jointMat, outline * 0.55);
      shinCuff.position.y = 0;
    } else if (!opts.noHand) {
      const handMat = opts.handMat || lowerMat;
      // Sculpted palm + 4 curled individual fingers + opposable thumb
      const palmGeo = SculptGeo.cartoonLoft([
        { y: 0.01,        rx: rBot * 1.04, rz: rBot * 0.84 },
        { y: -rBot * 0.9, rx: rBot * 1.16, rz: rBot * 0.90, frontFlat: 0.16, oz: 0.012 },
        { y: -rBot * 1.55, rx: rBot * 1.06, rz: rBot * 0.78, frontFlat: 0.14, oz: 0.020 }
      ], 12);
      this.addOutlined(tip, palmGeo, handMat, outline * 0.6);

      const fingerBase = SculptGeo.cartoonLoft([
        { y: 0.0,         rx: rBot * 0.24, rz: rBot * 0.24 },
        { y: -rBot * 0.65, rx: rBot * 0.21, rz: rBot * 0.22, oz: 0.016 },
        { y: -rBot * 1.12, rx: rBot * 0.16, rz: rBot * 0.17, oz: 0.040 }
      ], 7);
      for (let f = 0; f < 4; f++) {
        const finger = new THREE.Mesh(fingerBase, handMat);
        const fOffset = (f - 1.5) * rBot * 0.52;
        const fScale = f === 1 || f === 2 ? 1.05 : f === 0 ? 0.95 : 0.82;
        finger.position.set(fOffset * (opts.isRight ? -1 : 1), -rBot * 1.44, 0.018);
        finger.scale.set(fScale, fScale, fScale);
        finger.rotation.x = 0.24 + f * 0.04;
        tip.add(finger);
      }

      const thumbGeo = SculptGeo.cartoonLoft([
        { y: 0.0,         rx: rBot * 0.35, rz: rBot * 0.35 },
        { y: -rBot * 0.72, rx: rBot * 0.32, rz: rBot * 0.32 },
        { y: -rBot * 1.22, rx: rBot * 0.22, rz: rBot * 0.22 }
      ], 8);
      const thumb = new THREE.Mesh(thumbGeo, handMat);
      thumb.position.set((opts.isRight ? -1 : 1) * rBot * 0.96, -rBot * 0.62, 0.038);
      thumb.rotation.set(-0.22, 0, (opts.isRight ? 0.38 : -0.38));
      tip.add(thumb);
    }

    return { root, joint, tip };
  }

  static buildCapShieldMesh() {
    const g = new THREE.Group();
    const redMat = this.stylized(0xdc2626, { metalness: 0.72, roughness: 0.24, rimColor: 0xfca5a5 });
    const whiteMat = this.stylized(0xf8fafc, { metalness: 0.70, roughness: 0.24, rimColor: 0xffffff });
    const blueMat = this.stylized(0x1d4ed8, { metalness: 0.76, roughness: 0.22, rimColor: 0x93c5fd });

    const r1 = this.addOutlined(g, new THREE.CylinderGeometry(0.46, 0.44, 0.042, 24), redMat, 0.011);
    r1.rotation.x = Math.PI / 2;
    const r2 = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.35, 0.05, 24), whiteMat);
    r2.rotation.x = Math.PI / 2;
    const r3 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.25, 0.058, 24), redMat);
    r3.rotation.x = Math.PI / 2;
    const center = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.066, 24), blueMat);
    center.rotation.x = Math.PI / 2;
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 0), whiteMat);
    star.scale.set(1, 1, 0.35);
    star.position.z = 0.044;
    g.add(r2, r3, center, star);
    return g;
  }

  static buildMjolnirMesh() {
    const mjolnir = new THREE.Group();
    const steelMat = this.stylized(0x94a3b8, { roughness: 0.22, metalness: 0.88, rimColor: 0xe2e8f0 });
    const leatherMat = this.stylized(0x78350f, { roughness: 0.72, metalness: 0.1 });
    const goldMat = this.stylized(0xf59e0b, { roughness: 0.22, metalness: 0.88, rimColor: 0xfef08a });
    const runeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    this.addOutlined(mjolnir, new THREE.BoxGeometry(0.36, 0.25, 0.58), steelMat, 0.012);
    [-1, 1].forEach(side => {
      const cap = this.addOutlined(mjolnir, new THREE.CylinderGeometry(0.12, 0.17, 0.07, 8), steelMat, 0.01);
      cap.rotation.x = (side > 0 ? 1 : -1) * Math.PI / 2;
      cap.position.z = side * 0.31;
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.10, 0.34), runeMat);
      rune.position.set(side * 0.185, 0, 0);
      mjolnir.add(rune);
    });

    const handle = this.addOutlined(mjolnir, new THREE.CylinderGeometry(0.036, 0.036, 0.58, 10), leatherMat, 0.008);
    handle.position.y = -0.36;
    const pommel = this.addOutlined(mjolnir, new THREE.CylinderGeometry(0.055, 0.042, 0.07, 10), goldMat, 0.008);
    pommel.position.y = -0.66;
    return mjolnir;
  }

  static mat(color, roughness = 0.42, metalness = 0.2, emissive = 0x000000, emissiveIntensity = 0) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      emissive,
      emissiveIntensity
    });
  }

  // ==========================================================================
  // 5 CORE HEROES — CLEAN CARTOON LOW-POLY WITH VECTOR COSTUME & FACE TEXTURES
  // ==========================================================================
  static buildHeroMesh(heroId) {
    const group = new THREE.Group();
    group.userData = {
      heroId,
      attackTimer: 0,
      comboStep: 1,
      skillTimer: 0,
      dashTimer: 0,
      entranceTimer: 0.85,
      isFlying: false,
      isSwinging: false,
      elasticStretch: 0,
      kineticCharge: 0,
      channelType: null,
      clothSim: null,
      waldoes: [],
      mandalas: [],
      energyParts: [],
      parts: {}
    };

    group.add(this.createContactShadow(0.92));

    const hips = new THREE.Group();
    hips.position.y = 1.08;
    group.add(hips);
    const spine = new THREE.Group();
    hips.add(spine);
    const chest = new THREE.Group();
    chest.position.y = 0.34;
    spine.add(chest);
    const neck = new THREE.Group();
    neck.position.y = 0.44;
    chest.add(neck);
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.14;
    neck.add(headGroup);

    const torsoTex = HeroCartoonTextures.getTorsoTex(heroId);
    const headTex = HeroCartoonTextures.getHeadTex(heroId);

    const skinMat = this.stylized(0xeeb48c, { roughness: 0.62, rimColor: 0xffd7b5, rimStrength: 0.24 });
    const goldMat = this.stylized(0xf59e0b, { metalness: 0.85, roughness: 0.20, rimColor: 0xfef08a });
    const silverMat = this.stylized(0xe2e8f0, { metalness: 0.88, roughness: 0.18, rimColor: 0xffffff });
    const darkInkMat = this.stylized(0x0f172a, { roughness: 0.48, metalness: 0.22 });

    const isSpider = heroId === 'spider_man';
    const isThor = heroId === 'thor';
    const isStrange = heroId === 'doctor_strange';
    const isReed = heroId === 'reed_richards';
    const isPanther = heroId === 'black_panther';

    const torsoMat = this.stylized(0xffffff, {
      map: torsoTex,
      metalness: isPanther ? 0.72 : isThor ? 0.42 : 0.16,
      roughness: isPanther ? 0.26 : 0.42,
      rimColor: isSpider ? 0xfca5a5 : isPanther ? 0xc084fc : 0xffe4b5
    });
    const headMat = this.stylized(0xffffff, {
      map: headTex,
      metalness: isPanther ? 0.65 : 0.08,
      roughness: isPanther ? 0.30 : 0.50,
      rimStrength: 0.35
    });

    let legMat, upperArmMat, forearmMat, bootMat, beltMat;
    if (isSpider) {
      const redSuit = this.stylized(0xdc2626, { roughness: 0.38, metalness: 0.22, rimColor: 0xfca5a5 });
      const navySuit = this.stylized(0x1e3a8a, { roughness: 0.42, metalness: 0.25, rimColor: 0x60a5fa });
      legMat = navySuit; upperArmMat = redSuit; forearmMat = redSuit; bootMat = redSuit; beltMat = goldMat;
    } else if (isThor) {
      const armorNavy = this.stylized(0x1e293b, { metalness: 0.55, roughness: 0.35 });
      const chainSilver = this.stylized(0x94a3b8, { metalness: 0.82, roughness: 0.22 });
      legMat = armorNavy; upperArmMat = skinMat; forearmMat = chainSilver;
      bootMat = this.stylized(0x78350f, { roughness: 0.52 }); beltMat = goldMat;
    } else if (isStrange) {
      const mysticBlue = this.stylized(0x1d4ed8, { roughness: 0.46, rimColor: 0x93c5fd });
      const darkBlue = this.stylized(0x0f172a, { roughness: 0.54 });
      legMat = darkBlue; upperArmMat = mysticBlue; forearmMat = mysticBlue;
      bootMat = this.stylized(0x1e293b, { roughness: 0.5 }); beltMat = this.stylized(0xb91c1c, { roughness: 0.44 });
    } else if (isReed) {
      const ffBlue = this.stylized(0x0284c7, { roughness: 0.38, rimColor: 0x7dd3fc });
      const ffNavy = this.stylized(0x0f172a, { roughness: 0.46 });
      const ffWhite = this.stylized(0xf8fafc, { roughness: 0.36 });
      legMat = ffNavy; upperArmMat = ffBlue; forearmMat = ffWhite; bootMat = ffWhite; beltMat = ffWhite;
    } else {
      const vibranium = this.stylized(0x14161f, { metalness: 0.80, roughness: 0.24, rimColor: 0xc084fc });
      legMat = vibranium; upperArmMat = vibranium; forearmMat = vibranium; bootMat = vibranium; beltMat = silverMat;
    }

    const chestScale = isThor ? 1.12 : isSpider ? 0.96 : 1.03;
    const shoulderHalfW = isThor ? 0.41 : isSpider ? 0.34 : 0.37;

    hips.position.y = 1.10;
    this.buildCartoonTorso(chest, hips, {
      torsoMat, legMat, beltMat, accentMat: isReed ? darkInkMat : beltMat
    }, { scale: chestScale, beltBuckle: !isStrange });

    const neckGeo = SculptGeo.limbSegment(0.18, 0.092, 0.118, 12);
    this.addOutlined(neck, neckGeo, (isSpider || isPanther) ? legMat : skinMat, 0.009);
    this.addOutlined(headGroup, SculptGeo.heroHead(isThor ? 1.03 : 1.0), headMat, 0.011);

    // Sculpted 3D Facial Features, Hair & Lenses per Hero
    if (isSpider) {
      const cyanGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const eyeRimMat = this.stylized(0x090b15, { roughness: 0.32 });
      const eyeLensMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      [-1, 1].forEach(side => {
        const rimGeo = SculptGeo.beveledShape([[0, -0.018], [0.068, 0.025], [0.058, 0.058], [0.004, 0.015]], 0.018, 0.005);
        const rim = new THREE.Mesh(rimGeo, eyeRimMat);
        rim.position.set(side * 0.034, 0.028, 0.168);
        rim.rotation.y = side * 0.24;
        if (side < 0) rim.scale.x = -1;
        const inner = new THREE.Mesh(SculptGeo.beveledShape([[0.01, -0.008], [0.056, 0.022], [0.048, 0.044], [0.012, 0.012]], 0.016, 0.002), eyeLensMat);
        inner.position.z = 0.006;
        rim.add(inner);
        headGroup.add(rim);
      });
      // Sculpted hexagonal back Waldo housing + 3-segment curved Iron-Spider Waldoes + front/back emblems
      const pack = this.addOutlined(chest, new THREE.CylinderGeometry(0.16, 0.14, 0.09, 6), goldMat, 0.008);
      pack.rotation.x = Math.PI / 2;
      pack.position.set(0, 0.27, -0.190);
      pack.add(new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.10, 6), cyanGlow));

      [0.24, -0.184].forEach((zPos, isBack) => {
        const emblem = this.addOutlined(chest, new THREE.OctahedronGeometry(0.065, 0), goldMat, 0.005);
        emblem.scale.set(0.85, 1.35, 0.28);
        emblem.position.set(0, 0.25, zPos);
        [-1, 1].forEach(side => {
          for (let leg = 0; leg < 2; leg++) {
            const legBar = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.009, 0.16, 5), goldMat);
            legBar.position.set(side * (0.08 + leg * 0.03), 0.24 + (leg === 0 ? 0.07 : -0.04), zPos + (isBack ? -0.01 : 0.01));
            legBar.rotation.z = side * (leg === 0 ? -0.95 : -0.55);
            chest.add(legBar);
          }
        });
      });

      const waldoConfigs = [
        { x: -0.14, y: 0.36, rz: 0.68, rx: -0.26 },
        { x:  0.14, y: 0.36, rz: -0.68, rx: -0.26 },
        { x: -0.16, y: 0.18, rz: 1.08, rx: -0.16 },
        { x:  0.16, y: 0.18, rz: -1.08, rx: -0.16 }
      ];
      waldoConfigs.forEach(wc => {
        const wRoot = new THREE.Group();
        wRoot.position.set(wc.x, wc.y, -0.20);
        wRoot.rotation.set(wc.rx, 0, wc.rz);
        const s1 = this.addOutlined(wRoot, new THREE.CylinderGeometry(0.036, 0.028, 0.56, 8), goldMat, 0.006);
        s1.position.y = 0.28;
        const elbow = new THREE.Group();
        elbow.position.y = 0.56;
        wRoot.add(elbow);
        elbow.add(new THREE.Mesh(new THREE.SphereGeometry(0.046, 8, 8), cyanGlow));
        const s2 = this.addOutlined(elbow, new THREE.CylinderGeometry(0.030, 0.024, 0.44, 8), upperArmMat, 0.006);
        s2.position.set(0, 0.16, 0.16);
        s2.rotation.x = 0.74;
        const wrist = new THREE.Group();
        wrist.position.set(0, 0.31, 0.32);
        wrist.rotation.x = 0.72;
        elbow.add(wrist);
        wrist.add(new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.010, 6, 12), cyanGlow));
        const claw = this.addOutlined(wrist, new THREE.ConeGeometry(0.028, 0.42, 7), goldMat, 0.005);
        claw.position.set(0, 0.20, 0.04);
        claw.rotation.x = 0.55;
        chest.add(wRoot);
        group.userData.waldoes.push({ root: wRoot, elbow, baseRx: wc.rx, baseRz: wc.rz });
      });

    } else if (isThor) {
      const blondeMat = this.stylized(0xeab308, { roughness: 0.48, rimColor: 0xfef08a });
      const beardBlonde = this.stylized(0xd99b06, { roughness: 0.56 });
      this.addSculptedFacialDetail(headGroup, skinMat, blondeMat, {
        hairStyle: 'long', beardMat: beardBlonde, beardStyle: 'full'
      });

      const helmBand = this.addOutlined(headGroup, SculptGeo.cartoonLoft([
        { y: 0.11, rx: 0.184, rz: 0.194 },
        { y: 0.18, rx: 0.188, rz: 0.198 }
      ], 16), silverMat, 0.009);
      helmBand.position.y = 0.0;
      [-1, 1].forEach(side => {
        const wingGeo = SculptGeo.beveledShape([[0, 0], [0.19, 0.15], [0.12, 0.28], [0, 0.12]], 0.022, 0.005);
        const wing = this.addOutlined(headGroup, wingGeo, silverMat, 0.009);
        wing.position.set(side * 0.18, 0.12, -0.02);
        wing.rotation.y = side * 0.45;
        if (side < 0) wing.scale.x = -1;

        const pld = this.addOutlined(chest, SculptGeo.beveledShape([[0, -0.04], [0.17, -0.02], [0.16, 0.11], [0, 0.10]], 0.18, 0.015), silverMat, 0.01);
        pld.position.set(side * 0.35, 0.39, 0);
        if (side < 0) pld.scale.x = -1;
      });
      // 3D Sculpted Asgardian Armor Discs & Stormbreaker Arc Cores on chest
      [-0.125, 0.125].forEach(dx => {
        [0.14, 0.29].forEach(dy => {
          const disc = this.addOutlined(chest, new THREE.CylinderGeometry(0.062, 0.066, 0.032, 12), silverMat, 0.005);
          disc.rotation.x = Math.PI / 2;
          disc.position.set(dx, dy, 0.172);
          const rune = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.038, 10), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
          rune.rotation.x = Math.PI / 2;
          rune.position.set(dx, dy, 0.176);
          chest.add(rune);
          group.userData.energyParts.push(rune);
        });
      });

      const redCapeMat = this.stylized(0xb91c1c, { doubleSided: true, roughness: 0.52, rimColor: 0xfca5a5 });
      group.userData.clothSim = new ClothSim({
        cols: 7, rows: 9, widthTop: 0.78, widthBot: 1.38, length: 1.56, material: redCapeMat
      });

    } else if (isStrange) {
      const hairBlack = this.stylized(0x1c1917, { roughness: 0.62, rimColor: 0x94a3b8 });
      const silverTempleMat = this.stylized(0xe2e8f0, { roughness: 0.45 });
      this.addSculptedFacialDetail(headGroup, skinMat, hairBlack, {
        hairStyle: 'swept', beardMat: hairBlack, beardStyle: 'goatee'
      });
      [-1, 1].forEach(side => {
        const streak = new THREE.Mesh(SculptGeo.beveledShape([[0, -0.04], [0.016, 0], [0.012, 0.06], [0, 0.04]], 0.055, 0.004), silverTempleMat);
        streak.position.set(side * 0.165, 0.06, 0.04);
        headGroup.add(streak);
      });

      const collarMat = this.stylized(0xb91c1c, { doubleSided: true, roughness: 0.44, rimColor: 0xfca5a5 });
      const skirt = this.addOutlined(hips, SculptGeo.cartoonLoft([
        { y: -0.26, rx: 0.28, rz: 0.24 },
        { y: -0.04, rx: 0.23, rz: 0.18 },
        { y: 0.10,  rx: 0.21, rz: 0.16 }
      ], 16), this.stylized(0x1d4ed8), 0.01);
      skirt.position.set(0, 0, 0);
      const collar = this.addOutlined(chest, new THREE.CylinderGeometry(0.36, 0.24, 0.34, 16, 1, true, Math.PI * 0.24, Math.PI * 1.52), collarMat, 0.01);
      collar.position.set(0, 0.45, -0.05);
      group.userData.collarMesh = collar;

      const eyeRing = this.addOutlined(chest, new THREE.OctahedronGeometry(0.082, 0), goldMat, 0.008);
      eyeRing.scale.set(1.18, 0.92, 0.42);
      eyeRing.position.set(0, 0.28, 0.205);
      const timeGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.038, 0), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      timeGem.position.set(0, 0.28, 0.232);
      chest.add(timeGem);
      group.userData.energyParts.push(timeGem);

      group.userData.clothSim = new ClothSim({
        cols: 7, rows: 9, widthTop: 0.74, widthBot: 1.32, length: 1.52, material: collarMat
      });

    } else if (isReed) {
      const hairBrown = this.stylized(0x292524, { roughness: 0.62, rimColor: 0x78716c });
      this.addSculptedFacialDetail(headGroup, skinMat, hairBrown, {
        hairStyle: 'swept', beardMat: hairBrown, beardStyle: 'goatee'
      });
      const ffWhite = this.stylized(0xf8fafc, { roughness: 0.34 });
      const collar = this.addOutlined(chest, SculptGeo.cartoonLoft([
        { y: 0.41, rx: 0.195, rz: 0.165 },
        { y: 0.48, rx: 0.170, rz: 0.145 }
      ], 16), ffWhite, 0.008);
      const badge = this.addOutlined(chest, new THREE.CylinderGeometry(0.082, 0.082, 0.024, 16), ffWhite, 0.005);
      badge.rotation.x = Math.PI / 2;
      badge.position.set(0, 0.26, 0.192);
      const bRing = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.012, 8, 18), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      bRing.position.set(0, 0.26, 0.205);
      chest.add(bRing);

    } else if (isPanther) {
      const pantherEyes = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      const vibGlow = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      [-1, 1].forEach(side => {
        const ear = this.addOutlined(headGroup, SculptGeo.beveledShape([[0, -0.02], [0.045, 0.0], [0.015, 0.14], [-0.028, 0.02]], 0.042, 0.006), legMat, 0.008);
        ear.position.set(side * 0.128, 0.195, -0.02);
        ear.rotation.z = side * -0.16;
        if (side < 0) ear.scale.x = -1;

        const eye = new THREE.Mesh(SculptGeo.beveledShape([[-0.022, -0.005], [0.022, 0.010], [0.014, 0.016], [-0.018, 0.006]], 0.012, 0.002), pantherEyes);
        eye.position.set(side * 0.056, 0.036, 0.172);
        eye.rotation.y = side * 0.25;
        if (side < 0) eye.scale.x = -1;
        headGroup.add(eye);

        const trim = this.addOutlined(chest, SculptGeo.beveledShape([[0, -0.03], [0.14, -0.02], [0.13, 0.08], [0, 0.07]], 0.14, 0.01), silverMat, 0.006);
        trim.position.set(side * 0.34, 0.38, 0);
        if (side < 0) trim.scale.x = -1;
      });
      const collarRing = this.addOutlined(chest, new THREE.TorusGeometry(0.192, 0.024, 8, 18), silverMat, 0.006);
      collarRing.rotation.x = Math.PI / 2;
      collarRing.position.set(0, 0.43, 0.01);
      for (let a = -0.95; a <= 0.95; a += 0.27) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.019, 0.095, 5), silverMat);
        tooth.position.set(Math.sin(a) * 0.205, 0.375, Math.cos(a) * 0.205);
        tooth.rotation.x = 2.65;
        chest.add(tooth);
      }
      const coreLine = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.014, 8, 16), vibGlow);
      coreLine.position.set(0, 0.25, 0.190);
      chest.add(coreLine);
      group.userData.energyParts.push(coreLine);
    }

    const handColMat = (isThor || isStrange || isReed) ? (isReed ? forearmMat : skinMat) : forearmMat;
    const armL = this.createLimb({
      isRight: false, upperLen: 0.35, lowerLen: 0.33, rTop: 0.098 * chestScale, rMid: 0.082 * chestScale, rBot: 0.064 * chestScale,
      upperMat: upperArmMat, lowerMat: forearmMat, jointMat: isSpider ? goldMat : forearmMat,
      cuffMat: (isThor || isSpider) ? goldMat : null, handMat: handColMat, gauntlet: isThor
    });
    armL.root.position.set(-shoulderHalfW, 0.37, 0);
    chest.add(armL.root);

    const armR = this.createLimb({
      isRight: true, upperLen: 0.35, lowerLen: 0.33, rTop: 0.098 * chestScale, rMid: 0.082 * chestScale, rBot: 0.064 * chestScale,
      upperMat: upperArmMat, lowerMat: forearmMat, jointMat: isSpider ? goldMat : forearmMat,
      cuffMat: (isThor || isSpider) ? goldMat : null, handMat: handColMat, gauntlet: isThor
    });
    armR.root.position.set(shoulderHalfW, 0.37, 0);
    chest.add(armR.root);

    const legL = this.createLimb({
      isLeg: true, upperLen: 0.47, lowerLen: 0.45, rTop: 0.125 * chestScale, rMid: 0.096 * chestScale, rBot: 0.076 * chestScale,
      upperMat: legMat, lowerMat: bootMat, jointMat: isSpider ? goldMat : bootMat, soleMat: darkInkMat
    });
    legL.root.position.set(-0.145 * chestScale, -0.06, 0);
    hips.add(legL.root);

    const legR = this.createLimb({
      isLeg: true, upperLen: 0.47, lowerLen: 0.45, rTop: 0.125 * chestScale, rMid: 0.096 * chestScale, rBot: 0.076 * chestScale,
      upperMat: legMat, lowerMat: bootMat, jointMat: isSpider ? goldMat : bootMat, soleMat: darkInkMat
    });
    legR.root.position.set(0.145 * chestScale, -0.06, 0);
    hips.add(legR.root);

    if (isThor) {
      const mjolnir = this.buildMjolnirMesh();
      mjolnir.position.set(0, -0.10, 0.17);
      mjolnir.rotation.x = Math.PI / 2;
      armR.tip.add(mjolnir);
      group.userData.mjolnir = mjolnir;
    } else if (isStrange) {
      const mandalaMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.85 });
      [armL.tip, armR.tip].forEach(hand => {
        const mandala = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.32, 8), mandalaMat);
        mandala.position.set(0, -0.08, 0.08);
        hand.add(mandala);
        group.userData.mandalas.push(mandala);
      });
    } else if (isPanther) {
      [armL.tip, armR.tip].forEach(hand => {
        for (let c = -1; c <= 1; c++) {
          const claw = new THREE.Mesh(new THREE.ConeGeometry(0.013, 0.20, 4), silverMat);
          claw.rotation.x = Math.PI;
          claw.position.set(c * 0.026, -0.17, 0.045);
          hand.add(claw);
        }
      });
    }

    const capeAnchorL = new THREE.Object3D();
    capeAnchorL.position.set(-0.28, 0.40, -0.18);
    const capeAnchorR = new THREE.Object3D();
    capeAnchorR.position.set(0.28, 0.40, -0.18);
    chest.add(capeAnchorL, capeAnchorR);

    group.userData.parts = {
      hips, spine, chest, neck, head: headGroup,
      armL, armR, legL, legR,
      handL: armL.tip, handR: armR.tip,
      capeAnchorL, capeAnchorR
    };
    return group;
  }

  // ==========================================================================
  // DOCTOR VICTOR VON DOOM — CLEAN CARTOON LOW-POLY TITANIUM SOVEREIGN (Y=0)
  // ==========================================================================
  static buildDoctorDoomMesh() {
    const group = new THREE.Group();
    const armorTex = ProceduralTextures.createArmorCarbonTexture('#334155', '#94a3b8');
    const titaniumMat = this.stylized(0x94a3b8, { map: armorTex, metalness: 0.88, roughness: 0.22, rimColor: 0xe2e8f0 });
    const emeraldMat = this.stylized(0x064e3b, { roughness: 0.54, metalness: 0.16, rimColor: 0x34d399 });
    const goldMat = this.stylized(0xd97706, { metalness: 0.88, roughness: 0.18, rimColor: 0xfde68a });
    const leatherMat = this.stylized(0x451a03, { roughness: 0.72, metalness: 0.12 });
    const glowGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    group.add(this.createContactShadow(1.35));

    const hips = new THREE.Group();
    hips.position.y = 1.08;
    group.add(hips);
    const spine = new THREE.Group();
    hips.add(spine);
    const chest = new THREE.Group();
    chest.position.y = 0.34;
    spine.add(chest);
    const neck = new THREE.Group();
    neck.position.y = 0.44;
    chest.add(neck);
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.14;
    neck.add(headGroup);

    hips.position.y = 1.12;
    this.buildCartoonTorso(chest, hips, {
      torsoMat: titaniumMat, legMat: titaniumMat, beltMat: leatherMat, accentMat: goldMat
    }, { scale: 1.16 });

    // Ref 1ba52ed08: Deep Emerald Studded Cuirass Overplate & Sovereign Tabard (zero box cube!)
    const emeraldArmorMat = this.stylized(0x064e3b, { metalness: 0.25, roughness: 0.48, rimColor: 0x34d399 });
    const surcoat = this.addOutlined(chest, SculptGeo.cartoonLoft([
      { y: -0.26, rx: 0.245, rz: 0.175, frontFlat: 0.14 },
      { y: 0.05,  rx: 0.248, rz: 0.172, frontFlat: 0.12 },
      { y: 0.26,  rx: 0.312, rz: 0.194, pecShelf: 0.032, chestCrease: 0.018 },
      { y: 0.41,  rx: 0.345, rz: 0.198, pecShelf: 0.020 },
      { y: 0.47,  rx: 0.195, rz: 0.165 }
    ], 22), emeraldArmorMat, 0.012);
    surcoat.position.z = 0.008;

    // Sovereign Waist Tassets / Skirt Flaps
    const tassets = this.addOutlined(hips, SculptGeo.cartoonLoft([
      { y: -0.28, rx: 0.285, rz: 0.225, frontFlat: 0.12 },
      { y: 0.02,  rx: 0.245, rz: 0.185, frontFlat: 0.10 },
      { y: 0.12,  rx: 0.232, rz: 0.175 }
    ], 16), emeraldMat, 0.011);

    // Dual Embossed Circular Gold/Silver Cloak Medallions + Draped Catenary Chest Chain
    [-0.24, 0.24].forEach(mx => {
      const medalRim = this.addOutlined(chest, new THREE.CylinderGeometry(0.095, 0.095, 0.032, 16), goldMat, 0.009);
      medalRim.rotation.x = Math.PI / 2;
      medalRim.position.set(mx, 0.35, 0.195);
      const medalCore = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.038, 12), titaniumMat);
      medalCore.rotation.x = Math.PI / 2;
      medalCore.position.set(mx, 0.35, 0.205);
      chest.add(medalCore);

      // Layered Gothic Steel Pauldrons + Fur-lined Hood Collar
      const pauldron = this.addOutlined(chest, SculptGeo.beveledShape([[0, -0.06], [0.22, -0.04], [0.20, 0.13], [0, 0.12]], 0.24, 0.018), titaniumMat, 0.012);
      pauldron.position.set(mx > 0 ? 0.35 : -0.35, 0.40, 0);
      pauldron.rotation.z = mx > 0 ? -0.14 : 0.14;
      if (mx < 0) pauldron.scale.x = -1;
    });
    const chainPts = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8 - 0.5;
      chainPts.push(new THREE.Vector3(u * 0.48, 0.35 - Math.cos(u * Math.PI) * 0.08, 0.212 + Math.cos(u * Math.PI) * 0.018));
    }
    chest.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(chainPts), 16, 0.015, 6, false), goldMat));

    this.addOutlined(neck, SculptGeo.limbSegment(0.18, 0.105, 0.128, 12), titaniumMat, 0.01);

    // Sculpted Steel Sovereign Mask + Chiseled Brow/Cheekplanes + Deep Gothic Hood
    const maskMat = this.stylized(0xb8c4d4, { map: armorTex, metalness: 0.92, roughness: 0.16, rimColor: 0xf8fafc });
    this.addOutlined(headGroup, SculptGeo.heroHead(1.06, { chiseled: 1.35 }), maskMat, 0.014);
    const browPlate = new THREE.Mesh(SculptGeo.beveledShape([[-0.11, 0.01], [0, -0.018], [0.11, 0.01], [0.095, 0.045], [0, 0.025], [-0.095, 0.045]], 0.04, 0.008), titaniumMat);
    browPlate.position.set(0, 0.075, 0.175);
    const noseBridge = new THREE.Mesh(SculptGeo.beveledShape([[-0.022, -0.05], [0.022, -0.05], [0.014, 0.045], [-0.014, 0.045]], 0.032, 0.005), maskMat);
    noseBridge.position.set(0, 0.022, 0.188);
    const mouthGrille = new THREE.Mesh(SculptGeo.beveledShape([[-0.068, -0.038], [0.068, -0.038], [0.056, 0.026], [-0.056, 0.026]], 0.028, 0.006), this.stylized(0x1e293b, { metalness: 0.85 }));
    mouthGrille.position.set(0, -0.095, 0.165);
    headGroup.add(browPlate, noseBridge, mouthGrille);

    [-0.066, 0.066].forEach(ex => {
      const eye = new THREE.Mesh(SculptGeo.beveledShape([[-0.032, -0.009], [0.032, 0.004], [0.026, 0.016], [-0.026, 0.006]], 0.018, 0.002), glowGreen);
      eye.position.set(ex, 0.046, 0.186);
      if (ex < 0) eye.scale.x = -1;
      headGroup.add(eye);
    });

    // Multi-ring Draped Green Hood wrapping sides & crown without blocking mask
    const doomHood = this.addOutlined(headGroup, SculptGeo.cartoonLoft([
      { y: -0.14, rx: 0.215, rz: 0.205, oz: -0.068 },
      { y: 0.02,  rx: 0.232, rz: 0.228, oz: -0.055 },
      { y: 0.16,  rx: 0.238, rz: 0.245, oz: -0.032, browRidge: 0.028 },
      { y: 0.27,  rx: 0.185, rz: 0.205, oz: -0.028 },
      { y: 0.32,  rx: 0.088, rz: 0.115, oz: -0.045 }
    ], 18), emeraldMat, 0.013);
    doomHood.position.z = -0.01;

    const armL = this.createLimb({ isRight: false, upperLen: 0.36, lowerLen: 0.34, rTop: 0.118, rMid: 0.098, rBot: 0.078, upperMat: titaniumMat, lowerMat: maskMat, gauntlet: true, cuffMat: goldMat });
    armL.root.position.set(-0.44, 0.39, 0);
    chest.add(armL.root);

    const armR = this.createLimb({ isRight: true, upperLen: 0.36, lowerLen: 0.34, rTop: 0.118, rMid: 0.098, rBot: 0.078, upperMat: titaniumMat, lowerMat: maskMat, gauntlet: true, cuffMat: goldMat });
    armR.root.position.set(0.44, 0.39, 0);
    chest.add(armR.root);

    const legL = this.createLimb({ isLeg: true, kneePad: true, upperLen: 0.48, lowerLen: 0.46, rTop: 0.142, rMid: 0.110, rBot: 0.086, upperMat: titaniumMat, lowerMat: maskMat, jointMat: goldMat });
    legL.root.position.set(-0.165, -0.06, 0);
    hips.add(legL.root);

    const legR = this.createLimb({ isLeg: true, kneePad: true, upperLen: 0.48, lowerLen: 0.46, rTop: 0.142, rMid: 0.110, rBot: 0.086, upperMat: titaniumMat, lowerMat: maskMat, jointMat: goldMat });
    legR.root.position.set(0.165, -0.06, 0);
    hips.add(legR.root);

    const orbsGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), glowGreen);
      orb.position.set(Math.cos(angle) * 1.45, 1.85, Math.sin(angle) * 1.45);
      orbsGroup.add(orb);
    }
    group.add(orbsGroup);

    const capeAnchorL = new THREE.Object3D();
    capeAnchorL.position.set(-0.34, 0.41, -0.21);
    const capeAnchorR = new THREE.Object3D();
    capeAnchorR.position.set(0.34, 0.41, -0.21);
    chest.add(capeAnchorL, capeAnchorR);

    const cloakMat = this.stylized(0x064e3b, { doubleSided: true, roughness: 0.56, rimColor: 0x34d399 });
    const clothSim = new ClothSim({
      cols: 7, rows: 9, widthTop: 0.88, widthBot: 1.56, length: 1.72, material: cloakMat
    });

    group.scale.setScalar(1.32);
    group.userData = {
      heroId: 'doctor_doom',
      isBoss: true,
      orbsGroup,
      clothSim,
      attackTimer: 0,
      windupType: null,
      staggered: false,
      bossIntroTimer: 0,
      parts: {
        hips, spine, chest, neck, head: headGroup,
        armL, armR, legL, legR,
        handL: armL.tip, handR: armR.tip,
        capeAnchorL, capeAnchorR
      }
    };
    return group;
  }

  // ==========================================================================
  // DOOMBots (LEAN CARTOON RIG FOR 32 ACTIVE SOLDIERS)
  // ==========================================================================
  static buildDoombotMesh(variant = 'vanguard') {
    const root = new THREE.Group();
    const isArcane = variant === 'arcane';
    const isSniper = variant === 'sniper';
    const isBruiser = variant === 'bruiser';

    const steelMat = this.stylized(isBruiser ? 0x334155 : isSniper ? 0x475569 : 0x64748b, { metalness: 0.82, roughness: 0.25 });
    const darkJointMat = this.stylized(0x1e293b, { metalness: 0.75, roughness: 0.32 });
    const emeraldMat = this.stylized(isArcane ? 0x581c87 : isSniper ? 0x7f1d1d : isBruiser ? 0x7c2d12 : 0x064e3b, { roughness: 0.52 });
    const glowHex = isArcane ? 0xa855f7 : isSniper ? 0xef4444 : isBruiser ? 0xf97316 : 0x10b981;
    const eyeMat = new THREE.MeshBasicMaterial({ color: glowHex });

    const hips = new THREE.Group();
    hips.position.y = 1.04;
    root.add(hips);
    const spine = new THREE.Group();
    hips.add(spine);
    const chest = new THREE.Group();
    chest.position.y = 0.34;
    spine.add(chest);
    const neck = new THREE.Group();
    neck.position.y = 0.42;
    chest.add(neck);
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.13;
    neck.add(headGroup);

    const sc = isBruiser ? 1.18 : isSniper ? 0.92 : 1.0;

    this.addOutlined(hips, SculptGeo.cartoonLoft([
      { y: -0.10, rx: 0.16 * sc, rz: 0.13 * sc },
      { y: 0.12,  rx: 0.20 * sc, rz: 0.15 * sc }
    ], 8), darkJointMat, 0.011);

    this.addOutlined(chest, SculptGeo.cartoonLoft([
      { y: -0.12, rx: 0.19 * sc, rz: 0.14 * sc },
      { y: 0.22,  rx: 0.29 * sc, rz: 0.19 * sc },
      { y: 0.42,  rx: 0.31 * sc, rz: 0.18 * sc }
    ], 8), steelMat, 0.012);

    const tabard = this.addOutlined(chest, new THREE.BoxGeometry(0.32 * sc, 0.54, 0.28 * sc), emeraldMat, 0.009);
    tabard.position.y = 0.12;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.072, 0), eyeMat);
    core.scale.set(1, 1, 0.4);
    core.position.set(0, 0.22, 0.19 * sc);
    chest.add(core);

    this.addOutlined(headGroup, SculptGeo.heroHead(0.95), steelMat, 0.011);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.042, 0.05), eyeMat);
    visor.position.set(0, 0.045, 0.175);
    headGroup.add(visor);

    this.addOutlined(headGroup, SculptGeo.cartoonLoft([
      { y: -0.02, rx: 0.195, rz: 0.205, oz: -0.02 },
      { y: 0.22,  rx: 0.135, rz: 0.145, oz: -0.02 }
    ], 8), emeraldMat, 0.01);

    const armL = this.createLimb({ noHand: true, upperLen: 0.34, lowerLen: 0.32, rTop: 0.095 * sc, rMid: 0.078 * sc, rBot: 0.062 * sc, upperMat: darkJointMat, lowerMat: steelMat });
    armL.root.position.set(-0.37 * sc, 0.36, 0);
    chest.add(armL.root);

    const armR = this.createLimb({ noHand: true, upperLen: 0.34, lowerLen: 0.32, rTop: 0.095 * sc, rMid: 0.078 * sc, rBot: 0.062 * sc, upperMat: darkJointMat, lowerMat: steelMat });
    armR.root.position.set(0.37 * sc, 0.36, 0);
    chest.add(armR.root);

    const barrel = this.addOutlined(armR.tip, new THREE.CylinderGeometry(0.042, 0.058, 0.46, 6), darkJointMat, 0.008);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, -0.05, 0.21);

    const legL = this.createLimb({ isLeg: true, upperLen: 0.46, lowerLen: 0.44, rTop: 0.118 * sc, rMid: 0.092 * sc, rBot: 0.074 * sc, upperMat: darkJointMat, lowerMat: steelMat });
    legL.root.position.set(-0.145 * sc, -0.06, 0);
    hips.add(legL.root);

    const legR = this.createLimb({ isLeg: true, upperLen: 0.46, lowerLen: 0.44, rTop: 0.118 * sc, rMid: 0.092 * sc, rBot: 0.074 * sc, upperMat: darkJointMat, lowerMat: steelMat });
    legR.root.position.set(0.145 * sc, -0.06, 0);
    hips.add(legR.root);

    const hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.18, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x090b15, side: THREE.DoubleSide })
    );
    hpBarBg.position.set(0, 2.35 * sc, 0);
    const hpBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1.10, 0.075),
      new THREE.MeshBasicMaterial({ color: glowHex, side: THREE.DoubleSide })
    );
    hpBarFill.position.z = 0.01;
    hpBarBg.add(hpBarFill);
    root.add(hpBarBg);

    root.scale.setScalar(isBruiser ? 1.18 : 1.04);
    root.userData = {
      heroId: 'doombot',
      variant,
      attackTimer: 0,
      windupType: null,
      hpBarBg,
      hpBarFill,
      parts: {
        hips, spine, chest, neck, head: headGroup,
        armL, armR, legL, legR,
        handL: armL.tip, handR: armR.tip
      }
    };
    return root;
  }

  static playPowerAnim(mesh, id, duration = 0.55) {
    if (!mesh || !mesh.userData) return;
    mesh.userData.powerAnim = { id, timer: duration, duration };
  }

  // ==========================================================================
  // DAMPED ACTION-RPG SKELETAL ANIMATION + SWIMMING + PER-POWER CHOREOGRAPHY
  // ==========================================================================
  static animateCharacter(mesh, delta, isMoving, isGrounded, time, bank = 0) {
    if (!mesh || !mesh.userData) return;
    const ud = mesh.userData;
    const dt = Math.min(delta || 0.016, 0.05);

    if (ud.orbsGroup) ud.orbsGroup.rotation.y += dt * 1.45;
    if (ud.timeRingsGroup) {
      ud.timeRingsGroup.children.forEach((r, i) => {
        r.rotation.z += dt * (i % 2 === 0 ? 1.8 : -2.3);
        r.rotation.x += dt * 0.7;
      });
    }

    const p = ud.parts;
    if (!p || !p.hips) return;

    const hid = ud.heroId || 'default';
    const rawSpeed = ud.moveSpeedRatio !== undefined
      ? THREE.MathUtils.clamp(ud.moveSpeedRatio, 0, 1.35)
      : (isMoving ? 1.0 : 0.0);
    ud._speedSmooth = THREE.MathUtils.lerp(ud._speedSmooth || 0, rawSpeed, 1 - Math.exp(-10 * dt));
    const speedRatio = ud._speedSmooth;
    const animSpeed = ud.isSwimming
      ? (isMoving ? 8.2 : 3.0)
      : (isMoving ? (4.6 + speedRatio * 7.6) : 2.2);
    ud._animPhase = (ud._animPhase || 0) + dt * animSpeed;
    const onGroundMove = (isMoving && isGrounded && !ud.isFlying && !ud.isSwinging && !ud.isSwimming) ? 1 : 0;
    const prevMoveW = ud._moveW || 0;
    if (prevMoveW > 0.35 && onGroundMove === 0 && !ud.isSwimming) {
      ud._stopSettle = 1.0;
      ud._stopForwardVel = prevMoveW;
    }
    ud._moveW = THREE.MathUtils.lerp(prevMoveW, onGroundMove, 1 - Math.exp(-12 * dt));
    ud._stopSettle = Math.max(0, (ud._stopSettle || 0) - dt * 4.2);
    if (ud._wasAir && isGrounded && !ud.isSwimming) ud._landSquash = 1.0;
    ud._wasAir = !isGrounded;
    ud._landSquash = Math.max(0, (ud._landSquash || 0) - dt * 5.0);

    const t = {
      hipX: 0, hipY: 1.10, hipRx: 0, hipRy: 0, hipRz: 0,
      spRx: 0, spRy: 0, spRz: 0, chRx: 0, chRy: 0, chRz: 0, hdRx: 0, hdRy: 0, hdRz: 0,
      aLRx: 0, aLRy: 0, aLRz: -0.18, aLJx: -0.24,
      aRRx: 0, aRRy: 0, aRRz: 0.18,  aRJx: -0.24,
      lLRx: 0, lLRz: -0.07, lLJx: 0.04,
      lRRx: 0, lRRz: 0.07,  lRJx: 0.04,
      footPitchL: 0, footPitchR: 0
    };

    const w = ud._moveW;
    const idle = 1 - w;
    const breath = Math.sin(time * 2.5);

    // 1. Hero-Specific Grounded Stances + Deceleration Braking Settle
    if (isGrounded && !ud.isFlying && !ud.isSwinging && !ud.isSwimming && !ud.staggered) {
      if (hid === 'spider_man') {
        t.hipY = 1.02 + breath * 0.02 * idle;
        t.spRx = 0.22 * idle; t.chRy = 0.22 * idle; t.hdRx = -0.16 * idle; t.hdRy = -0.18 * idle;
        t.lLRx = -0.34 * idle; t.lLJx = 0.56 * idle; t.lLRz = -0.13;
        t.lRRx = 0.18 * idle;  t.lRJx = 0.36 * idle; t.lRRz = 0.13;
        t.aRRx = -0.78 * idle; t.aRJx = -0.45 * idle; t.aRRz = 0.26;
        t.aLRx = 0.28 * idle;  t.aLJx = -0.68 * idle; t.aLRz = -0.34;
      } else if (hid === 'iron_man' || hid === 'doctor_strange' || hid === 'scarlet_witch' || hid === 'the_void' || hid === 'magneto') {
        t.hipY = 1.16 + Math.sin(time * 2.8) * 0.045 * idle;
        t.spRx = -0.04 * idle;
        t.lLRx = 0.06 * idle;  t.lLJx = 0.18 * idle; t.lLRz = -0.09;
        t.lRRx = -0.12 * idle; t.lRJx = 0.28 * idle; t.lRRz = 0.09;
        t.aLRx = -0.36 * idle; t.aLJx = -0.60 * idle; t.aLRz = -0.28;
        t.aRRx = -0.46 * idle; t.aRJx = -0.52 * idle; t.aRRz = 0.28;
      } else if (hid === 'wolverine' || hid === 'black_panther') {
        t.hipY = 1.04 + breath * 0.018 * idle;
        t.spRx = 0.22 * idle; t.hdRx = -0.16 * idle;
        t.lLRx = -0.28 * idle; t.lLJx = 0.44 * idle; t.lLRz = -0.12;
        t.lRRx = 0.20 * idle;  t.lRJx = 0.30 * idle; t.lRRz = 0.12;
        t.aLRx = -0.66 * idle; t.aLJx = -0.78 * idle; t.aLRz = -0.32;
        t.aRRx = -0.72 * idle; t.aRJx = -0.70 * idle; t.aRRz = 0.32;
      } else {
        t.hipY = 1.10 + breath * 0.016 * idle;
        t.hipRy = 0.14 * idle; t.chRy = -0.12 * idle;
        t.lLRx = -0.12 * idle; t.lLJx = 0.20 * idle; t.lLRz = -0.10;
        t.lRRx = 0.14 * idle;  t.lRJx = 0.16 * idle; t.lRRz = 0.10;
        t.aLRx = -0.44 * idle; t.aLJx = -0.68 * idle; t.aLRz = -0.26;
        t.aRRx = -0.24 * idle; t.aRJx = -0.42 * idle; t.aRRz = 0.26;
      }

      if (ud._stopSettle > 0.01 && !isMoving) {
        const st = Math.sin(ud._stopSettle * Math.PI) * (ud._stopForwardVel || 1.0);
        t.hipY -= 0.065 * st;
        t.spRx += 0.16 * st;
        t.chRx += 0.08 * st;
        t.lLJx += 0.24 * st;
        t.lRJx += 0.20 * st;
        t.aLRx -= 0.18 * st;
        t.aRRx += 0.14 * st;
      }
    }

    // 2. Pro Biomechanical Locomotion Cycle (Matched Stride, True Elbow Pump, Foot Roll, Hero Sprints)
    if (w > 0.01) {
      const phase = ud._animPhase;
      const spdN = Math.max(0.25, speedRatio);
      const strideL = -Math.sin(phase);
      const strideR = -Math.sin(phase + Math.PI);
      const swingL = Math.max(0, -Math.cos(phase));
      const swingR = Math.max(0, -Math.cos(phase + Math.PI));
      const stanceL = Math.max(0, Math.cos(phase)) * (1.0 - Math.abs(strideL));
      const stanceR = Math.max(0, Math.cos(phase + Math.PI)) * (1.0 - Math.abs(strideR));

      // Double-frequency vertical + subtle natural lateral weight transfer sway
      t.hipX += Math.sin(phase) * 0.026 * Math.min(1, spdN) * w;
      t.hipY -= (Math.cos(phase * 2.0) * 0.048 * spdN + ud._landSquash * 0.14) * w;

      // Pelvis twist follows advancing leg; spine & chest counter-rotate smoothly
      const strafe = THREE.MathUtils.clamp(ud.strafeX || 0, -1, 1);
      t.hipRy += (-strideL * 0.14 + strafe * 0.16) * w;
      t.hipRz += (strideL * 0.055 - strafe * 0.08) * w;
      t.spRy += strideL * 0.09 * w;
      t.chRy += (strideL * 0.17 - strafe * 0.14) * w;

      // Forward drive lean + natural cornering bank from turnRate/bank
      const turnBank = THREE.MathUtils.clamp((bank || 0) * 0.34 + (ud.turnRate || 0) * 0.055, -0.32, 0.32);
      t.spRx += (0.14 + 0.13 * spdN) * w;
      t.chRx += (0.06 + 0.05 * spdN) * w;
      t.spRz += (turnBank + strafe * 0.08) * w;
      t.chRz += turnBank * 0.55 * w;

      // Leg flexion/extension & ankle roll + lateral stride clearance
      const thighAmp = 0.44 + 0.40 * spdN;
      t.lLRx += strideL * thighAmp * w;
      t.lRRx += strideR * thighAmp * w;
      t.lLJx += (0.12 + swingL * 1.32 + stanceL * 0.24) * w;
      t.lRJx += (0.12 + swingR * 1.32 + stanceR * 0.24) * w;
      t.lLRz = -0.07 - swingL * 0.03 * w + Math.max(0, -strafe) * 0.10 * w;
      t.lRRz = 0.07 + swingR * 0.03 * w - Math.max(0, strafe) * 0.10 * w;

      const strikeL = Math.max(0, -strideL) * 0.24;
      const pushL = Math.max(0, strideL) * 0.42;
      const strikeR = Math.max(0, -strideR) * 0.24;
      const pushR = Math.max(0, strideR) * 0.42;
      t.footPitchL = (pushL - strikeL) * w;
      t.footPitchR = (pushR - strikeR) * w;

      // Contralateral arm drive: elbow bends sharply on FORWARD swing, extends on BACK swing
      const armAmp = 0.42 + 0.40 * spdN;
      const armSwingL = -strideL * armAmp;
      const armSwingR = -strideR * armAmp;
      t.aLRx += armSwingL * w;
      t.aRRx += armSwingR * w;
      t.aLJx = THREE.MathUtils.lerp(t.aLJx, -0.38 - Math.max(0, -armSwingL) * 0.80, w);
      t.aRJx = THREE.MathUtils.lerp(t.aRJx, -0.38 - Math.max(0, -armSwingR) * 0.80, w);
      t.aLRy = Math.max(0, -armSwingL) * 0.20 * w;
      t.aRRy = -Math.max(0, -armSwingR) * 0.20 * w;
      t.aLRz = -0.22 - Math.max(0, armSwingL) * 0.14 * w;
      t.aRRz = 0.22 + Math.max(0, armSwingR) * 0.14 * w;

      // Reflexive head horizon stabilization
      t.hdRx += (-0.12 - t.spRx * 0.62) * w;
      t.hdRy += (-t.chRy * 0.55) * w;
      t.hdRz += -turnBank * 0.45 * w;

      // Hero-Specific Pro Locomotion Signatures
      if (hid === 'spider_man') {
        t.hipY -= 0.10 * w;
        t.spRx += 0.18 * w;
        t.aLJx = THREE.MathUtils.lerp(t.aLJx, -1.12, w * 0.65);
        t.aRJx = THREE.MathUtils.lerp(t.aRJx, -1.12, w * 0.65);
      } else if (hid === 'wolverine' || hid === 'black_panther') {
        t.hipY -= 0.08 * w;
        t.spRx += 0.18 * w;
        t.aLRz -= 0.16 * w;
        t.aRRz += 0.16 * w;
      } else if (hid === 'captain_america') {
        t.aLRx = THREE.MathUtils.lerp(t.aLRx, -0.68, w * 0.65);
        t.aLJx = THREE.MathUtils.lerp(t.aLJx, -0.95, w * 0.65);
      } else if (hid === 'iron_man' && spdN > 0.72) {
        const skim = Math.min(1, (spdN - 0.72) * 2.8) * w;
        t.hipY += 0.14 * skim;
        t.spRx = THREE.MathUtils.lerp(t.spRx, 0.34, skim);
        t.hdRx = THREE.MathUtils.lerp(t.hdRx, -0.36, skim);
        t.aLRx = THREE.MathUtils.lerp(t.aLRx, 0.42, skim); t.aLRz = THREE.MathUtils.lerp(t.aLRz, -0.34, skim);
        t.aRRx = THREE.MathUtils.lerp(t.aRRx, 0.42, skim); t.aRRz = THREE.MathUtils.lerp(t.aRRz, 0.34, skim);
        t.lLRx = THREE.MathUtils.lerp(t.lLRx, 0.18, skim); t.lLJx = THREE.MathUtils.lerp(t.lLJx, 0.24, skim);
        t.lRRx = THREE.MathUtils.lerp(t.lRRx, 0.10, skim); t.lRJx = THREE.MathUtils.lerp(t.lRJx, 0.36, skim);
      } else if ((hid === 'doctor_strange' || hid === 'scarlet_witch') && spdN > 0.68) {
        const glide = Math.min(1, (spdN - 0.68) * 2.4) * w;
        t.hipY += (0.14 + Math.sin(time * 4.5) * 0.04) * glide;
        t.lLRx = THREE.MathUtils.lerp(t.lLRx, 0.24, glide * 0.7);
        t.lRRx = THREE.MathUtils.lerp(t.lRRx, -0.08, glide * 0.7);
        t.lRJx = THREE.MathUtils.lerp(t.lRJx, 0.42, glide * 0.7);
      }
    }

    // 2B. Realistic Water Swimming & Treading-Water Physics Animation
    if (ud.isSwimming && !ud.isFlying && !ud.isSwinging) {
      const sw = Math.sin(ud._animPhase);
      const cw = Math.cos(ud._animPhase);
      if (isMoving) {
        t.hipY = 1.02 + cw * 0.05;
        t.hipRx = 0.96;
        t.hipRz = sw * 0.12;
        t.spRx = 0.22;
        t.chRy = sw * 0.28;
        t.hdRx = -0.94;
        t.aLRx = -1.65 + sw * 1.15; t.aLRz = -0.35 - Math.max(0, sw) * 0.45; t.aLJx = -0.32;
        t.aRRx = -1.65 - sw * 1.15; t.aRRz = 0.35 + Math.max(0, -sw) * 0.45;  t.aRJx = -0.32;
        t.lLRx = sw * 0.55; t.lLJx = Math.max(0, -sw) * 0.55; t.lLRz = -0.09;
        t.lRRx = -sw * 0.55; t.lRJx = Math.max(0, sw) * 0.55; t.lRRz = 0.09;
      } else {
        t.hipY = 0.95 + Math.sin(time * 2.6) * 0.06;
        t.spRx = 0.14;
        t.hdRx = -0.14;
        t.aLRx = -0.75 + Math.sin(time * 3.0) * 0.22; t.aLRz = -0.55 - Math.cos(time * 3.0) * 0.25; t.aLJx = -0.5;
        t.aRRx = -0.75 - Math.sin(time * 3.0) * 0.22; t.aRRz = 0.55 + Math.cos(time * 3.0) * 0.25;  t.aRJx = -0.5;
        t.lLRx = Math.sin(time * 3.4) * 0.42; t.lLJx = 0.52; t.lLRz = -0.11;
        t.lRRx = -Math.sin(time * 3.4) * 0.42; t.lRJx = 0.52; t.lRRz = 0.11;
      }
    }

    // 3. Dynamic Airborne Rise vs Fall Tuck
    if (!isGrounded && !ud.isFlying && !ud.isSwinging && !ud.isSwimming) {
      const vv = ud.vertVel || 0;
      if (vv > 1.5) {
        t.spRx = 0.08;
        t.lLRx = -0.82; t.lLJx = 1.28;
        t.lRRx = 0.24;  t.lRJx = 0.36;
        t.aLRx = -1.25; t.aLRz = -0.45;
        t.aRRx = -0.75; t.aRRz = 0.45;
      } else {
        t.spRx = 0.18;
        t.lLRx = -0.44; t.lLJx = 0.88;
        t.lRRx = 0.16;  t.lRJx = 0.55;
        t.aLRx = -0.55; t.aLRz = -0.58;
        t.aRRx = -0.55; t.aRRz = 0.58;
      }
    }

    // 4. Flight Pose
    if (ud.isFlying) {
      t.spRx = 0.54; t.chRx = 0.22; t.hdRx = -0.56;
      t.hipRz = THREE.MathUtils.clamp((bank || 0) * 0.45, -0.45, 0.45);
      t.aLRx = 0.35; t.aLRz = -0.34;
      t.aRRx = 0.35; t.aRRz = 0.34;
      t.lLRx = 0.26 + Math.sin(time * 6) * 0.07;
      t.lRRx = 0.14 + Math.cos(time * 6) * 0.07;
      t.lRJx = 0.38;
    }

    // 5. Web Swing Acrobatic Pose
    if (ud.isSwinging) {
      t.spRx = 0.26;
      t.aRRx = -2.55; t.aRRz = 0.18; t.aRJx = -0.15;
      t.aLRx = 0.45;  t.aLRz = -0.45;
      t.lLRx = -0.78; t.lLJx = 1.25;
      t.lRRx = 0.25;  t.lRJx = 0.45;
    }

    // 6. Aerodynamic Forward Sprint-Dash (never flips upside-down on unwind)
    if (ud.dashTimer > 0) {
      ud.dashTimer = Math.max(0, ud.dashTimer - dt * 3.6);
      const dArc = Math.sin(ud.dashTimer * Math.PI);
      t.hipY -= 0.14 * dArc;
      t.hipRx = 0.22 * dArc;
      t.spRx = 0.36 * dArc;
      t.chRx = 0.14 * dArc;
      t.hdRx = -0.32 * dArc;
      t.lLRx = -0.72 * dArc; t.lLJx = 1.18 * dArc;
      t.lRRx = 0.58 * dArc;  t.lRJx = 0.36 * dArc;
      t.aLRx = 0.62 * dArc;  t.aLRz = -0.34 * dArc;
      t.aRRx = -0.54 * dArc; t.aRRz = 0.34 * dArc;
    }

    // 7. Expressive 3-Hit Combo Choreography
    if (ud.attackTimer > 0) {
      ud.attackTimer = Math.max(0, ud.attackTimer - dt * 4.4);
      const u = 1 - ud.attackTimer;
      const swing = u < 0.22 ? -Math.sin((u / 0.22) * Math.PI) * 0.35 : Math.sin(((u - 0.22) / 0.78) * Math.PI);
      const step = ud.comboStep || 1;

      if (hid === 'spider_man') {
        if (step === 1) {
          t.chRy = -0.62 * swing; t.aRRx = -1.68 * swing; t.aRRy = -0.28 * swing; t.aRRz = 0.38;
        } else if (step === 2 && w < 0.25) {
          t.hipRy = u * Math.PI * 1.5; t.hipY += 0.22 * Math.max(0, swing);
          t.lRRx = -1.55 * Math.max(0, swing); t.lRRz = 0.44; t.lRJx = 0.22;
          t.aLRz = -0.78; t.aRRz = 0.78;
        } else if (step === 2) {
          t.chRy = 0.72 * swing; t.aLRx = -1.68 * swing; t.aLRy = 0.32 * swing; t.aLRz = -0.38;
        } else {
          if (w < 0.25) t.hipY += 0.26 * Math.max(0, swing);
          t.spRx = THREE.MathUtils.lerp(t.spRx, 0.32 * swing, 1 - w * 0.5);
          t.aLRx = -1.98 * swing; t.aLRz = -0.52 * swing;
          t.aRRx = -1.98 * swing; t.aRRz = 0.52 * swing;
        }
      } else if (hid === 'wolverine' || hid === 'black_panther') {
        if (step === 1) {
          t.chRy = -0.72 * swing; t.aRRx = -1.70 * swing; t.aRRy = -0.5 * swing; t.aRRz = 0.45;
        } else if (step === 2) {
          t.chRy = 0.74 * swing;  t.aLRx = -1.72 * swing; t.aLRy = 0.5 * swing;  t.aLRz = -0.45;
        } else {
          t.hipY += 0.24 * Math.max(0, swing); t.spRx = 0.36 * swing;
          t.aLRx = -1.92 * swing; t.aLRy = -0.42 * swing; t.aLRz = -0.25;
          t.aRRx = -1.92 * swing; t.aRRy = 0.42 * swing;  t.aRRz = 0.25;
        }
      } else if (hid === 'thor' || hid === 'captain_america') {
        if (step === 1) {
          t.chRy = -0.68 * swing; t.aRRx = -1.76 * swing; t.aRRy = -0.35 * swing; t.aRRz = 0.45;
        } else if (step === 2) {
          t.chRy = 0.68 * swing;  t.aLRx = -1.68 * swing; t.aLRy = 0.42 * swing; t.aLRz = -0.35;
        } else {
          t.hipRy = u * Math.PI * 2;
          t.aRRx = -2.18 * Math.max(0, swing); t.aRRz = 0.48;
          t.aLRx = -1.48 * Math.max(0, swing); t.aLRz = -0.55;
        }
      } else {
        if (step === 1) {
          t.chRy = -0.40 * swing; t.aRRx = -1.56 * swing; t.aRJx = -0.10;
        } else if (step === 2) {
          t.chRy = 0.44 * swing;  t.aLRx = -1.58 * swing; t.aLJx = -0.10;
        } else {
          t.chRx = -0.18 * swing;
          t.aLRx = -1.66 * swing; t.aLRz = -0.30 * swing; t.aLJx = -0.08;
          t.aRRx = -1.66 * swing; t.aRRz = 0.30 * swing;  t.aRJx = -0.08;
        }
      }
    }

    // 7B. Unique Per-Power Cast Choreographies (playPowerAnim)
    if (ud.powerAnim && ud.powerAnim.timer > 0) {
      ud.powerAnim.timer = Math.max(0, ud.powerAnim.timer - dt);
      const pa = ud.powerAnim;
      const pN = 1.0 - (pa.timer / Math.max(0.1, pa.duration));
      const arc = pN < 0.22 ? (pN / 0.22) * -0.32 : Math.sin(((pN - 0.22) / 0.78) * Math.PI);
      const pid = pa.id;

      if (pid === 'web_catapult' || pid === 'spin_tornado' || pid === 'cap_bastion') {
        t.hipRy = pN * Math.PI * 4; t.hipY += 0.22 * Math.max(0, arc);
        t.aLRx = -1.55; t.aLRz = -1.05; t.aRRx = -1.55; t.aRRz = 1.05;
      } else if (pid === 'iron_unibeam' || pid === 'iron_bleeding' || pid === 'cap_worthy') {
        t.chRx = -0.24 * Math.max(0, arc);
        t.aLRx = -1.25 * Math.max(0, arc); t.aLRz = -0.82 * Math.max(0, arc);
        t.aRRx = -1.25 * Math.max(0, arc); t.aRRz = 0.82 * Math.max(0, arc);
      } else if (pid === 'thor_stormbreaker' || pid === 'wolv_fissure' || pid === 'panther_spears') {
        t.hipY += (pN < 0.5 ? Math.sin(pN * Math.PI * 2) * 0.45 : 0);
        t.spRx = 0.42 * arc;
        t.aLRx = -2.45 * arc; t.aLRz = -0.25; t.aRRx = -2.45 * arc; t.aRRz = 0.25;
      } else if (pid === 'strange_mirror' || pid === 'strange_ikonn' || pid === 'wanda_crown' || pid === 'wanda_obelisks') {
        t.hipY += 0.28 * Math.sin(pN * Math.PI);
        t.aLRx = -1.55; t.aLRz = -0.65 - Math.cos(pN * 9) * 0.35;
        t.aRRx = -1.55; t.aRRz = 0.65 + Math.cos(pN * 9) * 0.35;
      } else if (pid === 'wolv_roar' || pid === 'cap_rally') {
        t.chRx = -0.35 * Math.sin(pN * Math.PI); t.hdRx = -0.32 * Math.sin(pN * Math.PI);
        t.aLRx = -0.6; t.aLRz = -1.18 * Math.sin(pN * Math.PI);
        t.aRRx = -0.6; t.aRRz = 1.18 * Math.sin(pN * Math.PI);
      } else if (pid === 'reed_wall' || pid === 'reed_cannon' || pid === 'reed_hyper') {
        t.spRx = 0.18 * arc;
        t.aLRx = -1.55 * arc; t.aLRz = -0.55 * arc; t.aLJx = -0.05;
        t.aRRx = -1.55 * arc; t.aRRz = 0.55 * arc;  t.aRJx = -0.05;
      } else {
        t.chRx = -0.18 * arc;
        t.aLRx = -1.65 * arc; t.aLRz = -0.42; t.aRRx = -1.65 * arc; t.aRRz = 0.42;
      }
      if (pa.timer <= 0) ud.powerAnim = null;
    }

    // 8. Special Skills, Elastic Stretch, Channels & Boss Windups
    if (ud.elasticStretch > 0) {
      ud.elasticStretch = Math.max(0, ud.elasticStretch - dt * 3.0);
      const s = Math.sin(ud.elasticStretch * Math.PI);
      p.armR.joint.scale.set(1 + s * 0.45, 1 + s * 2.5, 1 + s * 0.45);
      p.armL.joint.scale.set(1 + s * 0.45, 1 + s * 2.1, 1 + s * 0.45);
      p.armR.tip.scale.setScalar(1 + s * 1.55);
      p.armL.tip.scale.setScalar(1 + s * 1.55);
    } else {
      p.armL.joint.scale.set(1, 1, 1); p.armR.joint.scale.set(1, 1, 1);
      p.armL.tip.scale.set(1, 1, 1);   p.armR.tip.scale.set(1, 1, 1);
    }

    if (ud.skillTimer > 0) {
      ud.skillTimer = Math.max(0, ud.skillTimer - dt * 2.4);
      const sk = Math.sin(ud.skillTimer * Math.PI);
      t.aLRx = -2.0 * sk; t.aLRz = -0.60 * sk;
      t.aRRx = -2.0 * sk; t.aRRz = 0.60 * sk;
      t.chRx = -0.15 * sk;
    }

    if (ud.channelType === 'unibeam') {
      t.chRx = -0.18; t.aLRx = -0.4; t.aLRz = -0.75; t.aRRx = -1.45; t.aRRz = 0.25;
    } else if (ud.channelType === 'whirlwind' || ud.channelType === 'berserker_drill') {
      t.hipRy = (time * 18) % (Math.PI * 2);
      t.aLRx = -1.45; t.aLRz = -1.15; t.aRRx = -1.45; t.aRRz = 1.15;
    } else if (ud.channelType === 'bifrost_ult' || ud.channelType === 'wanda_ult') {
      t.hipY += 0.35 + Math.sin(time * 5) * 0.1;
      t.aLRx = -2.5; t.aLRz = -0.45; t.aRRx = -2.5; t.aRRz = 0.45;
    }

    if (ud.bossIntroTimer > 0) {
      ud.bossIntroTimer = Math.max(0, ud.bossIntroTimer - dt * 0.5);
      t.chRx = -0.24; t.hdRx = -0.2;
      t.aLRx = -2.45; t.aLRz = -0.55; t.aRRx = -2.45; t.aRRz = 0.55;
    } else if (ud.staggered) {
      t.spRx = 0.42; t.hdRx = 0.35;
      t.aLRx = 0.3; t.aLRz = -0.35; t.aRRx = 0.3; t.aRRz = 0.35;
      t.lLJx = 0.35; t.lRJx = 0.35;
    } else if (ud.windupType === 'slam' || ud.windupType === 'execution') {
      t.chRx = -0.28; t.aLRx = -2.6; t.aLRz = -0.35; t.aRRx = -2.6; t.aRRz = 0.35;
    } else if (ud.windupType === 'sweep') {
      t.chRy = -0.75; t.aRRx = -1.2; t.aRRy = -0.6; t.aRRz = 1.1;
    } else if (ud.windupType === 'cast') {
      t.aLRx = -1.45; t.aLRz = -0.25; t.aRRx = -1.45; t.aRRz = 0.25;
    } else if (ud.windupType === 'lunge') {
      t.spRx = 0.32; t.aRRx = -1.8; t.aRRz = 0.2;
    }

    // Critically damped persistent pose interpolation with shortest-angle wrap on hipRy
    if (!ud._rigPose) ud._rigPose = Object.assign({}, t);
    const rp = ud._rigPose;
    const isActiveAction = ud.attackTimer > 0 || ud.skillTimer > 0 || ud.powerAnim || ud.dashTimer > 0 || ud.windupType;
    const damp = 1 - Math.exp(-(isActiveAction ? 26 : (isMoving || ud.isSwimming ? 16 : 10)) * dt);
    for (const k in t) {
      if (k === 'hipRy') {
        let diff = t[k] - rp[k];
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        rp[k] += diff * damp;
      } else {
        rp[k] += (t[k] - rp[k]) * damp;
      }
    }

    p.hips.position.set(rp.hipX || 0, rp.hipY, 0);
    p.hips.rotation.set(rp.hipRx, rp.hipRy, rp.hipRz);
    p.spine.rotation.set(rp.spRx, rp.spRy, rp.spRz || 0);
    p.chest.rotation.set(rp.chRx, rp.chRy, rp.chRz);
    p.head.rotation.set(rp.hdRx, rp.hdRy, rp.hdRz);

    p.armL.root.rotation.set(rp.aLRx, rp.aLRy, rp.aLRz);
    p.armL.joint.rotation.set(rp.aLJx, 0, 0);
    p.armR.root.rotation.set(rp.aRRx, rp.aRRy, rp.aRRz);
    p.armR.joint.rotation.set(rp.aRJx, 0, 0);

    p.legL.root.rotation.set(rp.lLRx, 0, rp.lLRz);
    p.legL.joint.rotation.set(rp.lLJx, 0, 0);
    p.legL.tip.rotation.set((rp.footPitchL || 0) - (rp.lLRx + rp.lLJx) * (isGrounded && !ud.isSwimming ? 0.85 : 0.2), 0, 0);

    p.legR.root.rotation.set(rp.lRRx, 0, rp.lRRz);
    p.legR.joint.rotation.set(rp.lRJx, 0, 0);
    p.legR.tip.rotation.set((rp.footPitchR || 0) - (rp.lRRx + rp.lRJx) * (isGrounded && !ud.isSwimming ? 0.85 : 0.2), 0, 0);

    if (ud.waldoes && ud.waldoes.length) {
      const atkBoost = ud.attackTimer > 0 ? 0.62 : 0;
      ud.waldoes.forEach((wItem, idx) => {
        wItem.root.rotation.z = wItem.baseRz + Math.sin(time * 3.5 + idx * 1.4) * 0.14;
        wItem.root.rotation.x = wItem.baseRx - atkBoost + Math.cos(time * 2.8 + idx) * 0.10;
        wItem.elbow.rotation.x = atkBoost * 0.72 + Math.sin(time * 4.2 + idx) * 0.12;
      });
    }
    if (ud.mandalas && ud.mandalas.length) {
      ud.mandalas.forEach((m, i) => {
        m.rotation.z += dt * (i % 2 === 0 ? 3.2 : -3.2);
        m.scale.setScalar((ud.attackTimer > 0 || ud.skillTimer > 0) ? 1.35 : 0.85);
      });
    }
  }
}

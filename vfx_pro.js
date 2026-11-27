// ============================================================================
// AVENGERS: DOOMSDAY — VFX PRO: GPU SHADERS REAIS POR PODER
// Feixes FBM, relâmpagos ramificados, trails de lâmina, ondas de impacto,
// partículas multi-emissora com física real, portais e distorção de heatwave.
// ============================================================================
'use strict';

const VFXPro = (() => {

// ----- CANVAS TEXTURE HELPERS -----
function radTex(r, g, b, inner = 1, outer = 0) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, `rgba(${r},${g},${b},${inner})`);
  grd.addColorStop(0.3, `rgba(${r},${g},${b},${inner * 0.6})`);
  grd.addColorStop(1, `rgba(${r},${g},${b},${outer})`);
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}

function ringTex(r, g, b) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const grd = ctx.createRadialGradient(128, 128, 68, 128, 128, 128);
  grd.addColorStop(0,    `rgba(${r},${g},${b},0)`);
  grd.addColorStop(0.72, `rgba(${r},${g},${b},1)`);
  grd.addColorStop(0.88, `rgba(${r},${g},${b},0.8)`);
  grd.addColorStop(1,    `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}

// ----- SHADER MATERIAL BUILDERS -----

// Feixe de plasma FBM (Fractal Brownian Motion — turbulência procedural no shader)
function beamMat(color) {
  const hex = new THREE.Color(color);
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: hex },
      uAlpha: { value: 1.0 },
      uWidth: { value: 0.08 }
    },
    transparent: true, depthWrite: false,
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

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
        return v;
      }

      void main() {
        vec2 uv = vUv - 0.5;
        // Distorção turbulenta
        float dist = fbm(vec2(vUv.y * 4.0 + uTime * 2.5, uTime * 1.1)) * 0.18;
        float edge = abs(uv.x + dist) / 0.5;
        // Núcleo quente branco → cor
        float core = exp(-edge * edge * 22.0);
        float glow = exp(-edge * edge * 5.5);
        // Flicker
        float flicker = 0.88 + 0.12 * sin(uTime * 18.0 + vUv.y * 12.0);
        vec3 col = uColor * glow * 2.0 + vec3(1.0) * core * 1.4;
        float alpha = clamp((core * 1.2 + glow * 0.6) * flicker * uAlpha, 0.0, 1.0);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
}

// Relâmpago ramificado GLSL
function lightningMat(color) {
  const hex = new THREE.Color(color);
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: hex },
      uAlpha: { value: 1.0 }
    },
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uAlpha;
      varying vec2 vUv;

      float hash(float n) { return fract(sin(n) * 43758.5453); }

      float lightning(vec2 uv, float seed) {
        float y = uv.y;
        float offset = 0.0;
        float amp = 0.12;
        for (int i = 0; i < 7; i++) {
          offset += (hash(seed + float(i) * 3.7 + floor(uTime * 24.0 + y * float(i))) - 0.5) * amp;
          amp *= 0.5;
        }
        float dist = abs(uv.x - 0.5 - offset);
        return exp(-dist * dist * 480.0);
      }

      void main() {
        float l = lightning(vUv, 1.0);
        float l2 = lightning(vUv * vec2(0.5, 1.0) + vec2(0.25, 0.0), 7.3) * 0.5;
        float l3 = lightning(vUv * vec2(0.3, 0.6) + vec2(0.35, 0.3), 13.1) * 0.3;
        float total = l + l2 + l3;
        vec3 col = uColor * total * 2.0 + vec3(0.9, 0.95, 1.0) * total * 1.2;
        float alpha = clamp(total * uAlpha, 0.0, 1.0);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
}

// Portal/vórtice de magia caótica (Feiticeira Escarlate / Dr. Estranho)
function portalMat(color1, color2) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
      uAlpha: { value: 1.0 },
      uRadius: { value: 1.0 }
    },
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor1, uColor2;
      uniform float uAlpha, uRadius;
      varying vec2 vUv;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
      }

      void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        float r = length(uv);
        float angle = atan(uv.y, uv.x);

        // Espiral de vórtice
        float spiral = sin(angle * 5.0 - uTime * 3.5 + r * 8.0) * 0.5 + 0.5;
        // Noise radial
        float n = noise(uv * 3.0 + uTime * 0.6) * 0.5 + 0.5;
        // Borda do portal
        float rim = exp(-abs(r - uRadius * 0.85) * 12.0);
        float inner = exp(-r * r * 2.5);
        float glow = spiral * n * rim * 2.0 + inner * 0.6;

        vec3 col = mix(uColor1, uColor2, spiral * n) * glow;
        float alpha = clamp(glow * uAlpha * (1.0 - smoothstep(uRadius * 0.9, uRadius, r)), 0.0, 1.0);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
}

// Trail de lâmina/garra (additive streak)
function trailMat(color) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uAlpha: { value: 1.0 }
    },
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: `
      attribute float aProgress;
      varying float vProg;
      varying vec2 vUv;
      void main() {
        vProg = aProgress;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uAlpha;
      varying float vProg;
      varying vec2 vUv;
      void main() {
        float edge = abs(vUv.x - 0.5) * 2.0;
        float fade = (1.0 - vUv.y) * (1.0 - vProg);
        float core = exp(-edge * edge * 8.0);
        float glow = exp(-edge * edge * 2.5);
        vec3 col = uColor * glow * 2.5 + vec3(1.0) * core * 1.2;
        float alpha = clamp((core + glow * 0.5) * fade * uAlpha, 0.0, 1.0);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
}

// Onda de impacto (shockwave ring)
function shockwaveMat(color) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uAlpha: { value: 1.0 },
      uExpand: { value: 0.0 }
    },
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uAlpha, uExpand;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        float r = length(uv);
        float ring = exp(-abs(r - uExpand) * abs(r - uExpand) * 32.0);
        vec3 col = uColor * ring * 3.5 + vec3(1.0) * ring * 1.5;
        float alpha = clamp(ring * uAlpha * (1.0 - uExpand), 0.0, 1.0);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
}

// ----- PARTICLE SYSTEM PRO -----
class ParticleSystemPro {
  constructor(scene, maxN = 8000) {
    this.scene = scene;
    this.N = maxN;
    this.pos = new Float32Array(maxN * 3);
    this.vel = new Float32Array(maxN * 3);
    this.col = new Float32Array(maxN * 3);
    this.sz  = new Float32Array(maxN);
    this.life = new Float32Array(maxN);
    this.maxLife = new Float32Array(maxN);
    this.gravity = new Float32Array(maxN);
    this.cursor = 0;
    this.activeEmitters = [];

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aColor',   new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(this.sz, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uPR: { value: Math.min(window.devicePixelRatio || 1, 2) } },
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        uniform float uPR;
        varying vec3 vCol;
        void main() {
          vCol = aColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(aSize * uPR * (280.0 / max(-mv.z, 0.5)), 1.5, 128.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vCol;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float r2 = dot(c, c) * 4.0;
          if (r2 > 1.0) discard;
          float soft = exp(-r2 * 3.2);
          float core = exp(-r2 * 12.0);
          vec3 col = vCol * soft * 1.6 + vec3(1.0) * core * 0.9;
          gl_FragColor = vec4(col, clamp((soft + core * 0.5), 0.0, 1.0));
        }
      `
    });

    this.geo = geo;
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  _spawn(x, y, z, vx, vy, vz, r, g, b, size, life, grav = -4.5) {
    const i = this.cursor;
    this.pos[i*3]=x; this.pos[i*3+1]=y; this.pos[i*3+2]=z;
    this.vel[i*3]=vx; this.vel[i*3+1]=vy; this.vel[i*3+2]=vz;
    this.col[i*3]=r; this.col[i*3+1]=g; this.col[i*3+2]=b;
    this.sz[i] = size;
    this.life[i] = life;
    this.maxLife[i] = life;
    this.gravity[i] = grav;
    this.cursor = (this.cursor + 1) % this.N;
  }

  burst(x, y, z, color, count, speed, size, life, spread = 1, grav = -4.5) {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.random() * Math.PI * spread;
      const sp = speed * (0.5 + Math.random() * 0.5);
      this._spawn(x, y, z,
        Math.sin(ph) * Math.cos(th) * sp,
        Math.cos(ph) * sp * (0.5 + Math.random()),
        Math.sin(ph) * Math.sin(th) * sp,
        c.r, c.g, c.b, size * (0.5 + Math.random()), life * (0.6 + Math.random() * 0.4), grav);
    }
  }

  // Emissão em cone para poderes direcionais
  cone(x, y, z, dirX, dirY, dirZ, color, count, speed, size, life, spread = 0.3) {
    const c = new THREE.Color(color);
    const dir = new THREE.Vector3(dirX, dirY, dirZ).normalize();
    const up = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0,1,0) : new THREE.Vector3(1,0,0);
    const right = new THREE.Vector3().crossVectors(dir, up).normalize();
    const upDir = new THREE.Vector3().crossVectors(right, dir).normalize();
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r2 = Math.random() * spread;
      const sp = speed * (0.6 + Math.random() * 0.4);
      const vx = dir.x * sp + (right.x * Math.cos(ang) + upDir.x * Math.sin(ang)) * r2 * sp;
      const vy = dir.y * sp + (right.y * Math.cos(ang) + upDir.y * Math.sin(ang)) * r2 * sp;
      const vz = dir.z * sp + (right.z * Math.cos(ang) + upDir.z * Math.sin(ang)) * r2 * sp;
      this._spawn(x, y, z, vx, vy, vz, c.r, c.g, c.b, size, life, 0);
    }
  }

  // Anel de partículas (ondas de impacto)
  ring(x, y, z, color, count, radius, upSpeed, size, life) {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const sp = radius * (3.5 + Math.random());
      this._spawn(x, y, z,
        Math.cos(ang) * sp, upSpeed + Math.random() * 1.5, Math.sin(ang) * sp,
        c.r, c.g, c.b, size, life, -1.5);
    }
  }

  // Espiral ascendente (Bifrost / magia)
  spiral(x, y, z, color, count, height, size, life) {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const ang = t * Math.PI * 8;
      const rad = 0.4 + t * 0.6;
      this._spawn(
        x + Math.cos(ang) * rad, y, z + Math.sin(ang) * rad,
        Math.cos(ang + Math.PI / 2) * 1.5, height * (0.5 + t), Math.sin(ang + Math.PI / 2) * 1.5,
        c.r, c.g, c.b, size * (1.2 - t * 0.5), life * (0.5 + t * 0.5), 0
      );
    }
  }

  update(dt) {
    const dtSq = dt * dt;
    for (let i = 0; i < this.N; i++) {
      if (this.life[i] <= 0) {
        // Mover partícula morta para fora do frustum
        this.pos[i*3+1] = -9999;
        continue;
      }
      this.life[i] -= dt;
      const t = this.life[i] / this.maxLife[i];

      this.vel[i*3+1] += this.gravity[i] * dtSq * 60;
      this.pos[i*3]   += this.vel[i*3]   * dt;
      this.pos[i*3+1] += this.vel[i*3+1] * dt;
      this.pos[i*3+2] += this.vel[i*3+2] * dt;

      // Fade out por vida + tamanho encolhe no fim
      this.sz[i] = this.maxLife[i] > 0
        ? (this.sz[i] || 1) * (0.85 + t * 0.15)
        : 0;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aColor.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
  }
}

// ----- BLADE TRAIL (Rastro de lâmina) -----
class BladeTrail {
  constructor(scene, color, maxPoints = 32, width = 0.08) {
    this.scene = scene;
    this.maxPoints = maxPoints;
    this.width = width;
    this.points = [];
    this.times = [];

    const N = maxPoints;
    this.geo = new THREE.BufferGeometry();
    const verts = new Float32Array(N * 2 * 3);
    const uvs   = new Float32Array(N * 2 * 2);
    const prog  = new Float32Array(N * 2);
    const idx   = [];
    for (let i = 0; i < N - 1; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, b, c, b, d, c);
    }
    this.geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    this.geo.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
    this.geo.setAttribute('aProgress',new THREE.BufferAttribute(prog, 1));
    this.geo.setIndex(idx);

    this.mat = trailMat(color);
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.visible = false;
    this.mesh.visible = false;
  }

  addPoint(pos, time) {
    this.points.push(pos.clone());
    this.times.push(time);
    if (this.points.length > this.maxPoints) {
      this.points.shift();
      this.times.shift();
    }
  }

  update(currentTime, fadeTime = 0.35) {
    // Remove pontos velhos
    while (this.times.length > 0 && currentTime - this.times[0] > fadeTime) {
      this.points.shift();
      this.times.shift();
    }

    if (this.points.length < 2) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;

    const pos = this.geo.attributes.position.array;
    const uvs = this.geo.attributes.uv.array;
    const prog = this.geo.attributes.aProgress.array;
    const N = this.points.length;
    const up = new THREE.Vector3(0, 1, 0);
    const fwd = new THREE.Vector3();

    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const idx = i * 6;
      const uidx = i * 4;
      const pidx = i * 2;

      if (i < N - 1) {
        fwd.subVectors(this.points[i + 1], this.points[i]).normalize();
      }
      const side = new THREE.Vector3().crossVectors(fwd, up).normalize();
      const w = this.width * (0.3 + t * 0.7);

      pos[idx]   = this.points[i].x + side.x * w;
      pos[idx+1] = this.points[i].y + side.y * w;
      pos[idx+2] = this.points[i].z + side.z * w;
      pos[idx+3] = this.points[i].x - side.x * w;
      pos[idx+4] = this.points[i].y - side.y * w;
      pos[idx+5] = this.points[i].z - side.z * w;

      uvs[uidx] = 0; uvs[uidx+1] = t;
      uvs[uidx+2] = 1; uvs[uidx+3] = t;
      prog[pidx] = prog[pidx+1] = 1 - t;
    }

    // Preencher resto com zero
    for (let i = N; i < this.maxPoints; i++) {
      const idx = i * 6;
      pos[idx]=pos[idx+1]=pos[idx+2]=pos[idx+3]=pos[idx+4]=pos[idx+5]=0;
    }

    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.uv.needsUpdate = true;
    this.geo.attributes.aProgress.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.geo.dispose();
    this.mat.dispose();
  }
}

// ----- VFX LIBRARY POR HERÓI -----
// Cada poder tem um objeto VFX específico e visualmente distinto.

class HeroVFX {
  constructor(scene, particles) {
    this.scene = scene;
    this.P = particles;
    this.activeEffects = [];
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const e = this.activeEffects[i];
      e.life -= dt;
      if (e.update) e.update(dt, this.time);
      if (e.life <= 0) {
        if (e.dispose) e.dispose();
        this.activeEffects.splice(i, 1);
      }
    }
  }

  _addEffect(e) { this.activeEffects.push(e); return e; }

  // ---- HOMEM-ARANHA ----
  spiderWebShot(from, to) {
    // Linha de teia (corda fina) + partículas de impacto
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    const geo = new THREE.TubeGeometry(
      new THREE.LineCurve3(from, to), 12, 0.012, 5, false
    );
    const mat = new THREE.MeshStandardMaterial({ color: 0xd1fae5, transparent: true, opacity: 0.85 });
    const tube = new THREE.Mesh(geo, mat);
    this.scene.add(tube);
    this.P.burst(to.x, to.y, to.z, '#d1fae5', 24, 3.5, 0.6, 0.45);
    this._addEffect({
      life: 1.2,
      update: (dt, t) => { mat.opacity = Math.max(0, mat.opacity - dt * 0.9); },
      dispose: () => { this.scene.remove(tube); geo.dispose(); mat.dispose(); }
    });
  }

  spiderImpact(pos) {
    // Anel de impacto sísmico vermelho + burst branco
    this.P.ring(pos.x, pos.y + 0.1, pos.z, '#ef4444', 40, 0.8, 2.5, 0.8, 0.6);
    this.P.ring(pos.x, pos.y + 0.1, pos.z, '#ffffff', 20, 0.5, 4.0, 0.5, 0.35);
    this.P.burst(pos.x, pos.y + 0.3, pos.z, '#ffd700', 18, 4.0, 0.7, 0.5);

    // Shockwave ring plane
    const geo = new THREE.PlaneGeometry(5, 5);
    const mat = shockwaveMat('#ef4444');
    mat.uniforms.uExpand.value = 0;
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    this.scene.add(ring);
    this._addEffect({
      life: 0.6,
      update: (dt) => { mat.uniforms.uExpand.value += dt * 1.6; mat.uniforms.uAlpha.value -= dt * 1.5; mat.uniforms.uTime.value += dt; },
      dispose: () => { this.scene.remove(ring); geo.dispose(); mat.dispose(); }
    });
  }

  // ---- THOR ----
  thorLightningStrike(from, to, color = '#93c5fd') {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    const geo = new THREE.PlaneGeometry(0.3, len, 1, 24);
    const mat = lightningMat(color);
    const bolt = new THREE.Mesh(geo, mat);
    bolt.position.lerpVectors(from, to, 0.5);
    bolt.lookAt(to);
    bolt.rotateX(Math.PI / 2);
    this.scene.add(bolt);

    // Burst de raio no impacto
    this.P.burst(to.x, to.y, to.z, color, 32, 5.0, 0.8, 0.5);
    this.P.ring(to.x, to.y, to.z, '#ffffff', 24, 0.6, 2.0, 0.6, 0.4);

    this._addEffect({
      life: 0.5,
      update: (dt) => { mat.uniforms.uTime.value += dt; mat.uniforms.uAlpha.value -= dt * 1.8; },
      dispose: () => { this.scene.remove(bolt); geo.dispose(); mat.dispose(); }
    });
  }

  thorBifrostColumn(pos) {
    // Coluna vertical de partículas arco-íris + feixes FBM
    const colors = ['#38bdf8','#818cf8','#c084fc','#f472b6','#fbbf24'];
    colors.forEach((c, i) => {
      const delay = i * 0.08;
      setTimeout(() => {
        this.P.spiral(pos.x, pos.y, pos.z, c, 60, 8, 0.9, 1.2);
        this.P.cone(pos.x, pos.y, pos.z, 0, 1, 0, c, 20, 7, 0.7, 0.9, 0.5);
      }, delay * 1000);
    });

    // Feixe central
    const beamGeo = new THREE.PlaneGeometry(0.6, 12, 1, 20);
    const bmat = beamMat('#93c5fd');
    const beamMesh = new THREE.Mesh(beamGeo, bmat);
    beamMesh.position.set(pos.x, pos.y + 6, pos.z);
    this.scene.add(beamMesh);
    this._addEffect({
      life: 1.5,
      update: (dt, t) => { bmat.uniforms.uTime.value += dt; bmat.uniforms.uAlpha.value = Math.max(0, 1 - (1.5 - this.activeEffects[0]?.life || 0) / 1.5 * 0.6); },
      dispose: () => { this.scene.remove(beamMesh); beamGeo.dispose(); bmat.dispose(); }
    });
  }

  // ---- IRON MAN ----
  repulsorBlast(from, dir) {
    // Feixe de plasma azul-dourado
    const geo = new THREE.PlaneGeometry(0.4, 12, 1, 20);
    const mat = beamMat('#38bdf8');
    const beam = new THREE.Mesh(geo, mat);
    const target = new THREE.Vector3().copy(from).addScaledVector(dir, 6);
    beam.position.lerpVectors(from, target, 0.5);
    beam.lookAt(target);
    beam.rotateX(Math.PI / 2);
    this.scene.add(beam);

    this.P.cone(from.x, from.y, from.z, dir.x, dir.y, dir.z, '#38bdf8', 30, 8, 0.7, 0.4, 0.2);
    this.P.cone(from.x, from.y, from.z, dir.x, dir.y, dir.z, '#fbbf24', 15, 5, 0.5, 0.3, 0.1);

    this._addEffect({
      life: 0.4,
      update: (dt) => { mat.uniforms.uTime.value += dt; mat.uniforms.uAlpha.value -= dt * 2.2; },
      dispose: () => { this.scene.remove(beam); geo.dispose(); mat.dispose(); }
    });
  }

  unibeam(from, dir, duration = 2.4) {
    // Feixe contínuo largo de Unibeam
    const geo = new THREE.PlaneGeometry(0.9, 18, 1, 24);
    const mat = beamMat('#fbbf24');
    mat.uniforms.uWidth.value = 0.15;
    const target = new THREE.Vector3().copy(from).addScaledVector(dir, 9);
    const beam = new THREE.Mesh(geo, mat);
    beam.position.lerpVectors(from, target, 0.5);
    beam.lookAt(target);
    beam.rotateX(Math.PI / 2);
    this.scene.add(beam);

    // Partículas contínuas (gerenciadas pelo update)
    let elapsed = 0;
    this._addEffect({
      life: duration,
      update: (dt, t) => {
        mat.uniforms.uTime.value += dt;
        elapsed += dt;
        if (elapsed % 0.07 < dt) {
          this.P.cone(from.x, from.y, from.z, dir.x, dir.y, dir.z, '#fbbf24', 8, 10, 0.6, 0.25, 0.15);
          this.P.cone(from.x, from.y, from.z, dir.x, dir.y, dir.z, '#ffffff', 4, 8, 0.4, 0.2, 0.08);
        }
        // Fade in/out
        if (elapsed < 0.15) mat.uniforms.uAlpha.value = elapsed / 0.15;
        else if (elapsed > duration - 0.25) mat.uniforms.uAlpha.value = (duration - elapsed) / 0.25;
      },
      dispose: () => { this.scene.remove(beam); geo.dispose(); mat.dispose(); }
    });
  }

  // ---- WANDA ----
  chaosOrb(pos, color = '#e11d48') {
    // Orbe flutuante de magia caótica
    const geo = new THREE.SphereGeometry(0.22, 18, 14);
    const mat = portalMat(color, '#7c3aed');
    mat.uniforms.uRadius.value = 0.95;
    const orb = new THREE.Mesh(geo, mat);
    orb.position.copy(pos);
    this.scene.add(orb);
    this.P.ring(pos.x, pos.y, pos.z, color, 28, 0.4, 2.0, 0.6, 0.6);
    this._addEffect({
      life: 1.0,
      update: (dt, t) => {
        mat.uniforms.uTime.value += dt;
        orb.rotation.y += dt * 2.5;
        orb.rotation.z += dt * 1.3;
        const remaining = this.activeEffects.find(e => e.mesh === orb)?.life || 1;
        mat.uniforms.uAlpha.value = Math.min(1, remaining * 1.5);
      },
      dispose: () => { this.scene.remove(orb); geo.dispose(); mat.dispose(); }
    });
  }

  hexSingularity(pos) {
    // Portal singularidade Chthoniana (vórtice gigante)
    const geo = new THREE.PlaneGeometry(8, 8, 1, 1);
    const mat = portalMat('#e11d48', '#000000');
    mat.uniforms.uRadius.value = 1.0;
    const portal = new THREE.Mesh(geo, mat);
    portal.position.copy(pos);
    this.scene.add(portal);

    this.P.spiral(pos.x, pos.y, pos.z, '#e11d48', 80, 4, 1.0, 1.5);
    this.P.ring(pos.x, pos.y, pos.z, '#7c3aed', 50, 2.0, 0, 1.2, 1.5);
    this.P.ring(pos.x, pos.y, pos.z, '#ffffff', 30, 1.0, 1.0, 0.8, 1.0);

    let t = 0;
    this._addEffect({
      life: 2.0,
      update: (dt) => {
        t += dt;
        mat.uniforms.uTime.value += dt;
        portal.rotation.z += dt * 2.8;
        mat.uniforms.uAlpha.value = t < 0.4 ? t / 0.4 : Math.max(0, 1 - (t - 1.6) / 0.4);
      },
      dispose: () => { this.scene.remove(portal); geo.dispose(); mat.dispose(); }
    });
  }

  // ---- WOLVERINE ----
  clawSlash(pos, dir, color = '#c0c0c0') {
    // X de luz prateada (3 linhas de garra)
    const slashes = [];
    for (let cl = -1; cl <= 1; cl++) {
      const offset = new THREE.Vector3(cl * 0.12, 0, 0);
      const from = new THREE.Vector3().copy(pos).add(offset);
      const to = new THREE.Vector3().copy(from).addScaledVector(dir, 0.9 + Math.abs(cl) * 0.1);

      const geo = new THREE.PlaneGeometry(0.045, 1.0, 1, 10);
      const mat = trailMat(color);
      const slash = new THREE.Mesh(geo, mat);
      slash.position.lerpVectors(from, to, 0.5);
      slash.lookAt(to);
      slash.rotateX(Math.PI / 2);
      this.scene.add(slash);
      slashes.push({ slash, mat, geo });
    }

    this.P.burst(pos.x, pos.y, pos.z, '#c0c0c0', 20, 4, 0.5, 0.3);
    this.P.burst(pos.x, pos.y, pos.z, '#ffffff', 10, 6, 0.4, 0.25);

    this._addEffect({
      life: 0.4,
      update: (dt) => { slashes.forEach(s => { s.mat.uniforms.uAlpha.value -= dt * 2.2; }); },
      dispose: () => { slashes.forEach(s => { this.scene.remove(s.slash); s.geo.dispose(); s.mat.dispose(); }); }
    });
  }

  berserkerAura(pos, radius = 1.4) {
    // Aura de raiva amarela/laranja pulsante
    this.P.ring(pos.x, pos.y + 0.2, pos.z, '#eab308', 50, radius * 0.8, 2.5, 0.9, 0.7);
    this.P.ring(pos.x, pos.y + 0.2, pos.z, '#dc2626', 30, radius * 0.5, 4, 0.7, 0.6);
    this.P.burst(pos.x, pos.y + 0.8, pos.z, '#fbbf24', 20, 2.5, 0.8, 0.8, 0.6, 0);
  }

  // ---- GENERAL ----
  // Hitstop + impact burst
  impactBurst(pos, color, size = 'medium') {
    const cfg = {
      small:  { n: 20, sp: 3, sz: 0.5, lf: 0.35 },
      medium: { n: 40, sp: 5, sz: 0.75, lf: 0.5 },
      large:  { n: 70, sp: 8, sz: 1.0, lf: 0.7 }
    }[size] || { n: 40, sp: 5, sz: 0.75, lf: 0.5 };

    this.P.burst(pos.x, pos.y, pos.z, color, cfg.n, cfg.sp, cfg.sz, cfg.lf);
    this.P.burst(pos.x, pos.y, pos.z, '#ffffff', Math.floor(cfg.n * 0.4), cfg.sp * 0.6, cfg.sz * 0.6, cfg.lf * 0.6);
    this.P.ring(pos.x, pos.y + 0.05, pos.z, color, 24, 0.3, 1.5, 0.6, 0.35);
  }

  // Anel de postura (boss stagger)
  staggerRing(pos) {
    this.P.ring(pos.x, pos.y + 1.0, pos.z, '#fbbf24', 60, 1.5, 0, 1.2, 0.8);
    this.P.ring(pos.x, pos.y + 0.5, pos.z, '#ffffff', 40, 1.0, 0, 0.8, 0.6);
    this.P.burst(pos.x, pos.y + 1.5, pos.z, '#fbbf24', 30, 3, 0.8, 0.7, 0.3, 0);
  }

  // Partículas de cura/regeneração
  healParticles(pos, color = '#22c55e') {
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const r = 0.3 + Math.random() * 0.4;
      this.P._spawn(
        pos.x + Math.cos(ang) * r, pos.y, pos.z + Math.sin(ang) * r,
        0, 2.5 + Math.random() * 1.5, 0,
        0.133, 0.773, 0.368, // green
        0.4 + Math.random() * 0.3, 0.8 + Math.random() * 0.4, 0
      );
    }
  }
}

// ----- UPDATE GLOBAL -----
// Atualiza uniforms de tempo em todos os materiais ativos
class VFXProSystem {
  constructor(scene) {
    this.particles = new ParticleSystemPro(scene, 8000);
    this.heroVFX = new HeroVFX(scene, this.particles);
    this.shaderMats = [];
    this.trails = [];
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    this.particles.update(dt);
    this.heroVFX.update(dt);
    this.shaderMats.forEach(m => { if (m.uniforms?.uTime) m.uniforms.uTime.value = this.time; });
    this.trails.forEach(t => t.update(this.time));
  }

  registerMat(mat) { this.shaderMats.push(mat); return mat; }
  registerTrail(trail) { this.trails.push(trail); return trail; }
  createTrail(scene, color, points = 32, width = 0.08) {
    const t = new BladeTrail(scene, color, points, width);
    this.trails.push(t);
    return t;
  }

  // Conveniências
  get vfx() { return this.heroVFX; }
  get p() { return this.particles; }
}

// Factories exportadas
return {
  VFXProSystem,
  ParticleSystemPro,
  BladeTrail,
  HeroVFX,
  beamMat,
  lightningMat,
  portalMat,
  trailMat,
  shockwaveMat,
};

})(); // end IIFE

window.VFXPro = VFXPro;
console.log('[VFXPro] Professional GPU VFX system loaded. Tools: beams, lightning, portals, trails, shockwaves, particles.');

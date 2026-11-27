// ============================================================================
// AVENGERS: DOOMSDAY — REAL GLSL & GPU PARTICLE VFX ENGINE (ZERO FAKE SOLIDS)
// ============================================================================

class VFXEngine {
  constructor(scene) {
    this.scene = scene;
    this.maxParticles = 3600;
    this.activeBeams = [];
    this.activeZones = [];
    this.weaponTrails = [];

    this._initGPUParticlePool();
  }

  // --------------------------------------------------------------------------
  // 1. GPU ADDITIVE PARTICLE POOL (3600 PARTICLES IN 1 DRAW CALL)
  // --------------------------------------------------------------------------
  _initGPUParticlePool() {
    const N = this.maxParticles;
    this.pPos = new Float32Array(N * 3);
    this.pVel = new Float32Array(N * 3);
    this.pCol = new Float32Array(N * 3);
    this.pSize = new Float32Array(N);
    this.pAlpha = new Float32Array(N);
    this.pLife = new Float32Array(N);
    this.pMaxLife = new Float32Array(N);
    this.pGravity = new Float32Array(N);
    this.pCursor = 0;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.pCol, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.pSize, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.pAlpha, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aAlpha;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(aSize * uPixelRatio * (260.0 / max(-mv.z, 0.8)), 1.0, 96.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float r2 = dot(c, c) * 4.0;
          if (r2 > 1.0) discard;
          float halo = exp(-r2 * 3.4);
          float hotCore = exp(-r2 * 10.5);
          vec3 col = vColor * halo * 1.45 + vec3(1.0) * hotCore * 0.95;
          gl_FragColor = vec4(col, clamp(halo * vAlpha, 0.0, 1.0));
        }
      `
    });

    this.particleGeo = geo;
    this.particlePoints = new THREE.Points(geo, mat);
    this.particlePoints.frustumCulled = false;
    this.scene.add(this.particlePoints);
  }

  _spawnParticle(x, y, z, vx, vy, vz, r, g, b, size, life, gravity) {
    const i = this.pCursor;
    this.pCursor = (this.pCursor + 1) % this.maxParticles;
    const i3 = i * 3;
    this.pPos[i3] = x; this.pPos[i3 + 1] = y; this.pPos[i3 + 2] = z;
    this.pVel[i3] = vx; this.pVel[i3 + 1] = vy; this.pVel[i3 + 2] = vz;
    this.pCol[i3] = r; this.pCol[i3 + 1] = g; this.pCol[i3 + 2] = b;
    this.pSize[i] = size;
    this.pAlpha[i] = 1.0;
    this.pLife[i] = life;
    this.pMaxLife[i] = life;
    this.pGravity[i] = gravity;
  }

  emitBurst(pos, opts = {}) {
    const count = opts.count || 28;
    const col = new THREE.Color(opts.colorHex !== undefined ? opts.colorHex : 0x38bdf8);
    const speed = opts.speed !== undefined ? opts.speed : 11.0;
    const size = opts.size !== undefined ? opts.size : 1.1;
    const life = opts.life !== undefined ? opts.life : 0.48;
    const gravity = opts.gravity !== undefined ? opts.gravity : 9.5;
    const upward = opts.upward !== undefined ? opts.upward : 3.0;
    const spread = opts.spread !== undefined ? opts.spread : 0.4;

    for (let k = 0; k < count; k++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const sp = speed * (0.35 + Math.random() * 0.75);
      const vx = Math.sin(ph) * Math.cos(th) * sp;
      const vy = Math.cos(ph) * sp * 0.7 + upward * Math.random();
      const vz = Math.sin(ph) * Math.sin(th) * sp;
      this._spawnParticle(
        pos.x + (Math.random() - 0.5) * spread,
        pos.y + (Math.random() - 0.5) * spread,
        pos.z + (Math.random() - 0.5) * spread,
        vx, vy, vz,
        col.r, col.g, col.b,
        size * (0.7 + Math.random() * 0.7),
        life * (0.6 + Math.random() * 0.5),
        gravity
      );
    }
  }

  emitDirectional(pos, dir, opts = {}) {
    const count = opts.count || 16;
    const col = new THREE.Color(opts.colorHex !== undefined ? opts.colorHex : 0xfbbf24);
    const speed = opts.speed || 16.0;
    const cone = opts.cone !== undefined ? opts.cone : 0.35;
    const size = opts.size || 0.9;
    const life = opts.life || 0.36;
    const d = dir.clone().normalize();
    for (let k = 0; k < count; k++) {
      const sp = speed * (0.5 + Math.random() * 0.7);
      const vx = (d.x + (Math.random() - 0.5) * cone) * sp;
      const vy = (d.y + (Math.random() - 0.5) * cone) * sp;
      const vz = (d.z + (Math.random() - 0.5) * cone) * sp;
      this._spawnParticle(pos.x, pos.y, pos.z, vx, vy, vz, col.r, col.g, col.b, size, life * (0.6 + Math.random() * 0.5), 2.0);
    }
  }

  emitRing(pos, radius = 6.0, opts = {}) {
    const count = opts.count || 42;
    const col = new THREE.Color(opts.colorHex !== undefined ? opts.colorHex : 0x38bdf8);
    const speed = opts.expandSpeed || 12.0;
    const size = opts.size || 1.3;
    const life = opts.life || 0.52;
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + Math.random() * 0.1;
      const r0 = radius * 0.25;
      this._spawnParticle(
        pos.x + Math.cos(a) * r0,
        pos.y + 0.25,
        pos.z + Math.sin(a) * r0,
        Math.cos(a) * speed,
        1.2 + Math.random() * 1.8,
        Math.sin(a) * speed,
        col.r, col.g, col.b,
        size, life, 1.5
      );
    }
  }

  // --------------------------------------------------------------------------
  // 2. VOLUMETRIC FBM PLASMA BEAM (CROSSED RIBBONS + GAUSSIAN CORE)
  // --------------------------------------------------------------------------
  spawnVolumetricBeam(startPos, endPos, opts = {}) {
    const width = opts.width || 1.35;
    const duration = opts.duration || 0.36;
    const coreHex = opts.coreHex !== undefined ? opts.coreHex : 0xffffff;
    const outerHex = opts.outerHex !== undefined ? opts.outerHex : 0x38bdf8;
    const dist = Math.max(0.5, startPos.distanceTo(endPos));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: GLOBAL_LIGHT_UNIFORMS.uTime,
        uAlpha: { value: 1.0 },
        uCore: { value: new THREE.Color(coreHex) },
        uOuter: { value: new THREE.Color(outerHex) }
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
        uniform float uAlpha;
        uniform vec3 uCore;
        uniform vec3 uOuter;
        varying vec2 vUv;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
        }
        void main() {
          float crossDist = abs(vUv.x - 0.5) * 2.0;
          float turb = noise(vec2(vUv.y * 8.0 - uTime * 14.0, vUv.x * 4.0));
          float beam = pow(max(0.0, 1.0 - crossDist), 2.1) * (0.78 + 0.45 * turb);
          float endFade = smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
          float core = smoothstep(0.45, 0.92, beam);
          vec3 col = mix(uOuter * 1.4, uCore * 2.2, core);
          gl_FragColor = vec4(col, clamp(beam * endFade * uAlpha, 0.0, 1.0));
        }
      `
    });

    const group = new THREE.Group();
    const p1 = new THREE.PlaneGeometry(width, dist, 1, 1);
    p1.translate(0, dist * 0.5, 0);
    p1.rotateX(Math.PI / 2);

    const m1 = new THREE.Mesh(p1, mat);
    const m2 = new THREE.Mesh(p1, mat);
    m2.rotation.z = Math.PI / 2;
    const m3 = new THREE.Mesh(p1, mat);
    m3.rotation.z = Math.PI / 4;
    group.add(m1, m2, m3);
    group.position.copy(startPos);
    group.lookAt(endPos);

    this.scene.add(group);
    this.activeBeams.push({ mesh: group, mat, life: duration, maxLife: duration });

    this.emitBurst(startPos, { count: 14, colorHex: outerHex, speed: 6, size: 1.0, life: 0.25, gravity: 0, upward: 0 });
    this.emitBurst(endPos, { count: 24, colorHex: outerHex, speed: 12, size: 1.25, life: 0.38, gravity: 6 });
  }

  // --------------------------------------------------------------------------
  // 3. BRANCHED PROCEDURAL LIGHTNING BOLTS (RIBBON STRIPS, NOT BOXES)
  // --------------------------------------------------------------------------
  spawnBranchedLightning(startPos, endPos, opts = {}) {
    const colorHex = opts.colorHex !== undefined ? opts.colorHex : 0x38bdf8;
    const duration = opts.duration || 0.26;
    const branches = opts.branches !== undefined ? opts.branches : 2;
    const thickness = opts.thickness || 0.26;

    const buildRibbon = (a, b, segs, jit, thick) => {
      const pts = [];
      const dir = new THREE.Vector3().subVectors(b, a);
      const len = dir.length();
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const p = a.clone().lerp(b, t);
        if (i > 0 && i < segs) {
          p.x += (Math.random() - 0.5) * jit * len * 0.14;
          p.y += (Math.random() - 0.5) * jit * len * 0.08;
          p.z += (Math.random() - 0.5) * jit * len * 0.14;
        }
        pts.push(p);
      }

      const positions = [];
      const uvs = [];
      const indices = [];
      const side = new THREE.Vector3(1, 0, 0);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const v = i / (pts.length - 1);
        const w = thick * (1.0 - v * 0.35);
        positions.push(p.x - side.x * w, p.y, p.z - side.z * w);
        positions.push(p.x + side.x * w, p.y, p.z + side.z * w);
        uvs.push(0, v, 1, v);
        if (i < pts.length - 1) {
          const idx = i * 2;
          indices.push(idx, idx + 1, idx + 2, idx + 1, idx + 3, idx + 2);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      return { geo, pts };
    };

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uAlpha: { value: 1.0 },
        uColor: { value: new THREE.Color(colorHex) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uAlpha; uniform vec3 uColor; varying vec2 vUv;
        void main() {
          float g = pow(max(0.0, 1.0 - abs(vUv.x - 0.5) * 2.0), 1.7);
          vec3 col = mix(uColor * 1.6, vec3(1.0) * 2.2, smoothstep(0.55, 0.95, g));
          gl_FragColor = vec4(col, g * uAlpha);
        }
      `
    });

    const group = new THREE.Group();
    const main = buildRibbon(startPos, endPos, 10, 1.1, thickness);
    group.add(new THREE.Mesh(main.geo, mat));

    for (let br = 0; br < branches; br++) {
      const origin = main.pts[Math.floor(2 + Math.random() * (main.pts.length - 4))];
      const subEnd = origin.clone().add(new THREE.Vector3((Math.random() - 0.5) * 6, -3 - Math.random() * 4, (Math.random() - 0.5) * 6));
      const sub = buildRibbon(origin, subEnd, 5, 1.4, thickness * 0.55);
      group.add(new THREE.Mesh(sub.geo, mat));
    }

    this.scene.add(group);
    this.activeBeams.push({ mesh: group, mat, life: duration, maxLife: duration });
    this.emitBurst(endPos, { count: 18, colorHex, speed: 9, size: 1.15, life: 0.35, gravity: 7 });
  }

  // --------------------------------------------------------------------------
  // 4. ADDITIVE SHADER ENERGY PROJECTILE (ZERO SOLID GEOMETRY)
  // --------------------------------------------------------------------------
  createEnergyProjectileMesh(colorHex = 0x38bdf8, coreHex = 0xffffff, scale = 1.0) {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: GLOBAL_LIGHT_UNIFORMS.uTime,
        uColor: { value: new THREE.Color(colorHex) },
        uCore: { value: new THREE.Color(coreHex) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uTime; uniform vec3 uColor; uniform vec3 uCore; varying vec2 vUv;
        void main() {
          vec2 c = vUv - 0.5;
          float r = length(c) * 2.0;
          float a = atan(c.y, c.x);
          float swirl = 0.78 + 0.22 * sin(a * 4.0 + uTime * 14.0 - r * 8.0);
          float glow = exp(-r * r * 3.8) * swirl;
          float core = exp(-r * r * 14.0);
          vec3 col = uColor * glow * 1.7 + uCore * core * 2.2;
          gl_FragColor = vec4(col, clamp(glow + core, 0.0, 1.0));
        }
      `
    });
    const group = new THREE.Group();
    const gPlane = new THREE.PlaneGeometry(1.5 * scale, 1.5 * scale);
    const p1 = new THREE.Mesh(gPlane, mat);
    const p2 = new THREE.Mesh(gPlane, mat);
    p2.rotation.y = Math.PI / 2;
    const p3 = new THREE.Mesh(gPlane, mat);
    p3.rotation.x = Math.PI / 2;
    group.add(p1, p2, p3);
    return group;
  }

  // --------------------------------------------------------------------------
  // 5. GROUND DANGER TELEGRAPH & JUMPABLE SHOCKWAVE RINGS (GLSL)
  // --------------------------------------------------------------------------
  spawnGroundDangerZone(pos, radius = 6.0, duration = 1.1, colorHex = 0xef4444, type = 'circle', onComplete = null) {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0.0 },
        uColor: { value: new THREE.Color(colorHex) },
        uIsRing: { value: type === 'ring_jump' ? 1.0 : 0.0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uProgress;
        uniform vec3 uColor;
        uniform float uIsRing;
        varying vec2 vUv;
        void main() {
          vec2 c = vUv - 0.5;
          float r = length(c) * 2.0;
          if (r > 1.0) discard;
          if (uIsRing > 0.5) {
            float ringDist = abs(r - uProgress);
            float band = 1.0 - smoothstep(0.0, 0.09, ringDist);
            float alpha = band * (1.0 - uProgress * 0.25);
            gl_FragColor = vec4(uColor * 2.0 + vec3(0.45), alpha);
          } else {
            float border = smoothstep(0.89, 0.98, r) * (1.0 - smoothstep(0.98, 1.0, r));
            float fill = (1.0 - smoothstep(max(0.01, uProgress - 0.04), uProgress, r)) * 0.36;
            float ringPulse = smoothstep(0.95, 1.0, 1.0 - abs(r - uProgress)) * 0.8;
            gl_FragColor = vec4(uColor * 1.6, clamp(border + fill + ringPulse, 0.0, 0.95));
          }
        }
      `
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, pos.y + 0.22, pos.z);
    this.scene.add(mesh);

    const zone = {
      mesh, mat, pos: pos.clone(), radius, duration, elapsed: 0, type, onComplete, hitChecked: false
    };
    this.activeZones.push(zone);
    return zone;
  }

  // --------------------------------------------------------------------------
  // 6. WEAPON RIBBON TRAIL (SMOOTH SHADER RIBBON ATTACHED TO FISTS/WEAPONS)
  // --------------------------------------------------------------------------
  createWeaponTrail(colorHex = 0x38bdf8, maxPts = 12, width = 0.45) {
    const positions = new Float32Array(maxPts * 2 * 3);
    const uvs = new Float32Array(maxPts * 2 * 2);
    const indices = [];
    for (let i = 0; i < maxPts; i++) {
      const v = i / (maxPts - 1);
      uvs[i * 4 + 0] = 0; uvs[i * 4 + 1] = v;
      uvs[i * 4 + 2] = 1; uvs[i * 4 + 3] = v;
      if (i < maxPts - 1) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(colorHex) },
        uAlpha: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uAlpha; varying vec2 vUv;
        void main() {
          float edge = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 1.6);
          float tail = smoothstep(1.0, 0.0, vUv.y);
          gl_FragColor = vec4(uColor * 1.8 + vec3(0.35), edge * tail * uAlpha);
        }
      `
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    this.scene.add(mesh);

    const trail = { mesh, geo, mat, maxPts, width, points: [], activeAlpha: 0 };
    this.weaponTrails.push(trail);
    return trail;
  }

  pushTrailPoint(trail, worldPos, active) {
    if (!trail) return;
    if (active) {
      trail.activeAlpha = 0.92;
      trail.points.unshift(worldPos.clone());
      if (trail.points.length > trail.maxPts) trail.points.pop();
    } else {
      trail.activeAlpha = Math.max(0, trail.activeAlpha - 0.09);
      if (trail.points.length > 0 && trail.activeAlpha <= 0.02) trail.points.length = 0;
    }

    trail.mat.uniforms.uAlpha.value = trail.activeAlpha;
    if (trail.points.length < 2) {
      trail.mesh.visible = false;
      return;
    }
    trail.mesh.visible = true;
    const posAttr = trail.geo.attributes.position;
    for (let i = 0; i < trail.maxPts; i++) {
      const p = trail.points[Math.min(i, trail.points.length - 1)];
      const half = trail.width * (1.0 - i / trail.maxPts);
      posAttr.setXYZ(i * 2, p.x, p.y - half, p.z);
      posAttr.setXYZ(i * 2 + 1, p.x, p.y + half, p.z);
    }
    posAttr.needsUpdate = true;
  }

  // --------------------------------------------------------------------------
  // 7. PER-FRAME GPU & SHADER SIMULATION UPDATE
  // --------------------------------------------------------------------------
  update(delta, playerState = null, onRingHitPlayer = null) {
    // Update GPU Particle Pool
    let anyParticle = false;
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.pLife[i] <= 0) continue;
      anyParticle = true;
      this.pLife[i] -= delta;
      const i3 = i * 3;
      this.pVel[i3 + 1] -= this.pGravity[i] * delta;
      this.pPos[i3] += this.pVel[i3] * delta;
      this.pPos[i3 + 1] += this.pVel[i3 + 1] * delta;
      this.pPos[i3 + 2] += this.pVel[i3 + 2] * delta;
      const ratio = Math.max(0, this.pLife[i] / Math.max(0.01, this.pMaxLife[i]));
      this.pAlpha[i] = ratio;
      if (this.pLife[i] <= 0) {
        this.pAlpha[i] = 0;
        this.pSize[i] = 0;
      }
    }
    if (anyParticle) {
      this.particleGeo.attributes.position.needsUpdate = true;
      this.particleGeo.attributes.aAlpha.needsUpdate = true;
      this.particleGeo.attributes.aSize.needsUpdate = true;
      this.particleGeo.attributes.aColor.needsUpdate = true;
    }

    // Update Volumetric Beams & Branched Lightnings
    for (let i = this.activeBeams.length - 1; i >= 0; i--) {
      const b = this.activeBeams[i];
      b.life -= delta;
      b.mat.uniforms.uAlpha.value = Math.max(0, b.life / b.maxLife);
      if (b.life <= 0) {
        this.scene.remove(b.mesh);
        this.activeBeams.splice(i, 1);
      }
    }

    // Update Ground Danger Zones & Jumpable Seismic Rings
    for (let i = this.activeZones.length - 1; i >= 0; i--) {
      const z = this.activeZones[i];
      z.elapsed += delta;
      const p = Math.min(1.0, z.elapsed / z.duration);
      z.mat.uniforms.uProgress.value = p;

      if (z.type === 'ring_jump' && playerState && !z.hitChecked) {
        const ringR = p * z.radius;
        const dx = playerState.pos.x - z.pos.x;
        const dz = playerState.pos.z - z.pos.z;
        const distXZ = Math.sqrt(dx * dx + dz * dz);
        const heightAboveZone = playerState.pos.y - z.pos.y;
        if (Math.abs(distXZ - ringR) < 1.65 && heightAboveZone < 1.9 && !playerState.isFlying) {
          z.hitChecked = true;
          if (onRingHitPlayer) onRingHitPlayer(z);
        }
      }

      if (z.elapsed >= z.duration) {
        if (z.onComplete) z.onComplete(z);
        this.scene.remove(z.mesh);
        this.activeZones.splice(i, 1);
      }
    }
  }
}

window.VFXEngine = VFXEngine;

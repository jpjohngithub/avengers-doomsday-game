// ============================================================================
// AVENGERS: DOOMSDAY — LATVERIA 1400m OPEN WORLD, 3D RELIEF, RIVER & CASTLE
// ============================================================================

class LatveriaWorld {
  constructor(scene) {
    this.scene = scene;
    this.swingAnchors = [];
    this.buildingBoxes = [];
    this.colliderCellSize = 20;
    this.colliderGrid = new Map();
    this._indexedCount = 0;
    this.brazierLights = [];
    this.animatedObjects = [];
    this.ambientMotes = null;
    this.showcaseGroup = null;
    this.showcaseRuneMat = null;
    this.castleBarrier = null;
    this.castleBarrierUnlocked = false;
    this.postDoomUnlocked = false;
    this.act2Barriers = [];
    this.lakes = [
      { x: 96, z: 68, r: 30, deep: 0x09304d, shallow: 0x38bdf8, pierDir: -1, waterY: -0.45, baseY: 0.0 },
      { x: -96, z: 52, r: 28, deep: 0x0b3b4b, shallow: 0x2dd4bf, pierDir: 1, waterY: -0.45, baseY: 0.0 },
      { x: -255, z: -42, r: 26, deep: 0x24104f, shallow: 0xa855f7, pierDir: 1, waterY: -0.45, baseY: 0.0 },
      { x: 135, z: 540, r: 34, deep: 0x083b44, shallow: 0x34d399, pierDir: -1, waterY: -0.45, baseY: 0.0 },
      { x: -560, z: 540, r: 36, deep: 0x162454, shallow: 0x22d3ee, pierDir: 1, waterY: -0.45, baseY: 0.0 },
      { x: 560, z: 540, r: 34, deep: 0x0c3d59, shallow: 0x7dd3fc, pierDir: -1, waterY: -0.45, baseY: 0.0 },
      { x: -175, z: -265, r: 26, deep: 0x0d4459, shallow: 0x67e8f9, pierDir: 1, waterY: -0.45, baseY: 0.0 }
    ];
    this.init();
  }

  _gridKey(cx, cz) {
    return (cx & 0xFFFF) | ((cz & 0xFFFF) << 16);
  }

  _indexCollider(b) {
    if (!b || b.w === undefined || b.d === undefined) return;
    const hw = b.hw !== undefined ? b.hw : b.w * 0.5;
    const hd = b.hd !== undefined ? b.hd : b.d * 0.5;
    b.hw = hw;
    b.hd = hd;
    const cs = this.colliderCellSize;
    const x0 = Math.floor((b.x - hw) / cs);
    const x1 = Math.floor((b.x + hw) / cs);
    const z0 = Math.floor((b.z - hd) / cs);
    const z1 = Math.floor((b.z + hd) / cs);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const key = this._gridKey(cx, cz);
        let bucket = this.colliderGrid.get(key);
        if (!bucket) { bucket = []; this.colliderGrid.set(key, bucket); }
        bucket.push(b);
      }
    }
  }

  _syncColliderGrid() {
    while (this._indexedCount < this.buildingBoxes.length) {
      this._indexCollider(this.buildingBoxes[this._indexedCount++]);
    }
  }

  _queryColliders(x, z, radius) {
    this._syncColliderGrid();
    const cs = this.colliderCellSize;
    const pad = radius + 0.5;
    const x0 = Math.floor((x - pad) / cs);
    const x1 = Math.floor((x + pad) / cs);
    const z0 = Math.floor((z - pad) / cs);
    const z1 = Math.floor((z + pad) / cs);
    if (x0 === x1 && z0 === z1) {
      return this.colliderGrid.get(this._gridKey(x0, z0)) || [];
    }
    const out = [];
    const seen = new Set();
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const bucket = this.colliderGrid.get(this._gridKey(cx, cz));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const b = bucket[i];
          if (!seen.has(b)) { seen.add(b); out.push(b); }
        }
      }
    }
    return out;
  }

  addCollider(x, z, w, d, h = 16, baseY = null) {
    const gY = baseY !== null ? baseY : this.getGroundHeight(x, z);
    const minY = gY - 1.5;
    const box = { x, z, w, d, hw: w * 0.5, hd: d * 0.5, h, minY, maxY: gY + h };
    this.buildingBoxes.push(box);
    this._indexCollider(box);
    this._indexedCount = this.buildingBoxes.length;
  }

  mat(color, opts = {}) {
    return CustomShaders.createStylizedMaterial({
      color,
      map: opts.map || null,
      vertexColors: opts.vertexColors === true,
      emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 0.0,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.04,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.68,
      rimColor: opts.rimColor !== undefined ? opts.rimColor : 0xffd7b5,
      rimStrength: opts.rimStrength !== undefined ? opts.rimStrength : 0.25,
      halftone: opts.halftone !== undefined ? opts.halftone : 0.08,
      doubleSided: opts.doubleSided === true,
      transparent: opts.transparent === true,
      opacity: opts.opacity !== undefined ? opts.opacity : 1.0
    });
  }

  addShadowOverlay(w, d, x, y, z, rotX = -Math.PI / 2) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.ShadowMaterial({ color: 0x161036, opacity: 0.36, depthWrite: false })
    );
    plane.renderOrder = -1;
    plane.rotation.x = rotX;
    plane.position.set(x, y, z);
    plane.receiveShadow = true;
    this.scene.add(plane);
    return plane;
  }

  _smoothstep(e0, e1, x) {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  }

  init() {
    this.buildSkyAndLighting();
    this.buildTerrainAndMountains();
    this.buildImperialAvenueAndBridge();
    this.buildDoomstadtVillage();
    this.buildAlpineForestAndProps();
    this.buildGiantArcologySphere();
    this.buildCastleDoom();
    this.buildHeroSelectionOverlook();
    this.buildAmbientMotes();
  }

  getWaterLevel(x, z, playerY = 0) {
    // 1. Over the North River Bridge deck: stay dry on bridge road
    if (Math.abs(x) <= 15.8 && z <= -93 && z >= -146 && playerY > -0.25) {
      return -Infinity;
    }
    // 2. Meandering Latver River channel (y = -0.85, carved down to -4.4m for swimming)
    if (x >= -940 && x <= 940 && z < -78 && z > -146) {
      const riverCenter = -108 + Math.sin(x * 0.025) * 14;
      if (Math.abs(z - riverCenter) < 18.2) return -0.85;
    }
    // 3. 7 Excavated Swimmable Lakes across all biomes
    if (this.lakes) {
      for (let i = 0; i < this.lakes.length; i++) {
        const lk = this.lakes[i];
        if (Math.hypot(x - lk.x, z - lk.z) < lk.r - 0.8) return lk.waterY;
      }
    }
    return -Infinity;
  }

  getGroundHeight(x, z) {
    // 0. Swimmable Excavated Lake Basins across flat plain (y = 0.0)
    if (this.lakes) {
      for (let i = 0; i < this.lakes.length; i++) {
        const lk = this.lakes[i];
        const dLk = Math.hypot(x - lk.x, z - lk.z);
        if (dLk < lk.r + 10.0) {
          const pierX = lk.x + lk.pierDir * (lk.r - 4.0);
          if (Math.abs(z - lk.z) < 2.1 && Math.abs(x - pierX) < 6.0) return 0.28;
          const blend = 1.0 - this._smoothstep(lk.r - 5.0, lk.r + 10.0, dLk);
          if (blend > 0.01) return (lk.waterY - 3.9) * blend;
        }
      }
    }

    // 1. Flat North River Bridge Deck (y = 0.0)
    if (Math.abs(x) <= 15.6 && z <= -92 && z >= -146) return 0.0;

    // 2. Meandering Latver River Channel (excavated for swimming)
    if (x >= -940 && x <= 940 && z < -78 && z > -148) {
      const riverCenter = -108 + Math.sin(x * 0.025) * 14;
      const dRiv = Math.abs(z - riverCenter);
      if (dRiv < 26) {
        const edgeBridge = Math.abs(x) <= 21 ? this._smoothstep(15.6, 21.0, Math.abs(x)) : 1.0;
        return -(1.0 - this._smoothstep(10, 26, dRiv)) * 4.4 * edgeBridge;
      }
    }

    // 3. Flat Imperial Moat Causeway (y = 0.0) & Castle Doom Boiling Emerald Moat (z: -396..-496)
    if (z <= -396 && z >= -498 && Math.abs(x) <= 160) {
      if (Math.abs(x) <= 16.5) return 0.0;
      const mZ = this._smoothstep(-396, -408, z) * (1.0 - this._smoothstep(-486, -498, z));
      const mX = (1.0 - this._smoothstep(138, 160, Math.abs(x))) * this._smoothstep(16.5, 22.0, Math.abs(x));
      if (mZ * mX > 0.01) return -6.8 * mZ * mX;
    }

    return 0.0;
  }

  getSupportHeight(x, z, currY = 0) {
    let floorY = this.getGroundHeight(x, z);
    const list = this._queryColliders(x, z, 0.45);
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      const top = b.maxY !== undefined ? b.maxY : (b.h || 15);
      if (top > floorY && top <= currY + 0.65 && top < 18) {
        if (Math.abs(x - b.x) <= b.hw + 0.35 && Math.abs(z - b.z) <= b.hd + 0.35) {
          floorY = top;
        }
      }
    }
    return floorY;
  }

  isPositionBlocked(x, z, radius = 1.05, entityY = null) {
    // Castle Seal Barrier at gate z = -504
    if (!this.castleBarrierUnlocked && z < -501 && z > -512 && Math.abs(x) < 16) {
      return true;
    }

    // Castle interior back gate (scoped to Cathedral hall x in [-30.5, 30.5], opens for Act II)
    if (z < -623 && z >= -642 && Math.abs(x) < 30.5 && !this.postDoomUnlocked) {
      return true;
    }

    // Flat Bridge Guardrails (heroes jumping/flying above 2.4m clear them)
    if (z <= -396 && z > -498 && Math.abs(x) <= 21) {
      if ((entityY === null || entityY < 2.4) && Math.abs(x) > 13.6) return true;
    } else if (z <= -94 && z > -146 && Math.abs(x) <= 19) {
      if ((entityY === null || entityY < 2.4) && Math.abs(x) > 13.8) return true;
    } else {
      const maxX = this.postDoomUnlocked ? 1540 : 910;
      const minZ = this.postDoomUnlocked ? -1460 : -685;
      const maxZ = 870;
      if (x < -maxX || x > maxX || z > maxZ || z < minZ) return true;
    }

    const nearby = this._queryColliders(x, z, radius);
    for (let i = 0; i < nearby.length; i++) {
      const b = nearby[i];
      const hw = b.hw;
      const hd = b.hd;
      if (Math.abs(x - b.x) > hw + radius || Math.abs(z - b.z) > hd + radius) continue;
      const bMaxY = b.maxY !== undefined ? b.maxY : (b.h || 15);
      const bMinY = b.minY !== undefined ? b.minY : -10;
      if (entityY !== null && (entityY >= bMaxY - 0.15 || entityY + 2.2 < bMinY)) continue;
      const dx = Math.max(0, Math.abs(x - b.x) - hw);
      const dz = Math.max(0, Math.abs(z - b.z) - hd);
      if (dx * dx + dz * dz < radius * radius) return true;
    }
    return false;
  }

  _pushOutStep(currX, currZ, nextX, nextZ, radius, entityY) {
    let finalX = nextX;
    let finalZ = nextZ;
    const nearby = this._queryColliders(finalX, finalZ, radius + 1.5);
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < nearby.length; i++) {
        const b = nearby[i];
        const hw = b.hw;
        const hd = b.hd;
        if (Math.abs(finalX - b.x) > hw + radius || Math.abs(finalZ - b.z) > hd + radius) continue;
        const bMaxY = b.maxY !== undefined ? b.maxY : (b.h || 15);
        const bMinY = b.minY !== undefined ? b.minY : -10;
        if (entityY !== null && (entityY >= bMaxY - 0.15 || entityY + 2.2 < bMinY)) continue;

        const cx = Math.max(b.x - hw, Math.min(finalX, b.x + hw));
        const cz = Math.max(b.z - hd, Math.min(finalZ, b.z + hd));
        const ox = finalX - cx;
        const oz = finalZ - cz;
        const distSq = ox * ox + oz * oz;

        if (distSq < radius * radius) {
          if (distSq > 1e-6) {
            const dist = Math.sqrt(distSq);
            const push = radius - dist;
            finalX += (ox / dist) * push;
            finalZ += (oz / dist) * push;
          } else {
            const penX = hw + radius - Math.abs(finalX - b.x);
            const penZ = hd + radius - Math.abs(finalZ - b.z);
            if (penX < penZ) finalX += (finalX >= b.x ? 1 : -1) * penX;
            else finalZ += (finalZ >= b.z ? 1 : -1) * penZ;
          }
        }
      }
    }
    if (!this.isPositionBlocked(finalX, finalZ, radius, entityY)) return { x: finalX, z: finalZ };
    if (!this.isPositionBlocked(nextX, currZ, radius, entityY)) return { x: nextX, z: currZ };
    if (!this.isPositionBlocked(currX, nextZ, radius, entityY)) return { x: currX, z: nextZ };
    return { x: currX, z: currZ };
  }

  resolveMovement(currX, currZ, nextX, nextZ, radius = 1.05, entityY = null, isGrounded = false) {
    const dx = nextX - currX;
    const dz = nextZ - currZ;
    const travel = Math.hypot(dx, dz);
    const maxStep = Math.max(0.38, radius * 0.48);
    const steps = Math.max(1, Math.min(8, Math.ceil(travel / maxStep)));
    let px = currX;
    let pz = currZ;
    const stepDx = dx / steps;
    const stepDz = dz / steps;
    for (let s = 0; s < steps; s++) {
      const res = this._pushOutStep(px, pz, px + stepDx, pz + stepDz, radius, entityY);
      px = res.x;
      pz = res.z;
    }
    return { x: px, z: pz };
  }

  buildSkyAndLighting() {
    const skyGeo = new THREE.SphereGeometry(3400, 36, 28);
    const skyMat = CustomShaders.createSkyDomeMaterial();
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyDome);

    const hemi = new THREE.HemisphereLight(0xa5cbff, 0x3b2a5a, 1.06);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffe2b8, 1.52);
    sun.position.set(-145, 165, 120);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 15;
    sun.shadow.camera.far = 280;
    const d = 70;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0004;
    this.sunLight = sun;
    this.scene.add(sun);
    this.scene.add(sun.target);
  }

  buildTerrainAndMountains() {
    const terrainTex = ProceduralTextures.createAlpineTerrainTexture();
    terrainTex.repeat.set(84, 84);

    const width = 3600;
    const depth = 3000;
    const segs = 320;
    const groundGeo = new THREE.PlaneGeometry(width, depth, segs, segs);
    groundGeo.rotateX(-Math.PI / 2);
    groundGeo.translate(0, 0, -320);

    const pos = groundGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cValley = new THREE.Color(0x2d6e3f);
    const cValleyVar = new THREE.Color(0x3a8245);
    const cForest = new THREE.Color(0x1b2736);
    const cCrater = new THREE.Color(0x282124);
    const cCraterEmber = new THREE.Color(0x47231a);
    const cTundra = new THREE.Color(0xcde2f5);
    const cCastle = new THREE.Color(0x1b3336);
    const cHigh   = new THREE.Color(0x887432);
    const cJungle = new THREE.Color(0x134e4a);
    const cAsgard = new THREE.Color(0xa18042);
    const cBed    = new THREE.Color(0x36444c);
    const cRoad   = new THREE.Color(0x4b5563);
    const cVoid   = new THREE.Color(0x131126);
    const cMag    = new THREE.Color(0x4a1d48);
    const cKang   = new THREE.Color(0x0c4a48);
    const tmpC = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const vy = this.getGroundHeight(vx, vz);
      let visualY = vy;
      if (Math.abs(vx) <= 17.5 && vz < -82 && vz > -146) visualY = -4.3;
      else if (Math.abs(vx) <= 18.5 && vz < -396 && vz > -498) visualY = -6.8;
      pos.setY(i, visualY);

      const meadowN = Math.sin(vx * 0.045) * Math.cos(vz * 0.042) * 0.5 + 0.5;
      tmpC.copy(cValley).lerp(cValleyVar, meadowN * 0.45);
      if (vz > 240) {
        const sMix = this._smoothstep(240, 290, vz);
        if (vx < -280) tmpC.lerp(cJungle, sMix * this._smoothstep(-280, -380, vx));
        else if (vx > 280) tmpC.lerp(cAsgard, sMix * this._smoothstep(280, 380, vx));
        else tmpC.lerp(cHigh, sMix);
      } else {
        if (vx < -85) tmpC.lerp(cForest, this._smoothstep(-85, -180, vx));
        else if (vx > 85) {
          const eMix = this._smoothstep(85, 175, vx);
          const ashWave = Math.sin(vx * 0.06 + vz * 0.05) * 0.5 + 0.5;
          tmpC.lerp(cCrater, eMix);
          tmpC.lerp(cCraterEmber, eMix * ashWave * 0.42);
        }
        if (vz < -95 && Math.abs(vx) < 340) tmpC.lerp(cTundra, this._smoothstep(-95, -175, vz));
        if (vz < -460 && vz > -710 && Math.abs(vx) < 230) tmpC.lerp(cCastle, this._smoothstep(-460, -520, vz));
      }
      if (vx < -940) tmpC.lerp(cMag, this._smoothstep(-940, -1080, vx));
      if (vx > 940) tmpC.lerp(cKang, this._smoothstep(940, 1080, vx));
      if (vz < -820) tmpC.lerp(cVoid, this._smoothstep(-820, -960, vz));

      // Subtle weathered cobblestone shoulder along cardinal highways
      if ((Math.abs(vx) < 12.5 && vz > -500 && vz < 625) || (Math.abs(vz - 30) < 10.5 && Math.abs(vx) < 1200) || (Math.abs(vz - 490) < 11 && Math.abs(vx) < 600)) {
        tmpC.lerp(cRoad, 0.48);
      }

      // Natural gravel shoreline & deep underwater slate bed
      const wY = this.getWaterLevel(vx, vz, -10);
      if (wY > -900 && vy <= wY + 0.5) {
        const cSand = new THREE.Color(0x6d6854);
        tmpC.lerp(cSand, 0.55);
        if (vy < wY) tmpC.lerp(cBed, this._smoothstep(wY, wY - 2.0, vy) * 0.96);
      }

      colors[i * 3] = tmpC.r;
      colors[i * 3 + 1] = tmpC.g;
      colors[i * 3 + 2] = tmpC.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();

    const groundMat = this.mat(0xffffff, {
      map: terrainTex,
      vertexColors: true,
      roughness: 0.88,
      rimStrength: 0.14
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.addShadowOverlay(180, 220, 0, 0.03, 55);

    // Latver River (Extended 2000m Meander-Matched Ribbon Mesh with river flow mode)
    if (typeof CustomShaders.createWaterMaterial === 'function') {
      const riverMat = CustomShaders.createWaterMaterial(0x09304d, 0x38bdf8, { mode: 'river' });
      const riverGeo = new THREE.PlaneGeometry(2000, 38, 240, 16);
      riverGeo.rotateX(-Math.PI / 2);
      const rPos = riverGeo.attributes.position;
      for (let i = 0; i < rPos.count; i++) {
        const rx = rPos.getX(i);
        const rz = rPos.getZ(i);
        const centerZ = -108 + Math.sin(rx * 0.025) * 14;
        rPos.setZ(i, centerZ + rz);
      }
      riverGeo.computeVertexNormals();
      const river = new THREE.Mesh(riverGeo, riverMat);
      river.position.set(0, -0.85, 0);
      this.scene.add(river);
    }

    // Boiling Emerald Abyss Moat beneath the Imperial Causeway (z = -396..-496)
    const chasmMat = typeof CustomShaders.createEmeraldAbyssMaterial === 'function'
      ? CustomShaders.createEmeraldAbyssMaterial()
      : this.mat(0x062c28, { emissive: 0x047857, emissiveIntensity: 0.65 });
    const chasm = new THREE.Mesh(new THREE.PlaneGeometry(316, 102, 40, 16), chasmMat);
    chasm.rotation.x = -Math.PI / 2;
    chasm.position.set(0, -3.2, -448);
    this.scene.add(chasm);

    const cragMat = this.mat(0x161c24, { roughness: 0.88, rimColor: 0x34d399, rimStrength: 0.35, flatShading: true });
    for (let i = 0; i < 12; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const cx = side * (42 + (i % 4) * 26);
      const cz = -408 - (i % 6) * 14;
      const ch = 9 + (i % 4) * 3;
      const crag = new THREE.Mesh(new THREE.ConeGeometry(4.5 + (i % 3) * 1.8, ch, 6), cragMat);
      crag.position.set(cx, -7.2 + ch * 0.4, cz);
      crag.rotation.set((i % 3 - 1) * 0.12, i * 0.9, side * 0.10);
      this.scene.add(crag);
    }

    // Sculpted Outer Carpathian Mountain Ring framing the 3600m Continental World
    const rockMat = this.mat(0x2f3b5c, { roughness: 0.85, rimColor: 0x93c5fd, rimStrength: 0.28, halftone: 0.04, flatShading: true });
    const snowMat = this.mat(0xe0f2fe, { roughness: 0.55, rimColor: 0xfef08a, rimStrength: 0.36, halftone: 0.02, flatShading: true });

    const ringCount = 64;
    for (let i = 0; i < ringCount; i++) {
      const ang = (i / ringCount) * Math.PI * 2;
      if (Math.abs(Math.sin(ang)) < 0.14 && Math.cos(ang) > 0) continue;

      const dist = 1660 + (i % 3) * 110;
      const mx = Math.sin(ang) * dist;
      const mz = Math.cos(ang) * dist - 320;
      const mh = 210 + (i % 4) * 58;
      const mr = 115 + (i % 3) * 34;

      const peakGeo = new THREE.IcosahedronGeometry(1, 1);
      const pPos = peakGeo.attributes.position;
      for (let v = 0; v < pPos.count; v++) {
        let vx = pPos.getX(v);
        let vy = pPos.getY(v);
        let vz = pPos.getZ(v);
        if (vy < 0) vy *= 0.1;
        const ridge = 1.0 + 0.28 * Math.sin(vx * 5.2 + i) * Math.cos(vz * 4.8 - i);
        const taper = Math.max(0.18, 1.0 - Math.max(0, vy) * 0.72);
        pPos.setXYZ(v, vx * mr * taper * ridge, vy * mh, vz * mr * 0.85 * taper * ridge);
      }
      const flatPeak = peakGeo.toNonIndexed();
      flatPeak.computeVertexNormals();
      const peak = new THREE.Mesh(flatPeak, rockMat);
      peak.position.set(mx, -4, mz);
      peak.rotation.y = i * 1.1;
      this.scene.add(peak);

      const capGeo = new THREE.ConeGeometry(mr * 0.30, mh * 0.32, 5);
      const cap = new THREE.Mesh(capGeo, snowMat);
      cap.position.set(mx, mh * 0.84 - 4, mz);
      cap.rotation.y = i * 0.9;
      this.scene.add(cap);
    }
  }

  buildImperialAvenueAndBridge() {
    const cobbleTex = ProceduralTextures.createCobblestoneTexture();
    const roadMat = this.mat(0xffffff, { map: cobbleTex, roughness: 0.72, rimStrength: 0.16 });
    const stoneMat = this.mat(0x4b556b, { map: ProceduralTextures.createGothicStoneTexture(), roughness: 0.78 });
    const goldMat = this.mat(0xd4a848, { metalness: 0.85, roughness: 0.28, rimColor: 0xfef08a });

    // Grand Imperial Avenue running through Doomstadt (z: -95 to +225)
    const road = new THREE.Mesh(new THREE.BoxGeometry(20, 0.34, 320), roadMat);
    road.position.set(0, 0.06, 65);
    this.scene.add(road);

    // Central Town Plaza Fountain with Real Water Shader - Placed on Lakeside Plaza Terrace (x = 38, z = 68)
    const fountain = new THREE.Group();
    fountain.position.set(38, 0.25, 68);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 0.85, 8), stoneMat);
    basin.add(CustomShaders.createInkOutlineMesh(basin.geometry, 0.04, 0x0b0d17));
    const fWaterGeo = CustomShaders.createLakeGeometry ? CustomShaders.createLakeGeometry(3.6, 8, 28) : new THREE.CircleGeometry(3.6, 24);
    const fWaterMat = CustomShaders.createWaterMaterial
      ? CustomShaders.createWaterMaterial(0x0a3a5c, 0x38bdf8)
      : this.mat(0x10b981, { emissive: 0x059669, emissiveIntensity: 0.7, metalness: 0.4 });
    const water = new THREE.Mesh(fWaterGeo, fWaterMat);
    if (!CustomShaders.createLakeGeometry) water.rotation.x = -Math.PI / 2;
    water.position.y = 0.45;
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.85, 2.5, 8), stoneMat);
    spire.position.y = 1.4;
    const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), goldMat);
    crest.position.y = 3.0;
    fountain.add(basin, water, spire, crest);
    this.scene.add(fountain);
    this.addCollider(38, 68, 8.6, 8.6, 4.2, 0.0);
    this.animatedObjects.push({ type: 'spin', mesh: crest, speed: 0.9 });

    // 1. Flat North River Stone Bridge (z: -94 -> -146, y = 0.0)
    const bTex = cobbleTex.clone();
    bTex.needsUpdate = true;
    bTex.repeat.set(3, 14);
    const bridgeRoadMat = this.mat(0xffffff, { map: bTex, roughness: 0.72, rimStrength: 0.16 });

    const rDeck = new THREE.Mesh(new THREE.BoxGeometry(27.5, 1.3, 54), bridgeRoadMat);
    rDeck.position.set(0, -0.64, -120);
    rDeck.castShadow = true;
    rDeck.receiveShadow = true;
    this.scene.add(rDeck);
    this.addShadowOverlay(26.5, 53, 0, 0.03, -120);
    for (const s of [-1, 1]) {
      const rCurb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.7, 54), stoneMat);
      rCurb.position.set(s * 13.6, 0.45, -120);
      rCurb.add(CustomShaders.createInkOutlineMesh(rCurb.geometry, 0.04, 0x0b0d17));
      this.scene.add(rCurb);
      for (const rz of [-102, -138]) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 5.2, 8), stoneMat);
        col.position.set(s * 13.4, 2.6, rz);
        col.castShadow = true;
        this.scene.add(col);
        this.addCollider(s * 13.4, rz, 1.8, 1.8, 6.0, 0);
        this.addBrazier(s * 13.4, 5.2, rz);
      }
    }

    // 2. Flat Imperial Moat Causeway (z: -396 -> -502, y = 0.0)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(28.5, 1.6, 108), bridgeRoadMat);
    deck.position.set(0, -0.79, -449);
    deck.castShadow = true;
    deck.receiveShadow = true;
    this.scene.add(deck);
    this.addShadowOverlay(27.0, 106, 0, 0.03, -449);

    for (const s of [-1, 1]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.9, 108), stoneMat);
      curb.position.set(s * 13.8, 0.55, -449);
      curb.add(CustomShaders.createInkOutlineMesh(curb.geometry, 0.04, 0x0b0d17));
      this.scene.add(curb);
    }

    // Supporting Stone Moat Piers + Braziers + Web Swing Anchors
    for (let i = 0; i < 5; i++) {
      const bz = -406 - i * 21;
      const pier = new THREE.Mesh(new THREE.BoxGeometry(22, 12, 4.8), stoneMat);
      pier.position.set(0, -7.2, bz);
      this.scene.add(pier);

      for (const s of [-1, 1]) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.98, 7.6, 8), stoneMat);
        col.position.set(s * 13.6, 3.8, bz);
        col.castShadow = true;
        col.add(CustomShaders.createInkOutlineMesh(col.geometry, 0.04, 0x0b0d17));
        this.scene.add(col);
        this.addCollider(s * 13.6, bz, 2.2, 2.2, 8.2, 0);
        this.addBrazier(s * 13.6, 7.6, bz);
        this.swingAnchors.push(new THREE.Vector3(s * 13.6, 11.8, bz));
      }
    }
  }

  addBrazier(x, y, z) {
    const ironMat = this.mat(0x1f2937, { metalness: 0.82, roughness: 0.3 });
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.45, 0.65, 8), ironMat);
    bowl.position.set(x, y + 0.3, z);
    this.scene.add(bowl);
    this.addCollider(x, z, 1.8, 1.8, 2.2, y);

    const flameMat = CustomShaders.createFlameMaterial(0xa7f3d0, 0x059669);
    for (let r = 0; r < 2; r++) {
      const flamePlane = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.85, 4, 6), flameMat);
      flamePlane.position.set(x, y + 1.35, z);
      flamePlane.rotation.y = (r * Math.PI) / 2 + 0.35;
      this.scene.add(flamePlane);
    }

    this.brazierLights.push({
      pos: new THREE.Vector3(x, y + 1.6, z),
      r: 0.16,
      g: 0.95,
      b: 0.56,
      range: 18.0
    });
  }

  buildDoomstadtVillage() {
    const houseConfigs = [
      { x: -24, z: 120, w: 13, d: 12, h: 10.5, wall: '#e6dccb', roof: '#9f4335' },
      { x:  24, z: 118, w: 13, d: 12, h: 11.5, wall: '#d6dce6', roof: '#3c4a6b' },
      { x: -25, z: 86,  w: 14, d: 13, h: 12.0, wall: '#dfd4be', roof: '#9f4335' },
      { x:  25, z: 84,  w: 13, d: 12, h: 10.5, wall: '#d8e0e8', roof: '#374863' },
      { x: -24, z: 46,  w: 13, d: 13, h: 12.5, wall: '#e5d9c3', roof: '#8f3b2e' },
      { x:  24, z: 44,  w: 13, d: 12, h: 11.5, wall: '#ced7e2', roof: '#3c4a6b' },
      { x: -24, z: -20, w: 13, d: 12, h: 11.5, wall: '#dfd5c3', roof: '#9f4335' },
      { x:  24, z: -22, w: 13, d: 12, h: 12.0, wall: '#d4dde6', roof: '#374863' },
      { x: -64, z: 95,  w: 14, d: 14, h: 13.0, wall: '#e6dccb', roof: '#8f3b2e' },
      { x:  64, z: 95,  w: 14, d: 14, h: 13.5, wall: '#d6dce6', roof: '#3c4a6b' },
      { x: -66, z: -18, w: 14, d: 12, h: 11.0, wall: '#dfd4be', roof: '#9f4335' },
      { x:  66, z: -18, w: 14, d: 12, h: 11.0, wall: '#ced7e2', roof: '#374863' }
    ];

    const timberMat = this.mat(0x281f2e, { roughness: 0.72 });
    const stoneTrimMat = this.mat(0x4b556b, { roughness: 0.78 });
    const chimneyMat = this.mat(0x525d73, { roughness: 0.85 });

    houseConfigs.forEach((cfg, idx) => {
      const hGroup = new THREE.Group();
      hGroup.position.set(cfg.x, 0, cfg.z);
      const facing = cfg.x < 0 ? 1 : -1;

      const wallMat = this.mat(0xffffff, {
        map: ProceduralTextures.createVillagePlasterTexture(cfg.wall, '#2a2030'),
        roughness: 0.78
      });
      const bodyGeo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
      const body = new THREE.Mesh(bodyGeo, wallMat);
      body.position.y = cfg.h * 0.5;
      body.castShadow = true;
      body.add(CustomShaders.createInkOutlineMesh(bodyGeo, 0.05, 0x0b0d18));
      hGroup.add(body);

      const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(cfg.w + 0.5, 1.5, cfg.d + 0.5), stoneTrimMat);
      basePlinth.position.y = 0.75;
      hGroup.add(basePlinth);

      const roofMat = this.mat(0xffffff, {
        map: ProceduralTextures.createTerracottaRoofTexture(cfg.roof, '#d97a54'),
        roughness: 0.62
      });
      const roofH = 5.4;
      const roofRadius = Math.max(cfg.w, cfg.d) * 0.82;
      const roofGeo = new THREE.ConeGeometry(roofRadius, roofH, 4);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = cfg.h + roofH * 0.48;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      roof.add(CustomShaders.createInkOutlineMesh(roofGeo, 0.05, 0x0b0d18));
      hGroup.add(roof);

      const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.8, 1.4), chimneyMat);
      chimney.position.set(cfg.w * 0.25 * facing, cfg.h + 2.4, -cfg.d * 0.2);
      hGroup.add(chimney);

      const porch = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 3.4), timberMat);
      porch.position.set(facing * (cfg.w * 0.5 + 0.8), 1.6, 0);
      hGroup.add(porch);

      this.scene.add(hGroup);
      this.addCollider(cfg.x, cfg.z, cfg.w + 1.0, cfg.d + 1.0, cfg.h + 5.5, 0);

      this.swingAnchors.push(new THREE.Vector3(cfg.x + facing * (cfg.w * 0.5 + 1.5), cfg.h + 4.2, cfg.z));

      if (idx % 2 === 0 && Math.abs(cfg.x) < 35) {
        this.createStreetlamp(cfg.x < 0 ? -11.5 : 11.5, 0, cfg.z, cfg.x < 0 ? 1 : -1);
      }
    });
  }

  createStreetlamp(x, y, z, armDir) {
    const ironMat = this.mat(0x1e2536, { metalness: 0.78, roughness: 0.34 });
    const glowMat = this.mat(0xfef3c7, { emissive: 0xf59e0b, emissiveIntensity: 2.2 });

    const g = new THREE.Group();
    g.position.set(x, y, z);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.26, 6.8, 8), ironMat);
    pole.position.y = 3.4;
    pole.castShadow = true;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.16), ironMat);
    arm.position.set(armDir * 0.7, 6.5, 0);
    const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), glowMat);
    lantern.position.set(armDir * 1.35, 6.0, 0);
    g.add(pole, arm, lantern);
    this.scene.add(g);

    this.addCollider(x, z, 0.9, 0.9, 7.0, y);
    this.swingAnchors.push(new THREE.Vector3(x + armDir * 0.8, 7.6, z));
    this.brazierLights.push({
      pos: new THREE.Vector3(x + armDir * 1.35, 6.0, z),
      r: 1.0, g: 0.68, b: 0.25, range: 15.0
    });
  }

  buildAlpineForestAndProps() {
    const trunkMat = this.mat(0x4a2f21, { roughness: 0.85 });
    const pineDark = this.mat(0x1b6b4f, { roughness: 0.72, rimColor: 0x6ee7b7, rimStrength: 0.28 });
    const pineLight = this.mat(0x28855e, { roughness: 0.68, rimColor: 0xfef08a, rimStrength: 0.34 });
    const boulderMat = this.mat(0x475569, { roughness: 0.8, rimColor: 0x94a3b8, rimStrength: 0.22 });

    const coords = [
      [-48, 130], [-95, 118], [-92, 68], [-88, -50], [-48, -68],
      [48, 130],  [95, 118],  [92, 68],  [88, -50],  [48, -68],
      [-55, 185], [55, 185],  [-110, 15], [110, 15],
      [-74, 155], [74, 155],  [-68, 28], [68, 28]
    ];

    coords.forEach(([px, pz], idx) => {
      const tree = new THREE.Group();
      const s = 1.15 + (idx % 3) * 0.28;
      const gy = this.getGroundHeight(px, pz);
      tree.position.set(px, gy, pz);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * s, 0.48 * s, 2.8 * s, 5), trunkMat);
      trunk.position.y = 1.4 * s;
      trunk.castShadow = true;
      tree.add(trunk);

      const mat = idx % 2 === 0 ? pineDark : pineLight;
      for (let tier = 0; tier < 3; tier++) {
        const coneGeo = new THREE.ConeGeometry((2.4 - tier * 0.55) * s, (3.4 - tier * 0.4) * s, 5);
        const cone = new THREE.Mesh(coneGeo, mat);
        cone.position.y = (3.4 + tier * 1.85) * s;
        cone.rotation.y = tier * 0.65;
        cone.castShadow = true;
        cone.add(CustomShaders.createInkOutlineMesh(coneGeo, 0.04, 0x091314));
        tree.add(cone);
      }
      if (idx % 2 === 0) {
        const rockGeo = new THREE.IcosahedronGeometry(0.85 * s, 1);
        const rp = rockGeo.attributes.position;
        for (let k = 0; k < rp.count; k++) {
          const rx = rp.getX(k), ry = rp.getY(k), rz = rp.getZ(k);
          rp.setXYZ(k, rx * 1.15, ry < 0 ? ry * 0.45 : ry * 0.72, rz * 1.05);
        }
        rockGeo.computeVertexNormals();
        const rock = new THREE.Mesh(rockGeo, boulderMat);
        rock.position.set(1.3 * s, 0.35 * s, 0.7 * s);
        rock.rotation.set(0.1, idx, 0.08);
        tree.add(rock);
      }
      this.scene.add(tree);
      this.addCollider(px, pz, 1.9, 1.9, 9.5, gy);
    });
  }

  buildGiantArcologySphere() {
    const sphereGroup = new THREE.Group();
    sphereGroup.position.set(215, 118, -765);

    const creamMat = this.mat(0xe6d6a6, {
      roughness: 0.45, metalness: 0.16,
      rimColor: 0xffedd5, rimStrength: 0.68, halftone: 0.09
    });
    const bandMat = this.mat(0x9a7d48, { metalness: 0.6, roughness: 0.35 });

    const sphereGeo = new THREE.SphereGeometry(72, 36, 28);
    const dome = new THREE.Mesh(sphereGeo, creamMat);

    const eqRing = new THREE.Mesh(new THREE.TorusGeometry(73.2, 1.4, 10, 48), bandMat);
    eqRing.rotation.x = Math.PI / 2;
    eqRing.position.y = -8;

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(32, 48, 72, 16), creamMat);
    pedestal.position.y = -82;

    sphereGroup.add(dome, eqRing, pedestal);
    this.scene.add(sphereGroup);
  }

  // Gothic Cathedral & Throne Room of Castle Doom (Phase 5 at baseY = 0.0, z = -505..-622)
  buildCastleDoom() {
    const baseY = 0.0;
    const zOff = -400; // Shifts original (-105..-172) seamlessly to (-505..-622)
    const gothicMat = this.mat(0xffffff, { map: ProceduralTextures.createGothicStoneTexture(), roughness: 0.78 });
    const marbleMat = this.mat(0xffffff, { map: ProceduralTextures.createThroneMarbleTexture(), roughness: 0.44, metalness: 0.16 });
    const ironMat = this.mat(0x525c6b, { metalness: 0.88, roughness: 0.25, rimColor: 0x6ee7b7 });
    const emeraldGlow = this.mat(0x6ee7b7, { emissive: 0x10b981, emissiveIntensity: 2.1 });
    const goldMat = this.mat(0xd4a848, { metalness: 0.88, roughness: 0.26, rimColor: 0xfef08a });
    const stainedMat = this.mat(0xffffff, {
      map: ProceduralTextures.createStainedGlassTexture(),
      emissive: 0x10b981, emissiveIntensity: 1.35, doubleSided: true
    });

    // Cathedral Marble Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(62, 1.2, 128), marbleMat);
    floor.position.set(0, baseY - 0.6, -562);
    this.scene.add(floor);
    this.addShadowOverlay(60, 124, 0, baseY + 0.03, -562);

    // Grand Emerald Sigil & Imperial Carpet
    const sigilMat = CustomShaders.createEldritchMandalaMaterial(0x10b981);
    sigilMat.uniforms.uAlpha.value = 0.44;
    const sigil = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), sigilMat);
    sigil.rotation.x = -Math.PI / 2;
    sigil.position.set(0, baseY + 0.05, -565);
    this.scene.add(sigil);

    const carpet = new THREE.Mesh(
      new THREE.BoxGeometry(7.8, 0.08, 94),
      this.mat(0x0a3425, { roughness: 0.78, rimColor: 0xd4a848, rimStrength: 0.18 })
    );
    carpet.position.set(0, baseY + 0.05, -558);
    this.scene.add(carpet);
    for (const s of [-1, 1]) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.10, 94), goldMat);
      trim.position.set(s * 3.95, baseY + 0.06, -558);
      this.scene.add(trim);
    }

    // Front Gate Towers & Ogival Archway (z = -505)
    for (const s of [-1, 1]) {
      const gateWall = new THREE.Mesh(new THREE.BoxGeometry(20, 28, 4.4), gothicMat);
      gateWall.position.set(s * 18.5, baseY + 14, -505);
      gateWall.castShadow = true;
      gateWall.add(CustomShaders.createInkOutlineMesh(gateWall.geometry, 0.08, 0x090b15));
      this.scene.add(gateWall);
      this.addCollider(s * 18.5, -505, 20, 4.8, 28, baseY);

      const tower = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 5.0, 38, 8), gothicMat);
      tower.position.set(s * 28.5, baseY + 19, -505);
      tower.castShadow = true;
      tower.add(CustomShaders.createInkOutlineMesh(tower.geometry, 0.08, 0x090b15));
      const spire = new THREE.Mesh(new THREE.ConeGeometry(5.0, 14, 8), this.mat(0x1b4332, { roughness: 0.5 }));
      spire.position.set(s * 28.5, baseY + 45, -505);
      this.scene.add(tower, spire);
      this.addCollider(s * 28.5, -505, 9.6, 9.6, 42, baseY);
      this.swingAnchors.push(new THREE.Vector3(s * 10.0, baseY + 21.0, -510));
    }

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(19, 8.0, 4.6), gothicMat);
    lintel.position.set(0, baseY + 24, -505);
    this.scene.add(lintel);

    // Emerald 3-Seal Imperial Barrier at Castle Gate (z = -504)
    const barrierGroup = new THREE.Group();
    barrierGroup.position.set(0, baseY + 11, -504.5);
    const barrierMat = CustomShaders.createEnergyShieldMaterial(0x10b981);
    barrierMat.side = THREE.DoubleSide;
    const barrierWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 22), barrierMat);
    const barrierFrame = new THREE.Mesh(
      new THREE.TorusGeometry(6.5, 0.35, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    );
    barrierGroup.add(barrierWall, barrierFrame);
    this.scene.add(barrierGroup);
    this.castleBarrier = barrierGroup;

    // Cathedral Side Walls + Stained Glass + God-Rays + 3D Wall Colliders
    for (const s of [-1, 1]) {
      const sideWall = new THREE.Mesh(new THREE.BoxGeometry(2.6, 30, 120), gothicMat);
      sideWall.position.set(s * 29.0, baseY + 15, -565);
      this.scene.add(sideWall);
      this.addCollider(s * 29.0, -565, 3.2, 120, 32, baseY);

      for (let w = 0; w < 4; w++) {
        const wz = -525 - w * 24;
        const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 14.5), stainedMat);
        winMesh.position.set(s * 27.6, baseY + 15.0, wz);
        winMesh.rotation.y = -s * Math.PI / 2;
        this.scene.add(winMesh);

        const rayGeo = new THREE.CylinderGeometry(2.8, 5.6, 28, 12, 1, true);
        const rayMat = CustomShaders.createGodRayMaterial(0x6ee7b7, 0.14);
        const ray = new THREE.Mesh(rayGeo, rayMat);
        ray.position.set(s * 18.5, baseY + 9.0, wz);
        ray.rotation.z = s * 0.72;
        this.scene.add(ray);
      }
    }

    // Back Cathedral Wall + Rose Window (z = -625)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(62, 34, 3.2), gothicMat);
    backWall.position.set(0, baseY + 17, -625);
    this.scene.add(backWall);
    this.addCollider(0, -625, 62, 3.8, 34, baseY);

    const roseWin = new THREE.Mesh(new THREE.CircleGeometry(7.2, 24), stainedMat);
    roseWin.position.set(0, baseY + 19.5, -623.2);
    const roseRim = new THREE.Mesh(new THREE.TorusGeometry(7.3, 0.45, 8, 24), ironMat);
    roseRim.position.set(0, baseY + 19.5, -623.1);
    const roseRay = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 8.2, 34, 14, 1, true),
      CustomShaders.createGodRayMaterial(0x6ee7b7, 0.22)
    );
    roseRay.position.set(0, baseY + 11.0, -610.0);
    roseRay.rotation.x = -0.68;
    this.scene.add(roseWin, roseRim, roseRay);

    // Chandeliers + Pillars + Vaulted Gothic Ceiling Cross-Ribs
    for (const cz of [-535, -565, -590]) {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 14.5, 6), ironMat);
      chain.position.set(0, baseY + 26.2, cz);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.24, 8, 16), ironMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, baseY + 19.0, cz);
      const flameOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), emeraldGlow);
      flameOrb.position.set(0, baseY + 19.3, cz);
      this.scene.add(chain, ring, flameOrb);
    }

    const roofCanopy = new THREE.Mesh(new THREE.BoxGeometry(62, 1.4, 122), gothicMat);
    roofCanopy.position.set(0, baseY + 34.2, -565);
    this.scene.add(roofCanopy);

    const bannerMat = this.mat(0xffffff, {
      map: ProceduralTextures.createDoomBannerTexture(),
      roughness: 0.7, doubleSided: true
    });
    for (let z = -525; z >= -605; z -= 26) {
      for (const s of [-1, 1]) {
        const px = s * 18.0;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.45, 31, 10), gothicMat);
        col.position.set(px, baseY + 15.5, z);
        col.castShadow = true;
        col.add(CustomShaders.createInkOutlineMesh(col.geometry, 0.05, 0x090b15));
        this.scene.add(col);
        this.addCollider(px, z, 3.0, 3.0, 31, baseY);
        this.swingAnchors.push(new THREE.Vector3(px, baseY + 18.5, z));

        const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 9.2), bannerMat);
        banner.position.set(px - s * 1.45, baseY + 13.5, z);
        banner.rotation.y = s * -Math.PI / 2;
        this.scene.add(banner);
      }
    }

    // Raised Octagonal Sovereign Dais, Monoliths & Colossal Doom Effigy (z = -598..-620)
    const dais1 = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 13.2, 0.75, 8), marbleMat);
    dais1.position.set(0, baseY + 0.37, -599);
    const dais2 = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9.8, 0.75, 8), marbleMat);
    dais2.position.set(0, baseY + 1.12, -600);
    const dais3 = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.4, 0.65, 8), ironMat);
    dais3.position.set(0, baseY + 1.8, -601.2);
    const altarRing = new THREE.Mesh(
      new THREE.TorusGeometry(13.8, 0.32, 6, 32),
      emeraldGlow
    );
    altarRing.rotation.x = Math.PI / 2;
    altarRing.position.set(0, baseY + 0.14, -599);
    this.scene.add(dais1, dais2, dais3, altarRing);

    const throne = new THREE.Group();
    throne.position.set(0, baseY + 2.1, -601.5);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.4, 3.1), ironMat);
    seat.position.y = 0.7;
    seat.add(CustomShaders.createInkOutlineMesh(seat.geometry, 0.04, 0x090b15));
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.34, 2.5), this.mat(0x0f3d28));
    cushion.position.y = 1.45;
    for (const s of [-1, 1]) {
      const armRest = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.85, 3.1), ironMat);
      armRest.position.set(s * 1.9, 1.3, 0.1);
      throne.add(armRest);
    }
    for (let i = -3; i <= 3; i++) {
      const h = 8.4 - Math.abs(i) * 0.9;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.48, h, 4), ironMat);
      blade.position.set(i * 0.58, 2.2 + h * 0.45, -1.25);
      blade.rotation.z = -i * 0.09;
      throne.add(blade);
    }
    const throneCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.78, 0), emeraldGlow);
    throneCrest.position.set(0, 8.2, -0.85);
    throne.add(seat, cushion, throneCrest);
    this.scene.add(throne);
    this.addCollider(0, -601.5, 4.8, 4.2, 11, baseY);
    this.animatedObjects.push({ type: 'spin', mesh: throneCrest, speed: 1.4 });

    // Colossal Doom Mask Effigy & Twin Floating Emerald Monoliths framing the Throne
    const effigyGrp = new THREE.Group();
    effigyGrp.position.set(0, baseY + 12.5, -621);
    const skull = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 3.2, 10.5, 6), ironMat);
    skull.add(CustomShaders.createInkOutlineMesh(skull.geometry, 0.14, 0x090b15));
    const effigyHood = new THREE.Mesh(new THREE.ConeGeometry(6.8, 13.5, 6), this.mat(0x0c3824, { roughness: 0.6 }));
    effigyHood.position.set(0, 2.4, -1.2);
    const effigyCrown = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.48, 6, 8), goldMat);
    effigyCrown.rotation.x = Math.PI / 2;
    effigyCrown.position.y = 4.6;
    for (const s of [-1, 1]) {
      const eyeGlow = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 0.5), emeraldGlow);
      eyeGlow.position.set(s * 1.55, 1.4, 3.6);
      eyeGlow.rotation.z = -s * 0.2;
      effigyGrp.add(eyeGlow);
    }
    effigyGrp.add(skull, effigyHood, effigyCrown);
    this.scene.add(effigyGrp);

    for (const s of [-1, 1]) {
      const mono = new THREE.Mesh(new THREE.OctahedronGeometry(2.8, 0), emeraldGlow);
      mono.scale.set(0.95, 3.2, 0.95);
      mono.position.set(s * 14.5, baseY + 11.5, -603);
      mono.add(CustomShaders.createInkOutlineMesh(mono.geometry, 0.08, 0x064e3b));
      this.scene.add(mono);
      this.animatedObjects.push({ type: 'spin', mesh: mono, speed: s * 0.9 });
    }

    // 4 Colossal Exterior Citadel Bastion Towers (68m-84m) + Vaulted Cathedral Arches
    [[-40, -505, 68], [40, -505, 68], [-42, -620, 82], [42, -620, 82]].forEach(([tx, tz, th], idx) => {
      const tMesh = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 7.6, th, 8), gothicMat);
      tMesh.position.set(tx, baseY + th * 0.5 - 12, tz);
      tMesh.add(CustomShaders.createInkOutlineMesh(tMesh.geometry, 0.14, 0x090b15));
      const spire = new THREE.Mesh(new THREE.ConeGeometry(7.2, 22, 8), this.mat(0x0c3824, { roughness: 0.48 }));
      spire.position.set(tx, baseY + th - 1, tz);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.48, 6, 16), emeraldGlow);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(tx, baseY + th - 14, tz);
      const crownOrb = new THREE.Mesh(new THREE.OctahedronGeometry(2.2, 0), goldMat);
      crownOrb.position.set(tx, baseY + th + 12, tz);
      this.scene.add(tMesh, spire, ring, crownOrb);
      this.addCollider(tx, tz, 13.5, 13.5, th, baseY);
      this.animatedObjects.push({ type: 'spin', mesh: crownOrb, speed: 0.9 + idx * 0.2 });
    });

    for (const az of [-522, -548, -574, -600]) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(28.5, 1.35, 6, 12, Math.PI), ironMat);
      arch.position.set(0, baseY + 26, az);
      this.scene.add(arch);
    }

    // Monumental Outer Citadel Courtyards, Ramparts, Reactor Trenches & 320m Sky-Beam
    const trenchMat = typeof CustomShaders.createEmeraldAbyssMaterial === 'function'
      ? CustomShaders.createEmeraldAbyssMaterial()
      : emeraldGlow;
    for (const s of [-1, 1]) {
      const yardFloor = new THREE.Mesh(new THREE.BoxGeometry(106, 0.8, 174), marbleMat);
      yardFloor.position.set(s * 86, baseY - 0.35, -590);
      this.scene.add(yardFloor);

      // Crenellated Outer Curtain Walls + Ramparts
      const sideRamp = new THREE.Mesh(new THREE.BoxGeometry(5.0, 18, 176), gothicMat);
      sideRamp.position.set(s * 138, baseY + 9, -592);
      sideRamp.add(CustomShaders.createInkOutlineMesh(sideRamp.geometry, 0.08, 0x090b15));
      this.scene.add(sideRamp);
      this.addCollider(s * 138, -592, 5.6, 176, 19, baseY);

      for (const rz of [-506, -676]) {
        const endRamp = new THREE.Mesh(new THREE.BoxGeometry(104, 16, 5.0), gothicMat);
        endRamp.position.set(s * 88, baseY + 8, rz);
        this.scene.add(endRamp);
        this.addCollider(s * 88, rz, 104, 5.6, 17, baseY);
      }

      // 3 Outer Spire Watchtowers per Wing
      [-508, -592, -674].forEach((tz) => {
        const wx = s * 134;
        const wt = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 5.8, 42, 8), gothicMat);
        wt.position.set(wx, baseY + 21, tz);
        const wsp = new THREE.Mesh(new THREE.ConeGeometry(5.4, 16, 8), this.mat(0x0c3824, { roughness: 0.5 }));
        wsp.position.set(wx, baseY + 49, tz);
        const worb = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), emeraldGlow);
        worb.position.set(wx, baseY + 59, tz);
        this.scene.add(wt, wsp, worb);
        this.addCollider(wx, tz, 10.6, 10.6, 44, baseY);
        this.swingAnchors.push(new THREE.Vector3(wx, baseY + 34, tz));
      });

      // Sunken Emerald Reactor Trench + Iron Catwalk Bridges
      const trench = new THREE.Mesh(new THREE.PlaneGeometry(14, 98, 8, 24), trenchMat);
      trench.rotation.x = -Math.PI / 2;
      trench.position.set(s * 66, baseY + 0.14, -590);
      this.scene.add(trench);
      [-558, -622].forEach((cz) => {
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 6.5), ironMat);
        bridge.position.set(s * 66, baseY + 0.35, cz);
        this.scene.add(bridge);
      });

      // Courtyard Gargoyle Buttresses & Green Cauldrons
      [-532, -572, -612, -652].forEach((bz) => {
        const pil = new THREE.Mesh(new THREE.BoxGeometry(3.2, 12, 3.2), gothicMat);
        pil.position.set(s * 102, baseY + 6, bz);
        this.scene.add(pil);
        this.addCollider(s * 102, bz, 3.6, 3.6, 13, baseY);
        this.addBrazier(s * 96, baseY, bz);
      });
    }

    // 320m Emerald Incursion Sky-Beam piercing the Storm Clouds
    const skyBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 11.0, 320, 16, 1, true),
      CustomShaders.createGodRayMaterial(0x10b981, 0.28)
    );
    skyBeam.position.set(0, baseY + 160, -624);
    this.scene.add(skyBeam);

    // Avenue of Judgment: 8 Colossal Doom Guardians flanking the Moat Causeway (y = 0.0)
    for (let i = 0; i < 4; i++) {
      const sz = -406 - i * 24;
      for (const s of [-1, 1]) {
        const st = new THREE.Group();
        st.position.set(s * 20.5, 0.0, sz);
        st.rotation.y = -s * Math.PI / 2;
        const ped = new THREE.Mesh(new THREE.BoxGeometry(4.4, 12.0, 4.4), gothicMat);
        ped.position.y = -2.0;
        const body = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.9, 8.2, 8), ironMat);
        body.position.y = 8.1;
        body.add(CustomShaders.createInkOutlineMesh(body.geometry, 0.06, 0x090b15));
        const head = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 1.8), ironMat);
        head.position.y = 13.0;
        const hood = new THREE.Mesh(new THREE.ConeGeometry(2.1, 3.2, 8), this.mat(0x0c3824));
        hood.position.y = 14.8;
        const cape = new THREE.Mesh(new THREE.BoxGeometry(3.6, 9.5, 0.4), this.mat(0x0a3425));
        cape.position.set(0, 7.5, -1.2);
        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 14.5, 6), goldMat);
        staff.position.set(0, 7.5, 2.0);
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), emeraldGlow);
        gem.position.set(0, 15.0, 2.0);
        st.add(ped, body, head, hood, cape, staff, gem);
        this.scene.add(st);
        this.addCollider(s * 20.5, sz, 4.6, 4.6, 15, 0);
        this.addBrazier(s * 12.6, 0.0, sz);
      }
    }

    // 6 Floating Arcane Obelisks encircling Throne Arena (x: ±18, z: -550, -575, -600)
    [[-18, -550], [18, -550], [-20, -575], [20, -575], [-18, -600], [18, -600]].forEach(([ox, oz], oIdx) => {
      const obelisk = new THREE.Group();
      obelisk.position.set(ox, baseY + 6.5, oz);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(1.2, 7.5, 4), ironMat);
      spire.position.y = 1.0;
      const runeRing = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.16, 6, 16), emeraldGlow);
      runeRing.rotation.x = Math.PI / 2;
      const coreOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), emeraldGlow);
      coreOrb.position.y = 2.2;
      obelisk.add(spire, runeRing, coreOrb);
      this.scene.add(obelisk);
      this.animatedObjects.push({ type: 'spin', mesh: obelisk, speed: (oIdx % 2 === 0 ? 1 : -1) * 0.8 });
    });

    [[-12, -525], [12, -525], [-12, -585], [12, -585]].forEach(([bx, bz]) => {
      this.addBrazier(bx, baseY, bz);
    });
  }

  // Scenic Plaza Pedestal (0, 0, 278) overlooking unified flat Latveria plain
  buildHeroSelectionOverlook() {
    const g = new THREE.Group();
    g.position.set(0, 0.0, 278.0);

    const stoneMat = this.mat(0x283245, { map: ProceduralTextures.createGothicStoneTexture(), roughness: 0.65 });
    const goldMat = this.mat(0xd4a848, { metalness: 0.88, roughness: 0.25, rimColor: 0xfef08a });

    const deckGeo = new THREE.CylinderGeometry(2.45, 2.85, 0.55, 10);
    const deck = new THREE.Mesh(deckGeo, stoneMat);
    deck.position.y = -0.28;
    deck.add(CustomShaders.createInkOutlineMesh(deckGeo, 0.025, 0x090b15));

    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.38, 0.055, 8, 24), goldMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.015;

    const shadowOverlay = new THREE.Mesh(
      new THREE.CircleGeometry(2.2, 20),
      new THREE.ShadowMaterial({ color: 0x161036, opacity: 0.42, depthWrite: false })
    );
    shadowOverlay.rotation.x = -Math.PI / 2;
    shadowOverlay.position.y = 0.02;
    shadowOverlay.receiveShadow = true;

    const runeMat = CustomShaders.createEldritchMandalaMaterial(0xef4444);
    const runePlane = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), runeMat);
    runePlane.rotation.x = -Math.PI / 2;
    runePlane.position.y = 0.025;

    g.add(deck, ring, shadowOverlay, runePlane);
    this.scene.add(g);
    this.addCollider(0, 278.0, 5.4, 5.4, 0.35, -0.5);

    this.showcaseGroup = g;
    this.showcaseRuneMat = runeMat;
  }

  buildAmbientMotes() {
    const count = 560;
    const pos = new Float32Array(count * 3);
    this.moteVel = [];
    for (let i = 0; i < count; i++) {
      const inDoom = i > count * 0.52;
      pos[i * 3] = (Math.random() - 0.5) * (inDoom ? 260 : 960);
      pos[i * 3 + 1] = 1.5 + Math.random() * 22;
      pos[i * 3 + 2] = inDoom ? -370 - Math.random() * 310 : 620 - Math.random() * 920;
      this.moteVel.push(0.28 + Math.random() * 0.65);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xa7f3d0, size: 0.38, transparent: true, opacity: 0.72,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.ambientMotes = new THREE.Points(geo, mat);
    this.scene.add(this.ambientMotes);
  }

  update(delta, time) {
    this.animatedObjects.forEach((obj) => {
      if (obj.type === 'spin') {
        obj.mesh.rotation.y = time * obj.speed;
      }
    });

    if (this.castleBarrier && !this.castleBarrierUnlocked) {
      this.castleBarrier.children[1].rotation.z = time * 0.9;
    }

    if (this.ambientMotes) {
      const pos = this.ambientMotes.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i) + Math.sin(time * 0.9 + i) * delta * 0.35;
        let y = pos.getY(i) + this.moteVel[i] * delta;
        const z = pos.getZ(i);
        const minY = 1.0;
        if (y > minY + 20) y = minY;
        pos.setXY(i, x, y);
      }
      pos.needsUpdate = true;
    }
  }
}

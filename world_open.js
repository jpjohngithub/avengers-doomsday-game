// ============================================================================
// AVENGERS: DOOMSDAY — 1400m OPEN WORLD EXPANSION (5 BIOMES, SEALS & RIFT)
// ============================================================================

(function () {
  if (typeof LatveriaWorld === 'undefined') return;

  const _origInit = LatveriaWorld.prototype.init;
  const _origUpdate = LatveriaWorld.prototype.update;

  LatveriaWorld.prototype.init = function () {
    this.energyTowers = [];
    this.fastTravelPortals = [];
    this.sealObelisks = [];
    this.airships = [];
    this.skyBirds = [];
    this.lootCrystals = [];
    _origInit.call(this);
    this.buildConnectingRoadsAndGates();
    this.buildDarkForestBiome();
    this.buildSentinelCraterBiome();
    this.buildTundraGlacialBiome();
    this.buildSouthernBiomes();
    this.buildExpandedOuterLandmarks();
    this.buildMultiverseRift();
    this.buildFastTravelPortals();
    this.buildSealObelisks();
    this.buildEnergyTowers();
    this.buildBossArenas();
    this.buildLivingWorldElements();
    this.buildDenseContinentalScenery();
  };

  LatveriaWorld.prototype.canPlaceProp = function (x, z, padRadius = 3.5) {
    // Exclude Menu Hero Showcase Overlook (0, 0, 278) & Player Spawn Plaza (0, 0, 165)
    if (Math.hypot(x, z - 278) < 38 + padRadius) return false;
    if (Math.hypot(x, z - 165) < 16 + padRadius) return false;
    // Exclude Imperial Avenue, Bridges & Castle Doom + Moat (Strict 40m+ Clear Corridor)
    if (Math.abs(x) < 22 + padRadius && z > -690 && z < 635) return false;
    if (z <= -395 && z >= -690 && Math.abs(x) <= 165) return false;
    // Exclude Fast Travel Portal Pads
    if (this.fastTravelPortals) {
      for (let i = 0; i < this.fastTravelPortals.length; i++) {
        const pt = this.fastTravelPortals[i].pos;
        if (Math.hypot(x - pt.x, z - pt.z) < 9.5 + padRadius) return false;
      }
    }
    // Exclude Boss Arenas across map
    if (Math.hypot(x, z + 45) < 26 + padRadius) return false;
    if (Math.hypot(x + 330, z - 30) < 46 + padRadius) return false;
    if (Math.hypot(x - 330, z - 30) < 54 + padRadius) return false;
    if (Math.hypot(x, z + 295) < 48 + padRadius) return false;
    if (Math.hypot(x + 560, z - 540) < 58 + padRadius) return false;
    if (Math.hypot(x - 560, z - 540) < 58 + padRadius) return false;
    // Exclude East-West Roads (z ~ 30) and South Roads (z ~ 490)
    if (Math.abs(z - 30) < 11 + padRadius && Math.abs(x) < 1260) return false;
    if (Math.abs(z - 490) < 12 + padRadius && Math.abs(x) < 620) return false;
    // Exclude Latver River meandering trench & banks
    if (z < -76 && z > -148) {
      const rc = -108 + Math.sin(x * 0.025) * 14;
      if (Math.abs(z - rc) < 23 + padRadius) return false;
    }
    // Exclude Swimmable Lakes
    if (this.lakes) {
      for (let i = 0; i < this.lakes.length; i++) {
        if (Math.hypot(x - this.lakes[i].x, z - this.lakes[i].z) < this.lakes[i].r + 5.5 + padRadius) return false;
      }
    }
    // Exclude Existing Buildings
    for (let i = 0; i < this.buildingBoxes.length; i++) {
      const b = this.buildingBoxes[i];
      if (b.w === undefined || b.d === undefined) continue;
      if (Math.abs(x - b.x) < b.w * 0.5 + padRadius && Math.abs(z - b.z) < b.d * 0.5 + padRadius) return false;
    }
    return true;
  };

  LatveriaWorld.prototype.buildTerrainConformingRoad = function (x0, z0, x1, z1, width, steps, mat) {
    const geo = new THREE.PlaneGeometry(1, 1, 2, steps);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len;
    const nz = dx / len;
    for (let i = 0; i < pos.count; i++) {
      const uSide = pos.getX(i); // -0.5 .. +0.5
      const vFrac = pos.getZ(i) + 0.5; // 0 .. 1
      const wx = x0 + dx * vFrac + nx * (uSide * width);
      const wz = z0 + dz * vFrac + nz * (uSide * width);
      const wy = this.getGroundHeight(wx, wz) + 0.09;
      pos.setXYZ(i, wx, wy, wz);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.receiveShadow = true;
    this.scene.add(m);
  };

  LatveriaWorld.prototype.buildConnectingRoadsAndGates = function () {
    const stoneMat = this.mat(0x475569, { map: ProceduralTextures.createCobblestoneTexture(), roughness: 0.78 });

    // Terrain-Conforming West Road & East Road (extended across all biomes!)
    this.buildTerrainConformingRoad(-12, 30, -900, 30, 14.0, 72, stoneMat);
    this.buildTerrainConformingRoad(12, 30, 900, 30, 14.0, 72, stoneMat);

    // North Tundra Causeway conforming smoothly to relief
    this.buildTerrainConformingRoad(0, -144, 0, -362, 18.0, 36, stoneMat);

    // Southern Highlands, Vibranium Jungle & Asgard Ruins Roads (branching safely around Menu Pedestal at 0,278)
    this.buildTerrainConformingRoad(0, 220, 0, 245, 16.0, 8, stoneMat);
    this.buildTerrainConformingRoad(0, 245, -44, 285, 13.0, 12, stoneMat);
    this.buildTerrainConformingRoad(0, 245, 44, 285, 13.0, 12, stoneMat);
    this.buildTerrainConformingRoad(-44, 285, 0, 335, 13.0, 12, stoneMat);
    this.buildTerrainConformingRoad(44, 285, 0, 335, 13.0, 12, stoneMat);
    this.buildTerrainConformingRoad(0, 335, 0, 620, 15.0, 36, stoneMat);
    this.buildTerrainConformingRoad(0, 490, -580, 490, 13.5, 48, stoneMat);
    this.buildTerrainConformingRoad(0, 490, 580, 490, 13.5, 48, stoneMat);

    // Outer Act-II Frontier Roads (beyond the Multiverse Gates)
    this.buildTerrainConformingRoad(-910, 30, -1190, -60, 14.0, 30, stoneMat);
    this.buildTerrainConformingRoad(910, 30, 1190, -60, 14.0, 30, stoneMat);
    this.buildTerrainConformingRoad(0, -675, 0, -1140, 16.0, 34, stoneMat);

    // Five Monumental Region Border Archways
    this._buildBorderArch(-145, 30, 0x374151, 0xa855f7, { r: 0.72, g: 0.35, b: 1.0 }, true);
    this._buildBorderArch(145, 30, 0x334155, 0xf97316, { r: 1.0, g: 0.55, b: 0.18 }, true);
    this._buildBorderArch(0, -82, 0x1e293b, 0x10b981, { r: 0.18, g: 0.95, b: 0.58 }, false);
    this._buildBorderArch(-320, 490, 0x115e59, 0x2dd4bf, { r: 0.2, g: 0.9, b: 0.8 }, true);
    this._buildBorderArch(320, 490, 0x78350f, 0xfacc15, { r: 1.0, g: 0.85, b: 0.25 }, true);

    // 3 Post-Doom Frontier Forcefield Gates (Dissolve when Victor Von Doom falls!)
    const shieldMat = CustomShaders.createEnergyShieldMaterial(0xa855f7);
    shieldMat.side = THREE.DoubleSide;
    [
      { x: -910, z: 30, rotY: Math.PI / 2, yOff: 13 },
      { x: 910,  z: 30, rotY: Math.PI / 2, yOff: 13 },
      { x: 0,    z: -682, rotY: 0, yOff: 13 }
    ].forEach(gCfg => {
      const gateMesh = new THREE.Mesh(new THREE.PlaneGeometry(46, 26), shieldMat);
      gateMesh.position.set(gCfg.x, gCfg.yOff, gCfg.z);
      gateMesh.rotation.y = gCfg.rotY;
      this.scene.add(gateMesh);
      this.act2Barriers.push(gateMesh);
    });
  };

  LatveriaWorld.prototype.unlockPostDoomRegions = function () {
    this.postDoomUnlocked = true;
    this.castleBarrierUnlocked = true;
    if (this.act2Barriers) {
      this.act2Barriers.forEach(b => { if (b) b.visible = false; });
    }
    this.buildAct2OuterBiomes();
  };

  LatveriaWorld.prototype.buildAct2OuterBiomes = function () {
    if (this._act2Built) return;
    this._act2Built = true;
    const obsMat = this.mat(0x111827, { roughness: 0.65, metalness: 0.45, rimColor: 0xfacc15, flatShading: true });
    const voidGlow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const magMat = this.mat(0x4c1d95, { metalness: 0.85, roughness: 0.25, rimColor: 0xe879f9 });
    const kangMat = this.mat(0x065f46, { metalness: 0.80, roughness: 0.22, rimColor: 0x22d3ee });
    const cyanGlow = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    // 1. VAZIO ABISSAL (NORTH OUTER: center 0, 12, -1180)
    const vY = this.getGroundHeight(0, -1180);
    const vPad = new THREE.Mesh(new THREE.CylinderGeometry(44, 48, 1.0, 24), obsMat);
    vPad.position.set(0, vY + 0.4, -1180);
    this.scene.add(vPad);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const mx = Math.cos(a) * 46, mz = -1180 + Math.sin(a) * 46;
      const my = this.getGroundHeight(mx, mz);
      const spire = new THREE.Mesh(new THREE.OctahedronGeometry(3.2, 0), obsMat);
      spire.scale.set(0.8, 3.8, 0.8);
      spire.position.set(mx, my + 9, mz);
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), voidGlow);
      core.position.set(mx, spire.position.y + 8, mz);
      this.scene.add(spire, core);
      if (this.addCollider) this.addCollider(mx, mz, 4.4, 4.4, 20, my);
      this.swingAnchors.push(new THREE.Vector3(mx, spire.position.y + 8, mz));
    }

    // 2. CRATERA ASTEROIDE M (WEST OUTER: center -1220, 8, -60)
    const mY = this.getGroundHeight(-1220, -60);
    const mPad = new THREE.Mesh(new THREE.CylinderGeometry(42, 46, 0.9, 24), magMat);
    mPad.position.set(-1220, mY + 0.4, -60);
    this.scene.add(mPad);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const rx = -1220 + Math.cos(a) * 44, rz = -60 + Math.sin(a) * 44;
      const ry = this.getGroundHeight(rx, rz);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(2.5, 16, 2.5), magMat);
      beam.position.set(rx, ry + 8, rz);
      beam.rotation.set(Math.sin(a) * 0.25, a, Math.cos(a) * 0.25);
      this.scene.add(beam);
      if (this.addCollider) this.addCollider(rx, rz, 3.4, 3.4, 17, ry);
      this.swingAnchors.push(new THREE.Vector3(rx, beam.position.y + 6, rz));
    }

    // 3. CIDADELA FORA DO TEMPO (EAST OUTER: center 1220, 12, -60)
    const kY = this.getGroundHeight(1220, -60);
    const kPad = new THREE.Mesh(new THREE.CylinderGeometry(44, 48, 0.9, 12), kangMat);
    kPad.position.set(1220, kY + 0.4, -60);
    this.scene.add(kPad);
    const chronoRing = new THREE.Mesh(new THREE.TorusGeometry(36, 0.9, 8, 36), cyanGlow);
    chronoRing.rotation.x = Math.PI / 2;
    chronoRing.position.set(1220, kY + 26, -60);
    this.scene.add(chronoRing);
    this.animatedObjects.push({ type: 'spin', mesh: chronoRing, speed: 0.7 });
  };

  LatveriaWorld.prototype._buildBorderArch = function (gx, gz, stoneHex, glowHex, lightRgb, rotatedZ = true) {
    const stoneMat = this.mat(stoneHex, { map: ProceduralTextures.createGothicStoneTexture(), roughness: 0.72 });
    const trimMat = this.mat(0x1f2937, { metalness: 0.75, roughness: 0.30 });
    const roofMat = this.mat(0x1e293b, { roughness: 0.55 });
    const glowMat = new THREE.MeshBasicMaterial({ color: glowHex });
    const gy = this.getGroundHeight(gx, gz);
    const grp = new THREE.Group();
    grp.position.set(gx, gy, gz);
    if (!rotatedZ) grp.rotation.y = Math.PI / 2;

    [-1, 1].forEach(side => {
      const basePlinth = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.0, 2.2, 8), trimMat);
      basePlinth.position.set(0, 1.1, side * 10.2);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.35, 16.5, 8), stoneMat);
      tower.position.set(0, 9.4, side * 10.2);
      tower.castShadow = true;
      tower.add(CustomShaders.createInkOutlineMesh(tower.geometry, 0.05, 0x090b15));
      const spire = new THREE.Mesh(new THREE.ConeGeometry(2.6, 5.2, 8), roofMat);
      spire.position.set(0, 20.2, side * 10.2);
      const collar = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.22, 6, 12), glowMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(0, 17.5, side * 10.2);
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), glowMat);
      orb.position.set(0, 23.4, side * 10.2);
      grp.add(basePlinth, tower, spire, collar, orb);

      const worldX = gx + (rotatedZ ? 0 : side * 10.2);
      const worldZ = gz + (rotatedZ ? side * 10.2 : 0);
      this.addCollider(worldX, worldZ, 4.8, 4.8, 20, gy);
      this.swingAnchors.push(new THREE.Vector3(worldX, gy + 21.0, worldZ));
    });

    const archRing = new THREE.Mesh(new THREE.TorusGeometry(10.2, 1.45, 7, 16, Math.PI), stoneMat);
    archRing.position.set(0, 12.2, 0);
    archRing.rotation.y = Math.PI / 2;
    archRing.add(CustomShaders.createInkOutlineMesh(archRing.geometry, 0.05, 0x090b15));
    const keystone = new THREE.Mesh(new THREE.OctahedronGeometry(1.35, 0), glowMat);
    keystone.position.set(0, 22.4, 0);
    grp.add(archRing, keystone);
    this.scene.add(grp);
    this.brazierLights.push({ pos: new THREE.Vector3(gx, gy + 15, gz), r: lightRgb.r, g: lightRgb.g, b: lightRgb.b, range: 26.0 });
  };

  // BIOME 2: FLORESTA NEGRA (WEST: center -330, 6, 30)
  LatveriaWorld.prototype.buildDarkForestBiome = function () {
    const barkMat = this.mat(0x1f1629, { roughness: 0.92, rimColor: 0xa855f7, rimStrength: 0.28 });
    const leafMat = this.mat(0x132a24, { roughness: 0.78, rimColor: 0x34d399, rimStrength: 0.25 });
    const ruinMat = this.mat(0x312e47, { map: ProceduralTextures.createGothicStoneTexture(), roughness: 0.85 });
    const arcaneMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
    const mushCapMat = this.mat(0x9333ea, { emissive: 0x6b21a8, emissiveIntensity: 0.65, rimColor: 0xf0abfc });

    // Baron Mordo Sanctuary Plaza (-330, 6, 30)
    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(36, 38, 0.5, 24),
      this.mat(0x1e2538, { map: ProceduralTextures.createGothicStoneTexture(), roughness: 0.75 })
    );
    plaza.position.set(-330, 0.05, 30);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    const runeMat = CustomShaders.createEldritchMandalaMaterial(0xa855f7);
    runeMat.uniforms.uAlpha.value = 0.6;
    const rune = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), runeMat);
    rune.rotation.x = -Math.PI / 2;
    rune.position.set(-330, 0.32, 30);
    this.scene.add(rune);

    // Fluted Gothic Sanctuary Columns + Floating Crystals + Bioluminescent Fungi
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      if (Math.abs(ang) < 0.35) continue;
      const mx = -330 + Math.cos(ang) * 40;
      const mz = 30 + Math.sin(ang) * 40;
      const my = this.getGroundHeight(mx, mz);
      const mh = 11 + (i % 3) * 4.5;
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 1.8, 8), ruinMat);
      plinth.position.set(mx, my + 0.9, mz);
      const colGeo = new THREE.CylinderGeometry(1.35, 1.7, mh, 8);
      const mono = new THREE.Mesh(colGeo, ruinMat);
      mono.position.set(mx, my + mh * 0.5 + 1.4, mz);
      mono.rotation.y = ang;
      mono.castShadow = true;
      mono.add(CustomShaders.createInkOutlineMesh(colGeo, 0.05, 0x090b15));
      const capital = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 1.4, 1.6, 8), ruinMat);
      capital.position.set(mx, my + mh + 1.8, mz);
      this.scene.add(plinth, mono, capital);
      this.addCollider(mx, mz, 4.4, 4.4, mh + 3, my);

      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), arcaneMat);
      crystal.position.set(mx, my + mh + 4.0, mz);
      this.scene.add(crystal);
      this.animatedObjects.push({ type: 'float', mesh: crystal, baseY: my + mh + 4.0, speed: 2.0, phase: i });
      this.swingAnchors.push(new THREE.Vector3(mx, my + mh + 6.0, mz));
    }

    // Giant Twisted Arcane Pines + Bioluminescent Mushroom Groves around Forest
    const treeRing = [
      [-215, -35], [-235, 95], [-265, -75], [-290, 125], [-365, -60],
      [-395, 115], [-435, -25], [-450, 75], [-410, -90], [-320, -90],
      [-240, 145], [-380, 150], [-465, 25], [-200, 110], [-195, -55], [-495, -60]
    ];
    treeRing.forEach(([tx, tz], idx) => {
      const ty = this.getGroundHeight(tx, tz);
      const tGrp = new THREE.Group();
      const s = 1.5 + (idx % 3) * 0.4;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * s, 0.78 * s, 5.5 * s, 5), barkMat);
      trunk.position.y = 2.7 * s;
      tGrp.add(trunk);
      for (let k = 0; k < 3; k++) {
        const cGeo = new THREE.ConeGeometry((3.6 - k * 0.75) * s, (4.8 - k * 0.5) * s, 5);
        const cone = new THREE.Mesh(cGeo, leafMat);
        cone.position.y = (5.5 + k * 2.5) * s;
        cone.add(CustomShaders.createInkOutlineMesh(cGeo, 0.05, 0x07100f));
        tGrp.add(cone);
      }
      if (idx % 2 === 0) {
        const mStem = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 2.2, 6), this.mat(0xe2e8f0));
        mStem.position.set(1.8 * s, 1.1, 1.2 * s);
        const mCap = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.1, 8), mushCapMat);
        mCap.position.set(1.8 * s, 2.3, 1.2 * s);
        tGrp.add(mStem, mCap);
      }
      tGrp.position.set(tx, ty, tz);
      this.scene.add(tGrp);
      this.addCollider(tx, tz, 2.8, 2.8, 13, ty);
      this.swingAnchors.push(new THREE.Vector3(tx, ty + 14.0, tz));
    });
  };

  // BIOME 3: CRATERA DOS SENTINELAS & FUNDIÇÃO TRASK (EAST: center 330, 0, 30)
  LatveriaWorld.prototype.buildSentinelCraterBiome = function () {
    const steelMat = this.mat(0x334155, { metalness: 0.85, roughness: 0.26, rimColor: 0xfb923c });
    const armorMat = this.mat(0x1e293b, { metalness: 0.78, roughness: 0.32, rimColor: 0x94a3b8 });
    const purpleWreck = this.mat(0x5b21b6, { metalness: 0.72, roughness: 0.32, rimColor: 0xc084fc });
    const magentaWreck = this.mat(0xbe185d, { metalness: 0.55, roughness: 0.34 });
    const orangeGlow = new THREE.MeshBasicMaterial({ color: 0xf97316 });

    // Central Omega Platform (330, 0, 30)
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(46, 52, 1.2, 24),
      this.mat(0x1f2937, { map: ProceduralTextures.createGothicStoneTexture(), metalness: 0.65, roughness: 0.35 })
    );
    pad.position.set(330, -0.35, 30);
    pad.receiveShadow = true;
    this.scene.add(pad);

    // Animated Magma Ring around the Sentinel Platform
    if (typeof CustomShaders.createMagmaMaterial === 'function') {
      const magmaMat = CustomShaders.createMagmaMaterial();
      const magmaRing = new THREE.Mesh(new THREE.RingGeometry(48, 86, 40), magmaMat);
      magmaRing.rotation.x = -Math.PI / 2;
      magmaRing.position.set(330, 0.08, 30);
      this.scene.add(magmaRing);
    }

    // 4 Sculpted Trask Foundry Plasma Towers + Overhead Industrial Gantry Arches
    [[285, -18], [285, 78], [385, -18], [385, 78]].forEach(([sx, sz], idx) => {
      const sy = this.getGroundHeight(sx, sz);
      const tGrp = new THREE.Group();
      tGrp.position.set(sx, sy, sz);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.6, 4.5, 8), armorMat);
      base.position.y = 2.25;
      const coreCol = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.0, 26, 8), steelMat);
      coreCol.position.y = 14.0;
      coreCol.castShadow = true;
      coreCol.add(CustomShaders.createInkOutlineMesh(coreCol.geometry, 0.06, 0x090b15));
      for (let r = 0; r < 3; r++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.32, 6, 12), r === 2 ? orangeGlow : purpleWreck);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 8 + r * 7;
        tGrp.add(ring);
      }
      const emitter = new THREE.Mesh(new THREE.OctahedronGeometry(1.75, 0), orangeGlow);
      emitter.position.y = 28.8;
      tGrp.add(base, coreCol, emitter);
      this.scene.add(tGrp);
      this.animatedObjects.push({ type: 'spin', mesh: emitter, speed: (idx % 2 === 0 ? 1.8 : -1.8) });
      this.addCollider(sx, sz, 7.6, 7.6, 28, sy);
      this.swingAnchors.push(new THREE.Vector3(sx, sy + 28, sz));
      this.brazierLights.push({ pos: new THREE.Vector3(sx, sy + 24, sz), r: 0.98, g: 0.45, b: 0.12, range: 32.0 });
    });

    // Overhead Foundry Gantry Beams connecting the East & West Towers
    [285, 385].forEach(gx => {
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 98), armorMat);
      bridge.position.set(gx, 25.5, 30);
      this.scene.add(bridge);
    });

    // Sculpted Colossal Wrecked Sentinel MK-0 Torso, Head & Articulated Hand in Volcanic Crater Rim
    const wreckGrp = new THREE.Group();
    wreckGrp.position.set(398, 2.6, -54);
    wreckGrp.rotation.set(0.28, -0.58, 0.24);
    const chestHull = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 3.6, 9.5, 8), purpleWreck);
    chestHull.scale.set(1.35, 1.0, 0.85);
    chestHull.add(CustomShaders.createInkOutlineMesh(chestHull.geometry, 0.08, 0x090b15));
    const coreRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.38, 8, 16), orangeGlow);
    coreRing.position.set(0, 1.2, 4.4);
    const headHull = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.1, 4.8, 6), magentaWreck);
    headHull.position.set(0, 6.8, 0.4);
    headHull.add(CustomShaders.createInkOutlineMesh(headHull.geometry, 0.07, 0x090b15));
    [-1, 1].forEach(s => {
      const visor = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.65, 0.8), orangeGlow);
      visor.position.set(s * 0.95, 7.2, 2.55);
      visor.rotation.z = s * -0.18;
      const pld = new THREE.Mesh(new THREE.ConeGeometry(2.8, 5.2, 6), purpleWreck);
      pld.position.set(s * 6.8, 2.8, 0);
      pld.rotation.z = s * -0.55;
      wreckGrp.add(visor, pld);
    });
    wreckGrp.add(chestHull, coreRing, headHull);
    this.scene.add(wreckGrp);
    this.addCollider(398, -54, 12, 11, 14, 0);
    this.swingAnchors.push(new THREE.Vector3(398, 16, -54));

    const wreckedArm = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.6, 15, 8), magentaWreck);
    wreckedArm.position.set(270, 5.2, -55);
    wreckedArm.rotation.set(0.75, 0.4, -0.45);
    wreckedArm.add(CustomShaders.createInkOutlineMesh(wreckedArm.geometry, 0.06, 0x090b15));
    const fist = new THREE.Mesh(new THREE.DodecahedronGeometry(3.4, 0), purpleWreck);
    fist.position.set(264, 10.5, -49);
    this.scene.add(wreckedArm, fist);
    this.addCollider(270, -55, 7.2, 7.2, 11, 0);

    // Trask Wasteland Armored Watch-Pylons lining Eastern Approach (x: 195..520)
    [[205, -25], [205, 85], [240, 125], [440, 125], [475, -10], [510, 80]].forEach(([px, pz], i) => {
      const py = this.getGroundHeight(px, pz);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 11.5, 8), steelMat);
      shaft.position.set(px, py + 5.75, pz);
      shaft.add(CustomShaders.createInkOutlineMesh(shaft.geometry, 0.05, 0x090b15));
      const head = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.2, 6), i % 2 === 0 ? purpleWreck : armorMat);
      head.position.set(px, py + 12.8, pz);
      const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), orangeGlow);
      beacon.position.set(px, py + 15.0, pz);
      this.scene.add(shaft, head, beacon);
      this.addCollider(px, pz, 4.2, 4.2, 14, py);
    });
  };

  // BIOME 4: TUNDRA GLACIAL (NORTH: center 0, 14, -295)
  LatveriaWorld.prototype.buildTundraGlacialBiome = function () {
    const iceMat = this.mat(0x93c5fd, { metalness: 0.35, roughness: 0.18, rimColor: 0xe0f2fe, rimStrength: 0.72, transparent: true, opacity: 0.9 });
    const snowPineMat = this.mat(0xe0f2fe, { roughness: 0.65, rimColor: 0xbae6fd });
    const darkTrunkMat = this.mat(0x1e293b, { roughness: 0.9 });

    // Destroyer Battle Esplanade Disc (0, 14, -295)
    const arena = new THREE.Mesh(
      new THREE.CylinderGeometry(42, 46, 0.8, 24),
      this.mat(0x334155, { map: ProceduralTextures.createGothicStoneTexture(), roughness: 0.65 })
    );
    arena.position.set(0, 0.05, -295);
    arena.receiveShadow = true;
    this.scene.add(arena);

    // Towering Ice Spires & Snow Pines around the Tundra
    const iceCoords = [
      [-65, -210], [65, -210], [-95, -275], [95, -275],
      [-75, -345], [75, -345], [-145, -245], [145, -245],
      [-135, -320], [135, -320], [-48, -170], [48, -170]
    ];
    iceCoords.forEach(([ix, iz], idx) => {
      const iy = this.getGroundHeight(ix, iz);
      if (idx % 2 === 0) {
        const h = 14 + (idx % 3) * 6;
        const spireGeo = new THREE.ConeGeometry(4.2, h, 5);
        const spire = new THREE.Mesh(spireGeo, iceMat);
        spire.position.set(ix, iy + h * 0.45, iz);
        spire.rotation.set((idx % 3 - 1) * 0.12, idx, 0);
        spire.add(CustomShaders.createInkOutlineMesh(spireGeo, 0.05, 0x0f172a));
        this.scene.add(spire);
        this.addCollider(ix, iz, 5.4, 5.4, h + 1, iy);
        this.swingAnchors.push(new THREE.Vector3(ix, iy + h + 2, iz));
      } else {
        const tree = new THREE.Group();
        const s = 1.4;
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 3.8, 5), darkTrunkMat);
        tr.position.y = 1.9;
        tree.add(tr);
        for (let k = 0; k < 3; k++) {
          const c = new THREE.Mesh(new THREE.ConeGeometry((3.0 - k * 0.6) * s, 4.0 * s, 5), snowPineMat);
          c.position.y = 4.2 + k * 2.4;
          tree.add(c);
        }
        tree.position.set(ix, iy, iz);
        this.scene.add(tree);
        this.addCollider(ix, iz, 2.4, 2.4, 12, iy);
      }
    });
  };

  // BIOME 5: FENDA DO MULTIVERSO EXPANDIDA (Cidadela de Doom at z = -618, baseY = 0)
  LatveriaWorld.prototype.buildMultiverseRift = function () {
    const riftGroup = new THREE.Group();
    riftGroup.position.set(0, 18.0, -624);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(15.5, 0.58, 8, 40), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(11.5, 0.45, 8, 36), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(8.0, 0.34, 8, 30), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    const core = new THREE.Mesh(new THREE.CircleGeometry(9.2, 32), CustomShaders.createEldritchMandalaMaterial(0x34d399));
    riftGroup.add(ring1, ring2, ring3, core);

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const sh = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x34d399 : 0x38bdf8 }));
      sh.scale.set(0.6, 2.2, 0.6);
      sh.position.set(Math.cos(a) * 14.0, Math.sin(a) * 14.0, 0.8);
      riftGroup.add(sh);
    }
    this.scene.add(riftGroup);
    this.animatedObjects.push({ type: 'spinZ', mesh: ring1, speed: 0.65 });
    this.animatedObjects.push({ type: 'spinZ', mesh: ring2, speed: -1.25 });
    this.animatedObjects.push({ type: 'spinZ', mesh: ring3, speed: 1.85 });
    this.animatedObjects.push({ type: 'spinZ', mesh: core, speed: 0.45 });
  };

  // ARENAS / SANTUÁRIOS IMPONENTES PARA OS 4 BOSSES REGIONAIS
  LatveriaWorld.prototype.buildBossArenas = function () {
    const stoneMat = this.mat(0x334155, { map: ProceduralTextures.createGothicStoneTexture(), roughness: 0.72, flatShading: true });
    const darkMat = this.mat(0x1e1b2e, { roughness: 0.65, metalness: 0.25, flatShading: true });

    const addArenaFloor = (x, z, r, hexRing) => {
      const gy = this.getGroundHeight(x, z);
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 1.4, 0.45, 8), darkMat);
      pad.position.set(x, gy + 0.16, z);
      const glow = new THREE.Mesh(new THREE.RingGeometry(r - 0.6, r, 16), new THREE.MeshBasicMaterial({ color: hexRing, side: THREE.DoubleSide }));
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(x, gy + 0.41, z);
      this.scene.add(pad, glow);
      return gy;
    };

    // 1. Bastião do Executor (Portão Norte: 0, 0, -45)
    const y1 = addArenaFloor(0, -45, 16, 0x10b981);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const px = Math.cos(a) * 15.5, pz = -45 + Math.sin(a) * 15.5;
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.35, 11, 6), stoneMat);
      pil.position.set(px, y1 + 5.5, pz);
      pil.add(CustomShaders.createInkOutlineMesh(pil.geometry, 0.05, 0x090b15));
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), new THREE.MeshBasicMaterial({ color: 0x34d399 }));
      orb.position.set(px, y1 + 11.8, pz);
      this.scene.add(pil, orb);
      if (this.addCollider) this.addCollider(px, pz, 2.8, 2.8, 12, y1);
      this.swingAnchors.push(new THREE.Vector3(px, y1 + 13, pz));
    }

    // 2. Círculo Ritual Carmesim do Barão Mordo (-330, y, 30)
    const y2 = addArenaFloor(-330, 30, 18, 0xc084fc);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = -330 + Math.cos(a) * 17.5, pz = 30 + Math.sin(a) * 17.5;
      const mono = new THREE.Mesh(new THREE.BoxGeometry(1.8, 12.5, 1.8), stoneMat);
      mono.position.set(px, y2 + 6.0, pz);
      mono.lookAt(-330, y2 + 6.0, 30);
      mono.rotation.x += 0.14;
      mono.add(CustomShaders.createInkOutlineMesh(mono.geometry, 0.05, 0x090b15));
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), new THREE.MeshBasicMaterial({ color: 0xc084fc }));
      crystal.position.set(px, y2 + 13.2, pz);
      this.scene.add(mono, crystal);
      if (this.addCollider) this.addCollider(px, pz, 2.2, 2.2, 13, y2);
    }

    // 3. Plataforma Ômega Trask do Sentinela Clássico (330, y, 30)
    const y3 = addArenaFloor(330, 30, 22, 0xf97316);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const px = 330 + Math.cos(a) * 21.5, pz = 30 + Math.sin(a) * 21.5;
      const gantry = new THREE.Mesh(new THREE.BoxGeometry(2.4, 18, 2.4), this.mat(0x4c1d95, { metalness: 0.72, roughness: 0.28 }));
      gantry.position.set(px, y3 + 9.0, pz);
      gantry.add(CustomShaders.createInkOutlineMesh(gantry.geometry, 0.06, 0x090b15));
      const light = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
      light.position.set(px, y3 + 19.0, pz);
      this.scene.add(gantry, light);
      if (this.addCollider) this.addCollider(px, pz, 2.8, 2.8, 19, y3);
      this.swingAnchors.push(new THREE.Vector3(px, y3 + 19, pz));
    }

    // 4. Coliseu Rúnico da Tundra — O Destruidor (0, 14, -295)
    const y4 = addArenaFloor(0, -295, 19, 0x38bdf8);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const px = Math.cos(a) * 18.5, pz = -295 + Math.sin(a) * 18.5;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.45, 11.5, 6), this.mat(0x1e293b, { rimColor: 0x38bdf8 }));
      pillar.position.set(px, y4 + 5.75, pz);
      pillar.add(CustomShaders.createInkOutlineMesh(pillar.geometry, 0.05, 0x090b15));
      this.scene.add(pillar);
      if (this.addCollider) this.addCollider(px, pz, 2.8, 2.8, 12, y4);
      if (i % 2 === 0) this.addBrazier(px, y4 + 11.5, pz);
    }
  };

  // FAST-TRAVEL PORTALS ACROSS ALL 11 BIOMES
  LatveriaWorld.prototype.buildFastTravelPortals = function () {
    const defs = [
      { id: 'doomstadt', name: 'Vale de Doomstadt (Fase 1)', pos: new THREE.Vector3(-15.5, 0.0, 145), color: 0x38bdf8 },
      { id: 'north_gate', name: 'Ponte do Rio Latver', pos: new THREE.Vector3(-15.5, 0.0, -56), color: 0x34d399 },
      { id: 'dark_forest', name: 'Floresta Negra (Fase 2)', pos: new THREE.Vector3(-255, this.getGroundHeight(-255, 30), 30), color: 0xa855f7 },
      { id: 'industrial_citadel', name: 'Cratera Sentinelas (Fase 3)', pos: new THREE.Vector3(255, this.getGroundHeight(255, 30), 30), color: 0xf97316 },
      { id: 'tundra_glacial', name: 'Tundra Glacial (Fase 4)', pos: new THREE.Vector3(0, 0.0, -215), color: 0x60a5fa },
      { id: 'castle_rift', name: 'Cidadela de Doom (Fase 5)', pos: new THREE.Vector3(0, 0.0, -522), color: 0x10b981 },
      { id: 'highlands_south', name: 'Planaltos dos Cárpatos', pos: new THREE.Vector3(0, this.getGroundHeight(0, 505), 505), color: 0xfacc15 },
      { id: 'wakanda_jungle', name: 'Selva de Vibranium', pos: new THREE.Vector3(-520, this.getGroundHeight(-520, 490), 490), color: 0x2dd4bf },
      { id: 'asgard_ruins', name: 'Ruínas Solares de Asgard', pos: new THREE.Vector3(520, this.getGroundHeight(520, 490), 490), color: 0xfef08a },
      { id: 'void_abyss', name: 'Ato II · Vazio Abissal', pos: new THREE.Vector3(0, this.getGroundHeight(0, -1080), -1080), color: 0xfacc15, act2Only: true },
      { id: 'asteroid_m', name: 'Ato II · Asteroide M', pos: new THREE.Vector3(-1120, this.getGroundHeight(-1120, -40), -40), color: 0xe879f9, act2Only: true },
      { id: 'time_citadel', name: 'Ato II · Cidadela Temporal', pos: new THREE.Vector3(1120, this.getGroundHeight(1120, -40), -40), color: 0x22d3ee, act2Only: true }
    ];

    defs.forEach(d => {
      const g = new THREE.Group();
      const baseGeo = new THREE.CylinderGeometry(2.4, 2.8, 0.4, 12);
      const base = new THREE.Mesh(baseGeo, this.mat(0x1e293b, { metalness: 0.7, roughness: 0.3 }));
      base.position.y = 0.2;
      base.add(CustomShaders.createInkOutlineMesh(baseGeo, 0.03, 0x090b15));
      g.add(base);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.0, 0.14, 8, 28),
        new THREE.MeshBasicMaterial({ color: d.color })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.55;
      g.add(ring);

      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 8.5, 16, 1, true),
        new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
      );
      pillar.position.y = 4.4;
      g.add(pillar);

      g.position.copy(d.pos);
      this.scene.add(g);
      this.fastTravelPortals.push({ ...d, mesh: g, ring });
    });
  };

  // 3 IMPERIAL SEAL OBELISKS LINKING TO CASTLE BARRIER AT (0, 24, -504)
  LatveriaWorld.prototype.buildSealObelisks = function () {
    const defs = [
      { id: 'seal_forest', bossId: 'archmage', pos: new THREE.Vector3(-375, 0.0, 30), color: 0xa855f7 },
      { id: 'seal_sentinel', bossId: 'sentinel', pos: new THREE.Vector3(382, 0.0, 30), color: 0xf97316 },
      { id: 'seal_tundra', bossId: 'destroyer', pos: new THREE.Vector3(0, 0.0, -342), color: 0x38bdf8 }
    ];

    const castleTop = new THREE.Vector3(0, 24, -504);
    const bodyMat = this.mat(0x1e293b, { metalness: 0.78, roughness: 0.26 });

    defs.forEach(d => {
      const g = new THREE.Group();
      const ob = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.8, 12, 6), bodyMat);
      ob.position.y = 6;
      ob.add(CustomShaders.createInkOutlineMesh(ob.geometry, 0.04, 0x090b15));
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), new THREE.MeshBasicMaterial({ color: d.color }));
      gem.position.y = 14.2;
      g.add(ob, gem);
      g.position.copy(d.pos);
      this.scene.add(g);
      if (this.addCollider) this.addCollider(d.pos.x, d.pos.z, 3.6, 3.6, 15, d.pos.y);

      const startW = d.pos.clone().add(new THREE.Vector3(0, 14.2, 0));
      const dist = startW.distanceTo(castleTop);
      const beamGeo = new THREE.CylinderGeometry(0.28, 0.28, dist, 6);
      beamGeo.translate(0, dist * 0.5, 0);
      beamGeo.rotateX(Math.PI / 2);
      const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.45 }));
      beam.position.copy(startW);
      beam.lookAt(castleTop);
      this.scene.add(beam);

      this.sealObelisks.push({ ...d, mesh: g, gem, beam, broken: false });
    });
  };

  // 4 DESTRUCTIBLE DOOM ENERGY TOWERS SPREAD ACROSS BIOMES
  LatveriaWorld.prototype.buildEnergyTowers = function () {
    const coords = [
      { id: 'tower_w1', zone: 'Floresta Negra', pos: new THREE.Vector3(-220, this.getGroundHeight(-220, -25), -25) },
      { id: 'tower_w2', zone: 'Floresta Negra', pos: new THREE.Vector3(-400, this.getGroundHeight(-400, 85), 85) },
      { id: 'tower_e1', zone: 'Cratera Sentinelas', pos: new THREE.Vector3(235, this.getGroundHeight(235, -25), -25) },
      { id: 'tower_e2', zone: 'Cratera Sentinelas', pos: new THREE.Vector3(410, this.getGroundHeight(410, 85), 85) }
    ];

    const bodyMat = this.mat(0x1f2937, { metalness: 0.7, roughness: 0.3, rimColor: 0x10b981, rimStrength: 0.45 });
    const castleTarget = new THREE.Vector3(0, 68, -504);

    coords.forEach((t, idx) => {
      const g = new THREE.Group();
      const colGeo = new THREE.CylinderGeometry(1.15, 2.0, 10.5, 6);
      const col = new THREE.Mesh(colGeo, bodyMat);
      col.position.y = 5.25;
      col.castShadow = true;
      col.add(CustomShaders.createInkOutlineMesh(colGeo, 0.04, 0x090b15));
      g.add(col);
      if (this.addCollider) this.addCollider(t.pos.x, t.pos.z, 3.8, 3.8, 13, t.pos.y);

      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.6, 0),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      crystal.position.y = 12.4;
      g.add(crystal);

      const hpBarBg = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.30), new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide }));
      hpBarBg.position.set(0, 15.2, 0);
      const hpBarFill = new THREE.Mesh(new THREE.PlaneGeometry(2.65, 0.20), new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide }));
      hpBarFill.position.z = 0.02;
      hpBarBg.add(hpBarFill);
      g.add(hpBarBg);

      g.position.copy(t.pos);
      this.scene.add(g);

      const startW = t.pos.clone().add(new THREE.Vector3(0, 12.4, 0));
      const dist = startW.distanceTo(castleTarget);
      const beamGeo = new THREE.CylinderGeometry(0.18, 0.18, dist, 6);
      beamGeo.translate(0, dist * 0.5, 0);
      beamGeo.rotateX(Math.PI / 2);
      const beam = new THREE.Mesh(
        beamGeo,
        new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.4 })
      );
      beam.position.copy(startW);
      beam.lookAt(castleTarget);
      this.scene.add(beam);

      this.brazierLights.push({ pos: startW, r: 0.2, g: 0.95, b: 0.55, range: 16.0 });

      this.energyTowers.push({
        id: t.id,
        name: `Torre de Energia ${idx + 1}`,
        zone: t.zone,
        pos: t.pos.clone(),
        hp: 600,
        maxHp: 600,
        destroyed: false,
        mesh: g,
        crystal,
        beam,
        hpBarBg,
        hpBarFill
      });
    });
  };

  LatveriaWorld.prototype.buildLivingWorldElements = function () {
    const hullMat = this.mat(0x1e293b, { metalness: 0.78, roughness: 0.28, rimColor: 0x34d399 });
    const trimMat = this.mat(0x065f46, { roughness: 0.5, rimColor: 0x6ee7b7 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });

    // 1. 3 Naves/Dirigíveis Imperiais Low-Poly patrulhando o céu de Latvéria
    const patrolCenters = [
      { x: 0, y: 52, z: 45, rx: 45, rz: 65, spd: 0.18 },
      { x: -290, y: 56, z: 25, rx: 55, rz: 45, spd: -0.22 },
      { x: 290, y: 58, z: 25, rx: 60, rz: 50, spd: 0.20 }
    ];
    patrolCenters.forEach((cfg, idx) => {
      const ship = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), hullMat);
      hull.scale.set(4.2, 3.0, 12.0);
      ship.add(hull);
      const gondola = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 6.2), trimMat);
      gondola.position.y = -3.1;
      ship.add(gondola);
      for (const s of [-1, 1]) {
        const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 3.5, 5), glowMat);
        engine.rotation.x = Math.PI / 2;
        engine.position.set(s * 3.8, -0.5, -2.5);
        ship.add(engine);
      }
      const spotlight = new THREE.Mesh(new THREE.ConeGeometry(9.0, 34, 8, 1, true), beamMat);
      spotlight.position.y = -20;
      ship.add(spotlight);

      ship.position.set(cfg.x, cfg.y, cfg.z);
      this.scene.add(ship);
      this.airships.push({ mesh: ship, cfg, phase: idx * 2.1 });
    });

    // 2. Bandos de Corvos / Espíritos Arcanos Low-Poly circulando pelos céus
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
    const spiritMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, side: THREE.DoubleSide });
    const wingGeo = new THREE.ConeGeometry(0.42, 1.4, 3);
    wingGeo.rotateZ(Math.PI / 2);

    for (let i = 0; i < 18; i++) {
      const isSpirit = i >= 9;
      const bGrp = new THREE.Group();
      const wL = new THREE.Mesh(wingGeo, isSpirit ? spiritMat : birdMat);
      wL.position.x = -0.45;
      const wR = new THREE.Mesh(wingGeo, isSpirit ? spiritMat : birdMat);
      wR.position.x = 0.45;
      wR.rotation.y = Math.PI;
      bGrp.add(wL, wR);
      this.scene.add(bGrp);
      this.skyBirds.push({
        mesh: bGrp, wL, wR,
        cx: isSpirit ? -330 : 0,
        cz: isSpirit ? 30 : -110 + (i % 3) * 75,
        cy: 22 + (i % 5) * 4,
        rad: 24 + (i % 4) * 11,
        spd: (0.45 + (i % 4) * 0.14) * (i % 2 === 0 ? 1 : -1),
        phase: i * 0.7
      });
    }

    // 3. 12 Cristais de Energia Curativos Low-Poly nas 5 regiões (coletáveis / destrutíveis)
    const crystalCoords = [
      [-18, 118, 0x34d399], [20, 62, 0x34d399], [-24, -40, 0x38bdf8], [26, -88, 0x38bdf8],
      [-235, 16, 0xc084fc], [-345, -18, 0xc084fc], [-310, 72, 0xc084fc],
      [235, 16, 0xf97316], [345, -18, 0xf97316], [310, 72, 0xf97316],
      [-28, -265, 0x7dd3fc], [28, -325, 0x7dd3fc]
    ];
    crystalCoords.forEach(([cx, cz, col], idx) => {
      const gy = this.getGroundHeight(cx, cz);
      const grp = new THREE.Group();
      const gemGeo = new THREE.OctahedronGeometry(0.95, 0);
      const gem = new THREE.Mesh(gemGeo, new THREE.MeshBasicMaterial({ color: col }));
      gem.scale.set(0.8, 1.45, 0.8);
      gem.add(CustomShaders.createInkOutlineMesh(gemGeo, 0.06, 0x090b15));
      grp.add(gem);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.1, 1.4, 6),
        new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -1.1;
      grp.add(ring);
      grp.position.set(cx, gy + 1.6, cz);
      this.scene.add(grp);
      this.lootCrystals.push({
        mesh: grp, gem, pos: new THREE.Vector3(cx, gy + 1.6, cz), baseY: gy + 1.6,
        color: col, collected: false, respawnTimer: 0, phase: idx * 0.9
      });
    });

    // 4. 7 LAGOS CRISTALINOS NADÁVEIS (Malha Polar Subdividida + Espuma Real)
    const lakes = this.lakes || [
      { x: 96, z: 68, r: 30, deep: 0x09304d, shallow: 0x38bdf8, pierDir: -1, waterY: -0.45 },
      { x: -96, z: 52, r: 28, deep: 0x0b3b4b, shallow: 0x2dd4bf, pierDir: 1, waterY: -0.45 },
      { x: -255, z: -42, r: 26, deep: 0x24104f, shallow: 0xa855f7, pierDir: 1, waterY: 1.55 }
    ];
    const shoreRockMat = this.mat(0x475569, { roughness: 0.85, rimColor: 0x93c5fd, flatShading: true });
    const woodMat = this.mat(0x5c3a21, { roughness: 0.8 });
    const lilyMat = this.mat(0x15803d, { roughness: 0.6, rimColor: 0x86efac });
    const lotusMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });

    lakes.forEach((lk) => {
      const waterY = lk.waterY !== undefined ? lk.waterY : -0.45;
      if (typeof CustomShaders.createWaterMaterial === 'function') {
        const wMat = CustomShaders.createWaterMaterial(lk.deep, lk.shallow);
        const wGeo = CustomShaders.createLakeGeometry ? CustomShaders.createLakeGeometry(lk.r, 24, 56) : new THREE.CircleGeometry(lk.r, 36);
        const wDisc = new THREE.Mesh(wGeo, wMat);
        if (!CustomShaders.createLakeGeometry) wDisc.rotation.x = -Math.PI / 2;
        wDisc.position.set(lk.x, waterY, lk.z);
        this.scene.add(wDisc);
      }
      // Margem de pedras ajustada à elevação natural da borda (sem obstruir a entrada do píer)
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        const rx = lk.x + Math.cos(ang) * (lk.r + 1.2);
        const rz = lk.z + Math.sin(ang) * (lk.r + 1.2);
        const nearPier = Math.abs(rz - lk.z) < 5.2 && Math.sign(rx - lk.x) === lk.pierDir;
        if (!nearPier) {
          const edgeY = Math.max(waterY, this.getGroundHeight(rx, rz));
          const rSize = 1.2 + (i % 4) * 0.45;
          const rGeo = new THREE.IcosahedronGeometry(rSize, 1);
          const rp = rGeo.attributes.position;
          for (let v = 0; v < rp.count; v++) {
            const vx = rp.getX(v), vy = rp.getY(v), vz = rp.getZ(v);
            rp.setXYZ(v, vx * 1.25, vy < 0 ? vy * 0.38 : vy * 0.65, vz * 1.08);
          }
          rGeo.computeVertexNormals();
          const rock = new THREE.Mesh(rGeo, shoreRockMat);
          rock.position.set(rx, edgeY + 0.12, rz);
          rock.rotation.set(0.06, ang, 0.05);
          this.scene.add(rock);
        }
        if (i % 3 === 0) {
          const px = lk.x + Math.cos(ang + 0.2) * (lk.r * 0.55);
          const pz = lk.z + Math.sin(ang + 0.2) * (lk.r * 0.55);
          if (Math.hypot(px - (lk.x + lk.pierDir * (lk.r - 4.0)), pz - lk.z) > 6.5) {
            const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 7), lilyMat);
            pad.position.set(px, waterY + 0.05, pz);
            this.scene.add(pad);
            if (i % 6 === 0) {
              const fl = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), lotusMat);
              fl.position.set(pad.position.x, waterY + 0.22, pad.position.z);
              this.scene.add(fl);
            }
          }
        }
      }
      // Píer de madeira apoiado no barranco + lanterna + colisor nos postes
      const pierX = lk.x + lk.pierDir * (lk.r - 4.0);
      const pier = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.45, 3.6), woodMat);
      pier.position.set(pierX, waterY + 0.72, lk.z);
      this.scene.add(pier);
      for (const s of [-1, 1]) {
        const postX = pierX - lk.pierDir * 4.8;
        const postZ = lk.z + s * 1.5;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.0, 6), woodMat);
        post.position.set(postX, waterY + 0.4, postZ);
        this.scene.add(post);
        if (this.addCollider) this.addCollider(postX, postZ, 0.9, 0.9, 3.5, waterY);
      }
      const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
      lantern.position.set(pierX - lk.pierDir * 4.8, waterY + 2.1, lk.z + 1.5);
      this.scene.add(lantern);
    });

    // 5. +22 CHALÉS ALPINOS VALIDADOS POR EXCLUSÃO (ZERO CLIPPING COM RUAS/LAGOS)
    const extraHouses = [
      { x: -138, z: 122, w: 12, d: 11, h: 10.0, wall: '#e8dec8', roof: '#9f4335' },
      { x: -115, z: 152, w: 14, d: 12, h: 11.5, wall: '#d6e0ea', roof: '#2d5a4c' },
      { x: -64,  z: 148, w: 12, d: 12, h: 10.5, wall: '#e5d5bc', roof: '#3c4a6b' },
      { x:  64,  z: 148, w: 13, d: 12, h: 11.0, wall: '#e0d6c2', roof: '#9f4335' },
      { x:  124, z: 132, w: 14, d: 13, h: 12.0, wall: '#d4dce6', roof: '#374863' },
      { x:  142, z: 96,  w: 12, d: 11, h: 10.0, wall: '#e8dec8', roof: '#2d5a4c' },
      { x:  148, z: -20, w: 13, d: 12, h: 11.5, wall: '#dfd4be', roof: '#8f3b2e' },
      { x:  136, z: -56, w: 12, d: 12, h: 10.5, wall: '#d8e0e8', roof: '#3c4a6b' },
      { x: -138, z: -52, w: 13, d: 12, h: 11.0, wall: '#e5d9c3', roof: '#9f4335' },
      { x: -148, z: -12, w: 14, d: 13, h: 12.0, wall: '#ced7e2', roof: '#2d5a4c' },
      { x: -145, z: 72,  w: 12, d: 11, h: 10.5, wall: '#e6dccb', roof: '#374863' },
      { x: -58,  z: -62, w: 12, d: 11, h: 10.5, wall: '#dfd5c3', roof: '#9f4335' },
      { x:  58,  z: -62, w: 12, d: 11, h: 10.5, wall: '#d4dde6', roof: '#2d5a4c' },
      { x: -92,  z: -74, w: 13, d: 12, h: 11.0, wall: '#e6dccb', roof: '#3c4a6b' },
      { x:  92,  z: -74, w: 13, d: 12, h: 11.0, wall: '#d6dce6', roof: '#8f3b2e' },
      { x:  42,  z: 168, w: 11, d: 11, h: 9.8,  wall: '#e8dec8', roof: '#2d5a4c' },
      { x: -42,  z: 168, w: 11, d: 11, h: 10.2, wall: '#d4dce6', roof: '#9f4335' },
      { x: -72,  z: 188, w: 13, d: 12, h: 11.2, wall: '#e6dccb', roof: '#3c4a6b' },
      { x:  72,  z: 188, w: 13, d: 12, h: 11.2, wall: '#dfd4be', roof: '#2d5a4c' },
      { x: -42,  z: 16,  w: 11, d: 10, h: 10.0, wall: '#e5d5bc', roof: '#8f3b2e' },
      { x:  42,  z: 16,  w: 11, d: 10, h: 10.0, wall: '#ced7e2', roof: '#374863' }
    ];
    const trimMat2 = this.mat(0x281f2e, { roughness: 0.72 });
    const plinthMat = this.mat(0x4b556b, { roughness: 0.78 });

    extraHouses.forEach((cfg, idx) => {
      if (this.canPlaceProp && !this.canPlaceProp(cfg.x, cfg.z, Math.max(cfg.w, cfg.d) * 0.55)) return;
      const gy = this.getGroundHeight(cfg.x, cfg.z);
      const hg = new THREE.Group();
      hg.position.set(cfg.x, gy, cfg.z);
      hg.rotation.y = (idx % 5 - 2) * 0.22;

      const wallMat = this.mat(0xffffff, {
        map: ProceduralTextures.createVillagePlasterTexture(cfg.wall, '#2a2030'),
        roughness: 0.75
      });
      const bodyGeo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
      const body = new THREE.Mesh(bodyGeo, wallMat);
      body.position.y = cfg.h * 0.5;
      body.castShadow = true;
      body.add(CustomShaders.createInkOutlineMesh(bodyGeo, 0.05, 0x0b0d18));
      hg.add(body);

      const plinth = new THREE.Mesh(new THREE.BoxGeometry(cfg.w + 0.5, 1.4, cfg.d + 0.5), plinthMat);
      plinth.position.y = 0.7;
      hg.add(plinth);

      const roofMat = this.mat(0xffffff, {
        map: ProceduralTextures.createTerracottaRoofTexture(cfg.roof, '#d97a54'),
        roughness: 0.60
      });
      const roofGeo = new THREE.ConeGeometry(Math.max(cfg.w, cfg.d) * 0.82, 5.2, 4);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = cfg.h + 2.5;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      roof.add(CustomShaders.createInkOutlineMesh(roofGeo, 0.05, 0x0b0d18));
      hg.add(roof);

      const chim = new THREE.Mesh(new THREE.BoxGeometry(1.3, 3.6, 1.3), trimMat2);
      chim.position.set(cfg.w * 0.24, cfg.h + 2.2, -cfg.d * 0.2);
      hg.add(chim);

      this.scene.add(hg);
      if (this.addCollider) this.addCollider(cfg.x, cfg.z, cfg.w + 1.0, cfg.d + 1.0, cfg.h + 5.5, gy);
      else this.buildingBoxes.push({ x: cfg.x, z: cfg.z, w: cfg.w + 1.0, d: cfg.d + 1.0 });
      this.swingAnchors.push(new THREE.Vector3(cfg.x, gy + cfg.h + 4.2, cfg.z));
    });

    // Moinho de Vento Alpino (-82, 122) com pás giratórias
    const wmY = this.getGroundHeight(-82, 122);
    const wmGrp = new THREE.Group();
    wmGrp.position.set(-82, wmY, 122);
    const wmTower = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.8, 17, 8), this.mat(0xe6dccb, { roughness: 0.72 }));
    wmTower.position.y = 8.5; wmTower.castShadow = true;
    const wmRoof = new THREE.Mesh(new THREE.ConeGeometry(4.1, 4.8, 8), this.mat(0x9f4335, { roughness: 0.6 }));
    wmRoof.position.y = 19.2;
    wmGrp.add(wmTower, wmRoof);
    const bladesGrp = new THREE.Group();
    bladesGrp.position.set(0, 14.5, 3.5);
    for (let i = 0; i < 4; i++) {
      const bArm = new THREE.Group();
      bArm.rotation.z = (i / 4) * Math.PI * 2;
      const spar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 8.2, 0.25), woodMat);
      spar.position.y = 4.1;
      const sail = new THREE.Mesh(new THREE.BoxGeometry(1.9, 6.2, 0.08), this.mat(0xfef3c7, { roughness: 0.7 }));
      sail.position.set(0.8, 4.8, 0.08);
      bArm.add(spar, sail);
      bladesGrp.add(bArm);
    }
    wmGrp.add(bladesGrp);
    this.scene.add(wmGrp);
    this.windmillBlades = bladesGrp;
    if (this.addCollider) this.addCollider(-82, 122, 9.5, 9.5, 22, wmY);
    else this.buildingBoxes.push({ x: -82, z: 122, w: 9.5, d: 9.5 });
    this.swingAnchors.push(new THREE.Vector3(-82, wmY + 21, 122));

    // 6. +380 ÁRVORES VARIADAS EM TODOS OS BIOMAS (COM EXCLUSÃO ANTI-CLIPPING!)
    const isClearForNature = (x, z) => {
      if (this.canPlaceProp && !this.canPlaceProp(x, z, 3.8)) return false;
      if (Math.abs(x) < 28 && z > -700 && z < 650) return false;
      if (Math.hypot(x - 330, z - 30) < 95) return false;
      if (Math.abs(x) < 38 && z < -350) return false;
      if (Math.hypot(x - 560, z - 540) < 62) return false;
      const gy = this.getGroundHeight(x, z);
      if (gy < -0.25) return false;
      return true;
    };

    const mergeFlatGeos = (parts) => {
      let totalVerts = 0;
      const nonIndexed = parts.map(p => {
        const g = p.index ? p.toNonIndexed() : p.clone();
        totalVerts += g.attributes.position.count;
        return g;
      });
      const posArr = new Float32Array(totalVerts * 3);
      const normArr = new Float32Array(totalVerts * 3);
      let off = 0;
      nonIndexed.forEach(g => {
        if (!g.attributes.normal) g.computeVertexNormals();
        posArr.set(g.attributes.position.array, off);
        normArr.set(g.attributes.normal.array, off);
        off += g.attributes.position.array.length;
      });
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      out.setAttribute('normal', new THREE.BufferAttribute(normArr, 3));
      return out;
    };

    const treeSpots = [];
    for (let i = 0; i < 6800 && treeSpots.length < 2400; i++) {
      const tx = Math.sin(i * 12.9898) * 1280;
      const tz = -1240 + ((Math.cos(i * 78.233) * 0.5 + 0.5) * 2040);
      if (Math.abs(tx) < 550 && Math.abs(tz - 30) < 220 && (i % 2 === 0)) {
        // Higher density near central roads & Doomstadt outskirts
      }
      if (isClearForNature(tx, tz)) treeSpots.push([tx, tz, i]);
    }
    if (treeSpots.length > 0) {
      const trunkGeo = new THREE.CylinderGeometry(0.28, 0.54, 3.6, 7);
      trunkGeo.translate(0, 1.8, 0);
      const trunkInst = new THREE.InstancedMesh(trunkGeo, woodMat, treeSpots.length);
      trunkInst.frustumCulled = false;

      const dropGeo = new THREE.CircleGeometry(3.0, 10);
      dropGeo.rotateX(-Math.PI / 2);
      dropGeo.translate(0, 0.05, 0);
      const dropInst = new THREE.InstancedMesh(dropGeo, new THREE.MeshBasicMaterial({ color: 0x091314, transparent: true, opacity: 0.28, depthWrite: false }), treeSpots.length);
      dropInst.frustumCulled = false;

      const pineSpots = treeSpots.filter((_, idx) => idx % 4 === 0);
      const oakSpots = treeSpots.filter((_, idx) => idx % 4 === 1);
      const autumnSpots = treeSpots.filter((_, idx) => idx % 4 === 2);
      const sakuraSpots = treeSpots.filter((_, idx) => idx % 4 === 3);

      const p1 = new THREE.ConeGeometry(2.5, 3.2, 7); p1.translate(0, 3.6, 0);
      const p2 = new THREE.ConeGeometry(2.0, 2.9, 7); p2.translate(0, 5.2, 0);
      const p3 = new THREE.ConeGeometry(1.3, 2.4, 7); p3.translate(0, 6.7, 0);
      const pineGeo = mergeFlatGeos([p1, p2, p3]);
      const pineInst = new THREE.InstancedMesh(pineGeo, this.mat(0xffffff, { roughness: 0.68, rimColor: 0x86efac, flatShading: true }), Math.max(1, pineSpots.length));
      pineInst.castShadow = true;
      pineInst.frustumCulled = false;

      const c1 = new THREE.IcosahedronGeometry(1.95, 1); c1.scale(1.12, 0.85, 1.05); c1.translate(0, 5.0, 0);
      const c2 = new THREE.IcosahedronGeometry(1.42, 1); c2.scale(1.1, 0.85, 1.05); c2.translate(1.22, 4.35, 0.58);
      const c3 = new THREE.IcosahedronGeometry(1.42, 1); c3.scale(1.1, 0.85, 1.05); c3.translate(-1.18, 4.4, -0.52);
      const c4 = new THREE.IcosahedronGeometry(1.25, 1); c4.scale(1.05, 0.88, 1.05); c4.translate(0.15, 6.0, -0.32);
      const oakGeo = mergeFlatGeos([c1, c2, c3, c4]);
      const oakInst = new THREE.InstancedMesh(oakGeo, this.mat(0xffffff, { roughness: 0.66, rimColor: 0xd9f99d, flatShading: true }), Math.max(1, oakSpots.length));
      const autumnInst = new THREE.InstancedMesh(oakGeo, this.mat(0xd97706, { roughness: 0.64, rimColor: 0xfef08a, flatShading: true }), Math.max(1, autumnSpots.length));
      const sakuraInst = new THREE.InstancedMesh(oakGeo, this.mat(0xffffff, { roughness: 0.64, rimColor: 0xfbcfe8, flatShading: true }), Math.max(1, sakuraSpots.length));
      oakInst.frustumCulled = false;
      autumnInst.frustumCulled = false;
      sakuraInst.frustumCulled = false;

      const colPineValley = new THREE.Color(0x166534);
      const colPineTundra = new THREE.Color(0xdbeafe);
      const colPineForest = new THREE.Color(0x1e293b);
      const colOakValley = new THREE.Color(0x4d7c0f);
      const colOakWakanda = new THREE.Color(0x0f766e);
      const colSakura = new THREE.Color(0xf472b6);
      const colArcane = new THREE.Color(0x7e22ce);
      const colScorch = new THREE.Color(0x57534e);

      const dummy = new THREE.Object3D();
      let pI = 0, oI = 0, aI = 0, sI = 0;
      treeSpots.forEach(([tx, tz, seed], idx) => {
        const ty = this.getGroundHeight(tx, tz);
        const s = 0.92 + (seed % 5) * 0.22;
        dummy.position.set(tx, ty, tz);
        dummy.rotation.set(0, seed * 0.7, 0);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        trunkInst.setMatrixAt(idx, dummy.matrix);
        dropInst.setMatrixAt(idx, dummy.matrix);
        const inTundra = tz < -145 && Math.abs(tx) < 360;
        const inForest = tx < -160 && tz < 235;
        const inCrater = tx > 160 && tz < 235;
        const inWakanda = tz > 235 && tx < -280;
        if (idx % 4 === 0) {
          pineInst.setMatrixAt(pI, dummy.matrix);
          pineInst.setColorAt(pI, inTundra ? colPineTundra : inForest ? colPineForest : inCrater ? colScorch : colPineValley);
          pI++;
        } else if (idx % 4 === 1) {
          oakInst.setMatrixAt(oI, dummy.matrix);
          oakInst.setColorAt(oI, inTundra ? colPineTundra : inWakanda ? colOakWakanda : inCrater ? colScorch : colOakValley);
          oI++;
        } else if (idx % 4 === 2) {
          autumnInst.setMatrixAt(aI++, dummy.matrix);
        } else {
          sakuraInst.setMatrixAt(sI, dummy.matrix);
          sakuraInst.setColorAt(sI, inForest ? colArcane : inTundra ? colPineTundra : colSakura);
          sI++;
        }
        if (this.addCollider) this.addCollider(tx, tz, 1.8, 1.8, 9.0, ty);
        else this.buildingBoxes.push({ x: tx, z: tz, w: 1.8, d: 1.8 });
      });
      if (pineInst.instanceColor) pineInst.instanceColor.needsUpdate = true;
      if (oakInst.instanceColor) oakInst.instanceColor.needsUpdate = true;
      if (sakuraInst.instanceColor) sakuraInst.instanceColor.needsUpdate = true;
      this.scene.add(trunkInst, dropInst, pineInst, oakInst, autumnInst, sakuraInst);
    }

    // 7. VEGETAÇÃO DENSA EM TODOS OS BIOMAS DA PLANÍCIE (CORES REATIVAS POR BIOMA)
    const bladeCount = 9500;
    const makeTuftGeo = () => {
      const pos = [];
      const blades = [
        { a: 0.0,   ox: 0.0,   oz: 0.0,   h: 0.82, w: 0.09, lean: 0.16 },
        { a: 1.05,  ox: 0.08,  oz: 0.05,  h: 0.70, w: 0.08, lean: 0.18 },
        { a: 2.10,  ox: -0.08, oz: 0.04,  h: 0.74, w: 0.085, lean: 0.17 },
        { a: 3.14,  ox: 0.02,  oz: -0.09, h: 0.65, w: 0.08, lean: 0.15 },
        { a: 4.18,  ox: -0.06, oz: -0.06, h: 0.78, w: 0.085, lean: 0.19 },
        { a: 5.23,  ox: 0.07,  oz: -0.04, h: 0.62, w: 0.075, lean: 0.16 }
      ];
      blades.forEach(b => {
        const ca = Math.cos(b.a), sa = Math.sin(b.a);
        const rx = -sa, rz = ca;
        const p0x = b.ox - rx * b.w, p0z = b.oz - rz * b.w;
        const p1x = b.ox + rx * b.w, p1z = b.oz + rz * b.w;
        const midX = b.ox + ca * b.lean * 0.45, midZ = b.oz + sa * b.lean * 0.45, midY = b.h * 0.52;
        const m0x = midX - rx * b.w * 0.55, m0z = midZ - rz * b.w * 0.55;
        const m1x = midX + rx * b.w * 0.55, m1z = midZ + rz * b.w * 0.55;
        const tipX = b.ox + ca * b.lean, tipZ = b.oz + sa * b.lean, tipY = b.h;
        pos.push(p0x, 0, p0z, p1x, 0, p1z, m1x, midY, m1z);
        pos.push(p0x, 0, p0z, m1x, midY, m1z, m0x, midY, m0z);
        pos.push(m0x, midY, m0z, m1x, midY, m1z, tipX, tipY, tipZ);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      return g;
    };
    const tuftGeo = makeTuftGeo();
    const grassMat = new THREE.ShaderMaterial({
      uniforms: { uTime: GLOBAL_LIGHT_UNIFORMS.uTime },
      side: THREE.DoubleSide,
      vertexShader: `
        uniform float uTime;
        varying float vH;
        varying vec3 vWp;
        void main() {
          vH = clamp(position.y / 0.82, 0.0, 1.0);
          vec4 wp = instanceMatrix * vec4(position, 1.0);
          float wave = sin(uTime * 2.8 + wp.x * 0.18 + wp.z * 0.15) * cos(uTime * 1.5 + wp.x * 0.08);
          float sway = wave * 0.22 * vH * vH;
          wp.x += sway;
          wp.z += sway * 0.65;
          vWp = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying float vH;
        varying vec3 vWp;
        void main() {
          float cloud = smoothstep(-0.35, 0.55, sin(vWp.x * 0.028 + uTime * 0.38) * cos(vWp.z * 0.025 - uTime * 0.24));
          float cloudShade = mix(0.86, 1.05, cloud);
          vec3 rootCol = vec3(0.12, 0.36, 0.16);
          vec3 midCol  = vec3(0.32, 0.74, 0.24);
          vec3 tipCol  = vec3(0.68, 0.94, 0.34);
          if (vWp.z < -130.0 && abs(vWp.x) < 350.0) {
            rootCol = vec3(0.28, 0.45, 0.62); midCol = vec3(0.65, 0.82, 0.94); tipCol = vec3(0.92, 0.97, 1.0);
          } else if (vWp.x < -140.0 && vWp.z < 235.0) {
            rootCol = vec3(0.14, 0.12, 0.26); midCol = vec3(0.22, 0.44, 0.36); tipCol = vec3(0.66, 0.42, 0.88);
          } else if (vWp.x > 140.0 && vWp.z < 235.0) {
            rootCol = vec3(0.22, 0.14, 0.12); midCol = vec3(0.45, 0.28, 0.20); tipCol = vec3(0.85, 0.46, 0.22);
          } else if (vWp.z > 240.0 && vWp.x < -270.0) {
            rootCol = vec3(0.08, 0.30, 0.28); midCol = vec3(0.14, 0.66, 0.58); tipCol = vec3(0.35, 0.95, 0.85);
          } else if (vWp.z > 240.0 && vWp.x > 270.0) {
            rootCol = vec3(0.38, 0.28, 0.10); midCol = vec3(0.72, 0.58, 0.20); tipCol = vec3(0.98, 0.88, 0.42);
          }
          vec3 baseColor = vH < 0.5 ? mix(rootCol, midCol, vH * 2.0) : mix(midCol, tipCol, (vH - 0.5) * 2.0);
          vec3 sunGold = vec3(1.0, 0.94, 0.75) * (0.24 * vH);
          gl_FragColor = vec4((baseColor + sunGold) * cloudShade, 1.0);
        }
      `
    });
    const grassInst = new THREE.InstancedMesh(tuftGeo, grassMat, bladeCount);
    grassInst.frustumCulled = false;

    const flowerGeo = new THREE.ConeGeometry(0.16, 0.14, 5);
    flowerGeo.rotateX(Math.PI);
    flowerGeo.translate(0, 0.45, 0);
    const flowerInst = new THREE.InstancedMesh(flowerGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), 1100);
    flowerInst.frustumCulled = false;
    const flowerPalette = [new THREE.Color(0xfef08a), new THREE.Color(0xf8fafc), new THREE.Color(0xe879f9), new THREE.Color(0xfca5a5)];

    const gDummy = new THREE.Object3D();
    let placed = 0, flPlaced = 0;
    for (let i = 0; i < 64000 && placed < bladeCount; i++) {
      const patchSeed = Math.floor(i / 6);
      const zone = patchSeed % 6;
      let px, pz;
      if (zone === 0) { px = Math.sin(patchSeed * 43.17) * 220; pz = -82 + ((Math.cos(patchSeed * 19.73) * 0.5 + 0.5) * 290); }
      else if (zone === 1) { px = -165 - Math.abs(Math.sin(patchSeed * 31.11)) * 680; pz = -85 + Math.cos(patchSeed * 17.3) * 280; }
      else if (zone === 2) { px = 165 + Math.abs(Math.sin(patchSeed * 27.43)) * 680; pz = -85 + Math.cos(patchSeed * 23.1) * 280; }
      else if (zone === 3) { px = Math.sin(patchSeed * 19.37) * 320; pz = -390 + ((Math.cos(patchSeed * 13.7) * 0.5 + 0.5) * 240); }
      else if (zone === 4) { px = Math.sin(patchSeed * 41.9) * 760; pz = 260 + ((Math.cos(patchSeed * 29.3) * 0.5 + 0.5) * 520); }
      else { px = Math.sin(patchSeed * 51.7) * 1180; pz = -1250 + ((Math.cos(patchSeed * 37.9) * 0.5 + 0.5) * 520); }

      const gx = px + Math.sin(i * 7.13) * 4.4;
      const gz = pz + Math.cos(i * 11.41) * 4.4;
      if (Math.abs(gx) < 13.5 && gz > -95 && gz < 635) continue;
      if (gz <= -396 && gz >= -690 && Math.abs(gx) <= 165) continue;
      if (Math.hypot(gx, gz - 278) < 32) continue;
      if (Math.hypot(gx + 330, gz - 30) < 40 || Math.hypot(gx - 330, gz - 30) < 88 || Math.hypot(gx, gz + 295) < 44) continue;
      if (Math.abs(gz - 30) < 11.5 && Math.abs(gx) < 1260) continue;
      if (Math.abs(gz - 490) < 12.5 && Math.abs(gx) < 620) continue;
      let inLake = false;
      for (const lk of lakes) {
        if (Math.hypot(gx - lk.x, gz - lk.z) < lk.r + 2.2) { inLake = true; break; }
      }
      if (inLake) continue;
      const gy = this.getGroundHeight(gx, gz);
      if (gy < -0.15) continue;
      const sc = 0.72 + (i % 5) * 0.16;
      gDummy.position.set(gx, gy - 0.03, gz);
      gDummy.rotation.set(0, (i * 1.37) % 6.28, 0);
      gDummy.scale.set(sc, sc * (0.85 + (i % 4) * 0.16), sc);
      gDummy.updateMatrix();
      grassInst.setMatrixAt(placed++, gDummy.matrix);
      if (i % 6 === 0 && flPlaced < 4200) {
        flowerInst.setMatrixAt(flPlaced, gDummy.matrix);
        flowerInst.setColorAt(flPlaced, flowerPalette[flPlaced % flowerPalette.length]);
        flPlaced++;
      }
    }
    grassInst.count = placed;
    grassInst.instanceMatrix.needsUpdate = true;
    flowerInst.count = flPlaced;
    flowerInst.instanceMatrix.needsUpdate = true;
    if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
    this.scene.add(grassInst, flowerInst);

    // 8. 6 FEIXES SOLARES VOLUMÉTRICOS (GOD-RAYS) SOBRE O VALE E LAGOS
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a, transparent: true, opacity: 0.055,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    [[-45, 75], [55, 65], [96, 68], [-96, 52], [0, -15], [-30, 145]].forEach(([rx, rz]) => {
      const ray = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 14.0, 95, 8, 1, true), rayMat);
      ray.position.set(rx, 44, rz);
      ray.rotation.z = -0.36;
      ray.rotation.x = 0.22;
      this.scene.add(ray);
    });

    // 9. 2 CACHOEIRAS ANIMADAS COM ESPUMA E TRANSPARÊNCIA SUAVE NO RIO LATVER (x = ±65, z = -126)
    const wfShader = new THREE.ShaderMaterial({
      uniforms: { uTime: GLOBAL_LIGHT_UNIFORMS.uTime },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float f1 = fract(vUv.y * 3.8 + uTime * 1.65);
          float f2 = fract(vUv.y * 6.4 + uTime * 2.35 + sin(vUv.x * 12.0) * 0.15);
          float streak = sin(vUv.x * 24.0 + uTime * 2.0) * 0.5 + 0.5;
          float splash = (1.0 - smoothstep(0.0, 0.24, vUv.y));
          float foam = smoothstep(0.55, 1.0, f1) * streak * 0.7 + smoothstep(0.65, 1.0, f2) * 0.5 + splash;
          float edgeFade = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);
          vec3 col = mix(vec3(0.14, 0.62, 0.92), vec3(0.94, 0.99, 1.0), clamp(foam, 0.0, 1.0));
          gl_FragColor = vec4(col, (0.76 + splash * 0.22) * edgeFade);
        }
      `
    });
    const cliffRockMat = this.mat(0x475569, { roughness: 0.85, flatShading: true });
    [-65, 65].forEach(wx => {
      const rGeo = new THREE.IcosahedronGeometry(7.5, 1);
      const rp = rGeo.attributes.position;
      for (let v = 0; v < rp.count; v++) {
        rp.setXYZ(v, rp.getX(v) * 1.3, rp.getY(v) * 1.45, rp.getZ(v) * 0.9);
      }
      rGeo.computeVertexNormals();
      const ridge = new THREE.Mesh(rGeo, cliffRockMat);
      ridge.position.set(wx, 5.2, -126);
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 13.0, 4, 10), wfShader);
      sheet.position.set(wx, 5.0, -118.5);
      sheet.rotation.x = 0.18;
      const foam = new THREE.Mesh(new THREE.RingGeometry(1.5, 6.2, 16), new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.68, side: THREE.DoubleSide }));
      foam.rotation.x = -Math.PI / 2;
      foam.position.set(wx, -0.7, -115.5);
      this.scene.add(ridge, sheet, foam);
      if (this.addCollider) this.addCollider(wx, -126, 13, 10, 14, 0);
    });

    // 10. CERCAS DE MADEIRA SÓLIDAS, ROCHAS E ARBUSTOS DECORATIVOS
    const fenceMat = this.mat(0x78350f, { roughness: 0.82 });
    [-12.5, 12.5].forEach(fx => {
      for (let fz = 18; fz <= 148; fz += 16) {
        const gy = this.getGroundHeight(fx, fz);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.20, 7.5), fenceMat);
        rail.position.set(fx, gy + 0.85, fz);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.4, 5), fenceMat);
        post.position.set(fx, gy + 0.7, fz - 3.6);
        this.scene.add(rail, post);
        if (this.addCollider) this.addCollider(fx, fz, 0.8, 7.5, 1.8, gy);
      }
    });
  };

  // BIOMES DO SUL: PLANALTOS DOS CÁRPATOS, SELVA DE VIBRANIUM & RUÍNAS DE ASGARD
  LatveriaWorld.prototype.buildSouthernBiomes = function () {
    const stoneMat = this.mat(0x64748b, { map: ProceduralTextures.createGothicStoneTexture(), roughness: 0.74 });
    const goldMat = this.mat(0xd4a848, { metalness: 0.86, roughness: 0.25, rimColor: 0xfef08a });
    const vibMat = this.mat(0x312e81, { metalness: 0.72, roughness: 0.28, rimColor: 0x2dd4bf, emissive: 0x4c1d95, emissiveIntensity: 0.55 });
    const marbleMat = this.mat(0xe2e8f0, { roughness: 0.42, metalness: 0.12, rimColor: 0xfde68a });

    // 1. Planaltos Dourados dos Cárpatos: Aquedutos Imperiais com Arcos & Torres de Vigia
    [[-55, 420], [55, 420], [-75, 600], [75, 600], [0, 720]].forEach(([ax, az]) => {
      const ay = this.getGroundHeight(ax, az);
      const grp = new THREE.Group();
      grp.position.set(ax, ay, az);
      for (const s of [-1, 1]) {
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.8, 4.2), stoneMat);
        plinth.position.set(s * 9.0, 0.9, 0);
        const pier = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.85, 13.5, 8), stoneMat);
        pier.position.set(s * 9.0, 8.2, 0);
        pier.castShadow = true;
        pier.add(CustomShaders.createInkOutlineMesh(pier.geometry, 0.05, 0x090b15));
        grp.add(plinth, pier);
        if (this.addCollider) this.addCollider(ax + s * 9.0, az, 3.6, 4.0, 17, ay);
      }
      const arch = new THREE.Mesh(new THREE.TorusGeometry(9.0, 1.4, 7, 14, Math.PI), stoneMat);
      arch.position.set(0, 7.6, 0);
      const span = new THREE.Mesh(new THREE.BoxGeometry(23, 2.2, 3.8), stoneMat);
      span.position.set(0, 16.5, 0);
      grp.add(arch, span);
      if (CustomShaders.createWaterMaterial) {
        const canal = new THREE.Mesh(new THREE.PlaneGeometry(20, 2.2), CustomShaders.createWaterMaterial(0x0a3a5c, 0x38bdf8, { mode: 'river' }));
        canal.rotation.x = -Math.PI / 2;
        canal.position.set(0, 17.7, 0);
        grp.add(canal);
      }
      this.scene.add(grp);
      this.swingAnchors.push(new THREE.Vector3(ax, ay + 18.5, az));
    });

    [[-130, 380], [195, 640], [-160, 710]].forEach(([tx, tz]) => {
      const ty = this.getGroundHeight(tx, tz);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.4, 24, 8), stoneMat);
      tower.position.set(tx, ty + 12, tz);
      tower.castShadow = true;
      tower.add(CustomShaders.createInkOutlineMesh(tower.geometry, 0.06, 0x090b15));
      const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 8.5, 8), this.mat(0x9f4335, { roughness: 0.6 }));
      roof.position.set(tx, ty + 28, tz);
      this.scene.add(tower, roof);
      if (this.addCollider) this.addCollider(tx, tz, 10.2, 10.2, 26, ty);
      this.swingAnchors.push(new THREE.Vector3(tx, ty + 26, tz));
    });

    // 2. Selva de Vibranium Ancestral (-560, 540): Meteoros de Vibranium & Totens Pantera
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const vx = -560 + Math.cos(a) * 58;
      const vz = 540 + Math.sin(a) * 58;
      const vy = this.getGroundHeight(vx, vz);
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(3.2, 0), vibMat);
      shard.scale.set(0.85, 3.4, 0.85);
      shard.position.set(vx, vy + 7.5, vz);
      shard.rotation.set(Math.sin(i) * 0.22, a, Math.cos(i) * 0.22);
      shard.add(CustomShaders.createInkOutlineMesh(shard.geometry, 0.06, 0x090b15));
      this.scene.add(shard);
      if (this.addCollider) this.addCollider(vx, vz, 4.6, 4.6, 15, vy);
      this.swingAnchors.push(new THREE.Vector3(vx, vy + 14, vz));
    }
    [[-430, 410], [-670, 410], [-430, 670], [-670, 670]].forEach(([px, pz]) => {
      const py = this.getGroundHeight(px, pz);
      const totem = new THREE.Mesh(new THREE.BoxGeometry(4.0, 14, 4.0), stoneMat);
      totem.position.set(px, py + 7, pz);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), new THREE.MeshBasicMaterial({ color: 0x2dd4bf }));
      gem.position.set(px, py + 15.5, pz);
      this.scene.add(totem, gem);
      if (this.addCollider) this.addCollider(px, pz, 4.4, 4.4, 16, py);
    });

    // 3. Ruínas Solares de Asgard (560, 540): Colunas Douradas & Espada Gigante da Valquíria
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const cx = 560 + Math.cos(a) * 56;
      const cz = 540 + Math.sin(a) * 56;
      const cy = this.getGroundHeight(cx, cz);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 17, 10), marbleMat);
      col.position.set(cx, cy + 8.5, cz);
      col.castShadow = true;
      col.add(CustomShaders.createInkOutlineMesh(col.geometry, 0.05, 0x090b15));
      const cap = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.6, 4.2), goldMat);
      cap.position.set(cx, cy + 17.5, cz);
      this.scene.add(col, cap);
      if (this.addCollider) this.addCollider(cx, cz, 4.0, 4.0, 18, cy);
      this.swingAnchors.push(new THREE.Vector3(cx, cy + 18, cz));
    }
    const swY = this.getGroundHeight(660, 440);
    const swordGrp = new THREE.Group();
    swordGrp.position.set(660, swY, 440);
    swordGrp.rotation.set(0.18, 0.5, -0.22);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(2.6, 26, 0.75), goldMat);
    blade.position.y = 12;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.6, 1.8), goldMat);
    guard.position.y = 21;
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 6.2, 8), marbleMat);
    hilt.position.y = 24.5;
    swordGrp.add(blade, guard, hilt);
    this.scene.add(swordGrp);
    if (this.addCollider) this.addCollider(660, 440, 5.2, 5.2, 24, swY);
    this.swingAnchors.push(new THREE.Vector3(660, swY + 23, 440));

    // Cristais curativos extras espalhados pelos biomas expandidos
    const extraCrystals = [
      [0, 440, 0xfacc15], [-165, 580, 0x34d399], [-515, 515, 0x2dd4bf], [-610, 610, 0xa855f7],
      [515, 515, 0xfef08a], [610, 610, 0x38bdf8], [-620, 35, 0xc084fc], [640, 35, 0xf97316]
    ];
    extraCrystals.forEach(([cx, cz, col], idx) => {
      const gy = this.getGroundHeight(cx, cz);
      const grp = new THREE.Group();
      const gemGeo = new THREE.OctahedronGeometry(0.95, 0);
      const gem = new THREE.Mesh(gemGeo, new THREE.MeshBasicMaterial({ color: col }));
      gem.scale.set(0.8, 1.45, 0.8);
      gem.add(CustomShaders.createInkOutlineMesh(gemGeo, 0.06, 0x090b15));
      grp.add(gem);
      grp.position.set(cx, gy + 1.6, cz);
      this.scene.add(grp);
      this.lootCrystals.push({
        mesh: grp, gem, pos: new THREE.Vector3(cx, gy + 1.6, cz), baseY: gy + 1.6,
        color: col, collected: false, respawnTimer: 0, phase: idx * 0.9
      });
    });
  };

  // LANDMARKS EXPANDIDOS NA FLORESTA EXTERNA, DESERTO SENTINELA & TUNDRA NORTE
  LatveriaWorld.prototype.buildExpandedOuterLandmarks = function () {
    const gothicMat = this.mat(0x2e2a40, { map: ProceduralTextures.createGothicStoneTexture(), roughness: 0.8 });
    const traskMat = this.mat(0x334155, { metalness: 0.82, roughness: 0.28, rimColor: 0xf97316 });
    const iceMat = this.mat(0x7dd3fc, { metalness: 0.35, roughness: 0.2, transparent: true, opacity: 0.88 });

    // Basílica Arruinada na Floresta Negra Externa (-620, 45)
    const fy = this.getGroundHeight(-620, 45);
    for (const s of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(4.0, 18, 4.0), gothicMat);
      pillar.position.set(-620, fy + 9, 45 + s * 14);
      this.scene.add(pillar);
      if (this.addCollider) this.addCollider(-620, 45 + s * 14, 4.4, 4.4, 19, fy);
    }
    const altar = new THREE.Mesh(new THREE.OctahedronGeometry(2.4, 0), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
    altar.position.set(-620, fy + 4.5, 45);
    this.scene.add(altar);

    // Refinaria Trask na Cratera Leste Externa (640, 45)
    for (const [sx, sz] of [[630, 12], [655, 65], [705, 18]]) {
      const sy = this.getGroundHeight(sx, sz);
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.2, 22, 10), traskMat);
      silo.position.set(sx, sy + 11, sz);
      silo.add(CustomShaders.createInkOutlineMesh(silo.geometry, 0.06, 0x090b15));
      this.scene.add(silo);
      if (this.addCollider) this.addCollider(sx, sz, 11.8, 11.8, 23, sy);
      this.swingAnchors.push(new THREE.Vector3(sx, sy + 23, sz));
    }

    // Arcos Aurora & Restos Nódicos na Tundra Expandida
    [[-210, -290], [210, -290]].forEach(([ax, az]) => {
      const ay = this.getGroundHeight(ax, az);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(16, 1.8, 6, 14, Math.PI), iceMat);
      arch.position.set(ax, ay, az);
      this.scene.add(arch);
      if (this.addCollider) {
        this.addCollider(ax - 15.5, az, 4.2, 4.2, 14, ay);
        this.addCollider(ax + 15.5, az, 4.2, 4.2, 14, ay);
      }
    });
  };

  LatveriaWorld.prototype.buildDenseContinentalScenery = function () {
    // 1. Sculpted Instanced Stratified Boulders across all biomes (zero primitive dodecahedrons)
    const rockGeo = new THREE.IcosahedronGeometry(1.4, 1);
    const rp = rockGeo.attributes.position;
    for (let i = 0; i < rp.count; i++) {
      const rx = rp.getX(i), ry = rp.getY(i), rz = rp.getZ(i);
      const n = 1.0 + 0.18 * Math.sin(rx * 3.1 + rz * 2.4);
      rp.setXYZ(i, rx * 1.25 * n, ry < 0 ? ry * 0.42 : ry * 0.78 * n, rz * 1.1 * n);
    }
    rockGeo.computeVertexNormals();
    const rockMat = this.mat(0xffffff, { roughness: 0.84, flatShading: true, rimColor: 0x94a3b8 });
    const rockCount = 380;
    const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    rockInst.castShadow = true;
    rockInst.frustumCulled = false;

    // 2. Sculpted Fluted Stone Ruins & Waymarkers lining roads and outer wilderness
    const colGeo = new THREE.CylinderGeometry(0.68, 0.88, 6.4, 8);
    colGeo.translate(0, 3.2, 0);
    const colMat = this.mat(0x64748b, { map: ProceduralTextures.createGothicStoneTexture(), roughness: 0.72 });
    const colCount = 260;
    const colInst = new THREE.InstancedMesh(colGeo, colMat, colCount);
    colInst.castShadow = true;
    colInst.frustumCulled = false;

    // 3. Road Streetlamp Posts & Lanterns lining East/West, Tundra & South Roads
    const lampSpots = [];
    for (let x = -860; x <= 860; x += 48) {
      if (Math.abs(x) < 36 || Math.hypot(x + 330, 0) < 48 || Math.hypot(x - 330, 0) < 56) continue;
      lampSpots.push([x, 19]); lampSpots.push([x, 41]);
    }
    for (let z = -345; z <= -160; z += 44) {
      if (Math.abs(z + 295) < 46) continue;
      lampSpots.push([-12, z]); lampSpots.push([12, z]);
    }
    for (let z = 345; z <= 610; z += 52) {
      lampSpots.push([-10.5, z]); lampSpots.push([10.5, z]);
    }
    const postGeo = new THREE.CylinderGeometry(0.14, 0.24, 5.6, 6);
    postGeo.translate(0, 2.8, 0);
    const lanternGeo = new THREE.OctahedronGeometry(0.36, 0);
    lanternGeo.translate(0, 5.75, 0);
    const postInst = new THREE.InstancedMesh(postGeo, this.mat(0x1e2536, { metalness: 0.8, roughness: 0.3 }), lampSpots.length);
    const lanternInst = new THREE.InstancedMesh(lanternGeo, new THREE.MeshBasicMaterial({ color: 0xfde047 }), lampSpots.length);
    postInst.frustumCulled = false;
    lanternInst.frustumCulled = false;

    // 4. Doomstadt & Countryside Supply Crates with Solid Colliders
    const crateGeo = new THREE.BoxGeometry(1.15, 1.15, 1.15);
    crateGeo.translate(0, 0.58, 0);
    const crateInst = new THREE.InstancedMesh(crateGeo, this.mat(0x78350f, { roughness: 0.8 }), 220);
    crateInst.frustumCulled = false;

    const dm = new THREE.Object3D();
    const cSlate = new THREE.Color(0x64748b);
    const cMoss = new THREE.Color(0x3f4e45);
    const cObs = new THREE.Color(0x3b2c35);
    const cFrost = new THREE.Color(0x94a3b8);

    let rIdx = 0;
    for (let i = 0; i < 2200 && rIdx < rockCount; i++) {
      const rx = Math.sin(i * 19.31) * 1240;
      const rz = -1220 + ((Math.cos(i * 41.73) * 0.5 + 0.5) * 1980);
      if (!this.canPlaceProp(rx, rz, 3.0)) continue;
      const gy = this.getGroundHeight(rx, rz);
      if (gy < -0.1) continue;
      const sc = 0.75 + (i % 5) * 0.35;
      dm.position.set(rx, gy, rz);
      dm.rotation.set(0, (i * 1.7) % 6.28, 0);
      dm.scale.set(sc, sc * (0.7 + (i % 3) * 0.2), sc);
      dm.updateMatrix();
      rockInst.setMatrixAt(rIdx, dm.matrix);
      rockInst.setColorAt(rIdx, rz < -140 ? cFrost : rx > 160 ? cObs : rx < -160 ? cMoss : cSlate);
      if (this.addCollider) this.addCollider(rx, rz, 2.7 * sc, 2.7 * sc, 2.4 * sc, gy);
      rIdx++;
    }
    rockInst.count = rIdx;
    rockInst.instanceMatrix.needsUpdate = true;
    if (rockInst.instanceColor) rockInst.instanceColor.needsUpdate = true;

    let cIdx = 0;
    for (let i = 0; i < 1500 && cIdx < colCount; i++) {
      const cx = Math.sin(i * 23.81) * 1120;
      const cz = -1140 + ((Math.cos(i * 53.19) * 0.5 + 0.5) * 1880);
      if (!this.canPlaceProp(cx, cz, 2.4)) continue;
      const gy = this.getGroundHeight(cx, cz);
      if (gy < -0.1) continue;
      dm.position.set(cx, gy, cz);
      dm.rotation.set((i % 7 === 0 ? 0.14 : 0), (i * 0.9) % 6.28, (i % 5 === 0 ? -0.12 : 0));
      const hSc = 0.75 + (i % 4) * 0.25;
      dm.scale.set(1, hSc, 1);
      dm.updateMatrix();
      colInst.setMatrixAt(cIdx++, dm.matrix);
      if (this.addCollider) this.addCollider(cx, cz, 1.9, 1.9, 7.0 * hSc, gy);
    }
    colInst.count = cIdx;
    colInst.instanceMatrix.needsUpdate = true;

    lampSpots.forEach(([lx, lz], i) => {
      const ly = this.getGroundHeight(lx, lz);
      dm.position.set(lx, ly, lz);
      dm.rotation.set(0, 0, 0);
      dm.scale.set(1, 1, 1);
      dm.updateMatrix();
      postInst.setMatrixAt(i, dm.matrix);
      lanternInst.setMatrixAt(i, dm.matrix);
      if (this.addCollider) this.addCollider(lx, lz, 0.9, 0.9, 6.2, ly);
    });

    let kIdx = 0;
    for (let i = 0; i < 640 && kIdx < 220; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const kx = side * (16 + (i % 5) * 9);
      const kz = -65 + ((i * 13) % 240);
      if (!this.canPlaceProp(kx, kz, 1.5)) continue;
      const gy = this.getGroundHeight(kx, kz);
      dm.position.set(kx, gy, kz);
      dm.rotation.set(0, i * 0.6, 0);
      const s = 0.8 + (i % 3) * 0.25;
      dm.scale.set(s, s, s);
      dm.updateMatrix();
      crateInst.setMatrixAt(kIdx++, dm.matrix);
      if (this.addCollider) this.addCollider(kx, kz, 1.25 * s, 1.25 * s, 1.2 * s, gy);
    }
    crateInst.count = kIdx;
    crateInst.instanceMatrix.needsUpdate = true;

    // 5. Biome Landmark Crystal / Slag Formations (populates horizon & mid-ground vistas cleanly)
    const shardGeo = new THREE.OctahedronGeometry(1.15, 0);
    shardGeo.scale(0.85, 2.25, 0.85);
    shardGeo.translate(0, 1.9, 0);
    const crystalCount = 240;
    const crystalInst = new THREE.InstancedMesh(shardGeo, this.mat(0xffffff, { metalness: 0.45, roughness: 0.25, emissive: 0x1e293b, emissiveIntensity: 0.35 }), crystalCount);
    crystalInst.frustumCulled = false;
    const cOrange = new THREE.Color(0xf97316);
    const cPurple = new THREE.Color(0xa855f7);
    const cCyan = new THREE.Color(0x38bdf8);
    const cTeal = new THREE.Color(0x2dd4bf);
    const cGold = new THREE.Color(0xfacc15);
    let crIdx = 0;
    for (let i = 0; i < 1600 && crIdx < crystalCount; i++) {
      const cx = Math.sin(i * 31.7) * 980;
      const cz = -920 + ((Math.cos(i * 47.3) * 0.5 + 0.5) * 1650);
      if (!this.canPlaceProp(cx, cz, 2.2)) continue;
      const gy = this.getGroundHeight(cx, cz);
      const sc = 0.75 + (i % 4) * 0.38;
      dm.position.set(cx, gy - 0.15, cz);
      dm.rotation.set((i % 3 - 1) * 0.14, i * 1.1, (i % 5 - 2) * 0.08);
      dm.scale.set(sc, sc * (0.9 + (i % 3) * 0.28), sc);
      dm.updateMatrix();
      crystalInst.setMatrixAt(crIdx, dm.matrix);
      crystalInst.setColorAt(crIdx, cx > 130 ? cOrange : cx < -130 && cz < 240 ? cPurple : cz < -130 ? cCyan : cz > 240 && cx < -240 ? cTeal : cGold);
      if (this.addCollider) this.addCollider(cx, cz, 1.85 * sc, 1.85 * sc, 4.2 * sc, gy);
      crIdx++;
    }
    crystalInst.count = crIdx;
    crystalInst.instanceMatrix.needsUpdate = true;
    if (crystalInst.instanceColor) crystalInst.instanceColor.needsUpdate = true;

    this.scene.add(rockInst, colInst, postInst, lanternInst, crateInst, crystalInst);
  };

  LatveriaWorld.prototype.update = function (delta, time) {
    if (_origUpdate) _origUpdate.call(this, delta, time);
    if (this.animatedObjects) {
      for (const a of this.animatedObjects) {
        if (a.type === 'float') {
          a.mesh.position.y = a.baseY + Math.sin(time * a.speed + a.phase) * 0.55;
          a.mesh.rotation.y = time * 1.1 + a.phase;
        } else if (a.type === 'spinZ') {
          a.mesh.rotation.z = time * a.speed;
        }
      }
    }
    if (this.sealObelisks) {
      for (const s of this.sealObelisks) {
        if (!s.broken && s.gem) {
          s.gem.rotation.y = time * 2.5;
          s.gem.position.y = 14.2 + Math.sin(time * 2.8) * 0.45;
        }
      }
    }
    if (this.energyTowers) {
      for (const tw of this.energyTowers) {
        if (!tw.destroyed && tw.crystal) {
          tw.crystal.rotation.y = time * 2.2;
          tw.crystal.position.y = 12.4 + Math.sin(time * 3.0) * 0.4;
        }
      }
    }
    if (this.airships) {
      for (const s of this.airships) {
        const t = time * s.cfg.spd + s.phase;
        const nx = s.cfg.x + Math.cos(t) * s.cfg.rx;
        const nz = s.cfg.z + Math.sin(t) * s.cfg.rz;
        const dx = -Math.sin(t) * s.cfg.rx * s.cfg.spd;
        const dz = Math.cos(t) * s.cfg.rz * s.cfg.spd;
        s.mesh.position.set(nx, s.cfg.y + Math.sin(time * 1.4 + s.phase) * 1.8, nz);
        s.mesh.rotation.y = Math.atan2(dx, dz);
      }
    }
    if (this.skyBirds) {
      for (const b of this.skyBirds) {
        const t = time * b.spd + b.phase;
        const nx = b.cx + Math.cos(t) * b.rad;
        const nz = b.cz + Math.sin(t) * b.rad;
        b.mesh.position.set(nx, b.cy + Math.sin(time * 2.2 + b.phase) * 1.5, nz);
        b.mesh.rotation.y = Math.atan2(-Math.sin(t) * b.spd, Math.cos(t) * b.spd);
        const flap = Math.sin(time * 11 + b.phase) * 0.6;
        b.wL.rotation.z = flap;
        b.wR.rotation.z = -flap;
      }
    }
    if (this.windmillBlades) {
      this.windmillBlades.rotation.z = -time * 0.85;
    }
    if (this.lootCrystals) {
      for (const c of this.lootCrystals) {
        if (c.collected) {
          c.respawnTimer -= delta;
          if (c.respawnTimer <= 0) { c.collected = false; c.mesh.visible = true; }
        } else {
          c.mesh.position.y = c.baseY + Math.sin(time * 2.8 + c.phase) * 0.35;
          c.gem.rotation.y = time * 2.2 + c.phase;
        }
      }
    }
  };
})();

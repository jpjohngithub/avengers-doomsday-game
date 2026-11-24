// Latveria Open-World & Castle Doom Architecture Generator (Clean High-Contrast Lighting)
class LatveriaWorld {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.buildingBoxes = [];
    this.castleGroup = null;
    this.giantSphere = null;
    this.init();
  }

  init() {
    this.buildTerrain();
    this.buildCobblestoneRoads();
    this.buildLowerTown();
    this.buildGiantArcologySphere();
    this.buildCastleDoom();
    this.buildLightingAndAtmosphere();
  }

  getGroundHeight(x, z) {
    if (z <= -105) return 32.5;
    if (z < -70) {
      const t = (-z - 70) / 35.0;
      return t * 32.5;
    }
    return 0;
  }

  buildTerrain() {
    const terrainGeo = new THREE.PlaneGeometry(460, 460, 72, 72);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let height = 0;

      const roadClearance = Math.min(1, Math.max(0, (Math.abs(x) - 18) / 25));

      if (Math.abs(x) > 36) {
        height += Math.pow((Math.abs(x) - 36) * 0.14, 1.75) * 4.5;
      }

      if (z < -70) {
        const cliffFactor = Math.min(1.0, (-z - 70) / 35.0);
        height = Math.max(height, cliffFactor * 32.5);
      }

      height += Math.sin(x * 0.06) * Math.cos(z * 0.06) * 1.4 * roadClearance;
      pos.setY(i, height);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x18221f,
      roughness: 0.92,
      metalness: 0.05,
      flatShading: true
    });

    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);
  }

  buildCobblestoneRoads() {
    const cobbleTex = ProceduralTextures.createCobblestoneTexture();
    const roadMat = new THREE.MeshStandardMaterial({
      map: cobbleTex,
      roughness: 0.8,
      metalness: 0.15
    });

    const roadGeo = new THREE.PlaneGeometry(20, 140);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, 0.12, 0);
    road.receiveShadow = true;
    this.scene.add(road);

    const dy = 32.5;
    const dz = 35;
    const rampLength = Math.sqrt(dy * dy + dz * dz);
    const rampAngle = Math.atan2(dy, dz);

    const bridgeGroup = new THREE.Group();
    const deckGeo = new THREE.BoxGeometry(18, 2.5, rampLength + 2);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.82,
      metalness: 0.2
    });
    const deck = new THREE.Mesh(deckGeo, stoneMat);
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridgeGroup.add(deck);

    const parapetGeo = new THREE.BoxGeometry(1.2, 3.5, rampLength);
    const leftParapet = new THREE.Mesh(parapetGeo, stoneMat);
    leftParapet.position.set(-8.5, 1.5, 0);
    const rightParapet = leftParapet.clone();
    rightParapet.position.x = 8.5;
    bridgeGroup.add(leftParapet, rightParapet);

    bridgeGroup.position.set(0, 16.25 - 1.1, -87.5);
    bridgeGroup.rotation.x = rampAngle;
    this.scene.add(bridgeGroup);
  }

  buildLowerTown() {
    const facade1 = ProceduralTextures.createBuildingFacadeTexture('#94a3b8', '#d97706');
    const facade2 = ProceduralTextures.createBuildingFacadeTexture('#64748b', '#10b981');

    const houseMat1 = new THREE.MeshStandardMaterial({ map: facade1, roughness: 0.75 });
    const houseMat2 = new THREE.MeshStandardMaterial({ map: facade2, roughness: 0.78 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.65 });
    const bannerMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      roughness: 0.55
    });

    const housePositions = [
      { x: -20, z: 45, w: 12, h: 15, d: 15 },
      { x: -22, z: 22, w: 13, h: 17, d: 16 },
      { x: -21, z: -2, w: 12, h: 18, d: 15 },
      { x: -23, z: -26, w: 14, h: 20, d: 16 },
      { x: -22, z: -50, w: 13, h: 19, d: 16 },
      { x: 20, z: 45, w: 12, h: 16, d: 15 },
      { x: 22, z: 22, w: 13, h: 18, d: 16 },
      { x: 21, z: -2, w: 12, h: 19, d: 15 },
      { x: 23, z: -26, w: 14, h: 21, d: 16 },
      { x: 22, z: -50, w: 13, h: 18, d: 16 },
      { x: -38, z: 12, w: 15, h: 14, d: 18 },
      { x: 38, z: 12, w: 15, h: 15, d: 18 },
      { x: -38, z: -22, w: 16, h: 16, d: 18 },
      { x: 38, z: -22, w: 16, h: 16, d: 18 }
    ];

    housePositions.forEach((hp, idx) => {
      const houseGroup = new THREE.Group();
      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(hp.w, hp.h, hp.d),
        idx % 2 === 0 ? houseMat1 : houseMat2
      );
      bMesh.position.y = hp.h / 2;
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      houseGroup.add(bMesh);

      const rGeo = new THREE.ConeGeometry(Math.max(hp.w, hp.d) * 0.74, hp.h * 0.42, 4);
      rGeo.rotateY(Math.PI / 4);
      const rMesh = new THREE.Mesh(rGeo, roofMat);
      rMesh.position.y = hp.h + (hp.h * 0.42) / 2;
      rMesh.castShadow = true;
      houseGroup.add(rMesh);

      const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 7), bannerMat);
      banner.position.set(hp.x < 0 ? hp.w / 2 + 0.1 : -hp.w / 2 - 0.1, hp.h * 0.6, 0);
      banner.rotation.y = hp.x < 0 ? Math.PI / 2 : -Math.PI / 2;
      houseGroup.add(banner);

      houseGroup.position.set(hp.x, 0, hp.z);
      this.scene.add(houseGroup);

      this.buildingBoxes.push({
        x: hp.x,
        z: hp.z,
        w: hp.w,
        d: hp.d
      });
    });

    // Streetlamps with Soft Non-Blinding Lanterns
    for (let z = 45; z >= -55; z -= 25) {
      this.createStreetlamp(-10.5, 0, z);
      this.createStreetlamp(10.5, 0, z);
    }
  }

  createStreetlamp(x, y, z) {
    const lampG = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.35 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 5.2, 8), postMat);
    post.position.y = 2.6;
    lampG.add(post);

    const lantern = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.36, 1),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.7 })
    );
    lantern.position.y = 5.3;
    lampG.add(lantern);

    lampG.position.set(x, y, z);
    this.scene.add(lampG);
  }

  buildGiantArcologySphere() {
    const sphereG = new THREE.Group();

    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.35,
      metalness: 0.75
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(32, 36, 36), sphereMat);
    sphere.position.y = 82;
    sphere.castShadow = true;
    sphereG.add(sphere);

    const eqRing = new THREE.Mesh(
      new THREE.TorusGeometry(32.3, 0.6, 12, 48),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
    );
    eqRing.rotation.x = Math.PI / 2;
    eqRing.position.y = 75;
    sphereG.add(eqRing);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 24, 56, 20),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55, metalness: 0.5 })
    );
    base.position.y = 28;
    sphereG.add(base);

    sphereG.position.set(-72, 0, -120);
    this.scene.add(sphereG);
    this.giantSphere = sphereG;
  }

  buildCastleDoom() {
    this.castleGroup = new THREE.Group();
    const stoneWallMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      metalness: 0.2
    });
    const darkSpireMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.65
    });
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.45,
      metalness: 0.45
    });

    const sanctumFloor = new THREE.Mesh(new THREE.BoxGeometry(64, 1, 76), floorMat);
    sanctumFloor.position.set(0, 32.1, -142);
    sanctumFloor.receiveShadow = true;
    this.castleGroup.add(sanctumFloor);

    const floorRuneMat = CustomShaders.createMysticRuneMaterial(0x10b981);
    const floorRune = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), floorRuneMat);
    floorRune.rotation.x = -Math.PI / 2;
    floorRune.position.set(0, 32.65, -138);
    this.castleGroup.add(floorRune);
    this.floorRuneMat = floorRuneMat;

    const sideWallGeo = new THREE.BoxGeometry(4, 28, 74);
    const leftWall = new THREE.Mesh(sideWallGeo, stoneWallMat);
    leftWall.position.set(-30, 46, -142);
    leftWall.castShadow = true;
    const rightWall = leftWall.clone();
    rightWall.position.x = 30;
    this.castleGroup.add(leftWall, rightWall);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(64, 34, 5), stoneWallMat);
    backWall.position.set(0, 49, -178);
    backWall.castShadow = true;
    this.castleGroup.add(backWall);

    const gateSideGeo = new THREE.BoxGeometry(22, 26, 5);
    const gateLeft = new THREE.Mesh(gateSideGeo, stoneWallMat);
    gateLeft.position.set(-19, 45, -106);
    const gateRight = gateLeft.clone();
    gateRight.position.x = 19;
    const gateLintel = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 5), stoneWallMat);
    gateLintel.position.set(0, 53, -106);
    this.castleGroup.add(gateLeft, gateRight, gateLintel);

    const towerCoords = [
      { x: -30, z: -106 },
      { x: 30, z: -106 },
      { x: -30, z: -178 },
      { x: 30, z: -178 }
    ];
    towerCoords.forEach(tc => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 46, 14), stoneWallMat);
      tower.position.set(tc.x, 55, tc.z);
      tower.castShadow = true;
      const spire = new THREE.Mesh(new THREE.ConeGeometry(7.2, 24, 14), darkSpireMat);
      spire.position.set(tc.x, 90, tc.z);
      spire.castShadow = true;
      this.castleGroup.add(tower, spire);
    });

    for (let z = -118; z >= -162; z -= 14) {
      [-18, 18].forEach(px => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 24, 10), stoneWallMat);
        pillar.position.set(px, 44, z);
        pillar.castShadow = true;
        this.castleGroup.add(pillar);
      });
    }

    const dais = new THREE.Mesh(new THREE.CylinderGeometry(10, 13, 2.4, 20), darkSpireMat);
    dais.position.set(0, 33.5, -164);
    const throneBack = new THREE.Mesh(new THREE.BoxGeometry(6, 13, 2), darkSpireMat);
    throneBack.position.set(0, 40, -167);
    this.castleGroup.add(dais, throneBack);

    const throneLight = new THREE.PointLight(0x10b981, 1.2, 40);
    throneLight.position.set(0, 41, -155);
    this.castleGroup.add(throneLight);

    this.scene.add(this.castleGroup);
  }

  buildLightingAndAtmosphere() {
    // Clean, Natural Balanced Illumination (Zero Whiteout Glare)
    const hemiLight = new THREE.HemisphereLight(0xcbd5e1, 0x1e293b, 0.85);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xf8fafc, 1.15);
    dirLight.position.set(85, 140, 75);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 420;
    dirLight.shadow.camera.left = -130;
    dirLight.shadow.camera.right = 130;
    dirLight.shadow.camera.top = 130;
    dirLight.shadow.camera.bottom = -130;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    const skyGeo = new THREE.SphereGeometry(360, 32, 32);
    this.skyMat = CustomShaders.createSkyShader();
    const skyMesh = new THREE.Mesh(skyGeo, this.skyMat);
    this.scene.add(skyMesh);

    this.scene.fog = new THREE.FogExp2(0x0c151c, 0.0028);
  }

  update(time) {
    if (this.skyMat) {
      this.skyMat.uniforms.uTime.value = time;
    }
    if (this.floorRuneMat) {
      this.floorRuneMat.uniforms.uTime.value = time;
    }
  }
}

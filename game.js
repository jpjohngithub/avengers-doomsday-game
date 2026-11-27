// ============================================================================
// AVENGERS: DOOMSDAY — AAA COMBAT, UNIQUE HERO PHYSICS, ELDEN-RING BOSS & VFX
// ============================================================================

class DoomsdayGame {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.isPlaying = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.selectedHeroId = 'spider_man';

    // Core Game Feel & Timing
    this.timeScale = 1.0;
    this.slowMoTimer = 0;
    this.hitstopTimer = 0;
    this.cameraTrauma = 0;
    this.chromaPulse = 0;
    this.indoorMix = 0;

    // Showcase Camera Orbit
    this.showcaseRotY = 0.25;
    this.isDraggingMenu = false;
    this.lastMouseX = 0;

    // Player State & Physics
    this.playerMesh = null;
    this.playerState = {
      pos: new THREE.Vector3(0, 0, 52),
      vel: new THREE.Vector3(0, 0, 0),
      yaw: Math.PI,
      isGrounded: true,
      isFlying: false,
      isSwinging: false,
      swingCooldown: 0,
      swingAnchor: null,
      swingRopeLen: 14,
      swingWebLine: null,
      coyoteTimer: 0,
      jumpsRemaining: 2,
      hp: 540,
      maxHp: 540,
      trailingHp: 540,
      stamina: 100,
      maxStamina: 100,
      healFlasks: 3,
      maxHealFlasks: 3,
      ultCharge: 0,
      dashCooldown: 0,
      skillCooldown: 0,
      uniqueCooldown: 0,
      primaryCooldown: 0,
      comboIndex: 0,
      comboResetTimer: 0,
      shieldActive: false,
      shieldTimer: 0,
      shieldMesh: null,
      invulnTimer: 0,
      perfectDodgeWindow: 0,
      thrownCape: { active: false, phase: 'idle', target: null, timer: 0, pos: new THREE.Vector3() },
      thrownMjolnir: { active: false, returning: false, timer: 0, pos: new THREE.Vector3(), dir: new THREE.Vector3(), mesh: null, hitSet: new Set() }
    };

    // Camera Action-RPG Elevated Over-Right-Shoulder
    this.camYaw = Math.PI;
    this.camPitch = 0.22;
    this.userCamDist = 6.2;
    this.camDist = 6.2;
    this.camSmoothPivot = new THREE.Vector3(0, 2, 165);
    this.camRoll = 0;
    this.keys = {};
    this.mouseDown = false;
    this.rightMouseDown = false;

    // Enemies, Boss, Projectiles & Shader VFX Pools
    this.doombots = [];
    this.doombotsKilled = 0;
    this.doomBoss = {
      mesh: null,
      pos: new THREE.Vector3(0, 0.0, -578),
      vel: new THREE.Vector3(),
      hp: 12500,
      maxHp: 12500,
      trailingHp: 12500,
      posture: 0,
      maxPosture: 780,
      staggeredTimer: 0,
      phase: 1,
      active: false,
      state: 'idle', // idle | windup | recover
      stateTimer: 1.5,
      pendingMove: null,
      comboQueue: [],
      multiverseBlades: [],
      bladeFireCd: 0,
      teleportCooldown: 0,
      beamMesh: null,
      beamMesh2: null,
      beamYaw: 0,
      beamSweepTimer: 0,
      markedTimer: 0
    };

    this.projectiles = [];
    this.vfxEffects = [];
    this.telegraphs = [];
    this.healOrbs = [];
    this.sparks = [];
    this.slashArcs = [];
    this.boomerangs = [];
    this.activeClothMeshes = [];

    this.comboCount = 0;
    this.comboTimer = 0;
    this.lockedTarget = null;
    this.clock = new THREE.Clock();

    this.initThree();
    this.initShowcaseStage();
    this.initUI();
    this.setupEvents();
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.15, 7000);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // AAA Post-Processing Pipeline: Render -> Bloom -> Cinematic Color Grade + Chromatic Pulse
    this.composer = null;
    this.bloomPass = null;
    this.colorGradePass = null;
    if (typeof THREE.EffectComposer !== 'undefined' && typeof THREE.UnrealBloomPass !== 'undefined') {
      this.composer = new THREE.EffectComposer(this.renderer);
      this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

      this.bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(Math.floor(window.innerWidth * 0.5), Math.floor(window.innerHeight * 0.5)),
        0.18, // crisp selective cartoon bloom
        0.36,
        0.92
      );
      this.composer.addPass(this.bloomPass);

      if (typeof THREE.ShaderPass !== 'undefined') {
        this.colorGradePass = new THREE.ShaderPass(CustomShaders.CinematicColorGradeShader);
        this.colorGradePass.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        this.composer.addPass(this.colorGradePass);
      }
    }

    this.vfx = typeof VFXEngine !== 'undefined' ? new VFXEngine(this.scene) : null;
    this.world = new LatveriaWorld(this.scene);
    this.initDoctorDoom();
    this.spawnDoombots();
  }

  // Register Verlet cloth meshes into world scene cleanly
  attachClothToScene(characterMesh) {
    if (characterMesh && characterMesh.userData.clothSim) {
      const clothMesh = characterMesh.userData.clothSim.mesh;
      if (!clothMesh.parent) {
        this.scene.add(clothMesh);
      }
      if (!this.activeClothMeshes.includes(characterMesh)) {
        this.activeClothMeshes.push(characterMesh);
      }
    }
  }

  detachClothFromScene(characterMesh) {
    if (characterMesh && characterMesh.userData.clothSim) {
      const clothMesh = characterMesh.userData.clothSim.mesh;
      if (clothMesh.parent) clothMesh.parent.remove(clothMesh);
    }
    this.activeClothMeshes = this.activeClothMeshes.filter((m) => m !== characterMesh);
  }

  updateClothForCharacter(mesh, dt, time) {
    if (!mesh || !mesh.userData.clothSim || !mesh.visible) return;
    const sim = mesh.userData.clothSim;
    const p = mesh.userData.parts;
    if (!p || !p.capeAnchorL || !p.capeAnchorR) return;

    try {
      mesh.updateMatrixWorld(true);
      const leftW = new THREE.Vector3();
      const rightW = new THREE.Vector3();
      const torsoW = new THREE.Vector3();
      p.capeAnchorL.getWorldPosition(leftW);
      p.capeAnchorR.getWorldPosition(rightW);
      p.chest.getWorldPosition(torsoW);

      const backDir = new THREE.Vector3(0, 0, -1).applyQuaternion(mesh.quaternion).normalize();
      const groundY = this.world ? this.world.getGroundHeight(torsoW.x, torsoW.z) : 0;
      sim.update(dt, time, leftW, rightW, backDir, torsoW, 0.46, groundY);
    } catch (e) {
      // Never stall render loop if cloth geometry is transitioning
    }
  }

  initShowcaseStage() {
    this.showcaseRimLight = new THREE.PointLight(0xef4444, 1.35, 16);
    this.showcaseRimLight.position.set(-2.6, 3.6, 279.5);
    this.scene.add(this.showcaseRimLight);
    this.updateShowcaseHero(this.selectedHeroId);
  }

  updateShowcaseHero(heroId) {
    this.selectedHeroId = heroId;
    const data = HEROES_DATA[heroId];
    if (!data) return;

    if (this.showcaseHero) {
      this.detachClothFromScene(this.showcaseHero);
      this.scene.remove(this.showcaseHero);
    }
    this.showcaseHero = CharacterBuilder.buildHeroMesh(heroId);
    this.showcaseHero.position.set(0, 0.0, 278.0);
    this.showcaseHero.rotation.y = this.showcaseRotY;
    this.scene.add(this.showcaseHero);
    this.attachClothToScene(this.showcaseHero);

    if (this.world.showcaseRuneMat) {
      this.world.showcaseRuneMat.uniforms.uColor.value.setHex(data.colorHex);
    }
    if (this.showcaseRimLight) {
      this.showcaseRimLight.color.setHex(data.colorHex);
    }
    this.updateMenuInspector(data);
  }

  initDoctorDoom() {
    if (this.doomBoss.mesh) {
      this.detachClothFromScene(this.doomBoss.mesh);
      this.scene.remove(this.doomBoss.mesh);
    }
    this.doomBoss.mesh = CharacterBuilder.buildDoctorDoomMesh();
    this.doomBoss.pos.set(0, 0.0, -594);
    this.doomBoss.mesh.position.copy(this.doomBoss.pos);
    this.doomBoss.hp = 12500;
    this.doomBoss.maxHp = 12500;
    this.doomBoss.trailingHp = 12500;
    this.doomBoss.posture = 0;
    this.doomBoss.maxPosture = 780;
    this.doomBoss.staggeredTimer = 0;
    this.doomBoss.phase = 1;
    this.doomBoss.active = false;
    this.doomBoss.state = 'idle';
    this.doomBoss.stateTimer = 1.2;
    this.doomBoss.pendingMove = null;
    this.doomBoss.comboQueue = [];
    this.doomBoss.multiverseBlades = [];
    this.doomBoss.bladeFireCd = 0;
    this.doomBoss.markedTimer = 0;
    this.scene.add(this.doomBoss.mesh);
    this.attachClothToScene(this.doomBoss.mesh);
  }

  spawnDoombots() {
    this.doombots.forEach((b) => this.scene.remove(b.mesh));
    this.doombots = [];
    this.doombotsKilled = 0;

    const locs = [
      // Fase 1: Vale de Doomstadt
      [-7, 0, 132, 'vanguard'], [7, 0, 128, 'arcane'],
      [-9, 0, 96, 'sniper'],    [9, 0, 92, 'bruiser'],
      [-7, 0, 36, 'vanguard'],  [7, 0, 32, 'arcane'],
      [-8, 0, -18, 'sniper'],   [8, 0, -22, 'bruiser'],
      [-6, 0, -68, 'vanguard'], [6, 0, -72, 'arcane'],
      // Fase 2: Floresta Negra (Oeste)
      [-195, 0, 26, 'arcane'],  [-235, 0, 36, 'sniper'],
      [-285, 0, 18, 'bruiser'], [-315, 0, 52, 'vanguard'],
      [-348, 0, 8, 'arcane'],   [-372, 0, 44, 'sniper'],
      // Fase 3: Cratera dos Sentinelas (Leste)
      [195, 0, 26, 'vanguard'], [235, 0, 36, 'bruiser'],
      [285, 0, 18, 'sniper'],   [315, 0, 52, 'arcane'],
      [352, 0, 8, 'bruiser'],   [376, 0, 44, 'sniper'],
      // Fase 4: Tundra Glacial & Ponte
      [-12, 0, -180, 'bruiser'], [12, 0, -185, 'arcane'],
      [-14, 0, -245, 'sniper'],  [14, 0, -245, 'vanguard'],
      [-16, 0, -325, 'bruiser'], [16, 0, -325, 'arcane'],
      [0, 0, -425, 'sniper'],    [4, 0, -455, 'bruiser'],
      // Fase 5: Castelo de Doom & Muralhas Externas
      [-10, 0, -535, 'arcane'],  [10, 0, -535, 'bruiser'],
      [-65, 0, -550, 'vanguard'], [65, 0, -550, 'arcane'],
      // Novos Biomas do Sul & Regiões Externas
      [-28, 0, 385, 'vanguard'], [28, 0, 415, 'arcane'],
      [-8, 0, 520, 'bruiser'],   [12, 0, 560, 'sniper'],
      [-495, 0, 480, 'arcane'],  [-535, 0, 515, 'bruiser'], [-595, 0, 495, 'vanguard'],
      [495, 0, 480, 'vanguard'], [535, 0, 515, 'sniper'],   [595, 0, 495, 'arcane'],
      [-600, 0, 30, 'arcane'],   [625, 0, 30, 'bruiser']
    ];

    locs.forEach(([lx, _ly, lz, variant], idx) => {
      const ly = this.world ? this.world.getGroundHeight(lx, lz) : _ly;
      const mesh = CharacterBuilder.buildDoombotMesh(variant);
      mesh.position.set(lx, ly, lz);
      this.scene.add(mesh);
      const hpVal = variant === 'bruiser' ? 420 : variant === 'vanguard' ? 290 : variant === 'arcane' ? 240 : 210;
      this.doombots.push({
        mesh,
        variant,
        pos: new THREE.Vector3(lx, ly, lz),
        vel: new THREE.Vector3(),
        hp: hpVal,
        maxHp: hpVal,
        dead: false,
        attackCooldown: 0.9 + Math.random() * 1.2,
        specialCd: 3.5 + Math.random() * 3.0,
        aimTimer: 0,
        flankAngle: ((idx % 6) - 2.5) * 0.45,
        staggerTimer: 0,
        webbedTimer: 0,
        markedTimer: 0
      });
    });
  }

  clearTransientFX() {
    [this.projectiles, this.vfxEffects, this.telegraphs, this.healOrbs, this.sparks, this.slashArcs, this.boomerangs].forEach((arr) => {
      arr.forEach((item) => {
        if (item.mesh && item.mesh.parent) item.mesh.parent.remove(item.mesh);
      });
      arr.length = 0;
    });
    if (this.playerState.swingWebLine && this.playerState.swingWebLine.parent) {
      this.playerState.swingWebLine.parent.remove(this.playerState.swingWebLine);
      this.playerState.swingWebLine = null;
    }
    if (this.playerState.thrownMjolnir.mesh && this.playerState.thrownMjolnir.mesh.parent) {
      this.playerState.thrownMjolnir.mesh.parent.remove(this.playerState.thrownMjolnir.mesh);
      this.playerState.thrownMjolnir.mesh = null;
    }
    if (this.doomBoss.beamMesh && this.doomBoss.beamMesh.parent) {
      this.doomBoss.beamMesh.parent.remove(this.doomBoss.beamMesh);
      this.doomBoss.beamMesh = null;
    }
    if (this.doomBoss.beamMesh2 && this.doomBoss.beamMesh2.parent) {
      this.doomBoss.beamMesh2.parent.remove(this.doomBoss.beamMesh2);
      this.doomBoss.beamMesh2 = null;
    }
    if (this.doomBoss.multiverseBlades) {
      this.doomBoss.multiverseBlades.forEach(b => { if (b.mesh && b.mesh.parent) b.mesh.parent.remove(b.mesh); });
      this.doomBoss.multiverseBlades.length = 0;
    }
    document.getElementById('floating-dmg-container').innerHTML = '';
  }

  initPlayer() {
    const hero = HEROES_DATA[this.selectedHeroId];
    if (this.playerMesh) {
      this.detachClothFromScene(this.playerMesh);
      this.scene.remove(this.playerMesh);
    }

    this.clearTransientFX();

    this.playerMesh = CharacterBuilder.buildHeroMesh(this.selectedHeroId);
    this.playerState.pos.set(0, 0, 165);
    this.playerState.vel.set(0, 0, 0);
    this.playerState.yaw = Math.PI;
    this.playerState.isGrounded = true;
    this.playerState.isFlying = false;
    this.playerState.isSwinging = false;
    this.playerState.swingCooldown = 0;
    this.playerState.jumpsRemaining = 2;
    this.playerState.hp = hero.health;
    this.playerState.maxHp = hero.health;
    this.playerState.trailingHp = hero.health;
    this.playerState.stamina = 100;
    this.playerState.healFlasks = 3;
    this.playerState.ultCharge = 0;
    this.playerState.dashCooldown = 0;
    this.playerState.skillCooldown = 0;
    this.playerState.uniqueCooldown = 0;
    this.playerState.primaryCooldown = 0;
    this.playerState.comboIndex = 0;
    this.playerState.shieldActive = false;
    this.playerState.shieldTimer = 0;
    this.playerState.invulnTimer = 0;
    this.playerState.thrownCape = { active: false, phase: 'idle', target: null, timer: 0, pos: new THREE.Vector3() };
    this.playerState.thrownMjolnir = { active: false, returning: false, timer: 0, pos: new THREE.Vector3(), dir: new THREE.Vector3(), mesh: null, hitSet: new Set() };

    if (this.playerState.shieldMesh && this.playerState.shieldMesh.parent) {
      this.playerState.shieldMesh.parent.remove(this.playerState.shieldMesh);
    }
    this.playerState.shieldMesh = null;

    this.playerMesh.position.copy(this.playerState.pos);
    this.scene.add(this.playerMesh);
    this.attachClothToScene(this.playerMesh);

    this.camYaw = 0;
    this.camPitch = 0.22;
    this.userCamDist = 7.1;
    this.camDist = 7.1;
    this.camAnchor = this.playerState.pos.clone();
    this.camSmoothPivot = null;

    this.comboCount = 0;
    this.comboTimer = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.timeScale = 1.0;
    this.slowMoTimer = 0;
    this.hitstopTimer = 0;

    // Update Combat HUD Labels & Icons dynamically for selected hero
    document.getElementById('hud-hero-name').textContent = hero.name.toUpperCase();
    document.getElementById('hud-hero-emblem').innerHTML = ProceduralTextures.getHeroSvgEmblem(hero.id);
    document.getElementById('hud-hero-emblem').style.color = hero.color;
    document.documentElement.style.setProperty('--hero-accent', hero.color);

    const m1Map = {
      web: 'Combo', magic: 'Chicote', lightning: 'Mjolnir', elastic: 'Estirar',
      claw: 'Garras', repulsor: 'Repulsor', shield: 'Escudo', adamantium: 'Garras X', chaos: 'Caos'
    };
    const m2Map = {
      spider_man: 'Web Zip', doctor_strange: 'Capa Viva', thor: 'Arremessar',
      reed_richards: 'Estilingue', black_panther: 'Bote',
      iron_man: 'Mísseis', captain_america: 'Arremessar', wolverine: 'Salto Feroz', scarlet_witch: 'Detonar Hex'
    };
    const flyers = ['doctor_strange', 'thor', 'iron_man', 'scarlet_witch'];
    document.getElementById('slot-m1-label').textContent = m1Map[hero.attackType] || 'Ataque';
    document.getElementById('slot-m2-label').textContent = m2Map[hero.id] || 'Único';
    document.getElementById('slot-e-label').textContent = flyers.includes(hero.id) ? 'Voar' : (hero.id === 'spider_man' ? 'Web Swing' : (hero.id === 'captain_america' ? 'Investida' : document.getElementById('slot-m2-label').textContent));
    document.getElementById('slot-q-label').textContent = hero.skillName.split(' ')[0];
    document.getElementById('slot-r-label').textContent = hero.ultName.split(' ')[0];

    this.updateHUD();
  }

  switchHeroInGame(heroId) {
    if (!HEROES_DATA[heroId] || heroId === this.selectedHeroId || this.isGameOver) return;
    const prevHpRatio = this.playerState.maxHp > 0 ? this.playerState.hp / this.playerState.maxHp : 1;
    const savedPos = this.playerState.pos.clone();
    const savedYaw = this.playerState.yaw;
    const savedUlt = this.playerState.ultCharge;
    const savedFlasks = this.playerState.healFlasks;
    const savedCamYaw = this.camYaw;
    const savedCamPitch = this.camPitch;
    const savedCamDist = this.camDist;

    this.selectedHeroId = heroId;
    const hero = HEROES_DATA[heroId];

    if (this.playerMesh) {
      this.detachClothFromScene(this.playerMesh);
      this.scene.remove(this.playerMesh);
    }
    if (this.playerState.shieldMesh && this.playerState.shieldMesh.parent) {
      this.playerState.shieldMesh.parent.remove(this.playerState.shieldMesh);
    }
    this.playerState.shieldMesh = null;
    this.playerState.shieldActive = false;
    this.playerState.isSwinging = false;
    this.playerState.isFlying = false;

    this.playerMesh = CharacterBuilder.buildHeroMesh(heroId);
    this.playerState.pos.copy(savedPos);
    this.playerState.yaw = savedYaw;
    this.playerState.maxHp = hero.health;
    this.playerState.hp = Math.max(1, Math.round(hero.health * prevHpRatio));
    this.playerState.trailingHp = this.playerState.hp;
    this.playerState.ultCharge = savedUlt;
    this.playerState.healFlasks = savedFlasks;
    this.camYaw = savedCamYaw;
    this.camPitch = savedCamPitch;
    this.camDist = savedCamDist;

    this.playerMesh.position.copy(savedPos);
    this.scene.add(this.playerMesh);
    this.attachClothToScene(this.playerMesh);

    document.getElementById('hud-hero-name').textContent = hero.name.toUpperCase();
    document.getElementById('hud-hero-emblem').innerHTML = ProceduralTextures.getHeroSvgEmblem(hero.id);
    document.getElementById('hud-hero-emblem').style.color = hero.color;
    document.documentElement.style.setProperty('--hero-accent', hero.color);
    const m1Map = {
      web: 'Combo', magic: 'Chicote', lightning: 'Mjolnir', elastic: 'Estirar',
      claw: 'Garras', repulsor: 'Repulsor', shield: 'Escudo', adamantium: 'Garras X', chaos: 'Caos'
    };
    const m2Map = {
      spider_man: 'Web Zip', doctor_strange: 'Capa Viva', thor: 'Arremessar',
      reed_richards: 'Estilingue', black_panther: 'Bote',
      iron_man: 'Mísseis', captain_america: 'Arremessar', wolverine: 'Salto Feroz', scarlet_witch: 'Detonar Hex'
    };
    const flyers = ['doctor_strange', 'thor', 'iron_man', 'scarlet_witch'];
    document.getElementById('slot-m1-label').textContent = m1Map[hero.attackType] || 'Ataque';
    document.getElementById('slot-m2-label').textContent = m2Map[hero.id] || 'Único';
    document.getElementById('slot-e-label').textContent = flyers.includes(hero.id) ? 'Voar' : (hero.id === 'spider_man' ? 'Web Swing' : (hero.id === 'captain_america' ? 'Investida' : document.getElementById('slot-m2-label').textContent));
    document.getElementById('slot-q-label').textContent = hero.skillName.split(' ')[0];
    document.getElementById('slot-r-label').textContent = hero.ultName.split(' ')[0];

    this.spawnShockwave(savedPos, hero.colorHex, 5.2, 0.35);
    this.triggerEventBanner(`HERÓI ATIVO: ${hero.name.toUpperCase()}`, hero.color);
    window.soundSystem.playUISelect();
    this.updateHUD();
  }

  initUI() {
    const rosterContainer = document.getElementById('hero-roster-list');
    rosterContainer.innerHTML = '';

    Object.values(HEROES_DATA).forEach((hero, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `roster-card interactive ${hero.id === this.selectedHeroId ? 'active' : ''}`;
      card.style.setProperty('--card-color', hero.color);
      card.dataset.heroId = hero.id;
      card.innerHTML = `
        <span class="roster-key">${index + 1}</span>
        <span class="roster-svg" style="color:${hero.color}">${ProceduralTextures.getHeroSvgEmblem(hero.id)}</span>
        <span class="roster-meta">
          <strong>${hero.name}</strong>
          <small>${hero.classTag}</small>
        </span>
      `;
      card.addEventListener('mouseenter', () => window.soundSystem.playUIHover());
      card.addEventListener('click', () => {
        window.soundSystem.init();
        window.soundSystem.playUISelect();
        document.querySelectorAll('.roster-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        this.updateShowcaseHero(hero.id);
      });
      rosterContainer.appendChild(card);
    });

    // Inject crisp SVG icons into static HUD/Menu buttons
    const audioIcon = ProceduralTextures.getIconSvg('audioOn');
    document.getElementById('mute-icon-slot').innerHTML = audioIcon;
    document.getElementById('start-play-icon').innerHTML = ProceduralTextures.getIconSvg('play');
    document.getElementById('boss-crown-icon').innerHTML = ProceduralTextures.getIconSvg('crown');
    document.getElementById('flask-icon-slot').innerHTML = ProceduralTextures.getIconSvg('heal');
    document.getElementById('dock-icon-m1').innerHTML = ProceduralTextures.getIconSvg('sword');
    document.getElementById('dock-icon-m2').innerHTML = ProceduralTextures.getIconSvg('unique');
    document.getElementById('dock-icon-e').innerHTML = ProceduralTextures.getIconSvg('dash');
    document.getElementById('dock-icon-q').innerHTML = ProceduralTextures.getIconSvg('skill');
    document.getElementById('dock-icon-shift').innerHTML = ProceduralTextures.getIconSvg('dash');
    document.getElementById('dock-icon-r').innerHTML = ProceduralTextures.getIconSvg('ult');

    const toggleMuteUI = () => {
      window.soundSystem.init();
      const muted = window.soundSystem.toggleMute();
      document.getElementById('mute-icon-slot').innerHTML = ProceduralTextures.getIconSvg(muted ? 'audioOff' : 'audioOn');
      document.getElementById('mute-text-slot').textContent = muted ? 'MUDO (M)' : 'ÁUDIO (M)';
    };

    document.getElementById('mute-toggle-btn').addEventListener('click', toggleMuteUI);
    document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
    document.getElementById('resume-btn').addEventListener('click', () => this.togglePause(false));
    document.getElementById('pause-restart-btn').addEventListener('click', () => this.startGame());
    document.getElementById('pause-menu-btn').addEventListener('click', () => this.returnToMainMenu());
    document.getElementById('retry-btn').addEventListener('click', () => this.startGame());
    document.getElementById('menu-btn').addEventListener('click', () => this.returnToMainMenu());

    this.updateMenuInspector(HEROES_DATA[this.selectedHeroId]);
  }

  updateMenuInspector(hero) {
    document.documentElement.style.setProperty('--hero-accent', hero.color);
    document.getElementById('sel-hero-class').textContent = hero.classTag;
    document.getElementById('sel-hero-name').textContent = hero.name.toUpperCase();
    document.getElementById('sel-hero-sub').textContent = hero.subtitle;

    document.getElementById('kit-primary-name').textContent = hero.primaryName;
    document.getElementById('kit-primary-desc').textContent = hero.primaryDesc;
    document.getElementById('kit-unique-key').textContent = hero.uniqueKey;
    document.getElementById('kit-unique-name').textContent = hero.uniqueName;
    document.getElementById('kit-unique-desc').textContent = hero.uniqueDesc;
    document.getElementById('kit-skill-name').textContent = hero.skillName;
    document.getElementById('kit-skill-desc').textContent = hero.skillDesc;
    document.getElementById('kit-ult-name').textContent = hero.ultName;
    document.getElementById('kit-ult-desc').textContent = hero.ultDesc;
  }

  returnToMainMenu() {
    this.isPlaying = false;
    this.isPaused = false;
    this.isGameOver = false;
    if (document.pointerLockElement) document.exitPointerLock();
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('end-overlay').classList.add('hidden');
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    window.soundSystem.setBossMode(false);
    if (this.showcaseHero) {
      this.showcaseHero.visible = true;
      this.attachClothToScene(this.showcaseHero);
    }
    if (this.world.showcaseGroup) {
      this.world.showcaseGroup.visible = true;
    }
    this.updateShowcaseHero(this.selectedHeroId);
  }

  safeRequestPointerLock() {
    if (!this.isPlaying || this.isPaused || this.isGameOver) return;
    try {
      const p = document.body.requestPointerLock();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) {}
  }

  togglePause(forceState) {
    if (!this.isPlaying || this.isGameOver) return;
    this.isPaused = forceState !== undefined ? forceState : !this.isPaused;
    const pauseEl = document.getElementById('pause-overlay');
    if (this.isPaused) {
      pauseEl.classList.remove('hidden');
      if (document.pointerLockElement) document.exitPointerLock();
    } else {
      pauseEl.classList.add('hidden');
      this.safeRequestPointerLock();
    }
  }

  startGame() {
    window.soundSystem.init();
    window.soundSystem.playUISelect();
    if (this.showcaseHero) {
      this.showcaseHero.visible = false;
      this.detachClothFromScene(this.showcaseHero);
    }
    if (this.world.showcaseGroup) {
      this.world.showcaseGroup.visible = false;
    }
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('end-overlay').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');

    this.initDoctorDoom();
    this.spawnDoombots();
    this.initPlayer();

    this.isPlaying = true;
    window.soundSystem.setBossMode(false);
    this.safeRequestPointerLock();
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
      if (this.bloomPass) this.bloomPass.setSize(Math.floor(window.innerWidth * 0.5), Math.floor(window.innerHeight * 0.5));
      if (this.colorGradePass) {
        this.colorGradePass.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      }
    });

    window.addEventListener('contextmenu', (e) => {
      if (this.isPlaying) e.preventDefault();
    });

    window.addEventListener('keydown', (e) => {
      const code = e.code;
      this.keys[code] = true;
      if (e.repeat) return;

      if (code === 'KeyN') {
        window.soundSystem.init();
        const muted = window.soundSystem.toggleMute();
        document.getElementById('mute-icon-slot').innerHTML = ProceduralTextures.getIconSvg(muted ? 'audioOff' : 'audioOn');
        document.getElementById('mute-text-slot').textContent = muted ? 'MUDO (N)' : 'ÁUDIO (N)';
      }

      // Menu 1-9 hero preview ONLY; In-Game 1-3 trigger Unlockable RPG Skills (NO mid-match hero switch!)
      if (code.startsWith('Digit')) {
        const idx = parseInt(code.replace('Digit', ''), 10) - 1;
        const ids = Object.keys(HEROES_DATA);
        if (!this.isPlaying && idx >= 0 && idx < ids.length) {
          const chosen = ids[idx];
          window.soundSystem.init();
          window.soundSystem.playUISelect();
          document.querySelectorAll('.roster-card').forEach((c) => {
            c.classList.toggle('active', c.dataset.heroId === chosen);
          });
          this.updateShowcaseHero(chosen);
        } else if (this.isPlaying && !this.isPaused && !this.isGameOver && !this.worldMapOpen) {
          if (idx === 0 || idx === 1 || idx === 2) {
            this._queueCombatInput('rpg' + (idx + 1));
          }
        }
      }

      if (!this.isPlaying) return;
      if (code === 'KeyP') {
        if (!this.isGameOver && !this.worldMapOpen && !(this.skillTreeOpen)) this.togglePause();
        return;
      }
      if (code === 'KeyK') {
        if (!this.isGameOver && !this.isPaused && !this.worldMapOpen && this.toggleSkillTreeModal) {
          this.toggleSkillTreeModal();
        }
        return;
      }
      if (this.isPaused || this.isGameOver || this.worldMapOpen || this.skillTreeOpen) return;

      if (code === 'Space') {
        const canFly = ['doctor_strange', 'thor', 'iron_man', 'scarlet_witch'].includes(this.selectedHeroId);
        if (this.playerState.isSwimming) {
          this.playerState.vel.y = 17.5;
          this.playerState.isSwimming = false;
          this.playerState.isGrounded = false;
          this.playerState.jumpsRemaining = 1;
          this.spawnSparks(this.playerState.pos.clone().add(new THREE.Vector3(0, 0.9, 0)), 0x38bdf8, 12);
          window.soundSystem.playJump();
        } else if (this.playerState.isSwinging) {
          this.releaseWebSwing(true);
        } else if (this.playerState.isGrounded || this.playerState.coyoteTimer > 0) {
          this.playerState.vel.y = 16.8;
          this.playerState.isGrounded = false;
          this.playerState.coyoteTimer = 0;
          this.playerState.jumpsRemaining = 1;
          this.applyHeroSquash(-0.22);
          window.soundSystem.playJump();
        } else if (canFly && !this.playerState.isFlying) {
          this.toggleFlight(true);
        } else if (this.playerState.jumpsRemaining > 0) {
          this.playerState.vel.y = 15.2;
          this.playerState.jumpsRemaining = 0;
          this.applyHeroSquash(-0.18);
          this.spawnShockwave(this.playerState.pos.clone().add(new THREE.Vector3(0, 0.3, 0)), HEROES_DATA[this.selectedHeroId].colorHex, 2.8, 0.25);
          window.soundSystem.playJump();
        }
      }

      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        this._queueCombatInput('dash');
      }
      if (code === 'KeyE') {
        this.triggerUniqueMovementOrToggle();
      }
      if (code === 'KeyQ') {
        this._queueCombatInput('q');
      }
      if (code === 'KeyR') {
        this._queueCombatInput('r');
      }
      if (code === 'KeyF') {
        this.triggerHealFlask();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyE' && this.selectedHeroId === 'spider_man' && this.playerState.isSwinging) {
        this.releaseWebSwing(true);
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!this.isPlaying) {
        if (e.target.tagName === 'CANVAS' || e.target.id === 'main-menu') {
          this.isDraggingMenu = true;
          this.lastMouseX = e.clientX;
        }
        return;
      }
      if (this.isPaused || this.isGameOver || this.worldMapOpen || this.skillTreeOpen) return;
      if (window.CutsceneDirector && window.CutsceneDirector.isPlaying) {
        window.soundSystem.init();
        this.safeRequestPointerLock();
        window.CutsceneDirector.stop(this);
        return;
      }
      if (e.target.closest('.interactive')) return;

      window.soundSystem.init();
      this.safeRequestPointerLock();

      if (e.button === 0) {
        this.mouseDown = true;
        this._queueCombatInput('m1');
      } else if (e.button === 2) {
        this.rightMouseDown = true;
        this._queueCombatInput('m2');
      }
    });

    document.addEventListener('mouseup', (e) => {
      this.isDraggingMenu = false;
      if (e.button === 0) this.mouseDown = false;
      if (e.button === 2) {
        this.rightMouseDown = false;
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isPlaying) {
        if (this.isDraggingMenu) {
          const dx = e.clientX - this.lastMouseX;
          this.lastMouseX = e.clientX;
          this.showcaseRotY += dx * 0.012;
        }
        return;
      }
      if (this.isPaused || this.isGameOver) return;
      if (document.pointerLockElement === document.body) {
        this.camYaw -= e.movementX * 0.0024;
        this.camPitch = THREE.MathUtils.clamp(this.camPitch + e.movementY * 0.0022, -0.10, 1.05);
      }
    });

    window.addEventListener('wheel', (e) => {
      if (!this.isPlaying || this.isPaused) return;
      this.userCamDist = THREE.MathUtils.clamp((this.userCamDist || 5.6) + e.deltaY * 0.005, 4.2, 9.6);
    }, { passive: true });
  }

  applyHeroSquash(amount = 0.2) {
    if (!this.playerMesh) return;
    this.playerMesh.scale.set(1 + amount * 0.45, 1 - amount, 1 + amount * 0.45);
  }

  addTrauma(amount) {
    this.cameraTrauma = Math.min(1.0, this.cameraTrauma + amount);
  }

  triggerEventBanner(text, colorHex = '#f59e0b') {
    const el = document.getElementById('event-banner');
    if (!el) return;
    el.textContent = text;
    el.style.borderColor = colorHex;
    el.style.color = colorHex;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  safeTranslatePlayer(dx, dz) {
    const nextX = this.playerState.pos.x + dx;
    const nextZ = this.playerState.pos.z + dz;
    const resolved = this.world.resolveMovement(this.playerState.pos.x, this.playerState.pos.z, nextX, nextZ, 1.05);
    this.playerState.pos.x = resolved.x;
    this.playerState.pos.z = resolved.z;
    const floorY = this.world.getGroundHeight(resolved.x, resolved.z);
    if (this.playerState.pos.y < floorY) this.playerState.pos.y = floorY;
  }

  findBestTarget(maxRange = 36) {
    let best = null;
    let bestScore = Infinity;
    const pPos = this.playerState.pos;
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    const evalTarget = (pos, isBoss, ref) => {
      const to = pos.clone().sub(pPos);
      const dist = to.length();
      if (dist > maxRange) return;
      to.y = 0;
      const align = to.lengthSq() > 0.01 ? to.normalize().dot(camDir) : 1;
      const score = dist - align * 14 - (isBoss ? 5 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = { pos: pos.clone(), isBoss, ref, dist };
      }
    };

    if (this.doomBoss.hp > 0 && this.doomBoss.mesh) {
      evalTarget(this.doomBoss.pos, true, this.doomBoss);
    }
    if (this.miniBosses) {
      this.miniBosses.forEach((mb) => {
        if (mb.alive) evalTarget(mb.pos, false, mb);
      });
    }
    if (this.world && this.world.energyTowers) {
      this.world.energyTowers.forEach((tw) => {
        if (!tw.destroyed) evalTarget(tw.pos, false, tw);
      });
    }
    this.doombots.forEach((b) => {
      if (!b.dead) evalTarget(b.pos, false, b);
    });
    return best;
  }

  // ==========================================================================
  // SHADER VFX SPAWNERS (Slash Ribbons, Lightning, Shockwaves, Sparks, Afterimage)
  // ==========================================================================
  spawnSlashArc(origin, yaw, coreHex, edgeHex, radius = 3.2, tilt = 0.25, duration = 0.24) {
    const geo = new THREE.RingGeometry(radius * 0.45, radius, 24, 1, -Math.PI * 0.55, Math.PI * 1.1);
    const uv = geo.attributes.uv;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const ang = Math.atan2(py, px);
      const r = Math.hypot(px, py);
      uv.setXY(i, (ang + Math.PI * 0.55) / (Math.PI * 1.1), (r - radius * 0.45) / (radius * 0.55));
    }
    uv.needsUpdate = true;

    const mat = CustomShaders.createSlashRibbonMaterial(coreHex, edgeHex);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    mesh.rotation.order = 'YXZ';
    mesh.rotation.y = yaw + Math.PI / 2;
    mesh.rotation.x = Math.PI / 2 + tilt;
    mesh.rotation.z = (Math.random() - 0.5) * 0.5;
    this.scene.add(mesh);

    this.slashArcs.push({ mesh, mat, life: duration, maxLife: duration });
  }

  spawnShockwave(pos, colorHex, targetRadius = 8, duration = 0.42) {
    const mat = CustomShaders.createShockwaveRingMaterial(colorHex);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, pos.y + 0.14, pos.z);
    this.scene.add(mesh);
    this.vfxEffects.push({ mesh, type: 'shockwave', mat, life: duration, maxLife: duration, targetRadius });
  }

  spawnSparks(pos, colorHex, count = 12) {
    if (this.vfxPro && this.vfxPro.p) {
      const c = new THREE.Color(colorHex);
      this.vfxPro.p.burst(pos.x, pos.y, pos.z, '#' + c.getHexString(), Math.min(36, count * 2), 9.5, 0.72, 0.42);
      return;
    }
    const col = new THREE.Color(colorHex);
    const geo = new THREE.OctahedronGeometry(0.11, 0);
    const n = Math.min(count, 6);
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        3.5 + Math.random() * 8.5,
        (Math.random() - 0.5) * 14
      );
      this.scene.add(m);
      this.sparks.push({ mesh: m, mat, vel, life: 0.42, maxLife: 0.42 });
    }
  }

  createJaggedLightning(startPos, endPos, colorHex = 0x38bdf8, duration = 0.22) {
    const pts = [];
    const segs = 7;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const p = new THREE.Vector3().lerpVectors(startPos, endPos, t);
      if (i > 0 && i < segs) {
        p.x += (Math.random() - 0.5) * 1.15;
        p.y += (Math.random() - 0.5) * 0.75;
        p.z += (Math.random() - 0.5) * 1.15;
      }
      pts.push(p);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 12, 0.08, 5, false);
    const mat = CustomShaders.createBeamShaderMaterial(0xffffff, colorHex);
    const m = new THREE.Mesh(geo, mat);
    this.scene.add(m);
    this.vfxEffects.push({ mesh: m, mat, type: 'fade', life: duration, maxLife: duration });
  }

  createWebStrandMesh(startPos, endPos, colorHex = 0xf8fafc, thickness = 0.065) {
    const dir = new THREE.Vector3().subVectors(endPos, startPos);
    const len = Math.max(dir.length(), 0.2);
    const geo = new THREE.CylinderGeometry(thickness, thickness, len, 6);
    geo.translate(0, len * 0.5, 0);
    geo.rotateX(Math.PI / 2);
    const mat = CustomShaders.createBeamShaderMaterial(0xffffff, colorHex);
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(startPos);
    m.lookAt(endPos);
    this.scene.add(m);
    return { mesh: m, mat };
  }

  spawnAfterimage(colorHex) {
    if (!this.playerMesh) return;
    if (this._dashGhostPool && typeof this.v5Ghost === 'function') {
      this._ghostCol = colorHex;
      return;
    }
    const ghost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.28, 1.75, 6),
      CustomShaders.createEnergyShieldMaterial(colorHex)
    );
    ghost.position.copy(this.playerState.pos).add(new THREE.Vector3(0, 1.05, 0));
    ghost.rotation.y = this.playerState.yaw;
    this.scene.add(ghost);
    this.vfxEffects.push({ mesh: ghost, mat: ghost.material, type: 'fade', life: 0.28, maxLife: 0.28 });
  }

  // ==========================================================================
  // UNIQUE HERO MECHANICS (Web Swing, Flight, Levitation Cape, Mjolnir Throw, Slingshot, Pounce)
  // ==========================================================================
  triggerUniqueMovementOrToggle() {
    if (['doctor_strange', 'thor', 'iron_man', 'scarlet_witch'].includes(this.selectedHeroId)) {
      this.toggleFlight();
    } else if (this.selectedHeroId === 'spider_man') {
      this.startSpiderWebSwing();
    } else {
      this.triggerSecondaryUnique();
    }
  }

  toggleFlight(force) {
    const next = force !== undefined ? force : !this.playerState.isFlying;
    this.playerState.isFlying = next;
    if (next) {
      this.playerState.isGrounded = false;
      this.playerState.vel.y = Math.max(this.playerState.vel.y, 7.5);
      this.spawnShockwave(this.playerState.pos, HEROES_DATA[this.selectedHeroId].colorHex, 3.6, 0.32);
      window.soundSystem.playFlightWhoosh();
    }
  }

  startSpiderWebSwing() {
    const ps = this.playerState;
    if (ps.isSwinging || (ps.swingCooldown || 0) > 0) return;

    const floorY = this.world.getGroundHeight(ps.pos.x, ps.pos.z);
    if (ps.pos.y > floorY + 24) return;

    const forward = new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).multiplyScalar(-1);
    let bestAnchor = null;
    let bestScore = Infinity;
    for (let i = 0; i < this.world.swingAnchors.length; i++) {
      const a = this.world.swingAnchors[i];
      if (a.y > floorY + 34) continue;
      const toA = a.clone().sub(ps.pos);
      const dist = toA.length();
      if (dist > 6 && dist < 44 && a.y > ps.pos.y + 3) {
        const fwdDot = toA.clone().setY(0).normalize().dot(forward);
        if (fwdDot > -0.15) {
          const score = dist - fwdDot * 18;
          if (score < bestScore) {
            bestScore = score;
            bestAnchor = a.clone();
          }
        }
      }
    }
    if (!bestAnchor) {
      const maxAnchorY = floorY + 26;
      const anchorY = Math.min(maxAnchorY, Math.max(floorY + 14, ps.pos.y + 13));
      bestAnchor = new THREE.Vector3(
        ps.pos.x + forward.x * 16,
        anchorY,
        ps.pos.z + forward.z * 16
      );
    }

    ps.isSwinging = true;
    ps.isGrounded = false;
    ps.swingAnchor = bestAnchor;
    ps.swingRopeLen = Math.max(8.5, Math.min(22, ps.pos.distanceTo(bestAnchor) * 0.9));

    if (ps.pos.y < floorY + 2.5) {
      ps.pos.y += 1.4;
      ps.vel.y = Math.max(ps.vel.y, 8.5);
    } else if (ps.pos.y < floorY + 8) {
      ps.vel.y = Math.max(ps.vel.y, 5.5);
    }
    ps.vel.addScaledVector(forward, 13);

    const unitGeo = new THREE.CylinderGeometry(0.055, 0.055, 1.0, 6);
    unitGeo.translate(0, 0.5, 0);
    unitGeo.rotateX(Math.PI / 2);
    const webMesh = new THREE.Mesh(unitGeo, CustomShaders.createBeamShaderMaterial(0xffffff, 0xf8fafc));
    const handW = ps.pos.clone().add(new THREE.Vector3(0, 1.9, 0));
    webMesh.position.copy(handW);
    webMesh.lookAt(bestAnchor);
    webMesh.scale.set(1, 1, Math.max(0.2, handW.distanceTo(bestAnchor)));
    this.scene.add(webMesh);
    ps.swingWebLine = webMesh;
    window.soundSystem.playWebSwing();
  }

  triggerSecondaryUnique() {
    const heroId = this.selectedHeroId;

    // 1. SPIDER-MAN: M2 is Web Zip/Pull (E is Web Swing)
    if (heroId === 'spider_man') {
      return;
    }

    if (this.playerState.uniqueCooldown > 0) return;

    // 2. DOCTOR STRANGE: THROW PHYSICAL CLOAK OF LEVITATION
    if (heroId === 'doctor_strange') {
      const target = this.findBestTarget(34);
      const capeSim = this.playerMesh && this.playerMesh.userData.clothSim;
      if (!target || !capeSim) return;

      this.playerState.uniqueCooldown = 7.0;
      capeSim.detached = true;
      capeSim.detachedCenter.copy(this.playerState.pos).add(new THREE.Vector3(0, 1.5, 0));
      this.playerState.thrownCape = {
        active: true,
        phase: 'seek',
        target,
        timer: 3.4,
        pos: capeSim.detachedCenter.clone(),
        tickTimer: 0
      };
      if (this.playerMesh.userData.collarMesh) this.playerMesh.userData.collarMesh.visible = false;
      window.soundSystem.playCapeThrow();
      return;
    }

    // 3. THOR: PHYSICAL MJOLNIR THROW & RECALL
    if (heroId === 'thor') {
      if (this.playerState.thrownMjolnir.active) {
        this.playerState.thrownMjolnir.returning = true;
        return;
      }
      this.playerState.uniqueCooldown = 4.5;
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = Math.max(-0.2, Math.min(0.35, forward.y));
      forward.normalize();

      const mMesh = CharacterBuilder.buildMjolnirMesh();
      mMesh.scale.setScalar(1.35);
      const startP = this.playerState.pos.clone().add(new THREE.Vector3(0, 1.6, 0));
      mMesh.position.copy(startP);
      this.scene.add(mMesh);

      if (this.playerMesh.userData.mjolnir) this.playerMesh.userData.mjolnir.visible = false;
      this.playerState.thrownMjolnir = {
        active: true,
        returning: false,
        timer: 0.72,
        pos: startP,
        dir: forward,
        mesh: mMesh,
        hitSet: new Set()
      };
      window.soundSystem.playAttack('lightning');
      return;
    }

    // 4. REED RICHARDS: ELASTIC SLINGSHOT LAUNCH
    if (heroId === 'reed_richards') {
      this.playerState.uniqueCooldown = 4.5;
      const forward = new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).multiplyScalar(-1);
      const anchor = this.playerState.pos.clone().addScaledVector(forward, 18).add(new THREE.Vector3(0, 2.2, 0));
      const { mesh } = this.createWebStrandMesh(this.playerState.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), anchor, 0x38bdf8, 0.14);
      this.vfxEffects.push({ mesh, mat: mesh.material, type: 'fade', life: 0.25, maxLife: 0.25 });

      this.playerState.vel.copy(forward.multiplyScalar(38));
      this.playerState.vel.y = 8.5;
      this.playerState.isGrounded = false;
      this.playerState.invulnTimer = 0.45;
      this.playerMesh.userData.elasticStretch = 1.0;
      this.applyAoEDamage(this.playerState.pos.clone().addScaledVector(forward.normalize(), 6), 5.5, 110, '#38bdf8', true);
      window.soundSystem.playAttack('elastic');
      return;
    }

    // 5. BLACK PANTHER: PREDATOR POUNCE (Marks target +35% damage taken)
    if (heroId === 'black_panther') {
      this.playerState.uniqueCooldown = 4.2;
      const target = this.findBestTarget(22);
      const dir = target
        ? target.pos.clone().sub(this.playerState.pos).setY(0).normalize()
        : new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).multiplyScalar(-1);

      this.playerState.yaw = Math.atan2(dir.x, dir.z);
      this.playerState.vel.copy(dir.multiplyScalar(36));
      this.playerState.vel.y = 6.0;
      this.playerState.isGrounded = false;
      this.playerState.invulnTimer = 0.4;
      this.spawnAfterimage(0xa855f7);
      this.spawnSlashArc(this.playerState.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), this.playerState.yaw, 0xf3e8ff, 0xa855f7, 4.2, 0.1, 0.26);

      if (target) {
        target.ref.markedTimer = 5.5;
        this.applyTargetHit(target, 130, '#c084fc', true);
        this.playerMesh.userData.kineticCharge = Math.min(1.0, (this.playerMesh.userData.kineticCharge || 0) + 0.35);
      }
      window.soundSystem.playAttack('claw');
      return;
    }

    // 6. IRON MAN: HOMING MICRO-MISSILE SALVO (4 ROCKETS)
    if (heroId === 'iron_man') {
      this.playerState.uniqueCooldown = 5.0;
      const target = this.findBestTarget(34);
      const fwd = new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).multiplyScalar(-1);
      const handOrigin = this.playerState.pos.clone().add(new THREE.Vector3(0, 1.8, 0));
      for (let m = 0; m < 4; m++) {
        const spread = new THREE.Vector3((m - 1.5) * 0.45, 0.35 + (m % 2) * 0.25, 0);
        const dir = target
          ? target.pos.clone().add(new THREE.Vector3(0, 1.3, 0)).sub(handOrigin).add(spread).normalize()
          : fwd.clone().add(spread.multiplyScalar(0.3)).normalize();
        const rocket = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.28, 0),
          CustomShaders.createBeamShaderMaterial(0xfef08a, 0xef4444)
        );
        rocket.position.copy(handOrigin).add(spread);
        this.scene.add(rocket);
        this.projectiles.push({
          mesh: rocket,
          pos: rocket.position.clone(),
          vel: dir.multiplyScalar(36),
          dmg: 72,
          color: '#fbbf24',
          isPlayer: true,
          isHeavy: m === 3,
          radius: 1.4,
          life: 1.5
        });
      }
      this.spawnSparks(handOrigin, 0xfbbf24, 10);
      window.soundSystem.playAttack('repulsor');
      return;
    }

    // 7. CAPTAIN AMERICA: VIBRANIUM SHIELD THROW (Boomerang return)
    if (heroId === 'captain_america') {
      if (this.playerState.thrownMjolnir.active) return;
      this.playerState.uniqueCooldown = 4.2;
      const target = this.findBestTarget(30);
      const forward = target
        ? target.pos.clone().add(new THREE.Vector3(0, 1.3, 0)).sub(this.playerState.pos.clone().add(new THREE.Vector3(0, 1.5, 0))).normalize()
        : new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).multiplyScalar(-1);
      const shieldMesh = CharacterBuilder.buildCapShieldMesh();
      const startPos = this.playerState.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
      shieldMesh.position.copy(startPos);
      this.scene.add(shieldMesh);
      if (this.playerMesh.userData.shieldProp) this.playerMesh.userData.shieldProp.visible = false;
      this.playerState.thrownMjolnir = {
        active: true,
        returning: false,
        timer: 0.45,
        pos: startPos,
        dir: forward,
        mesh: shieldMesh,
        isCapShield: true,
        hitSet: new Set()
      };
      window.soundSystem.playAttack('shield');
      return;
    }

    // 8. WOLVERINE: FERAL LEAP & REND
    if (heroId === 'wolverine') {
      this.playerState.uniqueCooldown = 3.8;
      const target = this.findBestTarget(24);
      const dir = target
        ? target.pos.clone().sub(this.playerState.pos).setY(0).normalize()
        : new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).multiplyScalar(-1);
      this.playerState.yaw = Math.atan2(dir.x, dir.z);
      this.playerState.vel.copy(dir.multiplyScalar(38));
      this.playerState.vel.y = 7.2;
      this.playerState.isGrounded = false;
      this.playerState.invulnTimer = 0.45;
      this.spawnSlashArc(this.playerState.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), this.playerState.yaw, 0xfef08a, 0xeab308, 4.6, 0.32, 0.28);
      this.spawnSlashArc(this.playerState.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), this.playerState.yaw, 0xfef08a, 0xeab308, 4.6, -0.32, 0.28);
      if (target) {
        target.ref.markedTimer = 4.5;
        this.applyTargetHit(target, 145, '#eab308', true);
      } else {
        this.applyAoEDamage(this.playerState.pos.clone().addScaledVector(dir.normalize(), 4), 5.0, 120, '#eab308', true);
      }
      window.soundSystem.playAttack('adamantium');
      return;
    }

    // 9. SCARLET WITCH: CHAOS HEX DETONATION
    if (heroId === 'scarlet_witch') {
      this.playerState.uniqueCooldown = 4.8;
      const target = this.findBestTarget(30);
      const fwd = new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).multiplyScalar(-1);
      const center = target ? target.pos.clone() : this.playerState.pos.clone().addScaledVector(fwd, 12);
      this.spawnShockwave(center, 0xe11d48, 9.0, 0.42);
      this.spawnSparks(center.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xf43f5e, 18);
      this.applyAoEDamage(center, 8.8, 195, '#e11d48', true);
      window.soundSystem.playAttack('chaos');
    }
  }

  releaseWebSwing(boost = true) {
    if (!this.playerState.isSwinging) return;
    this.playerState.isSwinging = false;
    this.playerState.swingAnchor = null;
    this.playerState.swingCooldown = 0.42;
    if (this.playerState.swingWebLine && this.playerState.swingWebLine.parent) {
      this.playerState.swingWebLine.parent.remove(this.playerState.swingWebLine);
      this.playerState.swingWebLine = null;
    }
    if (boost) {
      const floorY = this.world.getGroundHeight(this.playerState.pos.x, this.playerState.pos.z);
      if (this.playerState.pos.y < floorY + 22) {
        this.playerState.vel.y = Math.min(14.0, Math.max(this.playerState.vel.y + 4.0, 10.5));
      } else {
        this.playerState.vel.y = Math.min(this.playerState.vel.y, 2.0);
      }
      this.playerState.jumpsRemaining = 1;
      this.applyHeroSquash(-0.2);
      window.soundSystem.playJump();
    }
  }

  _queueCombatInput(act) {
    const ps = this.playerState;
    if (act === 'dash' && ps.dashCooldown <= 0 && ps.stamina >= 22) {
      return this.triggerDash();
    }
    if (act === 'm2' && ps.uniqueCooldown <= 0) {
      return this.triggerSecondaryUnique();
    }
    if (act === 'q' && ps.skillCooldown <= 0) {
      return this.triggerSpecialSkill();
    }
    if (act === 'r' && ps.ultCharge >= 100) {
      return this.triggerUltimate();
    }
    if (act === 'm1' && ps.primaryCooldown <= 0) {
      return this.triggerPrimaryAttack();
    }
    this._bufferedAction = act;
    this._bufferTimer = 0.16;
  }

  // ==========================================================================
  // DASH + PERFECT DODGE (Elden Ring Slow-Mo Counter Window!)
  // ==========================================================================
  triggerDash() {
    if (this.playerState.dashCooldown > 0 || this.playerState.stamina < 22) return;

    if (this.playerState.isSwinging) this.releaseWebSwing(true);

    this.playerState.stamina -= 22;
    this.playerState.dashCooldown = 0.72;
    this.playerState.invulnTimer = 0.40;
    this.playerMesh.userData.dashTimer = 1.0;

    const dir = new THREE.Vector3();
    const camFwd = new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).multiplyScalar(-1);
    const camRight = new THREE.Vector3(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
    if (this.keys['KeyW']) dir.add(camFwd);
    if (this.keys['KeyS']) dir.sub(camFwd);
    if (this.keys['KeyD']) dir.add(camRight);
    if (this.keys['KeyA']) dir.sub(camRight);
    if (dir.lengthSq() === 0) dir.copy(camFwd);
    dir.normalize();

    this.playerState.yaw = Math.atan2(dir.x, dir.z);
    this.playerState.vel.x = dir.x * 38;
    this.playerState.vel.z = dir.z * 38;
    if (!this.playerState.isFlying) this.playerState.vel.y = Math.max(this.playerState.vel.y, 3.2);

    const hero = HEROES_DATA[this.selectedHeroId];
    this.spawnAfterimage(hero.colorHex);
    this.spawnSparks(this.playerState.pos.clone().add(new THREE.Vector3(0, 1.0, 0)), hero.colorHex, 10);
    this.camera.fov = 69;
    this.camera.updateProjectionMatrix();
    window.soundSystem.playDash();

    // Check Perfect Dodge against nearby enemy projectiles or active Doom windups!
    let dodgedThreat = false;
    const pPos = this.playerState.pos;
    for (let i = 0; i < this.projectiles.length; i++) {
      const pr = this.projectiles[i];
      if (!pr.isPlayer && pr.pos.distanceTo(pPos) < 6.2) {
        dodgedThreat = true;
        break;
      }
    }
    if (!dodgedThreat && this.doomBoss.active && this.doomBoss.state === 'windup' && this.doomBoss.pos.distanceTo(pPos) < 11.5) {
      dodgedThreat = true;
    }

    if (dodgedThreat) {
      this.timeScale = 0.25;
      this.slowMoTimer = 0.42;
      this.chromaPulse = 0.85;
      this.playerState.ultCharge = Math.min(100, this.playerState.ultCharge + 20);
      this.playerState.stamina = 100;
      this.spawnShockwave(pPos, 0xfbbf24, 6.5, 0.40);
      this.triggerEventBanner('ESQUIVA PERFEITA', '#fbbf24');
      window.soundSystem.playPerfectDodge();
    }
  }

  triggerHealFlask() {
    if (this.playerState.healFlasks <= 0 || this.playerState.hp >= this.playerState.maxHp) return;
    this.playerState.healFlasks -= 1;
    const heal = Math.round(this.playerState.maxHp * 0.42);
    this.playerState.hp = Math.min(this.playerState.maxHp, this.playerState.hp + heal);
    this.spawnShockwave(this.playerState.pos, 0x34d399, 4.5, 0.45);
    this.spawnSparks(this.playerState.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x6ee7b7, 14);
    this.spawnDamageNumber(this.playerState.pos.clone().add(new THREE.Vector3(0, 2.4, 0)), `+${heal}`, '#34d399', true);
    window.soundSystem.playHealFlask();
  }

  // ==========================================================================
  // PRIMARY 3-HIT COMBO WITH REAL SHADER SLASH RIBBONS
  // ==========================================================================
  triggerPrimaryAttack() {
    if (this.playerState.primaryCooldown > 0) return;

    const hero = HEROES_DATA[this.selectedHeroId];
    this.playerState.comboIndex = (this.playerState.comboIndex % 3) + 1;
    this.playerState.comboResetTimer = 1.25;
    const step = this.playerState.comboIndex;
    const isFinisher = step === 3;

    this.playerState.primaryCooldown = isFinisher ? 0.36 : 0.23;
    this.playerMesh.userData.attackTimer = 1.0;
    this.playerMesh.userData.comboStep = step;

    const target = this.findBestTarget(hero.attackType === 'magic' ? 28 : 20);
    if (target) {
      const toT = target.pos.clone().sub(this.playerState.pos);
      this.playerState.yaw = Math.atan2(toT.x, toT.z);
      if (toT.length() > 3.6 && toT.length() < 15 && hero.attackType !== 'magic') {
        const stepFwd = toT.setY(0).normalize().multiplyScalar(hero.attackType === 'elastic' ? 1.8 : 2.6);
        this.safeTranslatePlayer(stepFwd.x, stepFwd.z);
      }
    } else {
      const f = new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).multiplyScalar(-1);
      this.playerState.yaw = Math.atan2(f.x, f.z);
    }

    const fwd = new THREE.Vector3(Math.sin(this.playerState.yaw), 0, Math.cos(this.playerState.yaw));
    const handPos = this.playerState.pos.clone().add(new THREE.Vector3(0, 1.45, 0)).addScaledVector(fwd, 0.8);
    window.soundSystem.playAttack(hero.attackType);

    if (hero.id === 'spider_man') {
      this.spawnSlashArc(handPos, this.playerState.yaw, 0xfef08a, 0xef4444, isFinisher ? 4.4 : 3.2, step === 2 ? -0.35 : 0.25);
      if (target && target.dist < 19) {
        if (isFinisher) {
          this.safeTranslatePlayer(fwd.x * Math.min(target.dist - 2.2, 6), fwd.z * Math.min(target.dist - 2.2, 6));
          this.spawnShockwave(target.pos, 0xef4444, 5.5, 0.32);
        }
        this.applyTargetHit(target, isFinisher ? 115 : 68, '#ef4444', isFinisher);
      } else {
        this.applyAoEDamage(handPos.clone().addScaledVector(fwd, 2.2), 3.6, isFinisher ? 105 : 62, '#ef4444', isFinisher);
      }
    } else if (hero.id === 'doctor_strange') {
      this.spawnSlashArc(handPos, this.playerState.yaw, 0xfef08a, 0xf59e0b, 3.6, step === 2 ? -0.3 : 0.3);
      // Fire glowing Eldritch Mandala Disc Projectile
      const dir = target ? target.pos.clone().add(new THREE.Vector3(0, 1.4, 0)).sub(handPos).normalize() : fwd;
      const disc = new THREE.Mesh(
        new THREE.PlaneGeometry(isFinisher ? 1.85 : 1.35, isFinisher ? 1.85 : 1.35),
        CustomShaders.createEldritchMandalaMaterial(0xf59e0b)
      );
      disc.position.copy(handPos);
      disc.rotation.x = Math.PI / 2;
      this.scene.add(disc);
      this.projectiles.push({
        mesh: disc,
        pos: handPos.clone(),
        vel: dir.multiplyScalar(38),
        dmg: isFinisher ? 130 : 76,
        color: '#f59e0b',
        isPlayer: true,
        isHeavy: isFinisher,
        radius: 1.5,
        life: 1.4
      });
    } else if (hero.id === 'thor') {
      this.spawnSlashArc(handPos, this.playerState.yaw, 0xe0f2fe, 0x06b6d4, isFinisher ? 5.0 : 3.8, step === 2 ? -0.4 : 0.25);
      const hitPos = handPos.clone().addScaledVector(fwd, 2.6);
      this.applyAoEDamage(hitPos, isFinisher ? 6.0 : 4.2, isFinisher ? 155 : 88, '#06b6d4', isFinisher);
      if (isFinisher) {
        this.createJaggedLightning(hitPos.clone().add(new THREE.Vector3(0, 14, 0)), hitPos, 0x38bdf8, 0.26);
        this.spawnShockwave(hitPos, 0x06b6d4, 6.2, 0.35);
      }
    } else if (hero.id === 'reed_richards') {
      this.playerMesh.userData.elasticStretch = 1.0;
      const reachPos = handPos.clone().addScaledVector(fwd, isFinisher ? 7.5 : 5.5);
      const { mesh } = this.createWebStrandMesh(handPos, reachPos, 0x38bdf8, isFinisher ? 0.18 : 0.11);
      this.vfxEffects.push({ mesh, mat: mesh.material, type: 'fade', life: 0.18, maxLife: 0.18 });
      this.spawnSlashArc(reachPos, this.playerState.yaw, 0xe0f2fe, 0x38bdf8, isFinisher ? 4.8 : 3.2, 0.15);
      this.applyAoEDamage(reachPos, isFinisher ? 5.2 : 3.6, isFinisher ? 132 : 76, '#38bdf8', isFinisher);
    } else if (hero.id === 'iron_man') {
      this.spawnSlashArc(handPos, this.playerState.yaw, 0xe0f2fe, 0x38bdf8, isFinisher ? 4.2 : 3.0, 0.12);
      const shots = isFinisher ? [-0.08, 0.08] : [0];
      shots.forEach((angOffset) => {
        const dir = target ? target.pos.clone().add(new THREE.Vector3(0, 1.4, 0)).sub(handPos).normalize() : fwd.clone();
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angOffset);
        const bolt = new THREE.Mesh(
          new THREE.SphereGeometry(isFinisher ? 0.34 : 0.24, 10, 10),
          CustomShaders.createBeamShaderMaterial(0xffffff, 0x38bdf8)
        );
        bolt.position.copy(handPos);
        this.scene.add(bolt);
        this.projectiles.push({
          mesh: bolt, pos: handPos.clone(), vel: dir.multiplyScalar(46),
          dmg: isFinisher ? 82 : 68, color: '#38bdf8', isPlayer: true, isHeavy: isFinisher, radius: 1.4, life: 1.25
        });
      });
    } else if (hero.id === 'captain_america') {
      this.spawnSlashArc(handPos, this.playerState.yaw, 0xf8fafc, 0x2563eb, isFinisher ? 4.8 : 3.6, step === 2 ? -0.35 : 0.25);
      const hitPos = handPos.clone().addScaledVector(fwd, 2.5);
      this.applyAoEDamage(hitPos, isFinisher ? 5.6 : 4.0, isFinisher ? 145 : 85, '#3b82f6', isFinisher);
      if (isFinisher) this.spawnShockwave(hitPos, 0x2563eb, 5.5, 0.32);
    } else if (hero.id === 'wolverine') {
      this.playerState.primaryCooldown = isFinisher ? 0.26 : 0.17;
      const furyMult = (this.playerState.furyTimer > 0) ? 1.4 : 1.0;
      this.spawnSlashArc(handPos, this.playerState.yaw, 0xfef08a, 0xeab308, isFinisher ? 4.8 : 3.5, step === 2 ? -0.45 : 0.45);
      if (isFinisher) this.spawnSlashArc(handPos, this.playerState.yaw, 0xffffff, 0xeab308, 4.8, -0.45);
      this.applyAoEDamage(handPos.clone().addScaledVector(fwd, 2.4), 4.6, Math.round((isFinisher ? 135 : 74) * furyMult), '#eab308', isFinisher);
    } else if (hero.id === 'scarlet_witch') {
      this.spawnSlashArc(handPos, this.playerState.yaw, 0xfda4af, 0xe11d48, 3.6, step === 2 ? -0.25 : 0.25);
      const dir = target ? target.pos.clone().add(new THREE.Vector3(0, 1.4, 0)).sub(handPos).normalize() : fwd;
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(isFinisher ? 0.46 : 0.32, 12, 12),
        CustomShaders.createBeamShaderMaterial(0xfda4af, 0xe11d48)
      );
      orb.position.copy(handPos);
      this.scene.add(orb);
      this.projectiles.push({
        mesh: orb, pos: handPos.clone(), vel: dir.multiplyScalar(36),
        dmg: isFinisher ? 138 : 80, color: '#e11d48', isPlayer: true, isHeavy: isFinisher, radius: 1.7, life: 1.4
      });
    } else {
      // Black Panther
      this.spawnSlashArc(handPos, this.playerState.yaw, 0xf3e8ff, 0xa855f7, isFinisher ? 4.6 : 3.5, step === 2 ? -0.42 : 0.42);
      const dmg = isFinisher ? 130 : 75;
      const hit = this.applyAoEDamage(handPos.clone().addScaledVector(fwd, 2.4), 4.4, dmg, '#a855f7', isFinisher);
      if (hit) {
        this.playerMesh.userData.kineticCharge = Math.min(1.0, (this.playerMesh.userData.kineticCharge || 0) + 0.16);
      }
    }
  }

  // ==========================================================================
  // SPECIAL (Q) & ULTIMATE (R)
  // ==========================================================================
  triggerSpecialSkill() {
    if (this.playerState.skillCooldown > 0) return;
    const hero = HEROES_DATA[this.selectedHeroId];
    this.playerState.skillCooldown = 5.5;
    this.playerMesh.userData.skillTimer = 1.0;
    window.soundSystem.playSpecial();

    const pPos = this.playerState.pos;
    if (hero.id === 'spider_man') {
      this.playerState.vel.y = 10.5;
      this.playerState.isGrounded = false;
      this.spawnSlashArc(pPos.clone().add(new THREE.Vector3(0, 1.5, 0)), 0, 0xfef08a, 0xf59e0b, 7.2, 0.0, 0.36);
      this.spawnShockwave(pPos, 0xf59e0b, 8.5, 0.4);
      this.doombots.forEach((b) => {
        if (!b.dead && b.pos.distanceTo(pPos) < 9.5) b.webbedTimer = 2.6;
      });
      this.applyAoEDamage(pPos, 9.5, 220, '#ef4444', true);
    } else if (hero.id === 'doctor_strange') {
      this.playerState.shieldActive = true;
      this.playerState.shieldTimer = 4.2;
      if (this.playerState.shieldMesh && this.playerState.shieldMesh.parent) {
        this.playerState.shieldMesh.parent.remove(this.playerState.shieldMesh);
      }
      const shield = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 3.4),
        CustomShaders.createEldritchMandalaMaterial(0xf59e0b)
      );
      shield.position.set(0, 1.4, 1.3);
      this.playerMesh.add(shield);
      this.playerState.shieldMesh = shield;
      this.applyAoEDamage(pPos, 7.5, 160, '#f59e0b', true);
    } else if (hero.id === 'thor') {
      this.applyHeroSquash(-0.25);
      this.spawnShockwave(pPos, 0x06b6d4, 11.5, 0.48);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const strike = pPos.clone().add(new THREE.Vector3(Math.cos(a) * 4.5, 0, Math.sin(a) * 4.5));
        this.createJaggedLightning(strike.clone().add(new THREE.Vector3(0, 24, 0)), strike, 0x67e8f9, 0.42);
      }
      this.applyAoEDamage(pPos, 11.5, 275, '#06b6d4', true);
    } else if (hero.id === 'reed_richards') {
      this.spawnSlashArc(pPos.clone().add(new THREE.Vector3(0, 1.4, 0)), 0, 0xe0f2fe, 0x38bdf8, 8.8, 0, 0.42);
      this.spawnShockwave(pPos, 0x38bdf8, 10.0, 0.45);
      this.applyAoEDamage(pPos, 10.0, 240, '#38bdf8', true);
    } else if (hero.id === 'iron_man') {
      this.playerState.shieldActive = true;
      this.playerState.shieldTimer = 4.0;
      if (this.playerState.shieldMesh && this.playerState.shieldMesh.parent) {
        this.playerState.shieldMesh.parent.remove(this.playerState.shieldMesh);
      }
      const shield = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 3.5),
        CustomShaders.createEldritchMandalaMaterial(0x38bdf8)
      );
      shield.position.set(0, 1.4, 1.3);
      this.playerMesh.add(shield);
      this.playerState.shieldMesh = shield;
      this.spawnShockwave(pPos, 0x38bdf8, 10.5, 0.42);
      this.applyAoEDamage(pPos, 10.5, 230, '#38bdf8', true);
    } else if (hero.id === 'captain_america') {
      this.playerState.shieldActive = true;
      this.playerState.shieldTimer = 3.6;
      this.spawnShockwave(pPos, 0x2563eb, 10.0, 0.44);
      this.applyAoEDamage(pPos, 10.0, 250, '#3b82f6', true);
    } else if (hero.id === 'wolverine') {
      this.playerState.furyTimer = 6.0;
      this.triggerEventBanner('FÚRIA BERSERKER ATIVADA (+40% DANO)', '#eab308');
      this.spawnSlashArc(pPos.clone().add(new THREE.Vector3(0, 1.4, 0)), this.playerState.yaw, 0xfef08a, 0xeab308, 6.8, 0.4, 0.35);
      this.spawnSlashArc(pPos.clone().add(new THREE.Vector3(0, 1.4, 0)), this.playerState.yaw, 0xfef08a, 0xeab308, 6.8, -0.4, 0.35);
      this.applyAoEDamage(pPos, 8.0, 240, '#eab308', true);
    } else if (hero.id === 'scarlet_witch') {
      this.playerState.shieldActive = true;
      this.playerState.shieldTimer = 4.0;
      if (this.playerState.shieldMesh && this.playerState.shieldMesh.parent) {
        this.playerState.shieldMesh.parent.remove(this.playerState.shieldMesh);
      }
      const shield = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 3.6),
        CustomShaders.createEldritchMandalaMaterial(0xe11d48)
      );
      shield.position.set(0, 1.4, 1.3);
      this.playerMesh.add(shield);
      this.playerState.shieldMesh = shield;
      this.spawnShockwave(pPos, 0xe11d48, 11.0, 0.45);
      this.applyAoEDamage(pPos, 11.0, 255, '#e11d48', true);
    } else {
      const charge = this.playerMesh.userData.kineticCharge || 0.25;
      const dmg = Math.round(210 + charge * 260);
      this.playerMesh.userData.kineticCharge = 0;
      this.spawnShockwave(pPos, 0xa855f7, 11.0, 0.45);
      this.spawnSparks(pPos.clone().add(new THREE.Vector3(0, 1.3, 0)), 0xd8b4fe, 24);
      this.applyAoEDamage(pPos, 11.0, dmg, '#a855f7', true);
    }
  }

  triggerUltimate() {
    if (this.playerState.ultCharge < 100) return;
    const hero = HEROES_DATA[this.selectedHeroId];
    this.playerState.ultCharge = 0;
    this.playerState.invulnTimer = 1.1;
    this.chromaPulse = 1.0;
    this.addTrauma(0.75);
    this.triggerEventBanner(hero.ultName.toUpperCase(), hero.color);
    window.soundSystem.playUltimate();

    if (hero.id === 'captain_america') {
      this.playerState.hp = Math.min(this.playerState.maxHp, this.playerState.hp + 150);
    } else if (hero.id === 'wolverine') {
      this.playerState.hp = Math.min(this.playerState.maxHp, this.playerState.hp + Math.round(this.playerState.maxHp * 0.4));
    }

    const pPos = this.playerState.pos;
    // Dramatic Pillar / Bifrost / Mirror / Seismic Blast Shader VFX
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 6.4, 34, 20, 1, true),
      CustomShaders.createBeamShaderMaterial(0xffffff, hero.colorHex)
    );
    pillar.position.set(pPos.x, pPos.y + 17, pPos.z);
    this.scene.add(pillar);
    this.vfxEffects.push({ mesh: pillar, mat: pillar.material, type: 'fade', life: 0.95, maxLife: 0.95 });

    if (hero.id === 'iron_man') {
      const fwd = new THREE.Vector3(Math.sin(this.playerState.yaw), 0, Math.cos(this.playerState.yaw));
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 2.2, 26, 16, 1, true),
        CustomShaders.createBeamShaderMaterial(0xffffff, 0x38bdf8)
      );
      beam.rotation.x = Math.PI / 2;
      beam.position.copy(pPos).add(new THREE.Vector3(0, 1.6, 0)).addScaledVector(fwd, 13);
      beam.lookAt(pPos.clone().add(new THREE.Vector3(0, 1.6, 0)).addScaledVector(fwd, 28));
      this.scene.add(beam);
      this.vfxEffects.push({ mesh: beam, mat: beam.material, type: 'fade', life: 0.85, maxLife: 0.85 });
      this.applyAoEDamage(pPos.clone().addScaledVector(fwd, 12), 14, 340, '#38bdf8', true);
    }

    const mandala = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      CustomShaders.createEldritchMandalaMaterial(hero.colorHex)
    );
    mandala.rotation.x = -Math.PI / 2;
    mandala.position.set(pPos.x, pPos.y + 0.18, pPos.z);
    this.scene.add(mandala);
    this.vfxEffects.push({ mesh: mandala, mat: mandala.material, type: 'fade', life: 1.05, maxLife: 1.05 });

    this.spawnShockwave(pPos, hero.colorHex, 20, 0.7);
    this.spawnSparks(pPos.clone().add(new THREE.Vector3(0, 1.5, 0)), hero.colorHex, 30);
    this.applyAoEDamage(pPos, 21, 560, hero.color, true);
  }

  applyTargetHit(target, baseDmg, colorStr, isHeavy = false) {
    if (!target || !target.ref) return false;
    const lv = (this.playerLevel || 1) - 1;
    const forcePts = this.rpgStats?.force || 0;
    const bonusMult = 1.0 + lv * 0.08 + forcePts * 0.06
      + (target.ref.markedTimer > 0 ? 0.18 : 0)
      + (this.slowMoTimer > 0 ? 0.16 : 0);
    const dmg = Math.max(1, Math.round(baseDmg * bonusMult));

    if (target.isBoss) {
      this.damageBoss(dmg, isHeavy);
    } else if (target.ref.isMiniBoss) {
      if (this.damageMiniBoss) this.damageMiniBoss(target.ref, dmg, colorStr, isHeavy);
    } else if (target.ref.isEnergyTower) {
      if (this.damageEnergyTower) this.damageEnergyTower(target.ref, dmg, colorStr, isHeavy);
    } else {
      const bot = target.ref;
      bot.hp -= dmg;
      bot.staggerTimer = isHeavy ? 0.45 : 0.18;
      const kb = bot.pos.clone().sub(this.playerState.pos).setY(0).normalize().multiplyScalar(isHeavy ? 9.5 : 4.2);
      if (bot.vel) bot.vel.add(kb); else if (bot.pos) bot.pos.add(kb.multiplyScalar(0.12));
      this.spawnDamageNumber(bot.pos.clone().add(new THREE.Vector3(0, 2.3, 0)), dmg, colorStr, isHeavy);
      this.spawnSparks(bot.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), colorStr, isHeavy ? 14 : 7);

      if (bot.hp <= 0 && !bot.dead) {
        bot.dead = true;
        this.scene.remove(bot.mesh);
        this.spawnShockwave(bot.pos, 0x34d399, 4.8, 0.35);
        this.spawnHealOrb(bot.pos);
        this.doombotsKilled++;
        if (this.doombotsKilled % 3 === 0) {
          this.playerState.healFlasks = Math.min(this.playerState.maxHealFlasks, this.playerState.healFlasks + 1);
          this.triggerEventBanner('+1 NANOREPARO RECARREGADO', '#34d399');
        }
        this.playerState.ultCharge = Math.min(100, this.playerState.ultCharge + 14);
      }
    }

    this.registerCombo();
    this.flashHitmarker(isHeavy);
    window.soundSystem.playHitConfirm(isHeavy);
    if (isHeavy) {
      this.hitstopTimer = 0.065;
      this.addTrauma(0.32);
      this.chromaPulse = Math.max(this.chromaPulse, 0.35);
    } else {
      this.hitstopTimer = 0.032;
    }
    this.playerState.ultCharge = Math.min(100, this.playerState.ultCharge + (isHeavy ? 8 : 4));
    return true;
  }

  applyAoEDamage(center, radius, dmg, colorStr, isHeavy = false) {
    let anyHit = false;
    this.doombots.forEach((b) => {
      if (!b.dead && b.pos.distanceTo(center) <= radius) {
        this.applyTargetHit({ pos: b.pos, isBoss: false, ref: b }, dmg, colorStr, isHeavy);
        anyHit = true;
      }
    });
    if (this.miniBosses) {
      this.miniBosses.forEach((mb) => {
        if (mb.alive && mb.pos.distanceTo(center) <= radius + 2.4) {
          this.applyTargetHit({ pos: mb.pos, isBoss: false, ref: mb }, dmg, colorStr, isHeavy);
          anyHit = true;
        }
      });
    }
    if (this.world && this.world.energyTowers) {
      this.world.energyTowers.forEach((tw) => {
        if (!tw.destroyed && tw.pos.distanceTo(center) <= radius + 2.6) {
          this.applyTargetHit({ pos: tw.pos, isBoss: false, ref: tw }, dmg, colorStr, isHeavy);
          anyHit = true;
        }
      });
    }
    if (this.doomBoss.hp > 0 && this.doomBoss.pos.distanceTo(center) <= radius + 1.8) {
      this.applyTargetHit({ pos: this.doomBoss.pos, isBoss: true, ref: this.doomBoss }, dmg, colorStr, isHeavy);
      anyHit = true;
    }
    return anyHit;
  }

  damageBoss(baseDmg, isHeavy = false) {
    if (this.doomBoss.hp <= 0) return;
    if (!this.doomBoss.active) this.activateBossEncounter();

    const boss = this.doomBoss;
    const staggerMult = boss.staggeredTimer > 0 ? 1.45 : 1.0;
    let finalDmg = Math.round(baseDmg * staggerMult);

    // 1.0s burst-protection armor + anti-spam counter trigger
    const budget = boss.maxHp * 0.085;
    boss._dmgWinAcc = boss._dmgWinAcc || 0;
    if (boss._dmgWinAcc >= budget) {
      finalDmg = Math.max(8, Math.round(finalDmg * 0.32));
    } else if (boss._dmgWinAcc + finalDmg > budget) {
      const rem = budget - boss._dmgWinAcc;
      finalDmg = Math.round(rem + (finalDmg - rem) * 0.32);
    }
    boss._dmgWinAcc += finalDmg;
    boss._spamHits = (boss._spamHits || 0) + 1;
    if (boss._spamHits >= 6 && boss.staggeredTimer <= 0 && boss.state === 'idle' && (boss._riposteCd || 0) <= 0) {
      boss._spamHits = 0;
      boss._riposteCd = 6.5;
      boss.comboQueue = ['cataclysm_slam'];
      this.startQueuedDoomMove('doom_foot_dive');
      this.triggerEventBanner('CONTRA-ATAQUE SOBERANO DE DOOM!', '#10b981');
    }

    boss.hp = Math.max(0, boss.hp - finalDmg);

    // Posture / Stagger Damage (Elden Ring poise system!)
    if (this.doomBoss.staggeredTimer <= 0) {
      const poiseDmg = isHeavy ? 24 : 9;
      this.doomBoss.posture += poiseDmg;
      if (this.doomBoss.posture >= this.doomBoss.maxPosture) {
        this.doomBoss.posture = 0;
        this.doomBoss.staggeredTimer = 2.85;
        this.doomBoss.state = 'idle';
        this.doomBoss.pendingMove = null;
        this.doomBoss.mesh.userData.windupType = null;
        if (this.doomBoss.beamMesh) {
          this.scene.remove(this.doomBoss.beamMesh);
          this.doomBoss.beamMesh = null;
        }
        this.spawnShockwave(this.doomBoss.pos, 0xfbbf24, 10.5, 0.5);
        this.triggerEventBanner('POSTURA QUEBRADA // GOLPE CRÍTICO', '#fbbf24');
        this.chromaPulse = 0.7;
        this.addTrauma(0.5);
        window.soundSystem.playStaggerBreak();
      }
    }

    this.spawnDamageNumber(
      this.doomBoss.pos.clone().add(new THREE.Vector3(0, 3.8, 0)),
      finalDmg,
      this.doomBoss.staggeredTimer > 0 ? '#fbbf24' : '#34d399',
      isHeavy || this.doomBoss.staggeredTimer > 0
    );
    this.spawnSparks(this.doomBoss.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), 0x34d399, isHeavy ? 14 : 7);

    // Phase 2 Transition (<55% HP)
    if (this.doomBoss.phase === 1 && this.doomBoss.hp > 0 && this.doomBoss.hp <= this.doomBoss.maxHp * 0.55) {
      this.doomBoss.phase = 2;
      this.doomBoss.staggeredTimer = 0;
      this.doomBoss.posture = 0;
      this.doomBoss.state = 'idle';
      this.doomBoss.stateTimer = 0.9;
      this.doomBoss.comboQueue = ['judgment_ring_inner'];
      this.playerState.healFlasks = Math.min(this.playerState.maxHealFlasks, this.playerState.healFlasks + 1);
      this.spawnShockwave(this.doomBoss.pos, 0x10b981, 22, 0.75);
      if (this.vfxPro) this.vfxPro.vfx.impactBurst(this.doomBoss.pos.clone().add(new THREE.Vector3(0, 2.5, 0)), '#10b981', 'heavy');
      this.addTrauma(0.75);
      this.chromaPulse = 0.95;
      window.soundSystem.playPhaseTransition();

      if (window.CutsceneDirector) {
        const dp = this.doomBoss.pos;
        this.doomBoss.mesh.userData.bossIntroTimer = 1.0;
        window.CutsceneDirector.play('doom_phase2_intro', [{
          speaker: 'DEUS IMPERADOR DESTINO',
          line: 'Basta de jogos. Testemunhem o poder absoluto da Fenda do Multiverso!',
          bossTitle: 'FASE 2 // DEUS IMPERADOR DESTINO',
          bossSub: 'A FENDA DO MULTIVERSO DESPERTA · GOLPES IMPLACÁVEIS',
          accent: '#34d399',
          camPos: dp.clone().add(new THREE.Vector3(6.5, 4.8, 12.5)),
          lookAt: dp.clone().add(new THREE.Vector3(0, 2.8, 0)),
          fov: 48,
          duration: 2.5,
          onEnter: (g) => {
            g.spawnShockwave(g.doomBoss.pos, 0xfacc15, 24, 0.7);
            g.spawnShockwave(g.doomBoss.pos, 0x10b981, 18, 0.6);
          }
        }], this, () => {
          this.triggerEventBanner('FASE 2 // DEUS IMPERADOR DESTINO', '#34d399');
        }, true);
      } else {
        this.triggerEventBanner('FASE 2 // DEUS IMPERADOR DESTINO', '#34d399');
      }
    }

    if (this.doomBoss.hp <= 0) {
      if (typeof this.handleDoomBossDefeated === 'function' && !this.postDoomUnlocked) {
        this.handleDoomBossDefeated();
      } else {
        this.spawnShockwave(this.doomBoss.pos, 0x6ee7b7, 24, 0.9);
        this.endGame(true);
      }
    }
  }

  activateBossEncounter() {
    if (this.doomBoss.active) return;
    this.doomBoss.active = true;
    const boss = this.doomBoss;
    boss.pos.set(0, 0.0, -592);
    if (boss.mesh) {
      boss.mesh.position.copy(boss.pos);
      boss.mesh.userData.bossIntroTimer = 1.0;
    }
    window.soundSystem.setBossMode(true);
    window.soundSystem.playDoomLaugh();

    if (window.CutsceneDirector) {
      window.CutsceneDirector.play('doom_throne_intro', [
        {
          speaker: 'CIDADELA SOBERANA DE DOOM',
          line: 'Diante da Fenda do Multiverso, nenhum vingador permanece de pé.',
          camPos: new THREE.Vector3(-9.5, 4.2, -536),
          lookAt: new THREE.Vector3(0, 4.5, -604),
          fov: 54,
          duration: 1.75
        },
        {
          speaker: 'DOUTOR VICTOR VON DOOM',
          line: 'Vocês ousam profanar meu trono? Ajoelhem-se diante do Soberano de Latvéria!',
          camPos: new THREE.Vector3(6.2, 4.8, -580),
          lookAt: new THREE.Vector3(0, 3.2, -595),
          fov: 46,
          duration: 2.05,
          onEnter: (g) => {
            g.spawnShockwave(g.doomBoss.pos, 0x10b981, 16, 0.55);
            if (g.vfx) g.vfx.emitBurst(g.doomBoss.pos.clone().add(new THREE.Vector3(0, 3, 0)), { color: 0x34d399, count: 80, speed: 22 });
          }
        },
        {
          speaker: 'DOUTOR VICTOR VON DOOM',
          line: 'Que o Multiverso testemunhe a sua ruína absoluta!',
          bossTitle: 'DOUTOR VICTOR VON DOOM',
          bossSub: 'IMPERADOR DE LATVÉRIA & DO MULTIVERSO // FASE FINAL',
          accent: '#10b981',
          camPos: new THREE.Vector3(0, 3.2, -572),
          lookAt: new THREE.Vector3(0, 2.2, -592),
          fov: 52,
          duration: 1.9,
          onEnter: (g) => {
            g.spawnShockwave(g.doomBoss.pos, 0x34d399, 24, 0.65);
            g.addTrauma(0.65);
          }
        }
      ], this, () => {
        this.doomBoss.pos.set(0, 0.0, -582);
        if (this.doomBoss.mesh) this.doomBoss.mesh.userData.bossIntroTimer = 0;
        this.triggerEventBanner('DOUTOR VICTOR VON DOOM // SOBERANO DE LATVÉRIA', '#34d399');
      }, true);
    } else {
      this.triggerEventBanner('DOUTOR VICTOR VON DOOM // SOBERANO DE LATVÉRIA', '#34d399');
    }
  }

  damagePlayer(amount) {
    if (this.isGameOver || this.playerState.invulnTimer > 0) return;

    if (this.playerState.shieldActive) {
      amount = Math.round(amount * 0.15);
      this.spawnSparks(this.playerState.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), 0xf59e0b, 8);
    }

    this.playerState.hp = Math.max(0, this.playerState.hp - amount);
    this.addTrauma(0.35);
    const vig = document.getElementById('damage-vignette');
    vig.classList.add('flash');
    setTimeout(() => vig.classList.remove('flash'), 200);

    if (this.playerState.hp <= 0) {
      this.endGame(false);
    }
  }

  endGame(victory) {
    this.isGameOver = true;
    this.isPaused = false;
    if (document.pointerLockElement) document.exitPointerLock();
    const overlay = document.getElementById('end-overlay');
    const title = document.getElementById('end-title');
    const sub = document.getElementById('end-subtitle');
    title.textContent = victory ? 'VITÓRIA DOS VINGADORES' : 'INCURSÃO FRACASSADA';
    title.style.color = victory ? '#34d399' : '#ef4444';
    sub.textContent = victory
      ? 'O trono de Latvéria foi tomado e a Esfera da Citadela estabilizada.'
      : 'Doutor Destino esmagou a vanguarda no Salão do Trono. Reagrupe e tente novamente.';
    overlay.classList.remove('hidden');
  }

  flashHitmarker(isCrit = false) {
    const hm = document.getElementById('hitmarker');
    hm.classList.remove('active', 'crit');
    void hm.offsetWidth;
    hm.classList.add('active');
    if (isCrit) hm.classList.add('crit');
    clearTimeout(this._hmTO);
    this._hmTO = setTimeout(() => hm.classList.remove('active', 'crit'), 150);
  }

  registerCombo() {
    this.comboCount++;
    this.comboTimer = 3.2;
    const box = document.getElementById('combo-display');
    const num = document.getElementById('combo-count');
    const rank = document.getElementById('combo-rank');
    num.textContent = `${this.comboCount}X`;
    rank.textContent =
      this.comboCount >= 28 ? 'OMEGA' :
      this.comboCount >= 18 ? 'SSS' :
      this.comboCount >= 10 ? 'SS' :
      this.comboCount >= 5  ? 'S' : 'A';
    box.classList.remove('hidden');
    box.classList.remove('pop');
    void box.offsetWidth;
    box.classList.add('pop');
  }

  spawnDamageNumber(worldPos, amount, color = '#10b981', isCrit = false) {
    const p = worldPos.clone().project(this.camera);
    if (p.z > 1) return;
    const x = (p.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-p.y * 0.5 + 0.5) * window.innerHeight;
    const el = document.createElement('div');
    el.className = `dmg-num ${isCrit ? 'crit' : ''}`;
    el.textContent = amount;
    el.style.color = color;
    el.style.left = `${x + (Math.random() - 0.5) * 26}px`;
    el.style.top = `${y}px`;
    document.getElementById('floating-dmg-container').appendChild(el);
    setTimeout(() => el.remove(), 750);
  }

  spawnHealOrb(pos) {
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.45, 0),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    );
    orb.position.set(pos.x, pos.y + 0.9, pos.z);
    this.scene.add(orb);
    this.healOrbs.push({ mesh: orb, pos: orb.position, life: 16 });
  }

  spawnBossMeteorTelegraph(pos, delay = 1.15, radius = 4.6) {
    const mat = CustomShaders.createShockwaveRingMaterial(0x10b981);
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, this.world.getGroundHeight(pos.x, pos.z) + 0.16, pos.z);
    this.scene.add(ring);
    this.telegraphs.push({ mesh: ring, mat, pos: ring.position.clone(), timer: delay, maxTimer: delay, radius });
  }

  // ==========================================================================
  // PLAYER UPDATE (Movement, Pendulum Web Swing, Flight, Detached Cape, Mjolnir)
  // ==========================================================================
  updatePlayer(delta, time) {
    const ps = this.playerState;
    const hero = HEROES_DATA[this.selectedHeroId];
    const pMesh = this.playerMesh;

    ps.primaryCooldown = Math.max(0, ps.primaryCooldown - delta);
    ps.skillCooldown = Math.max(0, ps.skillCooldown - delta);
    ps.uniqueCooldown = Math.max(0, ps.uniqueCooldown - delta);
    ps.dashCooldown = Math.max(0, ps.dashCooldown - delta);
    ps.swingCooldown = Math.max(0, (ps.swingCooldown || 0) - delta);
    ps.invulnTimer = Math.max(0, ps.invulnTimer - delta);
    ps.stamina = Math.min(ps.maxStamina, ps.stamina + delta * 22);
    ps.trailingHp = THREE.MathUtils.lerp(ps.trailingHp, ps.hp, Math.min(1, delta * 5.2));

    // Flush 160ms Input Buffer for ultra-fluid action chaining
    if (this._bufferedAction && this._bufferTimer > 0) {
      this._bufferTimer -= delta;
      const act = this._bufferedAction;
      if (act === 'dash' && ps.dashCooldown <= 0 && ps.stamina >= 22) {
        this._bufferedAction = null; this.triggerDash();
      } else if (act === 'm2' && ps.uniqueCooldown <= 0) {
        this._bufferedAction = null; this.triggerSecondaryUnique();
      } else if (act === 'q' && ps.skillCooldown <= 0) {
        this._bufferedAction = null; this.triggerSpecialSkill();
      } else if (act === 'r' && ps.ultCharge >= 100) {
        this._bufferedAction = null; this.triggerUltimate();
      } else if (act === 'rpg1' || act === 'rpg2' || act === 'rpg3') {
        this._bufferedAction = null;
        if (typeof this.triggerRpgSkill === 'function') this.triggerRpgSkill(parseInt(act.replace('rpg', ''), 10));
      } else if (act === 'm1' && ps.primaryCooldown <= 0) {
        this._bufferedAction = null; this.triggerPrimaryAttack();
      }
      if (this._bufferTimer <= 0) this._bufferedAction = null;
    }

    if (ps.comboResetTimer > 0) {
      ps.comboResetTimer -= delta;
      if (ps.comboResetTimer <= 0) ps.comboIndex = 0;
    }

    if (ps.shieldActive) {
      ps.shieldTimer -= delta;
      if (ps.shieldMesh) ps.shieldMesh.rotation.z = time * 3.0;
      if (ps.shieldTimer <= 0) {
        ps.shieldActive = false;
        if (ps.shieldMesh && ps.shieldMesh.parent) ps.shieldMesh.parent.remove(ps.shieldMesh);
        ps.shieldMesh = null;
      }
    }

    // Update Doctor Strange Thrown Cloak of Levitation
    if (ps.thrownCape.active && pMesh.userData.clothSim) {
      const tc = ps.thrownCape;
      const sim = pMesh.userData.clothSim;
      if (tc.phase === 'seek') {
        const tgtPos = tc.target && (!tc.target.isBoss ? (!tc.target.ref.dead ? tc.target.ref.pos : null) : this.doomBoss.pos);
        if (!tgtPos) {
          tc.phase = 'return';
        } else {
          tc.pos.lerp(tgtPos.clone().add(new THREE.Vector3(0, 1.4, 0)), Math.min(1, delta * 12));
          sim.detachedCenter.copy(tc.pos);
          if (tc.pos.distanceTo(tgtPos) < 2.2) {
            tc.phase = 'wrap';
            tc.timer = 2.6;
          }
        }
      } else if (tc.phase === 'wrap') {
        tc.timer -= delta;
        tc.tickTimer -= delta;
        const tgtPos = tc.target.isBoss ? this.doomBoss.pos : tc.target.ref.pos;
        sim.detachedCenter.copy(tgtPos).add(new THREE.Vector3(0, 1.3, 0));
        if (!tc.target.isBoss) tc.target.ref.webbedTimer = 0.5;
        if (tc.tickTimer <= 0) {
          tc.tickTimer = 0.45;
          this.applyTargetHit(tc.target, 52, '#f59e0b', false);
        }
        if (tc.timer <= 0 || (tc.target.isBoss ? this.doomBoss.hp <= 0 : tc.target.ref.dead)) {
          tc.phase = 'return';
        }
      } else {
        const backP = ps.pos.clone().add(new THREE.Vector3(0, 1.6, 0));
        tc.pos.lerp(backP, Math.min(1, delta * 14));
        sim.detachedCenter.copy(tc.pos);
        if (tc.pos.distanceTo(backP) < 1.6) {
          tc.active = false;
          sim.detached = false;
          if (pMesh.userData.collarMesh) pMesh.userData.collarMesh.visible = true;
        }
      }
    }

    // Update Thrown Mjolnir (Thor M2) & Vibranium Shield (Captain America M2)
    if (ps.thrownMjolnir.active) {
      const mj = ps.thrownMjolnir;
      if (mj.isCapShield) {
        mj.mesh.rotation.y += delta * 26;
      } else {
        mj.mesh.rotation.z += delta * 24;
        mj.mesh.rotation.x += delta * 14;
      }
      if (!mj.returning) {
        mj.pos.addScaledVector(mj.dir, delta * 42);
        mj.timer -= delta;
        if (mj.timer <= 0) mj.returning = true;
      } else {
        const toHand = ps.pos.clone().add(new THREE.Vector3(0, 1.5, 0)).sub(mj.pos);
        if (toHand.length() < 2.0) {
          this.scene.remove(mj.mesh);
          mj.active = false;
          if (pMesh.userData.mjolnir) pMesh.userData.mjolnir.visible = true;
          if (pMesh.userData.shieldProp) pMesh.userData.shieldProp.visible = true;
          this.spawnShockwave(ps.pos, mj.isCapShield ? 0x2563eb : 0x06b6d4, 5.5, 0.3);
        } else {
          mj.pos.addScaledVector(toHand.normalize(), delta * 48);
        }
      }
      if (mj.mesh) mj.mesh.position.copy(mj.pos);

      const hitCol = mj.isCapShield ? '#3b82f6' : '#06b6d4';
      this.doombots.forEach((b) => {
        if (!b.dead && !mj.hitSet.has(b) && b.pos.distanceTo(mj.pos) < 2.6) {
          mj.hitSet.add(b);
          this.applyTargetHit({ pos: b.pos, isBoss: false, ref: b }, 165, hitCol, true);
        }
      });
      if (this.miniBosses) {
        this.miniBosses.forEach((mb) => {
          if (mb.alive && !mj.hitSet.has(mb) && mb.pos.distanceTo(mj.pos) < 3.4) {
            mj.hitSet.add(mb);
            this.applyTargetHit({ pos: mb.pos, isBoss: false, ref: mb }, 185, hitCol, true);
          }
        });
      }
      if (this.world && this.world.energyTowers) {
        this.world.energyTowers.forEach((tw) => {
          if (!tw.destroyed && !mj.hitSet.has(tw) && tw.pos.distanceTo(mj.pos) < 3.4) {
            mj.hitSet.add(tw);
            this.applyTargetHit({ pos: tw.pos, isBoss: false, ref: tw }, 185, hitCol, true);
          }
        });
      }
      if (this.doomBoss.hp > 0 && !mj.hitSet.has('boss') && this.doomBoss.pos.distanceTo(mj.pos) < 3.4) {
        mj.hitSet.add('boss');
        this.applyTargetHit({ pos: this.doomBoss.pos, isBoss: true, ref: this.doomBoss }, 195, hitCol, true);
      }
    }

    // Movement Input relative to Camera
    const camFwd = new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).multiplyScalar(-1);
    const camRight = new THREE.Vector3(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.add(camFwd);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.sub(camFwd);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.add(camRight);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.sub(camRight);

    const isMoving = moveDir.lengthSq() > 0.001;
    if (isMoving) moveDir.normalize();

    // 1. REAL PENDULUM WEB SWING PHYSICS
    if (ps.isSwinging && ps.swingAnchor) {
      if (isMoving) ps.vel.addScaledVector(moveDir, delta * 34);
      ps.vel.y -= 26.0 * delta;
      const nextSwX = ps.pos.x + ps.vel.x * delta;
      const nextSwZ = ps.pos.z + ps.vel.z * delta;
      const swRes = this.world.resolveMovement(ps.pos.x, ps.pos.z, nextSwX, nextSwZ, 1.05, ps.pos.y, false);
      ps.pos.x = swRes.x;
      ps.pos.z = swRes.z;
      ps.pos.y += ps.vel.y * delta;

      const ropeVec = ps.pos.clone().sub(ps.swingAnchor);
      const dist = ropeVec.length();
      if (dist > ps.swingRopeLen) {
        const dirOut = ropeVec.normalize();
        const clamped = ps.swingAnchor.clone().addScaledVector(dirOut, ps.swingRopeLen);
        const clRes = this.world.resolveMovement(ps.pos.x, ps.pos.z, clamped.x, clamped.z, 1.05, clamped.y, false);
        ps.pos.set(clRes.x, clamped.y, clRes.z);
        const radialVel = ps.vel.dot(dirOut);
        if (radialVel > 0) ps.vel.addScaledVector(dirOut, -radialVel * 1.04);
      }

      const groundY = this.world.getSupportHeight(ps.pos.x, ps.pos.z, ps.pos.y);
      if (ps.pos.y <= groundY + 0.4) {
        ps.pos.y = groundY + 0.4;
        ps.vel.y = Math.max(ps.vel.y, 4);
      }
      if (ps.pos.y > groundY + 26) {
        ps.pos.y = groundY + 26;
        ps.vel.y = Math.min(ps.vel.y, 0);
      }
      ps.vel.y = Math.min(ps.vel.y, 16);

      if (ps.vel.lengthSq() > 1) {
        ps.yaw = Math.atan2(ps.vel.x, ps.vel.z);
      }
      if (ps.swingWebLine) {
        const handW = ps.pos.clone().add(new THREE.Vector3(0, 1.9, 0));
        ps.swingWebLine.position.copy(handW);
        ps.swingWebLine.lookAt(ps.swingAnchor);
        const rLen = handW.distanceTo(ps.swingAnchor);
        ps.swingWebLine.scale.set(1, 1, Math.max(0.2, rLen));
      }
    }
    // 2. FREE MYSTIC / THUNDER FLIGHT (Strange & Thor)
    else if (ps.isFlying) {
      const flySpeed = hero.speed * 1.38;
      if (isMoving) {
        ps.vel.x = THREE.MathUtils.lerp(ps.vel.x, moveDir.x * flySpeed, delta * 6.5);
        ps.vel.z = THREE.MathUtils.lerp(ps.vel.z, moveDir.z * flySpeed, delta * 6.5);
        ps.yaw = Math.atan2(moveDir.x, moveDir.z);
      } else {
        ps.vel.x *= Math.exp(-5 * delta);
        ps.vel.z *= Math.exp(-5 * delta);
      }
      let targetVY = 0;
      if (this.keys['Space']) targetVY += 13;
      if (this.keys['KeyC'] || this.keys['ControlLeft']) targetVY -= 13;
      ps.vel.y = THREE.MathUtils.lerp(ps.vel.y, targetVY, delta * 7.5);

      const resolved = this.world.resolveMovement(ps.pos.x, ps.pos.z, ps.pos.x + ps.vel.x * delta, ps.pos.z + ps.vel.z * delta, 1.05, ps.pos.y, false);
      ps.pos.x = resolved.x;
      ps.pos.z = resolved.z;
      ps.pos.y = Math.min(this.world.getGroundHeight(ps.pos.x, ps.pos.z) + 26, ps.pos.y + ps.vel.y * delta);

      const floorY = this.world.getSupportHeight(ps.pos.x, ps.pos.z, ps.pos.y);
      if (ps.pos.y <= floorY + 0.08) {
        ps.pos.y = floorY;
        ps.isFlying = false;
        ps.isGrounded = true;
      }
    }
    // 3. WATER SWIMMING + STANDARD GROUND + DOUBLE JUMP PHYSICS
    else {
      const floorY = this.world.getGroundHeight(ps.pos.x, ps.pos.z);
      const waterY = this.world.getWaterLevel ? this.world.getWaterLevel(ps.pos.x, ps.pos.z, ps.pos.y) : -Infinity;
      const inDeepWater = waterY > -900 && floorY < waterY - 0.75 && ps.pos.y <= waterY + 0.15;

      if (inDeepWater) {
        if (!ps.isSwimming) {
          ps.isSwimming = true;
          this.spawnSparks(new THREE.Vector3(ps.pos.x, waterY + 0.1, ps.pos.z), 0x7dd3fc, 12);
          this.spawnShockwave(new THREE.Vector3(ps.pos.x, waterY + 0.08, ps.pos.z), 0x38bdf8, 4.5, 0.45);
        }
        const swimSpd = hero.speed * (this.keys['ShiftLeft'] ? 1.04 : 0.76);
        if (isMoving) {
          ps.vel.x = THREE.MathUtils.lerp(ps.vel.x, moveDir.x * swimSpd, delta * 7.5);
          ps.vel.z = THREE.MathUtils.lerp(ps.vel.z, moveDir.z * swimSpd, delta * 7.5);
          const desiredYaw = Math.atan2(moveDir.x, moveDir.z);
          let diff = desiredYaw - ps.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          ps.yaw += diff * Math.min(1, delta * 9);
        } else {
          ps.vel.x *= Math.exp(-5 * delta);
          ps.vel.z *= Math.exp(-5 * delta);
        }
        const resolved = this.world.resolveMovement(ps.pos.x, ps.pos.z, ps.pos.x + ps.vel.x * delta, ps.pos.z + ps.vel.z * delta, 1.05, ps.pos.y, false);
        ps.pos.x = resolved.x;
        ps.pos.z = resolved.z;

        const targetSwimY = Math.max(this.world.getGroundHeight(ps.pos.x, ps.pos.z), waterY - 1.05 + Math.sin(time * 2.8) * 0.05);
        ps.pos.y = THREE.MathUtils.lerp(ps.pos.y, targetSwimY, Math.min(1, delta * 9));
        ps.vel.y = 0;
        ps.isGrounded = false;
        ps.jumpsRemaining = 1;

        ps.waterRippleCd = Math.max(0, (ps.waterRippleCd || 0) - delta);
        if (isMoving && ps.waterRippleCd <= 0) {
          ps.waterRippleCd = 0.36;
          this.spawnShockwave(new THREE.Vector3(ps.pos.x, waterY + 0.08, ps.pos.z), 0x7dd3fc, 3.2, 0.42);
        }
      } else {
        ps.isSwimming = false;
        const targetSpeed = hero.speed * (this.playerAgilityMult || 1.0);
        if (isMoving) {
          ps.vel.x = THREE.MathUtils.lerp(ps.vel.x, moveDir.x * targetSpeed, delta * 12);
          ps.vel.z = THREE.MathUtils.lerp(ps.vel.z, moveDir.z * targetSpeed, delta * 12);
          const desiredYaw = Math.atan2(moveDir.x, moveDir.z);
          let diff = desiredYaw - ps.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          ps.yaw += diff * Math.min(1, delta * 14);
        } else {
          ps.vel.x *= Math.exp(-12 * delta);
          ps.vel.z *= Math.exp(-12 * delta);
        }

        if (!ps.isGrounded) ps.vel.y -= 38.0 * delta;

        const resolved = this.world.resolveMovement(ps.pos.x, ps.pos.z, ps.pos.x + ps.vel.x * delta, ps.pos.z + ps.vel.z * delta, 1.05, ps.pos.y, ps.isGrounded);
        ps.pos.x = resolved.x;
        ps.pos.z = resolved.z;
        ps.pos.y += ps.vel.y * delta;

        const newFloorY = this.world.getSupportHeight(ps.pos.x, ps.pos.z, ps.pos.y);
        if (ps.pos.y <= newFloorY) {
          if (!ps.isGrounded && ps.vel.y < -12) this.applyHeroSquash(0.18);
          ps.pos.y = newFloorY;
          ps.vel.y = 0;
          ps.isGrounded = true;
          ps.coyoteTimer = 0.12;
          ps.jumpsRemaining = 2;
        } else {
          if (ps.isGrounded) ps.coyoteTimer -= delta;
          ps.isGrounded = false;
        }
      }
    }

    // Hold M1 Auto-Combo
    if (this.mouseDown && ps.primaryCooldown <= 0) {
      this.triggerPrimaryAttack();
    }

    // Update Hero Mesh & Rig Animation
    pMesh.position.copy(ps.pos);
    pMesh.rotation.y = ps.yaw;
    pMesh.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, delta * 12));
    pMesh.userData.isFlying = ps.isFlying;
    pMesh.userData.isSwinging = ps.isSwinging;
    pMesh.userData.isSwimming = !!ps.isSwimming;

    let yawDelta = ps.yaw - (this._prevHeroYaw !== undefined ? this._prevHeroYaw : ps.yaw);
    while (yawDelta > Math.PI) yawDelta -= Math.PI * 2;
    while (yawDelta < -Math.PI) yawDelta += Math.PI * 2;
    this._prevHeroYaw = ps.yaw;
    pMesh.userData.turnRate = THREE.MathUtils.lerp(
      pMesh.userData.turnRate || 0,
      yawDelta / Math.max(0.008, delta),
      1 - Math.exp(-12 * delta)
    );
    pMesh.userData.moveSpeedRatio = Math.min(1.35, Math.hypot(ps.vel.x, ps.vel.z) / Math.max(8, hero.speed));
    pMesh.userData.vertVel = ps.vel.y;

    const fwdHero = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw));
    const rightHero = new THREE.Vector3(Math.cos(ps.yaw), 0, -Math.sin(ps.yaw));
    pMesh.userData.strafeX = isMoving ? moveDir.dot(rightHero) : 0;
    const bank = isMoving ? moveDir.clone().cross(fwdHero).y : 0;
    CharacterBuilder.animateCharacter(pMesh, delta, isMoving, ps.isGrounded, time, bank);
    this.updateClothForCharacter(pMesh, delta, time);

    // Smoothly transition into Gothic Throne Room Atmosphere when crossing Castle Gate
    const targetIndoor = ps.pos.z < -502 && ps.pos.z > -640 && Math.abs(ps.pos.x) < 35 ? 1.0 : 0.0;
    this.indoorMix = THREE.MathUtils.lerp(this.indoorMix, targetIndoor, Math.min(1, delta * 2.5));
    if (ps.pos.z < -508 && ps.pos.z > -635 && Math.abs(ps.pos.x) < 35 && !this.doomBoss.active && this.doomBoss.hp > 0) {
      this.activateBossEncounter();
    }

    // STABLE CRITICALLY-DAMPED OVER-THE-SHOULDER CAMERA (Unified Anchor -> Pivot -> Pos & LookTarget)
    const isActionFast = ps.isSwinging || ps.isFlying || ps.dashCooldown > 0.42;
    const desiredFov = isActionFast ? 64 : 60;
    if (Math.abs(this.camera.fov - desiredFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, desiredFov, 1 - Math.exp(-8 * delta));
      this.camera.updateProjectionMatrix();
    }

    const baseDist = this.userCamDist || 7.1;
    const indoorZoom = targetIndoor > 0.5 ? -1.4 : 0;
    const targetDist = Math.max(4.6, baseDist + indoorZoom + (isActionFast ? 1.35 : (ps.isSwimming ? 0.3 : 0)));
    this.camDist = THREE.MathUtils.lerp(this.camDist, targetDist, 1 - Math.exp(-10 * delta));

    if (!this.camAnchor || this.camAnchor.distanceToSquared(ps.pos) > 400) {
      this.camAnchor = ps.pos.clone();
    } else {
      const xzAlpha = 1 - Math.exp(-20 * delta);
      const yAlpha = 1 - Math.exp((ps.isGrounded ? -16 : -10) * delta);
      this.camAnchor.x = THREE.MathUtils.lerp(this.camAnchor.x, ps.pos.x, xzAlpha);
      this.camAnchor.z = THREE.MathUtils.lerp(this.camAnchor.z, ps.pos.z, xzAlpha);
      this.camAnchor.y = THREE.MathUtils.lerp(this.camAnchor.y, ps.pos.y, yAlpha);
    }

    const shoulderRight = new THREE.Vector3(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
    const shoulderY = ps.isFlying ? 2.35 : (ps.isSwimming ? 1.65 : 2.15);
    const pivot = new THREE.Vector3(
      this.camAnchor.x + shoulderRight.x * 0.46,
      this.camAnchor.y + shoulderY,
      this.camAnchor.z + shoulderRight.z * 0.46
    );

    const cosP = Math.cos(this.camPitch);
    const sinP = Math.sin(this.camPitch);
    const desiredPos = new THREE.Vector3(
      pivot.x + Math.sin(this.camYaw) * cosP * this.camDist,
      pivot.y + sinP * this.camDist,
      pivot.z + Math.cos(this.camYaw) * cosP * this.camDist
    );

    for (const frac of [0.42, 0.72, 1.0]) {
      const tx = pivot.x + (desiredPos.x - pivot.x) * frac;
      const ty = pivot.y + (desiredPos.y - pivot.y) * frac;
      const tz = pivot.z + (desiredPos.z - pivot.z) * frac;
      if (this.world.isPositionBlocked(tx, tz, 0.35, ty)) {
        const pull = Math.max(0.28, frac - 0.14);
        desiredPos.set(
          pivot.x + (desiredPos.x - pivot.x) * pull,
          pivot.y + (desiredPos.y - pivot.y) * pull,
          pivot.z + (desiredPos.z - pivot.z) * pull
        );
        break;
      }
    }

    const gCamY = this.world.getGroundHeight(desiredPos.x, desiredPos.z);
    const wCamY = this.world.getWaterLevel ? this.world.getWaterLevel(desiredPos.x, desiredPos.z, ps.pos.y) : -Infinity;
    const minCamY = Math.max(gCamY, wCamY > -900 ? wCamY : gCamY) + 0.85;
    if (desiredPos.y < minCamY) desiredPos.y = minCamY;

    const fwd = new THREE.Vector3(-Math.sin(this.camYaw) * cosP, -sinP, -Math.cos(this.camYaw) * cosP);
    const lookTarget = new THREE.Vector3(
      pivot.x + fwd.x * 22.0,
      pivot.y + 0.08 + fwd.y * 22.0,
      pivot.z + fwd.z * 22.0
    );

    if (this.cameraTrauma > 0.01) {
      const shake = this.cameraTrauma * this.cameraTrauma * 0.28;
      desiredPos.x += (Math.random() - 0.5) * shake;
      desiredPos.y += (Math.random() - 0.5) * shake;
      desiredPos.z += (Math.random() - 0.5) * shake;
    }
    this.cameraTrauma = Math.max(0, this.cameraTrauma - delta * 2.4);

    this.camera.position.copy(desiredPos);
    this.camera.lookAt(lookTarget);
  }

  // ==========================================================================
  // ELDEN RING-INSPIRED DOCTOR DOOM BOSS AI (7 COMPLEX MULTI-PHASE MOVESETS)
  // ==========================================================================
  updateBoss(delta, time) {
    const boss = this.doomBoss;
    if (!boss.mesh || boss.hp <= 0) return;

    boss._dmgWinTimer = (boss._dmgWinTimer || 0) + delta;
    if (boss._dmgWinTimer >= 1.0) { boss._dmgWinTimer = 0; boss._dmgWinAcc = 0; }
    boss._spamDecay = (boss._spamDecay || 0) + delta;
    if (boss._spamDecay >= 1.4) { boss._spamDecay = 0; boss._spamHits = Math.max(0, (boss._spamHits || 0) - 2); }
    boss._riposteCd = Math.max(0, (boss._riposteCd || 0) - delta);
    boss.trailingHp = THREE.MathUtils.lerp(boss.trailingHp, boss.hp, Math.min(1, delta * 4.5));
    if (this.timeFreezeTimer > 0) { boss.mesh.position.copy(boss.pos); return; }
    if (boss.markedTimer > 0) boss.markedTimer -= delta;

    // Update Floating Multiverse Swords firing sequentially
    if (boss.multiverseBlades && boss.multiverseBlades.length > 0) {
      boss.bladeFireCd -= delta;
      boss.multiverseBlades.forEach((b, idx) => {
        if (!b.fired) {
          const ang = time * 2.5 + idx * (Math.PI * 2 / 8);
          b.mesh.position.set(boss.pos.x + Math.cos(ang) * 3.2, boss.pos.y + 3.6 + Math.sin(time * 4 + idx) * 0.4, boss.pos.z + Math.sin(ang) * 3.2);
          b.mesh.lookAt(this.playerState.pos.clone().add(new THREE.Vector3(0, 1.3, 0)));
        }
      });
      if (boss.bladeFireCd <= 0) {
        boss.bladeFireCd = boss.phase === 2 ? 0.16 : 0.24;
        const b = boss.multiverseBlades.shift();
        if (b) {
          const origin = b.mesh.position.clone();
          const tgt = this.playerState.pos.clone().add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(this.playerState.vel, 0.22);
          const dir = tgt.sub(origin).normalize();
          b.mesh.lookAt(origin.clone().add(dir));
          this.projectiles.push({ mesh: b.mesh, pos: origin, vel: dir.multiplyScalar(boss.phase === 2 ? 36 : 30), dmg: 38, color: '#34d399', isPlayer: false, radius: 1.05, life: 2.6 });
        }
      }
    }

    // Update Twin Sweeping Imperial Beams
    if (boss.beamMesh) {
      boss.beamSweepTimer -= delta;
      boss.beamYaw += delta * (boss.phase === 2 ? 2.05 : 1.55);
      const checkBeam = (yaw, bMesh) => {
        if (!bMesh) return;
        bMesh.rotation.y = yaw;
        bMesh.position.copy(boss.pos).add(new THREE.Vector3(0, 1.8, 0));
        const beamDir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
        const toPlayer = this.playerState.pos.clone().sub(boss.pos);
        if (toPlayer.y < 3.6) {
          const proj = toPlayer.dot(beamDir);
          if (proj > 0 && proj < 30) {
            const perp = toPlayer.clone().addScaledVector(beamDir, -proj);
            if (perp.length() < 1.65) this.damagePlayer(22);
          }
        }
      };
      checkBeam(boss.beamYaw, boss.beamMesh);
      if (boss.beamMesh2) checkBeam(boss.beamYaw + Math.PI, boss.beamMesh2);
      if (boss.beamSweepTimer <= 0) {
        this.scene.remove(boss.beamMesh); boss.beamMesh = null;
        if (boss.beamMesh2) { this.scene.remove(boss.beamMesh2); boss.beamMesh2 = null; }
      }
    }

    // Staggered State (2.6s open punish window!)
    if (boss.staggeredTimer > 0) {
      boss.staggeredTimer -= delta;
      boss.mesh.userData.staggered = true;
      boss.mesh.position.copy(boss.pos);
      CharacterBuilder.animateCharacter(boss.mesh, delta, false, true, time);
      this.updateClothForCharacter(boss.mesh, delta, time);
      if (boss.staggeredTimer <= 0) boss.mesh.userData.staggered = false;
      return;
    }

    boss.mesh.userData.staggered = false;

    if (!boss.active) {
      boss.mesh.position.copy(boss.pos);
      CharacterBuilder.animateCharacter(boss.mesh, delta, false, true, time);
      this.updateClothForCharacter(boss.mesh, delta, time);
      return;
    }

    const toPlayer = this.playerState.pos.clone().sub(boss.pos);
    const dist = toPlayer.length();
    const desiredYaw = Math.atan2(toPlayer.x, toPlayer.z);
    let yDiff = desiredYaw - boss.mesh.rotation.y;
    while (yDiff > Math.PI) yDiff -= Math.PI * 2;
    while (yDiff < -Math.PI) yDiff += Math.PI * 2;
    boss.mesh.rotation.y += yDiff * Math.min(1, delta * 9);

    boss.stateTimer -= delta;
    let isMoving = false;

    if (boss.state === 'idle') {
      boss.mesh.userData.windupType = null;
      if (dist > 6.5 && dist < 56) {
        const dir = toPlayer.clone().setY(0).normalize();
        const strafe = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(Math.sin(time * 1.4) * 0.42);
        dir.add(strafe).normalize();
        const moveSpd = boss.phase === 2 ? 14.5 : 10.6;
        const resolved = this.world.resolveMovement(boss.pos.x, boss.pos.z, boss.pos.x + dir.x * moveSpd * delta, boss.pos.z + dir.z * moveSpd * delta, 1.4);
        boss.pos.x = resolved.x;
        boss.pos.z = resolved.z;
        boss.pos.y = this.world.getGroundHeight(boss.pos.x, boss.pos.z);
        isMoving = true;
      }
      if (boss.stateTimer <= 0) this.chooseDoomWindup(dist);
    } else if (boss.state === 'windup') {
      if ((boss.pendingMove === 'combo_lunge' || boss.pendingMove === 'doom_foot_dive') && boss.stateTimer < 0.18 && dist > 3.2) {
        const dir = toPlayer.clone().setY(0).normalize();
        const spd = boss.pendingMove === 'doom_foot_dive' ? 36 : 28;
        const res = this.world.resolveMovement(boss.pos.x, boss.pos.z, boss.pos.x + dir.x * spd * delta, boss.pos.z + dir.z * spd * delta, 1.4);
        boss.pos.x = res.x; boss.pos.z = res.z;
        if (boss.pendingMove === 'doom_foot_dive') boss.pos.y = Math.sin((boss.stateTimer / 0.18) * Math.PI) * 5.5;
      }
      if (boss.stateTimer <= 0) {
        boss.pos.y = this.world.getGroundHeight(boss.pos.x, boss.pos.z);
        this.executeDoomMove();
      }
    } else if (boss.state === 'recover') {
      boss.mesh.userData.windupType = null;
      if (boss.stateTimer <= 0) {
        if (boss.comboQueue && boss.comboQueue.length > 0) {
          this.startQueuedDoomMove(boss.comboQueue.shift());
        } else {
          boss.state = 'idle';
          boss.stateTimer = boss.phase === 2 ? 0.38 : 0.68;
        }
      }
    }

    boss.mesh.position.copy(boss.pos);
    CharacterBuilder.animateCharacter(boss.mesh, delta, isMoving, true, time);
    this.updateClothForCharacter(boss.mesh, delta, time);
  }

  startQueuedDoomMove(move) {
    const boss = this.doomBoss;
    boss.state = 'windup';
    boss.pendingMove = move;
    const map = {
      combo_lunge:        { t: 0.40, anim: 'lunge' },
      combo_sweep:        { t: 0.44, anim: 'sweep' },
      doom_foot_dive:     { t: 0.52, anim: 'lunge' },
      doom_octagon_cage:  { t: 0.56, anim: 'cast' },
      cataclysm_slam:     { t: 0.84, anim: 'slam' }, // Roll-catch atraso intencional!
      doom_supernova:     { t: 0.68, anim: 'slam' },
      judgment_ring_inner:{ t: 0.90, anim: 'execution' },
      judgment_ring_mid:  { t: 0.40, anim: 'execution' },
      judgment_ring_outer:{ t: 0.40, anim: 'slam' },
      spears_salvo_2:     { t: 0.32, anim: 'cast' }
    };
    const cfg = map[move] || { t: 0.55, anim: 'cast' };
    boss.stateTimer = boss.phase === 2 ? cfg.t * 0.85 : cfg.t;
    boss.mesh.userData.windupType = cfg.anim;
    if (cfg.anim === 'slam' || cfg.anim === 'execution') {
      this.spawnShockwave(boss.pos, cfg.anim === 'execution' ? 0xfacc15 : 0x10b981, 5.5, 0.45);
    }
  }

  chooseDoomWindup(dist) {
    const boss = this.doomBoss;
    const roll = Math.random();
    boss.comboQueue = boss.comboQueue || [];

    if (boss.phase === 2 && roll < 0.22) {
      boss.comboQueue = ['judgment_ring_mid', 'judgment_ring_outer'];
      this.startQueuedDoomMove('judgment_ring_inner');
      this.triggerEventBanner('JULGAMENTO DE LATVÉRIA — ESQUIVE E PULE OS 3 ANÉIS!', '#facc15');
    } else if (dist > 14 && roll < 0.42) {
      boss.comboQueue = ['combo_sweep', 'doom_supernova'];
      this.startQueuedDoomMove('doom_foot_dive');
    } else if (dist < 14 && roll < 0.50) {
      boss.comboQueue = ['combo_sweep', 'cataclysm_slam'];
      this.startQueuedDoomMove('combo_lunge');
    } else if (roll < 0.66) {
      this.startQueuedDoomMove('doom_octagon_cage');
    } else if (roll < 0.78) {
      boss.state = 'windup';
      boss.pendingMove = 'multiverse_blade_storm';
      boss.stateTimer = 0.50;
      boss.mesh.userData.windupType = 'cast';
    } else if (roll < 0.88) {
      boss.comboQueue = ['doom_supernova'];
      boss.state = 'windup';
      boss.pendingMove = 'crimson_chains_pull';
      boss.stateTimer = 0.52;
      boss.mesh.userData.windupType = 'cast';
    } else if (roll < 0.94) {
      boss.state = 'windup';
      boss.pendingMove = 'twin_helical_beams';
      boss.stateTimer = 0.56;
      boss.mesh.userData.windupType = 'sweep';
      window.soundSystem.playDoomBeam();
    } else {
      boss.comboQueue = ['spears_salvo_2'];
      boss.state = 'windup';
      boss.pendingMove = 'latveria_spears';
      boss.stateTimer = 0.46;
      boss.mesh.userData.windupType = 'cast';
    }
  }

  executeDoomMove() {
    const boss = this.doomBoss;
    const move = boss.pendingMove;
    boss.mesh.userData.windupType = null;
    const pPos = this.playerState.pos;

    if (move === 'combo_lunge') {
      const fwd = new THREE.Vector3(Math.sin(boss.mesh.rotation.y), 0, Math.cos(boss.mesh.rotation.y));
      const res = this.world.resolveMovement(boss.pos.x, boss.pos.z, boss.pos.x + fwd.x * 10, boss.pos.z + fwd.z * 10, 1.4);
      boss.pos.set(res.x, this.world.getGroundHeight(res.x, res.z), res.z);
      this.spawnSlashArc(boss.pos.clone().add(new THREE.Vector3(0, 1.8, 0)), boss.mesh.rotation.y, 0x34d399, 0x10b981, 6.5, 0.35);
      if (pPos.distanceTo(boss.pos) < 7.5 && this.playerState.invulnTimer <= 0) this.damagePlayer(48);
    } else if (move === 'combo_sweep') {
      this.spawnSlashArc(boss.pos.clone().add(new THREE.Vector3(0, 1.8, 0)), boss.mesh.rotation.y, 0x6ee7b7, 0x059669, 9.5, 0.4, 0.25);
      this.spawnShockwave(boss.pos, 0x10b981, 11.0, 0.4);
      if (pPos.distanceTo(boss.pos) < 10.5 && pPos.y < boss.pos.y + 3.0) this.damagePlayer(56);
    } else if (move === 'cataclysm_slam') {
      this.spawnShockwave(boss.pos, 0x34d399, 17.5, 0.55);
      if (this.vfx) this.vfx.spawnGroundDangerZone(boss.pos.clone(), 20, 1.25, 0x10b981, 'ring_jump');
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        this.spawnBossMeteorTelegraph(boss.pos.clone().add(new THREE.Vector3(Math.cos(ang) * 9.5, 0, Math.sin(ang) * 9.5)), 0.78, 4.2);
      }
      window.soundSystem.playExplosion();
      this.addTrauma(0.6);
      if (pPos.distanceTo(boss.pos) < 14.5 && pPos.y < boss.pos.y + 3.2) this.damagePlayer(72);
    } else if (move === 'crimson_chains_pull') {
      const origin = boss.pos.clone().add(new THREE.Vector3(0, 2.2, 0));
      const aim = pPos.clone().add(new THREE.Vector3(0, 1.3, 0));
      if (this.vfx) this.vfx.spawnVolumetricBeam(origin, aim, { color: 0xe11d48, coreColor: 0xfef08a, width: 1.0, duration: 0.4 });
      if (pPos.distanceTo(boss.pos) < 34) {
        const pull = boss.pos.clone().sub(pPos).setY(0).normalize().multiplyScalar(Math.max(0, pPos.distanceTo(boss.pos) - 7));
        this.safeTranslatePlayer(pull.x * 0.72, pull.z * 0.72);
        this.damagePlayer(28);
      }
    } else if (move === 'doom_supernova') {
      this.spawnShockwave(boss.pos, 0xe11d48, 16.0, 0.55);
      if (this.vfxPro) this.vfxPro.vfx.impactBurst(boss.pos.clone().add(new THREE.Vector3(0, 2, 0)), '#ef4444', 'heavy');
      if (pPos.distanceTo(boss.pos) < 13.5 && this.playerState.invulnTimer <= 0) this.damagePlayer(78);
    } else if (move === 'multiverse_blade_storm') {
      for (let i = 0; i < (boss.phase === 2 ? 8 : 6); i++) {
        const sword = new THREE.Mesh(
          new THREE.ConeGeometry(0.24, 2.2, 4),
          CustomShaders.createBeamShaderMaterial(0xfef08a, 0x10b981)
        );
        sword.rotation.x = Math.PI / 2;
        this.scene.add(sword);
        boss.multiverseBlades.push({ mesh: sword, fired: false });
      }
      boss.bladeFireCd = 0.35;
      window.soundSystem.playDoomBeam();
    } else if (move === 'judgment_ring_inner' || move === 'judgment_ring_mid' || move === 'judgment_ring_outer') {
      const rad = move === 'judgment_ring_inner' ? 11 : move === 'judgment_ring_mid' ? 20 : 30;
      const minR = move === 'judgment_ring_inner' ? 0 : move === 'judgment_ring_mid' ? 9 : 18;
      this.spawnShockwave(boss.pos, 0xfacc15, rad, 0.55);
      if (this.vfx) this.vfx.spawnGroundDangerZone(boss.pos.clone(), rad, 1.15, 0xfacc15, 'ring_jump');
      const d = pPos.distanceTo(boss.pos);
      if (d >= minR && d <= rad && pPos.y < boss.pos.y + 3.4) this.damagePlayer(66);
      if (move === 'judgment_ring_outer') {
        const origin = boss.pos.clone().add(new THREE.Vector3(0, 2.5, 0));
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2;
          const pDir = new THREE.Vector3(Math.cos(ang), -0.05, Math.sin(ang)).normalize();
          const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), CustomShaders.createBeamShaderMaterial(0xfef08a, 0x10b981));
          orb.position.copy(origin);
          this.scene.add(orb);
          this.projectiles.push({ mesh: orb, pos: origin.clone(), vel: pDir.multiplyScalar(25), dmg: 38, color: '#facc15', isPlayer: false, radius: 1.1, life: 2.8 });
        }
      }
    } else if (move === 'doom_foot_dive') {
      this.spawnShockwave(boss.pos, 0x10b981, 13.5, 0.45);
      this.spawnSlashArc(boss.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), boss.mesh.rotation.y, 0xfef08a, 0x10b981, 8.5, 0.35);
      if (this.vfx) this.vfx.emitBurst(boss.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), { color: 0x34d399, count: 40, speed: 18 });
      if (pPos.distanceTo(boss.pos) < 8.5 && this.playerState.invulnTimer <= 0) this.damagePlayer(62);
    } else if (move === 'doom_octagon_cage') {
      const originCenter = pPos.clone();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const px = originCenter.x + Math.cos(a) * 14.0;
        const pz = originCenter.z + Math.sin(a) * 14.0;
        const gY = this.world.getGroundHeight(px, pz);
        const orig = new THREE.Vector3(px, gY + 2.0, pz);
        const dir = originCenter.clone().add(new THREE.Vector3(0, 1.3, 0)).sub(orig).normalize();
        const spear = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.2, 6), CustomShaders.createBeamShaderMaterial(0xfef08a, 0x10b981));
        spear.rotation.x = Math.PI / 2;
        spear.position.copy(orig);
        spear.lookAt(orig.clone().add(dir));
        this.scene.add(spear);
        this.projectiles.push({ mesh: spear, pos: orig, vel: dir.multiplyScalar(22), dmg: 44, color: '#34d399', isPlayer: false, radius: 1.15, life: 1.8 });
      }
      this.spawnBossMeteorTelegraph(originCenter, 0.85, 5.2);
      window.soundSystem.playDoomBeam();
    } else if (move === 'latveria_spears' || move === 'spears_salvo_2') {
      const origin = boss.pos.clone().add(new THREE.Vector3(0, 2.4, 0));
      const leadPos = pPos.clone().add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(this.playerState.vel, THREE.MathUtils.clamp(pPos.distanceTo(boss.pos) / 34, 0.12, 0.45));
      const baseDir = leadPos.sub(origin).normalize();
      const count = move === 'spears_salvo_2' ? (boss.phase === 2 ? 7 : 5) : (boss.phase === 2 ? 5 : 3);
      for (let i = 0; i < count; i++) {
        const angleOff = (i - (count - 1) * 0.5) * 0.18;
        const dir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOff);
        const spear = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.1, 6), CustomShaders.createBeamShaderMaterial(0xffffff, 0x10b981));
        spear.rotation.x = Math.PI / 2;
        spear.position.copy(origin);
        spear.lookAt(origin.clone().add(dir));
        this.scene.add(spear);
        this.projectiles.push({ mesh: spear, pos: origin.clone(), vel: dir.multiplyScalar(boss.phase === 2 ? 36 : 29), dmg: 44, color: '#10b981', isPlayer: false, radius: 1.15, life: 2.8 });
      }
      window.soundSystem.playDoomBeam();
    } else if (move === 'twin_helical_beams') {
      const beamGeo = new THREE.CylinderGeometry(0.35, 0.58, 30, 8, 1, true);
      beamGeo.translate(0, 15, 0); beamGeo.rotateX(Math.PI / 2);
      const bMesh = new THREE.Mesh(beamGeo, CustomShaders.createBeamShaderMaterial(0xffffff, 0x10b981));
      bMesh.position.copy(boss.pos).add(new THREE.Vector3(0, 1.8, 0));
      boss.beamYaw = boss.mesh.rotation.y - 0.95;
      boss.beamSweepTimer = 1.65;
      boss.beamMesh = bMesh;
      this.scene.add(bMesh);
      if (boss.phase === 2) {
        const bMesh2 = new THREE.Mesh(beamGeo, CustomShaders.createBeamShaderMaterial(0xfef08a, 0x10b981));
        bMesh2.position.copy(bMesh.position);
        boss.beamMesh2 = bMesh2;
        this.scene.add(bMesh2);
      }
      for (let i = 0; i < (boss.phase === 2 ? 4 : 2); i++) {
        const offset = new THREE.Vector3((Math.random() - 0.5) * 12, 0, (Math.random() - 0.5) * 12);
        this.spawnBossMeteorTelegraph(pPos.clone().add(offset), 1.0, 4.8);
      }
    }

    if (boss.phase === 2 && Math.random() < 0.42 && (!boss.comboQueue || boss.comboQueue.length === 0)) {
      const angle = Math.random() * Math.PI * 2;
      const tx = THREE.MathUtils.clamp(Math.cos(angle) * 16, -22, 22);
      const tz = THREE.MathUtils.clamp(-576 + Math.sin(angle) * 18, -608, -528);
      this.spawnShockwave(boss.pos, 0x34d399, 6.5, 0.35);
      boss.pos.set(tx, this.world.getGroundHeight(tx, tz), tz);
      this.spawnShockwave(boss.pos, 0x34d399, 6.5, 0.35);
    }

    boss.state = 'recover';
    boss.stateTimer = (boss.comboQueue && boss.comboQueue.length > 0) ? 0.14 : (boss.phase === 2 ? 0.48 : 0.78);
  }

  // ==========================================================================
  // DOOMBOTS & WORLD FX LOOP
  // ==========================================================================
  updateDoombots(delta, time) {
    const pPos = this.playerState.pos;
    this.doombots.forEach((b) => {
      if (b.dead) return;
      const dSq = pPos.distanceToSquared(b.pos);
      if (dSq > 80 * 80) {
        if (b.mesh.visible) b.mesh.visible = false;
        return;
      }
      if (!b.mesh.visible) b.mesh.visible = true;
      const hpBg = b.mesh.userData.hpBarBg;
      const hpFill = b.mesh.userData.hpBarFill;
      if (hpBg && hpFill && dSq < 45 * 45) {
        hpBg.visible = true;
        hpBg.lookAt(this.camera.position);
        const ratio = Math.max(0, b.hp / b.maxHp);
        hpFill.scale.x = Math.max(0.001, ratio);
        hpFill.position.x = -(1 - ratio) * 0.55;
      } else if (hpBg) {
        hpBg.visible = false;
      }

      if (b.markedTimer > 0) b.markedTimer -= delta;
      if (this.timeFreezeTimer > 0) {
        CharacterBuilder.animateCharacter(b.mesh, 0.0001, false, true, time);
        return;
      }
      if (b.webbedTimer > 0) {
        b.webbedTimer -= delta;
        CharacterBuilder.animateCharacter(b.mesh, delta, false, true, time);
        return;
      }
      if (b.staggerTimer > 0) {
        b.staggerTimer -= delta;
      }

      const toP = pPos.clone().sub(b.pos);
      const dist = toP.length();
      let isMoving = false;

      if (dist < 44 && b.staggerTimer <= 0) {
        b.mesh.rotation.y = Math.atan2(toP.x, toP.z);
        b.specialCd = Math.max(0, (b.specialCd || 0) - delta);

        // Sniper laser aim countdown before high-velocity shot
        if (b.aimTimer > 0) {
          b.aimTimer -= delta;
          b.mesh.userData.windupType = 'cast';
          if (b.aimTimer <= 0) {
            b.mesh.userData.windupType = null;
            const origin = b.pos.clone().add(new THREE.Vector3(0, 1.55, 0));
            const pDir = pPos.clone().add(new THREE.Vector3(0, 1.25, 0)).sub(origin).normalize();
            const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.6, 5), CustomShaders.createBeamShaderMaterial(0xffffff, 0xef4444));
            bolt.rotation.x = Math.PI / 2;
            bolt.position.copy(origin);
            bolt.lookAt(origin.clone().add(pDir));
            this.scene.add(bolt);
            this.projectiles.push({ mesh: bolt, pos: origin, vel: pDir.multiplyScalar(52), dmg: 42, color: '#ef4444', isPlayer: false, radius: 1.0, life: 2.0 });
          }
          CharacterBuilder.animateCharacter(b.mesh, delta, false, true, time);
          return;
        }
        b.mesh.userData.windupType = null;

        const stopDist = b.variant === 'sniper' ? 24 : b.variant === 'arcane' ? 14 : b.variant === 'bruiser' ? 4.0 : 3.2;
        if (dist > stopDist) {
          const dir = toP.clone().setY(0).normalize();
          if (dist > 6.5 && b.flankAngle) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), b.flankAngle * 0.45);
          const spd = b.variant === 'vanguard' ? 9.8 : b.variant === 'bruiser' ? 7.2 : b.variant === 'sniper' ? 6.0 : 7.0;
          const res = this.world.resolveMovement(b.pos.x, b.pos.z, b.pos.x + dir.x * spd * delta, b.pos.z + dir.z * spd * delta, 0.95, b.pos.y, true);
          b.pos.x = res.x;
          b.pos.z = res.z;
          b.pos.y = this.world.getGroundHeight(b.pos.x, b.pos.z);
          isMoving = true;

          // Vanguard rocket lunge gap-closer
          if (b.variant === 'vanguard' && b.specialCd <= 0 && dist > 7 && dist < 17) {
            b.specialCd = 5.0;
            const lungeDir = toP.clone().setY(0).normalize();
            b.vel.addScaledVector(lungeDir, 24);
            b.mesh.userData.attackTimer = 1.0;
            this.spawnShockwave(b.pos, 0x10b981, 4.2, 0.25);
          }
        } else {
          // Arcane tactical blink back if player rushes inside 4.5m
          if (b.variant === 'arcane' && dist < 4.5 && b.specialCd <= 0) {
            b.specialCd = 5.5;
            const away = toP.clone().setY(0).normalize().multiplyScalar(-9.5);
            const res = this.world.resolveMovement(b.pos.x, b.pos.z, b.pos.x + away.x, b.pos.z + away.z, 0.95);
            this.spawnShockwave(b.pos, 0xa855f7, 4.8, 0.3);
            b.pos.set(res.x, this.world.getGroundHeight(res.x, res.z), res.z);
          }

          b.attackCooldown -= delta;
          if (b.attackCooldown <= 0) {
            b.attackCooldown = b.variant === 'sniper' ? 2.6 : b.variant === 'arcane' ? 2.1 : b.variant === 'bruiser' ? 2.0 : 1.35;
            b.mesh.userData.attackTimer = 1.0;
            if (b.variant === 'arcane') {
              const origin = b.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
              const baseDir = pPos.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(origin).normalize();
              const angles = b.specialCd <= 0 ? [-0.22, 0, 0.22] : [0];
              if (b.specialCd <= 0) b.specialCd = 4.2;
              angles.forEach(ang => {
                const pDir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
                const bolt = new THREE.Mesh(
                  new THREE.OctahedronGeometry(0.32, 0),
                  CustomShaders.createBeamShaderMaterial(0xffffff, 0xa855f7)
                );
                bolt.position.copy(origin);
                this.scene.add(bolt);
                this.projectiles.push({
                  mesh: bolt, pos: origin.clone(), vel: pDir.multiplyScalar(26),
                  dmg: 28, color: '#a855f7', isPlayer: false, radius: 1.0, life: 2.5
                });
              });
            } else if (b.variant === 'sniper') {
              b.aimTimer = 0.72;
              const origin = b.pos.clone().add(new THREE.Vector3(0, 1.55, 0));
              if (this.vfx) {
                this.vfx.spawnVolumetricBeam(origin, pPos.clone().add(new THREE.Vector3(0, 1.2, 0)), { color: 0xef4444, coreColor: 0xfca5a5, width: 0.08, duration: 0.65 });
              }
            } else if (b.variant === 'bruiser') {
              if (b.specialCd <= 0) {
                b.specialCd = 5.2;
                if (this.vfx) this.vfx.spawnGroundDangerZone(b.pos.clone(), 8.5, 0.9, 0xf97316, 'ring_jump');
                this.spawnShockwave(b.pos, 0xf97316, 8.5, 0.4);
                if (dist < 6.5 && this.playerState.invulnTimer <= 0) this.damagePlayer(36);
              } else {
                this.damagePlayer(32);
              }
            } else {
              this.damagePlayer(26);
            }
          }
        }
      }

      if (b.vel.lengthSq() > 0.05) {
        const res = this.world.resolveMovement(b.pos.x, b.pos.z, b.pos.x + b.vel.x * delta, b.pos.z + b.vel.z * delta, 0.95);
        b.pos.x = res.x;
        b.pos.z = res.z;
        b.pos.y = this.world.getGroundHeight(b.pos.x, b.pos.z);
        b.vel.multiplyScalar(Math.exp(-8 * delta));
      }

      b.mesh.position.copy(b.pos);
      if (dSq < 88 * 88) CharacterBuilder.animateCharacter(b.mesh, delta, isMoving, true, time);
    });
  }

  updateWorldFXAndProjectiles(delta, time) {
    // 1. Projectiles (Player Mandalas + Enemy Spears/Bolts — shield reflects enemy bolts!)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= delta;
      pr.pos.addScaledVector(pr.vel, delta);
      pr.mesh.position.copy(pr.pos);
      if (pr.isPlayer) pr.mesh.rotation.z += delta * 12;

      let remove = pr.life <= 0;
      const prGround = this.world ? this.world.getGroundHeight(pr.pos.x, pr.pos.z) : 0;
      if (!remove && this.world && (pr.pos.y <= prGround + 0.05 || this.world.isPositionBlocked(pr.pos.x, pr.pos.z, Math.max(0.25, pr.radius * 0.6), pr.pos.y))) {
        this.spawnSparks(pr.pos, pr.color || 0xfde047, 5);
        remove = true;
      }
      if (!remove && pr.isPlayer) {
        if (this.doomBoss.hp > 0 && pr.pos.distanceTo(this.doomBoss.pos.clone().add(new THREE.Vector3(0, 1.8, 0))) < pr.radius + 1.8) {
          this.applyTargetHit({ pos: this.doomBoss.pos, isBoss: true, ref: this.doomBoss }, pr.dmg, pr.color, pr.isHeavy);
          remove = true;
        }
        if (!remove && this.miniBosses) {
          for (let j = 0; j < this.miniBosses.length; j++) {
            const mb = this.miniBosses[j];
            if (mb.alive && pr.pos.distanceTo(mb.pos.clone().add(new THREE.Vector3(0, 2.0, 0))) < pr.radius + 2.2) {
              this.applyTargetHit({ pos: mb.pos, isBoss: false, ref: mb }, pr.dmg, pr.color, pr.isHeavy);
              remove = true;
              break;
            }
          }
        }
        if (!remove && this.world && this.world.energyTowers) {
          for (let j = 0; j < this.world.energyTowers.length; j++) {
            const tw = this.world.energyTowers[j];
            if (!tw.destroyed && pr.pos.distanceTo(tw.pos.clone().add(new THREE.Vector3(0, 4.5, 0))) < pr.radius + 2.5) {
              this.applyTargetHit({ pos: tw.pos, isBoss: false, ref: tw }, pr.dmg, pr.color, pr.isHeavy);
              remove = true;
              break;
            }
          }
        }
        if (!remove) {
          for (let j = 0; j < this.doombots.length; j++) {
            const b = this.doombots[j];
            if (!b.dead && pr.pos.distanceTo(b.pos.clone().add(new THREE.Vector3(0, 1.2, 0))) < pr.radius + 1.0) {
              this.applyTargetHit({ pos: b.pos, isBoss: false, ref: b }, pr.dmg, pr.color, pr.isHeavy);
              remove = true;
              break;
            }
          }
        }
      } else if (!remove && !pr.isPlayer) {
        if (pr.pos.distanceTo(this.playerState.pos.clone().add(new THREE.Vector3(0, 1.3, 0))) < pr.radius + 0.9) {
          if (this.playerState.shieldActive) {
            // Seraphim Shield reflects enemy projectile back!
            pr.isPlayer = true;
            pr.vel.multiplyScalar(-1.5);
            pr.dmg *= 3;
            pr.life = 2.0;
            this.spawnSparks(pr.pos, 0xf59e0b, 8);
          } else {
            this.damagePlayer(pr.dmg);
            remove = true;
          }
        }
      }

      if (remove) {
        this.scene.remove(pr.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 2. Slash Arcs
    for (let i = this.slashArcs.length - 1; i >= 0; i--) {
      const s = this.slashArcs[i];
      s.life -= delta;
      const progress = 1.0 - Math.max(0, s.life / s.maxLife);
      s.mat.uniforms.uProgress.value = progress;
      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        this.slashArcs.splice(i, 1);
      }
    }

    // 3. Shockwaves & Fading Beams
    for (let i = this.vfxEffects.length - 1; i >= 0; i--) {
      const fx = this.vfxEffects[i];
      fx.life -= delta;
      const t = 1.0 - Math.max(0, fx.life / fx.maxLife);
      if (fx.type === 'shockwave') {
        const s = 0.8 + t * fx.targetRadius;
        fx.mesh.scale.set(s, s, 1);
        fx.mat.uniforms.uProgress.value = t;
      } else if (fx.mat && fx.mat.uniforms && fx.mat.uniforms.uAlpha) {
        fx.mat.uniforms.uAlpha.value = 1.0 - t;
      } else if (fx.mat) {
        fx.mat.opacity = 1.0 - t;
      }
      if (fx.life <= 0) {
        this.scene.remove(fx.mesh);
        this.vfxEffects.splice(i, 1);
      }
    }

    // 4. Physical Bouncing Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life -= delta;
      sp.vel.y -= 28 * delta;
      sp.mesh.position.addScaledVector(sp.vel, delta);
      const gy = this.world.getGroundHeight(sp.mesh.position.x, sp.mesh.position.z);
      if (sp.mesh.position.y < gy + 0.1) {
        sp.mesh.position.y = gy + 0.1;
        sp.vel.y *= -0.45;
      }
      sp.mat.opacity = Math.max(0, sp.life / sp.maxLife);
      if (sp.life <= 0) {
        this.scene.remove(sp.mesh);
        this.sparks.splice(i, 1);
      }
    }

    // 5. Boss Meteor Telegraphs
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const tel = this.telegraphs[i];
      tel.timer -= delta;
      const p = 1.0 - Math.max(0, tel.timer / tel.maxTimer);
      tel.mat.uniforms.uProgress.value = p * 0.6;
      if (tel.timer <= 0) {
        this.spawnShockwave(tel.pos, 0x34d399, tel.radius * 1.4, 0.45);
        this.spawnSparks(tel.pos, 0x6ee7b7, 16);
        window.soundSystem.playExplosion();
        if (this.playerState.pos.distanceTo(tel.pos) < tel.radius) {
          this.damagePlayer(48);
        }
        this.scene.remove(tel.mesh);
        this.telegraphs.splice(i, 1);
      }
    }

    // 6. Heal Orbs
    for (let i = this.healOrbs.length - 1; i >= 0; i--) {
      const o = this.healOrbs[i];
      o.life -= delta;
      o.mesh.rotation.y = time * 3;
      o.mesh.position.y = this.world.getGroundHeight(o.pos.x, o.pos.z) + 0.9 + Math.sin(time * 4) * 0.2;
      if (o.pos.distanceTo(this.playerState.pos) < 2.6) {
        this.playerState.hp = Math.min(this.playerState.maxHp, this.playerState.hp + 90);
        this.spawnDamageNumber(o.pos, '+90', '#34d399', true);
        window.soundSystem.playHealFlask();
        this.scene.remove(o.mesh);
        this.healOrbs.splice(i, 1);
      } else if (o.life <= 0) {
        this.scene.remove(o.mesh);
        this.healOrbs.splice(i, 1);
      }
    }

    // Combo Decay
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        document.getElementById('combo-display').classList.add('hidden');
      }
    }

    // Target Lock Reticle Screen Projection
    const lockEl = document.getElementById('target-lock-reticle');
    this.lockedTarget = this.findBestTarget(28);
    if (this.lockedTarget && !this.isGameOver) {
      const tp = this.lockedTarget.pos.clone().add(new THREE.Vector3(0, 1.5, 0)).project(this.camera);
      if (tp.z < 1) {
        lockEl.classList.remove('hidden');
        lockEl.style.left = `${(tp.x * 0.5 + 0.5) * window.innerWidth}px`;
        lockEl.style.top = `${(-tp.y * 0.5 + 0.5) * window.innerHeight}px`;
      } else {
        lockEl.classList.add('hidden');
      }
    } else {
      lockEl.classList.add('hidden');
    }
  }

  // ==========================================================================
  // HUD & RADAR UPDATE
  // ==========================================================================
  updateHUD() {
    const ps = this.playerState;
    const hpPct = (ps.hp / ps.maxHp) * 100;
    const trailPct = (ps.trailingHp / ps.maxHp) * 100;

    document.getElementById('hud-hp-fill').style.width = `${hpPct}%`;
    document.getElementById('hud-hp-trail').style.width = `${trailPct}%`;
    document.getElementById('hud-hp-text').textContent = `${Math.ceil(ps.hp)} / ${ps.maxHp}`;
    document.getElementById('hud-stamina-fill').style.width = `${ps.stamina}%`;
    document.getElementById('hud-flask-count').textContent = ps.healFlasks;

    // Cooldown Radial Overlays
    const setCD = (id, cd, maxCd) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (cd > 0.05) {
        el.textContent = cd.toFixed(1);
        el.classList.add('active');
      } else {
        el.textContent = '';
        el.classList.remove('active');
      }
    };
    setCD('cd-m2', ps.uniqueCooldown, 7.0);
    setCD('cd-q', ps.skillCooldown, 5.5);
    setCD('cd-shift', ps.dashCooldown, 0.72);

    const ultRing = document.getElementById('ult-ring-progress');
    const ultPct = Math.floor(ps.ultCharge);
    document.getElementById('hud-ult-pct').textContent = `${ultPct}%`;
    if (ultRing) {
      const circ = 138.2;
      ultRing.style.strokeDashoffset = `${circ - (circ * ultPct) / 100}`;
    }
    document.getElementById('slot-r').classList.toggle('ready', ultPct >= 100);

    // Boss Bar & Elden Ring Posture Bar
    const boss = this.doomBoss;
    const bossBar = document.getElementById('boss-bar-wrap');
    const missionPill = document.getElementById('mission-pill');
    if (boss.active && boss.hp > 0) {
      bossBar.classList.remove('hidden');
      missionPill.classList.add('hidden');
      document.getElementById('boss-hp-fill').style.width = `${(boss.hp / boss.maxHp) * 100}%`;
      document.getElementById('boss-hp-trail').style.width = `${(boss.trailingHp / boss.maxHp) * 100}%`;
      document.getElementById('boss-posture-fill').style.width = `${(boss.posture / boss.maxPosture) * 100}%`;
      document.getElementById('boss-phase-tag').textContent = boss.phase === 2 ? 'FASE 2 // DEUS IMPERADOR' : 'FASE 1 // SOBERANO';
    } else {
      bossBar.classList.add('hidden');
      missionPill.classList.remove('hidden');
      const aliveBots = this.doombots.filter((b) => !b.dead).length;
      const distBoss = Math.round(ps.pos.distanceTo(boss.pos));
      document.getElementById('mission-text').textContent = `ATRAVESSE LATVÉRIA // DOOMBOTS: ${aliveBots} // TRONO: ${distBoss}M`;
    }

    this.drawMinimap();
  }

  drawMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w * 0.5;
    const cy = h * 0.5;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = 'rgba(10, 14, 24, 0.85)';
    ctx.fillRect(0, 0, w, h);

    const scale = 1.45;
    const toMap = (wx, wz) => {
      const dx = wx - this.playerState.pos.x;
      const dz = wz - this.playerState.pos.z;
      const cos = Math.cos(-this.camYaw);
      const sin = Math.sin(-this.camYaw);
      return {
        x: cx + (dx * cos - dz * sin) * scale,
        y: cy + (dx * sin + dz * cos) * scale
      };
    };

    // Doombots
    this.doombots.forEach((b) => {
      if (b.dead) return;
      const m = toMap(b.pos.x, b.pos.z);
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(m.x, m.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Boss Marker
    if (this.doomBoss.hp > 0) {
      const bm = toMap(this.doomBoss.pos.x, this.doomBoss.pos.z);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(bm.x, bm.y, 5.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player Arrow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 4.5, cy + 5);
    ctx.lineTo(cx - 4.5, cy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ==========================================================================
  // MAIN RENDER LOOP & DYNAMIC SHADER UNIFORM SYNC
  // ==========================================================================
  animate() {
    requestAnimationFrame(() => this.animate());

    const rawDelta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= rawDelta;
      if (this.slowMoTimer <= 0) this.timeScale = 1.0;
    }
    this.chromaPulse = Math.max(0, this.chromaPulse - rawDelta * 2.2);

    let simDelta = rawDelta * this.timeScale;
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= rawDelta;
      simDelta = 0.0001;
    }

    const inCutscene = window.CutsceneDirector && window.CutsceneDirector.isPlaying;
    if (this.vfx) {
      this.vfx.update(simDelta, this.playerState, (ring) => {
        if (this.onVfxJumpRingHit) this.onVfxJumpRingHit(ring);
      });
    }
    if (inCutscene) {
      window.CutsceneDirector.update(rawDelta, elapsed, this);
      if (this.doomBoss && this.doomBoss.mesh && this.doomBoss.mesh.userData.bossIntroTimer > 0) {
        CharacterBuilder.animateCharacter(this.doomBoss.mesh, rawDelta, false, true, elapsed);
        this.updateClothForCharacter(this.doomBoss.mesh, rawDelta, elapsed);
      }
      if (this.miniBosses) {
        this.miniBosses.forEach(mb => {
          if (mb.alive && mb.mesh && mb.mesh.userData.bossIntroTimer > 0) {
            CharacterBuilder.animateCharacter(mb.mesh, rawDelta, false, true, elapsed);
            this.updateClothForCharacter(mb.mesh, rawDelta, elapsed);
          }
        });
      }
      this.world.update(rawDelta, elapsed);
    } else if (this.isPlaying && !this.isPaused && !this.isGameOver && !this.worldMapOpen) {
      this.updatePlayer(simDelta, elapsed);
      this.updateBoss(simDelta, elapsed);
      this.updateDoombots(simDelta, elapsed);
      this.updateWorldFXAndProjectiles(simDelta, elapsed);
      this.world.update(simDelta, elapsed);
      this.updateHUD();
    } else if (!this.isPlaying) {
      this.indoorMix = THREE.MathUtils.lerp(this.indoorMix, 0.0, 0.08);
      if (this.showcaseHero) {
        this.showcaseHero.rotation.y = this.showcaseRotY + Math.sin(elapsed * 0.55) * 0.08;
        CharacterBuilder.animateCharacter(this.showcaseHero, rawDelta, false, true, elapsed);
        this.updateClothForCharacter(this.showcaseHero, rawDelta, elapsed);
      }
      // Asymmetric framing: camera slightly right so hero stands bold & unobstructed beside right Kit panel
      this.camera.position.set(0.88, 1.45, 281.6);
      this.camera.lookAt(0.55, 1.15, 277.6);
      this.world.update(rawDelta, elapsed);
    }

    // Sync Dynamic Colored Point Lights & Player-Centered Shadow Frustum
    const dynLights = [];
    const heroCol = new THREE.Color(HEROES_DATA[this.selectedHeroId].colorHex);
    const activeHeroPos = this.isPlaying ? this.playerState.pos : new THREE.Vector3(0, 0, 278);
    if (this.world && this.world.sunLight) {
      const sx = Math.round(activeHeroPos.x / 2) * 2;
      const sz = Math.round(activeHeroPos.z / 2) * 2;
      this.world.sunLight.target.position.set(sx, activeHeroPos.y, sz);
      this.world.sunLight.position.set(sx - 95, activeHeroPos.y + 135, sz + 80);
    }
    dynLights.push({
      pos: activeHeroPos.clone().add(new THREE.Vector3(0, 2.0, 0)),
      r: heroCol.r, g: heroCol.g, b: heroCol.b,
      range: this.isPlaying ? 12.0 : 9.0
    });
    dynLights.push({
      pos: this.doomBoss.pos.clone().add(new THREE.Vector3(0, 2.8, 0)),
      r: 0.15, g: 0.95, b: 0.58,
      range: 18.0
    });
    // Closest world brazier / streetlamp
    if (this.world.brazierLights.length > 0) {
      let bestL = this.world.brazierLights[0];
      let bestD = Infinity;
      for (let i = 0; i < this.world.brazierLights.length; i++) {
        const d = this.world.brazierLights[i].pos.distanceToSquared(activeHeroPos);
        if (d < bestD) { bestD = d; bestL = this.world.brazierLights[i]; }
      }
      dynLights.push(bestL);
    }

    CustomShaders.updateFrameUniforms(elapsed, this.indoorMix, dynLights);
    if (this.colorGradePass) {
      this.colorGradePass.uniforms.uChromaPulse.value = this.chromaPulse;
      this.colorGradePass.uniforms.uSlowMoMix.value = this.slowMoTimer > 0 ? 1.0 : 0.0;
    }

    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new DoomsdayGame();
});

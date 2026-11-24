// AAA Combat Mechanics, Hero-Specific Physical Powers, Clean Renderer & Third-Person Camera
class DoomsdayGame {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.selectedHeroId = 'reed_richards';
    this.selectedHero = HEROES_DATA[this.selectedHeroId];
    this.isGameRunning = false;
    this.isBossActive = false;

    // Player Combat State
    this.playerHealth = 580;
    this.playerMaxHealth = 580;
    this.playerEnergy = 100;
    this.playerUlt = 0;
    this.skillCooldown = 0;
    this.dashCooldown = 0;
    this.isShieldActive = false;
    this.comboCount = 0;
    this.comboTimer = 0;

    // Over-The-Shoulder Camera (Spaced back, smooth, zero clipping)
    this.camDist = 11.8;
    this.camHeight = 3.1;
    this.camShoulder = 1.6;
    this.camAngles = { pitch: 0.16, yaw: 0 };
    this.currentCamPos = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
    this.screenShake = 0;

    // Boss State
    this.bossMaxHealth = 2600;
    this.bossHealth = 2600;
    this.bossPhase = 1;
    this.bossAttackTimer = 0;

    // Dynamic Entities & Hero-Specific Effects
    this.projectiles = [];
    this.particles = [];
    this.activeLines = [];
    this.activeBoomerangs = [];
    this.doombots = [];
    this.boss = null;
    this.bossShield = null;
    this.showcaseGroup = null;
    this.showcaseHeroMesh = null;

    this.keys = {};
    this.mouse = { isDown: false, rightDown: false };
    this.playerVelocity = new THREE.Vector3();
    this.isGrounded = true;

    this.clock = new THREE.Clock();
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.initThree();
    this.initShowcaseStage();
    this.initUI();
    this.setupEvents();
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Crisp Direct Renderer (No Blinding UnrealBloom Washout)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.96;
    this.container.appendChild(this.renderer.domElement);

    this.world = new LatveriaWorld(this.scene);
    this.initDoctorDoom();
    this.spawnDoombots();
  }

  initShowcaseStage() {
    this.showcaseGroup = new THREE.Group();
    this.showcaseGroup.position.set(0, 12, 75);

    const baseGeo = new THREE.CylinderGeometry(2.0, 2.3, 0.3, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.25
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.15;
    this.showcaseGroup.add(baseMesh);

    const runeMat = CustomShaders.createMysticRuneMaterial(0x10b981);
    const runePlane = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), runeMat);
    runePlane.rotation.x = -Math.PI / 2;
    runePlane.position.y = 0.02;
    this.showcaseGroup.add(runePlane);
    this.showcaseRuneMat = runeMat;

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(3, 6, 5);
    this.showcaseGroup.add(keyLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 1.1, 14);
    fillLight.position.set(-3, 3, 2);
    this.showcaseGroup.add(fillLight);

    this.scene.add(this.showcaseGroup);
    this.updateShowcaseHero(this.selectedHeroId);
  }

  updateShowcaseHero(heroId) {
    if (this.showcaseHeroMesh) {
      this.showcaseGroup.remove(this.showcaseHeroMesh);
    }
    this.showcaseHeroMesh = CharacterBuilder.buildHeroMesh(heroId);
    this.showcaseGroup.add(this.showcaseHeroMesh);

    const hero = HEROES_DATA[heroId];
    if (this.showcaseRuneMat) {
      this.showcaseRuneMat.uniforms.uColor.value.set(hero.color);
    }
  }

  initDoctorDoom() {
    if (this.bossGroup) this.scene.remove(this.bossGroup);
    this.bossGroup = CharacterBuilder.buildDoctorDoomMesh();
    this.bossGroup.position.set(0, 32.5, -148);
    this.scene.add(this.bossGroup);
    this.boss = this.bossGroup;

    if (this.bossShield) this.scene.remove(this.bossShield);
    const shieldGeo = new THREE.SphereGeometry(3.4, 24, 24);
    const shieldMat = CustomShaders.createShieldMaterial(0x10b981);
    this.bossShield = new THREE.Mesh(shieldGeo, shieldMat);
    this.bossShield.position.set(0, 34.5, -148);
    this.bossShield.visible = false;
    this.scene.add(this.bossShield);
  }

  spawnDoombots() {
    this.doombots.forEach(b => this.scene.remove(b.mesh));
    this.doombots = [];

    const coords = [
      { x: -6.5, z: 24 },
      { x: 6.5, z: 8 },
      { x: -7.5, z: -14 },
      { x: 7.5, z: -34 },
      { x: -6.0, z: -55 },
      { x: -5.5, z: -82 },
      { x: 5.5, z: -94 }
    ];

    coords.forEach(pos => {
      const groundY = this.world.getGroundHeight(pos.x, pos.z);
      const mesh = CharacterBuilder.buildDoombotMesh();
      mesh.position.set(pos.x, groundY, pos.z);
      this.scene.add(mesh);
      this.doombots.push({
        mesh,
        health: 150,
        maxHealth: 150,
        cooldown: 1.2 + Math.random() * 1.5,
        baseY: groundY,
        webbedTimer: 0
      });
    });
  }

  initPlayer() {
    if (this.playerMesh) this.scene.remove(this.playerMesh);

    this.selectedHero = HEROES_DATA[this.selectedHeroId];
    this.playerMaxHealth = this.selectedHero.health;
    this.playerHealth = this.playerMaxHealth;
    this.playerEnergy = 100;
    this.playerUlt = 0;

    this.playerMesh = CharacterBuilder.buildHeroMesh(this.selectedHeroId);
    this.playerMesh.position.set(0, 0, 52);
    this.scene.add(this.playerMesh);

    if (this.playerShieldMesh) this.scene.remove(this.playerShieldMesh);
    const pShieldGeo = new THREE.SphereGeometry(2.2, 24, 24);
    const pShieldMat = CustomShaders.createShieldMaterial(this.selectedHero.color);
    this.playerShieldMesh = new THREE.Mesh(pShieldGeo, pShieldMat);
    this.playerShieldMesh.visible = false;
    this.scene.add(this.playerShieldMesh);

    document.getElementById('hud-avatar').innerText = this.selectedHero.avatarEmoji;
    document.getElementById('hud-hero-name').innerText = this.selectedHero.name.toUpperCase();
    document.getElementById('slot-m1-label').innerText = this.selectedHero.primaryName.split(' ')[0];
    document.getElementById('slot-q-label').innerText = this.selectedHero.skillName.split(' ')[0];
    document.getElementById('slot-r-label').innerText = this.selectedHero.ultName.split(' ')[0];

    this.camAngles.yaw = 0;
    this.camAngles.pitch = 0.16;
    this.currentCamPos.set(0, 6, 64);
    this.updateHUD();
  }

  initUI() {
    const rosterList = document.getElementById('hero-roster-list');
    rosterList.innerHTML = '';

    Object.values(HEROES_DATA).forEach(hero => {
      const item = document.createElement('div');
      item.className = `hero-roster-item ${hero.id === this.selectedHeroId ? 'selected' : ''}`;
      item.style.setProperty('--hero-color', hero.color);

      item.innerHTML = `
        <div class="roster-portrait" style="background-image: ${hero.portraitBg}; background-position: ${hero.portraitPos}; border-color: ${hero.color}"></div>
        <div class="roster-info">
          <div class="roster-name">${hero.name}</div>
          <div class="roster-title">${hero.actor}</div>
        </div>
        <div class="roster-class-tag">${hero.classTag}</div>
      `;

      item.addEventListener('mouseenter', () => window.soundSystem.playUIHover());
      item.addEventListener('click', () => {
        window.soundSystem.playUISelect();
        document.querySelectorAll('.hero-roster-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        this.selectedHeroId = hero.id;
        this.selectedHero = hero;
        this.updateShowcaseHero(hero.id);
        this.updateMenuInspector(hero);
      });

      rosterList.appendChild(item);
    });

    this.updateMenuInspector(this.selectedHero);

    // Mute Audio Button
    const muteBtn = document.getElementById('mute-toggle-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const muted = window.soundSystem.toggleMute();
        muteBtn.innerText = muted ? '🔇 ÁUDIO: MUDO (M)' : '🔊 ÁUDIO: ATIVO (M)';
      });
    }

    document.getElementById('start-game-btn').addEventListener('click', () => {
      window.soundSystem.init();
      window.soundSystem.playUISelect();
      this.startGame();
    });

    document.getElementById('modal-restart-btn').addEventListener('click', () => {
      document.getElementById('end-game-modal').classList.remove('active');
      document.getElementById('main-menu').classList.remove('hidden');
      document.getElementById('hud').classList.add('hidden');
      this.showcaseGroup.visible = true;
      this.isGameRunning = false;
      this.isBossActive = false;
      window.soundSystem.setBossMode(false);
    });
  }

  updateMenuInspector(hero) {
    document.getElementById('showcase-hero-name').innerText = hero.name;
    document.getElementById('showcase-hero-epithet').innerText = `${hero.actor} • ${hero.role}`;

    document.getElementById('stat-atk-val').innerText = `${hero.stats.atk} / 100`;
    document.getElementById('stat-atk-bar').style.width = `${hero.stats.atk}%`;
    document.getElementById('stat-def-val').innerText = `${hero.stats.def} / 100`;
    document.getElementById('stat-def-bar').style.width = `${hero.stats.def}%`;
    document.getElementById('stat-spd-val').innerText = `${hero.stats.spd} / 100`;
    document.getElementById('stat-spd-bar').style.width = `${hero.stats.spd}%`;

    document.getElementById('ab-m1-title').innerText = hero.primaryName;
    document.getElementById('ab-m1-desc').innerText = hero.primaryDesc;
    document.getElementById('ab-q-title').innerText = hero.skillName;
    document.getElementById('ab-q-desc').innerText = hero.skillDesc;
    document.getElementById('ab-r-title').innerText = hero.ultName;
    document.getElementById('ab-r-desc').innerText = hero.ultDesc;
  }

  startGame() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    this.showcaseGroup.visible = false;

    this.initDoctorDoom();
    this.spawnDoombots();
    this.initPlayer();

    this.isGameRunning = true;
    this.isBossActive = false;
    this.bossHealth = this.bossMaxHealth;
    this.bossPhase = 1;

    document.getElementById('boss-health-card').classList.add('hidden');
    document.getElementById('obj-step').innerText = 'Atravesse a Avenida Imperial de Latveria até o Castelo de Doom';
    this.showBanner('INCURSÃO EM LATVERIA', 'Avance pela cidade e derrote Victor Von Doom');

    if (document.pointerLockElement !== this.container) {
      this.container.requestPointerLock();
    }
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyM') {
        const muted = window.soundSystem.toggleMute();
        const muteBtn = document.getElementById('mute-toggle-btn');
        if (muteBtn) muteBtn.innerText = muted ? '🔇 ÁUDIO: MUDO (M)' : '🔊 ÁUDIO: ATIVO (M)';
      }

      if (!this.isGameRunning) return;
      if (e.code === 'KeyQ') this.triggerSpecialSkill();
      if (e.code === 'KeyR') this.triggerUltimate();
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.triggerDash();
      if (e.code === 'Space' && this.isGrounded) {
        this.playerVelocity.y = 14.5;
        this.isGrounded = false;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (!this.isGameRunning) return;
      if (e.button === 0) {
        this.mouse.isDown = true;
        this.triggerPrimaryAttack();
      } else if (e.button === 2) {
        this.mouse.rightDown = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    window.addEventListener('wheel', (e) => {
      if (!this.isGameRunning) return;
      this.camDist = Math.max(7.0, Math.min(20.0, this.camDist + e.deltaY * 0.008));
    });

    window.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('mousemove', (e) => {
      if (!this.isGameRunning) return;
      if (document.pointerLockElement === this.container || this.mouse.rightDown) {
        const sensitivity = 0.0026;
        this.camAngles.yaw -= e.movementX * sensitivity;
        this.camAngles.pitch = Math.max(-0.25, Math.min(0.72, this.camAngles.pitch + e.movementY * sensitivity));
      }
    });

    this.container.addEventListener('click', () => {
      if (this.isGameRunning && document.pointerLockElement !== this.container) {
        this.container.requestPointerLock();
      }
    });
  }

  // Finds Nearest Enemy Target in Aim Cone or Aim Point
  findBestTarget(maxRange = 36) {
    const origin = this.playerMesh.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    let bestTarget = null;
    let bestScore = Infinity;

    this.doombots.forEach(bot => {
      if (bot.health <= 0) return;
      const tPos = bot.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
      const dist = origin.distanceTo(tPos);
      if (dist <= maxRange) {
        const toTarget = tPos.clone().sub(origin).normalize();
        const angle = camDir.angleTo(toTarget);
        if (angle < 0.55 && dist * (0.5 + angle) < bestScore) {
          bestScore = dist * (0.5 + angle);
          bestTarget = { type: 'bot', entity: bot, pos: tPos };
        }
      }
    });

    if (this.boss) {
      const bPos = this.boss.position.clone().add(new THREE.Vector3(0, 2.2, 0));
      const dist = origin.distanceTo(bPos);
      if (dist <= maxRange + 8) {
        const toBoss = bPos.clone().sub(origin).normalize();
        const angle = camDir.angleTo(toBoss);
        if (angle < 0.65 && dist * (0.4 + angle) < bestScore) {
          bestTarget = { type: 'boss', entity: this.boss, pos: bPos };
        }
      }
    }

    if (!bestTarget) {
      const fallbackPos = origin.clone().add(camDir.multiplyScalar(maxRange * 0.75));
      return { type: 'point', entity: null, pos: fallbackPos };
    }
    return bestTarget;
  }

  // Creates a 3D Tether / Web Line / Elastic Arm / Whip between Two Points
  createPhysicalTether(startPos, endPos, colorHex, thickness = 0.08, duration = 0.28, addFist = false) {
    const dist = startPos.distanceTo(endPos);
    const mid = startPos.clone().add(endPos).multiplyScalar(0.5);

    const group = new THREE.Group();
    const cylGeo = new THREE.CylinderGeometry(thickness, thickness, dist, 10);
    cylGeo.rotateX(Math.PI / 2);
    const cylMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.35,
      metalness: 0.2
    });
    const cyl = new THREE.Mesh(cylGeo, cylMat);
    cyl.position.copy(mid);
    cyl.lookAt(endPos);
    group.add(cyl);

    if (addFist) {
      // Oversized Stretching Fist for Mr. Fantastic
      const fist = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.65, 0.75),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
      );
      fist.position.copy(endPos);
      fist.lookAt(startPos);
      group.add(fist);
    }

    this.scene.add(group);
    this.activeLines.push({ mesh: group, life: duration });
  }

  // Creates a Jagged Branched Lightning Bolt between Two Points
  createJaggedLightning(startPos, endPos, colorHex = 0x38bdf8, duration = 0.22) {
    const points = [];
    const segments = 10;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pt = new THREE.Vector3().lerpVectors(startPos, endPos, t);
      if (i > 0 && i < segments) {
        pt.x += (Math.random() - 0.5) * 1.4;
        pt.y += (Math.random() - 0.5) * 1.4;
        pt.z += (Math.random() - 0.5) * 1.4;
      }
      points.push(pt);
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 3 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.activeLines.push({ mesh: line, life: duration });
  }

  triggerDash() {
    if (this.dashCooldown > 0) return;
    this.dashCooldown = 1.4;
    window.soundSystem.playAttack('claw');

    const forward = new THREE.Vector3(-Math.sin(this.camAngles.yaw), 0, -Math.cos(this.camAngles.yaw)).normalize();
    this.playerMesh.position.addScaledVector(forward, 6.8);
    this.spawnSparks(this.playerMesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)), this.selectedHero.color);
  }

  // UNIQUE HERO PRIMARY ATTACKS (ZERO GENERIC LASERS!)
  triggerPrimaryAttack() {
    if (this.playerEnergy < 8) return;
    this.playerEnergy -= 8;
    window.soundSystem.playAttack(this.selectedHero.attackType);

    this.playerMesh.userData.attackAnim = 1.0;
    this.playerMesh.rotation.y = this.camAngles.yaw + Math.PI;

    const ring = document.getElementById('reticle-ring');
    if (ring) {
      ring.style.transform = 'scale(1.32)';
      setTimeout(() => (ring.style.transform = 'scale(1)'), 90);
    }

    const handOrigin = this.playerMesh.position.clone().add(new THREE.Vector3(0, 1.75, 0));
    const target = this.findBestTarget(34);
    const baseDmg = Math.round(48 + this.selectedHero.stats.atk * 0.42);

    if (this.selectedHeroId === 'spider_man') {
      // SPIDER-MAN: Fires a real white tensile web cable from wrist -> attaches to enemy & Zip-Kicks right into them!
      this.createPhysicalTether(handOrigin, target.pos, 0xf8fafc, 0.045, 0.26, false);

      if (target.type === 'bot' || target.type === 'boss') {
        // Wrap target in white web cocoon mesh
        const webCage = new THREE.Mesh(
          new THREE.SphereGeometry(target.type === 'boss' ? 1.8 : 1.1, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0xf8fafc, wireframe: true })
        );
        webCage.position.copy(target.pos);
        this.scene.add(webCage);
        this.activeLines.push({ mesh: webCage, life: 0.85 });

        // Acrobatic Zip-Kick towards enemy if within 24m
        const dist = handOrigin.distanceTo(target.pos);
        if (dist > 4.5 && dist < 24) {
          const pullDir = target.pos.clone().sub(this.playerMesh.position).normalize();
          this.playerMesh.position.addScaledVector(pullDir, Math.min(dist - 3.5, 9.5));
          this.playerVelocity.y = 6.5;
          this.isGrounded = false;
        }

        this.applyTargetHit(target, baseDmg, '#f8fafc');
      }

    } else if (this.selectedHeroId === 'reed_richards') {
      // MR. FANTASTIC (REED RICHARDS): Physical Elastic Arm Extension + Giant Fist Impact
      this.createPhysicalTether(handOrigin, target.pos, 0x0284c7, 0.16, 0.24, true);
      if (target.type === 'bot' || target.type === 'boss') {
        this.applyTargetHit(target, baseDmg + 12, '#38bdf8');
      }

    } else if (this.selectedHeroId === 'thor') {
      // THOR: Physically throws Mjolnir from his hand as a spinning 3D boomerang that returns!
      if (this.activeBoomerangs.length < 2) {
        const thrownHammer = CharacterBuilder.buildMjolnirMesh();
        thrownHammer.position.copy(handOrigin);
        this.scene.add(thrownHammer);

        if (this.playerMesh.userData.mjolnirMesh) {
          this.playerMesh.userData.mjolnirMesh.visible = false;
        }

        this.activeBoomerangs.push({
          mesh: thrownHammer,
          startPos: handOrigin.clone(),
          targetPos: target.pos.clone(),
          targetRef: target,
          progress: 0,
          returning: false,
          hasHit: false,
          damage: baseDmg + 22
        });
      }

    } else if (this.selectedHeroId === 'doctor_strange') {
      // DOCTOR STRANGE: Conjures a Golden Eldritch Whip + Sacred Geometry Mandala at target
      this.createJaggedLightning(handOrigin, target.pos, 0xf59e0b, 0.25);

      const mandala = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 2.6),
        CustomShaders.createMysticRuneMaterial(0xf59e0b)
      );
      mandala.position.copy(target.pos);
      mandala.lookAt(this.camera.position);
      this.scene.add(mandala);
      this.activeLines.push({ mesh: mandala, life: 0.35 });

      if (target.type === 'bot' || target.type === 'boss') {
        this.applyTargetHit(target, baseDmg + 8, '#f59e0b');
      }

    } else {
      // BLACK PANTHER: High-speed physical dash lunge + Dual Vibranium Claw Cross-Slash X
      const lungeDir = new THREE.Vector3(-Math.sin(this.camAngles.yaw), 0, -Math.cos(this.camAngles.yaw)).normalize();
      this.playerMesh.position.addScaledVector(lungeDir, 3.8);

      const slashCenter = this.playerMesh.position.clone().add(new THREE.Vector3(0, 1.6, 0)).add(lungeDir.clone().multiplyScalar(2.4));
      const slashGroup = new THREE.Group();
      [-0.6, 0.6].forEach(rotZ => {
        const clawArc = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 0.08, 0.12),
          new THREE.MeshBasicMaterial({ color: 0xa855f7 })
        );
        clawArc.rotation.z = rotZ;
        slashGroup.add(clawArc);
      });
      slashGroup.position.copy(slashCenter);
      slashGroup.lookAt(this.camera.position);
      this.scene.add(slashGroup);
      this.activeLines.push({ mesh: slashGroup, life: 0.22 });

      // Damage all enemies in melee slash range (9m)
      this.applyAoEDamage(slashCenter, 8.5, baseDmg + 18, '#a855f7');
    }

    this.playerUlt = Math.min(100, this.playerUlt + 8);
  }

  applyTargetHit(target, dmg, colorStr) {
    if (target.type === 'bot' && target.entity) {
      target.entity.health -= dmg;
      this.spawnDamageNumber(target.entity.mesh.position, dmg, colorStr);
      this.spawnSparks(target.pos, colorStr);
      this.registerCombo();
    } else if (target.type === 'boss') {
      this.damageBoss(dmg);
    }
  }

  // UNIQUE HERO SPECIAL ABILITIES (Q)
  triggerSpecialSkill() {
    if (this.skillCooldown > 0) return;
    this.skillCooldown = 5.0;
    window.soundSystem.playSpecial();
    this.playerMesh.userData.attackAnim = 1.0;
    const center = this.playerMesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));

    if (this.selectedHeroId === 'spider_man') {
      // Iron Spider 4 Golden Waldoes 360 Spin Stab
      this.playerVelocity.y = 8.5;
      this.isGrounded = false;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const endPt = center.clone().add(new THREE.Vector3(Math.cos(angle) * 9, 0.5, Math.sin(angle) * 9));
        this.createPhysicalTether(center, endPt, 0xf59e0b, 0.07, 0.3, false);
      }
      this.applyAoEDamage(center, 15, 145, '#f59e0b');

    } else if (this.selectedHeroId === 'reed_richards') {
      // Giant 360 Elastic Arm Sweep
      const sweepRing = new THREE.Mesh(
        new THREE.TorusGeometry(8.5, 0.32, 10, 32),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
      );
      sweepRing.rotation.x = Math.PI / 2;
      sweepRing.position.copy(center);
      this.scene.add(sweepRing);
      this.activeLines.push({ mesh: sweepRing, life: 0.35 });
      this.applyAoEDamage(center, 17, 150, '#38bdf8');

    } else if (this.selectedHeroId === 'thor') {
      // Asgardian Sky-to-Ground Branched Thunder Strike
      this.screenShake = 0.45;
      const skyTop = center.clone().add(new THREE.Vector3(0, 45, 0));
      this.createJaggedLightning(skyTop, center, 0x38bdf8, 0.45);
      this.createJaggedLightning(skyTop.clone().add(new THREE.Vector3(2, 0, -2)), center, 0xe0f2fe, 0.45);
      this.applyAoEDamage(center, 20, 165, '#38bdf8');

    } else if (this.selectedHeroId === 'doctor_strange') {
      // Shield of the Seraphim Dome
      this.isShieldActive = true;
      this.playerShieldMesh.visible = true;
      setTimeout(() => {
        this.isShieldActive = false;
        if (this.playerShieldMesh) this.playerShieldMesh.visible = false;
      }, 4500);
      this.applyAoEDamage(center, 14, 110, '#f59e0b');

    } else {
      // Black Panther Purple Kinetic Overload Wave
      this.spawnControlledShockwave(center, 0xa855f7, 4.5);
      this.applyAoEDamage(center, 18, 155, '#a855f7');
    }

    this.playerUlt = Math.min(100, this.playerUlt + 16);
  }

  triggerUltimate() {
    if (this.playerUlt < 100) return;
    this.playerUlt = 0;
    this.screenShake = 0.75;
    window.soundSystem.playUltimate();
    this.showBanner('PODER SUPREMO ATIVADO', this.selectedHero.ultName);

    const center = this.playerMesh.position.clone().add(new THREE.Vector3(0, 1.8, 0));

    if (this.selectedHeroId === 'spider_man') {
      // Web Cocoon Barrage across every enemy in range
      this.doombots.forEach(bot => {
        this.createPhysicalTether(center, bot.mesh.position, 0xf8fafc, 0.08, 0.8, false);
      });
      if (this.boss) {
        this.createPhysicalTether(center, this.boss.position, 0xf8fafc, 0.12, 0.8, false);
      }
    } else if (this.selectedHeroId === 'thor') {
      // Multiple Bifrost Sky Lightning Pillars
      for (let i = 0; i < 6; i++) {
        const offset = new THREE.Vector3((Math.random() - 0.5) * 18, 0, (Math.random() - 0.5) * 18);
        const strikePt = center.clone().add(offset);
        this.createJaggedLightning(strikePt.clone().add(new THREE.Vector3(0, 50, 0)), strikePt, 0x38bdf8, 0.7);
      }
    } else {
      this.spawnControlledShockwave(center, this.selectedHero.color, 6.5);
    }

    this.applyAoEDamage(center, 45, 290, '#fbbf24');
    if (this.boss && this.boss.position.distanceTo(this.playerMesh.position) < 65) {
      this.damageBoss(410, true);
    }
  }

  applyAoEDamage(center, radius, dmg, colorStr) {
    this.doombots.forEach(bot => {
      if (bot.mesh.position.distanceTo(center) <= radius) {
        bot.health -= dmg;
        this.spawnDamageNumber(bot.mesh.position, dmg, colorStr);
        this.registerCombo();
      }
    });
    if (this.boss && this.boss.position.distanceTo(center) <= radius + 4) {
      this.damageBoss(dmg);
    }
  }

  registerCombo() {
    this.comboCount++;
    this.comboTimer = 3.5;
    const badge = document.getElementById('combo-badge');
    const countEl = document.getElementById('combo-count');
    if (badge && countEl) {
      countEl.innerText = `${this.comboCount}x`;
      badge.classList.add('active');
    }
  }

  spawnDamageNumber(worldPos, amount, color = '#10b981') {
    const layer = document.getElementById('damage-layer');
    if (!layer) return;

    const pos = worldPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 2.2, 0));
    pos.project(this.camera);
    if (pos.z > 1) return;

    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(pos.y * 0.5) + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = 'floating-dmg';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty('--dmg-color', color);
    el.innerText = `-${Math.round(amount)}`;
    layer.appendChild(el);

    setTimeout(() => el.remove(), 850);
  }

  damageBoss(dmg, isCrit = false) {
    if (!this.isBossActive) {
      this.activateBossEncounter();
    }

    if (this.bossShield.visible) {
      dmg = Math.round(dmg * 0.35);
      this.spawnSparks(this.boss.position.clone().add(new THREE.Vector3(0, 3, 0)), 0x10b981);
    }

    this.bossHealth = Math.max(0, this.bossHealth - dmg);
    this.registerCombo();
    this.spawnDamageNumber(
      this.boss.position.clone().add(new THREE.Vector3(0, 2.5, 0)),
      dmg,
      isCrit ? '#fbbf24' : '#10b981'
    );
    this.spawnSparks(this.boss.position.clone().add(new THREE.Vector3(0, 2.5, 0)), 0x10b981);

    if (this.bossHealth <= 0) {
      this.onVictory();
    } else if (this.bossHealth < this.bossMaxHealth * 0.5 && this.bossPhase === 1) {
      this.bossPhase = 2;
      this.screenShake = 0.65;
      document.getElementById('boss-phase-text').innerText = 'FASE 2: DEUS IMPERADOR DOOM';
      this.showBanner('FASE 2: DOOMSDAY', 'Victor Von Doom canalizou o Poder Cósmico!');
      window.soundSystem.playDoomLaugh();
    }
  }

  activateBossEncounter() {
    if (this.isBossActive) return;
    this.isBossActive = true;
    document.getElementById('boss-health-card').classList.remove('hidden');
    document.getElementById('obj-step').innerText = 'Derrote o Doutor Victor Von Doom no Salão do Trono!';
    this.showBanner('DOUTOR DESTINO', '“Ajoelhe-se perante o soberano de Latveria!”');
    window.soundSystem.setBossMode(true);
    window.soundSystem.playDoomLaugh();
  }

  updateHUD() {
    const hpPct = Math.max(0, (this.playerHealth / this.playerMaxHealth) * 100);
    document.getElementById('hud-health-fill').style.width = `${hpPct}%`;
    document.getElementById('hud-hp-text').innerText = `${Math.ceil(this.playerHealth)} / ${this.playerMaxHealth}`;

    document.getElementById('hud-energy-fill').style.width = `${this.playerEnergy}%`;
    document.getElementById('hud-ult-fill').style.width = `${this.playerUlt}%`;

    const cdPct = (this.skillCooldown / 5.0) * 100;
    document.getElementById('skill-cd-overlay').style.height = `${cdPct}%`;

    const ultBox = document.getElementById('slot-ult-box');
    if (ultBox) {
      if (this.playerUlt >= 100) ultBox.classList.add('ult-ready');
      else ultBox.classList.remove('ult-ready');
    }

    if (this.playerMesh && this.boss) {
      const dist = Math.round(this.playerMesh.position.distanceTo(this.boss.position));
      document.getElementById('tracker-distance').innerText = `DISTÂNCIA DO ALVO: ${dist}m`;
    }

    if (this.isBossActive) {
      const bossPct = (this.bossHealth / this.bossMaxHealth) * 100;
      document.getElementById('boss-health-fill').style.width = `${bossPct}%`;
    }
  }

  drawMinimap() {
    if (!this.minimapCtx || !this.playerMesh) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 1.05;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.lineWidth = 1;
    [25, 50].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    const px = this.playerMesh.position.x;
    const pz = this.playerMesh.position.z;

    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    this.world.buildingBoxes.forEach(b => {
      const bx = cx + (b.x - px) * scale;
      const bz = cy + (b.z - pz) * scale;
      ctx.fillRect(bx - (b.w * scale) / 2, bz - (b.d * scale) / 2, b.w * scale, b.d * scale);
    });

    ctx.fillStyle = '#ef4444';
    this.doombots.forEach(bot => {
      const dx = cx + (bot.mesh.position.x - px) * scale;
      const dz = cy + (bot.mesh.position.z - pz) * scale;
      ctx.beginPath();
      ctx.arc(dx, dz, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    if (this.boss) {
      const bx = Math.max(10, Math.min(w - 10, cx + (this.boss.position.x - px) * scale));
      const bz = Math.max(10, Math.min(h - 10, cy + (this.boss.position.z - pz) * scale));
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(bx, bz, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-this.camAngles.yaw);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(0, 2.5);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  showBanner(title, desc) {
    const banner = document.getElementById('notification-banner');
    document.getElementById('notify-title').innerText = title;
    document.getElementById('notify-desc').innerText = desc;
    banner.classList.add('active');
    setTimeout(() => banner.classList.remove('active'), 3200);
  }

  onVictory() {
    this.isGameRunning = false;
    if (document.pointerLockElement) document.exitPointerLock();
    window.soundSystem.playExplosion();
    const modal = document.getElementById('end-game-modal');
    document.getElementById('modal-title').innerText = 'VITÓRIA VINGADORA!';
    document.getElementById('modal-title').className = 'modal-title victory';
    document.getElementById('modal-desc').innerText = 'Victor Von Doom foi derrotado no Salão do Trono! A Cidadela de Latveria caiu e a incursão Doomsday foi neutralizada.';
    modal.classList.add('active');
  }

  onDefeat() {
    this.isGameRunning = false;
    if (document.pointerLockElement) document.exitPointerLock();
    window.soundSystem.playDoomLaugh();
    const modal = document.getElementById('end-game-modal');
    document.getElementById('modal-title').innerText = 'DESTINO TRIUNFOU';
    document.getElementById('modal-title').className = 'modal-title defeat';
    document.getElementById('modal-desc').innerText = 'O poder cósmico de Victor Von Doom subjugou os Vingadores. Latveria agora governa todo o Multiverso.';
    modal.classList.add('active');
  }

  spawnSparks(pos, colorHex) {
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 6, 6),
        new THREE.MeshBasicMaterial({ color: colorHex })
      );
      p.position.copy(pos);
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          Math.random() * 8,
          (Math.random() - 0.5) * 10
        ),
        life: 0.38
      });
    }
  }

  spawnControlledShockwave(pos, colorHex, radius) {
    window.soundSystem.playExplosion();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.4, 0.18, 12, 32),
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.75 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(pos);
    this.scene.add(ring);

    let progress = 0;
    const animInterval = setInterval(() => {
      progress += 0.08;
      ring.scale.multiplyScalar(1.12);
      ring.material.opacity = Math.max(0, 0.75 - progress);
      if (progress >= 0.75) {
        clearInterval(animInterval);
        this.scene.remove(ring);
      }
    }, 16);
  }

  updateBoomerangs(delta) {
    for (let i = this.activeBoomerangs.length - 1; i >= 0; i--) {
      const b = this.activeBoomerangs[i];
      b.mesh.rotation.x += delta * 24;
      b.mesh.rotation.y += delta * 12;

      if (!b.returning) {
        b.progress += delta * 3.4;
        b.mesh.position.lerpVectors(b.startPos, b.targetPos, Math.min(1, b.progress));
        if (b.progress >= 1) {
          if (!b.hasHit && (b.targetRef.type === 'bot' || b.targetRef.type === 'boss')) {
            this.applyTargetHit(b.targetRef, b.damage, '#38bdf8');
            this.createJaggedLightning(b.targetPos.clone().add(new THREE.Vector3(0, 8, 0)), b.targetPos, 0x38bdf8, 0.2);
            b.hasHit = true;
          }
          b.returning = true;
          b.progress = 0;
        }
      } else {
        b.progress += delta * 3.8;
        const returnDest = this.playerMesh.position.clone().add(new THREE.Vector3(0, 1.6, 0));
        b.mesh.position.lerpVectors(b.targetPos, returnDest, Math.min(1, b.progress));
        if (b.progress >= 1) {
          this.scene.remove(b.mesh);
          this.activeBoomerangs.splice(i, 1);
          if (this.playerMesh && this.playerMesh.userData.mjolnirMesh) {
            this.playerMesh.userData.mjolnirMesh.visible = true;
          }
        }
      }
    }
  }

  updatePlayer(delta, time) {
    if (!this.playerMesh) return;

    this.playerEnergy = Math.min(100, this.playerEnergy + delta * 24);
    if (this.skillCooldown > 0) this.skillCooldown = Math.max(0, this.skillCooldown - delta);
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - delta);

    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        const badge = document.getElementById('combo-badge');
        if (badge) badge.classList.remove('active');
      }
    }

    const forward = new THREE.Vector3(-Math.sin(this.camAngles.yaw), 0, -Math.cos(this.camAngles.yaw));
    const right = new THREE.Vector3(Math.cos(this.camAngles.yaw), 0, -Math.sin(this.camAngles.yaw));

    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW']) moveDir.add(forward);
    if (this.keys['KeyS']) moveDir.sub(forward);
    if (this.keys['KeyA']) moveDir.sub(right);
    if (this.keys['KeyD']) moveDir.add(right);

    const isMoving = moveDir.lengthSq() > 0;
    const speed = this.selectedHero.speed;

    if (isMoving) {
      moveDir.normalize();
      const nextX = this.playerMesh.position.x + moveDir.x * speed * delta;
      const nextZ = this.playerMesh.position.z + moveDir.z * speed * delta;

      let blocked = false;
      for (const b of this.world.buildingBoxes) {
        if (
          Math.abs(nextX - b.x) < b.w / 2 + 1.1 &&
          Math.abs(nextZ - b.z) < b.d / 2 + 1.1
        ) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        this.playerMesh.position.x = Math.max(-45, Math.min(45, nextX));
        this.playerMesh.position.z = Math.max(-172, Math.min(68, nextZ));
      }

      this.playerMesh.rotation.y = Math.atan2(moveDir.x, moveDir.z);
    }

    this.playerVelocity.y -= 32 * delta;
    this.playerMesh.position.y += this.playerVelocity.y * delta;

    const targetGroundY = this.world.getGroundHeight(
      this.playerMesh.position.x,
      this.playerMesh.position.z
    );

    if (this.playerMesh.position.y <= targetGroundY) {
      this.playerMesh.position.y = targetGroundY;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    CharacterBuilder.animateCharacter(this.playerMesh, delta, isMoving, this.isGrounded, time);

    if (this.playerShieldMesh && this.isShieldActive) {
      this.playerShieldMesh.position.copy(this.playerMesh.position).add(new THREE.Vector3(0, 1.5, 0));
      this.playerShieldMesh.material.uniforms.uTime.value = time;
    }

    const shoulderRight = new THREE.Vector3(
      Math.cos(this.camAngles.yaw),
      0,
      -Math.sin(this.camAngles.yaw)
    ).multiplyScalar(this.camShoulder);

    const desiredCamPos = new THREE.Vector3(
      this.playerMesh.position.x + Math.sin(this.camAngles.yaw) * this.camDist * Math.cos(this.camAngles.pitch),
      this.playerMesh.position.y + Math.sin(this.camAngles.pitch) * this.camDist + this.camHeight,
      this.playerMesh.position.z + Math.cos(this.camAngles.yaw) * this.camDist * Math.cos(this.camAngles.pitch)
    ).add(shoulderRight);

    const camGround = this.world.getGroundHeight(desiredCamPos.x, desiredCamPos.z) + 1.4;
    if (desiredCamPos.y < camGround) desiredCamPos.y = camGround;

    this.currentCamPos.lerp(desiredCamPos, Math.min(1, delta * 14));

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - delta * 3.0);
      this.currentCamPos.x += (Math.random() - 0.5) * this.screenShake;
      this.currentCamPos.y += (Math.random() - 0.5) * this.screenShake;
    }

    this.camera.position.copy(this.currentCamPos);

    const lookTarget = this.playerMesh.position.clone()
      .add(new THREE.Vector3(0, 2.3, 0))
      .add(shoulderRight.clone().multiplyScalar(0.65));
    this.currentLookAt.lerp(lookTarget, Math.min(1, delta * 18));
    this.camera.lookAt(this.currentLookAt);

    if (!this.isBossActive && this.playerMesh.position.z < -96) {
      this.activateBossEncounter();
    }
  }

  updateBoss(delta, time) {
    if (!this.boss) return;

    if (this.boss.userData.orbsGroup) {
      this.boss.userData.orbsGroup.rotation.y += delta * (this.bossPhase === 2 ? 4.0 : 1.5);
    }

    if (!this.isBossActive) return;

    this.bossAttackTimer += delta;
    this.boss.lookAt(this.playerMesh.position.x, this.boss.position.y, this.playerMesh.position.z);

    this.boss.position.x = Math.sin(time * 0.85) * 10;
    if (this.bossPhase === 2) {
      this.boss.position.y = 35.5 + Math.sin(time * 2.2) * 1.5;
    } else {
      this.boss.position.y = 32.5;
    }

    if (Math.sin(time * 0.9) > 0.72) {
      this.bossShield.visible = true;
      this.bossShield.position.copy(this.boss.position).add(new THREE.Vector3(0, 2.0, 0));
      this.bossShield.material.uniforms.uTime.value = time;
    } else {
      this.bossShield.visible = false;
    }

    if (this.bossAttackTimer > (this.bossPhase === 2 ? 1.45 : 2.2)) {
      this.bossAttackTimer = 0;
      this.fireBossAttack();
    }
  }

  fireBossAttack() {
    window.soundSystem.playDoomBeam();
    const origin = this.boss.position.clone().add(new THREE.Vector3(0, 2.6, 0));
    const target = this.playerMesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    const dir = target.sub(origin).normalize();

    if (this.bossPhase === 2 && Math.random() < 0.4) {
      // Emerald Arcane Lightning Strike
      this.createJaggedLightning(origin, this.playerMesh.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 0x10b981, 0.35);
      if (this.playerMesh.position.distanceTo(this.boss.position) < 40 && !this.isShieldActive) {
        this.playerHealth = Math.max(0, this.playerHealth - 34);
        this.spawnDamageNumber(this.playerMesh.position, 34, '#ef4444');
        if (this.playerHealth <= 0) this.onDefeat();
      }
    } else {
      const count = this.bossPhase === 2 ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const spreadDir = dir.clone();
        if (count > 1) {
          spreadDir.x += (i - 1) * 0.14;
          spreadDir.normalize();
        }
        const orb = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.42, 1),
          new THREE.MeshBasicMaterial({ color: 0x10b981 })
        );
        orb.position.copy(origin);
        this.scene.add(orb);

        this.projectiles.push({
          mesh: orb,
          velocity: spreadDir.multiplyScalar(34),
          isEnemy: true,
          damage: 24,
          color: '#10b981',
          life: 3.0
        });
      }
    }
  }

  updateDoombots(delta, time) {
    this.doombots.forEach((bot, idx) => {
      if (bot.health <= 0) return;

      // Bipedal Marching Animation
      const u = bot.mesh.userData;
      if (u && u.leftLeg) {
        const march = Math.sin(time * 4 + idx) * 0.35;
        u.leftLeg.rotation.x = march;
        u.rightLeg.rotation.x = -march;
      }

      const dist = bot.mesh.position.distanceTo(this.playerMesh.position);
      if (dist < 42) {
        bot.mesh.lookAt(this.playerMesh.position.x, bot.mesh.position.y, this.playerMesh.position.z);
        bot.cooldown -= delta;
        if (bot.cooldown <= 0) {
          bot.cooldown = 2.4 + Math.random() * 1.2;
          const spawnOrigin = bot.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
          const dir = this.playerMesh.position.clone()
            .add(new THREE.Vector3(0, 1.5, 0))
            .sub(spawnOrigin)
            .normalize();

          const bolt = new THREE.Mesh(
            new THREE.SphereGeometry(0.24, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x10b981 })
          );
          bolt.position.copy(spawnOrigin);
          this.scene.add(bolt);
          this.projectiles.push({
            mesh: bolt,
            velocity: dir.multiplyScalar(28),
            isEnemy: true,
            damage: 15,
            color: '#10b981',
            life: 2.5
          });
        }
      }
    });

    for (let i = this.doombots.length - 1; i >= 0; i--) {
      const bot = this.doombots[i];
      if (bot.health <= 0) {
        this.spawnControlledShockwave(bot.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x10b981, 2.0);
        this.scene.remove(bot.mesh);
        this.doombots.splice(i, 1);
        this.playerUlt = Math.min(100, this.playerUlt + 22);
      }
    }
  }

  updateProjectilesAndLines(delta) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.life -= delta;

      let hit = false;
      if (p.isEnemy) {
        if (p.mesh.position.distanceTo(this.playerMesh.position.clone().add(new THREE.Vector3(0, 1.5, 0))) < 1.8) {
          if (!this.isShieldActive) {
            this.playerHealth = Math.max(0, this.playerHealth - p.damage);
            this.spawnDamageNumber(this.playerMesh.position, p.damage, '#ef4444');
            this.spawnSparks(this.playerMesh.position, 0xef4444);
            if (this.playerHealth <= 0) this.onDefeat();
          } else {
            this.spawnSparks(this.playerMesh.position, 0xf59e0b);
          }
          hit = true;
        }
      }

      if (p.life <= 0 || hit) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.activeLines.length - 1; i >= 0; i--) {
      const l = this.activeLines[i];
      l.life -= delta;
      if (l.life <= 0) {
        this.scene.remove(l.mesh);
        this.activeLines.splice(i, 1);
      }
    }
  }

  updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.mesh.position.addScaledVector(pt.velocity, delta);
      pt.life -= delta;
      pt.mesh.scale.multiplyScalar(0.91);
      if (pt.life <= 0) {
        this.scene.remove(pt.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    if (this.world) this.world.update(time, delta);

    if (this.isGameRunning) {
      this.updatePlayer(delta, time);
      this.updateBoomerangs(delta);
      this.updateBoss(delta, time);
      this.updateDoombots(delta, time);
      this.updateProjectilesAndLines(delta);
      this.updateParticles(delta);
      this.updateHUD();
      this.drawMinimap();
    } else {
      if (this.showcaseHeroMesh) {
        this.showcaseHeroMesh.rotation.y = Math.sin(time * 0.65) * 0.55;
        CharacterBuilder.animateCharacter(this.showcaseHeroMesh, delta, false, true, time);
      }
      if (this.showcaseRuneMat) {
        this.showcaseRuneMat.uniforms.uTime.value = time;
      }
      this.camera.position.set(0, 14.1, 80.2);
      this.camera.lookAt(0, 13.5, 75);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new DoomsdayGame();
  window.game.animate();
});

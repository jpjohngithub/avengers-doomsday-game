// ============================================================================
// AVENGERS: DOOMSDAY — TRUE GPU VFX POWERS (9 HEROES), CHALLENGING BOSSES & CUTSCENES
// ============================================================================

(function () {
  if (typeof DoomsdayGame === 'undefined') return;

  // ==========================================================================
  // 1. CINEMATIC CUTSCENE DIRECTOR (Letterbox, Boss Splashes, Camera Lerp)
  // ==========================================================================
  const CutsceneDirector = {
    isPlaying: false,
    steps: [],
    stepIdx: 0,
    timer: 0,
    seenIds: new Set(),
    onEnd: null,
    curPos: new THREE.Vector3(),
    curLook: new THREE.Vector3(),
    curFov: 56,
    _bound: false,

    _ensureBind(game) {
      if (this._bound) return;
      this._bound = true;
      window.addEventListener('keydown', (e) => {
        if (this.isPlaying && (e.code === 'Space' || e.code === 'Enter')) {
          e.preventDefault();
          this.stop(game);
        }
      });
      const skipBtn = document.getElementById('cutscene-skip-btn');
      if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.stop(game);
        });
      }
    },

    play(id, steps, game, onEnd = null, once = true) {
      if (once && this.seenIds.has(id)) {
        if (onEnd) onEnd();
        return;
      }
      this._ensureBind(game);
      this.seenIds.add(id);
      this.steps = steps;
      this.stepIdx = 0;
      this.timer = 0;
      this.onEnd = onEnd;
      this.isPlaying = true;
      if (game && game.camera) {
        this.curPos.copy(game.camera.position);
        this.curLook.copy(typeof steps[0].lookAt === 'function' ? steps[0].lookAt(0, game) : steps[0].lookAt);
        this.curFov = game.camera.fov;
      }
      this._renderStep();
      if (steps[0] && steps[0].onEnter) steps[0].onEnter(game);
    },

    _renderStep() {
      const ov = document.getElementById('cutscene-overlay');
      if (!ov) return;
      ov.classList.remove('hidden');
      const s = this.steps[this.stepIdx];
      const speakerEl = document.getElementById('cutscene-speaker');
      const lineEl = document.getElementById('cutscene-line');
      const cardEl = document.getElementById('cutscene-boss-card');
      const titleEl = document.getElementById('cutscene-boss-title');
      const subEl = document.getElementById('cutscene-boss-sub');

      if (speakerEl) speakerEl.textContent = s.speaker || '';
      if (lineEl) lineEl.textContent = s.line || '';
      if (cardEl && titleEl && subEl) {
        if (s.bossTitle) {
          cardEl.classList.remove('hidden');
          titleEl.textContent = s.bossTitle;
          subEl.textContent = s.bossSub || '';
          cardEl.style.setProperty('--boss-accent', s.accent || '#ef4444');
        } else {
          cardEl.classList.add('hidden');
        }
      }
    },

    update(dt, time, game) {
      if (!this.isPlaying || !this.steps.length) return;
      const s = this.steps[this.stepIdx];
      this.timer += dt;
      const k = 1 - Math.exp(-3.4 * dt);

      const targetPos = typeof s.camPos === 'function' ? s.camPos(time, game) : s.camPos;
      const targetLook = typeof s.lookAt === 'function' ? s.lookAt(time, game) : s.lookAt;
      this.curPos.lerp(targetPos, k);
      this.curLook.lerp(targetLook, k);
      this.curFov = THREE.MathUtils.lerp(this.curFov, s.fov || 52, k);

      if (game && game.camera) {
        game.camera.position.copy(this.curPos);
        game.camera.lookAt(this.curLook);
        game.camera.fov = this.curFov;
        game.camera.updateProjectionMatrix();
      }

      if (this.timer >= (s.duration || 2.8)) {
        this.stepIdx++;
        this.timer = 0;
        if (this.stepIdx >= this.steps.length) {
          this.stop(game);
        } else {
          this._renderStep();
          if (this.steps[this.stepIdx].onEnter) this.steps[this.stepIdx].onEnter(game);
        }
      }
    },

    stop(game) {
      if (!this.isPlaying) return;
      this.isPlaying = false;
      if (game && game.doomBoss && game.doomBoss.mesh) game.doomBoss.mesh.userData.bossIntroTimer = 0;
      if (game && game.miniBosses) game.miniBosses.forEach(mb => { if (mb.mesh) mb.mesh.userData.bossIntroTimer = 0; });
      const ov = document.getElementById('cutscene-overlay');
      if (ov) ov.classList.add('hidden');
      if (game && game.camera && game.playerState) {
        game.camera.fov = 60;
        game.camera.updateProjectionMatrix();
        const yaw = game.camYaw || 0;
        const pitch = game.camPitch !== undefined ? game.camPitch : 0.22;
        const dist = game.userCamDist || 7.1;
        game.camDist = dist;
        const p = game.playerState.pos;
        if (!game.camAnchor) game.camAnchor = p.clone();
        else game.camAnchor.copy(p);
        game.camSmoothPivot = null;
        const shoulderY = game.playerState.isSwimming ? 1.65 : 2.15;
        const rx = Math.cos(yaw), rz = -Math.sin(yaw);
        const px = p.x + rx * 0.46, py = p.y + shoulderY, pz = p.z + rz * 0.46;
        const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
        const cx = px + Math.sin(yaw) * cosP * dist;
        const cy = Math.max(py + sinP * dist, p.y + 0.95);
        const cz = pz + Math.cos(yaw) * cosP * dist;
        game.camera.position.set(cx, cy, cz);
        game.camera.lookAt(
          px - Math.sin(yaw) * cosP * 22.0,
          py + 0.08 - sinP * 22.0,
          pz - Math.cos(yaw) * cosP * 22.0
        );
        if (game.safeRequestPointerLock && !document.pointerLockElement) game.safeRequestPointerLock();
      }
      if (this.onEnd) {
        const cb = this.onEnd;
        this.onEnd = null;
        cb();
      }
    }
  };
  window.CutsceneDirector = CutsceneDirector;

  // ==========================================================================
  // 2. HOOK GAME LIFECYCLE: TRAILS, CHANNELS, SUMMONS & INTRO CUTSCENE
  // ==========================================================================
  const _origStart = DoomsdayGame.prototype.startGame;
  const _origInitPlayer = DoomsdayGame.prototype.initPlayer;
  const _origSwitchHero = DoomsdayGame.prototype.switchHeroInGame;
  const _origUpdatePlayer = DoomsdayGame.prototype.updatePlayer;
  const _origUpdateFX = DoomsdayGame.prototype.updateWorldFXAndProjectiles;
  const _origUpdateHUD = DoomsdayGame.prototype.updateHUD;

  DoomsdayGame.prototype._initHeroPowerState = function () {
    this.timeFreezeTimer = 0;
    this.activeChannels = [];
    this.activeSingularities = [];
    this.activeHomingMissiles = [];
    this.activeShieldChains = [];
    this.activeOrbitalDrone = null;
    this.activeWandaRocks = [];
    this.maxSpiderSteps = [];
    if (this.customPowerConstructs) {
      this.customPowerConstructs.forEach(c => { if (c.mesh && c.mesh.parent) c.mesh.parent.remove(c.mesh); });
    }
    this.customPowerConstructs = [];
    this.playerState.heroResource = 0; // 0-100 (Kinetic, Fury, Chaos, Arc)
    this.playerState.capAuraTimer = 0;
    this.playerState.armaXTimer = 0;
    this.playerState.lastDangerFlash = 0;
    this._setupWeaponTrails();
  };

  // Helper: cria construtos 3D temporários de poderes com update/cleanup automático
  DoomsdayGame.prototype.spawnPowerConstruct = function (mesh, life, onUpdate, onExpire) {
    if (!this.customPowerConstructs) this.customPowerConstructs = [];
    this.scene.add(mesh);
    this.customPowerConstructs.push({ mesh, life, maxLife: life, onUpdate, onExpire });
    return mesh;
  };

  // Anime Crescent Energy Wave (replaces clunky boxes/wireframes)
  DoomsdayGame.prototype._spawnCrescentWave = function (pos, yaw, roll, colorHex, coreHex, scale, speed, dmg) {
    const grp = new THREE.Group();
    const outerMat = CustomShaders.createSlashRibbonMaterial(coreHex, colorHex);
    outerMat.uniforms.uProgress.value = 0.48;
    const blade = new THREE.Mesh(new THREE.RingGeometry(0.65 * scale, 1.55 * scale, 16, 1, -Math.PI * 0.42, Math.PI * 0.84), outerMat);
    blade.rotation.x = Math.PI / 2;
    const inner = new THREE.Mesh(
      new THREE.RingGeometry(0.95 * scale, 1.32 * scale, 14, 1, -Math.PI * 0.36, Math.PI * 0.72),
      new THREE.MeshBasicMaterial({ color: coreHex, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    inner.rotation.x = Math.PI / 2;
    grp.add(blade, inner);
    grp.position.copy(pos);
    grp.rotation.order = 'YXZ';
    grp.rotation.y = yaw;
    grp.rotation.z = roll;
    if (speed > 0 && dmg > 0) {
      const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      this.scene.add(grp);
      this.projectiles.push({
        mesh: grp, pos: pos.clone(), vel: fwd.multiplyScalar(speed),
        dmg, color: '#' + new THREE.Color(colorHex).getHexString(),
        isPlayer: true, isHeavy: true, radius: 1.6 * scale, life: 0.65
      });
    } else {
      this.spawnPowerConstruct(grp, 0.28, (c, dt, t) => {
        c.mesh.scale.setScalar(1 + t * 0.45);
        inner.material.opacity = 0.9 * (1 - t);
        outerMat.uniforms.uProgress.value = 0.45 + t * 0.52;
      });
    }
    return grp;
  };

  // Stylized Dual-Core Energy Beam (clean cartoon glow, zero screen washout)
  DoomsdayGame.prototype._spawnStylizedBeam = function (start, end, colorHex, radius = 0.22, duration = 0.25) {
    const dir = end.clone().sub(start);
    const len = Math.max(0.2, dir.length());
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const grp = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.42, radius * 0.42, len, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 })
    );
    const aura = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, len, 8),
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.46, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    grp.add(aura, core);
    grp.position.copy(mid);
    grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    this.spawnPowerConstruct(grp, duration, (c, dt, t) => {
      core.material.opacity = 0.92 * (1 - t);
      aura.material.opacity = 0.46 * (1 - t);
      c.mesh.scale.set(1 - t * 0.35, 1, 1 - t * 0.35);
    });
    return grp;
  };

  // Sculpted Low-Poly Spectral Panther Silhouette for Black Panther Ultimate
  DoomsdayGame.prototype._buildSpectralPantherMesh = function (colorHex = 0xa855f7) {
    const grp = new THREE.Group();
    const mat = CustomShaders.createStylizedMaterial({
      color: colorHex, emissive: colorHex, emissiveIntensity: 0.85,
      transparent: true, opacity: 0.82, rimColor: 0xf5d0fe, rimStrength: 0.9
    });
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 3.6, 8), mat);
    torso.rotation.x = Math.PI / 2;
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.88, 0), mat);
    head.scale.set(0.95, 0.88, 1.35);
    head.position.set(0, 0.45, 2.25);
    [-1, 1].forEach(s => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 4), mat);
      ear.position.set(s * 0.48, 1.15, 1.95);
      grp.add(ear);
      const legF = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 1.8, 6), mat);
      legF.position.set(s * 0.68, -0.55, 1.45);
      legF.rotation.x = -0.85;
      const legB = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.18, 1.8, 6), mat);
      legB.position.set(s * 0.68, -0.45, -1.45);
      legB.rotation.x = 0.95;
      grp.add(legF, legB);
    });
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 2.6, 6), mat);
    tail.position.set(0, 0.4, -2.6);
    tail.rotation.x = 1.15;
    grp.add(torso, head, tail);
    grp.userData.fadeMat = mat;
    return grp;
  };

  DoomsdayGame.prototype._setupWeaponTrails = function () {
    if (!this.vfx) return;
    if (this.trailL && this.trailL.mesh && this.trailL.mesh.parent) this.scene.remove(this.trailL.mesh);
    if (this.trailR && this.trailR.mesh && this.trailR.mesh.parent) this.scene.remove(this.trailR.mesh);
    const hero = HEROES_DATA[this.selectedHeroId];
    this.trailL = this.vfx.createWeaponTrail(hero.colorHex, 14, 0.42);
    this.trailR = this.vfx.createWeaponTrail(hero.accentHex || hero.colorHex, 14, 0.42);
  };

  DoomsdayGame.prototype.initPlayer = function () {
    _origInitPlayer.call(this);
    this._initHeroPowerState();
    const resEl = document.getElementById('hud-resource-label');
    if (resEl) resEl.textContent = HEROES_DATA[this.selectedHeroId].resourceName || 'ENERGIA';
  };

  DoomsdayGame.prototype.switchHeroInGame = function (heroId) {
    _origSwitchHero.call(this, heroId);
    this._setupWeaponTrails();
    const resEl = document.getElementById('hud-resource-label');
    if (resEl) resEl.textContent = HEROES_DATA[this.selectedHeroId].resourceName || 'ENERGIA';
  };

  DoomsdayGame.prototype.startGame = function () {
    _origStart.call(this);
    this._initHeroPowerState();
    this.sealsBroken = 0;
    if (this.world) {
      this.world.castleBarrierUnlocked = false;
      if (this.world.castleBarrier) this.world.castleBarrier.visible = true;
      if (this.world.sealObelisks) {
        this.world.sealObelisks.forEach(s => { s.broken = false; if (s.beam) s.beam.visible = true; });
      }
    }

    // Play Opening Intro Cutscene over 1400m Latveria
    const hero = HEROES_DATA[this.selectedHeroId];
    CutsceneDirector.play('intro_latveria', [
      {
        speaker: 'SISTEMA TÁTICO S.H.I.E.L.D.',
        line: 'A Cidadela de Doom bloqueou o Castelo com 3 Selos Imperiais nas regiões de Latvéria.',
        camPos: new THREE.Vector3(0, 26, -395),
        lookAt: new THREE.Vector3(0, 11, -555),
        fov: 58,
        duration: 3.1
      },
      {
        speaker: hero.name.toUpperCase(),
        line: 'Quebrem os Selos na Floresta Negra, Cratera dos Sentinelas e Tundra Glacial. Avante!',
        bossTitle: 'OPERAÇÃO DOOMSDAY',
        bossSub: '5 FASES // 3 SELOS IMPERIAIS // MUNDO ABERTO 1400M',
        accent: hero.color,
        camPos: (t) => new THREE.Vector3(Math.sin(t * 0.7) * 8, 6.5, 174),
        lookAt: new THREE.Vector3(0, 2.2, 165),
        fov: 48,
        duration: 3.0
      }
    ], this, null, true);
  };

  // Helper: collect all living enemy targets cleanly
  DoomsdayGame.prototype._getAllLivingEnemies = function () {
    const list = [];
    this.doombots.forEach(b => { if (!b.dead) list.push({ pos: b.pos, isBoss: false, ref: b }); });
    if (this.miniBosses) {
      this.miniBosses.forEach(mb => { if (mb.alive) list.push({ pos: mb.pos, isBoss: false, ref: mb }); });
    }
    if (this.world && this.world.energyTowers) {
      this.world.energyTowers.forEach(tw => { if (!tw.destroyed) list.push({ pos: tw.pos, isBoss: false, ref: tw }); });
    }
    if (this.doomBoss && this.doomBoss.hp > 0) {
      list.push({ pos: this.doomBoss.pos, isBoss: true, ref: this.doomBoss });
    }
    return list;
  };

  DoomsdayGame.prototype.onVfxJumpRingHit = function (ring) {
    if (this.playerState.invulnTimer > 0) return;
    this.damagePlayer(ring.dmg || 52);
  };

  // ==========================================================================
  // 3. OVERRIDE VFX HELPERS TO USE REAL GPU PARTICLES & VOLUMETRIC BEAMS
  // ==========================================================================
  DoomsdayGame.prototype.spawnShockwave = function (pos, colorHex, targetRadius = 8, duration = 0.42) {
    if (this.vfx) {
      this.vfx.emitRing(pos, targetRadius, { color: colorHex, count: 48, speed: targetRadius * 2.2 });
    }
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = CustomShaders.createShockwaveRingMaterial(colorHex);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, pos.y + 0.14, pos.z);
    this.scene.add(mesh);
    this.vfxEffects.push({ mesh, mat, type: 'shockwave', targetRadius, life: duration, maxLife: duration });
  };

  DoomsdayGame.prototype.spawnSparks = function (pos, colorHex, count = 14) {
    if (this.vfx) {
      this.vfx.emitBurst(pos, { color: colorHex, count: count * 2, speed: 15, size: 1.8, life: 0.45 });
    }
  };

  DoomsdayGame.prototype.createJaggedLightning = function (startPos, endPos, colorHex = 0x38bdf8, duration = 0.24) {
    if (this.vfx) {
      this.vfx.spawnBranchedLightning(startPos, endPos, { color: colorHex, duration, width: 0.28, segments: 11 });
    }
  };

  // ==========================================================================
  // 4. UNIQUE EXCLUSIVE POWERS FOR ALL 9 HEROES (M1 / M2 / Q / R)
  // ==========================================================================
  DoomsdayGame.prototype.triggerPrimaryAttack = function () {
    const ps = this.playerState;
    if (ps.primaryCooldown > 0) return;

    const hero = HEROES_DATA[this.selectedHeroId];
    const isDashAttack = (this.playerMesh.userData.dashTimer || 0) > 0.25;
    ps.comboIndex = isDashAttack ? 3 : (ps.comboIndex % 3) + 1;
    ps.comboResetTimer = 1.35;
    const step = ps.comboIndex;
    const isFinisher = step === 3;

    // Air-combo hang time (fluid aerial juggling!)
    if (!ps.isGrounded && !ps.isFlying && !ps.isSwinging) {
      ps.vel.y = Math.max(ps.vel.y, 2.8);
    }

    // Wolverine fury accelerates attack speed within balanced bounds
    const speedMult = hero.id === 'wolverine' ? Math.max(0.78, 1.0 - (ps.heroResource || 0) * 0.0022) : 1.0;
    ps.primaryCooldown = (isFinisher ? 0.42 : 0.30) * speedMult;
    this.playerMesh.userData.attackTimer = 1.0;
    this.playerMesh.userData.comboStep = step;

    const target = this.findBestTarget(['magic', 'repulsor', 'chaos'].includes(hero.attackType) ? 36 : 24);
    if (target) {
      const toT = target.pos.clone().sub(ps.pos);
      ps.yaw = Math.atan2(toT.x, toT.z);
      if (toT.length() > 3.0 && toT.length() < 16 && !['magic', 'repulsor', 'chaos'].includes(hero.attackType)) {
        const dashBoost = isDashAttack ? 4.8 : 3.2;
        const stepFwd = toT.setY(0).normalize().multiplyScalar(Math.min(toT.length() - 1.8, hero.attackType === 'elastic' ? 2.4 : dashBoost));
        this.safeTranslatePlayer(stepFwd.x, stepFwd.z);
      }
    } else {
      const f = new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).multiplyScalar(-1);
      ps.yaw = Math.atan2(f.x, f.z);
      if (isDashAttack) this.safeTranslatePlayer(f.x * 3.2, f.z * 3.2);
    }

    const fwd = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw));
    const handPos = ps.pos.clone().add(new THREE.Vector3(0, 1.48, 0)).addScaledVector(fwd, 0.85);
    window.soundSystem.playAttack(hero.attackType);

    const furyBonus = (hero.id === 'wolverine' ? (1.0 + (ps.heroResource || 0) * 0.0028) : (ps.capAuraTimer > 0 ? 1.20 : 1.0)) * (isDashAttack ? 1.18 : 1.0);
    if (isDashAttack) {
      this.spawnShockwave(ps.pos, hero.colorHex, 5.0, 0.25);
    }

    if (hero.id === 'spider_man') {
      this.spawnSlashArc(handPos, ps.yaw, 0xfef08a, 0xef4444, isFinisher ? 4.6 : 3.2, step === 2 ? -0.35 : 0.28);
      if (this.vfxPro) {
        this.vfxPro.p.cone(handPos.x, handPos.y, handPos.z, fwd.x, 0.1, fwd.z, isFinisher ? '#fbbf24' : '#f8fafc', isFinisher ? 26 : 14, 14, 0.65, 0.32, 0.45);
      }
      if (isFinisher) {
        // 3D Iron-Spider 4-Claw Gold Fan Strike!
        const fan = new THREE.Group();
        const clawMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
        for (let k = -1.5; k <= 1.5; k += 1) {
          const blade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 3.6, 4), clawMat);
          blade.rotation.x = Math.PI / 2;
          blade.rotation.z = k * 0.28;
          blade.position.set(k * 0.45, 0, 1.4);
          fan.add(blade);
        }
        fan.position.copy(handPos);
        fan.rotation.y = ps.yaw;
        this.spawnPowerConstruct(fan, 0.26, (c, dt, t) => { c.mesh.scale.setScalar(1 + t * 0.45); clawMat.opacity = 1 - t; });
      }
      if (target && target.dist < 19) {
        if (isFinisher) {
          this.safeTranslatePlayer(fwd.x * Math.min(target.dist - 2.0, 6.5), fwd.z * Math.min(target.dist - 2.0, 6.5));
          // Web-Tether Yank: pull up to 4 nearby Doombots inward into the Waldoes impact!
          const pullCenter = target.pos.clone();
          let pulled = 0;
          this.doombots.forEach(b => {
            if (!b.dead && pulled < 4 && b.pos.distanceTo(pullCenter) < 14 && b.pos.distanceTo(pullCenter) > 1.8) {
              pulled++;
              if (this.vfx) this.vfx.spawnVolumetricBeam(pullCenter.clone().add(new THREE.Vector3(0, 1.4, 0)), b.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), { color: 0xf8fafc, coreColor: 0xffffff, width: 0.14, duration: 0.25 });
              b.pos.lerp(pullCenter, 0.65);
            }
          });
          if (this.vfxPro) {
            this.vfxPro.vfx.spiderWebShot(handPos, target.pos.clone().add(new THREE.Vector3(0, 1.4, 0)));
            this.vfxPro.vfx.spiderImpact(target.pos);
          }
          // Stylized Shader Web Ring attached on hit
          const webRing = new THREE.Mesh(
            new THREE.RingGeometry(0.85, 1.45, 12),
            CustomShaders.createShockwaveRingMaterial(0xf8fafc)
          );
          webRing.rotation.x = -Math.PI / 2;
          webRing.position.copy(target.pos).add(new THREE.Vector3(0, 1.1, 0));
          this.spawnPowerConstruct(webRing, 0.75, (c, dt, t) => {
            c.mesh.rotation.z += dt * 4;
            c.mesh.scale.setScalar(1 + t * 0.45);
            if (c.mesh.material.uniforms?.uProgress) c.mesh.material.uniforms.uProgress.value = t;
          });
          this.spawnShockwave(target.pos, 0xef4444, 5.8, 0.32);
          if (target.ref && !target.isBoss) target.ref.webbedTimer = Math.max(target.ref.webbedTimer || 0, 1.4);
        }
        this.applyTargetHit(target, isFinisher ? 92 : 52, '#ef4444', isFinisher);
      } else {
        this.applyAoEDamage(handPos.clone().addScaledVector(fwd, 2.4), 3.8, isFinisher ? 84 : 48, '#ef4444', isFinisher);
      }
    } else if (hero.id === 'doctor_strange') {
      this.spawnSlashArc(handPos, ps.yaw, 0xfef08a, 0xf59e0b, 3.8, step === 2 ? -0.35 : 0.35);
      if (this.vfxPro) {
        this.vfxPro.p.ring(handPos.x, handPos.y, handPos.z, '#f59e0b', 18, 0.4, 0.5, 0.65, 0.3);
      }
      const angles = isFinisher ? [-0.22, 0, 0.22] : [0];
      angles.forEach(ang => {
        const dir = target ? target.pos.clone().add(new THREE.Vector3(0, 1.5, 0)).sub(handPos).normalize() : fwd.clone();
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
        const disc = new THREE.Mesh(
          new THREE.PlaneGeometry(isFinisher ? 1.7 : 1.35, isFinisher ? 1.7 : 1.35),
          CustomShaders.createEldritchMandalaMaterial(0xf59e0b)
        );
        disc.position.copy(handPos);
        disc.rotation.x = Math.PI / 2;
        this.scene.add(disc);
        this.projectiles.push({ mesh: disc, pos: handPos.clone(), vel: dir.multiplyScalar(42), dmg: isFinisher ? 52 : 56, color: '#f59e0b', isPlayer: true, isHeavy: isFinisher, radius: 1.6, life: 1.5 });
      });
    } else if (hero.id === 'thor') {
      this.spawnSlashArc(handPos, ps.yaw, 0xe0f2fe, 0x06b6d4, isFinisher ? 5.2 : 3.8, step === 2 ? -0.4 : 0.25);
      const hitPos = handPos.clone().addScaledVector(fwd, 2.8);
      this.applyAoEDamage(hitPos, isFinisher ? 6.4 : 4.5, isFinisher ? 105 : 62, '#06b6d4', isFinisher);
      const enemies = this._getAllLivingEnemies()
        .map(e => ({ e, d: e.pos.distanceTo(hitPos) }))
        .filter(x => x.d < 18)
        .sort((a, b) => a.d - b.d)
        .slice(0, isFinisher ? 3 : 2);
      let prev = hitPos.clone();
      enemies.forEach(({ e }) => {
        const ep = e.pos.clone().add(new THREE.Vector3(0, 1.6, 0));
        if (this.vfxPro) this.vfxPro.vfx.thorLightningStrike(prev, ep, '#38bdf8');
        else if (this.vfx) this.vfx.spawnBranchedLightning(prev, ep, { color: 0x38bdf8, duration: 0.26, width: 0.28 });
        this.applyTargetHit(e, isFinisher ? 46 : 30, '#38bdf8', isFinisher);
        prev = ep;
      });
      if (isFinisher) {
        // 5 Rising 3D Lightning Spikes along forward impact line
        const spMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.9 });
        const spikes = new THREE.Group();
        for (let k = 0; k < 5; k++) {
          const sp = new THREE.Mesh(new THREE.ConeGeometry(0.32, 2.6 + k * 0.35, 5), spMat);
          const spPos = ps.pos.clone().addScaledVector(fwd, 2.4 + k * 1.9);
          sp.position.set(spPos.x, this.world.getGroundHeight(spPos.x, spPos.z) + 1.1, spPos.z);
          spikes.add(sp);
        }
        this.spawnPowerConstruct(spikes, 0.55, (c, dt, t) => { spMat.opacity = 1 - t; c.mesh.children.forEach((m, idx) => { m.scale.y = Math.min(1, t * 4) * (1 - t * 0.4); }); });
        if (this.vfxPro) this.vfxPro.vfx.thorLightningStrike(hitPos.clone().add(new THREE.Vector3(0, 18, 0)), hitPos, '#7dd3fc');
        this.spawnShockwave(hitPos, 0x06b6d4, 6.8, 0.35);
      }
    } else if (hero.id === 'reed_richards') {
      this.playerMesh.userData.elasticStretch = 1.0;
      const reachPos = handPos.clone().addScaledVector(fwd, isFinisher ? 8.2 : 5.8);
      if (this.vfx) {
        this.vfx.spawnVolumetricBeam(handPos, reachPos, { color: 0x38bdf8, coreColor: 0xe0f2fe, width: isFinisher ? 0.65 : 0.35, duration: 0.22 });
        this.vfx.emitBurst(reachPos, { color: 0x38bdf8, count: isFinisher ? 32 : 16, speed: 14 });
      }
      if (isFinisher) {
        const giantFist = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 0), new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.85 }));
        giantFist.position.copy(reachPos);
        this.spawnPowerConstruct(giantFist, 0.32, (c, dt, t) => { c.mesh.scale.setScalar(0.6 + t * 1.1); c.mesh.material.opacity = 1 - t; });
      }
      this.spawnSlashArc(reachPos, ps.yaw, 0xe0f2fe, 0x38bdf8, isFinisher ? 5.2 : 3.4, 0.15);
      this.applyAoEDamage(reachPos, isFinisher ? 5.8 : 3.8, isFinisher ? 96 : 56, '#38bdf8', isFinisher);
    } else if (hero.id === 'black_panther') {
      ps.heroResource = Math.min(100, (ps.heroResource || 0) + (isFinisher ? 16 : 9));
      this.playerMesh.userData.kineticCharge = ps.heroResource / 100;
      this.spawnSlashArc(handPos, ps.yaw, 0xf5d0fe, 0xa855f7, isFinisher ? 4.8 : 3.4, step === 2 ? -0.42 : 0.42);
      // Triple 3D Vibranium Claw Rends floating in the air
      const clawsGrp = new THREE.Group();
      const clMat = new THREE.MeshBasicMaterial({ color: 0xd8b4fe, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
      for (let c = -1; c <= 1; c++) {
        const arc = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 3.2), clMat);
        arc.position.set(c * 0.35, c * 0.22, 1.2);
        clawsGrp.add(arc);
      }
      clawsGrp.position.copy(handPos);
      clawsGrp.rotation.y = ps.yaw;
      clawsGrp.rotation.z = step === 2 ? -0.5 : 0.5;
      this.spawnPowerConstruct(clawsGrp, 0.28, (c, dt, t) => { clMat.opacity = 1 - t; c.mesh.scale.z = 1 + t * 0.5; });
      this.applyAoEDamage(handPos.clone().addScaledVector(fwd, 2.2), isFinisher ? 5.0 : 3.6, isFinisher ? 94 : 55, '#a855f7', isFinisher);
    } else if (hero.id === 'iron_man') {
      const endPoint = target
        ? target.pos.clone().add(new THREE.Vector3(0, target.ref && target.ref.type === 'sentinel' ? 5.0 : 1.6, 0))
        : handPos.clone().addScaledVector(fwd, 32);
      const offsets = isFinisher ? [-0.42, 0.42] : [step % 2 === 0 ? -0.3 : 0.3];
      offsets.forEach(side => {
        const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
        const origin = handPos.clone().addScaledVector(right, side);
        // Hexagonal Muzzle Ring
        const hex = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.42, 6), new THREE.MeshBasicMaterial({ color: 0x7dd3fc, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
        hex.position.copy(origin);
        hex.lookAt(endPoint);
        this.spawnPowerConstruct(hex, 0.22, (c, dt, t) => { c.mesh.scale.setScalar(1 + t * 1.4); c.mesh.material.opacity = 1 - t; });
        if (this.vfxPro) this.vfxPro.vfx.repulsorBlast(origin, endPoint.clone().sub(origin).normalize());
        if (this.vfx) this.vfx.spawnVolumetricBeam(origin, endPoint, { color: 0x38bdf8, coreColor: 0xffffff, width: isFinisher ? 0.62 : 0.38, duration: 0.24 });
      });
      if (isFinisher) {
        // Dual Shoulder Nano-Cannons hovering momentarily
        const podGrp = new THREE.Group();
        const goldM = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.92 });
        for (const s of [-1, 1]) {
          const can = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.75, 6), goldM);
          can.rotation.x = Math.PI / 2;
          can.position.set(s * 0.75, 0.65, 0.2);
          podGrp.add(can);
        }
        podGrp.position.copy(ps.pos).add(new THREE.Vector3(0, 1.4, 0));
        podGrp.rotation.y = ps.yaw;
        this.spawnPowerConstruct(podGrp, 0.35, (c, dt, t) => { goldM.opacity = 1 - t; });
      }
      if (target) {
        this.applyTargetHit(target, isFinisher ? 92 : 56, '#38bdf8', isFinisher);
        if (isFinisher) this.applyAoEDamage(endPoint, 4.0, 42, '#38bdf8', true);
      } else {
        this.applyAoEDamage(handPos.clone().addScaledVector(fwd, 8), 4.0, 46, '#38bdf8', isFinisher);
      }
    } else if (hero.id === 'captain_america') {
      this.spawnSlashArc(handPos, ps.yaw, 0xfef08a, 0x2563eb, isFinisher ? 4.8 : 3.6, step === 2 ? -0.35 : 0.25);
      const hitCenter = handPos.clone().addScaledVector(fwd, 2.4);
      this.applyAoEDamage(hitCenter, isFinisher ? 5.6 : 4.0, Math.round((isFinisher ? 96 : 56) * furyBonus), '#3b82f6', isFinisher);
      if (isFinisher) {
        // 3D Star Seal Stamp on ground!
        const star = new THREE.Mesh(new THREE.RingGeometry(1.2, 2.8, 5), new THREE.MeshBasicMaterial({ color: 0x60a5fa, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
        star.rotation.x = -Math.PI / 2;
        star.position.set(hitCenter.x, this.world.getGroundHeight(hitCenter.x, hitCenter.z) + 0.12, hitCenter.z);
        this.spawnPowerConstruct(star, 0.45, (c, dt, t) => { c.mesh.rotation.z += dt * 4; c.mesh.scale.setScalar(1 + t * 0.8); c.mesh.material.opacity = 1 - t; });
        this.spawnShockwave(hitCenter, 0x2563eb, 6.2, 0.34);
      }
      if (ps.capAuraTimer > 0 && this.vfx) {
        const proj = this.vfx.createEnergyProjectileMesh(0x3b82f6, 0xffffff, 1.3);
        proj.position.copy(handPos);
        this.scene.add(proj);
        this.projectiles.push({ mesh: proj, pos: handPos.clone(), vel: fwd.clone().multiplyScalar(36), dmg: 60, color: '#60a5fa', isPlayer: true, isHeavy: true, radius: 1.8, life: 1.1 });
      }
    } else if (hero.id === 'wolverine') {
      ps.heroResource = Math.min(100, (ps.heroResource || 0) + 12);
      ps.hp = Math.min(ps.maxHp, ps.hp + 4);
      this.spawnSlashArc(handPos, ps.yaw, 0xfef08a, 0xeab308, isFinisher ? 4.8 : 3.4, step === 2 ? -0.5 : 0.5);
      // 3D X-Cross Adamantium Slash Construct
      const xSlash = new THREE.Group();
      const xMat = new THREE.MeshBasicMaterial({ color: isFinisher ? 0xef4444 : 0xfacc15, transparent: true, opacity: 0.95 });
      for (const ang of [-0.65, 0.65]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 0.18), xMat);
        bar.rotation.z = ang;
        xSlash.add(bar);
      }
      xSlash.position.copy(handPos).addScaledVector(fwd, 1.6);
      xSlash.rotation.y = ps.yaw;
      this.spawnPowerConstruct(xSlash, 0.28, (c, dt, t) => { xMat.opacity = 1 - t; c.mesh.scale.setScalar(1 + t * 0.45); });
      if (this.vfxPro) this.vfxPro.vfx.clawSlash(handPos, fwd, isFinisher ? '#facc15' : '#e2e8f0');
      // Anime Crescent Waves (clean curved energy blades, zero clunky boxes)
      this._spawnCrescentWave(handPos.clone().addScaledVector(fwd, 1.5), ps.yaw, step === 2 ? -0.55 : 0.55, isFinisher ? 0xef4444 : 0xfacc15, 0xfef08a, 1.25, 0, 0);
      if (isFinisher || (ps.armaXTimer || 0) > 0) {
        this._spawnCrescentWave(handPos, ps.yaw, -0.65, 0xef4444, 0xfef08a, 1.45, 38, Math.round(52 * furyBonus));
        this._spawnCrescentWave(handPos, ps.yaw, 0.65, 0xef4444, 0xfef08a, 1.45, 38, Math.round(52 * furyBonus));
      }
      this.applyAoEDamage(handPos.clone().addScaledVector(fwd, 2.2), isFinisher ? 5.2 : 3.8, Math.round((isFinisher ? 88 : 52) * furyBonus), '#eab308', isFinisher);
    } else if (hero.id === 'scarlet_witch') {
      ps.heroResource = Math.min(100, (ps.heroResource || 0) + 10);
      const endPt = target ? target.pos.clone().add(new THREE.Vector3(0, 1.6, 0)) : handPos.clone().addScaledVector(fwd, 26);
      // Clean Anime Chaos Orb Burst (no wireframe octahedron)
      this._spawnCrescentWave(endPt, ps.yaw, 0.35, 0xe11d48, 0xfda4af, isFinisher ? 1.5 : 1.0, 0, 0);
      if (this.vfxPro) this.vfxPro.vfx.chaosOrb(endPt, '#e11d48');
      this._spawnStylizedBeam(handPos, endPt, 0xe11d48, isFinisher ? 0.26 : 0.18, 0.24);
      if (target) {
        this.applyTargetHit(target, isFinisher ? 84 : 54, '#e11d48', isFinisher);
        ps.hp = Math.min(ps.maxHp, ps.hp + 5);
        if (target.ref) {
          target.ref._hexStacks = (target.ref._hexStacks || 0) + 1;
          if (target.ref._hexStacks >= 3) {
            target.ref._hexStacks = 0;
            this.spawnShockwave(endPt, 0xe11d48, 7.0, 0.36);
            this.applyAoEDamage(endPt, 6.8, 78, '#f43f5e', true);
          }
        }
      } else {
        this.applyAoEDamage(handPos.clone().addScaledVector(fwd, 6), 4.2, 48, '#e11d48', isFinisher);
      }
    }
  };

  // SECONDARY UNIQUE (M2)
  const _origSecondary = DoomsdayGame.prototype.triggerSecondaryUnique;
  DoomsdayGame.prototype.triggerSecondaryUnique = function () {
    const hero = HEROES_DATA[this.selectedHeroId];
    const ps = this.playerState;

    // 1. Spider-Man: Dedicated M2 Web Zip / Pull (E = Web Swing)
    if (hero.id === 'spider_man') {
      if (ps.uniqueCooldown > 0) return;
      if (ps.isSwinging) this.releaseWebSwing(false);
      const tgt = this.findBestTarget(36);
      if (tgt) {
        ps.uniqueCooldown = 2.6;
        window.soundSystem.playWebSwing();
        const handPos = ps.pos.clone().add(new THREE.Vector3(0, 1.6, 0));
        const tgtCenter = tgt.pos.clone().add(new THREE.Vector3(0, 1.4, 0));
        if (this.vfx) this.vfx.spawnVolumetricBeam(handPos, tgtCenter, { color: 0xf8fafc, coreColor: 0xffffff, width: 0.18, duration: 0.25 });
        if (!tgt.isBoss && !tgt.ref.isMiniBoss && !tgt.ref.isEnergyTower && ps.isGrounded) {
          // Grounded Web Pull: yank Doombot in and trap it
          const toP = ps.pos.clone().sub(tgt.pos).setY(0).normalize();
          tgt.ref.pos.copy(ps.pos).addScaledVector(toP.negate(), 2.2);
          tgt.ref.webbedTimer = 2.4;
          this.applyTargetHit(tgt, 135, '#ef4444', true);
        } else {
          // Acrobatic Zip-Kick directly to enemy/Boss (works on ground and mid-air)
          const dir = tgt.pos.clone().sub(ps.pos).setY(0);
          const dist = dir.length();
          if (dist > 0.01) dir.normalize();
          this.safeTranslatePlayer(dir.x * Math.max(0, dist - 2.4), dir.z * Math.max(0, dist - 2.4));
          ps.vel.y = 8.0;
          ps.isGrounded = false;
          ps.jumpsRemaining = 1;
          this.spawnShockwave(tgt.pos, 0xef4444, 6.5, 0.34);
          this.applyTargetHit(tgt, 160, '#ef4444', true);
        }
        return;
      }
      // Point-Launch Web Zip when no enemy is locked
      ps.uniqueCooldown = 1.6;
      window.soundSystem.playWebSwing();
      const fwd = new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).multiplyScalar(-1);
      const handPos = ps.pos.clone().add(new THREE.Vector3(0, 1.6, 0));
      const zipTarget = handPos.clone().addScaledVector(fwd, 20).add(new THREE.Vector3(0, 1.5, 0));
      if (this.vfx) this.vfx.spawnVolumetricBeam(handPos, zipTarget, { color: 0xf8fafc, coreColor: 0xffffff, width: 0.16, duration: 0.22 });
      ps.yaw = Math.atan2(fwd.x, fwd.z);
      ps.vel.x = fwd.x * 34;
      ps.vel.z = fwd.z * 34;
      ps.vel.y = Math.max(ps.vel.y, 7.2);
      ps.isGrounded = false;
      this.applyHeroSquash(-0.18);
      return;
    }

    if (ps.uniqueCooldown > 0) return;

    // 2. Iron Man: 10 Jericho Homing Micro-Missiles + Red Target Reticles
    if (hero.id === 'iron_man') {
      ps.uniqueCooldown = 4.8;
      window.soundSystem.playSpecial();
      const enemies = this._getAllLivingEnemies();
      const fwd = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw));
      for (let i = 0; i < 10; i++) {
        const tgt = enemies.length ? enemies[i % enemies.length] : null;
        const start = ps.pos.clone().add(new THREE.Vector3((i % 2 === 0 ? -0.45 : 0.45), 2.1, 0));
        const vel = new THREE.Vector3((Math.random() - 0.5) * 14, 15 + Math.random() * 6, (Math.random() - 0.5) * 14).addScaledVector(fwd, 12);
        const mMesh = this.vfx ? this.vfx.createEnergyProjectileMesh(0xf97316, 0xfef08a, 0.9) : new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
        mMesh.position.copy(start);
        this.scene.add(mMesh);
        this.activeHomingMissiles.push({ mesh: mMesh, pos: start, vel, target: tgt, life: 3.0, delay: i * 0.045, dmg: 88 });
        if (tgt && i < 4) {
          const ret = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.3, 6), new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
          ret.rotation.x = -Math.PI / 2;
          ret.position.set(tgt.pos.x, this.world.getGroundHeight(tgt.pos.x, tgt.pos.z) + 0.14, tgt.pos.z);
          this.spawnPowerConstruct(ret, 0.85, (c, dt, t) => { c.mesh.rotation.z += dt * 5; c.mesh.scale.setScalar(1.3 - t * 0.6); c.mesh.material.opacity = 1 - t; });
        }
      }
      this.triggerEventBanner('BARRAGEM DE 10 MICRO-MÍSSEIS JERICHO', '#f97316');
      return;
    }

    // 3. Captain America: Chain-Ricochet Shield across up to 5 enemies!
    if (hero.id === 'captain_america') {
      ps.uniqueCooldown = 4.2;
      window.soundSystem.playSpecial();
      const shieldMesh = CharacterBuilder.buildCapShieldMesh();
      const origin = ps.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
      shieldMesh.position.copy(origin);
      this.scene.add(shieldMesh);
      const first = this.findBestTarget(34);
      const fwd = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw));
      this.activeShieldChains.push({
        mesh: shieldMesh,
        pos: origin,
        target: first,
        dir: first ? first.pos.clone().sub(origin).normalize() : fwd,
        bouncesLeft: 5,
        hitRefs: new Set(),
        returning: false,
        life: 4.5,
        dmg: 145
      });
      return;
    }

    // 4. Black Panther: Spirit Rend with 3D Panther Jaw Projection & Bast Mark Reset
    if (hero.id === 'black_panther') {
      const fwd = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw));
      const tgt = this.findBestTarget(24);
      const wasMarked = tgt && tgt.ref && tgt.ref.markedTimer > 0;
      ps.uniqueCooldown = wasMarked ? 1.5 : 4.6;
      ps.invulnTimer = 0.4;
      window.soundSystem.playDash();
      const dashDist = tgt ? Math.min(tgt.dist + 2, 16) : 13;
      const start = ps.pos.clone().add(new THREE.Vector3(0, 1.3, 0));
      if (tgt) {
        const d = tgt.pos.clone().sub(ps.pos).setY(0).normalize();
        ps.yaw = Math.atan2(d.x, d.z);
        this.safeTranslatePlayer(d.x * dashDist, d.z * dashDist);
      } else {
        this.safeTranslatePlayer(fwd.x * dashDist, fwd.z * dashDist);
      }
      const end = ps.pos.clone().add(new THREE.Vector3(0, 1.3, 0));
      this._spawnStylizedBeam(start, end, 0xa855f7, 0.32, 0.28);
      this._spawnCrescentWave(end, ps.yaw, 0.45, 0xa855f7, 0xf5d0fe, 1.6, 0, 0);
      this._spawnCrescentWave(end, ps.yaw, -0.45, 0xa855f7, 0xf5d0fe, 1.6, 0, 0);
      this.spawnShockwave(ps.pos, 0xa855f7, 7.5, 0.36);
      if (tgt) {
        if (wasMarked) {
          tgt.ref.markedTimer = 0;
          this.applyTargetHit(tgt, 145, '#d8b4fe', true);
          this.triggerEventBanner('MARCA DE BAST CONSUMIDA // RECARGA RÁPIDA!', '#c084fc');
        } else {
          tgt.ref.markedTimer = 7.0;
          this.applyTargetHit(tgt, 88, '#a855f7', true);
        }
      }
      ps.heroResource = Math.min(100, (ps.heroResource || 0) + 25);
      return;
    }

    // 5. Scarlet Witch: Chthonian Dual-Ring Singularity
    if (hero.id === 'scarlet_witch') {
      ps.uniqueCooldown = 5.5;
      window.soundSystem.playSpecial();
      const tgt = this.findBestTarget(30);
      const fwd = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw));
      const spot = tgt ? tgt.pos.clone().add(new THREE.Vector3(0, 1.8, 0)) : ps.pos.clone().addScaledVector(fwd, 14).add(new THREE.Vector3(0, 1.8, 0));
      const orbGrp = new THREE.Group();
      orbGrp.add(new THREE.Mesh(new THREE.SphereGeometry(1.05, 14, 14), new THREE.MeshBasicMaterial({ color: 0x090b15 })));
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 6, 20), new THREE.MeshBasicMaterial({ color: 0xe11d48 }));
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.06, 6, 20), new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
      r2.rotation.x = Math.PI / 2;
      orbGrp.add(r1, r2);
      orbGrp.position.copy(spot);
      this.scene.add(orbGrp);
      this.activeSingularities.push({ mesh: orbGrp, pos: spot, timer: 2.5, radius: 14.0, color: 0xe11d48, dmg: 265 });
      this.triggerEventBanner('SINGULARIDADE CHTHONIANA ATIVADA', '#e11d48');
      return;
    }

    // 6. Reed Richards: Dual Elastic Side Arms Smash
    if (hero.id === 'reed_richards') {
      ps.uniqueCooldown = 4.2;
      window.soundSystem.playSpecial();
      const fwd = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw));
      const focus = ps.pos.clone().addScaledVector(fwd, 7.5).add(new THREE.Vector3(0, 1.5, 0));
      const armMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.92 });
      const clapGrp = new THREE.Group();
      for (const s of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 5.2, 8), armMat);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(s * 3.8, 0, 0);
        clapGrp.add(arm);
      }
      clapGrp.position.copy(focus);
      clapGrp.rotation.y = ps.yaw;
      this.spawnPowerConstruct(clapGrp, 0.45, (c, dt, t) => {
        c.mesh.children[0].position.x = -3.8 * (1 - t);
        c.mesh.children[1].position.x = 3.8 * (1 - t);
        armMat.opacity = 1 - t * 0.8;
      });
      this.applyAoEDamage(focus, 7.2, 185, '#38bdf8', true);
      return;
    }

    // 7. Wolverine: Ferocious Leap + Embedded Crimson X-Bomb
    if (hero.id === 'wolverine') {
      ps.uniqueCooldown = 4.0;
      window.soundSystem.playAttack('adamantium');
      const tgt = this.findBestTarget(24);
      const fwd = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw));
      const dest = tgt ? tgt.pos.clone() : ps.pos.clone().addScaledVector(fwd, 12);
      const dVec = dest.clone().sub(ps.pos).setY(0);
      this.safeTranslatePlayer(dVec.x * 0.85, dVec.z * 0.85);
      ps.vel.y = 7.5; ps.isGrounded = false;
      const xBomb = new THREE.Group();
      const bMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.95 });
      for (const a of [-0.7, 0.7]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.2, 0.22), bMat);
        bar.rotation.z = a;
        xBomb.add(bar);
      }
      xBomb.position.copy(dest).add(new THREE.Vector3(0, 1.6, 0));
      this.spawnPowerConstruct(xBomb, 0.48, (c, dt, t) => { c.mesh.rotation.y += dt * 6; c.mesh.scale.setScalar(1 + t * 0.6); }, (c) => {
        this.spawnShockwave(c.mesh.position, 0xef4444, 7.5, 0.35);
        this.applyAoEDamage(c.mesh.position, 6.8, 180, '#ef4444', true);
      });
      if (tgt) this.applyTargetHit(tgt, 130, '#eab308', true);
      return;
    }

    // Strange & Thor use base M2 + 4 spinning runic rings around Strange beam
    if (hero.id === 'doctor_strange') {
      const tgt = this.findBestTarget(34);
      if (tgt) {
        const origin = ps.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
        const end = tgt.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
        const rMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
        const rings = new THREE.Group();
        for (let i = 1; i <= 4; i++) {
          const r = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.75, 6), rMat);
          r.position.lerpVectors(origin, end, i / 5);
          r.lookAt(end);
          rings.add(r);
        }
        this.spawnPowerConstruct(rings, 0.65, (c, dt, t) => { c.mesh.children.forEach((r, idx) => { r.rotation.z += dt * (idx % 2 ? 6 : -6); }); rMat.opacity = 1 - t; });
      }
    }
    _origSecondary.call(this);
  };

  // SPECIAL SKILL (Q)
  DoomsdayGame.prototype.triggerSpecialSkill = function () {
    const ps = this.playerState;
    if (ps.skillCooldown > 0) return;
    const hero = HEROES_DATA[this.selectedHeroId];
    ps.skillCooldown = 6.0;
    this.playerMesh.userData.skillTimer = 1.0;
    this.addTrauma(0.45);
    window.soundSystem.playSpecial();
    const pPos = ps.pos;
    const fwd = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw));

    if (hero.id === 'spider_man') {
      // 3D Octagonal Web Dome Prison on Ground + Cross Blades
      const webDome = new THREE.Group();
      const wMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
      for (let r = 3; r <= 11; r += 4) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.16, r, 8), wMat);
        ring.rotation.x = -Math.PI / 2;
        webDome.add(ring);
      }
      for (let k = 0; k < 8; k++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 22), wMat);
        spoke.rotation.y = (k / 8) * Math.PI;
        webDome.add(spoke);
      }
      webDome.position.copy(pPos).add(new THREE.Vector3(0, 0.18, 0));
      this.spawnPowerConstruct(webDome, 2.2, (c, dt, t) => { c.mesh.rotation.y += dt * 0.6; wMat.opacity = Math.max(0, 0.9 * (1 - t)); });
      this.spawnShockwave(pPos, 0xfbbf24, 11.5, 0.45);
      if (this.vfx) this.vfx.emitBurst(pPos.clone().add(new THREE.Vector3(0, 1.4, 0)), { color: 0xf8fafc, count: 60, speed: 18 });
      this.doombots.forEach(b => {
        if (!b.dead && b.pos.distanceTo(pPos) < 12) b.webbedTimer = 3.5;
      });
      this.applyAoEDamage(pPos, 11.5, 235, '#ef4444', true);
    } else if (hero.id === 'doctor_strange') {
      // 6 Crimson Pillars of Cyttorak + Rotating Golden Geodesic Seraphim Sphere
      const vortexPos = pPos.clone().addScaledVector(fwd, 6.5);
      const cMat = new THREE.MeshBasicMaterial({ color: 0xe11d48, transparent: true, opacity: 0.88 });
      const bands = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 8.5, 6), cMat);
        pil.position.set(Math.cos(ang) * 7.5, 4.2, Math.sin(ang) * 7.5);
        pil.rotation.z = Math.cos(ang) * 0.35;
        pil.rotation.x = -Math.sin(ang) * 0.35;
        bands.add(pil);
      }
      bands.position.copy(vortexPos);
      this.spawnPowerConstruct(bands, 1.2, (c, dt, t) => { c.mesh.rotation.y += dt * 3.5; c.mesh.scale.setScalar(1.2 - t * 0.7); cMat.opacity = 1 - t; });

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(2.1, 18, 14),
        CustomShaders.createEnergyShieldMaterial(0xfbbf24)
      );
      sphere.position.copy(pPos).add(new THREE.Vector3(0, 1.5, 0));
      this.spawnPowerConstruct(sphere, 4.0, (c, dt, t) => { c.mesh.position.copy(ps.pos).add(new THREE.Vector3(0, 1.5, 0)); c.mesh.rotation.y += dt * 1.8; });

      this._getAllLivingEnemies().forEach(e => {
        if (!e.isBoss && !e.ref.isMiniBoss && !e.ref.isEnergyTower && e.pos.distanceTo(pPos) < 15) {
          e.pos.lerp(vortexPos, 0.72);
        }
      });
      ps.shieldActive = true;
      ps.shieldTimer = 4.2;
      if (ps.shieldMesh && ps.shieldMesh.parent) ps.shieldMesh.parent.remove(ps.shieldMesh);
      const shield = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 3.5), CustomShaders.createEldritchMandalaMaterial(0xf59e0b));
      shield.position.set(0, 1.4, 1.3);
      this.playerMesh.add(shield);
      ps.shieldMesh = shield;
      this.applyAoEDamage(vortexPos, 11.0, 225, '#f59e0b', true);
    } else if (hero.id === 'thor') {
      // 6 Solid 3D Lightning Pillars Cage
      ps.vel.y = 14;
      ps.isGrounded = false;
      this.spawnShockwave(pPos, 0x38bdf8, 12.5, 0.45);
      const cage = new THREE.Group();
      const lMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.92 });
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const strike = pPos.clone().add(new THREE.Vector3(Math.cos(ang) * 7.2, 0, Math.sin(ang) * 7.2));
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 22, 6), lMat);
        col.position.set(strike.x, strike.y + 11, strike.z);
        cage.add(col);
        if (this.vfx) this.vfx.spawnBranchedLightning(strike.clone().add(new THREE.Vector3(0, 22, 0)), strike, { color: 0x38bdf8, duration: 0.38, width: 0.42 });
      }
      this.spawnPowerConstruct(cage, 0.65, (c, dt, t) => { lMat.opacity = 1 - t; c.mesh.children.forEach(m => { m.scale.x = m.scale.z = 1 - t * 0.5; }); });
      this.applyAoEDamage(pPos, 12.5, 290, '#06b6d4', true);
    } else if (hero.id === 'reed_richards') {
      // Spinning Elastic Blade Ring around Reed
      const ring = new THREE.Group();
      const eMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88 });
      for (let i = 0; i < 4; i++) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.32, 0.55), eMat);
        arm.rotation.y = (i / 4) * Math.PI;
        ring.add(arm);
      }
      ring.position.copy(pPos).add(new THREE.Vector3(0, 1.3, 0));
      this.spawnPowerConstruct(ring, 1.8, (c, dt, t) => { c.mesh.position.copy(ps.pos).add(new THREE.Vector3(0, 1.3, 0)); c.mesh.rotation.y += dt * 16; eMat.opacity = 1 - t * 0.6; });
      this.activeChannels.push({ type: 'reed_spin', timer: 1.8, tickCd: 0 });
    } else if (hero.id === 'black_panther') {
      const charge = (ps.heroResource || 25) / 100;
      ps.heroResource = 0;
      this.playerMesh.userData.kineticCharge = 0;
      const dmg = Math.round(210 + charge * 320);
      this.spawnShockwave(pPos, 0xa855f7, 13.0, 0.48);
      // Translucent Vibranium Energy Dome (no wireframe) + 8 Radial Spears
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 20, 14),
        CustomShaders.createEnergyShieldMaterial(0xc084fc)
      );
      dome.position.copy(pPos).add(new THREE.Vector3(0, 0.8, 0));
      this.spawnPowerConstruct(dome, 0.55, (c, dt, t) => { c.mesh.scale.setScalar(1 + t * 7.5); });
      const spMat = new THREE.MeshBasicMaterial({ color: 0xd8b4fe });
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
        const spear = new THREE.Mesh(new THREE.ConeGeometry(0.18, 2.2, 5), spMat);
        spear.rotation.x = Math.PI / 2;
        spear.position.copy(pPos).add(new THREE.Vector3(0, 1.5, 0));
        spear.lookAt(pPos.clone().add(new THREE.Vector3(0, 1.5, 0)).add(dir));
        this.scene.add(spear);
        this.projectiles.push({ mesh: spear, pos: spear.position.clone(), vel: dir.multiplyScalar(32), dmg: 110, color: '#c084fc', isPlayer: true, isHeavy: true, radius: 1.4, life: 0.9 });
      }
      this.applyAoEDamage(pPos, 13.0, dmg, '#a855f7', true);
    } else if (hero.id === 'iron_man') {
      // Orbital 4 Nano-Cannons + Veronica Winged Drone (9s) + Expanding EMP Sphere
      if (this.activeOrbitalDrone && this.activeOrbitalDrone.mesh.parent) this.scene.remove(this.activeOrbitalDrone.mesh);
      const droneGrp = new THREE.Group();
      droneGrp.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), new THREE.MeshBasicMaterial({ color: 0x38bdf8 })));
      for (const s of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.35), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        w.position.x = s * 0.65;
        droneGrp.add(w);
      }
      for (let k = 0; k < 4; k++) {
        const ang = (k / 4) * Math.PI * 2;
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.85, 6), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        pod.rotation.x = Math.PI / 2;
        pod.position.set(Math.cos(ang) * 1.4, Math.sin(ang) * 0.8, -0.35);
        droneGrp.add(pod);
      }
      droneGrp.position.copy(pPos).add(new THREE.Vector3(1.2, 2.8, 0));
      this.scene.add(droneGrp);
      this.activeOrbitalDrone = { mesh: droneGrp, timer: 9.0, fireCd: 0.1 };
      const emp = new THREE.Mesh(
        new THREE.SphereGeometry(2.0, 20, 14),
        CustomShaders.createEnergyShieldMaterial(0x38bdf8)
      );
      emp.position.copy(pPos).add(new THREE.Vector3(0, 1.2, 0));
      this.spawnPowerConstruct(emp, 0.55, (c, dt, t) => { c.mesh.scale.setScalar(1 + t * 5.0); });
      this.doombots.forEach(b => { if (!b.dead && b.pos.distanceTo(pPos) < 12) b.staggerTimer = Math.max(b.staggerTimer, 2.5); });
      this.applyAoEDamage(pPos, 11.5, 240, '#38bdf8', true);
      this.triggerEventBanner('DRONE ORBITAL + PULSO EMP ATIVADO (9S)', '#38bdf8');
    } else if (hero.id === 'captain_america') {
      // Shielded Patriot Charge with Giant 3D Curved Holographic Shield Wall
      ps.shieldActive = true;
      ps.shieldTimer = 2.6;
      ps.invulnTimer = 1.2;
      const wallMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 2.6, 12, 1, true, -Math.PI * 0.4, Math.PI * 0.8), wallMat);
      wall.position.copy(pPos).add(new THREE.Vector3(0, 1.5, 0));
      this.spawnPowerConstruct(wall, 0.95, (c, dt, t) => {
        c.mesh.position.copy(ps.pos).add(new THREE.Vector3(0, 1.5, 0));
        c.mesh.rotation.y = ps.yaw;
        wallMat.opacity = 0.72 * (1 - t * 0.5);
      });
      this.activeChannels.push({ type: 'cap_charge', timer: 0.95, tickCd: 0 });
    } else if (hero.id === 'wolverine') {
      // Twin Spinning Crescent Tornado Blades around Wolverine
      ps.invulnTimer = 0.9;
      const drill = new THREE.Group();
      const s1 = this._spawnCrescentWave(new THREE.Vector3(), 0, 0.4, 0xfacc15, 0xfef08a, 1.5, 0, 0);
      const s2 = this._spawnCrescentWave(new THREE.Vector3(), Math.PI, -0.4, 0xef4444, 0xfef08a, 1.5, 0, 0);
      drill.add(s1, s2);
      drill.position.copy(pPos).add(new THREE.Vector3(0, 1.3, 0));
      this.spawnPowerConstruct(drill, 1.0, (c, dt, t) => {
        c.mesh.position.copy(ps.pos).add(new THREE.Vector3(0, 1.3, 0));
        c.mesh.rotation.y += dt * 16;
      });
      this.activeChannels.push({ type: 'wolv_drill', timer: 1.0, tickCd: 0 });
    } else if (hero.id === 'scarlet_witch') {
      // Telekinetic Storm: 6 floating chaos monoliths firing sequentially + Hex Shield
      ps.shieldActive = true;
      ps.shieldTimer = 4.0;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.52, 0),
          CharacterBuilder.stylized(0xbe123c, { emissive: 0xe11d48, emissiveIntensity: 1.6 })
        );
        rock.position.copy(pPos).add(new THREE.Vector3(Math.cos(ang) * 2.4, 2.5, Math.sin(ang) * 2.4));
        this.scene.add(rock);
        this.activeWandaRocks.push({ mesh: rock, angle: ang, fireDelay: 0.22 + i * 0.2, fired: false, vel: new THREE.Vector3(), life: 3.0 });
      }
      this.spawnShockwave(pPos, 0xe11d48, 10.5, 0.42);
      this.applyAoEDamage(pPos, 10.5, 220, '#e11d48', true);
    }
  };

  // ULTIMATE POWERS (R) — SIGNATURE CINEMATIC GPU SHOWSTOPPERS
  DoomsdayGame.prototype.triggerUltimate = function () {
    const ps = this.playerState;
    if (ps.ultCharge < 100) return;
    const hero = HEROES_DATA[this.selectedHeroId];
    ps.ultCharge = 0;
    ps.invulnTimer = 2.4;
    this.chromaPulse = 0.22;
    this.addTrauma(0.65);
    this.triggerEventBanner(hero.ultName.toUpperCase(), hero.color);
    window.soundSystem.playUltimate();
    const pPos = ps.pos;

    if (hero.id === 'spider_man') {
      const targets = this._getAllLivingEnemies().filter(e => e.pos.distanceTo(pPos) < 28).slice(0, 8);
      if (targets.length === 0) targets.push({ pos: pPos.clone().add(new THREE.Vector3(0, 0, -6)), isBoss: false, ref: null });
      this.maxSpiderSteps = [];
      for (let i = 0; i < 8; i++) {
        this.maxSpiderSteps.push({ target: targets[i % targets.length], delay: i * 0.14 });
      }
    } else if (hero.id === 'doctor_strange') {
      // Eye of Agamotto: 3D Giant Astral Time Clock + 3 Green Astral Silhouettes!
      this.timeFreezeTimer = 4.5;
      this.spawnShockwave(pPos, 0x10b981, 24, 0.65);
      const clockGrp = new THREE.Group();
      const gMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
      const oMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(9, 0.22, 6, 24), oMat);
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(13, 0.18, 6, 24), gMat);
      const r3 = new THREE.Mesh(new THREE.RingGeometry(15, 16, 12), oMat);
      clockGrp.add(r1, r2, r3);
      clockGrp.position.copy(pPos).add(new THREE.Vector3(0, 8, 0));
      this.spawnPowerConstruct(clockGrp, 4.2, (c, dt, t) => {
        r1.rotation.x += dt * 1.8; r1.rotation.y += dt * 1.2;
        r2.rotation.y -= dt * 2.2; r2.rotation.z += dt * 1.5;
        r3.rotation.x = Math.PI / 2; r3.rotation.z += dt * 1.0;
        gMat.opacity = oMat.opacity = Math.max(0, 1 - Math.max(0, t - 0.7) * 3.3);
      });
      const enemies = this._getAllLivingEnemies().filter(e => e.pos.distanceTo(pPos) < 34);
      for (let c = 0; c < 3; c++) {
        const ang = (c / 3) * Math.PI * 2;
        const clonePos = pPos.clone().add(new THREE.Vector3(Math.cos(ang) * 5.0, 2.4, Math.sin(ang) * 5.0));
        const clone = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.2, 8), new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.8 }));
        clone.position.copy(clonePos);
        this.spawnPowerConstruct(clone, 1.5, (cl, dt, t) => { cl.mesh.material.opacity = 0.8 * (1 - t); });
        if (this.vfx) {
          this.vfx.emitRing(clonePos, 2.5, { color: 0xf59e0b, count: 24, speed: 6 });
          const tgt = enemies[c % Math.max(1, enemies.length)];
          const endPt = tgt ? tgt.pos.clone().add(new THREE.Vector3(0, 1.5, 0)) : pPos.clone().add(new THREE.Vector3(0, 1.5, -14));
          this.vfx.spawnVolumetricBeam(clonePos, endPt, { color: 0xf59e0b, coreColor: 0xffffff, width: 0.85, duration: 1.4 });
        }
      }
      this.applyAoEDamage(pPos, 24, 520, '#f59e0b', true);
    } else if (hero.id === 'thor') {
      // Prismatic Bifrost Rainbow Tube + Ground Rune Ring
      if (this.vfxPro) this.vfxPro.vfx.thorBifrostColumn(pPos);
      const bifrost = new THREE.Group();
      const cols = [0x38bdf8, 0xa855f7, 0xfacc15];
      cols.forEach((col, idx) => {
        const cyl = new THREE.Mesh(
          new THREE.CylinderGeometry(3.2 + idx * 1.4, 3.2 + idx * 1.4, 34, 8, 1, true),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        cyl.position.y = 17;
        bifrost.add(cyl);
      });
      bifrost.position.copy(pPos);
      // Orbiting Stormbreaker Axe + Mjolnir shredding nearby foes during Bifrost Storm!
      const stormGrp = new THREE.Group();
      const sAxe = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.95), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      sAxe.position.set(4.5, 1.8, 0);
      const sHammer = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.30, 0.72), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      sHammer.position.set(-4.5, 1.8, 0);
      stormGrp.add(sAxe, sHammer);
      stormGrp.position.copy(pPos);
      this.spawnPowerConstruct(stormGrp, 2.2, (c, dt, t) => {
        c.mesh.position.copy(ps.pos);
        c.mesh.rotation.y += dt * 11;
      });
      this.spawnPowerConstruct(bifrost, 2.2, (c, dt, t) => { c.mesh.rotation.y += dt * 4; });
      this.activeChannels.push({ type: 'thor_bifrost', timer: 2.2, tickCd: 0 });
    } else if (hero.id === 'reed_richards') {
      const center = pPos.clone().add(new THREE.Vector3(0, 3.2, 0));
      if (this.vfxPro) this.vfxPro.vfx.hexSingularity(center);
      const negGrp = new THREE.Group();
      negGrp.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 1), new THREE.MeshBasicMaterial({ color: 0x090b15 })));
      negGrp.add(new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.14, 6, 16), new THREE.MeshBasicMaterial({ color: 0x38bdf8 })));
      negGrp.position.copy(center);
      this.scene.add(negGrp);
      this.activeSingularities.push({ mesh: negGrp, pos: center, timer: 2.0, radius: 22.0, color: 0x38bdf8, dmg: 580 });
    } else if (hero.id === 'black_panther') {
      // Avatar of Bast: Sculpted Spectral Low-Poly Panther Leaping Forward!
      ps.uniqueCooldown = 0;
      ps.heroResource = 100;
      const fwd = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw));
      const panth = this._buildSpectralPantherMesh(0xa855f7);
      panth.position.copy(pPos).add(new THREE.Vector3(0, 1.9, 0));
      panth.rotation.y = ps.yaw;
      this.spawnPowerConstruct(panth, 0.9, (c, dt, t) => {
        c.mesh.position.addScaledVector(fwd, 32 * dt);
        if (c.mesh.userData.fadeMat && c.mesh.userData.fadeMat.uniforms?.uOpacity) {
          c.mesh.userData.fadeMat.uniforms.uOpacity.value = 0.85 * (1 - t);
        }
      });
      if (this.vfxPro) this.vfxPro.vfx.impactBurst(pPos.clone().add(new THREE.Vector3(0, 1.4, 0)), '#a855f7', 'large');
      this._getAllLivingEnemies().forEach(e => {
        if (e.pos.distanceTo(pPos) < 26 && e.ref) e.ref.markedTimer = 9.0;
      });
      this.applyAoEDamage(pPos.clone().addScaledVector(fwd, 10), 22, 540, '#a855f7', true);
    } else if (hero.id === 'iron_man') {
      // Colossal 3D Proton Cannon + Floating Nano-Wing Cannons Overdrive!
      const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
      if (this.vfxPro) this.vfxPro.vfx.unibeam(pPos.clone().add(new THREE.Vector3(0, 1.7, 0)), camDir, 2.4);
      const wings = new THREE.Group();
      const wMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.92 });
      const cMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88 });
      const protonBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.54, 3.2, 8), wMat);
      protonBarrel.rotation.x = Math.PI / 2;
      protonBarrel.position.set(0.65, 0.55, 1.1);
      const protonRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.09, 6, 16), cMat);
      protonRing.position.set(0.65, 0.55, 2.5);
      wings.add(protonBarrel, protonRing);
      for (const s of [-1, 1]) {
        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 2.0, 6), wMat);
        can.rotation.x = Math.PI / 2;
        can.position.set(s * 1.45, 0.35, 0.4);
        wings.add(can);
      }
      wings.position.copy(pPos).add(new THREE.Vector3(0, 1.8, 0));
      this.spawnPowerConstruct(wings, 2.4, (c, dt, t) => {
        c.mesh.position.copy(ps.pos).add(new THREE.Vector3(0, 1.8, 0));
        c.mesh.rotation.y = ps.yaw;
        protonRing.rotation.z += dt * 12;
      });
      this.activeChannels.push({ type: 'unibeam', timer: 2.4, tickCd: 0 });
    } else if (hero.id === 'captain_america') {
      // Avengers Assemble! 16m Giant Star Seal Pulsing on Arena
      ps.hp = Math.min(ps.maxHp, ps.hp + 180);
      ps.capAuraTimer = 8.0;
      const seal = new THREE.Mesh(new THREE.RingGeometry(12, 16, 5), new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide, transparent: true, opacity: 0.78 }));
      seal.rotation.x = -Math.PI / 2;
      seal.position.set(pPos.x, this.world.getGroundHeight(pPos.x, pPos.z) + 0.16, pPos.z);
      this.spawnPowerConstruct(seal, 8.0, (c, dt, t) => { c.mesh.rotation.z += dt * 1.4; c.mesh.material.opacity = 0.78 * (1 - t * 0.6); });
      this.spawnShockwave(pPos, 0x3b82f6, 22, 0.7);
      if (this.vfxPro) this.vfxPro.vfx.impactBurst(pPos.clone().add(new THREE.Vector3(0, 1.4, 0)), '#3b82f6', 'large');
      this.applyAoEDamage(pPos, 22, 520, '#3b82f6', true);
    } else if (hero.id === 'wolverine') {
      // Arma-X Arena of 12 Giant Slashing X-Blades
      ps.heroResource = 100;
      ps.armaXTimer = 6.0;
      ps.hp = Math.min(ps.maxHp, ps.hp + Math.round(ps.maxHp * 0.45));
      const arena = new THREE.Group();
      const bMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.92 });
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 7.5, 0.35), bMat);
        blade.position.set(Math.cos(ang) * 7.5, 2.5, Math.sin(ang) * 7.5);
        blade.rotation.z = (i % 2 ? 0.65 : -0.65);
        blade.rotation.y = ang;
        arena.add(blade);
      }
      arena.position.copy(pPos);
      this.spawnPowerConstruct(arena, 1.1, (c, dt, t) => { c.mesh.rotation.y += dt * 8; bMat.opacity = 1 - t; });
      if (this.vfxPro) this.vfxPro.vfx.berserkerAura(pPos, 2.4);
      this.applyAoEDamage(pPos, 18, 560, '#eab308', true);
    } else if (hero.id === 'scarlet_witch') {
      // Rewrite Reality: 3D Chthonian Hexagram + Floating Crimson Shards
      if (this.vfxPro) this.vfxPro.vfx.hexSingularity(pPos.clone().add(new THREE.Vector3(0, 2.0, 0)));
      const hex = new THREE.Group();
      const hMat = new THREE.MeshBasicMaterial({ color: 0xe11d48, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
      const tri1 = new THREE.Mesh(new THREE.RingGeometry(8, 9.2, 3), hMat);
      const tri2 = new THREE.Mesh(new THREE.RingGeometry(8, 9.2, 3), hMat);
      tri1.rotation.x = -Math.PI / 2; tri2.rotation.x = -Math.PI / 2; tri2.rotation.z = Math.PI;
      hex.add(tri1, tri2);
      for (let s = 0; s < 10; s++) {
        const sh = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), hMat);
        const a = (s / 10) * Math.PI * 2;
        sh.position.set(Math.cos(a) * 6, 2.5 + (s % 3) * 1.4, Math.sin(a) * 6);
        hex.add(sh);
      }
      hex.position.copy(pPos).add(new THREE.Vector3(0, 0.25, 0));
      this.spawnPowerConstruct(hex, 1.15, (c, dt, t) => { c.mesh.rotation.y += dt * 2.5; c.mesh.scale.setScalar(1 + t * 1.8); hMat.opacity = 1 - t * 0.4; });
      this.activeChannels.push({ type: 'wanda_ult', timer: 1.05, tickCd: 0, finished: false });
    }
  };

  // ==========================================================================
  // 5. PER-FRAME ACTIVE POWER SIMULATION (CHANNELS, HOMING, SINGULARITIES, TRAILS)
  // ==========================================================================
  DoomsdayGame.prototype.updatePlayer = function (delta, time) {
    _origUpdatePlayer.call(this, delta, time);
    const ps = this.playerState;

    if (this.timeFreezeTimer > 0) this.timeFreezeTimer = Math.max(0, this.timeFreezeTimer - delta);
    if (ps.capAuraTimer > 0) ps.capAuraTimer = Math.max(0, ps.capAuraTimer - delta);
    if (ps.armaXTimer > 0) {
      ps.armaXTimer = Math.max(0, ps.armaXTimer - delta);
      if (ps.hp < 1) ps.hp = 1;
      ps.hp = Math.min(ps.maxHp, ps.hp + delta * 24);
    }
    if (this.selectedHeroId === 'wolverine') {
      ps.hp = Math.min(ps.maxHp, ps.hp + delta * 12);
      ps.heroResource = Math.max(0, (ps.heroResource || 0) - delta * 4.5);
    }

    // Weapon Trails attached to hands during attacks/dashes/channels
    if (this.vfx && this.playerMesh && this.playerMesh.userData.parts) {
      const parts = this.playerMesh.userData.parts;
      const activeTrail = this.playerMesh.userData.attackTimer > 0.1 || this.playerMesh.userData.dashTimer > 0 || !!this.playerMesh.userData.channelType;
      const wp = new THREE.Vector3();
      if (parts.handL && this.trailL) {
        parts.handL.getWorldPosition(wp);
        this.vfx.pushTrailPoint(this.trailL, wp, activeTrail);
      }
      if (parts.handR && this.trailR) {
        parts.handR.getWorldPosition(wp);
        this.vfx.pushTrailPoint(this.trailR, wp, activeTrail);
      }
    }

    // Update Active Channeled Powers
    this.playerMesh.userData.channelType = null;
    for (let i = this.activeChannels.length - 1; i >= 0; i--) {
      const ch = this.activeChannels[i];
      ch.timer -= delta;
      ch.tickCd -= delta;
      this.playerMesh.userData.channelType = ch.type;

      if (ch.type === 'unibeam') {
        const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
        ps.yaw = Math.atan2(camDir.x, camDir.z);
        const start = ps.pos.clone().add(new THREE.Vector3(0, 1.75, 0));
        const end = start.clone().addScaledVector(camDir, 36);
        if (ch.tickCd <= 0) {
          ch.tickCd = 0.14;
          this._spawnStylizedBeam(start, end, 0x38bdf8, 0.42, 0.18);
          if (this.vfx) {
            this.vfx.emitBurst(start.clone().addScaledVector(camDir, 12), { color: 0x38bdf8, count: 10, speed: 12 });
          }
          // Damage enemies along Unibeam ray
          this._getAllLivingEnemies().forEach(e => {
            const toE = e.pos.clone().add(new THREE.Vector3(0, 1.5, 0)).sub(start);
            const proj = toE.dot(camDir);
            if (proj > 0 && proj < 38) {
              const perp = toE.clone().addScaledVector(camDir, -proj).length();
              if (perp < 3.4) this.applyTargetHit(e, 72, '#38bdf8', true);
            }
          });
        }
      } else if (ch.type === 'thor_bifrost') {
        if (ch.tickCd <= 0) {
          ch.tickCd = 0.16;
          if (this.vfx) {
            this.vfx.spawnVolumetricBeam(ps.pos.clone().add(new THREE.Vector3(0, 32, 0)), ps.pos, { color: 0x06b6d4, coreColor: 0xffffff, width: 3.4, duration: 0.22 });
            const enemies = this._getAllLivingEnemies().filter(e => e.pos.distanceTo(ps.pos) < 26);
            const strikePos = enemies.length
              ? enemies[Math.floor(Math.random() * enemies.length)].pos.clone()
              : ps.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 18, 0, (Math.random() - 0.5) * 18));
            this.vfx.spawnBranchedLightning(strikePos.clone().add(new THREE.Vector3(0, 26, 0)), strikePos, { color: 0x38bdf8, duration: 0.28, width: 0.44 });
            this.applyAoEDamage(strikePos, 5.2, 95, '#38bdf8', true);
          }
        }
      } else if (ch.type === 'reed_spin') {
        if (ch.tickCd <= 0) {
          ch.tickCd = 0.22;
          this.spawnShockwave(ps.pos, 0x38bdf8, 8.0, 0.22);
          this.applyAoEDamage(ps.pos, 8.0, 68, '#38bdf8', false);
        }
      } else if (ch.type === 'cap_charge') {
        const fwd = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw));
        this.safeTranslatePlayer(fwd.x * 32 * delta, fwd.z * 32 * delta);
        if (ch.tickCd <= 0) {
          ch.tickCd = 0.22;
          this.applyAoEDamage(ps.pos.clone().addScaledVector(fwd, 2), 4.5, 92, '#3b82f6', true);
        }
      } else if (ch.type === 'wolv_drill') {
        const fwd = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw));
        this.safeTranslatePlayer(fwd.x * 26 * delta, fwd.z * 26 * delta);
        if (ch.tickCd <= 0) {
          ch.tickCd = 0.16;
          this.spawnSlashArc(ps.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), ps.yaw + time * 10, 0xfef08a, 0xeab308, 4.6, 0.35, 0.18);
          this.applyAoEDamage(ps.pos, 5.0, 72, '#eab308', true);
          ps.hp = Math.min(ps.maxHp, ps.hp + 14);
        }
      } else if (ch.type === 'wanda_ult') {
        this.chromaPulse = 0.22;
        if (this.vfx && ch.tickCd <= 0) {
          ch.tickCd = 0.18;
          this.vfx.emitRing(ps.pos.clone().add(new THREE.Vector3(0, 2.0, 0)), 14, { color: 0xe11d48, count: 40, speed: -18 });
        }
        if (ch.timer <= 0 && !ch.finished) {
          ch.finished = true;
          this.addTrauma(1.0);
          this.spawnShockwave(ps.pos, 0xe11d48, 32, 0.85);
          if (this.vfx) this.vfx.emitBurst(ps.pos.clone().add(new THREE.Vector3(0, 2.0, 0)), { color: 0xf43f5e, count: 140, speed: 32, size: 3.0, life: 0.9 });
          this.doombots.forEach(b => {
            if (!b.dead && b.pos.distanceTo(ps.pos) < 32) {
              this.applyTargetHit({ pos: b.pos, isBoss: false, ref: b }, 999, '#e11d48', true);
            }
          });
          this.applyAoEDamage(ps.pos, 32, 620, '#e11d48', true);
        }
      }

      if (ch.timer <= 0) {
        this.activeChannels.splice(i, 1);
      }
    }

    // Maximum Spider sequential bounces
    for (let i = this.maxSpiderSteps.length - 1; i >= 0; i--) {
      const st = this.maxSpiderSteps[i];
      st.delay -= delta;
      if (st.delay <= 0) {
        const dest = st.target.pos;
        const dx = dest.x - ps.pos.x;
        const dz = dest.z - ps.pos.z;
        const prev = ps.pos.clone().add(new THREE.Vector3(0, 1.4, 0));
        this.safeTranslatePlayer(dx * 0.82, dz * 0.82);
        const now = ps.pos.clone().add(new THREE.Vector3(0, 1.4, 0));
        if (this.vfx) this.vfx.spawnVolumetricBeam(prev, now, { color: 0xef4444, coreColor: 0xfbbf24, width: 0.65, duration: 0.35 });
        const strand = this.createWebStrandMesh(prev, now, 0xf8fafc, 0.09);
        this.spawnPowerConstruct(strand.mesh, 1.4, (c, dt, t) => { if (strand.mat.uniforms?.uAlpha) strand.mat.uniforms.uAlpha.value = 1 - t; });
        this.spawnSlashArc(now, Math.random() * 6, 0xfef08a, 0xef4444, 5.2, 0.3);
        if (st.target.ref) this.applyTargetHit(st.target, 115, '#ef4444', true);
        else this.applyAoEDamage(ps.pos, 6.0, 95, '#ef4444', true);
        if (this.maxSpiderSteps.length === 1) {
          this.spawnShockwave(ps.pos, 0xef4444, 15.0, 0.5);
          this.applyAoEDamage(ps.pos, 15.0, 260, '#fbbf24', true);
        }
        this.maxSpiderSteps.splice(i, 1);
      }
    }
  };

  DoomsdayGame.prototype.updateWorldFXAndProjectiles = function (delta, time) {
    _origUpdateFX.call(this, delta, time);
    const ps = this.playerState;

    // 1. Homing Micro-Missiles (Iron Man)
    if (this.customPowerConstructs) {
      for (let i = this.customPowerConstructs.length - 1; i >= 0; i--) {
        const c = this.customPowerConstructs[i];
        c.life -= delta;
        const progress = 1 - Math.max(0, c.life / c.maxLife);
        if (c.onUpdate) c.onUpdate(c, delta, progress);
        if (c.life <= 0) {
          if (c.onExpire) c.onExpire(c);
          if (c.mesh && c.mesh.parent) c.mesh.parent.remove(c.mesh);
          this.customPowerConstructs.splice(i, 1);
        }
      }
    }

    for (let i = this.activeHomingMissiles.length - 1; i >= 0; i--) {
      const m = this.activeHomingMissiles[i];
      m.life -= delta;
      if (m.delay > 0) { m.delay -= delta; continue; }
      if (m.target && ((m.target.ref && (m.target.ref.dead || m.target.ref.destroyed || m.target.ref.hp <= 0)))) {
        m.target = this.findBestTarget(42);
      }
      if (m.target) {
        const aim = m.target.pos.clone().add(new THREE.Vector3(0, 1.8, 0)).sub(m.pos).normalize().multiplyScalar(38);
        m.vel.lerp(aim, Math.min(1, delta * 7.5));
      }
      m.pos.addScaledVector(m.vel, delta);
      m.mesh.position.copy(m.pos);
      if (this.vfx && Math.random() < 0.45) {
        this.vfx.emitBurst(m.pos, { color: 0xfb923c, count: 2, speed: 3, size: 1.4, life: 0.22 });
      }
      let hit = m.life <= 0;
      if (!hit && m.target && m.pos.distanceTo(m.target.pos.clone().add(new THREE.Vector3(0, 1.8, 0))) < 2.6) {
        this.applyTargetHit(m.target, m.dmg, '#f97316', true);
        if (this.vfx) this.vfx.emitBurst(m.pos, { color: 0xf97316, count: 22, speed: 16 });
        this.spawnShockwave(m.pos, 0xf97316, 4.0, 0.25);
        hit = true;
      }
      if (hit) {
        this.scene.remove(m.mesh);
        this.activeHomingMissiles.splice(i, 1);
      }
    }

    // 2. Cap Shield 5-Target Chain Ricochet
    for (let i = this.activeShieldChains.length - 1; i >= 0; i--) {
      const s = this.activeShieldChains[i];
      s.life -= delta;
      s.mesh.rotation.y += delta * 22;
      const tgtPos = s.returning
        ? ps.pos.clone().add(new THREE.Vector3(0, 1.5, 0))
        : (s.target ? s.target.pos.clone().add(new THREE.Vector3(0, 1.5, 0)) : s.pos.clone().addScaledVector(s.dir, 14));
      const toT = tgtPos.clone().sub(s.pos);
      const dist = toT.length();
      if (dist > 0.01) s.pos.addScaledVector(toT.normalize(), Math.min(dist, 42 * delta));
      s.mesh.position.copy(s.pos);

      if (s.returning && dist < 2.0) {
        this.scene.remove(s.mesh);
        this.activeShieldChains.splice(i, 1);
        continue;
      }
      if (!s.returning && s.target && dist < 2.2) {
        this.applyTargetHit(s.target, s.dmg, '#3b82f6', true);
        // Vertical Sonic Blue Vibranium Ring on every ricochet!
        const sRing = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.35, 16), new THREE.MeshBasicMaterial({ color: 0x60a5fa, side: THREE.DoubleSide, transparent: true, opacity: 0.92 }));
        sRing.position.copy(s.pos);
        sRing.lookAt(ps.pos.clone().add(new THREE.Vector3(0, 1.5, 0)));
        this.spawnPowerConstruct(sRing, 0.32, (c, dt, t) => { c.mesh.scale.setScalar(1 + t * 2.2); c.mesh.material.opacity = 1 - t; });
        if (this.vfx) this.vfx.emitBurst(s.pos, { color: 0x60a5fa, count: 20, speed: 14 });
        if (s.target.ref) s.hitRefs.add(s.target.ref);
        s.bouncesLeft--;
        const next = this._getAllLivingEnemies()
          .filter(e => !s.hitRefs.has(e.ref) && e.pos.distanceTo(s.pos) < 22)
          .sort((a, b) => a.pos.distanceTo(s.pos) - b.pos.distanceTo(s.pos))[0];
        if (next && s.bouncesLeft > 0) s.target = next;
        else s.returning = true;
      } else if (!s.returning && !s.target && s.life < 3.6) {
        s.returning = true;
      }
      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        this.activeShieldChains.splice(i, 1);
      }
    }

    // 3. Chthonian & Negative Zone Singularities (Continuous Pull -> Implosion)
    for (let i = this.activeSingularities.length - 1; i >= 0; i--) {
      const sg = this.activeSingularities[i];
      sg.timer -= delta;
      sg.mesh.rotation.y += delta * 5;
      sg.mesh.rotation.z += delta * 4;
      if (this.vfx && Math.random() < 0.65) {
        this.vfx.emitRing(sg.pos, sg.radius * 0.45, { color: sg.color, count: 6, speed: -12 });
      }
      this._getAllLivingEnemies().forEach(e => {
        if (!e.isBoss && !e.ref.isMiniBoss && !e.ref.isEnergyTower && e.pos.distanceTo(sg.pos) < sg.radius) {
          const pull = sg.pos.clone().sub(e.pos).setY(0).normalize().multiplyScalar(11 * delta);
          e.pos.add(pull);
        }
      });
      if (sg.timer <= 0) {
        this.spawnShockwave(sg.pos, sg.color, sg.radius * 0.9, 0.55);
        if (this.vfx) this.vfx.emitBurst(sg.pos, { color: sg.color, count: 75, speed: 24, size: 2.5 });
        this.applyAoEDamage(sg.pos, sg.radius * 0.85, sg.dmg, '#e11d48', true);
        this.scene.remove(sg.mesh);
        this.activeSingularities.splice(i, 1);
      }
    }

    // 4. Iron Man Orbital Support Drone
    if (this.activeOrbitalDrone) {
      const d = this.activeOrbitalDrone;
      d.timer -= delta;
      d.fireCd -= delta;
      const hover = ps.pos.clone().add(new THREE.Vector3(Math.cos(time * 2.2) * 1.4, 2.7 + Math.sin(time * 4) * 0.25, Math.sin(time * 2.2) * 1.4));
      d.mesh.position.lerp(hover, Math.min(1, delta * 8));
      if (d.fireCd <= 0) {
        d.fireCd = 0.55;
        const tgt = this.findBestTarget(28);
        if (tgt) {
          const ep = tgt.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
          if (this.vfx) this.vfx.spawnVolumetricBeam(d.mesh.position, ep, { color: 0x38bdf8, coreColor: 0xffffff, width: 0.24, duration: 0.16 });
          this.applyTargetHit(tgt, 48, '#38bdf8', false);
        }
      }
      if (d.timer <= 0) {
        this.scene.remove(d.mesh);
        this.activeOrbitalDrone = null;
      }
    }

    // 5. Scarlet Witch Telekinetic Floating Rocks
    for (let i = this.activeWandaRocks.length - 1; i >= 0; i--) {
      const r = this.activeWandaRocks[i];
      r.life -= delta;
      if (!r.fired) {
        r.fireDelay -= delta;
        r.angle += delta * 2.6;
        r.mesh.position.copy(ps.pos).add(new THREE.Vector3(Math.cos(r.angle) * 2.3, 2.5, Math.sin(r.angle) * 2.3));
        if (r.fireDelay <= 0) {
          r.fired = true;
          const tgt = this.findBestTarget(34);
          const fwd = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw));
          const dir = tgt ? tgt.pos.clone().add(new THREE.Vector3(0, 1.6, 0)).sub(r.mesh.position).normalize() : fwd;
          r.vel.copy(dir.multiplyScalar(36));
          r.target = tgt;
        }
      } else {
        r.mesh.position.addScaledVector(r.vel, delta);
        r.mesh.rotation.x += delta * 8;
        const enemies = this._getAllLivingEnemies();
        for (const e of enemies) {
          if (r.mesh.position.distanceTo(e.pos.clone().add(new THREE.Vector3(0, 1.6, 0))) < 2.4) {
            this.applyTargetHit(e, 95, '#e11d48', true);
            if (this.vfx) this.vfx.emitBurst(r.mesh.position, { color: 0xe11d48, count: 16, speed: 14 });
            r.life = 0;
            break;
          }
        }
      }
      if (r.life <= 0) {
        this.scene.remove(r.mesh);
        this.activeWandaRocks.splice(i, 1);
      }
    }
  };

  // ==========================================================================
  // 6. CHALLENGING REGIONAL BOSSES (4 BOSSES + 11.5m SENTINEL + SEAL BREAKS)
  // ==========================================================================
  DoomsdayGame.prototype.spawnMiniBosses = function () {
    if (this.miniBosses && this.miniBosses.length) {
      this.miniBosses.forEach(mb => {
        if (mb.mesh) { this.detachClothFromScene(mb.mesh); this.scene.remove(mb.mesh); }
      });
    }
    this.miniBosses = [];

    const specs = [
      { id: 'enforcer', name: 'EXECUTOR DOOM-PRIME', zone: 'Fase 1 // Bastião do Rio Latver', pos: new THREE.Vector3(0, 0, -45), hp: 5200, posture: 540, color: 0x10b981, colorStr: '#10b981', speed: 12.2, dmg: 48, phaseTag: 'FASE 1 // GUARDIÃO DO RIO', sealBoss: false },
      { id: 'archmage', name: 'BARÃO MORDO', zone: 'Fase 2 // Círculo Ritual Carmesim', pos: new THREE.Vector3(-330, this.world.getGroundHeight(-330, 30), 30), hp: 5800, posture: 600, color: 0xa855f7, colorStr: '#c084fc', speed: 12.6, dmg: 52, phaseTag: 'FASE 2 // SELO ARCANO (1/3)', sealBoss: true },
      { id: 'sentinel', name: 'SENTINELA CLÁSSICO MK-I', zone: 'Fase 3 // Plataforma Ômega Trask', pos: new THREE.Vector3(330, this.world.getGroundHeight(330, 30), 30), hp: 7200, posture: 780, color: 0xc084fc, colorStr: '#f97316', speed: 9.8, dmg: 58, phaseTag: 'FASE 3 // SELO ÔMEGA (2/3)', sealBoss: true },
      { id: 'destroyer', name: 'O DESTRUIDOR IMPERIAL', zone: 'Fase 4 // Coliseu Rúnico da Tundra', pos: new THREE.Vector3(0, this.world.getGroundHeight(0, -295), -295), hp: 6600, posture: 700, color: 0xf97316, colorStr: '#38bdf8', speed: 11.4, dmg: 58, phaseTag: 'FASE 4 // SELO BOREAL (3/3)', sealBoss: true }
    ];

    specs.forEach(s => {
      const mesh = CharacterBuilder.buildMiniBossMesh(s.id);
      mesh.position.copy(s.pos);
      this.scene.add(mesh);
      this.attachClothToScene(mesh);

      this.miniBosses.push({
        ...s,
        isMiniBoss: true,
        mesh,
        maxHp: s.hp,
        maxPosture: s.posture,
        posture: 0,
        staggeredTimer: 0,
        alive: true,
        engaged: false,
        phase: 1,
        attackCd: 1.3,
        specialCd: 4.0,
        windupTimer: 0,
        windupMove: null,
        comboQueue: [],
        unblockableTimer: 0
      });
    });
  };

  DoomsdayGame.prototype.damageMiniBoss = function (mb, baseDmg, colorStr, isHeavy = false) {
    if (!mb || !mb.alive) return;
    const mult = mb.staggeredTimer > 0 ? 1.45 : 1.0;
    let dmg = Math.round(baseDmg * mult);

    // Per-boss 1.0s DPS burst cap + anti-spam counter riposte
    const budget = mb.maxHp * 0.085;
    mb._dmgWinAcc = mb._dmgWinAcc || 0;
    if (mb._dmgWinAcc >= budget) dmg = Math.max(8, Math.round(dmg * 0.34));
    else if (mb._dmgWinAcc + dmg > budget) {
      const rem = budget - mb._dmgWinAcc;
      dmg = Math.round(rem + (dmg - rem) * 0.34);
    }
    mb._dmgWinAcc += dmg;
    mb._spamHits = (mb._spamHits || 0) + 1;
    if (mb._spamHits >= 5 && mb.staggeredTimer <= 0 && mb.windupTimer <= 0 && (mb._riposteCd || 0) <= 0) {
      mb._spamHits = 0;
      mb._riposteCd = 6.0;
      mb.comboQueue = [];
      this._startMiniBossWindup(mb, 'counter_riposte');
      this.triggerEventBanner(`${mb.name}: CONTRA-ATAQUE BLINDADO!`, '#facc15');
    }

    mb.hp = Math.max(0, mb.hp - dmg);
    if (mb.staggeredTimer <= 0) {
      mb.posture += isHeavy ? 40 : 18;
      if (mb.posture >= mb.maxPosture) {
        mb.posture = 0;
        mb.staggeredTimer = 2.6;
        mb.unblockableTimer = 0;
        window.soundSystem.playStaggerBreak();
        this.spawnShockwave(mb.pos, 0xfbbf24, 10, 0.45);
        this.triggerEventBanner(`POSTURA DE ${mb.name} QUEBRADA! (1.45x DANO)`, '#fbbf24');
      }
    }
    const yOff = mb.id === 'sentinel' ? 6.0 : 2.8;
    this.spawnDamageNumber(mb.pos.clone().add(new THREE.Vector3(0, yOff, 0)), dmg, colorStr, isHeavy || mb.staggeredTimer > 0);
    if (this.vfx) this.vfx.emitBurst(mb.pos.clone().add(new THREE.Vector3(0, yOff * 0.7, 0)), { color: mb.color, count: isHeavy ? 18 : 8, speed: 12 });

    if (mb.hp <= 0) {
      mb.alive = false;
      this.miniBossesDefeated++;
      this.playerLevel++;
      this.playerState.healFlasks = Math.min(this.playerState.maxHealFlasks, this.playerState.healFlasks + 1);
      this.playerState.ultCharge = 100;
      this.detachClothFromScene(mb.mesh);
      this.scene.remove(mb.mesh);
      this.spawnShockwave(mb.pos, mb.color, 18, 0.75);
      if (this.vfx) this.vfx.emitBurst(mb.pos.clone().add(new THREE.Vector3(0, yOff * 0.6, 0)), { color: mb.color, count: 95, speed: 24 });
      this.spawnHealOrb(mb.pos);
      window.soundSystem.playExplosion();

      // Break Imperial Seal Obelisk linked to this boss!
      if (mb.sealBoss && this.world && this.world.sealObelisks) {
        const seal = this.world.sealObelisks.find(s => s.bossId === mb.id && !s.broken);
        if (seal) {
          seal.broken = true;
          if (seal.beam) seal.beam.visible = false;
          if (seal.gem) seal.gem.visible = false;
          this.sealsBroken = (this.sealsBroken || 0) + 1;
          this.triggerEventBanner(`SELO IMPERIAL QUEBRADO (${this.sealsBroken}/3) // NÍVEL ${this.playerLevel}`, '#fbbf24');

          if (this.sealsBroken >= 3) {
            this.world.castleBarrierUnlocked = true;
            CutsceneDirector.play('seal_break_3', [
              {
                speaker: 'ORÁCULO TÁTICO',
                line: 'Os 3 Selos Imperiais caíram! A barreira do Castelo de Victor Von Doom foi destruída!',
                bossTitle: 'CAMINHO PARA O TRONO LIBERADO',
                bossSub: 'INVADA O CASTELO DE DOOM AO NORTE DA PONTE DO ABISMO',
                accent: '#10b981',
                camPos: new THREE.Vector3(0, 16, -468),
                lookAt: new THREE.Vector3(0, 9, -505),
                fov: 54,
                duration: 3.4
              }
            ], this, () => {
              if (this.world.castleBarrier) this.world.castleBarrier.visible = false;
              if (this.vfx) this.vfx.emitBurst(new THREE.Vector3(0, 9, -504), { color: 0x10b981, count: 120, speed: 28 });
            }, true);
          }
        }
      } else {
        this.triggerEventBanner(`${mb.name} DERROTADO // NÍVEL ${this.playerLevel} (+15% DANO)`, '#fbbf24');
      }
    }
  };

  DoomsdayGame.prototype.updateMiniBosses = function (delta, time) {
    if (!this.miniBosses || this.timeFreezeTimer > 0) return;
    const ps = this.playerState;
    let dangerLevel = 0;

    for (const mb of this.miniBosses) {
      if (!mb.alive) continue;
      const bg = mb.mesh.userData.hpBarBg;
      const fill = mb.mesh.userData.hpBarFill;
      if (bg && fill) {
        bg.lookAt(this.camera.position);
        const ratio = Math.max(0, mb.hp / mb.maxHp);
        fill.scale.x = Math.max(0.001, ratio);
        fill.position.x = -(1 - ratio) * 0.9;
      }

      if (mb.markedTimer > 0) mb.markedTimer -= delta;
      if (mb.staggeredTimer > 0) {
        mb.staggeredTimer -= delta;
        mb.mesh.userData.staggered = true;
        CharacterBuilder.animateCharacter(mb.mesh, delta, false, true, time);
        this.updateClothForCharacter(mb.mesh, delta, time);
        continue;
      }
      mb.mesh.userData.staggered = false;

      const toP = ps.pos.clone().sub(mb.pos);
      const dist = toP.length();
      let isMoving = false;

      // Phase 2 Enrage at 50% HP
      if (mb.phase === 1 && mb.hp <= mb.maxHp * 0.50) {
        mb.phase = 2;
        mb.speed *= 1.25;
        this.spawnShockwave(mb.pos, mb.color, mb.id === 'sentinel' ? 24 : 16, 0.55);
        if (this.vfx) this.vfx.emitBurst(mb.pos.clone().add(new THREE.Vector3(0, 2.5, 0)), { color: mb.color, count: 65, speed: 22 });
        this.triggerEventBanner(`FASE 2 // FÚRIA DE ${mb.name}`, mb.colorStr);
      }

      // Grandiose 2-Take Boss Entrance Cutscene on first proximity
      if (!mb.engaged && dist < (mb.id === 'sentinel' ? 62 : 44)) {
        mb.engaged = true;
        mb.mesh.userData.bossIntroTimer = 1.0;
        const hCam = mb.id === 'sentinel' ? 14 : 5.5;
        const distCam = mb.id === 'sentinel' ? 28 : 13;
        const dirToP = toP.clone().setY(0).normalize();
        const rightV = new THREE.Vector3(-dirToP.z, 0, dirToP.x);
        const bossQuotes = {
          enforcer: 'A ponte do Rio Latver será seu túmulo, invasor!',
          archmage: 'Pelas faixas carmesins, sua magia não passa de faíscas!',
          sentinel: 'ALVO VINGADOR IDENTIFICADO. PROTOCOLO ÔMEGA NÍVEL 5 ATIVADO!',
          destroyer: 'Fogo primordial de Asgard reduzirá você a cinzas!'
        };
        CutsceneDirector.play('boss_' + mb.id, [
          {
            speaker: mb.zone,
            line: 'Um guardião colossal desperta em seu santuário!',
            camPos: mb.pos.clone().addScaledVector(dirToP, distCam * 1.45).addScaledVector(rightV, -8).add(new THREE.Vector3(0, hCam + 3, 0)),
            lookAt: mb.pos.clone().add(new THREE.Vector3(0, mb.id === 'sentinel' ? 6.0 : 2.2, 0)),
            fov: 54,
            duration: 1.65
          },
          {
            speaker: mb.name,
            line: bossQuotes[mb.id] || 'Ninguém cruzará os domínios de Victor Von Doom!',
            bossTitle: mb.name,
            bossSub: mb.zone,
            accent: mb.colorStr,
            camPos: mb.pos.clone().addScaledVector(dirToP, distCam * 0.88).addScaledVector(rightV, 4.5).add(new THREE.Vector3(0, hCam * 0.72, 0)),
            lookAt: mb.pos.clone().add(new THREE.Vector3(0, mb.id === 'sentinel' ? 6.8 : 2.6, 0)),
            fov: 46,
            duration: 2.05,
            onEnter: (g) => {
              g.spawnShockwave(mb.pos, mb.color, mb.id === 'sentinel' ? 26 : 16, 0.55);
              g.addTrauma(0.5);
            }
          }
        ], this, null, true);
      }

      if (dist < 82) {
        mb._dmgWinTimer = (mb._dmgWinTimer || 0) + delta;
        if (mb._dmgWinTimer >= 1.0) { mb._dmgWinTimer = 0; mb._dmgWinAcc = 0; }
        mb._spamDecay = (mb._spamDecay || 0) + delta;
        if (mb._spamDecay >= 1.4) { mb._spamDecay = 0; mb._spamHits = Math.max(0, (mb._spamHits || 0) - 2); }
        mb._riposteCd = Math.max(0, (mb._riposteCd || 0) - delta);

        const targetYaw = Math.atan2(toP.x, toP.z);
        let yD = targetYaw - mb.mesh.rotation.y;
        while (yD > Math.PI) yD -= Math.PI * 2;
        while (yD < -Math.PI) yD += Math.PI * 2;
        mb.mesh.rotation.y += yD * Math.min(1, delta * 9);

        // Tactical Windup (tracks player smoothly during early windup, locks aim in last 0.22s so dodges are fair!)
        if (mb.windupTimer > 0) {
          mb.windupTimer -= delta;
          if (mb.windupTimer > 0.22 || !mb.aimTarget) {
            const leadT = THREE.MathUtils.clamp(dist / 32, 0.10, 0.45);
            mb.aimTarget = ps.pos.clone().add(new THREE.Vector3(0, 1.3, 0)).addScaledVector(ps.vel, leadT);
          }
          // Leaping moves advance toward aimTarget mid-windup
          if ((mb.windupMove === 'enf_vault_slam' || mb.windupMove === 'kang_time_dive') && mb.windupTimer < 0.24 && dist > 3.2) {
            const lDir = mb.aimTarget.clone().sub(mb.pos).setY(0).normalize();
            const res = this.world.resolveMovement(mb.pos.x, mb.pos.z, mb.pos.x + lDir.x * 28 * delta, mb.pos.z + lDir.z * 28 * delta, 1.6);
            mb.pos.set(res.x, this.world.getGroundHeight(res.x, res.z) + Math.sin((mb.windupTimer / 0.24) * Math.PI) * 3.8, res.z);
            mb.mesh.position.copy(mb.pos);
          }
          dangerLevel = Math.max(dangerLevel, mb.windupMove === 'exec_unblockable' || mb.windupMove === 'counter_riposte' ? 0.98 : 0.55);
          if (mb.windupTimer <= 0) {
            const mv = mb.windupMove;
            mb.windupMove = null;
            mb.mesh.userData.windupType = null;
            mb.mesh.userData.attackTimer = 1.0;
            mb.pos.y = this.world.getGroundHeight(mb.pos.x, mb.pos.z);
            mb.mesh.position.copy(mb.pos);
            this._execMiniBossMove(mb, mv, toP, dist);
            mb.attackCd = mb.comboQueue.length > 0 ? 0.16 : (mb.phase === 2 ? 0.78 : 1.08);
          }
          CharacterBuilder.animateCharacter(mb.mesh, delta, false, true, time);
          this.updateClothForCharacter(mb.mesh, delta, time);
          continue;
        }

        mb.mesh.userData.windupType = null;
        mb.strafeSign = mb.strafeSign || (Math.random() < 0.5 ? 1 : -1);
        const isCaster = (mb.id === 'archmage' || mb.id === 'magneto');
        const stopDist = isCaster ? 15.0 : (mb.id === 'sentinel' || mb.id === 'the_void') ? 11.5 : 5.5;
        if (dist > stopDist) {
          const dir = toP.clone().setY(0).normalize();
          const lat = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(Math.sin(time * 1.5 + (mb.phase || 1)) * 0.45 * mb.strafeSign);
          dir.add(lat).normalize();
          const res = this.world.resolveMovement(mb.pos.x, mb.pos.z, mb.pos.x + dir.x * mb.speed * delta, mb.pos.z + dir.z * mb.speed * delta, mb.id === 'sentinel' ? 3.2 : 1.6);
          mb.pos.x = res.x; mb.pos.z = res.z;
          mb.pos.y = this.world.getGroundHeight(mb.pos.x, mb.pos.z);
          mb.mesh.position.copy(mb.pos);
          isMoving = true;
        } else if (isCaster && dist < 7.0) {
          const away = toP.clone().setY(0).normalize().multiplyScalar(-1);
          const lat = new THREE.Vector3(-away.z, 0, away.x).multiplyScalar(mb.strafeSign * 0.6);
          away.add(lat).normalize();
          const res = this.world.resolveMovement(mb.pos.x, mb.pos.z, mb.pos.x + away.x * mb.speed * 0.85 * delta, mb.pos.z + away.z * mb.speed * 0.85 * delta, 1.6);
          mb.pos.x = res.x; mb.pos.z = res.z;
          mb.pos.y = this.world.getGroundHeight(mb.pos.x, mb.pos.z);
          mb.mesh.position.copy(mb.pos);
          isMoving = true;
        }

        mb.attackCd -= delta;
        mb.specialCd -= delta;

        if (mb.comboQueue && mb.comboQueue.length > 0 && mb.attackCd <= 0) {
          const nextMv = mb.comboQueue.shift();
          this._startMiniBossWindup(mb, nextMv);
        } else if (mb.specialCd <= 0) {
          mb.specialCd = mb.phase === 2 ? 4.2 : 5.6;
          if (mb.id === 'kang') { mb.comboQueue = ['kang_chrono_grid']; this._startMiniBossWindup(mb, 'kang_time_dive'); }
          else if (mb.id === 'magneto') { mb.comboQueue = ['mag_scrap_storm']; this._startMiniBossWindup(mb, 'mag_polarity_crush'); }
          else if (mb.id === 'the_void') { mb.comboQueue = ['void_blink_flurry']; this._startMiniBossWindup(mb, 'void_singularity'); }
          else if (mb.id === 'sentinel') { mb.comboQueue = ['sent_omega_barrage']; this._startMiniBossWindup(mb, 'sent_optic_sweep'); }
          else if (mb.id === 'archmage') { mb.comboQueue = ['mordo_crimson_bands']; this._startMiniBossWindup(mb, 'mordo_mirror_ambush'); }
          else if (mb.id === 'destroyer') { mb.comboQueue = ['dest_juggernaut_triple']; this._startMiniBossWindup(mb, 'dest_annihilation_visor'); }
          else { this._startMiniBossWindup(mb, 'exec_unblockable'); }
          this.triggerEventBanner(`${mb.name}: TÉCNICA SUPREMA — ESQUIVE!`, '#ef4444');
        } else if (mb.attackCd <= 0) {
          mb.patternIdx = ((mb.patternIdx || 0) + 1) % 4;
          const pIdx = mb.patternIdx;
          if (mb.id === 'sentinel') {
            if (pIdx === 0) { mb.comboQueue = ['sent_plasma_fan']; this._startMiniBossWindup(mb, 'sent_optic_sweep'); }
            else if (pIdx === 1) { mb.comboQueue = ['sent_stomp']; this._startMiniBossWindup(mb, 'sent_grapple_fist'); }
            else if (pIdx === 2) { this._startMiniBossWindup(mb, 'sent_omega_barrage'); }
            else { this._startMiniBossWindup(mb, 'sent_plasma_fan'); }
          } else if (mb.id === 'archmage') {
            if (pIdx === 0) { mb.comboQueue = ['mordo_seeker_salvo']; this._startMiniBossWindup(mb, 'mordo_mirror_ambush'); }
            else if (pIdx === 1) { mb.comboQueue = ['mordo_tribeam']; this._startMiniBossWindup(mb, 'mordo_crimson_bands'); }
            else if (pIdx === 2) { this._startMiniBossWindup(mb, 'mordo_eldritch_whips'); }
            else { mb.comboQueue = ['mordo_fan']; this._startMiniBossWindup(mb, 'mordo_blink'); }
          } else if (mb.id === 'destroyer') {
            if (pIdx === 0) { mb.comboQueue = ['dest_charge', 'dest_double_quake']; this._startMiniBossWindup(mb, 'dest_charge'); }
            else if (pIdx === 1) { this._startMiniBossWindup(mb, 'dest_annihilation_visor'); }
            else if (pIdx === 2) { this._startMiniBossWindup(mb, 'dest_odinfire_spiral'); }
            else { this._startMiniBossWindup(mb, 'dest_magma_line'); }
          } else if (mb.id === 'the_void') {
            if (pIdx === 0) { mb.comboQueue = ['void_abyss_eruption']; this._startMiniBossWindup(mb, 'void_singularity'); }
            else if (pIdx === 1) { mb.comboQueue = ['void_blink_flurry', 'void_blink_flurry']; this._startMiniBossWindup(mb, 'void_blink_flurry'); }
            else if (pIdx === 2) { this._startMiniBossWindup(mb, 'void_abyss_eruption'); }
            else { mb.comboQueue = ['void_blink_flurry']; this._startMiniBossWindup(mb, 'void_singularity'); }
          } else if (mb.id === 'magneto') {
            if (pIdx === 0) { mb.comboQueue = ['mag_rail_spears']; this._startMiniBossWindup(mb, 'mag_scrap_storm'); }
            else if (pIdx === 1) { mb.comboQueue = ['mag_scrap_storm']; this._startMiniBossWindup(mb, 'mag_polarity_crush'); }
            else if (pIdx === 2) { this._startMiniBossWindup(mb, 'mag_rail_spears'); }
            else { mb.comboQueue = ['mag_polarity_crush']; this._startMiniBossWindup(mb, 'mag_rail_spears'); }
          } else if (mb.id === 'kang') {
            if (pIdx === 0) { mb.comboQueue = ['enf_sweep', 'kang_radial_lances']; this._startMiniBossWindup(mb, 'kang_time_dive'); }
            else if (pIdx === 1) { this._startMiniBossWindup(mb, 'kang_chrono_grid'); }
            else if (pIdx === 2) { mb.comboQueue = ['kang_time_dive']; this._startMiniBossWindup(mb, 'kang_radial_lances'); }
            else { this._startMiniBossWindup(mb, 'kang_chrono_grid'); }
          } else {
            if (pIdx === 0) { mb.comboQueue = ['enf_sweep', 'enf_slam']; this._startMiniBossWindup(mb, 'enf_vault_slam'); }
            else if (pIdx === 1) { this._startMiniBossWindup(mb, 'enf_mortar_volley'); }
            else if (pIdx === 2) { mb.comboQueue = ['enf_sweep', 'enf_sweep']; this._startMiniBossWindup(mb, 'enf_shield_charge'); }
            else { this._startMiniBossWindup(mb, 'enf_vault_slam'); }
          }
        }
      }

      CharacterBuilder.animateCharacter(mb.mesh, delta, isMoving, true, time);
      this.updateClothForCharacter(mb.mesh, delta, time);
    }

    if (typeof GLOBAL_LIGHT_UNIFORMS !== 'undefined' && GLOBAL_LIGHT_UNIFORMS.uDangerFlash) {
      GLOBAL_LIGHT_UNIFORMS.uDangerFlash.value = THREE.MathUtils.lerp(GLOBAL_LIGHT_UNIFORMS.uDangerFlash.value, dangerLevel, Math.min(1, delta * 8));
    }
  };

  DoomsdayGame.prototype._startMiniBossWindup = function (mb, mv) {
    const map = {
      exec_unblockable: { t: 0.95, anim: 'execution' }, counter_riposte: { t: 0.36, anim: 'slam' },
      sent_optic_sweep: { t: 0.56, anim: 'cast' }, sent_grapple_fist: { t: 0.44, anim: 'lunge' },
      sent_stomp: { t: 0.68, anim: 'slam' }, sent_plasma_fan: { t: 0.48, anim: 'cast' }, sent_omega_barrage: { t: 0.60, anim: 'cast' },
      mordo_mirror_ambush: { t: 0.45, anim: 'cast' }, mordo_crimson_bands: { t: 0.50, anim: 'cast' },
      mordo_eldritch_whips: { t: 0.62, anim: 'sweep' }, mordo_seeker_salvo: { t: 0.46, anim: 'cast' },
      mordo_blink: { t: 0.36, anim: 'cast' }, mordo_fan: { t: 0.42, anim: 'cast' }, mordo_tribeam: { t: 0.58, anim: 'sweep' },
      dest_annihilation_visor: { t: 0.64, anim: 'cast' }, dest_juggernaut_triple: { t: 0.40, anim: 'lunge' },
      dest_odinfire_spiral: { t: 0.52, anim: 'cast' }, dest_double_quake: { t: 0.70, anim: 'slam' },
      dest_charge: { t: 0.42, anim: 'lunge' }, dest_magma_line: { t: 0.60, anim: 'slam' },
      void_singularity: { t: 0.54, anim: 'cast' }, void_blink_flurry: { t: 0.36, anim: 'lunge' }, void_abyss_eruption: { t: 0.64, anim: 'slam' },
      mag_scrap_storm: { t: 0.50, anim: 'cast' }, mag_polarity_crush: { t: 0.58, anim: 'slam' }, mag_rail_spears: { t: 0.48, anim: 'cast' },
      kang_chrono_grid: { t: 0.62, anim: 'cast' }, kang_time_dive: { t: 0.46, anim: 'lunge' }, kang_radial_lances: { t: 0.48, anim: 'cast' },
      enf_vault_slam: { t: 0.46, anim: 'lunge' }, enf_shield_charge: { t: 0.44, anim: 'lunge' },
      enf_mortar_volley: { t: 0.50, anim: 'cast' }, enf_sweep: { t: 0.42, anim: 'sweep' }, enf_slam: { t: 0.68, anim: 'slam' }
    };
    const cfg = map[mv] || { t: 0.52, anim: 'cast' };
    mb.windupMove = mv;
    mb.aimTarget = null;
    mb.windupTimer = mb.phase === 2 ? cfg.t * 0.85 : cfg.t;
    mb.mesh.userData.windupType = cfg.anim;
    if (cfg.anim === 'slam' || cfg.anim === 'execution' || mv === 'dest_annihilation_visor' || mv === 'sent_optic_sweep') {
      this.spawnShockwave(mb.pos, mv === 'counter_riposte' ? 0xfacc15 : mv === 'exec_unblockable' ? 0xef4444 : mb.color, mb.id === 'sentinel' ? 9 : 4.8, 0.42);
    }
  };

  function _ptSegDistXZ(p, a, b) {
    const vx = b.x - a.x, vz = b.z - a.z;
    const lenSq = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.z - a.z) * vz) / lenSq));
    return Math.hypot(p.x - (a.x + t * vx), p.z - (a.z + t * vz));
  }

  DoomsdayGame.prototype._execMiniBossMove = function (mb, mv, toP, dist) {
    const ps = this.playerState;
    const dmgScale = mb.phase === 2 ? 1.25 : 1.0;
    const dmg = Math.round(mb.dmg * dmgScale);
    const eyeY = mb.id === 'sentinel' ? 9.8 : mb.id === 'destroyer' ? 4.4 : 2.5;
    const origin = mb.pos.clone().add(new THREE.Vector3(0, eyeY, 0));
    const aim = (mb.aimTarget ? mb.aimTarget.clone() : ps.pos.clone().add(new THREE.Vector3(0, 1.3, 0)));
    const fireBeamSeg = (fromP, dirXZ, len, width, colorHex, dur, hitDmg) => {
      const endP = fromP.clone().addScaledVector(dirXZ, len);
      if (this.vfx) this.vfx.spawnVolumetricBeam(fromP, endP, { color: colorHex, coreColor: 0xffffff, width, duration: dur || 0.36 });
      if (ps.invulnTimer <= 0 && ps.pos.y < mb.pos.y + 4.5 && _ptSegDistXZ(ps.pos, fromP, endP) < width + 0.95) {
        this.damagePlayer(hitDmg);
      }
    };

    if (mv === 'counter_riposte') {
      this.spawnShockwave(mb.pos, 0xfacc15, 11.5, 0.42);
      if (this.vfxPro) this.vfxPro.vfx.impactBurst(mb.pos.clone().add(new THREE.Vector3(0, 2, 0)), '#facc15', 'heavy');
      if (dist < 10.5 && ps.invulnTimer <= 0) {
        this.damagePlayer(Math.round(dmg * 0.9));
        const away = ps.pos.clone().sub(mb.pos).setY(0).normalize().multiplyScalar(8);
        this.safeTranslatePlayer(away.x, away.z);
      }
    } else if (mv === 'exec_unblockable') {
      const bDir = aim.clone().sub(origin).setY(0).normalize();
      fireBeamSeg(origin, bDir, 34, mb.id === 'sentinel' ? 2.1 : 1.35, 0xef4444, 0.48, dmg + 22);
      if (this.vfx) this.vfx.spawnGroundDangerZone(mb.pos.clone(), mb.id === 'sentinel' ? 24 : 15, 1.35, 0xef4444, 'ring_jump');
      window.soundSystem.playDoomBeam();
    } else if (mv === 'mordo_tribeam' || mv === 'mordo_eldritch_whips' || mv === 'dest_annihilation_visor' || mv === 'sent_optic_sweep') {
      const bDir = aim.clone().sub(origin).setY(0).normalize();
      const count = mv === 'mordo_tribeam' ? 3 : mv === 'mordo_eldritch_whips' ? 4 : mv === 'sent_optic_sweep' ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const ang = mv === 'mordo_eldritch_whips' ? (i * Math.PI * 0.5) : (i - (count - 1) * 0.5) * 0.24;
        fireBeamSeg(origin, bDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang), 36, mv === 'dest_annihilation_visor' ? 1.5 : 0.95, mb.color, 0.44, dmg);
      }
      if (mv === 'dest_annihilation_visor') {
        for (let k = 1; k <= 4; k++) this.spawnBossMeteorTelegraph(mb.pos.clone().addScaledVector(bDir, k * 6.5), 0.5 + k * 0.2, 4.4);
      }
      window.soundSystem.playDoomBeam();
    } else if (mv === 'sent_plasma_fan' || mv === 'mordo_fan' || mv === 'mordo_seeker_salvo' || mv === 'enf_mortar_volley' || mv === 'dest_odinfire_spiral' || mv === 'kang_radial_lances' || mv === 'mag_rail_spears') {
      const baseDir = aim.clone().sub(origin).normalize();
      let span = [-0.22, 0, 0.22];
      let spd = 33, rad = 1.2, life = 2.6, col = mb.color;
      if (mv === 'sent_plasma_fan') { span = [-0.48, -0.32, -0.16, 0, 0.16, 0.32, 0.48]; spd = 30; }
      else if (mv === 'mordo_seeker_salvo') { span = [-0.40, -0.20, 0, 0.20, 0.40]; spd = 28; }
      else if (mv === 'dest_odinfire_spiral') { span = Array.from({ length: 8 }, (_, k) => (k / 8) * Math.PI * 2); spd = 25; }
      else if (mv === 'kang_radial_lances') { span = Array.from({ length: 12 }, (_, k) => (k / 12) * Math.PI * 2); spd = 30; }
      else if (mv === 'mag_rail_spears') { span = [-0.18, 0, 0.18]; spd = 46; }
      else if (mv === 'enf_mortar_volley') {
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2;
          this.spawnBossMeteorTelegraph(aim.clone().add(new THREE.Vector3(Math.cos(a) * 4.5, 0, Math.sin(a) * 4.5)), 0.78, 4.4);
        }
        return;
      }
      span.forEach(ang => {
        const pDir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
        const orb = this.vfx ? this.vfx.createEnergyProjectileMesh(col, 0xffffff, 1.2) : new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), new THREE.MeshBasicMaterial({ color: col }));
        orb.position.copy(origin);
        this.scene.add(orb);
        this.projectiles.push({ mesh: orb, pos: origin.clone(), vel: pDir.multiplyScalar(spd), dmg: dmg - 6, color: mb.colorStr, isPlayer: false, radius: rad, life });
      });
    } else if (mv === 'sent_grapple_fist') {
      const dir = aim.clone().sub(origin).normalize();
      const fist = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 2.2), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
      fist.position.copy(origin); fist.lookAt(aim);
      this.scene.add(fist);
      this.projectiles.push({ mesh: fist, pos: origin.clone(), vel: dir.multiplyScalar(42), dmg: dmg + 12, color: '#f97316', isPlayer: false, radius: 1.8, life: 1.6 });
    } else if (mv === 'sent_omega_barrage' || mv === 'void_abyss_eruption') {
      const n = mv === 'sent_omega_barrage' ? (mb.phase === 2 ? 7 : 5) : (mb.phase === 2 ? 6 : 4);
      for (let k = 0; k < n; k++) {
        const ang = (k / n) * Math.PI * 2;
        this.spawnBossMeteorTelegraph(aim.clone().add(new THREE.Vector3(Math.cos(ang) * 5.2, 0, Math.sin(ang) * 5.2)), 0.92, 4.8);
      }
    } else if (mv === 'dest_magma_line') {
      const dir = toP.clone().setY(0).normalize();
      for (let k = 1; k <= 5; k++) this.spawnBossMeteorTelegraph(mb.pos.clone().addScaledVector(dir, k * 5.4), 0.45 + k * 0.2, 4.4);
    } else if (mv === 'mordo_crimson_bands' || mv === 'mag_polarity_crush' || mv === 'void_singularity') {
      if (this.vfx) this.vfx.spawnVolumetricBeam(origin, aim, { color: mb.color, coreColor: 0xffffff, width: 0.95, duration: 0.35 });
      if (dist < 28) {
        const pull = mb.pos.clone().sub(ps.pos).setY(0).normalize().multiplyScalar(Math.max(0, dist - 5.5));
        this.safeTranslatePlayer(pull.x * 0.65, pull.z * 0.65);
      }
      this.spawnBossMeteorTelegraph(mb.pos.clone(), 0.95, 6.2);
    } else if (mv === 'mordo_mirror_ambush' || mv === 'mordo_blink' || mv === 'void_blink_flurry') {
      const ang = Math.atan2(toP.x, toP.z) + (mv === 'void_blink_flurry' ? (Math.random() - 0.5) * 2.2 : 0.4);
      const dJump = mv === 'mordo_mirror_ambush' ? -6.5 : 5.2;
      const res = this.world.resolveMovement(mb.pos.x, mb.pos.z, ps.pos.x + Math.sin(ang) * dJump, ps.pos.z + Math.cos(ang) * dJump, 1.6);
      this.spawnShockwave(mb.pos, mb.color, 7.5, 0.32);
      mb.pos.set(res.x, this.world.getGroundHeight(res.x, res.z), res.z);
      mb.mesh.position.copy(mb.pos);
      if (mv !== 'mordo_blink') {
        this.spawnSlashArc(mb.pos.clone().add(new THREE.Vector3(0, 1.6, 0)), Math.atan2(ps.pos.x - mb.pos.x, ps.pos.z - mb.pos.z), 0xffffff, mb.color, 7.2, 0.32);
        if (ps.pos.distanceTo(mb.pos) < 7.8 && ps.invulnTimer <= 0) this.damagePlayer(dmg + 6);
      }
    } else if (mv === 'mag_scrap_storm') {
      const dir = aim.clone().sub(origin).normalize();
      for (let i = -2; i <= 2; i++) {
        const off = origin.clone().add(new THREE.Vector3(i * 1.6, Math.abs(i) * 0.5, 0));
        const shard = new THREE.Mesh(new THREE.ConeGeometry(0.32, 2.0, 4), new THREE.MeshBasicMaterial({ color: 0xe879f9 }));
        shard.rotation.x = Math.PI / 2; shard.position.copy(off); shard.lookAt(aim);
        this.scene.add(shard);
        this.projectiles.push({ mesh: shard, pos: off, vel: aim.clone().sub(off).normalize().multiplyScalar(36), dmg: dmg - 10, color: '#e879f9', isPlayer: false, radius: 1.2, life: 2.2 });
      }
    } else if (mv === 'kang_chrono_grid') {
      for (let k = 0; k < 2; k++) {
        const snapPos = aim.clone();
        const delay = 0.75 + k * 0.85;
        this.spawnBossMeteorTelegraph(snapPos, delay, 5.5);
        this.spawnBossMeteorTelegraph(snapPos.clone().add(new THREE.Vector3(k === 0 ? 5.5 : -5.5, 0, 0)), delay, 4.4);
      }
    } else if (mv === 'dest_charge' || mv === 'dest_juggernaut_triple' || mv === 'enf_shield_charge') {
      const dir = aim.clone().sub(mb.pos).setY(0).normalize();
      const res = this.world.resolveMovement(mb.pos.x, mb.pos.z, mb.pos.x + dir.x * 14, mb.pos.z + dir.z * 14, 1.8);
      mb.pos.set(res.x, this.world.getGroundHeight(res.x, res.z), res.z);
      mb.mesh.position.copy(mb.pos);
      this.spawnShockwave(mb.pos, mb.color, 11.0, 0.38);
      if (mb.pos.distanceTo(ps.pos) < 8.2 && ps.invulnTimer <= 0) this.damagePlayer(dmg + 12);
    } else if (mv === 'enf_sweep') {
      this.spawnSlashArc(mb.pos.clone().add(new THREE.Vector3(0, 1.6, 0)), mb.mesh.rotation.y, 0x34d399, 0x10b981, 8.5, 0.35);
      if (dist < 8.2 && ps.invulnTimer <= 0) this.damagePlayer(dmg + 6);
    } else {
      // sent_stomp, dest_double_quake, enf_slam, enf_vault_slam, kang_time_dive
      const r = mb.id === 'sentinel' ? 22 : 13.5;
      this.spawnShockwave(mb.pos, mb.color, r, 0.48);
      if (this.vfx) this.vfx.spawnGroundDangerZone(mb.pos.clone(), r, 1.25, mb.color, 'ring_jump');
      if (dist < r * 0.76 && ps.pos.y < mb.pos.y + 2.6 && ps.invulnTimer <= 0) this.damagePlayer(dmg + 10);
    }
  };

  // ==========================================================================
  // 7. SYNC HERO RESOURCE BAR & SEAL COUNTER ON HUD
  // ==========================================================================
  DoomsdayGame.prototype.updateHUD = function () {
    _origUpdateHUD.call(this);
    const resFill = document.getElementById('hud-resource-fill');
    if (resFill) {
      const pct = Math.min(100, Math.max(0, this.playerState.heroResource || 0));
      resFill.style.width = `${pct}%`;
    }
    const sealEl = document.getElementById('hud-seals-count');
    if (sealEl) {
      sealEl.textContent = `SELOS: ${this.sealsBroken || 0}/3`;
    }
  };
})();

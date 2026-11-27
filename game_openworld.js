// ============================================================================
// AVENGERS: DOOMSDAY — OPEN-WORLD TACTICAL MAP CANVAS, BIOMES & UNIFIED RADAR
// ============================================================================

(function () {
  if (typeof DoomsdayGame === 'undefined') return;

  const _origStartGame = DoomsdayGame.prototype.startGame;
  const _origUpdatePlayer = DoomsdayGame.prototype.updatePlayer;
  const _origUpdateHUD = DoomsdayGame.prototype.updateHUD;
  const _origDrawMinimap = DoomsdayGame.prototype.drawMinimap;
  const _origDamageBoss = DoomsdayGame.prototype.damageBoss;

  DoomsdayGame.prototype.startGame = function () {
    _origStartGame.call(this);
    if (!this._openWorldBound) {
      this._openWorldBound = true;
      if (!this.miniBosses) this.miniBosses = [];
      this.miniBossesDefeated = 0;
      this.towersDestroyed = 0;
      this.playerLevel = 1;
      this.worldMapOpen = false;
      this.biomeBannerTimer = 0;
      this.setupOpenWorldUI();
      this.bindOpenWorldKeys();
    }
    this.miniBossesDefeated = 0;
    this.towersDestroyed = 0;
    this.playerLevel = 1;
    this.toggleWorldMap(false);
    if (this.spawnMiniBosses) this.spawnMiniBosses();
  };

  DoomsdayGame.prototype.setupOpenWorldUI = function () {
    const hud = document.getElementById('game-hud');
    if (!hud) return;

    if (!document.getElementById('ow-biome-banner')) {
      const banner = document.createElement('div');
      banner.id = 'ow-biome-banner';
      banner.className = 'ow-biome-banner hidden';
      banner.innerHTML = '<strong id="ow-banner-title">VALE DE DOOMSTADT</strong><span id="ow-banner-sub">Fase 1 // Capital Imperial</span>';
      hud.appendChild(banner);
    }

    if (!document.getElementById('ow-map-modal')) {
      const mapModal = document.createElement('div');
      mapModal.id = 'ow-map-modal';
      mapModal.className = 'ow-map-modal hidden interactive';
      mapModal.innerHTML = `
        <div class="ow-map-card" style="width:min(980px, 95vw);">
          <div class="ow-map-header">
            <div>
              <h2>MAPA TÁTICO CONTINENTAL DE LATVÉRIA (3600M · 11 BIOMAS)</h2>
              <p>Ato I: 8 Regiões Exploráveis & Selos · Ato II (Pós-Doom): 3 Reinos Ômega Externos</p>
            </div>
            <button id="ow-map-close" class="ow-map-close" type="button">FECHAR [M]</button>
          </div>
          <div class="ow-map-layout">
            <canvas id="worldmap-canvas" width="320" height="320"></canvas>
            <div class="ow-zone-grid">
              <button class="ow-zone-btn" data-zone="doomstadt"><strong>FASE 1 · DOOMSTADT</strong><span>Centro · Vale Imperial & Lagoas</span></button>
              <button class="ow-zone-btn" data-zone="north_gate"><strong>FASE 1B · RIO LATVER</strong><span>Norte · Executor Doom-Prime</span></button>
              <button class="ow-zone-btn" data-zone="dark_forest"><strong>FASE 2 · FLORESTA NEGRA</strong><span>Oeste · Barão Mordo (Selo 1)</span></button>
              <button class="ow-zone-btn" data-zone="industrial_citadel"><strong>FASE 3 · CRATERA SENTINELAS</strong><span>Leste · Sentinela 11.5m (Selo 2)</span></button>
              <button class="ow-zone-btn" data-zone="tundra_glacial"><strong>FASE 4 · TUNDRA GLACIAL</strong><span>Norte · O Destruidor (Selo 3)</span></button>
              <button class="ow-zone-btn danger" data-zone="castle_rift"><strong>FASE 5 · CIDADELA DE DOOM</strong><span>Norte Alto · Victor Von Doom</span></button>
              <button class="ow-zone-btn" data-zone="highlands_south"><strong>SUL · PLANALTOS CÁRPATOS</strong><span>Sul · Aquedutos & Lago Esmeralda</span></button>
              <button class="ow-zone-btn" data-zone="wakanda_jungle"><strong>SUDOESTE · SELVA VIBRANIUM</strong><span>Cenote Ancestral & Meteoros</span></button>
              <button class="ow-zone-btn" data-zone="asgard_ruins"><strong>SUDESTE · RUÍNAS DE ASGARD</strong><span>Colunas Solares & Bifrost</span></button>
              <button class="ow-zone-btn act2" data-zone="asteroid_m"><strong>ATO II · ASTEROIDE M</strong><span>Extremo Oeste · Magneto Imperial</span></button>
              <button class="ow-zone-btn act2" data-zone="time_citadel"><strong>ATO II · CIDADELA TEMPORAL</strong><span>Extremo Leste · Imperador Kang</span></button>
              <button class="ow-zone-btn act2 danger" data-zone="void_abyss"><strong>ATO II · VAZIO ABISSAL</strong><span>Extremo Norte · The Void</span></button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(mapModal);

      document.getElementById('ow-map-close').addEventListener('click', () => this.toggleWorldMap(false));
      mapModal.querySelectorAll('.ow-zone-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.fastTravelTo(btn.dataset.zone);
          this.toggleWorldMap(false);
        });
      });
    }
  };

  DoomsdayGame.prototype.bindOpenWorldKeys = function () {
    window.addEventListener('keydown', (e) => {
      if (!this.isPlaying || this.isGameOver || this.isPaused) return;
      if (window.CutsceneDirector && window.CutsceneDirector.isPlaying) return;
      if (e.code === 'KeyM' || e.code === 'Tab') {
        e.preventDefault();
        this.toggleWorldMap(!this.worldMapOpen);
      } else if (e.code === 'Escape' && this.worldMapOpen) {
        this.toggleWorldMap(false);
      }
    });
  };

  DoomsdayGame.prototype.toggleWorldMap = function (open) {
    this.worldMapOpen = open;
    const modal = document.getElementById('ow-map-modal');
    if (!modal) return;
    modal.classList.toggle('hidden', !open);
    if (open) {
      if (document.pointerLockElement) document.exitPointerLock();
      this.drawWorldMapCanvas();
    }
  };

  DoomsdayGame.prototype.drawWorldMapCanvas = function () {
    const canvas = document.getElementById('worldmap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, W, H);

    // Map expanded 3600m continent [-1560..1560, -1480..920] -> [0..320]
    const toPx = (wx, wz) => ({
      x: ((wx + 1560) / 3120) * W,
      y: ((wz + 1480) / 2400) * H
    });

    const fillZone = (x, z, w, d, color, label) => {
      const p1 = toPx(x - w * 0.5, z - d * 0.5);
      const p2 = toPx(x + w * 0.5, z + d * 0.5);
      ctx.fillStyle = color;
      ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      ctx.fillStyle = 'rgba(248,250,252,0.68)';
      ctx.font = 'bold 7px Space Grotesk, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, (p1.x + p2.x) * 0.5, (p1.y + p2.y) * 0.5);
    };

    fillZone(0, 80, 290, 290, 'rgba(34, 197, 94, 0.16)', 'DOOMSTADT');
    fillZone(-520, 30, 680, 340, 'rgba(168, 85, 247, 0.18)', 'FLORESTA');
    fillZone(520, 30, 680, 340, 'rgba(249, 115, 22, 0.18)', 'CRATERA');
    fillZone(0, -295, 480, 320, 'rgba(56, 189, 248, 0.16)', 'TUNDRA');
    fillZone(0, -590, 300, 195, 'rgba(16, 185, 129, 0.24)', 'CIDADELA DOOM');
    fillZone(0, 560, 560, 520, 'rgba(234, 179, 8, 0.16)', 'PLANALTOS SUL');
    fillZone(-580, 560, 540, 520, 'rgba(45, 212, 191, 0.18)', 'SELVA VIBRANIUM');
    fillZone(580, 560, 540, 520, 'rgba(250, 204, 21, 0.18)', 'RUÍNAS ASGARD');

    const a2Alpha = this.postDoomUnlocked ? 0.24 : 0.08;
    fillZone(-1220, -60, 440, 440, `rgba(232, 121, 249, ${a2Alpha})`, this.postDoomUnlocked ? 'ASTEROIDE M' : 'ATO II');
    fillZone(1220, -60, 440, 440, `rgba(34, 211, 238, ${a2Alpha})`, this.postDoomUnlocked ? 'CIDADELA KANG' : 'ATO II');
    fillZone(0, -1180, 520, 380, `rgba(250, 204, 21, ${a2Alpha})`, this.postDoomUnlocked ? 'VAZIO ABISSAL' : 'ATO II');

    // Latver River strip
    const rL = toPx(-900, -108), rR = toPx(900, -108);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(rL.x, rL.y); ctx.lineTo(rR.x, rR.y); ctx.stroke();

    // Abyss Bridge
    const b1 = toPx(0, -360), b2 = toPx(0, -500);
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();

    // Energy Towers
    if (this.world && this.world.energyTowers) {
      this.world.energyTowers.forEach(tw => {
        if (tw.destroyed) return;
        const p = toPx(tw.pos.x, tw.pos.z);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      });
    }

    // Mini-Bosses
    if (this.miniBosses) {
      this.miniBosses.forEach(mb => {
        const p = toPx(mb.pos.x, mb.pos.z);
        ctx.fillStyle = mb.alive ? '#facc15' : '#475569';
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
      });
    }

    // Dr. Doom
    if (this.doomBoss && this.doomBoss.hp > 0) {
      const dp = toPx(this.doomBoss.pos.x, this.doomBoss.pos.z);
      ctx.fillStyle = '#34d399';
      ctx.beginPath(); ctx.arc(dp.x, dp.y, 6, 0, Math.PI * 2); ctx.fill();
    }

    // Player Marker
    const pp = toPx(this.playerState.pos.x, this.playerState.pos.z);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(pp.x, pp.y, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  DoomsdayGame.prototype.fastTravelTo = function (zoneId) {
    if (zoneId === 'castle_rift' && this.world && !this.world.castleBarrierUnlocked) {
      this.triggerEventBanner('QUEBRE OS 3 SELOS IMPERIAIS ANTES DE INVADIR O CASTELO!', '#ef4444');
      return;
    }
    if (['void_abyss', 'asteroid_m', 'time_citadel'].includes(zoneId) && !this.postDoomUnlocked) {
      this.triggerEventBanner('DERROTE O DOUTOR DOOM NO CASTELO PARA DESBLOQUEAR O ATO II!', '#facc15');
      return;
    }
    const portals = (this.world && this.world.fastTravelPortals) || [];
    const target = portals.find(p => p.id === zoneId);
    if (!target) return;
    this.playerState.pos.copy(target.pos).add(new THREE.Vector3(0, 0.6, 5));
    this.playerState.vel.set(0, 0, 0);
    this.spawnShockwave(this.playerState.pos, target.color, 9.0, 0.45);
    window.soundSystem.playDash();
    this.triggerEventBanner(`VIAGEM RÁPIDA // ${target.name.toUpperCase()}`, '#38bdf8');
  };

  DoomsdayGame.prototype.damageEnergyTower = function (tw, dmg, colorStr, isHeavy = false) {
    if (!tw || tw.destroyed) return;
    tw.hp = Math.max(0, tw.hp - dmg);
    this.spawnDamageNumber(tw.pos.clone().add(new THREE.Vector3(0, 12.0, 0)), dmg, '#34d399', isHeavy);
    this.spawnSparks(tw.pos.clone().add(new THREE.Vector3(0, 6.0, 0)), 0x10b981, isHeavy ? 14 : 7);
    if (tw.hp <= 0) {
      tw.destroyed = true;
      this.towersDestroyed++;
      if (tw.mesh) this.scene.remove(tw.mesh);
      if (tw.beam) this.scene.remove(tw.beam);
      this.playerState.ultCharge = Math.min(100, this.playerState.ultCharge + 28);
      this.spawnShockwave(tw.pos, 0x10b981, 14, 0.55);
      this.triggerEventBanner(`TORRE DESTRUÍDA (${this.towersDestroyed}/4) // ESCUDO DE DOOM REDUZIDO`, '#34d399');
      window.soundSystem.playExplosion();
    }
  };

  DoomsdayGame.prototype.damageBoss = function (baseDmg, isHeavy = false) {
    const towerShield = Math.max(0.55, 1.0 - (4 - (this.towersDestroyed || 0)) * 0.10);
    return _origDamageBoss.call(this, Math.round(baseDmg * towerShield), isHeavy);
  };

  DoomsdayGame.prototype.updatePlayer = function (delta, time) {
    _origUpdatePlayer.call(this, delta, time);

    if (window.BiomeAtmosphere) {
      const res = window.BiomeAtmosphere.update(this.playerState.pos.x, this.playerState.pos.z, delta);
      const chip = document.getElementById('ow-biome-name');
      if (chip) chip.textContent = res.preset.name;
      if (res.changed) {
        const banner = document.getElementById('ow-biome-banner');
        if (banner) {
          document.getElementById('ow-banner-title').textContent = res.preset.name;
          document.getElementById('ow-banner-sub').textContent = res.preset.subtitle;
          banner.classList.remove('hidden');
          this.biomeBannerTimer = 2.8;
        }
      }
      if (this.biomeBannerTimer > 0) {
        this.biomeBannerTimer -= delta;
        if (this.biomeBannerTimer <= 0) {
          const banner = document.getElementById('ow-biome-banner');
          if (banner) banner.classList.add('hidden');
        }
      }
    }

    const progChip = document.getElementById('ow-progress-chip');
    if (progChip) {
      progChip.textContent = `SELOS ${this.sealsBroken || 0}/3 · BOSSES ${this.miniBossesDefeated || 0}/4 · NV.${this.playerLevel || 1}`;
    }

    // Castle Barrier Push-Back Notice when hitting locked gate
    if (this.world && !this.world.castleBarrierUnlocked && this.playerState.pos.z < -498 && Math.abs(this.playerState.pos.x) < 28) {
      if ((this._barrierWarnCd || 0) <= 0) {
        this._barrierWarnCd = 2.5;
        this.triggerEventBanner(`BARREIRA SELADA! QUEBRE OS 3 SELOS (${this.sealsBroken || 0}/3)`, '#10b981');
      }
    }
    if (this._barrierWarnCd > 0) this._barrierWarnCd -= delta;

    // Animate 3D HP bars on Energy Towers
    if (this.world && this.world.energyTowers) {
      for (const tw of this.world.energyTowers) {
        if (tw.destroyed) continue;
        tw.hpBarBg.lookAt(this.camera.position);
        const ratio = Math.max(0, tw.hp / tw.maxHp);
        tw.hpBarFill.scale.x = Math.max(0.001, ratio);
        tw.hpBarFill.position.x = -(1 - ratio) * 1.32;
      }
    }

    // Collect / Smash Living World Energy Crystals
    if (this.world && this.world.lootCrystals) {
      const ps = this.playerState;
      const attacking = this.playerMesh && this.playerMesh.userData.attackTimer > 0.35;
      for (const c of this.world.lootCrystals) {
        if (c.collected) continue;
        const d = ps.pos.distanceTo(c.pos);
        if (d < 2.9 || (attacking && d < 6.2)) {
          c.collected = true;
          c.respawnTimer = 28.0;
          c.mesh.visible = false;
          ps.hp = Math.min(ps.maxHp, ps.hp + 85);
          ps.stamina = Math.min(ps.maxStamina, ps.stamina + 45);
          ps.ultCharge = Math.min(100, ps.ultCharge + 16);
          this.spawnShockwave(c.pos, c.color, 6.5, 0.35);
          if (this.vfxPro) this.vfxPro.vfx.healParticles(c.pos, '#34d399');
          window.soundSystem.playUISelect();
          this.triggerEventBanner('+85 HP · +45 STAMINA · +16% ULT', '#34d399');
        }
      }
    }

    if (this.updateMiniBosses) this.updateMiniBosses(delta, time);
  };

  DoomsdayGame.prototype.updateHUD = function () {
    _origUpdateHUD.call(this);

    const ps = this.playerState;
    const boss = this.doomBoss;
    const bossBar = document.getElementById('boss-bar-wrap');
    const missionPill = document.getElementById('mission-pill');

    if (!(boss.active && boss.hp > 0) && this.miniBosses) {
      let nearestMb = null;
      let nearestDist = 64;
      for (const mb of this.miniBosses) {
        if (!mb.alive) continue;
        const d = mb.pos.distanceTo(ps.pos);
        if (d < nearestDist) {
          nearestDist = d;
          nearestMb = mb;
        }
      }
      if (nearestMb) {
        bossBar.classList.remove('hidden');
        missionPill.classList.add('hidden');
        bossBar.querySelector('strong').textContent = nearestMb.name;
        document.getElementById('boss-hp-fill').style.width = `${(nearestMb.hp / nearestMb.maxHp) * 100}%`;
        document.getElementById('boss-hp-trail').style.width = `${(nearestMb.hp / nearestMb.maxHp) * 100}%`;
        document.getElementById('boss-posture-fill').style.width = `${(nearestMb.posture / nearestMb.maxPosture) * 100}%`;
        document.getElementById('boss-phase-tag').textContent = nearestMb.phaseTag;
      } else {
        bossBar.querySelector('strong').textContent = 'DOUTOR VICTOR VON DOOM';
      }
    } else if (boss.active && boss.hp > 0) {
      bossBar.querySelector('strong').textContent = 'DOUTOR VICTOR VON DOOM';
    }

    if (!missionPill.classList.contains('hidden')) {
      const aliveSealBoss = (this.miniBosses || []).find(m => m.alive && m.sealBoss);
      let phaseLabel = 'FASE 5/5 // INVADA O CASTELO E DERROTE O DR. DESTINO';
      let targetPos = boss.pos;
      if (aliveSealBoss) {
        const pNum = aliveSealBoss.id === 'archmage' ? 2 : aliveSealBoss.id === 'sentinel' ? 3 : 4;
        phaseLabel = `FASE ${pNum}/5 // DERROTE ${aliveSealBoss.name} (${this.sealsBroken || 0}/3 SELOS)`;
        targetPos = aliveSealBoss.pos;
      }
      const distM = Math.round(ps.pos.distanceTo(targetPos));
      document.getElementById('mission-text').textContent = `${phaseLabel} · ${distM}M`;
    }
  };

  DoomsdayGame.prototype.drawMinimap = function () {
    const canvas = document.getElementById('minimap-canvas');
    if (!canvas) return _origDrawMinimap.call(this);

    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height, cx = w * 0.5, cy = h * 0.5;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = 'rgba(10, 14, 24, 0.88)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
    ctx.lineWidth = 1;
    [24, 48, 68].forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); });

    const scale = 0.24;
    const cos = Math.cos(-this.camYaw);
    const sin = Math.sin(-this.camYaw);
    const toMap = (wx, wz) => {
      const dx = wx - this.playerState.pos.x;
      const dz = wz - this.playerState.pos.z;
      return {
        x: cx + (dx * cos - dz * sin) * scale,
        y: cy + (dx * sin + dz * cos) * scale
      };
    };

    if (this.world && this.world.fastTravelPortals) {
      ctx.fillStyle = '#38bdf8';
      this.world.fastTravelPortals.forEach(p => {
        const m = toMap(p.pos.x, p.pos.z);
        ctx.fillRect(m.x - 2, m.y - 2, 4, 4);
      });
    }

    if (this.world && this.world.energyTowers) {
      ctx.fillStyle = '#10b981';
      this.world.energyTowers.forEach(tw => {
        if (tw.destroyed) return;
        const m = toMap(tw.pos.x, tw.pos.z);
        ctx.beginPath(); ctx.arc(m.x, m.y, 3.0, 0, Math.PI * 2); ctx.fill();
      });
    }

    this.doombots.forEach((b) => {
      if (b.dead) return;
      const m = toMap(b.pos.x, b.pos.z);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(m.x, m.y, 2.0, 0, Math.PI * 2); ctx.fill();
    });

    if (this.miniBosses) {
      ctx.fillStyle = '#facc15';
      this.miniBosses.forEach(mb => {
        if (!mb.alive) return;
        const m = toMap(mb.pos.x, mb.pos.z);
        ctx.beginPath(); ctx.arc(m.x, m.y, 4.5, 0, Math.PI * 2); ctx.fill();
      });
    }

    if (this.doomBoss.hp > 0) {
      const bm = toMap(this.doomBoss.pos.x, this.doomBoss.pos.z);
      ctx.fillStyle = '#c084fc';
      ctx.beginPath(); ctx.arc(bm.x, bm.y, 5.2, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5.5);
    ctx.lineTo(cx + 4.2, cy + 4.8);
    ctx.lineTo(cx - 4.2, cy + 4.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
})();

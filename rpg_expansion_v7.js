// ============================================================================
// AVENGERS: DOOMSDAY — RPG PROGRESSION, 7 POWERS PER HERO, SWIM & ACT II BOSSES
// ============================================================================
(function () {
  if (typeof DoomsdayGame === 'undefined' || typeof HEROES_DATA === 'undefined') return;

  const RPG_SKILLS = {
    spider_man: [
      { key: 1, reqLv: 2, cd: 8.5, anim: 'web_drone', name: 'Drone Aranha Stark', desc: 'Conjura drone orbital que dispara rajadas e teias por 9s.' },
      { key: 2, reqLv: 4, cd: 10.0, anim: 'web_catapult', name: 'Catapulta Sísmica', desc: 'Gira destroço de concreto em 360° e arremessa causando explosão.' },
      { key: 3, reqLv: 7, cd: 14.0, anim: 'spider_sense', name: 'Instinto Superior', desc: 'Esquiva automática + contra-ataques das 4 Waldoes por 6s.' }
    ],
    iron_man: [
      { key: 1, reqLv: 2, cd: 8.0, anim: 'iron_unibeam', name: 'Cortador Laser 360°', desc: 'Varredura orbital de lasers rubi ao redor da armadura.' },
      { key: 2, reqLv: 4, cd: 11.5, anim: 'cast', name: 'Torreta Sentinela Stark', desc: 'Implanta satélite autônomo atirando plasma por 11s.' },
      { key: 3, reqLv: 7, cd: 15.0, anim: 'iron_bleeding', name: 'Sobrecarga Bleeding Edge', desc: 'Canhões dorsais gêmeos + zera recargas de M2/Q.' }
    ],
    thor: [
      { key: 1, reqLv: 2, cd: 8.5, anim: 'spin_tornado', name: 'Tornado de Mjolnir', desc: 'Vórtice elétrico puxa inimigos ao centro e eletrocuta em cadeia.' },
      { key: 2, reqLv: 4, cd: 11.0, anim: 'wolv_roar', name: 'Manto Força de Odin', desc: 'Armadura de relâmpagos que fere próximos e +35% agilidade por 7s.' },
      { key: 3, reqLv: 7, cd: 14.5, anim: 'thor_stormbreaker', name: 'Fenda do Rompe-Tormentas', desc: 'Golpe vertical invocando fissura colossal de trovão azul-branco.' }
    ],
    doctor_strange: [
      { key: 1, reqLv: 2, cd: 9.0, anim: 'strange_mirror', name: 'Prisão Espelhada', desc: 'Encerra alvos em 6 cristais fractais que implodem em dano místico.' },
      { key: 2, reqLv: 4, cd: 12.0, anim: 'strange_ikonn', name: 'Imagens de Ikonn', desc: 'Invoca 2 avatares astrais disparando feixes arcanos por 9s.' },
      { key: 3, reqLv: 7, cd: 15.0, anim: 'wanda_crown', name: 'Chamas dos Faltine', desc: 'Coluna espiral de fogo eldritch incinerando toda a área.' }
    ],
    captain_america: [
      { key: 1, reqLv: 2, cd: 9.0, anim: 'cap_bastion', name: 'Bastião Vingador', desc: 'Domo estrelado de Vibranium que concede escudo absorvedor.' },
      { key: 2, reqLv: 4, cd: 10.5, anim: 'cap_worthy', name: 'Trovão de Mjolnir', desc: 'Impacta o martelo contra o escudo liberando onda sônico-elétrica.' },
      { key: 3, reqLv: 7, cd: 14.0, anim: 'cap_rally', name: 'Liderança Indomável', desc: 'Recupera 32% HP e garante acertos críticos massivos por 6s.' }
    ],
    reed_richards: [
      { key: 1, reqLv: 2, cd: 8.5, anim: 'reed_wall', name: 'Muralha Elástica', desc: 'Expande barreira de borracha que esmaga à frente e reflete tiros.' },
      { key: 2, reqLv: 4, cd: 11.0, anim: 'reed_cannon', name: 'Canhão Baxter Graviton', desc: 'Lança emissor quântico criando poço de gravidade azul.' },
      { key: 3, reqLv: 7, cd: 14.0, anim: 'reed_hyper', name: 'Hiper-Elasticidade', desc: 'Punhos colossais giratórios atingindo raio triplo à frente.' }
    ],
    black_panther: [
      { key: 1, reqLv: 2, cd: 8.0, anim: 'panther_spears', name: 'Salva de Wakanda', desc: 'Salta lançando 5 lanças de Vibranium que pulsam choque violeta.' },
      { key: 2, reqLv: 4, cd: 10.5, anim: 'wolv_fissure', name: 'Emboscada das Sombras', desc: 'Avanço furtivo letal com corte crítico de 320% e +energia cinética.' },
      { key: 3, reqLv: 7, cd: 14.0, anim: 'spin_tornado', name: 'Rei dos Mortos', desc: 'Espíritos de Bast orbitam o traje descarregando explosões roxas.' }
    ],
    wolverine: [
      { key: 1, reqLv: 2, cd: 8.5, anim: 'wolv_roar', name: 'Rugido Mutante', desc: 'Quebra postura ao redor + roubo de vida por ataque durante 7s.' },
      { key: 2, reqLv: 4, cd: 9.5, anim: 'wolv_fissure', name: 'Fenda Adamantium', desc: 'Rasga o solo lançando 3 ondas cortantes incandescentes à frente.' },
      { key: 3, reqLv: 7, cd: 15.0, anim: 'cap_rally', name: 'Fator de Cura X', desc: 'Regeneração contínua intensa e imunidade a atordoamento por 8s.' }
    ],
    scarlet_witch: [
      { key: 1, reqLv: 2, cd: 8.5, anim: 'wanda_crown', name: 'Chuva Telecinética', desc: 'Arranca 4 meteoros do chão e os dispara teleguiados.' },
      { key: 2, reqLv: 4, cd: 11.5, anim: 'wanda_obelisks', name: 'Obeliscos Darkhold', desc: '4 totens do caos drenam vida dos inimigos para curar Wanda.' },
      { key: 3, reqLv: 7, cd: 15.0, anim: 'strange_ikonn', name: 'Coroa Feiticeira', desc: 'Levitação carmesim disparando hexágonos caóticos por 7s.' }
    ]
  };

  window.RPG_SKILLS = RPG_SKILLS;

  const _origStart = DoomsdayGame.prototype.startGame;
  const _origUpdatePlayer = DoomsdayGame.prototype.updatePlayer;
  const _origUpdateHUD = DoomsdayGame.prototype.updateHUD;
  const _origApplyTargetHit = DoomsdayGame.prototype.applyTargetHit;
  const _origUpdateMiniBosses = DoomsdayGame.prototype.updateMiniBosses;
  const _origUpdateBoss = DoomsdayGame.prototype.updateBoss;

  DoomsdayGame.prototype.startGame = function () {
    if (this.world) {
      this.world.postDoomUnlocked = false;
      if (this.world.act2Barriers) this.world.act2Barriers.forEach(b => { if (b) b.visible = true; });
    }
    this.rpgXp = 0;
    this.rpgXpNext = 120;
    this.playerLevel = 1;
    this.rpgSkillPoints = 0;
    this.rpgStats = { force: 0, vitality: 0, focus: 0 };
    this.rpgCooldowns = [0, 0, 0];
    this.rpgSummons = [];
    this.playerAgilityMult = 1.0;
    this.postDoomUnlocked = false;
    this.act2Bosses = [];
    this.act2BossesDefeated = 0;
    this.skillTreeOpen = false;
    this._buffs = { lifesteal: 0, critBoost: 0, autoDodge: 0, regen: 0, agility: 0, bastionShield: 0 };

    _origStart.call(this);
    this.setupRpgUI();
    this.updateRpgDockUI();
  };

  DoomsdayGame.prototype.gainXp = function (amount, worldPos = null) {
    if (!amount || amount <= 0) return;
    this.rpgXp = (this.rpgXp || 0) + Math.round(amount);
    if (worldPos) {
      this.spawnDamageNumber(worldPos.clone().add(new THREE.Vector3(0, 2.5, 0)), `+${Math.round(amount)} XP`, '#facc15', false);
    }
    while (this.rpgXp >= (this.rpgXpNext || 120) && (this.playerLevel || 1) < 15) {
      this.rpgXp -= this.rpgXpNext;
      this.playerLevel = (this.playerLevel || 1) + 1;
      this.rpgXpNext = Math.round(120 * Math.pow(1.26, this.playerLevel - 1));
      this.rpgSkillPoints = (this.rpgSkillPoints || 0) + 1;

      const baseHp = HEROES_DATA[this.selectedHeroId].health;
      this.playerState.maxHp = baseHp + (this.playerLevel - 1) * 45 + (this.rpgStats?.vitality || 0) * 90;
      this.playerState.hp = this.playerState.maxHp;

      const heroCol = HEROES_DATA[this.selectedHeroId].colorHex;
      this.spawnShockwave(this.playerState.pos, 0xfacc15, 11.5, 0.65);
      if (this.vfxPro) this.vfxPro.vfx.healParticles(this.playerState.pos, '#facc15');
      window.soundSystem.playPhaseTransition();

      const kit = RPG_SKILLS[this.selectedHeroId] || [];
      const unlocked = kit.find(s => s.reqLv === this.playerLevel);
      const unlockMsg = unlocked ? ` // DESBLOQUEADO [${unlocked.key}]: ${unlocked.name.toUpperCase()}!` : ' // +1 PONTO RPG [K]';
      this.triggerEventBanner(`NÍVEL ${this.playerLevel} ALCANÇADO${unlockMsg}`, '#facc15');
      this.updateRpgDockUI();
    }
  };

  DoomsdayGame.prototype.setupRpgUI = function () {
    if (document.getElementById('rpg-tree-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'rpg-tree-modal';
    modal.className = 'ow-map-modal hidden interactive';
    modal.innerHTML = `
      <div class="rpg-tree-card">
        <div class="ow-map-header">
          <div>
            <h2 id="rpg-modal-title">EVOLUÇÃO RPG // VINGADORES</h2>
            <p id="rpg-modal-sub">Pontos disponíveis: 0 · Desbloqueie poderes subindo de nível</p>
          </div>
          <button id="rpg-modal-close" class="ow-map-close" type="button">FECHAR [K]</button>
        </div>
        <div class="rpg-stats-row">
          <div class="rpg-stat-box"><strong>FORÇA (+12% DANO)</strong><span id="rpg-val-force">Nv. 0</span><button class="skew-chip interactive" data-upg="force">+ EVOLUIR</button></div>
          <div class="rpg-stat-box"><strong>ARMADURA (+90 HP)</strong><span id="rpg-val-vitality">Nv. 0</span><button class="skew-chip interactive" data-upg="vitality">+ EVOLUIR</button></div>
          <div class="rpg-stat-box"><strong>FOCO (-10% RECARGA)</strong><span id="rpg-val-focus">Nv. 0</span><button class="skew-chip interactive" data-upg="focus">+ EVOLUIR</button></div>
        </div>
        <div id="rpg-skills-grid" class="rpg-skills-grid"></div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById('rpg-modal-close').addEventListener('click', () => this.toggleSkillTreeModal(false));
    modal.querySelectorAll('[data-upg]').forEach(btn => {
      btn.addEventListener('click', () => {
        if ((this.rpgSkillPoints || 0) <= 0) return;
        const k = btn.dataset.upg;
        this.rpgSkillPoints--;
        this.rpgStats[k] = (this.rpgStats[k] || 0) + 1;
        if (k === 'vitality') {
          this.playerState.maxHp += 90;
          this.playerState.hp = Math.min(this.playerState.maxHp, this.playerState.hp + 90);
        }
        window.soundSystem.playUISelect();
        this.renderRpgTreeModal();
      });
    });
  };

  DoomsdayGame.prototype.toggleSkillTreeModal = function (force) {
    const open = force !== undefined ? force : !this.skillTreeOpen;
    this.skillTreeOpen = open;
    const modal = document.getElementById('rpg-tree-modal');
    if (!modal) return;
    modal.classList.toggle('hidden', !open);
    if (open) {
      if (document.pointerLockElement) document.exitPointerLock();
      this.renderRpgTreeModal();
    } else {
      this.safeRequestPointerLock();
    }
  };

  DoomsdayGame.prototype.renderRpgTreeModal = function () {
    const hero = HEROES_DATA[this.selectedHeroId];
    const kit = RPG_SKILLS[this.selectedHeroId] || [];
    document.getElementById('rpg-modal-title').textContent = `EVOLUÇÃO RPG // ${hero.name.toUpperCase()} (NV.${this.playerLevel || 1})`;
    document.getElementById('rpg-modal-sub').textContent = `XP: ${this.rpgXp || 0}/${this.rpgXpNext || 120} · Pontos Disponíveis: ${this.rpgSkillPoints || 0}`;
    document.getElementById('rpg-val-force').textContent = `Nv. ${this.rpgStats?.force || 0}`;
    document.getElementById('rpg-val-vitality').textContent = `Nv. ${this.rpgStats?.vitality || 0}`;
    document.getElementById('rpg-val-focus').textContent = `Nv. ${this.rpgStats?.focus || 0}`;

    const grid = document.getElementById('rpg-skills-grid');
    const basePowers = [
      { key: 'M1', reqLv: 1, name: hero.primaryName, desc: hero.primaryDesc },
      { key: 'M2/E', reqLv: 1, name: hero.uniqueName, desc: hero.uniqueDesc },
      { key: 'Q', reqLv: 1, name: hero.skillName, desc: hero.skillDesc },
      { key: 'R', reqLv: 1, name: hero.ultName, desc: hero.ultDesc }
    ].concat(kit);

    grid.innerHTML = basePowers.map(p => {
      const unlocked = (this.playerLevel || 1) >= p.reqLv;
      return `<div class="rpg-skill-item ${unlocked ? 'unlocked' : 'locked'}">
        <div class="rpg-skill-head"><span class="rpg-key-pill">[${p.key}]</span><strong>${p.name}</strong><small>${unlocked ? 'ATIVO' : `NV.${p.reqLv}`}</small></div>
        <p>${p.desc}</p>
      </div>`;
    }).join('');
  };

  DoomsdayGame.prototype.updateRpgDockUI = function () {
    const kit = RPG_SKILLS[this.selectedHeroId] || [];
    kit.forEach((sk, idx) => {
      const slotEl = document.getElementById(`slot-${idx + 1}`);
      const lblEl = document.getElementById(`slot-${idx + 1}-label`);
      if (!slotEl || !lblEl) return;
      const unlocked = (this.playerLevel || 1) >= sk.reqLv;
      slotEl.classList.toggle('locked', !unlocked);
      lblEl.textContent = unlocked ? sk.name.split(' ')[0] : `Nv.${sk.reqLv}`;
    });
  };

  DoomsdayGame.prototype.triggerRpgSkill = function (slotNum) {
    const idx = slotNum - 1;
    const kit = RPG_SKILLS[this.selectedHeroId];
    if (!kit || !kit[idx]) return;
    const sk = kit[idx];
    if ((this.playerLevel || 1) < sk.reqLv) {
      this.triggerEventBanner(`HABILIDADE [${slotNum}] DESBLOQUEIA NO NÍVEL ${sk.reqLv}!`, '#94a3b8');
      return;
    }
    if ((this.rpgCooldowns[idx] || 0) > 0) return;

    const focusMult = Math.max(0.55, 1.0 - (this.rpgStats?.focus || 0) * 0.10);
    this.rpgCooldowns[idx] = sk.cd * focusMult;

    const ps = this.playerState;
    const hero = HEROES_DATA[this.selectedHeroId];
    const dmgScale = 1.0 + ((this.playerLevel || 1) - 1) * 0.16 + (this.rpgStats?.force || 0) * 0.12;
    const fwd = new THREE.Vector3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw)).normalize();
    const origin = ps.pos.clone().add(new THREE.Vector3(0, 1.5, 0));

    if (this.playerMesh && CharacterBuilder.playPowerAnim) {
      CharacterBuilder.playPowerAnim(this.playerMesh, sk.anim, 0.72);
    }
    this.triggerEventBanner(sk.name.toUpperCase(), hero.color);
    window.soundSystem.playSpecial();
    this.addTrauma(0.28);

    // Execute bespoke 3D VFX & mechanics per Hero x Skill Slot
    const hitAoe = (center, radius, dmg, colorHex, isHeavy = true) => {
      this.doombots.forEach(b => {
        if (!b.dead && b.pos.distanceTo(center) < radius) {
          this.applyTargetHit({ pos: b.pos, isBoss: false, ref: b }, Math.round(dmg * dmgScale), colorHex, isHeavy);
        }
      });
      if (this.miniBosses) {
        this.miniBosses.forEach(mb => {
          if (mb.alive && mb.pos.distanceTo(center) < radius + 2.5) {
            this.damageMiniBoss(mb, Math.round(dmg * dmgScale), isHeavy);
          }
        });
      }
      if (this.doomBoss && this.doomBoss.hp > 0 && this.doomBoss.pos.distanceTo(center) < radius + 3.0) {
        this.damageBoss(Math.round(dmg * dmgScale), isHeavy);
      }
    };

    const hid = this.selectedHeroId;
    if (sk.anim === 'web_drone' || sk.anim === 'cast' || sk.anim === 'strange_ikonn' || sk.anim === 'wanda_obelisks' || sk.anim === 'reed_cannon') {
      // Autonomous Orbiting / Ground Turret / Clone / Gravity Well Summon
      const orbColor = hero.colorHex;
      const orbMesh = new THREE.Group();
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshBasicMaterial({ color: orbColor }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 6, 20), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      ring.rotation.x = Math.PI / 2;
      orbMesh.add(core, ring);
      const startPos = sk.anim === 'web_drone' ? origin.clone().add(new THREE.Vector3(0, 1.4, 0)) : ps.pos.clone().addScaledVector(fwd, 5.5).add(new THREE.Vector3(0, 1.8, 0));
      orbMesh.position.copy(startPos);
      this.scene.add(orbMesh);
      this.rpgSummons.push({
        mesh: orbMesh, pos: orbMesh.position, orbitPlayer: sk.anim === 'web_drone',
        pullCenter: sk.anim === 'reed_cannon', drainHeal: sk.anim === 'wanda_obelisks',
        life: 9.5, fireCd: 0.2, colorHex: orbColor, colorStr: hero.color, dmg: Math.round(68 * dmgScale)
      });
    } else if (sk.anim === 'web_catapult' || sk.anim === 'reed_hyper' || sk.anim === 'panther_spears' || sk.anim === 'wolv_fissure') {
      const impact = ps.pos.clone().addScaledVector(fwd, 9.5);
      for (let i = -2; i <= 2; i++) {
        const dir = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.22);
        const spear = new THREE.Mesh(new THREE.ConeGeometry(0.32, 2.2, 5), CustomShaders.createBeamShaderMaterial(0xffffff, hero.colorHex));
        spear.rotation.x = Math.PI / 2;
        spear.position.copy(origin);
        spear.lookAt(origin.clone().add(dir));
        this.scene.add(spear);
        this.projectiles.push({ mesh: spear, pos: origin.clone(), vel: dir.multiplyScalar(38), dmg: Math.round(135 * dmgScale), color: hero.color, isPlayer: true, radius: 1.4, life: 1.8, isHeavy: true });
      }
      this.spawnShockwave(impact, hero.colorHex, 12.5, 0.55);
      hitAoe(impact, 11.5, 195, hero.colorHex, true);
    } else if (sk.anim === 'iron_unibeam' || sk.anim === 'iron_bleeding' || sk.anim === 'thor_stormbreaker' || sk.anim === 'cap_worthy' || sk.anim === 'wanda_crown') {
      const endPt = origin.clone().addScaledVector(fwd, 28);
      if (this.vfx) this.vfx.spawnVolumetricBeam(origin, endPt, { color: hero.colorHex, coreColor: 0xffffff, width: 1.5, duration: 0.55 });
      if (sk.anim === 'iron_bleeding') {
        ps.skillCooldown = 0; ps.uniqueCooldown = 0;
      }
      this.spawnShockwave(ps.pos, hero.colorHex, 16.0, 0.6);
      hitAoe(ps.pos.clone().addScaledVector(fwd, 11), 14.5, 290, hero.colorHex, true);
    } else if (sk.anim === 'spin_tornado' || sk.anim === 'strange_mirror' || sk.anim === 'reed_wall' || sk.anim === 'cap_bastion') {
      this.spawnShockwave(ps.pos, hero.colorHex, 15.0, 0.65);
      if (sk.anim === 'cap_bastion' || sk.anim === 'reed_wall') {
        ps.shieldActive = true; ps.shieldTimer = 4.2; ps.invulnTimer = Math.max(ps.invulnTimer, 1.2);
      }
      // Pull nearby enemies inward & burst
      this.doombots.forEach(b => {
        if (!b.dead && b.pos.distanceTo(ps.pos) < 16) {
          b.pos.lerp(ps.pos, 0.55); b.staggerTimer = 1.6;
        }
      });
      hitAoe(ps.pos, 15.5, 215, hero.colorHex, true);
    } else {
      // Buffs & Empowered States (Instinto Superior, Força Odin, Liderança, Rugido Mutante, Fator de Cura)
      if (sk.anim === 'cap_rally') ps.hp = Math.min(ps.maxHp, ps.hp + Math.round(ps.maxHp * 0.32));
      this._buffs.lifesteal = Math.max(this._buffs.lifesteal, 6.5);
      this._buffs.agility = Math.max(this._buffs.agility, 7.0);
      this.playerAgilityMult = 1.32;
      ps.invulnTimer = Math.max(ps.invulnTimer, 1.4);
      this.spawnShockwave(ps.pos, hero.colorHex, 13.0, 0.55);
      hitAoe(ps.pos, 12.0, 175, hero.colorHex, true);
    }
  };

  DoomsdayGame.prototype.updatePlayer = function (delta, time) {
    _origUpdatePlayer.call(this, delta, time);
    if (!this.rpgCooldowns) return;
    for (let i = 0; i < 3; i++) {
      this.rpgCooldowns[i] = Math.max(0, (this.rpgCooldowns[i] || 0) - delta);
    }
    if (this._buffs) {
      if (this._buffs.agility > 0) {
        this._buffs.agility -= delta;
        if (this._buffs.agility <= 0) this.playerAgilityMult = 1.0;
      }
      if (this._buffs.lifesteal > 0) this._buffs.lifesteal -= delta;
    }
    // Update RPG Summons (Drones, Turrets, Ikonn Clones, Obelisks)
    if (this.rpgSummons) {
      for (let i = this.rpgSummons.length - 1; i >= 0; i--) {
        const sm = this.rpgSummons[i];
        sm.life -= delta;
        sm.fireCd -= delta;
        sm.mesh.rotation.y = time * 2.8;
        if (sm.orbitPlayer) {
          sm.mesh.position.set(
            this.playerState.pos.x + Math.cos(time * 3.4) * 2.2,
            this.playerState.pos.y + 2.4 + Math.sin(time * 5) * 0.2,
            this.playerState.pos.z + Math.sin(time * 3.4) * 2.2
          );
        }
        if (sm.pullCenter) {
          this.doombots.forEach(b => {
            if (!b.dead && b.pos.distanceTo(sm.pos) < 16) b.pos.lerp(sm.pos, delta * 2.5);
          });
        }
        if (sm.fireCd <= 0) {
          sm.fireCd = 0.65;
          const tgt = this.findBestTarget(28);
          if (tgt) {
            const pPos = sm.pos.clone();
            const dir = tgt.pos.clone().add(new THREE.Vector3(0, 1.4, 0)).sub(pPos).normalize();
            if (this.vfx) this.vfx.spawnVolumetricBeam(pPos, tgt.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), { color: sm.colorHex, coreColor: 0xffffff, width: 0.45, duration: 0.2 });
            this.applyTargetHit(tgt, sm.dmg, sm.colorHex, false);
            if (sm.drainHeal) this.playerState.hp = Math.min(this.playerState.maxHp, this.playerState.hp + 18);
          }
        }
        if (sm.life <= 0) {
          this.scene.remove(sm.mesh);
          this.rpgSummons.splice(i, 1);
        }
      }
    }
  };

  DoomsdayGame.prototype.updateHUD = function () {
    _origUpdateHUD.call(this);
    const lvEl = document.getElementById('hud-level-badge');
    if (lvEl) lvEl.textContent = `NV. ${this.playerLevel || 1}`;
    const xpLbl = document.getElementById('hud-xp-label');
    const xpFill = document.getElementById('hud-xp-fill');
    if (xpLbl && xpFill) {
      const xp = this.rpgXp || 0, nxt = this.rpgXpNext || 120;
      xpLbl.textContent = `XP ${xp}/${nxt}`;
      xpFill.style.width = `${Math.min(100, (xp / nxt) * 100)}%`;
    }
    const kit = RPG_SKILLS[this.selectedHeroId] || [];
    for (let i = 0; i < 3; i++) {
      const cdEl = document.getElementById(`cd-${i + 1}`);
      if (!cdEl) continue;
      const cd = this.rpgCooldowns ? (this.rpgCooldowns[i] || 0) : 0;
      const req = kit[i] ? kit[i].reqLv : 99;
      if ((this.playerLevel || 1) >= req && cd > 0) {
        cdEl.classList.add('active'); cdEl.textContent = Math.ceil(cd);
      } else {
        cdEl.classList.remove('active'); cdEl.textContent = '';
      }
    }
  };

  // XP & Lifesteal on Enemy Kills/Hits (damage scaling handled uniformly inside core applyTargetHit)
  DoomsdayGame.prototype.applyTargetHit = function (target, dmg, colorStr, isHeavy) {
    const finalDmg = Math.round(dmg);
    const wasBotAlive = target && !target.isBoss && target.ref && target.ref.hp > 0 && !target.ref.dead && !target.ref.destroyed;
    _origApplyTargetHit.call(this, target, finalDmg, colorStr, isHeavy);
    if (this._buffs && this._buffs.lifesteal > 0) {
      this.playerState.hp = Math.min(this.playerState.maxHp, this.playerState.hp + Math.round(finalDmg * 0.08));
    }
    if (wasBotAlive && target.ref && (target.ref.dead || target.ref.hp <= 0 || target.ref.destroyed)) {
      this.gainXp(target.ref.destroyed ? 190 : 65, target.pos);
    }
  };

  // Award XP on Mini-Boss Defeat
  const _origDmgMiniBoss = DoomsdayGame.prototype.damageMiniBoss;
  DoomsdayGame.prototype.damageMiniBoss = function (mb, dmg, isHeavy) {
    const wasAlive = mb && mb.alive;
    _origDmgMiniBoss.call(this, mb, dmg, isHeavy);
    if (wasAlive && !mb.alive) {
      if (mb.isAct2Boss) {
        this.act2BossesDefeated = (this.act2BossesDefeated || 0) + 1;
        this.gainXp(1800, mb.pos);
        if (this.act2BossesDefeated >= 3) {
          this.spawnShockwave(mb.pos, 0xfacc15, 28, 1.0);
          document.getElementById('end-title').textContent = 'VITÓRIA ÔMEGA DO MULTIVERSO!';
          document.getElementById('end-subtitle').textContent = 'Doom e todos os 3 Senhores do Multiverso foram derrotados!';
          this.endGame(true);
        } else {
          this.triggerEventBanner(`SENHOR DO MULTIVERSO CAÍDO (${this.act2BossesDefeated}/3)`, '#facc15');
        }
      } else {
        this.gainXp(520, mb.pos);
      }
    }
  };

  // Anti-Kite & Post-Stagger HyperArmor for ALL Bosses + Victor Doom Act II Transition
  DoomsdayGame.prototype.updateBoss = function (delta, time) {
    const boss = this.doomBoss;
    if (boss && boss.active && boss.hp > 0 && boss.staggeredTimer <= 0) {
      const dist = this.playerState.pos.distanceTo(boss.pos);
      boss._antiKiteCd = Math.max(0, (boss._antiKiteCd || 0) - delta);
      if ((dist > 22 || (this.playerState.isFlying && this.playerState.pos.y > boss.pos.y + 4.8)) && boss._antiKiteCd <= 0) {
        boss._antiKiteCd = 4.2;
        this.playerState.isFlying = false;
        const pull = boss.pos.clone().sub(this.playerState.pos).setY(0).normalize().multiplyScalar(Math.min(18, dist * 0.62));
        this.safeTranslatePlayer(pull.x, pull.z);
        this.spawnShockwave(boss.pos, 0xe11d48, 10, 0.45);
        this.triggerEventBanner('CORRENTE GRAVITACIONAL DE DOOM — VOO BLOQUEADO!', '#e11d48');
      }
    }
    _origUpdateBoss.call(this, delta, time);
  };

  DoomsdayGame.prototype.updateMiniBosses = function (delta, time) {
    _origUpdateMiniBosses.call(this, delta, time);
    if (!this.miniBosses) return;
    for (const mb of this.miniBosses) {
      if (!mb.alive || mb.staggeredTimer > 0) continue;
      const dist = this.playerState.pos.distanceTo(mb.pos);
      mb._antiKiteCd = Math.max(0, (mb._antiKiteCd || 0) - delta);
      if (dist < 78 && (dist > 22 || (this.playerState.isFlying && this.playerState.pos.y > mb.pos.y + 5.0)) && mb._antiKiteCd <= 0) {
        mb._antiKiteCd = 5.2;
        this.playerState.isFlying = false;
        const dir = this.playerState.pos.clone().sub(mb.pos).setY(0).normalize();
        const origin = mb.pos.clone().add(new THREE.Vector3(0, 2.5, 0));
        if (this.vfx) this.vfx.spawnVolumetricBeam(origin, this.playerState.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), { color: mb.color, coreColor: 0xffffff, width: 1.0, duration: 0.35 });
        this.safeTranslatePlayer(-dir.x * Math.min(12, dist * 0.45), -dir.z * Math.min(12, dist * 0.45));
      }
    }
  };

  DoomsdayGame.prototype.handleDoomBossDefeated = function () {
    this.postDoomUnlocked = true;
    this.doomBoss.active = false;
    this.doomBoss.hp = 0;
    this.gainXp(1400, this.doomBoss.pos);
    this.detachClothFromScene(this.doomBoss.mesh);
    if (this.doomBoss.mesh) this.scene.remove(this.doomBoss.mesh);
    this.spawnShockwave(this.doomBoss.pos, 0x34d399, 28, 0.9);

    if (this.world && this.world.unlockPostDoomRegions) {
      this.world.unlockPostDoomRegions();
    }
    this.spawnAct2Bosses();

    if (window.CutsceneDirector) {
      window.CutsceneDirector.play('post_doom_act2', [{
        speaker: 'RUPTURA DO MULTIVERSO // ATO II',
        line: 'Doom caiu, mas 3 Senhores Multiversais invadiram as fronteiras externas de Latvéria!',
        bossTitle: 'ATO II DESBLOQUEADO!',
        bossSub: 'DERROTE O VAZIO · MAGNETO IMPERIAL · IMPERADOR KANG (MAPA [M])',
        accent: '#facc15',
        camPos: new THREE.Vector3(0, 32, -660),
        lookAt: new THREE.Vector3(0, 6, -900),
        fov: 58,
        duration: 3.4
      }], this, () => {
        this.triggerEventBanner('NOVAS REGIÕES DESBLOQUEADAS! DERROTE OS 3 SENHORES (0/3)', '#facc15');
      }, true);
    } else {
      this.triggerEventBanner('ATO II DESBLOQUEADO! 3 NOVOS CHEFES NO MAPA [M]', '#facc15');
    }
  };

  DoomsdayGame.prototype.spawnAct2Bosses = function () {
    const act2Defs = [
      { id: 'the_void', name: 'O VAZIO (SENTINELA SOMBRIO)', zone: 'VAZIO ABISSAL // NORTE', pos: new THREE.Vector3(0, this.world.getGroundHeight(0, -1180), -1180), hp: 11500, posture: 760, color: 0xfacc15, colorStr: '#facc15', dmg: 64, speed: 12.6, builder: () => CharacterBuilder.buildVoidSentryMesh() },
      { id: 'magneto',  name: 'MAGNETO IMPERIAL', zone: 'ASTEROIDE M // OESTE', pos: new THREE.Vector3(-1220, this.world.getGroundHeight(-1220, -60), -60), hp: 12000, posture: 780, color: 0xe879f9, colorStr: '#e879f9', dmg: 66, speed: 11.8, builder: () => CharacterBuilder.buildMagnetoMasterMesh() },
      { id: 'kang',     name: 'IMPERADOR KANG', zone: 'CIDADELA TEMPORAL // LESTE', pos: new THREE.Vector3(1220, this.world.getGroundHeight(1220, -60), -60), hp: 13200, posture: 820, color: 0x22d3ee, colorStr: '#22d3ee', dmg: 70, speed: 13.0, builder: () => CharacterBuilder.buildKangEmperorMesh() }
    ];
    act2Defs.forEach(def => {
      const mesh = def.builder();
      mesh.position.copy(def.pos);
      this.scene.add(mesh);
      this.attachClothToScene(mesh);
      this.miniBosses.push({
        id: def.id,
        name: def.name,
        zone: def.zone,
        phaseTag: 'ATO II // RAID ÔMEGA',
        pos: def.pos.clone(),
        hp: def.hp,
        maxHp: def.hp,
        posture: 0,
        maxPosture: def.posture,
        staggeredTimer: 0,
        phase: 1,
        alive: true,
        engaged: false,
        sealBoss: false,
        isAct2Boss: true,
        isMiniBoss: true,
        color: def.color,
        colorStr: def.colorStr,
        dmg: def.dmg,
        speed: def.speed,
        attackCd: 1.0,
        specialCd: 4.5,
        windupTimer: 0,
        windupMove: null,
        comboQueue: [],
        mesh
      });
    });
  };
})();

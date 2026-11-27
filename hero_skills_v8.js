/* hero_skills_v8.js — 27 bespoke hero skills (unique mechanics, animation tags and VFX per skill) */
(function () {
  const G = DoomsdayGame.prototype;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const UP = V3(0, 1, 0);
  const mat = (c, o = 0.9) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending });
  const solid = (c) => new THREE.MeshBasicMaterial({ color: c });

  // Rename generic skills that were duplicated across heroes
  if (window.RPG_SKILLS) {
    const k = window.RPG_SKILLS;
    if (k.captain_america) {
      k.captain_america[1].name = 'Escudo Ricochete';
      k.captain_america[1].desc = 'Arremessa o escudo que ricocheteia entre inimigos e retorna à mão.';
    }
    if (k.black_panther) {
      k.black_panther[1].desc = 'Teleporta atrás do alvo mais próximo e desfere 3 cortes de garra.';
    }
  }

  function enemies(g) {
    const list = [];
    if (g.doomBoss && g.doomBoss.hp > 0 && g.doomBoss.mesh) list.push({ pos: g.doomBoss.pos, isBoss: true, ref: g.doomBoss });
    (g.miniBosses || []).forEach(mb => { if (mb.alive) list.push({ pos: mb.pos, isBoss: false, ref: mb }); });
    (g.doombots || []).forEach(b => { if (!b.dead) list.push({ pos: b.pos, isBoss: false, ref: b }); });
    return list;
  }
  function aoe(g, c, r, dmg, col, heavy, stun) {
    let n = 0;
    enemies(g).forEach(t => {
      const rr = r + (t.isBoss ? 3 : t.ref.isMiniBoss ? 2.5 : 0);
      if (t.pos.distanceTo(c) < rr) {
        g.applyTargetHit(t, Math.round(dmg), col, heavy);
        if (stun && t.ref && !t.isBoss && !t.ref.isMiniBoss) t.ref.staggerTimer = Math.max(t.ref.staggerTimer || 0, stun);
        n++;
      }
    });
    return n;
  }
  function nearest(g, from, range) {
    let best = null, bd = range;
    enemies(g).forEach(t => { const d = t.pos.distanceTo(from); if (d < bd) { bd = d; best = t; } });
    return best;
  }
  function addFx(g, mesh, life, update, onEnd) {
    if (mesh) g.scene.add(mesh);
    (g._skillFx = g._skillFx || []).push({ mesh, life, max: life, update, onEnd });
  }
  function boom(g, pos, hex, r, dur) { g.spawnShockwave(pos.clone(), hex, r, dur || 0.5); g.spawnSparks(pos.clone().add(V3(0, 1, 0)), hex, 18); }
  function beam(g, a, b, hex, w, d) { if (g.vfx && g.vfx.spawnVolumetricBeam) g.vfx.spawnVolumetricBeam(a, b, { color: hex, coreColor: 0xffffff, width: w, duration: d }); }
  function proj(g, o, dir, speed, dmg, hex, col, mesh, life, r) {
    mesh.position.copy(o); g.scene.add(mesh);
    g.projectiles.push({ mesh, pos: o.clone(), vel: dir.clone().multiplyScalar(speed), dmg: Math.round(dmg), color: col, isPlayer: true, radius: r || 1.4, life: life || 1.6, isHeavy: true });
  }
  function ground(g, x, z) { return g.world.getGroundHeight(x, z); }

  const SK = {};

  // ---------- HOMEM-ARANHA ----------
  SK['spider_man:0'] = (g, c) => { // 3 drones orbitais que disparam teias
    const drones = [];
    for (let i = 0; i < 3; i++) {
      const d = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), solid(i === 1 ? 0xfacc15 : 0xef4444));
      g.scene.add(d); drones.push(d);
    }
    let cd = 0;
    addFx(g, null, 9, (t, dt, p, time) => {
      drones.forEach((d, i) => {
        const a = time * 2.6 + i * 2.094;
        d.position.set(c.ps.pos.x + Math.cos(a) * 2.6, c.ps.pos.y + 2.6 + Math.sin(time * 5 + i) * 0.25, c.ps.pos.z + Math.sin(a) * 2.6);
        d.rotation.y += dt * 6;
      });
      cd -= dt;
      if (cd <= 0) {
        cd = 0.55;
        const tg = nearest(g, c.ps.pos, 30);
        if (tg) {
          const d = drones[(Math.random() * 3) | 0];
          if (g.vfx && g.vfx.spiderWebShot) g.vfx.spiderWebShot(d.position.clone(), tg.pos.clone().add(V3(0, 1.2, 0)));
          g.applyTargetHit(tg, c.dmg(55), '#ef4444', false);
          if (tg.ref && !tg.isBoss && !tg.ref.isMiniBoss) tg.ref.staggerTimer = 0.5;
        }
      }
    }, () => drones.forEach(d => g.scene.remove(d)));
  };
  SK['spider_man:1'] = (g, c) => { // catapulta: ergue destroço e arremessa em arco
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.7, 0), solid(0x78716c));
    const target = c.ps.pos.clone().addScaledVector(c.fwd, 20); target.y = ground(g, target.x, target.z);
    const start = c.ps.pos.clone().add(V3(0, 7, 0));
    boom(g, c.ps.pos, 0x9a8f85, 6, 0.4);
    addFx(g, rock, 1.35, (t, dt, p) => {
      if (p < 0.4) { rock.position.copy(c.ps.pos).add(V3(0, 2 + p * 12, 0)); }
      else { const q = (p - 0.4) / 0.6; rock.position.lerpVectors(start, target, q); rock.position.y += Math.sin(q * Math.PI) * 9; }
      rock.rotation.x += dt * 7; rock.rotation.z += dt * 5;
    }, () => { boom(g, target, 0xf59e0b, 15, 0.6); aoe(g, target, 11, c.dmg(230), '#f59e0b', true, 1.5); g.addTrauma(0.5); });
  };
  SK['spider_man:2'] = (g, c) => { // Instinto: câmera lenta + imagens residuais
    g.slowMoTimer = Math.max(g.slowMoTimer || 0, 3.2);
    c.ps.invulnTimer = Math.max(c.ps.invulnTimer, 2.6);
    let spawn = 0; const ghosts = [];
    addFx(g, null, 2.6, (t, dt) => {
      spawn -= dt;
      if (spawn <= 0) {
        spawn = 0.12;
        const gh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8), mat(0xef4444, 0.55));
        gh.position.copy(c.ps.pos).add(V3(0, 1.1, 0)); g.scene.add(gh); ghosts.push({ m: gh, l: 0.5 });
      }
      for (let i = ghosts.length - 1; i >= 0; i--) { const q = ghosts[i]; q.l -= dt; q.m.material.opacity = Math.max(0, q.l); if (q.l <= 0) { g.scene.remove(q.m); ghosts.splice(i, 1); } }
    }, () => ghosts.forEach(q => g.scene.remove(q.m)));
  };

  // ---------- HOMEM DE FERRO ----------
  SK['iron_man:0'] = (g, c) => { // cortador laser 360 rotativo
    let ang = 0, tick = 0;
    addFx(g, null, 1.9, (t, dt) => {
      ang += dt * 9; tick -= dt;
      const o = c.ps.pos.clone().add(V3(0, 1.6, 0));
      for (let i = 0; i < 4; i++) {
        const a = ang + i * Math.PI / 2;
        if (tick <= 0) beam(g, o, o.clone().add(V3(Math.sin(a) * 17, 0, Math.cos(a) * 17)), 0x38bdf8, 0.5, 0.12);
      }
      if (tick <= 0) { tick = 0.28; aoe(g, c.ps.pos, 16, c.dmg(46), '#38bdf8', false); }
    });
  };
  SK['iron_man:1'] = (g, c) => { // torreta de mísseis
    const base = c.ps.pos.clone().addScaledVector(c.fwd, 5); base.y = ground(g, base.x, base.z);
    const tur = new THREE.Group();
    tur.add(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 0.6, 6), solid(0x991b1b)));
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 1.8), solid(0xfacc15)); gun.position.y = 0.9; tur.add(gun);
    tur.position.copy(base); boom(g, base, 0xfacc15, 7, 0.4);
    let cd = 0;
    addFx(g, tur, 10, (t, dt) => {
      cd -= dt;
      const tg = nearest(g, base, 34);
      if (tg) { gun.lookAt(tg.pos.x, gun.getWorldPosition(V3()).y, tg.pos.z); }
      if (cd <= 0 && tg) {
        cd = 0.55;
        const o = base.clone().add(V3(0, 1.5, 0));
        const dir = tg.pos.clone().add(V3(0, 1, 0)).sub(o).normalize();
        const m = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.2, 6), solid(0xf97316)); m.lookAt(dir); m.rotateX(Math.PI / 2);
        proj(g, o, dir, 42, c.dmg(40), 0xf97316, '#f97316', m, 1.2, 1.0);
      }
    });
  };
  SK['iron_man:2'] = (g, c) => { // sobrecarga: salva de mísseis + redução parcial de recargas
    c.ps.skillCooldown *= 0.55; c.ps.uniqueCooldown *= 0.55;
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const a = (i / 7 - 0.5) * 1.2;
        const dir = c.fwd.clone().applyAxisAngle(UP, a);
        const o = c.ps.pos.clone().add(V3(Math.cos(i) * 0.8, 2.6, Math.sin(i) * 0.8));
        const m = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.4, 6), solid(0xef4444)); m.lookAt(dir); m.rotateX(Math.PI / 2);
        proj(g, o, dir, 50, c.dmg(58), 0xef4444, '#ef4444', m, 1.5, 1.6);
        g.spawnSparks(o, 0xffe08a, 5);
      }, i * 75);
    }
    g.addTrauma(0.4);
  };

  // ---------- THOR ----------
  SK['thor:0'] = (g, c) => { // tornado de Mjolnir
    const cone = new THREE.Mesh(new THREE.ConeGeometry(4.2, 11, 12, 1, true), mat(0x93c5fd, 0.45)); cone.rotation.x = Math.PI;
    let tick = 0, bolt = 0;
    addFx(g, cone, 3.2, (t, dt, p, time) => {
      cone.position.copy(c.ps.pos).add(V3(0, 5, 0)); cone.rotation.y += dt * 14;
      tick -= dt; bolt -= dt;
      enemies(g).forEach(e => { if (e.ref && !e.isBoss && !e.ref.isMiniBoss && e.pos.distanceTo(c.ps.pos) < 15) e.pos.lerp(c.ps.pos, dt * 2.2); });
      if (tick <= 0) { tick = 0.3; aoe(g, c.ps.pos, 9, c.dmg(70), '#93c5fd', false); g.spawnSparks(c.ps.pos.clone().add(V3(0, 2, 0)), 0xfef08a, 10); }
      if (bolt <= 0) { bolt = 0.18; const a = Math.random() * 6.28; if (g.vfx && g.vfx.thorLightningStrike) g.vfx.thorLightningStrike(c.ps.pos.clone().add(V3(0, 10, 0)), c.ps.pos.clone().add(V3(Math.cos(a) * 9, 0, Math.sin(a) * 9))); }
    });
  };
  SK['thor:1'] = (g, c) => { // manto: armadura de raios com descargas automáticas
    const aura = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 1), mat(0xfde047, 0.35));
    c.ps.invulnTimer = Math.max(c.ps.invulnTimer, 1.2);
    let cd = 0;
    addFx(g, aura, 8, (t, dt) => {
      aura.position.copy(c.ps.pos).add(V3(0, 1.3, 0)); aura.rotation.y += dt * 4; aura.rotation.x += dt * 3;
      cd -= dt;
      if (cd <= 0) {
        cd = 0.55; const tg = nearest(g, c.ps.pos, 20);
        if (tg) { if (g.vfx && g.vfx.thorLightningStrike) g.vfx.thorLightningStrike(c.ps.pos.clone().add(V3(0, 2, 0)), tg.pos.clone().add(V3(0, 1, 0)), '#fde047'); g.applyTargetHit(tg, c.dmg(85), '#fde047', false); }
      }
    });
    c.g._buffs.agility = Math.max(c.g._buffs.agility, 8); c.g.playerAgilityMult = 1.3;
  };
  SK['thor:2'] = (g, c) => { // Rompe-Tormentas: coluna celeste atrasada
    const tg = nearest(g, c.ps.pos, 40);
    const T = tg ? tg.pos.clone() : c.ps.pos.clone().addScaledVector(c.fwd, 16);
    const mark = new THREE.Mesh(new THREE.RingGeometry(5.5, 6.2, 32), mat(0x93c5fd, 0.9)); mark.rotation.x = -Math.PI / 2; mark.position.set(T.x, ground(g, T.x, T.z) + 0.2, T.z);
    addFx(g, mark, 0.9, (t, dt, p) => { mark.scale.setScalar(1.3 - p * 0.5); }, () => {
      const top = T.clone().add(V3(0, 60, 0));
      beam(g, top, T, 0xbfdbfe, 3.2, 0.7); boom(g, T, 0x93c5fd, 24, 0.8); g.addTrauma(0.8);
      aoe(g, T, 14, c.dmg(235), '#93c5fd', true, 2);
      for (let i = 0; i < 6; i++) { const a = i * 1.047; if (g.vfx && g.vfx.thorLightningStrike) g.vfx.thorLightningStrike(T.clone().add(V3(0, 12, 0)), T.clone().add(V3(Math.cos(a) * 10, 0, Math.sin(a) * 10))); }
    });
  };

  // ---------- DOUTOR ESTRANHO ----------
  SK['doctor_strange:0'] = (g, c) => { // prisão espelhada: cristais em anel que estunam
    const T = c.ps.pos.clone().addScaledVector(c.fwd, 11); const shards = [];
    for (let i = 0; i < 6; i++) {
      const a = i * 1.047; const m = new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), mat(0xfb923c, 0.7)); m.scale.y = 2.6;
      m.position.set(T.x + Math.cos(a) * 7, ground(g, T.x, T.z) + 3, T.z + Math.sin(a) * 7); g.scene.add(m); shards.push(m);
    }
    let tick = 0;
    addFx(g, null, 4, (t, dt, p, time) => {
      shards.forEach((m, i) => { m.rotation.y += dt * 3; m.position.y += Math.sin(time * 4 + i) * dt * 0.6; });
      tick -= dt;
      if (tick <= 0) { tick = 0.5; enemies(g).forEach(e => { if (e.pos.distanceTo(T) < 8.5) { g.applyTargetHit(e, c.dmg(60), '#fb923c', false); if (!e.isBoss && !e.ref.isMiniBoss) e.ref.staggerTimer = 1.0; } }); g.spawnShockwave(T.clone(), 0xfb923c, 8, 0.4); }
    }, () => { shards.forEach(m => g.scene.remove(m)); boom(g, T, 0xfdba74, 10, 0.5); });
  };
  SK['doctor_strange:1'] = (g, c) => { // Imagens de Ikonn: 2 avatares disparam bolts místicos
    const av = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), mat(0xc084fc, 0.7)); m.scale.y = 1.8; g.scene.add(m); return { m, s }; });
    let cd = 0;
    addFx(g, null, 9, (t, dt, p, time) => {
      const side = V3(c.fwd.z, 0, -c.fwd.x);
      av.forEach(a => { a.m.position.copy(c.ps.pos).addScaledVector(side, a.s * 3.6).add(V3(0, 1.6 + Math.sin(time * 3 + a.s) * 0.3, 0)); a.m.rotation.y += dt * 2; });
      cd -= dt;
      if (cd <= 0) { cd = 0.65; const tg = nearest(g, c.ps.pos, 32); if (tg) av.forEach(a => { beam(g, a.m.position.clone(), tg.pos.clone().add(V3(0, 1.2, 0)), 0xc084fc, 0.35, 0.15); g.applyTargetHit(tg, c.dmg(28), '#c084fc', false); }); }
    }, () => av.forEach(a => g.scene.remove(a.m)));
  };
  SK['doctor_strange:2'] = (g, c) => { // Chamas dos Faltine: espiral de fogo persistente
    const T = c.ps.pos.clone().addScaledVector(c.fwd, 12); T.y = ground(g, T.x, T.z);
    const flames = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.2, 5), mat(i % 2 ? 0xfb923c : 0xfde047, 0.8)); g.scene.add(m); flames.push(m); }
    let tick = 0;
    addFx(g, null, 3.6, (t, dt, p, time) => {
      flames.forEach((m, i) => { const a = time * 3 + i * 0.45; const r = 1 + i * 0.4; m.position.set(T.x + Math.cos(a) * r, T.y + 0.5 + i * 0.55, T.z + Math.sin(a) * r); });
      tick -= dt; if (tick <= 0) { tick = 0.3; aoe(g, T, 8, c.dmg(80), '#fb923c', false); g.spawnSparks(T.clone().add(V3(0, 3, 0)), 0xfb923c, 10); }
    }, () => flames.forEach(m => g.scene.remove(m)));
  };

  // ---------- CAPITÃO AMÉRICA ----------
  SK['captain_america:0'] = (g, c) => { // Bastião: domo refletor
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.4, 20, 14), mat(0x60a5fa, 0.32));
    c.ps.shieldActive = true; c.ps.shieldTimer = 4.6; c.ps.invulnTimer = Math.max(c.ps.invulnTimer, 1.0);
    boom(g, c.ps.pos, 0x60a5fa, 14, 0.5);
    addFx(g, dome, 4.6, (t, dt, p, time) => { dome.position.copy(c.ps.pos).add(V3(0, 1.4, 0)); dome.scale.setScalar(1 + Math.sin(time * 8) * 0.03); dome.rotation.y += dt; });
  };
  SK['captain_america:1'] = (g, c) => { // Escudo ricochete
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.18, 20), solid(0x2563eb)); sh.rotation.x = Math.PI / 2;
    const start = c.ps.pos.clone().add(V3(0, 1.6, 0)); const hit = new Set();
    let tg = nearest(g, c.ps.pos, 28); const far = tg ? tg.pos.clone().add(V3(0, 1.4, 0)) : start.clone().addScaledVector(c.fwd, 22);
    addFx(g, sh, 1.5, (t, dt, p) => {
      const q = p < 0.5 ? p * 2 : (1 - p) * 2; const back = start.clone().set(c.ps.pos.x, c.ps.pos.y + 1.6, c.ps.pos.z);
      sh.position.lerpVectors(p < 0.5 ? start : back, far, p < 0.5 ? q : q); sh.rotation.z += dt * 24;
      enemies(g).forEach(e => { if (!hit.has(e.ref) && e.pos.distanceTo(sh.position) < 3.2) { hit.add(e.ref); g.applyTargetHit(e, c.dmg(160), '#60a5fa', true); g.spawnSparks(sh.position.clone(), 0xffffff, 10); } });
      if (p > 0.5) hit.clear();
    });
  };
  SK['captain_america:2'] = (g, c) => { // Liderança: anéis estrelados + cura + buffs
    c.ps.hp = Math.min(c.ps.maxHp, c.ps.hp + Math.round(c.ps.maxHp * 0.32)); c.ps.invulnTimer = Math.max(c.ps.invulnTimer, 1.4);
    c.g._buffs.agility = Math.max(c.g._buffs.agility, 8); c.g.playerAgilityMult = 1.3;
    for (let i = 0; i < 3; i++) setTimeout(() => boom(g, c.ps.pos, i % 2 ? 0xffffff : 0xef4444, 12 + i * 5, 0.5), i * 160);
    g.spawnSparks(c.ps.pos.clone().add(V3(0, 2, 0)), 0xfacc15, 30);
  };

  // ---------- REED RICHARDS ----------
  SK['reed_richards:0'] = (g, c) => { // Muralha elástica
    const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 7, 1.2), mat(0xa78bfa, 0.55));
    const P = c.ps.pos.clone().addScaledVector(c.fwd, 6); wall.position.set(P.x, ground(g, P.x, P.z) + 3.5, P.z); wall.rotation.y = Math.atan2(c.fwd.x, c.fwd.z);
    c.ps.shieldActive = true; c.ps.shieldTimer = 5; aoe(g, P, 9, c.dmg(110), '#a78bfa', true, 1.4);
    addFx(g, wall, 5, (t, dt, p, time) => {
      wall.scale.set(1, Math.min(1, p * 10, (1 - p) * 8) * 0.95 + 0.05 + Math.sin(time * 9) * 0.02, 1);
      enemies(g).forEach(e => { if (e.ref && !e.isBoss && !e.ref.isMiniBoss) { const d = e.pos.clone().sub(P); if (d.length() < 10) e.pos.addScaledVector(d.setY(0).normalize(), dt * 6); } });
    });
  };
  SK['reed_richards:1'] = (g, c) => { // Canhão Graviton: orbe que vira singularidade
    const orb = new THREE.Mesh(new THREE.SphereGeometry(1.0, 14, 10), mat(0x7c3aed, 0.85));
    const o = c.ps.pos.clone().add(V3(0, 1.8, 0)); const tgt = o.clone().addScaledVector(c.fwd, 20);
    addFx(g, orb, 2.6, (t, dt, p) => {
      if (p < 0.35) { orb.position.lerpVectors(o, tgt, p / 0.35); }
      else { orb.position.copy(tgt); orb.scale.setScalar(1 + (p - 0.35) * 5); enemies(g).forEach(e => { if (e.ref && !e.isBoss && !e.ref.isMiniBoss && e.pos.distanceTo(tgt) < 16) e.pos.lerp(tgt, dt * 3.2); }); }
    }, () => { boom(g, tgt, 0x7c3aed, 20, 0.7); aoe(g, tgt, 13, c.dmg(300), '#7c3aed', true, 1.6); g.addTrauma(0.6); });
  };
  SK['reed_richards:2'] = (g, c) => { // Hiper-elasticidade: punhos gigantes em sequência
    for (let i = 0; i < 5; i++) setTimeout(() => {
      const P = c.ps.pos.clone().addScaledVector(c.fwd, 5 + i * 3.5 + 2).add(V3((i % 2 ? 1 : -1) * 2.2, 0, 0));
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 8), mat(0x818cf8, 0.7));
      const fist = new THREE.Mesh(new THREE.SphereGeometry(1.7, 10, 8), mat(0xa78bfa, 0.85));
      const o = c.ps.pos.clone().add(V3(0, 1.6, 0)); const dist = o.distanceTo(P);
      arm.position.copy(o).lerp(P, 0.5); arm.scale.set(1, dist, 1); arm.lookAt(P); arm.rotateX(Math.PI / 2); fist.position.copy(P).add(V3(0, 1.4, 0));
      const grp = new THREE.Group(); grp.add(arm, fist);
      addFx(g, grp, 0.45, null, () => {});
      aoe(g, P, 6, c.dmg(110), '#a78bfa', true, 0.8); g.spawnShockwave(P.clone(), 0xa78bfa, 7, 0.35); g.addTrauma(0.2);
    }, i * 150);
  };

  // ---------- PANTERA NEGRA ----------
  SK['black_panther:0'] = (g, c) => { // chuva de lanças vibranium
    const tg = nearest(g, c.ps.pos, 36); const C = tg ? tg.pos.clone() : c.ps.pos.clone().addScaledVector(c.fwd, 14);
    for (let i = 0; i < 9; i++) setTimeout(() => {
      const a = i * 0.7; const P = C.clone().add(V3(Math.cos(a) * (i * 0.9), 0, Math.sin(a) * (i * 0.9))); P.y = ground(g, P.x, P.z);
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.3, 3, 5), solid(0xa855f7)); sp.position.copy(P).add(V3(0, 22, 0)); sp.rotation.x = Math.PI;
      const start = sp.position.clone();
      addFx(g, sp, 0.3, (t, dt, p) => { sp.position.lerpVectors(start, P, p / 1.0 * 1 > 1 ? 1 : p); }, () => { aoe(g, P, 4.8, c.dmg(105), '#a855f7', true); g.spawnShockwave(P.clone(), 0xa855f7, 5, 0.3); g.spawnSparks(P.clone().add(V3(0, 0.5, 0)), 0xd8b4fe, 8); });
    }, i * 90);
  };
  SK['black_panther:1'] = (g, c) => { // Emboscada: teleporta atrás e corta 3x
    const tg = nearest(g, c.ps.pos, 34);
    if (!tg) {
      const dst = g.world.resolveMovement(c.ps.pos.x, c.ps.pos.z, c.ps.pos.x + c.fwd.x * 9, c.ps.pos.z + c.fwd.z * 9, 1.05, c.ps.pos.y, c.ps.isGrounded);
      c.ps.pos.x = dst.x; c.ps.pos.z = dst.z;
      boom(g, c.ps.pos, 0x7c3aed, 7, 0.3); return;
    }
    const dir = tg.pos.clone().sub(c.ps.pos).setY(0).normalize();
    boom(g, c.ps.pos, 0x1e1b4b, 6, 0.3);
    const res = g.world.resolveMovement(c.ps.pos.x, c.ps.pos.z, tg.pos.x + dir.x * 3.2, tg.pos.z + dir.z * 3.2, 1.05, c.ps.pos.y, c.ps.isGrounded);
    c.ps.pos.x = res.x; c.ps.pos.z = res.z; c.ps.yaw = Math.atan2(-dir.x, -dir.z) + Math.PI; c.ps.invulnTimer = Math.max(c.ps.invulnTimer, 1.0);
    for (let i = 0; i < 3; i++) setTimeout(() => {
      const a = (i - 1) * 0.9; const d = dir.clone().applyAxisAngle(UP, a);
      if (g.vfx && g.vfx.clawSlash) g.vfx.clawSlash(tg.pos.clone().add(V3(0, 1.3, 0)), d, '#a855f7');
      aoe(g, tg.pos, 4.5, c.dmg(125), '#a855f7', i === 2); g.addTrauma(0.2);
    }, 90 + i * 130);
  };
  SK['black_panther:2'] = (g, c) => { // Rei dos Mortos: panteras espectrais
    const cats = []; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.9, 5), mat(0xa855f7, 0.65)); m.rotation.x = Math.PI / 2; g.scene.add(m); cats.push({ m, cd: 0.4 + i * 0.35, tgt: null, run: 0 }); }
    addFx(g, null, 8, (t, dt, p, time) => {
      cats.forEach((k, i) => {
        k.cd -= dt;
        if (k.run > 0) { k.run -= dt; k.m.position.lerp(k.tgt.pos.clone().add(V3(0, 1, 0)), Math.min(1, dt * 11)); if (k.run <= 0) { g.applyTargetHit(k.tgt, c.dmg(100), '#a855f7', true); g.spawnSparks(k.m.position.clone(), 0xd8b4fe, 10); k.cd = 1.4; } }
        else { const a = time * 2.4 + i * 1.256; k.m.position.set(c.ps.pos.x + Math.cos(a) * 3.8, c.ps.pos.y + 1.1, c.ps.pos.z + Math.sin(a) * 3.8); k.m.rotation.y = -a; if (k.cd <= 0) { const tg = nearest(g, c.ps.pos, 26); if (tg) { k.tgt = tg; k.run = 0.28; } else k.cd = 0.4; } }
      });
    }, () => cats.forEach(k => g.scene.remove(k.m)));
  };

  // ---------- WOLVERINE ----------
  SK['wolverine:0'] = (g, c) => { // Rugido: onda quebra-postura + aura berserker
    boom(g, c.ps.pos, 0xef4444, 18, 0.6); g.spawnShockwave(c.ps.pos.clone(), 0xfacc15, 11, 0.4);
    aoe(g, c.ps.pos, 13, c.dmg(150), '#ef4444', true, 2.2);
    enemies(g).forEach(e => { if (e.ref && e.ref.isMiniBoss && e.pos.distanceTo(c.ps.pos) < 18) e.ref.posture = Math.min(e.ref.maxPosture || 999, (e.ref.posture || 0) + 120); });
    c.g._buffs.lifesteal = Math.max(c.g._buffs.lifesteal, 7); g.addTrauma(0.6);
    if (g.vfx && g.vfx.berserkerAura) g.vfx.berserkerAura(c.ps.pos.clone(), 2.2);
  };
  SK['wolverine:1'] = (g, c) => { // Fenda Adamantium: 3 ondas em leque
    for (let i = -1; i <= 1; i++) {
      const yaw = c.ps.yaw + i * 0.32; const dir = c.fwd.clone().applyAxisAngle(UP, i * 0.32);
      if (g._spawnCrescentWave) g._spawnCrescentWave(c.ps.pos.clone().add(V3(0, 1, 0)).addScaledVector(dir, 2), Math.atan2(dir.x, dir.z), 0, 0xe5e7eb, 0xffffff, 2.4, 34, c.dmg(140));
      else { const m = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.18, 5, 14, Math.PI), solid(0xe5e7eb)); m.lookAt(dir); proj(g, c.ps.pos.clone().add(V3(0, 1.2, 0)), dir, 34, c.dmg(140), 0xe5e7eb, '#e5e7eb', m, 1.2, 2.0); }
    }
    g.spawnSparks(c.ps.pos.clone().add(V3(0, 0.4, 0)), 0xe5e7eb, 20);
  };
  SK['wolverine:2'] = (g, c) => { // Fator de Cura X: regeneração contínua
    let pulse = 0;
    addFx(g, null, 8, (t, dt) => {
      c.ps.hp = Math.min(c.ps.maxHp, c.ps.hp + c.ps.maxHp * 0.045 * dt);
      pulse -= dt; if (pulse <= 0) { pulse = 0.8; g.spawnShockwave(c.ps.pos.clone(), 0x34d399, 5, 0.5); g.spawnSparks(c.ps.pos.clone().add(V3(0, 1.4, 0)), 0x34d399, 6); }
    });
    c.ps.invulnTimer = Math.max(c.ps.invulnTimer, 0.8);
  };

  // ---------- FEITICEIRA ESCARLATE ----------
  SK['scarlet_witch:0'] = (g, c) => { // Chuva telecinética: meteoros
    const ts = enemies(g).filter(e => e.pos.distanceTo(c.ps.pos) < 36).slice(0, 4);
    for (let i = 0; i < 5; i++) setTimeout(() => {
      const base = ts[i % Math.max(1, ts.length)]; const P = base ? base.pos.clone() : c.ps.pos.clone().addScaledVector(c.fwd, 10 + i * 3); P.y = ground(g, P.x, P.z);
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), solid(0xe11d48)); const s0 = P.clone().add(V3(0, 26, 0));
      addFx(g, rock, 0.55, (t, dt, p) => { rock.position.lerpVectors(s0, P, p > 1 ? 1 : p); rock.rotation.x += dt * 8; }, () => { boom(g, P, 0xe11d48, 9, 0.45); aoe(g, P, 6.5, c.dmg(165), '#e11d48', true, 1); g.addTrauma(0.3); });
    }, i * 160);
  };
  SK['scarlet_witch:1'] = (g, c) => { // Obeliscos Darkhold: drenam vida
    const obs = []; for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.78; const m = new THREE.Mesh(new THREE.ConeGeometry(0.8, 5, 4), solid(0x7f1d1d)); const x = c.ps.pos.x + Math.cos(a) * 7, z = c.ps.pos.z + Math.sin(a) * 7; m.position.set(x, ground(g, x, z) + 2.5, z); g.scene.add(m); obs.push(m); }
    let tick = 0;
    addFx(g, null, 8, (t, dt, p, time) => {
      obs.forEach((m, i) => { m.rotation.y += dt * 2; m.scale.y = 1 + Math.sin(time * 5 + i) * 0.1; });
      tick -= dt;
      if (tick <= 0) { tick = 0.5; obs.forEach(m => { const tg = nearest(g, m.position, 18); if (tg) { beam(g, m.position.clone().add(V3(0, 2.5, 0)), tg.pos.clone().add(V3(0, 1.2, 0)), 0xe11d48, 0.35, 0.2); g.applyTargetHit(tg, c.dmg(36), '#e11d48', false); c.ps.hp = Math.min(c.ps.maxHp, c.ps.hp + 6); } }); }
    }, () => obs.forEach(m => g.scene.remove(m)));
  };
  SK['scarlet_witch:2'] = (g, c) => { // Coroa Feiticeira: levitação + orbes caóticos
    const orbs = []; for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), mat(0xe11d48, 0.9)); g.scene.add(m); orbs.push(m); }
    let cd = 0, lift = 0; c.ps.invulnTimer = Math.max(c.ps.invulnTimer, 1.0);
    addFx(g, null, 6, (t, dt, p, time) => {
      lift = Math.min(3.2, lift + dt * 6); c.ps.pos.y = Math.max(c.ps.pos.y, ground(g, c.ps.pos.x, c.ps.pos.z) + lift * 0.9); c.ps.vel.y = Math.max(c.ps.vel.y, 0);
      orbs.forEach((m, i) => { const a = time * 4 + i * 1.571; m.position.set(c.ps.pos.x + Math.cos(a) * 2, c.ps.pos.y + 2 + Math.sin(time * 6 + i) * 0.4, c.ps.pos.z + Math.sin(a) * 2); });
      cd -= dt;
      if (cd <= 0) { cd = 0.42; const tg = nearest(g, c.ps.pos, 32); if (tg) { const o = orbs[(Math.random() * 4) | 0].position.clone(); beam(g, o, tg.pos.clone().add(V3(0, 1.2, 0)), 0xe11d48, 0.3, 0.12); g.applyTargetHit(tg, c.dmg(30), '#e11d48', false); } }
    }, () => orbs.forEach(m => g.scene.remove(m)));
  };

  // ---------- cast wrapper ----------
  const _orig = G.triggerRpgSkill;
  G.triggerRpgSkill = function (slotNum) {
    const idx = slotNum - 1; const hid = this.selectedHeroId; const fn = SK[hid + ':' + idx];
    const kit = window.RPG_SKILLS && window.RPG_SKILLS[hid];
    if (!fn || !kit || !kit[idx]) return _orig.call(this, slotNum);
    const sk = kit[idx];
    if ((this.playerLevel || 1) < sk.reqLv) return _orig.call(this, slotNum);
    if ((this.rpgCooldowns[idx] || 0) > 0) return;
    const focusMult = Math.max(0.55, 1.0 - (this.rpgStats?.focus || 0) * 0.10);
    this.rpgCooldowns[idx] = sk.cd * focusMult;
    const ps = this.playerState; const hero = HEROES_DATA[hid];
    if (this.playerMesh && CharacterBuilder.playPowerAnim) CharacterBuilder.playPowerAnim(this.playerMesh, sk.anim, 0.8);
    this.triggerEventBanner(sk.name.toUpperCase(), hero.color);
    if (window.soundSystem) window.soundSystem.playSpecial();
    this.addTrauma(0.3);
    const ctx = { g: this, ps, fwd: V3(Math.sin(ps.yaw), 0, Math.cos(ps.yaw)).normalize(), dmg: (v) => v };
    try { fn(this, ctx); } catch (e) { console.warn('skill error', hid, idx, e); }
  };

  const _up = G.updatePlayer;
  G.updatePlayer = function (delta, time) {
    _up.call(this, delta, time);
    const L = this._skillFx; if (!L || !L.length) return;
    for (let i = L.length - 1; i >= 0; i--) {
      const f = L[i]; f.life -= delta; const p = 1 - Math.max(0, f.life) / f.max;
      try { if (f.update) f.update(f, delta, p, time); } catch (e) { f.life = 0; }
      if (f.life <= 0) { if (f.mesh) this.scene.remove(f.mesh); try { if (f.onEnd) f.onEnd(); } catch (e) {} L.splice(i, 1); }
    }
  };
})();

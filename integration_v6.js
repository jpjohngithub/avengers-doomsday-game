// ============================================================================
// INTEGRATION V6 — Liga VFXPro + CharacterBuilderV2 ao DoomsdayGame (Loop Único)
// ============================================================================
(function () {
  'use strict';

  let vfxSystem = null;
  let hookInstalled = false;

  function initVFXPro(game) {
    if (!game || !game.scene || !window.VFXPro) return null;
    if (!game.vfxPro) {
      vfxSystem = new VFXPro.VFXProSystem(game.scene);
      game.vfxPro = vfxSystem;
      window._vfxPro = vfxSystem;
    } else {
      vfxSystem = game.vfxPro;
    }
    return vfxSystem;
  }

  function installSingleLoopHook() {
    if (hookInstalled || typeof DoomsdayGame === 'undefined') return;
    hookInstalled = true;
    const origUpdate = DoomsdayGame.prototype.updateWorldFXAndProjectiles;
    DoomsdayGame.prototype.updateWorldFXAndProjectiles = function (delta, time) {
      origUpdate.call(this, delta, time);
      if (!this.vfxPro && window.VFXPro && this.scene) {
        initVFXPro(this);
      }
      if (this.vfxPro) {
        this.vfxPro.update(Math.min(delta, 0.05));
      }
    };
  }

  window.IntegrationV6 = {
    vfx: {
      spiderWebShot:  (from, to)        => vfxSystem?.vfx.spiderWebShot(from, to),
      spiderImpact:   (pos)             => vfxSystem?.vfx.spiderImpact(pos),
      thorLightning:  (from, to, color) => vfxSystem?.vfx.thorLightningStrike(from, to, color),
      thorBifrost:    (pos)             => vfxSystem?.vfx.thorBifrostColumn(pos),
      repulsorBlast:  (from, dir)       => vfxSystem?.vfx.repulsorBlast(from, dir),
      unibeam:        (from, dir, dur)  => vfxSystem?.vfx.unibeam(from, dir, dur),
      chaosOrb:       (pos, color)      => vfxSystem?.vfx.chaosOrb(pos, color),
      hexSingularity: (pos)             => vfxSystem?.vfx.hexSingularity(pos),
      clawSlash:      (pos, dir, color) => vfxSystem?.vfx.clawSlash(pos, dir, color),
      berserkerAura:  (pos)             => vfxSystem?.vfx.berserkerAura(pos),
      impactBurst:    (pos, color, sz)  => vfxSystem?.vfx.impactBurst(pos, color, sz),
      staggerRing:    (pos)             => vfxSystem?.vfx.staggerRing(pos),
      healParticles:  (pos, color)      => vfxSystem?.vfx.healParticles(pos, color),
      burst:          (x, y, z, c, n, sp, sz, lf) => vfxSystem?.p.burst(x, y, z, c, n, sp, sz, lf),
      ring:           (x, y, z, c, n, r, up, sz, lf) => vfxSystem?.p.ring(x, y, z, c, n, r, up, sz, lf),
      spiral:         (x, y, z, c, n, h, sz, lf) => vfxSystem?.p.spiral(x, y, z, c, n, h, sz, lf),
      cone:           (x, y, z, dx, dy, dz, c, n, sp, sz, lf, spread) => vfxSystem?.p.cone(x, y, z, dx, dy, dz, c, n, sp, sz, lf, spread),
    },
  };

  function bootstrap(tries = 120) {
    installSingleLoopHook();
    const g = window.game;
    if (g && g.scene) {
      initVFXPro(g);
      // CharacterBuilderV2 hotswap removed
      return;
    }
    if (tries > 0) setTimeout(() => bootstrap(tries - 1), 60);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootstrap(120));
  } else {
    bootstrap(120);
  }
})();

// ============================================================================
// AVENGERS: DOOMSDAY — 9 HEROES REFORGED + CLASSIC HQ SENTINEL (11.5m) & BOSSES
// ============================================================================

(function () {
  if (typeof HEROES_DATA === 'undefined' || typeof CharacterBuilder === 'undefined') return;

  // 0. Update base 5 hero kits to reflect true signature GPU powers
  Object.assign(HEROES_DATA.spider_man, {
    resourceName: 'FLUIDO DE TEIA',
    primaryName: 'Combo Aranha & Lâminas Waldoes',
    primaryDesc: 'Cortes ágeis com rastros; o 3º hit crava as 4 Waldoes disparando teia desaceleradora.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Web Swing Físico & Puxão de Teia',
    uniqueDesc: 'No ar balança em pêndulo 3D; no chão dispara fio de teia puxando alvos ou voando em chute.',
    skillName: 'Prisão de Teia & Blitz Waldoes',
    skillDesc: 'Prende inimigos em rede de teias no solo (3.5s) seguido de 5 cortes relâmpagos.',
    ultName: 'Maximum Spider (Tempestade Sônica)',
    ultDesc: '8 avanços supersônicos entre todos os inimigos da área culminando em choque sísmico.'
  });
  Object.assign(HEROES_DATA.doctor_strange, {
    resourceName: 'ENERGIA MÍSTICA',
    primaryName: 'Chicote & Leque de Mandalas',
    primaryDesc: 'Arcos solares e discos arcanos que disparam em leque triplo no 3º golpe.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Capa Viva & Feixe de Agamotto',
    uniqueDesc: 'M2 envia a Capa para prender alvos enquanto dispara feixe; E alterna Voo Astral.',
    skillName: 'Faixas de Cyttorak & Escudo Serafim',
    skillDesc: 'Vórtice carmesim que puxa inimigos e ativa escudo refletor de projéteis (3x dano).',
    ultName: 'Olho de Agamotto: Parada Temporal',
    ultDesc: 'Congela o tempo por 4.5s e invoca 3 Clones Astrais disparando feixes FBM sincronizados.'
  });
  Object.assign(HEROES_DATA.thor, {
    resourceName: 'FORÇA DE ODIN',
    primaryName: 'Combo Mjolnir & Raio em Cadeia',
    primaryDesc: 'Marteladas elétricas cujo choque salta em relâmpagos ramificados entre até 3 alvos.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Arremesso Mjolnir & Voo Tempestade',
    uniqueDesc: 'M2 arremessa o martelo perfurando alvos ida/volta com raios; E ativa Voo do Trovão.',
    skillName: 'Ira do Trovão (Thunderclap)',
    skillDesc: 'Salta e esmaga o chão invocando 6 pilares de relâmpagos ramificados ao redor.',
    ultName: 'Tempestade da Bifrost',
    ultDesc: 'Levita canalizando coluna da Bifrost com chuva contínua de 14 raios teleguiados.'
  });
  Object.assign(HEROES_DATA.reed_richards, {
    resourceName: 'ELASTICIDADE',
    primaryName: 'Punho-Martelo Elástico',
    primaryDesc: 'Estica os braços em socos longos e infla punhos gigantes (2.6x) no 3º golpe.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Estilingue & Agarrão Elástico',
    uniqueDesc: 'Prende os dois braços à frente e lança o corpo como projétil esmagando inimigos.',
    skillName: 'Ciclone Giroscópico (1.8s)',
    skillDesc: 'Gira com braços esticados puxando inimigos, aplicando hits contínuos e refletindo tiros.',
    ultName: 'Singularidade da Zona Negativa',
    ultDesc: 'Portal gravitacional suga toda a arena por 2s antes de implodir em dano subatômico.'
  });
  Object.assign(HEROES_DATA.black_panther, {
    resourceName: 'CARGA DE VIBRANIUM',
    primaryName: 'Garras Relâmpago de Wakanda',
    primaryDesc: 'Cortes ultrarrápidos com rastros violeta carregando Energia Cinética no traje.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Bote Predador (Reset por Marca)',
    uniqueDesc: 'Atravessa inimigos aplicando Marca de Bast; acertar alvo marcado reseta o M2 na hora!',
    skillName: 'Explosão Cinética & Lanças',
    skillDesc: 'Descarrega a carga do traje em explosão esférica e dispara 5 lanças perfurantes.',
    ultName: 'Avatar da Deusa Bast',
    ultDesc: 'Projeta Pantera Espiritual marcando todos os alvos, resetando M2 e ampliando velocidade.'
  });

  // 1. Register 4 expanded iconic heroes with true signature powers
  HEROES_DATA.iron_man = {
    id: 'iron_man',
    name: 'Homem de Ferro',
    subtitle: 'TONY STARK // MARK 85 NANOTECH',
    classTag: 'TECNOLOGIA',
    resourceName: 'REATOR ARC',
    color: '#ef4444',
    colorHex: 0xef4444,
    accentHex: 0xfbbf24,
    health: 640,
    speed: 22.0,
    attackType: 'repulsor',
    primaryName: 'Feixes Repulsores FBM',
    primaryDesc: 'Feixes de plasma instantâneos das palmas com disparo duplo sobrecarregado no 3º hit.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Enxame de 8 Mísseis & Voo Mark 85',
    uniqueDesc: 'M2 lança 8 micro-mísseis teleguiados dos ombros; E ativa Voo com jatos GPU.',
    skillName: 'Drone Orbital & Pulso EMP',
    skillDesc: 'Implanta Drone autônomo por 9s disparando lasers e libera EMP quebra-postura.',
    ultName: 'Unibeam Contínuo Guiado',
    ultDesc: 'Canaliza por 2.4s um feixe colossal do Reator Arc guiado pela mira em tempo real.'
  };

  HEROES_DATA.captain_america = {
    id: 'captain_america',
    name: 'Capitão América',
    subtitle: 'STEVE ROGERS // SUPER-SOLDADO',
    classTag: 'VANGUARDA',
    resourceName: 'MORAL TÁTICA',
    color: '#2563eb',
    colorHex: 0x2563eb,
    accentHex: 0xef4444,
    health: 760,
    speed: 21.8,
    attackType: 'shield',
    primaryName: 'Combo Tático de Vibranium',
    primaryDesc: 'Golpes pesados de escudo e gancho que destroem rapidamente a postura de chefes.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Ricochete em Cadeia (5 Alvos)',
    uniqueDesc: 'Arremessa o escudo que ricocheteia fisicamente entre até 5 inimigos antes de voltar.',
    skillName: 'Investida Patriota Blindada',
    skillDesc: 'Avança bloqueando 100% de dano à frente, refletindo projéteis e quebrando postura.',
    ultName: 'Vingadores, Avante!',
    ultDesc: 'Cura +180 HP, ativa aura de +35% dano e faz cada M1 disparar ondas de Vibranium por 8s.'
  };

  HEROES_DATA.wolverine = {
    id: 'wolverine',
    name: 'Wolverine',
    subtitle: 'LOGAN // GARRAS DE ADAMANTIUM',
    classTag: 'BERSERKER',
    resourceName: 'FÚRIA MUTANTE',
    color: '#eab308',
    colorHex: 0xeab308,
    accentHex: 0x1d4ed8,
    health: 710,
    speed: 24.0,
    attackType: 'adamantium',
    primaryName: 'Frenesi de 6 Garras',
    primaryDesc: 'Cortes brutais acelerados pela Fúria Mutante com fator de cura regenerativo contínuo.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Salto Feroz Dilacerante',
    uniqueDesc: 'Salto parabólico direto no alvo cravando as garras em X e aumentando o dano recebido.',
    skillName: 'Tornado de Adamantium',
    skillDesc: 'Investida giratória espiral de 6 cortes múltiplos com roubo de vida.',
    ultName: 'Fúria Arma-X Imparável',
    ultDesc: 'Fúria máxima + invencibilidade por 6s (HP não cai abaixo de 1) e rasgos X gigantes.'
  };

  HEROES_DATA.scarlet_witch = {
    id: 'scarlet_witch',
    name: 'Feiticeira Escarlate',
    subtitle: 'WANDA MAXIMOFF // MAGIA DO CAOS',
    classTag: 'CAOS',
    resourceName: 'MAGIA DO CAOS',
    color: '#e11d48',
    colorHex: 0xe11d48,
    accentHex: 0xf43f5e,
    health: 575,
    speed: 20.8,
    attackType: 'chaos',
    primaryName: 'Dreno do Caos & Marcas Hex',
    primaryDesc: 'Feixes sinuosos que curam levemente e acumulam 3 Marcas Hex detonando em área.',
    uniqueKey: 'M2 / E',
    uniqueName: 'Singularidade Chthoniana & Voo',
    uniqueDesc: 'M2 cria vórtice por 2.5s sugando inimigos antes de implodir; E alterna Levitação.',
    skillName: 'Tempestade Telecinética',
    skillDesc: 'Ergue 5 rochas arcanas ao redor e dispara em sequência teleguiada + Barreira Hex.',
    ultName: 'Reescrever a Realidade',
    ultDesc: 'Flutua concentrando anéis carmesins e apaga Doombots em onda de 32m devastadora.'
  };

  // Helper: 3D Vibranium Shield Mesh
  CharacterBuilder.buildCapShieldMesh = function () {
    const g = new THREE.Group();
    const redMat = this.stylized(0xdc2626, { metalness: 0.68, roughness: 0.28, rimColor: 0xfca5a5 });
    const whiteMat = this.stylized(0xf8fafc, { metalness: 0.65, roughness: 0.28, rimColor: 0xffffff });
    const blueMat = this.stylized(0x1d4ed8, { metalness: 0.72, roughness: 0.25, rimColor: 0x93c5fd });

    const r1 = this.addOutlined(g, new THREE.CylinderGeometry(0.46, 0.44, 0.04, 24), redMat, 0.015);
    r1.rotation.x = Math.PI / 2;
    const r2 = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.35, 0.048, 24), whiteMat);
    r2.rotation.x = Math.PI / 2;
    const r3 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.25, 0.055, 24), redMat);
    r3.rotation.x = Math.PI / 2;
    const center = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.064, 24), blueMat);
    center.rotation.x = Math.PI / 2;
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 0), whiteMat);
    star.scale.set(1, 1, 0.35);
    star.position.z = 0.042;
    g.add(r2, r3, center, star);
    return g;
  };

  // Helper: clean floating health bar
  function createFloatingHpBar(yOffset = 3.2, width = 2.2) {
    const hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 0.17),
      new THREE.MeshBasicMaterial({ color: 0x090b15, side: THREE.DoubleSide })
    );
    hpBarBg.position.set(0, yOffset, 0);
    const hpBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 0.08, 0.105),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
    );
    hpBarFill.position.z = 0.01;
    hpBarBg.add(hpBarFill);
    return { hpBarBg, hpBarFill };
  }

  // 2. Extend CharacterBuilder.buildHeroMesh for the 4 new heroes
  const _origBuildHero = CharacterBuilder.buildHeroMesh.bind(CharacterBuilder);
  CharacterBuilder.buildHeroMesh = function (heroId) {
    if (!['iron_man', 'captain_america', 'wolverine', 'scarlet_witch'].includes(heroId)) {
      return _origBuildHero(heroId);
    }

    const data = HEROES_DATA[heroId];
    const isIron = heroId === 'iron_man';
    const isCap = heroId === 'captain_america';
    const isWolv = heroId === 'wolverine';
    const isWanda = heroId === 'scarlet_witch';

    const group = new THREE.Group();
    group.userData = {
      heroId,
      attackTimer: 0,
      comboStep: 1,
      skillTimer: 0,
      dashTimer: 0,
      entranceTimer: 0.85,
      isFlying: false,
      isSwinging: false,
      elasticStretch: 0,
      kineticCharge: 0,
      channelType: null,
      clothSim: null,
      waldoes: [],
      mandalas: [],
      energyParts: [],
      parts: {}
    };

    group.add(this.createContactShadow(0.95));

    const hips = new THREE.Group();
    hips.position.y = 1.08;
    group.add(hips);
    const spine = new THREE.Group();
    hips.add(spine);
    const chest = new THREE.Group();
    chest.position.y = 0.34;
    spine.add(chest);
    const neck = new THREE.Group();
    neck.position.y = 0.44;
    chest.add(neck);
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.14;
    neck.add(headGroup);

    const chestScale = isWanda ? 0.88 : isIron ? 1.09 : isWolv ? 1.07 : 1.04;
    const shoulderHalfW = isWanda ? 0.30 : isIron ? 0.41 : isWolv ? 0.39 : 0.37;

    const skinMat = this.stylized(0xeeb48c, { roughness: 0.62, rimColor: 0xffd7b5, rimStrength: 0.24 });
    const goldMat = this.stylized(0xf59e0b, { metalness: 0.86, roughness: 0.20, rimColor: 0xfde68a });
    const silverMat = this.stylized(0xe2e8f0, { metalness: 0.88, roughness: 0.18, rimColor: 0xffffff });
    const darkInkMat = this.stylized(0x0f172a, { roughness: 0.48, metalness: 0.22 });

    const torsoTex = HeroCartoonTextures.getTorsoTex(heroId);
    const headTex = HeroCartoonTextures.getHeadTex(heroId);

    const torsoMat = this.stylized(0xffffff, {
      map: torsoTex,
      metalness: isIron ? 0.78 : 0.16,
      roughness: isIron ? 0.22 : 0.42,
      rimColor: isIron ? 0xfca5a5 : isCap ? 0x93c5fd : isWolv ? 0xfef08a : 0xfda4af
    });
    const headMat = this.stylized(0xffffff, {
      map: headTex,
      metalness: isIron ? 0.72 : 0.08,
      roughness: isIron ? 0.26 : 0.50,
      rimStrength: 0.35
    });

    let legMat, upperArmMat, forearmMat, bootMat, beltMat;
    if (isIron) {
      const ironRed = this.stylized(0xb91c1c, { metalness: 0.80, roughness: 0.22, rimColor: 0xfca5a5 });
      legMat = ironRed; upperArmMat = ironRed; forearmMat = ironRed; bootMat = ironRed; beltMat = goldMat;
    } else if (isCap) {
      const capBlue = this.stylized(0x1e40af, { roughness: 0.44, rimColor: 0x93c5fd });
      const capRed = this.stylized(0xdc2626, { roughness: 0.42 });
      const brown = this.stylized(0x78350f, { roughness: 0.55 });
      legMat = capBlue; upperArmMat = capBlue; forearmMat = capRed; bootMat = brown; beltMat = brown;
    } else if (isWolv) {
      const wolvYellow = this.stylized(0xeab308, { roughness: 0.46, rimColor: 0xfef08a });
      const wolvBlue = this.stylized(0x1d4ed8, { roughness: 0.44, rimColor: 0x60a5fa });
      legMat = wolvYellow; upperArmMat = skinMat; forearmMat = wolvBlue; bootMat = wolvBlue; beltMat = this.stylized(0xdc2626, { roughness: 0.42 });
    } else {
      const wandaDark = this.stylized(0x4c0519, { roughness: 0.48 });
      const wandaRed = this.stylized(0xbe123c, { roughness: 0.40, rimColor: 0xf43f5e });
      legMat = wandaDark; upperArmMat = wandaRed; forearmMat = wandaDark; bootMat = wandaDark; beltMat = wandaRed;
    }

    // 1. Sculpted Graphic-Novel Torso & Head
    hips.position.y = 1.10;
    this.buildCartoonTorso(chest, hips, {
      torsoMat, legMat, beltMat, accentMat: isWolv ? goldMat : silverMat
    }, { scale: chestScale, beltBuckle: !isWanda, feminine: isWanda });

    const neckGeo = SculptGeo.limbSegment(0.18, 0.090, 0.116, 12);
    const neckMesh = this.addOutlined(neck, neckGeo, (isCap || isWolv || isWanda) ? skinMat : legMat, 0.009);
    neckMesh.position.y = 0.14;
    this.addOutlined(headGroup, SculptGeo.heroHead(isWolv ? 1.04 : isWanda ? 0.96 : 1.0, { chiseled: isWanda ? 0.7 : 1.2 }), headMat, 0.011);

    // 2. Sculpted 3D Masks, Faceplates, Cowl Fins, Tiara & Layered Hair
    if (isIron) {
      this.addOutlined(headGroup, SculptGeo.cartoonLoft([
        { y: -0.17, rx: 0.082, rz: 0.035, oz: 0.148, jawChisel: 0.25 },
        { y: -0.05, rx: 0.125, rz: 0.045, oz: 0.152 },
        { y: 0.08,  rx: 0.132, rz: 0.048, oz: 0.155, browRidge: 0.02 },
        { y: 0.16,  rx: 0.105, rz: 0.036, oz: 0.142 }
      ], 14), goldMat, 0.008);
      const cyanMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
      [-0.054, 0.054].forEach(ex => {
        const slit = new THREE.Mesh(SculptGeo.beveledShape([[-0.032, -0.008], [0.034, 0.004], [0.026, 0.017], [-0.026, 0.008]], 0.018, 0.002), cyanMat);
        slit.position.set(ex, 0.048, 0.205);
        if (ex < 0) slit.scale.x = -1;
        headGroup.add(slit);
      });
      const reactorRim = this.addOutlined(chest, new THREE.CylinderGeometry(0.088, 0.095, 0.032, 5), silverMat, 0.006);
      reactorRim.rotation.x = Math.PI / 2; reactorRim.position.set(0, 0.27, 0.186);
      const reactorCore = new THREE.Mesh(new THREE.CylinderGeometry(0.060, 0.060, 0.040, 5), cyanMat);
      reactorCore.rotation.x = Math.PI / 2; reactorCore.position.set(0, 0.27, 0.194);
      chest.add(reactorCore);
      group.userData.energyParts.push(reactorCore);

      [-1, 1].forEach(side => {
        const rib = this.addOutlined(chest, SculptGeo.beveledShape([[0, -0.02], [0.16, 0.03], [0.14, 0.09], [0, 0.04]], 0.025, 0.004), goldMat, 0.005);
        rib.position.set(side * 0.065, 0.23, 0.175);
        if (side < 0) rib.scale.x = -1;

        const pGeo = SculptGeo.cartoonLoft([
          { y: -0.10, rx: 0.12, rz: 0.12, oz: 0 },
          { y: 0.02,  rx: 0.14, rz: 0.13, oz: 0 },
          { y: 0.08,  rx: 0.08, rz: 0.09, oz: 0 }
        ], 12);
        const pauldron = this.addOutlined(chest, pGeo, goldMat, 0.008);
        pauldron.position.set(side * 0.39, 0.38, 0.0);
        pauldron.rotation.z = side * -0.48;

        const pod = this.addOutlined(chest, SculptGeo.beveledShape([[-0.055, -0.03], [0.055, -0.03], [0.045, 0.03], [-0.045, 0.03]], 0.14, 0.01), silverMat, 0.006);
        pod.position.set(side * 0.24, 0.43, -0.08);
        const thruster = this.addOutlined(chest, new THREE.CylinderGeometry(0.054, 0.072, 0.24, 8), silverMat, 0.007);
        thruster.position.set(side * 0.14, 0.24, -0.21);
        thruster.rotation.x = -0.35;
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.025, 0.07, 8), cyanMat);
        nozzle.position.set(0, -0.14, 0);
        thruster.add(nozzle);
        group.userData.energyParts.push(nozzle);
        const wingFlap = this.addOutlined(chest, SculptGeo.beveledShape([[0, 0], [0.16, 0.09], [0.14, 0.21], [0.01, 0.12]], 0.02, 0.004), goldMat, 0.005);
        wingFlap.position.set(side * 0.09, 0.22, -0.19);
        wingFlap.rotation.y = side * -0.45;
        if (side < 0) wingFlap.scale.x = -1;
      });
    } else if (isCap) {
      this.addSculptedFacialDetail(headGroup, skinMat, null, {});
      this.addOutlined(headGroup, SculptGeo.cartoonLoft([
        { y: -0.01, rx: 0.178, rz: 0.186, oz: -0.008 },
        { y: 0.11,  rx: 0.186, rz: 0.194, oz: -0.006, browRidge: 0.018 },
        { y: 0.22,  rx: 0.158, rz: 0.170, oz: -0.012 },
        { y: 0.275, rx: 0.082, rz: 0.095, oz: -0.014 }
      ], 16), this.stylized(0x1d4ed8, { roughness: 0.38 }), 0.008);
      const starBadge = this.addOutlined(chest, new THREE.OctahedronGeometry(0.072, 0), silverMat, 0.005);
      starBadge.scale.set(1.0, 1.0, 0.35); starBadge.position.set(0, 0.26, 0.184);
      [-1, 1].forEach(side => {
        const harness = this.addOutlined(chest, new THREE.BoxGeometry(0.042, 0.44, 0.35), beltMat, 0.005);
        harness.position.set(side * 0.16, 0.24, 0);
        harness.rotation.z = side * 0.24;
        const pouch = this.addOutlined(hips, new THREE.BoxGeometry(0.062, 0.075, 0.05), beltMat, 0.005);
        pouch.position.set(side * 0.16, 0.12, 0.158);
        const wingGeo = SculptGeo.beveledShape([[0, 0], [0.125, 0.078], [0.085, 0.145], [0, 0.065]], 0.018, 0.004);
        const wing = new THREE.Mesh(wingGeo, silverMat);
        wing.position.set(side * 0.178, 0.09, 0.0);
        wing.rotation.y = side * 1.1;
        headGroup.add(wing);
      });
    } else if (isWolv) {
      this.addSculptedFacialDetail(headGroup, skinMat, null, {});
      const wolvEye = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      [-1, 1].forEach(side => {
        const finGeo = SculptGeo.beveledShape([[0, -0.025], [0.15, -0.04], [0.27, 0.24], [0.055, 0.10]], 0.032, 0.006);
        const fin = this.addOutlined(headGroup, finGeo, darkInkMat, 0.01);
        fin.position.set(side * 0.125, 0.055, 0.035);
        fin.rotation.y = side * 0.35;
        if (side < 0) fin.scale.x = -1;

        const eye = new THREE.Mesh(SculptGeo.beveledShape([[-0.025, -0.006], [0.028, 0.012], [0.018, 0.018], [-0.020, 0.006]], 0.014, 0.002), wolvEye);
        eye.position.set(side * 0.056, 0.036, 0.174);
        eye.rotation.y = side * 0.22;
        if (side < 0) eye.scale.x = -1;
        headGroup.add(eye);

        const pld = this.addOutlined(chest, SculptGeo.beveledShape([[0, -0.04], [0.15, -0.03], [0.18, 0.10], [0, 0.09]], 0.14, 0.012), this.stylized(0x1d4ed8), 0.009);
        pld.position.set(side * 0.35, 0.39, 0);
        if (side < 0) pld.scale.x = -1;
      });
      const xBuckle = new THREE.Mesh(new THREE.OctahedronGeometry(0.048, 0), goldMat);
      xBuckle.scale.set(1.2, 1.2, 0.4); xBuckle.position.set(0, 0.125, 0.172);
      hips.add(xBuckle);
    } else if (isWanda) {
      const hairAuburn = this.stylized(0x6b2718, { roughness: 0.68, rimColor: 0xfda4af });
      this.addSculptedFacialDetail(headGroup, skinMat, hairAuburn, { hairStyle: 'long' });

      const tiaraGeo = SculptGeo.beveledShape([[-0.165, 0], [-0.105, 0.15], [-0.04, 0.045], [0, 0.195], [0.04, 0.045], [0.105, 0.15], [0.165, 0]], 0.024, 0.005);
      const tiara = this.addOutlined(headGroup, tiaraGeo, this.stylized(0xe11d48, { emissive: 0xbe123c, emissiveIntensity: 0.55, metalness: 0.45 }), 0.008);
      tiara.position.set(0, 0.095, 0.166);
      const corsetTrim = this.addOutlined(chest, SculptGeo.beveledShape([[0, -0.10], [0.14, 0.06], [0.10, 0.12], [0, -0.02], [-0.10, 0.12], [-0.14, 0.06]], 0.024, 0.004), beltMat, 0.006);
      corsetTrim.position.set(0, 0.08, 0.158);

      const clothMat = this.stylized(0xbe123c, {
        doubleSided: true, roughness: 0.48, rimColor: 0xfda4af, rimStrength: 0.65
      });
      group.userData.clothSim = new ClothSim({
        cols: 7, rows: 9, widthTop: 0.72, widthBot: 1.24, length: 1.46, material: clothMat
      });
    }

    // 3. Sculpted Limbs aligned to Y=0
    const armL = this.createLimb({
      isRight: false, upperLen: 0.35, lowerLen: 0.33, rTop: 0.098 * chestScale, rMid: 0.082 * chestScale, rBot: 0.064 * chestScale,
      upperMat: upperArmMat, lowerMat: forearmMat, jointMat: isIron ? goldMat : forearmMat,
      cuffMat: (isCap || isIron) ? beltMat : null, handMat: (isWanda || isWolv) ? (isWanda ? skinMat : darkInkMat) : forearmMat, gauntlet: isIron || isWolv
    });
    armL.root.position.set(-shoulderHalfW, 0.37, 0);
    chest.add(armL.root);

    const armR = this.createLimb({
      isRight: true, upperLen: 0.35, lowerLen: 0.33, rTop: 0.098 * chestScale, rMid: 0.082 * chestScale, rBot: 0.064 * chestScale,
      upperMat: upperArmMat, lowerMat: forearmMat, jointMat: isIron ? goldMat : forearmMat,
      cuffMat: (isCap || isIron) ? beltMat : null, handMat: (isWanda || isWolv) ? (isWanda ? skinMat : darkInkMat) : forearmMat, gauntlet: isIron || isWolv
    });
    armR.root.position.set(shoulderHalfW, 0.37, 0);
    chest.add(armR.root);

    const legL = this.createLimb({
      isLeg: true, kneePad: isIron || isCap, upperLen: 0.47, lowerLen: 0.45, rTop: 0.125 * chestScale, rMid: 0.096 * chestScale, rBot: 0.076 * chestScale,
      upperMat: legMat, lowerMat: bootMat, jointMat: isIron ? goldMat : (isWolv ? goldMat : bootMat), soleMat: darkInkMat
    });
    legL.root.position.set(-0.145 * chestScale, -0.06, 0);
    hips.add(legL.root);

    const legR = this.createLimb({
      isLeg: true, kneePad: isIron || isCap, upperLen: 0.47, lowerLen: 0.45, rTop: 0.125 * chestScale, rMid: 0.096 * chestScale, rBot: 0.076 * chestScale,
      upperMat: legMat, lowerMat: bootMat, jointMat: isIron ? goldMat : (isWolv ? goldMat : bootMat), soleMat: darkInkMat
    });
    legR.root.position.set(0.145 * chestScale, -0.06, 0);
    hips.add(legR.root);

    // 4. Signature Hand Gear
    if (isIron) {
      const repMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
      [armL.tip, armR.tip].forEach(hand => {
        const rep = new THREE.Mesh(new THREE.SphereGeometry(0.082, 10, 10), repMat);
        rep.position.set(0, -0.05, 0.04);
        hand.add(rep);
        group.userData.energyParts.push(rep);
      });
    } else if (isCap) {
      const shield = this.buildCapShieldMesh();
      shield.rotation.z = Math.PI / 2;
      shield.position.set(-0.11, -0.14, 0.08);
      armL.joint.add(shield);
      group.userData.shieldProp = shield;
    } else if (isWolv) {
      [armL.tip, armR.tip].forEach(hand => {
        for (let c = -1; c <= 1; c++) {
          const housing = this.addOutlined(hand, new THREE.CylinderGeometry(0.016, 0.016, 0.055, 6), silverMat, 0.003);
          housing.position.set(c * 0.036, -0.06, 0.052);
          const clawGeo = SculptGeo.beveledShape([[0, 0], [0.026, 0.01], [0.004, -0.52], [-0.014, -0.46]], 0.015, 0.003);
          const claw = this.addOutlined(hand, clawGeo, silverMat, 0.004);
          claw.position.set(c * 0.038, -0.03, 0.058);
          claw.rotation.y = Math.PI / 2;
        }
      });
    } else if (isWanda) {
      const chaosMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.88 });
      [armL.tip, armR.tip].forEach(hand => {
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 12), chaosMat);
        orb.position.set(0, -0.06, 0.04);
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.014, 6, 18), chaosMat);
        halo.rotation.x = Math.PI / 2.2;
        orb.add(halo);
        hand.add(orb);
        group.userData.energyParts.push(orb);
      });
      [-1, 1].forEach(side => {
        const peplum = this.addOutlined(hips, SculptGeo.beveledShape([[0, 0], [0.18, -0.04], [0.22, -0.34], [0.02, -0.32]], 0.024, 0.005), forearmMat, 0.005);
        peplum.position.set(side * 0.08, 0.06, -0.02);
        peplum.rotation.y = side * 0.45;
        if (side < 0) peplum.scale.x = -1;
      });
    }

    const capeAnchorL = new THREE.Object3D();
    capeAnchorL.position.set(-0.27, 0.40, -0.18);
    const capeAnchorR = new THREE.Object3D();
    capeAnchorR.position.set(0.27, 0.40, -0.18);
    chest.add(capeAnchorL, capeAnchorR);

    group.userData.parts = {
      hips, spine, chest, neck, head: headGroup,
      armL, armR, legL, legR,
      handL: armL.tip, handR: armR.tip,
      capeAnchorL, capeAnchorR
    };
    if (isWolv) group.scale.set(0.95, 0.92, 0.95);
    return group;
  };

  // ==========================================================================
  // 3. 4 SCULPTED BOSSES: ENFORCER, BARON MORDO, CLASSIC HQ SENTINEL (11.5m), DESTROYER
  // ==========================================================================
  CharacterBuilder.buildMiniBossMesh = function (type) {
    const normType = type === 'colossus' ? 'destroyer' : type;
    const isSentinel = normType === 'sentinel';
    const isDestroyer = normType === 'destroyer';
    const isArchmage = normType === 'archmage';
    const isEnforcer = normType === 'enforcer';

    const g = new THREE.Group();
    const scale = isSentinel ? 5.2 : isDestroyer ? 2.55 : isEnforcer ? 1.65 : 1.42;

    g.add(this.createContactShadow(1.3 * scale));

    const hips = new THREE.Group();
    hips.position.y = 1.12;
    g.add(hips);
    const spine = new THREE.Group();
    hips.add(spine);
    const chest = new THREE.Group();
    chest.position.y = 0.42;
    spine.add(chest);
    const neck = new THREE.Group();
    neck.position.y = 0.48;
    chest.add(neck);
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.14;
    neck.add(headGroup);

    let clothSim = null;
    let armL, armR, legL, legR;

    if (isSentinel) {
      // CLASSIC X-MEN HQ SENTINEL (~11.5m tall): Purple + Magenta + Glowing Yellow Eyes & Mutant Core
      const purpleMat = this.stylized(0x5b21b6, { metalness: 0.72, roughness: 0.28, rimColor: 0xc084fc, rimStrength: 0.72, halftone: 0.18 });
      const magentaMat = this.stylized(0xbe185d, { metalness: 0.45, roughness: 0.36, rimColor: 0xf472b6, rimStrength: 0.58, halftone: 0.14 });
      const darkJointMat = this.stylized(0x1e1b4b, { metalness: 0.85, roughness: 0.25 });
      const yellowGlow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const plasmaGlow = new THREE.MeshBasicMaterial({ color: 0xf97316 });

      const pelvisGeo = SculptGeo.loftProfile([
        { y: -0.15, rx: 0.28, rz: 0.22 },
        { y: 0.14, rx: 0.35, rz: 0.25 }
      ], 12);
      this.addOutlined(hips, pelvisGeo, purpleMat, 0.018);

      const waistGeo = SculptGeo.loftProfile([
        { y: -0.14, rx: 0.30, rz: 0.22 },
        { y: 0.12, rx: 0.36, rz: 0.24 }
      ], 12);
      this.addOutlined(chest, waistGeo, magentaMat, 0.016);

      const torsoGeo = SculptGeo.loftProfile([
        { y: 0.08, rx: 0.38, rz: 0.25 },
        { y: 0.34, rx: 0.54, rz: 0.31, chestCrease: 0.05 },
        { y: 0.50, rx: 0.56, rz: 0.29 },
        { y: 0.58, rx: 0.28, rz: 0.22 }
      ], 14);
      this.addOutlined(chest, torsoGeo, purpleMat, 0.020);

      const collar = this.addOutlined(chest, new THREE.TorusGeometry(0.27, 0.075, 8, 16), magentaMat, 0.014);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(0, 0.54, 0.02);

      [-1, 1].forEach(side => {
        const sh = this.addOutlined(chest, new THREE.BoxGeometry(0.28, 0.24, 0.38), purpleMat, 0.016);
        sh.position.set(side * 0.58, 0.44, 0);
        sh.rotation.z = side * -0.15;
        const cable = this.addOutlined(neck, new THREE.CylinderGeometry(0.036, 0.036, 0.28, 8), darkJointMat, 0.008);
        cable.position.set(side * 0.13, 0.04, 0.02);
        cable.rotation.z = side * 0.22;
      });

      const chestRing = this.addOutlined(chest, new THREE.TorusGeometry(0.16, 0.035, 8, 18), darkJointMat, 0.01);
      chestRing.position.set(0, 0.32, 0.31);
      const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 16), yellowGlow);
      chestCore.rotation.x = Math.PI / 2;
      chestCore.position.set(0, 0.32, 0.30);
      chest.add(chestCore);

      const helm = this.addOutlined(headGroup, SculptGeo.loftProfile([
        { y: -0.18, rx: 0.21, rz: 0.23 },
        { y: 0.04,  rx: 0.23, rz: 0.24 },
        { y: 0.22,  rx: 0.24, rz: 0.23 },
        { y: 0.28,  rx: 0.17, rz: 0.18 }
      ], 10), purpleMat, 0.018);
      helm.position.y = 0.04;

      const crest = this.addOutlined(headGroup, new THREE.BoxGeometry(0.11, 0.14, 0.42), purpleMat, 0.012);
      crest.position.set(0, 0.26, 0);
      [-1, 1].forEach(side => {
        const ear = this.addOutlined(headGroup, new THREE.CylinderGeometry(0.08, 0.08, 0.07, 8), magentaMat, 0.01);
        ear.rotation.z = Math.PI / 2;
        ear.position.set(side * 0.24, 0.04, 0);
      });

      const visorRecess = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.085, 0.06), darkJointMat);
      visorRecess.position.set(0, 0.065, 0.22);
      headGroup.add(visorRecess);
      [-0.085, 0.085].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.045, 0.04), yellowGlow);
        eye.position.set(ex, 0.065, 0.245);
        headGroup.add(eye);
      });
      const grille = this.addOutlined(headGroup, new THREE.BoxGeometry(0.20, 0.09, 0.06), darkJointMat, 0.008);
      grille.position.set(0, -0.07, 0.225);

      armL = this.createLimb({ upperLen: 0.44, lowerLen: 0.40, rTop: 0.165, rMid: 0.14, rBot: 0.12, upperMat: magentaMat, lowerMat: purpleMat, handMat: purpleMat, outline: 0.016 });
      armL.root.position.set(-0.62, 0.42, 0);
      chest.add(armL.root);

      armR = this.createLimb({ upperLen: 0.44, lowerLen: 0.40, rTop: 0.165, rMid: 0.14, rBot: 0.12, upperMat: magentaMat, lowerMat: purpleMat, handMat: purpleMat, outline: 0.016 });
      armR.root.position.set(0.62, 0.42, 0);
      chest.add(armR.root);

      [armL.tip, armR.tip].forEach(hand => {
        const palmGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12), plasmaGlow);
        palmGlow.rotation.x = Math.PI / 2;
        palmGlow.position.set(0, -0.06, 0.05);
        hand.add(palmGlow);
      });

      legL = this.createLimb({ isLeg: true, upperLen: 0.52, lowerLen: 0.50, rTop: 0.19, rMid: 0.155, rBot: 0.135, upperMat: magentaMat, lowerMat: purpleMat, jointMat: purpleMat, outline: 0.018 });
      legL.root.position.set(-0.23, -0.06, 0);
      hips.add(legL.root);

      legR = this.createLimb({ isLeg: true, upperLen: 0.52, lowerLen: 0.50, rTop: 0.19, rMid: 0.155, rBot: 0.135, upperMat: magentaMat, lowerMat: purpleMat, jointMat: purpleMat, outline: 0.018 });
      legR.root.position.set(0.23, -0.06, 0);
      hips.add(legR.root);

      [legL.tip, legR.tip].forEach(foot => {
        const boot = this.addOutlined(foot, SculptGeo.loftProfile([
          { y: -0.12, rx: 0.14, rz: 0.22, oz: 0.05 },
          { y: 0.0, rx: 0.13, rz: 0.18, oz: 0.03 }
        ], 10), purpleMat, 0.014);
        const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 0.05, 10), plasmaGlow);
        jet.position.set(0, -0.12, 0.02);
        boot.add(jet);
      });
    } else if (isDestroyer) {
      const armorMat = this.stylized(0x334155, { metalness: 0.92, roughness: 0.18, rimColor: 0x94a3b8, rimStrength: 0.78 });
      const plateTrim = this.stylized(0x64748b, { metalness: 0.9, roughness: 0.2 });
      const moltenGlow = new THREE.MeshBasicMaterial({ color: 0xf97316 });

      this.addOutlined(hips, SculptGeo.loftProfile([{ y: -0.14, rx: 0.30, rz: 0.24 }, { y: 0.16, rx: 0.36, rz: 0.26 }], 12), armorMat, 0.02);
      this.addOutlined(chest, SculptGeo.loftProfile([
        { y: -0.14, rx: 0.32, rz: 0.23 },
        { y: 0.18, rx: 0.52, rz: 0.32, chestCrease: 0.04 },
        { y: 0.48, rx: 0.56, rz: 0.30 },
        { y: 0.58, rx: 0.24, rz: 0.20 }
      ], 14), armorMat, 0.024);

      for (let b = 0; b < 4; b++) {
        const band = this.addOutlined(chest, new THREE.TorusGeometry(0.36 + b * 0.03, 0.032, 6, 16), plateTrim, 0.012);
        band.rotation.x = Math.PI / 2;
        band.position.y = -0.02 + b * 0.13;
      }

      this.addOutlined(headGroup, SculptGeo.loftProfile([
        { y: -0.16, rx: 0.19, rz: 0.20 },
        { y: 0.08, rx: 0.21, rz: 0.21 },
        { y: 0.24, rx: 0.16, rz: 0.16 }
      ], 10), armorMat, 0.02);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.065, 0.10), moltenGlow);
      visor.position.set(0, 0.05, 0.19);
      headGroup.add(visor);

      [-1, 1].forEach(side => {
        const spike = this.addOutlined(chest, new THREE.ConeGeometry(0.12, 0.36, 6), plateTrim, 0.015);
        spike.position.set(side * 0.56, 0.48, 0);
        spike.rotation.z = side * -0.45;
      });

      armL = this.createLimb({ upperLen: 0.44, lowerLen: 0.42, rTop: 0.17, rMid: 0.15, rBot: 0.12, upperMat: armorMat, lowerMat: plateTrim });
      armL.root.position.set(-0.62, 0.42, 0);
      chest.add(armL.root);
      armR = this.createLimb({ upperLen: 0.44, lowerLen: 0.42, rTop: 0.17, rMid: 0.15, rBot: 0.12, upperMat: armorMat, lowerMat: plateTrim });
      armR.root.position.set(0.62, 0.42, 0);
      chest.add(armR.root);
      legL = this.createLimb({ isLeg: true, upperLen: 0.52, lowerLen: 0.50, rTop: 0.19, rMid: 0.16, rBot: 0.14, upperMat: armorMat, lowerMat: plateTrim });
      legL.root.position.set(-0.23, -0.06, 0);
      hips.add(legL.root);
      legR = this.createLimb({ isLeg: true, upperLen: 0.52, lowerLen: 0.50, rTop: 0.19, rMid: 0.16, rBot: 0.14, upperMat: armorMat, lowerMat: plateTrim });
      legR.root.position.set(0.23, -0.06, 0);
      hips.add(legR.root);
    } else {
      const bodyMat = isEnforcer
        ? this.stylized(0x1f2937, { metalness: 0.88, roughness: 0.22, rimColor: 0x34d399, rimStrength: 0.72 })
        : this.stylized(0x14532d, { map: ProceduralTextures.createSuitTexture('doctor_strange'), roughness: 0.45, rimColor: 0xa855f7, rimStrength: 0.78 });
      const trimMat = this.stylized(isEnforcer ? 0x10b981 : 0xf59e0b, { metalness: 0.85, roughness: 0.24 });
      const accentGlowMat = new THREE.MeshBasicMaterial({ color: isEnforcer ? 0x34d399 : 0xc084fc });

      this.addOutlined(hips, SculptGeo.loftProfile([{ y: -0.14, rx: 0.28, rz: 0.22 }, { y: 0.14, rx: 0.34, rz: 0.24 }], 14), bodyMat, 0.02);
      this.addOutlined(chest, SculptGeo.loftProfile([
        { y: -0.14, rx: 0.30, rz: 0.22 },
        { y: 0.18, rx: 0.46, rz: 0.29, chestCrease: 0.05 },
        { y: 0.46, rx: 0.50, rz: 0.27, chestCrease: 0.04 },
        { y: 0.54, rx: 0.22, rz: 0.18 }
      ], 14), bodyMat, 0.024);

      this.addOutlined(headGroup, SculptGeo.heroHead(1.1), bodyMat, 0.02);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.065, 0.10), accentGlowMat);
      visor.position.set(0, 0.03, 0.21);
      headGroup.add(visor);

      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 1), accentGlowMat);
      core.position.set(0, 0.28, 0.29);
      chest.add(core);

      armL = this.createLimb({ upperLen: 0.40, lowerLen: 0.38, rTop: 0.145, rMid: 0.125, rBot: 0.095, upperMat: bodyMat, lowerMat: trimMat });
      armL.root.position.set(-0.56, 0.40, 0);
      chest.add(armL.root);
      armR = this.createLimb({ upperLen: 0.40, lowerLen: 0.38, rTop: 0.145, rMid: 0.125, rBot: 0.095, upperMat: bodyMat, lowerMat: trimMat });
      armR.root.position.set(0.56, 0.40, 0);
      chest.add(armR.root);
      legL = this.createLimb({ isLeg: true, upperLen: 0.48, lowerLen: 0.46, rTop: 0.165, rMid: 0.135, rBot: 0.11, upperMat: bodyMat, lowerMat: trimMat });
      legL.root.position.set(-0.20, -0.06, 0);
      hips.add(legL.root);
      legR = this.createLimb({ isLeg: true, upperLen: 0.48, lowerLen: 0.46, rTop: 0.165, rMid: 0.135, rBot: 0.11, upperMat: bodyMat, lowerMat: trimMat });
      legR.root.position.set(0.20, -0.06, 0);
      hips.add(legR.root);

      if (isArchmage) {
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.05, 8, 28), accentGlowMat);
        halo.position.set(0, 0.56, -0.25);
        chest.add(halo);
        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.35, 8), trimMat);
        staff.position.set(0, -0.1, 0.14);
        const staffGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), accentGlowMat);
        staffGem.position.y = 1.18;
        staff.add(staffGem);
        armR.tip.add(staff);

        clothSim = new ClothSim({
          cols: 6, rows: 8, widthTop: 0.85, widthBot: 1.45, length: 1.6,
          material: this.stylized(0x881337, { doubleSided: true, rimColor: 0xc084fc, rimStrength: 0.7 })
        });
      } else if (isEnforcer) {
        const cannon = this.addOutlined(armR.tip, new THREE.CylinderGeometry(0.11, 0.14, 0.62, 10), trimMat, 0.015);
        cannon.rotation.x = Math.PI / 2;
        cannon.position.set(0, -0.06, 0.24);
      }
    }

    const capeAnchorL = new THREE.Object3D();
    capeAnchorL.position.set(-0.36, 0.42, -0.22);
    const capeAnchorR = new THREE.Object3D();
    capeAnchorR.position.set(0.36, 0.42, -0.22);
    chest.add(capeAnchorL, capeAnchorR);

    const { hpBarBg, hpBarFill } = createFloatingHpBar(isSentinel ? 2.65 : 2.95, isSentinel ? 1.8 : 2.2);
    g.add(hpBarBg);

    g.scale.setScalar(scale);
    g.userData = {
      heroId: 'mini_boss',
      type: normType,
      baseHipY: 1.12,
      attackTimer: 0,
      windupType: null,
      staggered: false,
      clothSim,
      hpBarBg,
      hpBarFill,
      parts: {
        hips, spine, chest, neck, head: headGroup,
        armL, armR, legL, legR,
        handL: armL.tip, handR: armR.tip,
        capeAnchorL, capeAnchorR
      }
    };
    return g;
  };

  // ==========================================================================
  // 4. 3 ACT-II ENDGAME RAID BOSSES: THE VOID, MAGNETO IMPERIAL, KANG EMPEROR
  // ==========================================================================
  CharacterBuilder.buildVoidSentryMesh = function () {
    const g = new THREE.Group();
    const darkGold = this.stylized(0xb45309, { metalness: 0.88, roughness: 0.24, rimColor: 0xfef08a });
    const voidBlack = this.stylized(0x090b15, { metalness: 0.4, roughness: 0.35, rimColor: 0xa855f7 });
    const voidGlow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    g.add(this.createContactShadow(1.6));

    const hips = new THREE.Group(); hips.position.y = 1.12; g.add(hips);
    const spine = new THREE.Group(); hips.add(spine);
    const chest = new THREE.Group(); chest.position.y = 0.36; spine.add(chest);
    const neck = new THREE.Group(); neck.position.y = 0.45; chest.add(neck);
    const headGroup = new THREE.Group(); headGroup.position.y = 0.14; neck.add(headGroup);

    this.buildCartoonTorso(chest, hips, { torsoMat: voidBlack, legMat: voidBlack, beltMat: darkGold, accentMat: voidGlow }, { scale: 1.18 });
    const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), darkGold);
    emblem.scale.set(1.2, 1.2, 0.3); emblem.position.set(0, 0.28, 0.21); chest.add(emblem);
    this.addOutlined(neck, SculptGeo.limbSegment(0.18, 0.10, 0.12, 10), voidBlack, 0.01);
    this.addOutlined(headGroup, SculptGeo.heroHead(1.06), voidBlack, 0.012);
    this.addSculptedFacialDetail(headGroup, voidBlack, this.stylized(0x1e1b4b), { hairStyle: 'long' });
    [-0.06, 0.06].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.025), voidGlow);
      eye.position.set(ex, 0.045, 0.185); headGroup.add(eye);
    });

    const orbsGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const tendril = new THREE.Mesh(new THREE.ConeGeometry(0.09, 1.65, 5), voidBlack);
      tendril.position.set(Math.cos(a) * 0.55, 0.35 + Math.sin(a) * 0.45, -0.35);
      tendril.rotation.z = -a + Math.PI / 2;
      orbsGroup.add(tendril);
    }
    chest.add(orbsGroup);

    const armL = this.createLimb({ isRight: false, upperLen: 0.36, lowerLen: 0.34, rTop: 0.118, rMid: 0.095, rBot: 0.075, upperMat: voidBlack, lowerMat: darkGold, gauntlet: true });
    armL.root.position.set(-0.45, 0.38, 0); chest.add(armL.root);
    const armR = this.createLimb({ isRight: true, upperLen: 0.36, lowerLen: 0.34, rTop: 0.118, rMid: 0.095, rBot: 0.075, upperMat: voidBlack, lowerMat: darkGold, gauntlet: true });
    armR.root.position.set(0.45, 0.38, 0); chest.add(armR.root);
    const legL = this.createLimb({ isLeg: true, upperLen: 0.48, lowerLen: 0.46, rTop: 0.14, rMid: 0.11, rBot: 0.086, upperMat: voidBlack, lowerMat: darkGold });
    legL.root.position.set(-0.17, -0.06, 0); hips.add(legL.root);
    const legR = this.createLimb({ isLeg: true, upperLen: 0.48, lowerLen: 0.46, rTop: 0.14, rMid: 0.11, rBot: 0.086, upperMat: voidBlack, lowerMat: darkGold });
    legR.root.position.set(0.17, -0.06, 0); hips.add(legR.root);

    const capeAnchorL = new THREE.Object3D(); capeAnchorL.position.set(-0.34, 0.42, -0.2);
    const capeAnchorR = new THREE.Object3D(); capeAnchorR.position.set(0.34, 0.42, -0.2);
    chest.add(capeAnchorL, capeAnchorR);
    const clothSim = new ClothSim({ cols: 7, rows: 9, widthTop: 0.9, widthBot: 1.6, length: 1.75, material: this.stylized(0x111827, { doubleSided: true, rimColor: 0xfacc15 }) });
    const { hpBarBg, hpBarFill } = createFloatingHpBar(2.95, 2.4);
    g.add(hpBarBg); g.scale.setScalar(1.48);
    g.userData = { heroId: 'the_void', isBoss: true, orbsGroup, clothSim, hpBarBg, hpBarFill, parts: { hips, spine, chest, neck, head: headGroup, armL, armR, legL, legR, handL: armL.tip, handR: armR.tip, capeAnchorL, capeAnchorR } };
    return g;
  };

  CharacterBuilder.buildMagnetoMasterMesh = function () {
    const g = new THREE.Group();
    const crimson = this.stylized(0x9f1239, { metalness: 0.65, roughness: 0.28, rimColor: 0xfda4af });
    const purple = this.stylized(0x581c87, { metalness: 0.55, roughness: 0.34, rimColor: 0xd8b4fe });
    const skinMat = this.stylized(0xeab592, { roughness: 0.6 });
    const whiteMat = this.stylized(0xf1f5f9, { roughness: 0.45 });
    const glowMag = new THREE.MeshBasicMaterial({ color: 0xe879f9 });
    g.add(this.createContactShadow(1.55));

    const hips = new THREE.Group(); hips.position.y = 1.12; g.add(hips);
    const spine = new THREE.Group(); hips.add(spine);
    const chest = new THREE.Group(); chest.position.y = 0.36; spine.add(chest);
    const neck = new THREE.Group(); neck.position.y = 0.44; chest.add(neck);
    const headGroup = new THREE.Group(); headGroup.position.y = 0.14; neck.add(headGroup);

    this.buildCartoonTorso(chest, hips, { torsoMat: crimson, legMat: crimson, beltMat: purple, accentMat: whiteMat }, { scale: 1.12 });
    this.addOutlined(neck, SculptGeo.limbSegment(0.18, 0.095, 0.118, 10), skinMat, 0.009);
    this.addOutlined(headGroup, SculptGeo.heroHead(1.03), skinMat, 0.011);
    this.addSculptedFacialDetail(headGroup, skinMat, whiteMat, { hairStyle: 'swept', beardMat: whiteMat, beardStyle: 'full' });

    // Iconic Magneto Open-Face Helmet + Crown Peaks
    const helm = this.addOutlined(headGroup, SculptGeo.cartoonLoft([
      { y: -0.02, rx: 0.182, rz: 0.188, oz: -0.015 },
      { y: 0.12,  rx: 0.194, rz: 0.202, oz: -0.012 },
      { y: 0.24,  rx: 0.165, rz: 0.175, oz: -0.016 }
    ], 16), purple, 0.012);
    [-1, 1].forEach(side => {
      const horn = this.addOutlined(headGroup, SculptGeo.beveledShape([[0, 0], [0.075, 0.02], [0.05, 0.16], [-0.01, 0.12]], 0.03, 0.005), crimson, 0.009);
      horn.position.set(side * 0.145, 0.14, 0.05);
      if (side < 0) horn.scale.x = -1;
    });

    const orbsGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glowMag);
      shard.scale.set(0.6, 1.8, 0.6);
      shard.position.set(Math.cos(a) * 1.45, 0.55 + Math.sin(a * 2) * 0.3, Math.sin(a) * 1.45);
      orbsGroup.add(shard);
    }
    g.add(orbsGroup);

    const armL = this.createLimb({ isRight: false, upperLen: 0.35, lowerLen: 0.33, rTop: 0.105, rMid: 0.088, rBot: 0.07, upperMat: crimson, lowerMat: purple, gauntlet: true });
    armL.root.position.set(-0.40, 0.37, 0); chest.add(armL.root);
    const armR = this.createLimb({ isRight: true, upperLen: 0.35, lowerLen: 0.33, rTop: 0.105, rMid: 0.088, rBot: 0.07, upperMat: crimson, lowerMat: purple, gauntlet: true });
    armR.root.position.set(0.40, 0.37, 0); chest.add(armR.root);
    const legL = this.createLimb({ isLeg: true, upperLen: 0.47, lowerLen: 0.45, rTop: 0.13, rMid: 0.10, rBot: 0.08, upperMat: crimson, lowerMat: purple });
    legL.root.position.set(-0.155, -0.06, 0); hips.add(legL.root);
    const legR = this.createLimb({ isLeg: true, upperLen: 0.47, lowerLen: 0.45, rTop: 0.13, rMid: 0.10, rBot: 0.08, upperMat: crimson, lowerMat: purple });
    legR.root.position.set(0.155, -0.06, 0); hips.add(legR.root);

    const capeAnchorL = new THREE.Object3D(); capeAnchorL.position.set(-0.32, 0.40, -0.18);
    const capeAnchorR = new THREE.Object3D(); capeAnchorR.position.set(0.32, 0.40, -0.18);
    chest.add(capeAnchorL, capeAnchorR);
    const clothSim = new ClothSim({ cols: 7, rows: 9, widthTop: 0.85, widthBot: 1.5, length: 1.65, material: this.stylized(0x7e22ce, { doubleSided: true, rimColor: 0xf472b6 }) });
    const { hpBarBg, hpBarFill } = createFloatingHpBar(2.95, 2.4);
    g.add(hpBarBg); g.scale.setScalar(1.42);
    g.userData = { heroId: 'magneto', isBoss: true, orbsGroup, clothSim, hpBarBg, hpBarFill, parts: { hips, spine, chest, neck, head: headGroup, armL, armR, legL, legR, handL: armL.tip, handR: armR.tip, capeAnchorL, capeAnchorR } };
    return g;
  };

  CharacterBuilder.buildKangEmperorMesh = function () {
    const g = new THREE.Group();
    const emerald = this.stylized(0x047857, { metalness: 0.72, roughness: 0.25, rimColor: 0x34d399 });
    const purple = this.stylized(0x6d28d9, { metalness: 0.78, roughness: 0.22, rimColor: 0xc084fc });
    const cyberBlue = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    g.add(this.createContactShadow(1.6));

    const hips = new THREE.Group(); hips.position.y = 1.12; g.add(hips);
    const spine = new THREE.Group(); hips.add(spine);
    const chest = new THREE.Group(); chest.position.y = 0.36; spine.add(chest);
    const neck = new THREE.Group(); neck.position.y = 0.45; chest.add(neck);
    const headGroup = new THREE.Group(); headGroup.position.y = 0.14; neck.add(headGroup);

    this.buildCartoonTorso(chest, hips, { torsoMat: emerald, legMat: emerald, beltMat: purple, accentMat: cyberBlue }, { scale: 1.15 });
    this.addOutlined(neck, SculptGeo.limbSegment(0.18, 0.10, 0.12, 10), emerald, 0.01);
    const helm = this.addOutlined(headGroup, SculptGeo.heroHead(1.05, { chiseled: 1.3 }), purple, 0.012);
    const visor = new THREE.Mesh(SculptGeo.beveledShape([[-0.11, -0.05], [0.11, -0.05], [0.13, 0.08], [-0.13, 0.08]], 0.025, 0.005), cyberBlue);
    visor.position.set(0, 0.03, 0.172); headGroup.add(visor);

    const timeRingsGroup = new THREE.Group();
    timeRingsGroup.position.set(0, 0.38, -0.32);
    const tr1 = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.035, 8, 28), cyberBlue);
    const tr2 = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.028, 8, 24), cyberBlue);
    timeRingsGroup.add(tr1, tr2);
    chest.add(timeRingsGroup);

    const armL = this.createLimb({ isRight: false, upperLen: 0.36, lowerLen: 0.34, rTop: 0.115, rMid: 0.095, rBot: 0.075, upperMat: purple, lowerMat: emerald, gauntlet: true, cuffMat: cyberBlue });
    armL.root.position.set(-0.43, 0.38, 0); chest.add(armL.root);
    const armR = this.createLimb({ isRight: true, upperLen: 0.36, lowerLen: 0.34, rTop: 0.115, rMid: 0.095, rBot: 0.075, upperMat: purple, lowerMat: emerald, gauntlet: true, cuffMat: cyberBlue });
    armR.root.position.set(0.43, 0.38, 0); chest.add(armR.root);
    const legL = this.createLimb({ isLeg: true, kneePad: true, upperLen: 0.48, lowerLen: 0.46, rTop: 0.138, rMid: 0.106, rBot: 0.085, upperMat: purple, lowerMat: emerald });
    legL.root.position.set(-0.165, -0.06, 0); hips.add(legL.root);
    const legR = this.createLimb({ isLeg: true, kneePad: true, upperLen: 0.48, lowerLen: 0.46, rTop: 0.138, rMid: 0.106, rBot: 0.085, upperMat: purple, lowerMat: emerald });
    legR.root.position.set(0.165, -0.06, 0); hips.add(legR.root);

    const { hpBarBg, hpBarFill } = createFloatingHpBar(2.95, 2.4);
    g.add(hpBarBg); g.scale.setScalar(1.45);
    g.userData = { heroId: 'kang', isBoss: true, timeRingsGroup, hpBarBg, hpBarFill, parts: { hips, spine, chest, neck, head: headGroup, armL, armR, legL, legR, handL: armL.tip, handR: armR.tip } };
    return g;
  };
})();

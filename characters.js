// High-Poly Anatomical 3D Character Rigs & Canonical Avengers: Doomsday Cast
const HEROES_DATA = {
  reed_richards: {
    id: 'reed_richards',
    name: 'Senhor Fantástico',
    actor: 'Pedro Pascal • Quarteto Fantástico',
    role: 'Líder do Quarteto Fantástico',
    classTag: 'ELÁSTICO',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    avatarEmoji: '4️⃣',
    portraitBg: 'url("the-avengers-doomsday-official-cast-whats-your-thoughts-v0-dwj8ejbzc6re1.webp")',
    portraitPos: '80% 18%',
    health: 580,
    speed: 19,
    attackType: 'elastic',
    primaryName: 'Soco Elástico Extensível',
    primaryDesc: 'Estica o próprio braço a longa distância para esmagar o inimigo fisicamente (Sem lasers).',
    skillName: 'Chicote Cinético Giratório',
    skillDesc: 'Expande os dois braços em 360 graus varrendo e derrubando todos os Doombots ao redor.',
    ultName: 'Colapso da Ponte Multiversal',
    ultDesc: 'Ativa o Emissor de Deslocamento Quântico da Fundação Futuro, esmagando a área.',
    stats: { atk: 92, def: 88, spd: 85 }
  },
  spider_man: {
    id: 'spider_man',
    name: 'Homem-Aranha',
    actor: 'Tom Holland • Peter Parker',
    role: 'Aranha de Ferro',
    classTag: 'ACROBATA',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    avatarEmoji: '🕷️',
    portraitBg: 'url("the-avengers-doomsday-official-cast-whats-your-thoughts-v0-dwj8ejbzc6re1.webp")',
    portraitPos: '62% 92%',
    health: 510,
    speed: 24,
    attackType: 'web',
    primaryName: 'Cabo de Teia & Voadora (Zip-Kick)',
    primaryDesc: 'Dispara uma linha real de teia branca presa ao pulso, puxa-se até o inimigo ou o amarra com impacto físico.',
    skillName: 'Ataque das 4 Garras Waldoes',
    skillDesc: 'Salta girando com as 4 patas mecânicas douradas perfurando todos os inimigos próximos.',
    ultName: 'Casulo de Teia Explosiva',
    ultDesc: 'Lança dezenas de cabos de teia que prendem os alvos ao chão e desfere um golpe sísmico aéreo.',
    stats: { atk: 89, def: 78, spd: 100 }
  },
  thor: {
    id: 'thor',
    name: 'Thor Odinson',
    actor: 'Chris Hemsworth • Deus do Trovão',
    role: 'Filho de Odin',
    classTag: 'TROVÃO',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    avatarEmoji: '⚡',
    portraitBg: 'url("the-avengers-doomsday-official-cast-whats-your-thoughts-v0-dwj8ejbzc6re1.webp")',
    portraitPos: '20% 18%',
    health: 720,
    speed: 17,
    attackType: 'lightning',
    primaryName: 'Arremesso Físico do Mjolnir',
    primaryDesc: 'Arremessa o próprio martelo Mjolnir girando pelo ar; ele esmaga o alvo e retorna automaticamente para a mão de Thor.',
    skillName: 'Queda do Trovão de Asgard',
    skillDesc: 'Salta alto e bate o Mjolnir no chão invocando um raio ramificado real do céu.',
    ultName: 'Fúria da Bifrost',
    ultDesc: 'Abre a Ponte do Arco-Íris orbital desintegrando os inimigos com trovões contínuos.',
    stats: { atk: 99, def: 95, spd: 74 }
  },
  doctor_strange: {
    id: 'doctor_strange',
    name: 'Doutor Estranho',
    actor: 'Benedict Cumberbatch • Stephen Strange',
    role: 'Mestre das Artes Místicas',
    classTag: 'ARCANA',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    avatarEmoji: '🔮',
    portraitBg: 'url("the-avengers-doomsday-official-cast-whats-your-thoughts-v0-dwj8ejbzc6re1.webp")',
    portraitPos: '38% 92%',
    health: 540,
    speed: 18,
    attackType: 'magic',
    primaryName: 'Chicote Místico de Eldritch',
    primaryDesc: 'Conjura um chicote de cordas solares rúnicas e mandalas sagradas que chicoteiam o inimigo.',
    skillName: 'Escudo dos Serafins',
    skillDesc: 'Cria uma cúpula geométrica sagrada que bloqueia 85% de qualquer ataque de Destino.',
    ultName: 'Fratura da Dimensão Espelhada',
    ultDesc: 'Prende o campo de batalha em cristais fractais que explodem simultaneamente.',
    stats: { atk: 95, def: 84, spd: 78 }
  },
  black_panther: {
    id: 'black_panther',
    name: 'Pantera Negra',
    actor: 'Realeza de Wakanda • Vibranium',
    role: 'Protetor de Wakanda',
    classTag: 'VIBRANIUM',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    avatarEmoji: '🐾',
    portraitBg: 'url("qkyii3egmbme1.jpeg")',
    portraitPos: '94% 88%',
    health: 620,
    speed: 22,
    attackType: 'claw',
    primaryName: 'Investida Feroz de Garras',
    primaryDesc: 'Avança em velocidade sobre-humana rasgando o inimigo com golpes físicos duplos de Vibranium.',
    skillName: 'Descarga Cinética Roxa',
    skillDesc: 'Libera toda a energia cinética acumulada no traje em uma onda de choque esférica.',
    ultName: 'Avatar da Deusa Bast',
    ultDesc: 'Desfere uma sequência relâmpago de garras cinéticas que dilacera armaduras de titânio.',
    stats: { atk: 94, def: 90, spd: 96 }
  }
};

class CharacterBuilder {
  static mat(color, roughness = 0.38, metalness = 0.45, emissive = 0x000000, emissiveIntensity = 0) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      emissive,
      emissiveIntensity
    });
  }

  // Builds a Full Multi-Jointed Anatomical Humanoid Superhero Rig
  static buildHeroMesh(heroId) {
    const root = new THREE.Group();
    const carbonTex = ProceduralTextures.createArmorCarbonTexture();
    const spiderTex = ProceduralTextures.createSpiderSuitTexture();

    const skinMat = this.mat(0xd9a17c, 0.55, 0.05);
    let suitPrimary, suitSecondary, accentMat, bootMat;

    if (heroId === 'reed_richards') {
      // Fantastic Four Blue & Dark Navy Suit with White Collar & Emblem
      suitPrimary = this.mat(0x0284c7, 0.4, 0.25);
      suitSecondary = this.mat(0x0f172a, 0.45, 0.3);
      accentMat = this.mat(0xf8fafc, 0.3, 0.1);
      bootMat = this.mat(0x0f172a, 0.35, 0.4);
    } else if (heroId === 'spider_man') {
      // Iconic Red & Blue Spider Suit with Web Texture + Gold Waldoes
      suitPrimary = this.mat(0xdc2626, 0.35, 0.25);
      suitPrimary.map = spiderTex;
      suitSecondary = this.mat(0x1e3a8a, 0.4, 0.25);
      accentMat = this.mat(0xf59e0b, 0.18, 0.92);
      bootMat = suitPrimary;
    } else if (heroId === 'thor') {
      // Asgardian Battle Armor, Chainmail Arms, Red Royal Cape
      suitPrimary = this.mat(0x1e293b, 0.25, 0.85);
      suitSecondary = this.mat(0x334155, 0.35, 0.75);
      accentMat = this.mat(0xb91c1c, 0.65, 0.1);
      bootMat = this.mat(0x78350f, 0.5, 0.3);
    } else if (heroId === 'doctor_strange') {
      // Layered Sorcerer Tunic, Dark Navy Trousers, Crimson Cloak
      suitPrimary = this.mat(0x1e3a8a, 0.55, 0.15);
      suitSecondary = this.mat(0x0f172a, 0.65, 0.15);
      accentMat = this.mat(0xb91c1c, 0.5, 0.15);
      bootMat = this.mat(0x1e293b, 0.5, 0.25);
    } else {
      // Black Panther Vibranium Weave Suit
      suitPrimary = this.mat(0x111318, 0.24, 0.88);
      suitPrimary.bumpMap = carbonTex;
      suitPrimary.bumpScale = 0.025;
      suitSecondary = this.mat(0x1e2028, 0.28, 0.85);
      accentMat = this.mat(0xa855f7, 0.25, 0.9, 0x7e22ce, 0.6);
      bootMat = suitPrimary;
    }

    // 1. Pelvis & Utility Belt
    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.38, 16), suitSecondary);
    pelvis.position.y = 1.18;
    pelvis.scale.set(1.1, 1, 0.82);
    pelvis.castShadow = true;
    root.add(pelvis);

    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.12, 16), accentMat);
    belt.position.y = 1.36;
    belt.scale.set(1.1, 1, 0.84);
    root.add(belt);

    // 2. Anatomical Torso Group (Waist, Sculpted Pectorals, Broad Back)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 1.4;
    root.add(torsoGroup);

    const abdomen = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.38, 0.5, 16), suitPrimary);
    abdomen.position.y = 0.25;
    abdomen.scale.set(1.12, 1, 0.78);
    abdomen.castShadow = true;
    torsoGroup.add(abdomen);

    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.45, 0.65, 16), suitPrimary);
    chest.position.y = 0.78;
    chest.scale.set(1.18, 1, 0.82);
    chest.castShadow = true;
    torsoGroup.add(chest);

    // Sculpted Pectoral Plates
    [-0.22, 0.22].forEach(px => {
      const pec = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.18), suitPrimary);
      pec.position.set(px, 0.84, 0.36);
      pec.rotation.y = px < 0 ? 0.15 : -0.15;
      torsoGroup.add(pec);
    });

    // Neck
    const isFullMask = (heroId === 'spider_man' || heroId === 'black_panther');
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.18, 0.24, 14),
      isFullMask ? suitPrimary : skinMat
    );
    neck.position.y = 1.18;
    torsoGroup.add(neck);

    // 3. Sculpted Head with Jawline, Facial Features / Mask Details
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.42, 0);
    torsoGroup.add(headGroup);

    const cranium = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 20, 20),
      isFullMask ? suitPrimary : skinMat
    );
    cranium.scale.set(0.92, 1.08, 0.98);
    cranium.castShadow = true;
    headGroup.add(cranium);

    const jaw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.15, 0.24, 14),
      isFullMask ? suitPrimary : skinMat
    );
    jaw.position.set(0, -0.12, 0.03);
    headGroup.add(jaw);

    // Hero-Specific Head & Chest Props
    if (heroId === 'reed_richards') {
      // Pedro Pascal likeness: Dark wavy hair, grey temples, beard & mustache, Fantastic Four "4" Emblem
      const hairMat = this.mat(0x1c1917, 0.75, 0.05);
      const greyTempleMat = this.mat(0xd6d3d1, 0.6, 0.1);

      const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.295, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
      hairTop.rotation.x = -0.25;
      headGroup.add(hairTop);

      // Iconic White/Grey Temples
      [-0.25, 0.25].forEach(tx => {
        const temple = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.16), greyTempleMat);
        temple.position.set(tx, 0.02, 0.04);
        headGroup.add(temple);
      });

      // Mustache & Goatee
      const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.06), hairMat);
      mustache.position.set(0, -0.09, 0.26);
      const beard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.08), hairMat);
      beard.position.set(0, -0.21, 0.23);
      headGroup.add(mustache, beard);

      // Eyes
      [-0.09, 0.09].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), this.mat(0x1e293b, 0.2, 0.1));
        eye.position.set(ex, 0.03, 0.25);
        headGroup.add(eye);
      });

      // White Collar & Chest "4" Circle Emblem
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 10, 20), accentMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 1.1;
      torsoGroup.add(collar);

      const emblemDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 20), accentMat);
      emblemDisc.rotation.x = Math.PI / 2;
      emblemDisc.position.set(0, 0.85, 0.45);
      const fourBarV = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.05), suitSecondary);
      fourBarV.position.set(0.03, 0.85, 0.46);
      const fourBarH = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.05), suitSecondary);
      fourBarH.position.set(0, 0.83, 0.46);
      torsoGroup.add(emblemDisc, fourBarV, fourBarH);

    } else if (heroId === 'spider_man') {
      // Expressive Black-rimmed White Spider Lenses + Chest Spider Symbol + 4 Articulated Gold Waldoes
      const blackRimMat = this.mat(0x09090b, 0.3, 0.5);
      const whiteLensMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

      [-1, 1].forEach(dir => {
        const rim = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.09, 0.05), blackRimMat);
        rim.position.set(dir * 0.1, 0.04, 0.25);
        rim.rotation.z = -dir * 0.22;
        rim.rotation.y = dir * 0.25;

        const lens = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.055), whiteLensMat);
        lens.position.copy(rim.position);
        lens.rotation.copy(rim.rotation);
        headGroup.add(rim, lens);
      });

      // Black & Gold Spider Emblem on Chest
      const spiderBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.04), accentMat);
      spiderBody.position.set(0, 0.84, 0.45);
      torsoGroup.add(spiderBody);
      [-1, 1].forEach(dir => {
        [-0.06, 0, 0.06].forEach(ly => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.04), accentMat);
          leg.position.set(dir * 0.12, 0.84 + ly, 0.45);
          leg.rotation.z = dir * ly * 2.5;
          torsoGroup.add(leg);
        });
      });

      // 4 Articulated Mechanical Iron-Spider Waldoes on Back
      const waldoRoot = new THREE.Group();
      waldoRoot.position.set(0, 0.78, -0.36);
      torsoGroup.add(waldoRoot);

      const waldoConfigs = [
        { x: -0.25, y: 0.2, rz: 0.65, rx: -0.3 },
        { x: 0.25, y: 0.2, rz: -0.65, rx: -0.3 },
        { x: -0.25, y: -0.15, rz: 1.05, rx: -0.2 },
        { x: 0.25, y: -0.15, rz: -1.05, rx: -0.2 }
      ];
      waldoConfigs.forEach(wc => {
        const arm = new THREE.Group();
        const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 1.1, 10), accentMat);
        s1.position.y = 0.55;
        const joint = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), accentMat);
        joint.position.y = 1.1;
        const s2 = new THREE.Mesh(new THREE.ConeGeometry(0.04, 1.0, 10), accentMat);
        s2.position.set(0, 1.45, 0.35);
        s2.rotation.x = 0.85;
        arm.add(s1, joint, s2);
        arm.position.set(wc.x, wc.y, 0);
        arm.rotation.set(wc.rx, 0, wc.rz);
        waldoRoot.add(arm);
      });
      root.userData.waldoRoot = waldoRoot;

    } else if (heroId === 'thor') {
      // Sculpted Asgardian Winged Helm, Blonde Hair & Beard, 6 Silver Chest Discs, Red Cape
      const blondeMat = this.mat(0xeab308, 0.6, 0.15);
      const silverMat = this.mat(0xe2e8f0, 0.2, 0.92);

      const hairBack = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.55, 14), blondeMat);
      hairBack.position.set(0, -0.06, -0.08);
      headGroup.add(hairBack);

      const beard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.16), blondeMat);
      beard.position.set(0, -0.18, 0.18);
      headGroup.add(beard);

      // Winged Helmet Crown
      const helmBand = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.14, 16), silverMat);
      helmBand.position.y = 0.12;
      headGroup.add(helmBand);
      [-1, 1].forEach(dir => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.22), silverMat);
        wing.position.set(dir * 0.29, 0.2, -0.02);
        wing.rotation.x = -0.35;
        headGroup.add(wing);
      });

      // 6 Silver Asgardian Discs
      [-0.2, 0.2].forEach(dx => {
        [0.92, 0.66, 0.4].forEach(dy => {
          const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), silverMat);
          disc.rotation.x = Math.PI / 2;
          disc.position.set(dx, dy, 0.44);
          torsoGroup.add(disc);
        });
      });

      const cape = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.15, 0.08), accentMat);
      cape.position.set(0, 0.05, -0.44);
      cape.rotation.x = 0.12;
      cape.castShadow = true;
      torsoGroup.add(cape);

    } else if (heroId === 'doctor_strange') {
      // Sculpted Hair with White Temples, Goatee, High Levitation Collar & Eye of Agamotto
      const hairMat = this.mat(0x18181b, 0.75, 0.05);
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.295, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
      hair.rotation.x = -0.28;
      headGroup.add(hair);

      [-0.25, 0.25].forEach(tx => {
        const streak = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.15), this.mat(0xe2e8f0, 0.5, 0.1));
        streak.position.set(tx, 0.02, 0.03);
        headGroup.add(streak);
      });

      const goatee = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.06), hairMat);
      goatee.position.set(0, -0.18, 0.24);
      headGroup.add(goatee);

      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.36, 0.45, 16, 1, true, Math.PI * 0.22, Math.PI * 1.56),
        accentMat
      );
      collar.position.set(0, 1.24, -0.06);
      torsoGroup.add(collar);

      const amulet = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 1), this.mat(0xf59e0b, 0.2, 0.9));
      amulet.position.set(0, 0.88, 0.45);
      torsoGroup.add(amulet);

      const cloak = new THREE.Mesh(new THREE.BoxGeometry(1.32, 2.1, 0.08), accentMat);
      cloak.position.set(0, 0.05, -0.44);
      cloak.rotation.x = 0.14;
      cloak.castShadow = true;
      torsoGroup.add(cloak);

    } else if (heroId === 'black_panther') {
      // Sculpted Panther Helmet with Ears, Silver Royal Tooth Necklace
      [-0.19, 0.19].forEach(ex => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.18, 8), suitPrimary);
        ear.position.set(ex, 0.28, -0.02);
        headGroup.add(ear);
      });

      [-0.1, 0.1].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
        eye.position.set(ex, 0.04, 0.26);
        eye.rotation.z = ex < 0 ? -0.18 : 0.18;
        headGroup.add(eye);
      });

      // Silver Claw Necklace
      const silverMat = this.mat(0xe2e8f0, 0.2, 0.95);
      const necklace = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 8, 20), silverMat);
      necklace.rotation.x = Math.PI / 2;
      necklace.position.y = 1.06;
      torsoGroup.add(necklace);
      for (let angle = -0.9; angle <= 0.9; angle += 0.3) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.11, 6), silverMat);
        tooth.position.set(Math.sin(angle) * 0.38, 1.01, Math.cos(angle) * 0.38);
        tooth.rotation.x = 2.6;
        torsoGroup.add(tooth);
      }
    }

    // 4. Multi-Jointed Arms (Shoulder Deltoid -> Bicep -> Elbow -> Forearm -> Hand)
    const buildArm = (isRight) => {
      const dir = isRight ? 1 : -1;
      const armRoot = new THREE.Group();
      armRoot.position.set(dir * 0.72, 0.98, 0);

      const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 14), suitPrimary);
      deltoid.scale.set(1.05, 0.95, 0.95);
      armRoot.add(deltoid);

      const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.135, 0.52, 12), heroId === 'thor' ? skinMat : suitPrimary);
      bicep.position.y = -0.28;
      bicep.castShadow = true;
      armRoot.add(bicep);

      const forearmGroup = new THREE.Group();
      forearmGroup.position.set(0, -0.54, 0);
      armRoot.add(forearmGroup);

      const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), suitSecondary);
      forearmGroup.add(elbow);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.105, 0.52, 12), suitSecondary);
      forearm.position.set(0, -0.26, 0.06);
      forearm.rotation.x = -0.22;
      forearm.castShadow = true;
      forearmGroup.add(forearm);

      const hand = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.16, 0.15),
        (heroId === 'thor' || heroId === 'doctor_strange') ? skinMat : suitSecondary
      );
      hand.position.set(0, -0.54, 0.12);
      forearmGroup.add(hand);

      return { armRoot, forearmGroup, hand };
    };

    const leftArmData = buildArm(false);
    const rightArmData = buildArm(true);
    torsoGroup.add(leftArmData.armRoot, rightArmData.armRoot);

    // Attach Mjolnir to Thor's Right Hand
    let mjolnirMesh = null;
    if (heroId === 'thor') {
      mjolnirMesh = this.buildMjolnirMesh();
      mjolnirMesh.position.set(0, -0.58, 0.25);
      mjolnirMesh.rotation.x = Math.PI / 2;
      rightArmData.forearmGroup.add(mjolnirMesh);
    }

    // 5. Multi-Jointed Legs (Hip -> Thigh -> Knee -> Shin -> Boot)
    const buildLeg = (isRight) => {
      const dir = isRight ? 1 : -1;
      const legRoot = new THREE.Group();
      legRoot.position.set(dir * 0.24, 1.12, 0);

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.16, 0.56, 14), suitSecondary);
      thigh.position.y = -0.28;
      thigh.castShadow = true;
      legRoot.add(thigh);

      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 12), suitSecondary);
      knee.position.y = -0.56;
      legRoot.add(knee);

      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.12, 0.54, 14), bootMat);
      shin.position.y = -0.84;
      shin.castShadow = true;
      legRoot.add(shin);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.34), bootMat);
      foot.position.set(0, -1.08, 0.07);
      foot.castShadow = true;
      legRoot.add(foot);

      return legRoot;
    };

    const leftLegGroup = buildLeg(false);
    const rightLegGroup = buildLeg(true);
    root.add(leftLegGroup, rightLegGroup);

    root.userData = {
      ...root.userData,
      torsoGroup,
      headGroup,
      leftArmGroup: leftArmData.armRoot,
      rightArmGroup: rightArmData.armRoot,
      leftForearm: leftArmData.forearmGroup,
      rightForearm: rightArmData.forearmGroup,
      rightHand: rightArmData.hand,
      leftHand: leftArmData.hand,
      leftLegGroup,
      rightLegGroup,
      mjolnirMesh,
      animTime: 0,
      attackAnim: 0
    };

    return root;
  }

  static buildMjolnirMesh() {
    const mjolnir = new THREE.Group();
    const steelMat = this.mat(0x94a3b8, 0.22, 0.92);
    const leatherMat = this.mat(0x78350f, 0.75, 0.1);
    const goldMat = this.mat(0xf59e0b, 0.25, 0.88);

    const headBlock = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.68), steelMat);
    headBlock.castShadow = true;
    const capF = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.19, 0.08, 8), steelMat);
    capF.rotation.x = Math.PI / 2;
    capF.position.z = 0.36;
    const capB = capF.clone();
    capB.rotation.x = -Math.PI / 2;
    capB.position.z = -0.36;

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.68, 10), leatherMat);
    handle.position.y = -0.42;
    const pommel = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.08, 10), goldMat);
    pommel.position.y = -0.76;

    mjolnir.add(headBlock, capF, capB, handle, pommel);
    return mjolnir;
  }

  static animateCharacter(mesh, delta, isMoving, isGrounded, time) {
    if (!mesh || !mesh.userData.torsoGroup) return;
    const u = mesh.userData;

    if (isMoving && isGrounded) {
      u.animTime += delta * 11;
      const swing = Math.sin(u.animTime) * 0.62;
      u.leftLegGroup.rotation.x = swing;
      u.rightLegGroup.rotation.x = -swing;
      u.leftArmGroup.rotation.x = -swing * 0.65;
      u.rightArmGroup.rotation.x = swing * 0.65;
      u.torsoGroup.position.y = 1.4 + Math.abs(Math.cos(u.animTime)) * 0.07;
      u.torsoGroup.rotation.x = 0.1;
    } else if (!isGrounded) {
      u.leftLegGroup.rotation.x = -0.32;
      u.rightLegGroup.rotation.x = 0.42;
      u.leftArmGroup.rotation.x = -0.45;
      u.rightArmGroup.rotation.x = -0.45;
      u.torsoGroup.rotation.x = 0.05;
    } else {
      const breath = Math.sin(time * 2.5) * 0.03;
      u.torsoGroup.position.y = 1.4 + breath;
      u.torsoGroup.rotation.x = 0;
      u.leftLegGroup.rotation.x *= 0.85;
      u.rightLegGroup.rotation.x *= 0.85;
      u.leftArmGroup.rotation.x *= 0.85;
      u.rightArmGroup.rotation.x *= 0.85;
    }

    if (u.attackAnim > 0) {
      u.attackAnim = Math.max(0, u.attackAnim - delta * 4.5);
      u.rightArmGroup.rotation.x = -1.45 * Math.sin(u.attackAnim * Math.PI);
      u.leftArmGroup.rotation.x = -0.95 * Math.sin(u.attackAnim * Math.PI);
    }
  }

  // Robert Downey Jr.'s Doctor Victor Von Doom Boss Rig
  static buildDoctorDoomMesh() {
    const group = new THREE.Group();
    const armorTex = ProceduralTextures.createArmorCarbonTexture('#334155', '#64748b');

    const titaniumMat = this.mat(0x94a3b8, 0.22, 0.94);
    titaniumMat.bumpMap = armorTex;
    titaniumMat.bumpScale = 0.035;

    const emeraldCloakMat = this.mat(0x064e3b, 0.68, 0.15);
    const goldMat = this.mat(0xd97706, 0.22, 0.9);
    const leatherBeltMat = this.mat(0x451a03, 0.65, 0.2);
    const glowGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    // Armored Torso & Latverian Tunic
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.52, 1.65, 16), titaniumMat);
    torso.position.y = 1.95;
    torso.scale.set(1.15, 1, 0.82);
    torso.castShadow = true;
    group.add(torso);

    const surcoat = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.62, 0.48), emeraldCloakMat);
    surcoat.position.y = 1.92;
    surcoat.castShadow = true;
    group.add(surcoat);

    // Leather Belt with Gold Buckle
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.18, 16), leatherBeltMat);
    belt.position.y = 1.38;
    belt.scale.set(1.15, 1, 0.85);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.1), goldMat);
    buckle.position.set(0, 1.38, 0.48);
    group.add(belt, buckle);

    // Sculpted Titanium Mask & Deep Emerald Hood
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 20), titaniumMat);
    head.position.y = 3.05;
    head.scale.set(0.92, 1.1, 0.98);
    group.add(head);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.32), titaniumMat);
    brow.position.set(0, 3.15, 0.24);
    const cheekL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.25, 0.28), titaniumMat);
    cheekL.position.set(-0.18, 2.95, 0.22);
    const cheekR = cheekL.clone();
    cheekR.position.x = 0.18;
    const mouthGrille = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, 0.3), titaniumMat);
    mouthGrille.position.set(0, 2.88, 0.25);
    group.add(brow, cheekL, cheekR, mouthGrille);

    [-0.13, 0.13].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.06), glowGreen);
      eye.position.set(ex, 3.07, 0.37);
      group.add(eye);
    });

    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.72),
      emeraldCloakMat
    );
    hood.position.y = 3.05;
    hood.rotation.x = -0.22;
    group.add(hood);

    // Gold Cloak Medallions & Chain
    const medalGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16);
    medalGeo.rotateX(Math.PI / 2);
    [-0.4, 0.4].forEach(mx => {
      const medal = new THREE.Mesh(medalGeo, goldMat);
      medal.position.set(mx, 2.62, 0.42);
      group.add(medal);
    });
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.76, 8), goldMat);
    chain.rotation.z = Math.PI / 2;
    chain.position.set(0, 2.62, 0.43);
    group.add(chain);

    const cape = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.75, 0.14), emeraldCloakMat);
    cape.position.set(0, 1.65, -0.5);
    cape.rotation.x = 0.12;
    cape.castShadow = true;
    group.add(cape);

    // Articulated Titanium Arms & Armored Greaves
    [-1, 1].forEach(dir => {
      const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), titaniumMat);
      pauldron.position.set(dir * 0.88, 2.55, 0);
      group.add(pauldron);

      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 1.32, 12), titaniumMat);
      arm.position.set(dir * 0.94, 1.75, 0);
      arm.rotation.z = -dir * 0.2;
      arm.castShadow = true;
      group.add(arm);

      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 1.4, 12), titaniumMat);
      leg.position.set(dir * 0.36, 0.7, 0);
      leg.castShadow = true;
      group.add(leg);
    });

    // Orbiting Sorcery Orbs (Subtle, Non-Glare)
    const orbsGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 1), glowGreen);
      orb.position.set(Math.cos(angle) * 2.1, 2.3, Math.sin(angle) * 2.1);
      orbsGroup.add(orb);
    }
    group.add(orbsGroup);

    group.userData = { orbsGroup };
    group.scale.set(1.28, 1.28, 1.28);
    return group;
  }

  // Full Humanoid Bipedal Latverian Doombot Android Soldier
  static buildDoombotMesh() {
    const root = new THREE.Group();
    const steelMat = this.mat(0x64748b, 0.25, 0.92);
    const darkJointMat = this.mat(0x1e293b, 0.4, 0.85);
    const emeraldMat = this.mat(0x064e3b, 0.65, 0.2);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    // Android Pelvis
    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.32, 12), darkJointMat);
    pelvis.position.y = 1.05;
    root.add(pelvis);

    // Armored Robotic Chest with Latverian Green Tabard & Gold Crest
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.35, 1.0, 12), steelMat);
    torso.position.y = 1.65;
    torso.scale.set(1.12, 1, 0.8);
    torso.castShadow = true;
    root.add(torso);

    const tabard = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.95, 0.38), emeraldMat);
    tabard.position.y = 1.65;
    root.add(tabard);

    const core = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), eyeMat);
    core.position.set(0, 1.75, 0.41);
    root.add(core);

    // Robotic Skull with Doom Mask & Green Hood
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 14), steelMat);
    head.position.y = 2.4;
    const faceplate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.22), steelMat);
    faceplate.position.set(0, 2.38, 0.16);
    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.68),
      emeraldMat
    );
    hood.position.y = 2.42;
    hood.rotation.x = -0.2;

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.055, 0.08), eyeMat);
    visor.position.set(0, 2.42, 0.26);
    root.add(head, faceplate, hood, visor);

    // Flowing Green Cape
    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.65, 0.06), emeraldMat);
    cape.position.set(0, 1.4, -0.35);
    cape.rotation.x = 0.12;
    root.add(cape);

    // Articulated Bipedal Arms & Plasma Rifles
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.62, 1.98, 0);
    const rightArm = new THREE.Group();
    rightArm.position.set(0.62, 1.98, 0);

    [leftArm, rightArm].forEach((armG, idx) => {
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), steelMat);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.55, 10), darkJointMat);
      upper.position.y = -0.28;
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.55, 10), steelMat);
      lower.position.set(0, -0.68, 0.18);
      lower.rotation.x = -0.6;
      armG.add(shoulder, upper, lower);

      if (idx === 1) {
        // Right Arm Mounted Latverian Plasma Cannon
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.65, 10), darkJointMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, -0.82, 0.48);
        armG.add(barrel);
      }
    });
    root.add(leftArm, rightArm);

    // Articulated Bipedal Android Legs
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.22, 1.0, 0);
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.22, 1.0, 0);

    [leftLeg, rightLeg].forEach(legG => {
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.5, 10), darkJointMat);
      thigh.position.y = -0.25;
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.5, 10), steelMat);
      shin.position.y = -0.72;
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.28), steelMat);
      foot.position.set(0, -0.96, 0.05);
      legG.add(thigh, shin, foot);
    });
    root.add(leftLeg, rightLeg);

    root.userData = { leftLeg, rightLeg, leftArm, rightArm };
    return root;
  }
}

// ============================================================================
// THREE.CapsuleGeometry Polyfill for Three.js r128
// ============================================================================
if (typeof THREE !== 'undefined' && typeof THREE.CapsuleGeometry === 'undefined') {
  THREE.CapsuleGeometry = class extends THREE.CylinderGeometry {
    constructor(radius = 1, length = 1, capSegments = 4, radialSegments = 8) {
      super(radius, radius, length, radialSegments, capSegments);
    }
  };
}

// ============================================================================
// AVENGERS: DOOMSDAY — V2 ULTRA-ANATOMICAL CHARACTER MODELS + BONE RIG SYSTEM
// Reescultura completa: anatomia heroica de alto detalhe, mãos articuladas,
// rostos expressivos, armaduras com facetas e proporções corretas de super-herói.
// ============================================================================
'use strict';

// ======= GEOMETRY HELPERS =======
const SculptV2 = {
  // Loft suave entre seções anulares com twist e bulge opcionais
  loft(sections, radSeg = 20) {
    const rows = sections.length, cols = radSeg + 1;
    const pos = [], uvs = [], idx = [];
    for (let r = 0; r < rows; r++) {
      const s = sections[r];
      const v = r / (rows - 1);
      const ox = s.ox || 0, oz = s.oz || 0;
      const twist = s.twist || 0;
      for (let c = 0; c < cols; c++) {
        const u = c / radSeg;
        const theta = u * Math.PI * 2 + twist;
        const pinch = 1 - (s.pinchBack || 0) * Math.max(0, Math.cos(theta));
        pos.push(
          ox + Math.cos(theta) * s.rx * pinch,
          s.y,
          oz + Math.sin(theta) * s.rz * pinch
        );
        uvs.push(u, v);
      }
    }
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
        const dy = sections[r + 1].y - sections[r].y;
        if (dy >= 0) { idx.push(a, d, b, b, d, e); }
        else { idx.push(a, b, d, b, e, d); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  },

  // Esfera orgânica com squish nos eixos
  blob(rx, ry, rz, seg = 18) {
    const g = new THREE.SphereGeometry(1, seg, Math.ceil(seg * 0.7));
    g.scale(rx, ry, rz);
    return g;
  },

  // Cilindro cônico para membros
  taper(rTop, rBot, h, seg = 14) {
    return new THREE.CylinderGeometry(rTop, rBot, h, seg, 1);
  },

  // Cápsula suave (torso, pescoço)
  capsule(r, h, seg = 14) {
    return new THREE.CapsuleGeometry(r, h, 6, seg);
  },

  // Box chanfrado via SphereGeometry esticada (look de armadura facetada)
  bevel(w, h, d, seg = 4) {
    const g = new THREE.SphereGeometry(1, seg, seg);
    g.scale(w * 0.52, h * 0.52, d * 0.52);
    return g;
  },

  // Plano curvado para painéis de armadura
  panel(w, h, curve = 0.06, seg = 6) {
    const g = new THREE.PlaneGeometry(w, h, seg, seg);
    // Curvar vértices se geometry tiver atributos (browser) — seguro para mocks
    if (g.attributes && g.attributes.position) {
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) / (w * 0.5);
        pos.setZ(i, curve * (1 - x * x));
      }
      g.computeVertexNormals();
    }
    return g;
  }
};

// ======= MATERIAL HELPERS =======
function matStylized(colorHex, opts = {}) {
  if (typeof CustomShaders !== 'undefined') {
    return CustomShaders.createStylizedMaterial({
      color: colorHex,
      metalness: opts.metal || 0.25,
      roughness: opts.rough !== undefined ? opts.rough : 0.55,
      rimColor: opts.rim || 0xffffff,
      rimStrength: opts.rimStr || 0.55,
      halftone: opts.ht || 0.08,
      detailScale: opts.ds || 2.5,
      ...(opts.map ? { map: opts.map } : {})
    });
  }
  return new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: opts.metal || 0.25,
    roughness: opts.rough !== undefined ? opts.rough : 0.55
  });
}

function matMetal(colorHex, metalness = 0.85, roughness = 0.18) {
  return matStylized(colorHex, { metal: metalness, rough: roughness, rimStr: 0.7, ht: 0.04 });
}

function matSkin() {
  return matStylized(0xf4c09a, { metal: 0.0, rough: 0.72, rimStr: 0.3, ht: 0.05 });
}

function matGlow(colorHex, opacity = 0.92) {
  return new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity });
}

// ======= MESH FACTORY =======
function mesh(geo, mat, castShadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = castShadow;
  return m;
}

function addChild(parent, geo, mat, pos, rot, scale) {
  const m = mesh(geo, mat);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  if (scale) {
    if (typeof scale === 'number') m.scale.setScalar(scale);
    else m.scale.set(...scale);
  }
  parent.add(m);
  return m;
}

// Adiciona mesh com outline de tinta (cel-shading)
function addOutlined(parent, geo, mat, outlineSize = 0.018, pos, rot) {
  const m = mesh(geo, mat);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  parent.add(m);

  if (typeof CharacterBuilder !== 'undefined' && CharacterBuilder.addOutlined) {
    CharacterBuilder.addOutlined(parent, geo, mat, outlineSize);
  } else {
    const og = geo.clone();
    const om = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
    const o = new THREE.Mesh(og, om);
    o.scale.setScalar(1 + outlineSize);
    if (pos) o.position.set(...pos);
    if (rot) o.rotation.set(...rot);
    parent.add(o);
  }
  return m;
}

// ======= HAND BUILDER =======
// Mão articulada com 5 dedos e polegar opositor
function buildHand(isRight, colorHex, opts = {}) {
  const hand = new THREE.Group();
  const palW = opts.palW || 0.095, palH = opts.palH || 0.045, palD = opts.palD || 0.085;
  const mHand = matStylized(colorHex, opts.matOpts || {});
  const mJoint = matStylized(colorHex, { metal: 0.3, rough: 0.4 });

  // Palma
  const palm = mesh(SculptV2.bevel(palW, palH, palD, 5), mHand);
  hand.add(palm);

  const fingerDefs = [
    { name: 'pinky',   tx: -0.045 * (isRight ? 1 : -1), spread: isRight ? -0.14 : 0.14,  len: 0.052 },
    { name: 'ring',    tx: -0.015 * (isRight ? 1 : -1), spread: isRight ? -0.06 : 0.06,  len: 0.065 },
    { name: 'middle',  tx:  0.012 * (isRight ? 1 : -1), spread: 0,                        len: 0.070 },
    { name: 'index',   tx:  0.038 * (isRight ? 1 : -1), spread: isRight ?  0.06 : -0.06, len: 0.063 },
  ];

  fingerDefs.forEach(fd => {
    const finger = new THREE.Group();
    finger.position.set(fd.tx, 0, palD * 0.42);
    finger.rotation.y = fd.spread;
    palm.add(finger);

    // 3 falanges por dedo
    let zy = 0;
    [0.022, 0.018, 0.015].forEach((r, si) => {
      const seg = new THREE.Group();
      seg.position.z = zy + r;
      const knuckleR = r * 0.9 + (si === 0 ? 0.003 : 0);
      const fMesh = mesh(new THREE.CapsuleGeometry(r * 0.72, r * 1.1, 4, 8), mHand);
      fMesh.rotation.x = Math.PI / 2;
      seg.add(fMesh);
      const joint = mesh(SculptV2.blob(knuckleR, knuckleR, knuckleR, 8), mJoint);
      joint.position.z = r * 0.9;
      seg.add(joint);
      finger.add(seg);
      zy += r * 2.1;
    });
    finger.userData.segments = finger.children;
  });

  // Polegar
  const thumb = new THREE.Group();
  thumb.position.set(isRight ? -palW * 0.52 : palW * 0.52, -0.008, palD * 0.1);
  thumb.rotation.set(0.3, isRight ? -0.6 : 0.6, isRight ? -0.4 : 0.4);
  palm.add(thumb);
  let tz = 0;
  [0.027, 0.022].forEach(r => {
    const seg = new THREE.Group(); seg.position.z = tz + r;
    const tm = mesh(new THREE.CapsuleGeometry(r * 0.75, r * 1.0, 4, 8), mHand);
    tm.rotation.x = Math.PI / 2;
    seg.add(tm);
    thumb.add(seg);
    tz += r * 1.9;
  });

  hand.userData.palm = palm;
  return hand;
}

// ======= FACE BUILDER =======
function buildFace(colorHex, opts = {}) {
  const face = new THREE.Group();
  const mSkin = opts.mSkin || matSkin();
  const mFeature = matStylized(colorHex, { metal: 0.1, rough: 0.6 });
  const mEye = matGlow(opts.eyeColor || 0xffffff, 1.0);
  const mPupil = matGlow(opts.pupilColor || 0x000000, 1.0);
  const mEyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });

  // Crânio
  const skull = mesh(SculptV2.blob(0.19, 0.22, 0.20, 20), mSkin);
  face.add(skull);

  // Mandíbula
  const jaw = mesh(SculptV2.loft([
    { y: 0.00, rx: 0.14, rz: 0.12 },
    { y: -0.055, rx: 0.12, rz: 0.10 },
    { y: -0.10, rx: 0.09, rz: 0.075 },
  ], 16), mSkin);
  jaw.position.set(0, -0.08, 0.04);
  face.add(jaw);

  // Bochechas
  [-1, 1].forEach(s => {
    const cheek = mesh(SculptV2.blob(0.07, 0.055, 0.055, 12), mSkin);
    cheek.position.set(s * 0.12, 0.02, 0.14);
    face.add(cheek);
  });

  // Supercílio (protusão frontal)
  const browRidge = mesh(SculptV2.blob(0.19, 0.03, 0.04, 12), mSkin);
  browRidge.position.set(0, 0.10, 0.17);
  face.add(browRidge);

  // Nariz
  const nose = mesh(SculptV2.loft([
    { y: 0, rx: 0.025, rz: 0.025 },
    { y: -0.025, rx: 0.03, rz: 0.028 },
    { y: -0.055, rx: 0.038, rz: 0.034 },
  ], 10), mSkin);
  nose.position.set(0, 0.025, 0.195);
  face.add(nose);

  // Olhos (esclera, íris, pupila)
  [-1, 1].forEach(s => {
    const eyeGrp = new THREE.Group();
    eyeGrp.position.set(s * 0.07, 0.07, 0.17);
    eyeGrp.rotation.y = s * 0.12;

    const white = mesh(SculptV2.blob(0.038, 0.027, 0.025, 12), mEyeWhite);
    eyeGrp.add(white);

    const iris = mesh(new THREE.CircleGeometry(0.018, 12), mEye);
    iris.position.set(0, 0, 0.025);
    eyeGrp.add(iris);

    const pupil = mesh(new THREE.CircleGeometry(0.009, 10), mPupil);
    pupil.position.set(0, 0, 0.026);
    eyeGrp.add(pupil);

    // Pálpebra
    const lid = mesh(SculptV2.blob(0.042, 0.009, 0.026, 10), mSkin);
    lid.position.set(0, 0.018, 0.012);
    eyeGrp.add(lid);

    face.add(eyeGrp);
  });

  // Orelhas
  [-1, 1].forEach(s => {
    const ear = new THREE.Group();
    ear.position.set(s * 0.195, 0.025, -0.01);
    ear.rotation.z = s * 0.18;
    const earShell = mesh(SculptV2.blob(0.028, 0.048, 0.016, 10), mSkin);
    ear.add(earShell);
    const lobe = mesh(SculptV2.blob(0.016, 0.022, 0.012, 8), mSkin);
    lobe.position.y = -0.028;
    ear.add(lobe);
    face.add(ear);
  });

  return face;
}

// ======= HERO BODY BUILDERS =======

// ----- HOMEM-ARANHA -----
function buildSpiderMan(scene) {
  const root = new THREE.Group();
  root.name = 'spider_man';

  const c1 = 0xdc2626; // vermelho escarlate
  const c2 = 0x1e1b4b; // azul meia-noite
  const mRed  = matStylized(c1, { metal: 0.15, rough: 0.52, rimStr: 0.6, ht: 0.07 });
  const mBlue = matStylized(c2, { metal: 0.1, rough: 0.60, rimStr: 0.5 });
  const mLens = matGlow(0xffffff, 0.95);
  const mWeb  = new THREE.MeshStandardMaterial({ color: 0xffd700, wireframe: true, transparent: true, opacity: 0.55 });

  // Torso heroico
  const torso = mesh(SculptV2.loft([
    { y: 0.82, rx: 0.17, rz: 0.12 },  // pescoço
    { y: 0.72, rx: 0.21, rz: 0.155 }, // trapézio
    { y: 0.55, rx: 0.265, rz: 0.185 },// peitoral máximo
    { y: 0.35, rx: 0.235, rz: 0.165 },// abs superiores
    { y: 0.18, rx: 0.195, rz: 0.145 },// abs inferiores
    { y: 0.00, rx: 0.175, rz: 0.130 },// cintura
  ], 20), mRed);
  root.add(torso);

  // Peitoral sculpted
  [-1, 1].forEach(s => {
    const pec = mesh(SculptV2.blob(0.165, 0.11, 0.09, 14), mRed);
    pec.position.set(s * 0.115, 0.60, 0.17);
    pec.rotation.z = s * 0.2;
    root.add(pec);

    // Deltóide
    const delt = mesh(SculptV2.blob(0.11, 0.095, 0.11, 12), mRed);
    delt.position.set(s * 0.30, 0.68, 0.0);
    root.add(delt);

    // Abs (3 pares)
    for (let ab = 0; ab < 3; ab++) {
      const absMesh = mesh(SculptV2.blob(0.055, 0.045, 0.038, 10), mRed);
      absMesh.position.set(s * 0.065, 0.46 - ab * 0.1, 0.17);
      root.add(absMesh);
    }
  });

  // Cabeça com máscara
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.98, 0);
  root.add(headGrp);

  const head = mesh(SculptV2.blob(0.19, 0.205, 0.195, 20), mRed);
  headGrp.add(head);

  // Lentes grandes estilo fumê
  [-1, 1].forEach(s => {
    const lens = mesh(SculptV2.blob(0.07, 0.048, 0.025, 14), mLens);
    lens.position.set(s * 0.065, 0.065, 0.185);
    lens.rotation.z = s * 0.25;
    headGrp.add(lens);

    const lensRim = mesh(SculptV2.blob(0.075, 0.053, 0.022, 12),
      new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    lensRim.position.copy(lens.position);
    lensRim.rotation.z = s * 0.25;
    headGrp.add(lensRim);
  });

  // Padrão de teia (wireframe overlay)
  const webMask = mesh(SculptV2.blob(0.198, 0.213, 0.203, 20), mWeb);
  headGrp.add(webMask);

  // Pernas musculosas
  [-1, 1].forEach(s => {
    const legGrp = new THREE.Group();
    legGrp.position.set(s * 0.098, 0, 0);
    root.add(legGrp);

    // Coxa
    const thigh = mesh(SculptV2.loft([
      { y: -0.02, rx: 0.125, rz: 0.115 },
      { y: -0.22, rx: 0.135, rz: 0.125 },
      { y: -0.44, rx: 0.100, rz: 0.095 },
    ], 16), mBlue);
    legGrp.add(thigh);

    // Músculo vasto (lateral da coxa)
    const vastus = mesh(SculptV2.blob(0.07, 0.19, 0.075, 10), mBlue);
    vastus.position.set(s * 0.04, -0.22, 0.04);
    legGrp.add(vastus);

    // Joelho
    const knee = mesh(SculptV2.blob(0.09, 0.08, 0.085, 12), mRed);
    knee.position.set(0, -0.46, 0.015);
    legGrp.add(knee);

    // Canela + panturrilha
    const shin = mesh(SculptV2.loft([
      { y: -0.48, rx: 0.085, rz: 0.08 },
      { y: -0.62, rx: 0.075, rz: 0.075 },
      { y: -0.82, rx: 0.055, rz: 0.055 },
    ], 14), mBlue);
    legGrp.add(shin);

    const calf = mesh(SculptV2.blob(0.055, 0.14, 0.065, 10), mBlue);
    calf.position.set(s * 0.01, -0.63, -0.03);
    legGrp.add(calf);

    // Pé
    const foot = mesh(SculptV2.loft([
      { y: -0.86, rx: 0.052, rz: 0.052 },
      { y: -0.92, rx: 0.055, rz: 0.075, oz: 0.03 },
      { y: -0.96, rx: 0.048, rz: 0.085, oz: 0.055 },
    ], 12), mRed);
    legGrp.add(foot);
  });

  // Braços
  [-1, 1].forEach(s => {
    const armGrp = new THREE.Group();
    armGrp.position.set(s * 0.30, 0.68, 0);
    root.add(armGrp);

    // Bíceps
    const bicep = mesh(SculptV2.loft([
      { y: 0.0,   rx: 0.095, rz: 0.095 },
      { y: -0.14, rx: 0.11,  rz: 0.10 },
      { y: -0.28, rx: 0.085, rz: 0.085 },
    ], 14), s > 0 ? mRed : mBlue);
    armGrp.add(bicep);

    // Cúbito/cotovelo
    const elbow = mesh(SculptV2.blob(0.07, 0.065, 0.065, 10), mRed);
    elbow.position.set(0, -0.30, 0);
    armGrp.add(elbow);

    // Antebraço
    const forearm = mesh(SculptV2.loft([
      { y: -0.30, rx: 0.072, rz: 0.072 },
      { y: -0.42, rx: 0.063, rz: 0.063 },
      { y: -0.55, rx: 0.048, rz: 0.048 },
    ], 14), mBlue);
    armGrp.add(forearm);

    // Pulso + mão
    const wrist = mesh(SculptV2.blob(0.048, 0.055, 0.045, 10), mRed);
    wrist.position.set(0, -0.57, 0);
    armGrp.add(wrist);

    const hand = buildHand(s > 0, c1, { palW: 0.078, palH: 0.038, palD: 0.07 });
    hand.position.set(0, -0.63, 0);
    armGrp.add(hand);
    armGrp.userData['hand' + (s > 0 ? 'R' : 'L')] = hand;

    // Waldoes (garras mecânicas do ombro)
    for (let w = 0; w < 2; w++) {
      const waldo = new THREE.Group();
      const wAngle = (w - 0.5) * 1.0;
      waldo.position.set(s * 0.015, -0.05, 0);
      waldo.rotation.y = wAngle;
      armGrp.add(waldo);

      const waldoArm = mesh(SculptV2.taper(0.012, 0.018, 0.55, 8), matMetal(0xc0c0c0));
      waldoArm.position.y = -0.275;
      waldoArm.rotation.x = 0.4 * s;
      waldo.add(waldoArm);

      const waldoTip = mesh(SculptV2.blob(0.028, 0.025, 0.028, 8), matMetal(0xe0e0e0));
      waldoTip.position.y = -0.555;
      waldo.add(waldoTip);

      waldo.userData.isWaldo = true;
    }

    armGrp.userData.side = s;
    root.userData['arm' + (s > 0 ? 'R' : 'L')] = armGrp;
  });

  // Shorts/cueca heroica
  const trunk = mesh(SculptV2.loft([
    { y: -0.03, rx: 0.19, rz: 0.155 },
    { y: -0.14, rx: 0.185, rz: 0.15 },
  ], 16), mBlue);
  root.add(trunk);

  root.userData.parts = {
    head: headGrp, chest: torso
  };
  root.userData.heroId = 'spider_man';
  root.userData.scale = 1.0;
  return root;
}

// ----- HOMEM DE FERRO MARK 85 -----
function buildIronMan(scene) {
  const root = new THREE.Group();
  root.name = 'iron_man';

  const mGold  = matMetal(0xfbbf24, 0.92, 0.12);
  const mRed   = matMetal(0xb91c1c, 0.80, 0.22);
  const mDark  = matMetal(0x1a1a2e, 0.70, 0.30);
  const mGlow  = matGlow(0x38bdf8, 0.9);
  const mGlowR = matGlow(0xfbbf24, 0.85);

  // Torso blindado (armadura nanite)
  const torso = mesh(SculptV2.loft([
    { y: 0.88, rx: 0.155, rz: 0.13 },   // pescoço
    { y: 0.78, rx: 0.235, rz: 0.185 },  // ombros altos
    { y: 0.60, rx: 0.285, rz: 0.210 },  // peitoral largo
    { y: 0.40, rx: 0.255, rz: 0.190 },  // cintura
    { y: 0.20, rx: 0.220, rz: 0.165 },  // quadril
    { y: 0.00, rx: 0.195, rz: 0.150 },
  ], 22), mRed);
  root.add(torso);

  // Reator Arc no peito (círculo luminoso)
  const arcCore = mesh(new THREE.CircleGeometry(0.052, 20), mGlow);
  arcCore.position.set(0, 0.60, 0.215);
  root.add(arcCore);
  const arcRing = mesh(new THREE.TorusGeometry(0.062, 0.012, 8, 24), matMetal(0x60a5fa, 0.95, 0.08));
  arcRing.position.copy(arcCore.position);
  root.add(arcRing);
  root.userData.arcCore = arcCore;

  // Painéis de armadura no torso
  const panelDefs = [
    [0, 0.63, 0.19, 0, 0, 0],
    [0, 0.49, 0.195, 0, 0, 0],
    [0, 0.35, 0.195, 0, 0, 0],
  ];
  panelDefs.forEach(([x, y, z]) => {
    const p = mesh(SculptV2.panel(0.24, 0.10, 0.045, 5), mGold);
    p.position.set(x, y, z);
    root.add(p);
  });

  // Capacete
  const helmGrp = new THREE.Group();
  helmGrp.position.set(0, 0.98, 0);
  root.add(helmGrp);
  root.userData.head = helmGrp;

  const helmBase = mesh(SculptV2.blob(0.21, 0.225, 0.215, 22), mRed);
  helmGrp.add(helmBase);

  // Viseira dourada
  const visor = mesh(SculptV2.loft([
    { y: 0.085, rx: 0.19, rz: 0.055, oz: 0.165 },
    { y: 0.025, rx: 0.185, rz: 0.06, oz: 0.17 },
    { y: -0.05, rx: 0.165, rz: 0.055, oz: 0.165 },
  ], 16), mGlowR);
  helmGrp.add(visor);

  // Olhos luminosos
  [-1, 1].forEach(s => {
    const eye = mesh(SculptV2.blob(0.055, 0.025, 0.018, 10), mGlow);
    eye.position.set(s * 0.07, 0.065, 0.195);
    helmGrp.add(eye);
  });

  // Mandíbula
  const faceplate = mesh(SculptV2.loft([
    { y: -0.025, rx: 0.17, rz: 0.075, oz: 0.14 },
    { y: -0.085, rx: 0.14, rz: 0.065, oz: 0.13 },
  ], 14), mRed);
  helmGrp.add(faceplate);

  // Ombros epaulet de armadura
  [-1, 1].forEach(s => {
    const shoulder = new THREE.Group();
    shoulder.position.set(s * 0.31, 0.75, 0);
    root.add(shoulder);

    const pad = mesh(SculptV2.blob(0.13, 0.12, 0.13, 14), mRed);
    shoulder.add(pad);
    const padGold = mesh(SculptV2.panel(0.19, 0.08, 0.055, 5), mGold);
    padGold.position.set(0, 0, 0.09);
    shoulder.add(padGold);

    // Lançador de mísseis (pequeno detalhe)
    const launcher = mesh(SculptV2.bevel(0.04, 0.025, 0.065, 4), mDark);
    launcher.position.set(0, -0.08, -0.05);
    shoulder.add(launcher);
  });

  // Braços blindados
  [-1, 1].forEach(s => {
    const armGrp = new THREE.Group();
    armGrp.position.set(s * 0.31, 0.72, 0);
    root.add(armGrp);

    // Bíceps blindado
    const upper = mesh(SculptV2.loft([
      { y: -0.02, rx: 0.11, rz: 0.11 },
      { y: -0.20, rx: 0.105, rz: 0.105 },
      { y: -0.32, rx: 0.09, rz: 0.09 },
    ], 16), mRed);
    armGrp.add(upper);

    // Painel lateral
    const armPanel = mesh(SculptV2.panel(0.14, 0.18, 0.04, 4), mGold);
    armPanel.position.set(s * 0.07, -0.17, 0.04);
    armGrp.add(armPanel);

    // Cotovelo
    const elbow = mesh(SculptV2.blob(0.08, 0.075, 0.08, 12), mGold);
    elbow.position.y = -0.33;
    armGrp.add(elbow);

    // Antebraço com repulsor
    const forearm = mesh(SculptV2.loft([
      { y: -0.33, rx: 0.085, rz: 0.085 },
      { y: -0.52, rx: 0.078, rz: 0.075 },
    ], 14), mRed);
    armGrp.add(forearm);

    // Repulsor da palma
    const repulsor = mesh(new THREE.CircleGeometry(0.038, 16), mGlow);
    repulsor.position.set(0, -0.60, s > 0 ? 0.055 : -0.055);
    repulsor.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
    armGrp.add(repulsor);

    // Mão blindada
    const hand = buildHand(s > 0, 0xb91c1c, {
      palW: 0.09, palH: 0.042, palD: 0.08,
      matOpts: { metal: 0.85, rough: 0.15 }
    });
    hand.position.y = -0.62;
    armGrp.add(hand);

    root.userData['arm' + (s > 0 ? 'R' : 'L')] = armGrp;
  });

  // Pernas blindadas
  [-1, 1].forEach(s => {
    const legGrp = new THREE.Group();
    legGrp.position.set(s * 0.105, 0, 0);
    root.add(legGrp);

    // Coxa
    const thigh = mesh(SculptV2.loft([
      { y: -0.02, rx: 0.13, rz: 0.12 },
      { y: -0.25, rx: 0.14, rz: 0.13 },
      { y: -0.44, rx: 0.105, rz: 0.10 },
    ], 16), mRed);
    legGrp.add(thigh);

    // Painel lateral da coxa
    const thighPanel = mesh(SculptV2.panel(0.13, 0.22, 0.045, 4), mGold);
    thighPanel.position.set(s * 0.09, -0.22, 0.03);
    legGrp.add(thighPanel);

    // Joelho
    const knee = mesh(SculptV2.blob(0.095, 0.085, 0.09, 12), mGold);
    knee.position.set(0, -0.46, 0.015);
    legGrp.add(knee);

    // Canela
    const shin = mesh(SculptV2.loft([
      { y: -0.48, rx: 0.09, rz: 0.085 },
      { y: -0.70, rx: 0.075, rz: 0.072 },
      { y: -0.86, rx: 0.058, rz: 0.056 },
    ], 14), mRed);
    legGrp.add(shin);

    // Bota com jatos
    const boot = mesh(SculptV2.loft([
      { y: -0.86, rx: 0.065, rz: 0.065 },
      { y: -0.92, rx: 0.072, rz: 0.085, oz: 0.025 },
      { y: -0.96, rx: 0.065, rz: 0.095, oz: 0.045 },
    ], 14), mRed);
    legGrp.add(boot);

    // Jato da bota (propulsor)
    const thruster = mesh(new THREE.CircleGeometry(0.042, 14), mGlow);
    thruster.position.set(0, -0.97, 0);
    thruster.rotation.x = -Math.PI / 2;
    legGrp.add(thruster);
  });

  // Shorts/pelve blindada
  const pelvis = mesh(SculptV2.loft([
    { y: -0.02, rx: 0.21, rz: 0.17 },
    { y: -0.13, rx: 0.20, rz: 0.165 },
  ], 18), mRed);
  root.add(pelvis);

  root.userData.heroId = 'iron_man';
  root.userData.scale = 1.0;
  return root;
}

// ----- THOR ODINSON -----
function buildThor(scene) {
  const root = new THREE.Group();
  root.name = 'thor';

  const mArmor = matStylized(0xc0c0c0, { metal: 0.85, rough: 0.18, rimStr: 0.7, ht: 0.04 });
  const mBlue  = matStylized(0x1e3a5f, { metal: 0.2, rough: 0.6, rimStr: 0.5 });
  const mGold  = matMetal(0xd4a017, 0.9, 0.15);
  const mCape  = matStylized(0x991b1b, { metal: 0.05, rough: 0.75, rimStr: 0.4 });
  const mLightBlue = matGlow(0x93c5fd, 0.85);

  // Torso heróico e musculoso
  const torso = mesh(SculptV2.loft([
    { y: 0.92, rx: 0.185, rz: 0.155 },
    { y: 0.80, rx: 0.26,  rz: 0.21 },
    { y: 0.60, rx: 0.32,  rz: 0.24 },  // peitoral máximo (Thor é muito grande)
    { y: 0.40, rx: 0.275, rz: 0.205 },
    { y: 0.20, rx: 0.235, rz: 0.175 },
    { y: 0.00, rx: 0.205, rz: 0.155 },
  ], 22), mArmor);
  root.add(torso);

  // Discos de armadura asgardiana no peito
  const diskDefs = [
    [0.0, 0.70, 0.235],
    [-0.09, 0.57, 0.235],
    [0.09, 0.57, 0.235],
  ];
  diskDefs.forEach(([x, y, z]) => {
    const disk = mesh(new THREE.CircleGeometry(0.055, 10), mGold);
    disk.position.set(x, y, z);
    root.add(disk);
    const diskRing = mesh(new THREE.TorusGeometry(0.06, 0.009, 6, 16), mGold);
    diskRing.position.set(x, y, z - 0.002);
    root.add(diskRing);
  });

  // Cabeça com capacete alado de Asgard
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 1.08, 0);
  root.add(headGrp);
  root.userData.head = headGrp;

  // Face de Thor (sem capacete - barba loira)
  const face = buildFace(0xd4a017, {
    mSkin: matStylized(0xe8c97e, { metal: 0.0, rough: 0.75, rimStr: 0.25 }),
    eyeColor: 0x38bdf8,
    pupilColor: 0x1e3a5f
  });
  headGrp.add(face);

  // Cabelo loiro
  const hair = mesh(SculptV2.blob(0.21, 0.145, 0.185, 14), matStylized(0xd4a017, { metal: 0.1, rough: 0.8 }));
  hair.position.set(0, 0.065, -0.055);
  headGrp.add(hair);

  // Capacete alado
  const helm = mesh(SculptV2.blob(0.21, 0.19, 0.205, 18), mArmor);
  helm.position.set(0, 0.025, 0);
  headGrp.add(helm);

  [-1, 1].forEach(s => {
    // Asas do capacete
    const wingGrp = new THREE.Group();
    wingGrp.position.set(s * 0.195, 0.07, 0.01);
    headGrp.add(wingGrp);
    for (let f = 0; f < 3; f++) {
      const feather = mesh(SculptV2.panel(0.055 - f * 0.012, 0.11 - f * 0.015, 0.02, 3), mGold);
      feather.position.set(s * f * 0.018, f * 0.025 - 0.015, 0);
      feather.rotation.set(0.1 * f, s * (0.3 + f * 0.1), 0);
      wingGrp.add(feather);
    }
  });

  // Barba
  const beard = mesh(SculptV2.loft([
    { y: -0.085, rx: 0.08, rz: 0.065, oz: 0.12 },
    { y: -0.14, rx: 0.065, rz: 0.055, oz: 0.11 },
  ], 12), matStylized(0xd4a017, { rough: 0.85 }));
  headGrp.add(beard);

  // Braços de super-herói (grandes e musculosos)
  [-1, 1].forEach(s => {
    const armGrp = new THREE.Group();
    armGrp.position.set(s * 0.345, 0.76, 0);
    root.add(armGrp);

    const upper = mesh(SculptV2.loft([
      { y: 0.0,   rx: 0.125, rz: 0.125 },
      { y: -0.18, rx: 0.14,  rz: 0.135 },
      { y: -0.34, rx: 0.11,  rz: 0.108 },
    ], 16), mArmor);
    armGrp.add(upper);

    // Bracelete de Asgard
    const bracelet = mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 16), mGold);
    bracelet.position.y = -0.1;
    bracelet.rotation.x = Math.PI / 2;
    armGrp.add(bracelet);

    const elbow = mesh(SculptV2.blob(0.09, 0.085, 0.09, 12), mGold);
    elbow.position.y = -0.36;
    armGrp.add(elbow);

    const forearm = mesh(SculptV2.loft([
      { y: -0.36, rx: 0.095, rz: 0.092 },
      { y: -0.55, rx: 0.078, rz: 0.076 },
    ], 14), mBlue);
    armGrp.add(forearm);

    const hand = buildHand(s > 0, 0xe8c97e, {
      palW: 0.09, palH: 0.042, palD: 0.08,
      matOpts: { metal: 0.0, rough: 0.72 }
    });
    hand.position.y = -0.62;
    armGrp.add(hand);

    root.userData['arm' + (s > 0 ? 'R' : 'L')] = armGrp;
  });

  // Mjolnir (na mão direita, pode ser destacado)
  const mjolnir = new THREE.Group();
  mjolnir.position.set(0, -0.75, 0);
  root.userData.armR.add(mjolnir);

  const hammerHead = mesh(SculptV2.bevel(0.14, 0.11, 0.22, 5), matMetal(0xa8a9ad, 0.9, 0.12));
  mjolnir.add(hammerHead);
  const hammerHandle = mesh(SculptV2.taper(0.025, 0.030, 0.26, 10), matStylized(0x5c3d2e, { rough: 0.85 }));
  hammerHandle.position.y = -0.19;
  mjolnir.add(hammerHandle);
  const hammerWrap = mesh(SculptV2.taper(0.027, 0.027, 0.08, 8), matStylized(0x996633, { rough: 0.75 }));
  hammerWrap.position.y = -0.28;
  mjolnir.add(hammerWrap);
  const hammerGrip = mesh(SculptV2.blob(0.04, 0.03, 0.04, 8), matMetal(0xd4a017));
  hammerGrip.position.y = -0.33;
  mjolnir.add(hammerGrip);

  root.userData.mjolnir = mjolnir;

  // Pernas
  [-1, 1].forEach(s => {
    const legGrp = new THREE.Group();
    legGrp.position.set(s * 0.115, 0, 0);
    root.add(legGrp);

    const thigh = mesh(SculptV2.loft([
      { y: -0.02, rx: 0.145, rz: 0.135 },
      { y: -0.25, rx: 0.155, rz: 0.145 },
      { y: -0.44, rx: 0.115, rz: 0.11 },
    ], 16), mArmor);
    legGrp.add(thigh);

    const knee = mesh(SculptV2.blob(0.1, 0.09, 0.095, 12), mGold);
    knee.position.set(0, -0.46, 0.015);
    legGrp.add(knee);

    const shin = mesh(SculptV2.loft([
      { y: -0.48, rx: 0.098, rz: 0.092 },
      { y: -0.74, rx: 0.078, rz: 0.075 },
      { y: -0.90, rx: 0.062, rz: 0.06 },
    ], 14), mBlue);
    legGrp.add(shin);

    const boot = mesh(SculptV2.loft([
      { y: -0.90, rx: 0.07, rz: 0.07 },
      { y: -0.96, rx: 0.075, rz: 0.09, oz: 0.03 },
      { y: -1.00, rx: 0.065, rz: 0.1, oz: 0.055 },
    ], 12), mArmor);
    legGrp.add(boot);
  });

  // Cinturão/pelve de armadura
  const pelvis = mesh(SculptV2.loft([
    { y: -0.02, rx: 0.235, rz: 0.185 },
    { y: -0.14, rx: 0.225, rz: 0.178 },
  ], 18), mArmor);
  root.add(pelvis);

  root.userData.heroId = 'thor';
  root.userData.scale = 1.08;
  return root;
}

// ----- DR. DESTINO (DOOM) -----
function buildDoctorDoom(scene) {
  const root = new THREE.Group();
  root.name = 'doctor_doom';

  const mArmor = matMetal(0x2d4a1e, 0.75, 0.28); // Verde-floresta escuro
  const mIron  = matMetal(0x8c8c8c, 0.92, 0.10);
  const mGold  = matMetal(0xc9a84c, 0.90, 0.14);
  const mGreen = matStylized(0x1a3d12, { metal: 0.1, rough: 0.75, rimStr: 0.4 });
  const mRune  = matGlow(0x22c55e, 0.85);

  // Torso de armadura imperial (grande e imponente)
  const torso = mesh(SculptV2.loft([
    { y: 0.98, rx: 0.195, rz: 0.165 },
    { y: 0.86, rx: 0.285, rz: 0.235 },
    { y: 0.68, rx: 0.33,  rz: 0.265 },
    { y: 0.48, rx: 0.295, rz: 0.235 },
    { y: 0.26, rx: 0.255, rz: 0.205 },
    { y: 0.00, rx: 0.225, rz: 0.185 },
  ], 24), mIron);
  root.add(torso);

  // Túnica sobre a armadura
  const tunic = mesh(SculptV2.loft([
    { y: 0.60, rx: 0.345, rz: 0.28 },
    { y: 0.00, rx: 0.32,  rz: 0.265 },
    { y: -0.65, rx: 0.28, rz: 0.235 },
    { y: -1.0,  rx: 0.22, rz: 0.195 },
  ], 20), mGreen);
  tunic.position.y = 0.05;
  root.add(tunic);

  // Medalhão dourado no peito
  const medallion = mesh(new THREE.CircleGeometry(0.07, 14), mGold);
  medallion.position.set(0, 0.72, 0.265);
  root.add(medallion);
  const medRing = mesh(new THREE.TorusGeometry(0.075, 0.015, 6, 20), mGold);
  medRing.position.copy(medallion.position);
  root.add(medRing);
  const medRune = mesh(new THREE.CircleGeometry(0.04, 6), mRune);
  medRune.position.set(0, 0.72, 0.267);
  root.add(medRune);

  // Corrente dourada (toroidal)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const link = mesh(SculptV2.bevel(0.025, 0.012, 0.025, 4), mGold);
    link.position.set(Math.cos(a) * 0.11, 0.65 + Math.sin(a) * 0.055, 0.21);
    root.add(link);
  }

  // Capacete de ferro esculpido (máscara sem rosto visível)
  const helmGrp = new THREE.Group();
  helmGrp.position.set(0, 1.14, 0);
  root.add(helmGrp);
  root.userData.head = helmGrp;

  const helmBase = mesh(SculptV2.blob(0.225, 0.24, 0.225, 22), mIron);
  helmGrp.add(helmBase);

  // Capuz verde sobre o elmo
  const hood = mesh(SculptV2.blob(0.24, 0.26, 0.24, 18), mGreen);
  hood.position.y = 0.055;
  helmGrp.add(hood);

  // Ponta do capuz
  const hoodTip = mesh(SculptV2.loft([
    { y: 0.21, rx: 0.14, rz: 0.12 },
    { y: 0.32, rx: 0.09, rz: 0.075 },
    { y: 0.45, rx: 0.025, rz: 0.022 },
  ], 12), mGreen);
  helmGrp.add(hoodTip);

  // Ranhuras da máscara (decorativas)
  const slitDefs = [
    [-0.065, 0.05, 0.22],
    [0.065, 0.05, 0.22],
    [0, -0.025, 0.225],
    [0, -0.075, 0.22],
  ];
  slitDefs.forEach(([x, y, z]) => {
    const slit = mesh(SculptV2.blob(0.04, 0.012, 0.015, 8), matMetal(0x1a1a1a, 0.5, 0.5));
    slit.position.set(x, y, z);
    helmGrp.add(slit);
  });

  // Olhos luminosos verdes (sinistro)
  [-1, 1].forEach(s => {
    const eye = mesh(SculptV2.blob(0.028, 0.016, 0.014, 8), mRune);
    eye.position.set(s * 0.065, 0.055, 0.218);
    helmGrp.add(eye);
  });

  // Ombros imperiais exagerados
  [-1, 1].forEach(s => {
    const shoulder = new THREE.Group();
    shoulder.position.set(s * 0.355, 0.86, 0);
    root.add(shoulder);

    const pad = mesh(SculptV2.blob(0.155, 0.135, 0.145, 16), mIron);
    shoulder.add(pad);
    const padGold = mesh(SculptV2.panel(0.22, 0.09, 0.055, 5), mGold);
    padGold.position.set(0, -0.055, 0.1);
    shoulder.add(padGold);

    // Prong/espigão do ombro
    const spike = mesh(SculptV2.loft([
      { y: 0.065, rx: 0.025, rz: 0.025 },
      { y: 0.145, rx: 0.012, rz: 0.012 },
    ], 8), mGold);
    shoulder.add(spike);
  });

  // Braços blindados com manoplas
  [-1, 1].forEach(s => {
    const armGrp = new THREE.Group();
    armGrp.position.set(s * 0.355, 0.82, 0);
    root.add(armGrp);

    const upper = mesh(SculptV2.loft([
      { y: 0.0,   rx: 0.115, rz: 0.115 },
      { y: -0.22, rx: 0.12,  rz: 0.12 },
      { y: -0.36, rx: 0.095, rz: 0.095 },
    ], 16), mIron);
    armGrp.add(upper);

    const elbow = mesh(SculptV2.blob(0.09, 0.082, 0.09, 12), mGold);
    elbow.position.y = -0.37;
    armGrp.add(elbow);

    const forearm = mesh(SculptV2.loft([
      { y: -0.37, rx: 0.09, rz: 0.088 },
      { y: -0.55, rx: 0.08, rz: 0.078 },
    ], 14), mIron);
    armGrp.add(forearm);

    // Runa no antebraço
    const runeCircle = mesh(new THREE.CircleGeometry(0.038, 10), mRune);
    runeCircle.position.set(0, -0.46, s > 0 ? 0.082 : -0.082);
    runeCircle.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
    armGrp.add(runeCircle);

    // Manopla
    const gauntlet = mesh(SculptV2.loft([
      { y: -0.57, rx: 0.09, rz: 0.085 },
      { y: -0.65, rx: 0.085, rz: 0.08 },
    ], 12), mGold);
    armGrp.add(gauntlet);

    const hand = buildHand(s > 0, 0x8c8c8c, {
      palW: 0.095, palH: 0.044, palD: 0.085,
      matOpts: { metal: 0.85, rough: 0.15 }
    });
    hand.position.y = -0.68;
    armGrp.add(hand);

    root.userData['arm' + (s > 0 ? 'R' : 'L')] = armGrp;
  });

  // Pernas blindadas com bota imperial
  [-1, 1].forEach(s => {
    const legGrp = new THREE.Group();
    legGrp.position.set(s * 0.115, 0, 0);
    root.add(legGrp);

    const thigh = mesh(SculptV2.loft([
      { y: -0.02, rx: 0.155, rz: 0.145 },
      { y: -0.28, rx: 0.165, rz: 0.155 },
      { y: -0.48, rx: 0.125, rz: 0.12 },
    ], 16), mIron);
    legGrp.add(thigh);

    const knee = mesh(SculptV2.blob(0.11, 0.095, 0.1, 12), mGold);
    knee.position.set(0, -0.50, 0.018);
    legGrp.add(knee);

    const shin = mesh(SculptV2.loft([
      { y: -0.52, rx: 0.105, rz: 0.1 },
      { y: -0.78, rx: 0.085, rz: 0.082 },
      { y: -0.95, rx: 0.065, rz: 0.063 },
    ], 14), mIron);
    legGrp.add(shin);

    // Bota decorada
    const boot = mesh(SculptV2.loft([
      { y: -0.95, rx: 0.08, rz: 0.078 },
      { y: -1.02, rx: 0.085, rz: 0.1, oz: 0.028 },
      { y: -1.065, rx: 0.075, rz: 0.11, oz: 0.055 },
    ], 14), mIron);
    legGrp.add(boot);

    const bootGold = mesh(SculptV2.bevel(0.065, 0.025, 0.09, 4), mGold);
    bootGold.position.set(0, -1.045, 0.038);
    legGrp.add(bootGold);
  });

  // Pelve/cinturão de armadura
  const pelvis = mesh(SculptV2.loft([
    { y: -0.02, rx: 0.255, rz: 0.205 },
    { y: -0.15, rx: 0.245, rz: 0.198 },
  ], 20), mIron);
  root.add(pelvis);

  root.userData.heroId = 'doctor_doom';
  root.userData.isBoss = true;
  root.userData.scale = 1.15;
  return root;
}

// ----- WOLVERINE -----
function buildWolverine(scene) {
  const root = new THREE.Group();
  root.name = 'wolverine';

  const mYellow = matStylized(0xeab308, { metal: 0.15, rough: 0.52, rimStr: 0.6 });
  const mBlue   = matStylized(0x1e3a5f, { metal: 0.1, rough: 0.60, rimStr: 0.5 });
  const mSilver = matMetal(0xc0c0c0, 0.95, 0.08);
  const mBelt   = matStylized(0x4a3728, { rough: 0.85 });

  // Torso - Wolverine é baixo e muito musculoso
  const torso = mesh(SculptV2.loft([
    { y: 0.82, rx: 0.175, rz: 0.145 },
    { y: 0.72, rx: 0.245, rz: 0.195 },
    { y: 0.55, rx: 0.295, rz: 0.225 }, // ombros largos
    { y: 0.35, rx: 0.265, rz: 0.205 },
    { y: 0.18, rx: 0.225, rz: 0.175 },
    { y: 0.00, rx: 0.195, rz: 0.155 },
  ], 20), mYellow);
  root.add(torso);

  // Questão de Wolverine: músculos enormes relativos ao tamanho
  [-1, 1].forEach(s => {
    // Peitoral massivo
    const pec = mesh(SculptV2.blob(0.19, 0.125, 0.11, 14), mYellow);
    pec.position.set(s * 0.12, 0.60, 0.195);
    pec.rotation.z = s * 0.18;
    root.add(pec);

    // Deltóide de lutador
    const delt = mesh(SculptV2.blob(0.13, 0.115, 0.13, 12), mYellow);
    delt.position.set(s * 0.30, 0.68, 0.0);
    root.add(delt);

    // Abs definidos
    for (let ab = 0; ab < 4; ab++) {
      const absMesh = mesh(SculptV2.blob(0.06, 0.05, 0.042, 10), mYellow);
      absMesh.position.set(s * 0.07, 0.48 - ab * 0.095, 0.195);
      root.add(absMesh);
    }
  });

  // Cabeça com máscara amarela/azul
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.96, 0);
  root.add(headGrp);
  root.userData.head = headGrp;

  const headMask = mesh(SculptV2.blob(0.19, 0.205, 0.195, 20), mYellow);
  headGrp.add(headMask);

  // Chifres icônicos da máscara
  [-1, 1].forEach(s => {
    const horn = mesh(SculptV2.loft([
      { y: 0.19, rx: 0.025, rz: 0.025 },
      { y: 0.30, rx: 0.018, rz: 0.018, ox: s * 0.02 },
      { y: 0.40, rx: 0.008, rz: 0.008, ox: s * 0.04 },
    ], 8), mBlue);
    headGrp.add(horn);
  });

  // Olhos brancos (máscara)
  [-1, 1].forEach(s => {
    const eye = mesh(SculptV2.blob(0.055, 0.03, 0.022, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    eye.position.set(s * 0.065, 0.045, 0.188);
    eye.rotation.z = s * 0.2;
    headGrp.add(eye);
  });

  // Painel azul (mandíbula/nariz)
  const nosePanel = mesh(SculptV2.blob(0.09, 0.055, 0.042, 10), mBlue);
  nosePanel.position.set(0, -0.025, 0.188);
  headGrp.add(nosePanel);

  // Braços com garras de Adamantium
  [-1, 1].forEach(s => {
    const armGrp = new THREE.Group();
    armGrp.position.set(s * 0.31, 0.72, 0);
    root.add(armGrp);

    // Bíceps massivo
    const upper = mesh(SculptV2.loft([
      { y: 0.0,   rx: 0.125, rz: 0.125 },
      { y: -0.17, rx: 0.145, rz: 0.14 },
      { y: -0.32, rx: 0.115, rz: 0.11 },
    ], 16), mYellow);
    armGrp.add(upper);

    // Banda azul no bíceps
    const band = mesh(new THREE.TorusGeometry(0.115, 0.018, 6, 16), mBlue);
    band.position.y = -0.1;
    band.rotation.x = Math.PI / 2;
    armGrp.add(band);

    const elbow = mesh(SculptV2.blob(0.09, 0.085, 0.09, 12), mYellow);
    elbow.position.y = -0.34;
    armGrp.add(elbow);

    const forearm = mesh(SculptV2.loft([
      { y: -0.34, rx: 0.105, rz: 0.1 },
      { y: -0.52, rx: 0.085, rz: 0.082 },
    ], 14), mBlue);
    armGrp.add(forearm);

    const hand = buildHand(s > 0, 0xeab308, {
      palW: 0.085, palH: 0.04, palD: 0.078
    });
    hand.position.y = -0.59;
    armGrp.add(hand);

    // 3 garras de Adamantium
    for (let cl = 0; cl < 3; cl++) {
      const clawGrp = new THREE.Group();
      clawGrp.position.set((cl - 1) * 0.028, -0.59, 0);
      armGrp.add(clawGrp);

      const clawBlade = mesh(SculptV2.loft([
        { y: 0.0,  rx: 0.009, rz: 0.004 },
        { y: 0.14, rx: 0.007, rz: 0.003 },
        { y: 0.28, rx: 0.003, rz: 0.0015 },
        { y: 0.38, rx: 0.001, rz: 0.0005 },
      ], 8), mSilver);
      clawBlade.userData.isAdamantiumClaw = true;
      clawGrp.add(clawBlade);

      // Outline da garra (cel-shading)
      const clawOutline = mesh(SculptV2.loft([
        { y: 0.0,  rx: 0.011, rz: 0.006 },
        { y: 0.14, rx: 0.009, rz: 0.005 },
        { y: 0.28, rx: 0.005, rz: 0.003 },
        { y: 0.38, rx: 0.002, rz: 0.001 },
      ], 8), new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
      clawGrp.add(clawOutline);

      clawGrp.userData.isClaw = true;
      clawGrp.userData.clawIndex = cl;
      clawGrp.rotation.x = -Math.PI * 0.08; // inclinado levemente para frente
      armGrp.userData = armGrp.userData || {};
    }

    root.userData['arm' + (s > 0 ? 'R' : 'L')] = armGrp;
  });

  // Cinturão marrom com fivela
  const belt = mesh(SculptV2.loft([
    { y: -0.03, rx: 0.215, rz: 0.17 },
    { y: -0.10, rx: 0.21,  rz: 0.167 },
  ], 18), mBelt);
  root.add(belt);

  const buckle = mesh(SculptV2.bevel(0.055, 0.045, 0.028, 4), mSilver);
  buckle.position.set(0, -0.065, 0.165);
  root.add(buckle);

  // Pernas robustas
  [-1, 1].forEach(s => {
    const legGrp = new THREE.Group();
    legGrp.position.set(s * 0.105, 0, 0);
    root.add(legGrp);

    const thigh = mesh(SculptV2.loft([
      { y: -0.02, rx: 0.14, rz: 0.13 },
      { y: -0.24, rx: 0.155, rz: 0.145 },
      { y: -0.44, rx: 0.115, rz: 0.11 },
    ], 16), mBlue);
    legGrp.add(thigh);

    const knee = mesh(SculptV2.blob(0.1, 0.09, 0.095, 12), mYellow);
    knee.position.set(0, -0.46, 0.015);
    legGrp.add(knee);

    const shin = mesh(SculptV2.loft([
      { y: -0.48, rx: 0.098, rz: 0.092 },
      { y: -0.72, rx: 0.078, rz: 0.075 },
      { y: -0.88, rx: 0.062, rz: 0.06 },
    ], 14), mBlue);
    legGrp.add(shin);

    const boot = mesh(SculptV2.loft([
      { y: -0.88, rx: 0.072, rz: 0.07 },
      { y: -0.94, rx: 0.078, rz: 0.092, oz: 0.028 },
      { y: -0.98, rx: 0.068, rz: 0.1, oz: 0.052 },
    ], 12), mYellow);
    legGrp.add(boot);
  });

  root.userData.heroId = 'wolverine';
  root.userData.scale = 0.94; // Wolverine é mais baixo
  return root;
}

// ======= ANIMATION RIG SYSTEM V2 =======
// Sistema de animação por bones virtuais com curvas de easing e spring physics

class AnimRig {
  constructor(root) {
    this.root = root;
    this.time = 0;
    this.state = 'idle';
    this.stateTime = 0;
    this.transitionFrom = null;
    this.transitionT = 1.0;
    this.transitionDur = 0.18;

    // Spring para suavidade das partes
    this.springVel = {};
    this.springPos = {};
    this.springK = 28.0;
    this.springDamp = 0.72;

    // Keyframes do estado atual
    this._poses = {};
    this._buildDefaultPoses();
  }

  _spring(key, target, dt) {
    if (!this.springPos[key]) this.springPos[key] = target;
    if (!this.springVel[key]) this.springVel[key] = 0;
    const err = target - this.springPos[key];
    this.springVel[key] += err * this.springK * dt;
    this.springVel[key] *= Math.pow(this.springDamp, dt * 60);
    this.springPos[key] += this.springVel[key] * dt;
    return this.springPos[key];
  }

  _buildDefaultPoses() {
    // Pose idle canônica
    this._poses.idle = {
      armRRot: [0.15, 0, -0.22],
      armLRot: [0.15, 0, 0.22],
      bodyBob: 0.025,
      bodyBobSpeed: 1.6,
      headTilt: 0.04,
    };
    // Pose de corrida
    this._poses.run = {
      armRRot: [0.9, 0, -0.15],
      armLRot: [-0.9, 0, 0.15],
      bodyBob: 0.065,
      bodyBobSpeed: 3.5,
      headTilt: -0.08,
    };
    // Pose de ataque (anticipation → strike → recovery)
    this._poses.attack = {
      armRRot: [-0.6, 0.4, -0.3],
      armLRot: [0.4, -0.1, 0.25],
      bodyBob: 0.0,
      bodyBobSpeed: 0,
      headTilt: -0.12,
    };
    // Pose de voo
    this._poses.fly = {
      armRRot: [0.0, 0, -0.9],
      armLRot: [0.0, 0, 0.9],
      bodyBob: 0.015,
      bodyBobSpeed: 0.8,
      headTilt: 0.08,
    };
    // Pose de impacto/hitstop
    this._poses.hitstop = {
      armRRot: [-1.1, 0.5, -0.4],
      armLRot: [-0.3, -0.1, 0.3],
      bodyBob: 0.0,
      bodyBobSpeed: 0,
      headTilt: -0.18,
    };
    // Pose de esquiva
    this._poses.dodge = {
      armRRot: [0.5, -0.6, -0.5],
      armLRot: [0.5, 0.4, 0.5],
      bodyBob: 0.0,
      bodyBobSpeed: 0,
      headTilt: 0.15,
    };
    // Pose de morte/stagger
    this._poses.stagger = {
      armRRot: [0.8, 0.5, -0.8],
      armLRot: [0.4, -0.3, 0.9],
      bodyBob: 0.0,
      bodyBobSpeed: 0,
      headTilt: 0.3,
    };
  }

  setState(state, duration = 0.18) {
    if (this.state === state) return;
    this.transitionFrom = this.state;
    this.state = state;
    this.stateTime = 0;
    this.transitionT = 0;
    this.transitionDur = duration;
  }

  update(dt) {
    this.time += dt;
    this.stateTime += dt;

    if (this.transitionT < 1) {
      this.transitionT = Math.min(1, this.transitionT + dt / this.transitionDur);
    }

    const p = this._poses[this.state] || this._poses.idle;
    const t = this.time;

    // Breathing / idle bob
    const bob = p.bodyBob * Math.sin(t * p.bodyBobSpeed) || 0;

    const armR = this.root.userData.armR;
    const armL = this.root.userData.armL;
    const head = this.root.userData.head;

    if (armR) {
      const rr = p.armRRot;
      armR.rotation.x = this._spring('arRx', rr[0] + Math.sin(t * (p.bodyBobSpeed || 1)) * 0.045, dt);
      armR.rotation.y = this._spring('arRy', rr[1], dt);
      armR.rotation.z = this._spring('arRz', rr[2], dt);
    }
    if (armL) {
      const lr = p.armLRot;
      armL.rotation.x = this._spring('arLx', lr[0] + Math.sin(t * (p.bodyBobSpeed || 1) + Math.PI) * 0.045, dt);
      armL.rotation.y = this._spring('arLy', lr[1], dt);
      armL.rotation.z = this._spring('arLz', lr[2], dt);
    }
    if (head) {
      head.rotation.x = this._spring('hdx', p.headTilt || 0, dt);
      head.position.y = (this.root.userData.scale || 1) > 1
        ? head.position.y
        : this._spring('hdy', 0.98 + bob * 0.5, dt);
    }

    // Body root Y offset
    this.root.position.y = this._spring('bodyY', bob, dt);
  }
}

// ======= REGISTRO GLOBAL =======
window.CharacterBuilderV2 = {
  SculptV2,
  buildSpiderMan,
  buildIronMan,
  buildThor,
  buildWolverine,
  buildDoctorDoom,
  buildHand,
  buildFace,
  AnimRig,
  matStylized,
  matMetal,
  matSkin,
  matGlow,

  // Fábrica unificada
  build(heroId, scene) {
    switch (heroId) {
      case 'spider_man':      return buildSpiderMan(scene);
      case 'iron_man':        return buildIronMan(scene);
      case 'thor':            return buildThor(scene);
      case 'wolverine':       return buildWolverine(scene);
      case 'doctor_doom':     return buildDoctorDoom(scene);
      default:
        // Fallback: modelo genérico se não houver builder específico
        const g = new THREE.Group();
        g.name = heroId;
        const body = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.22, 0.65, 8, 16),
          matStylized(0x888888)
        );
        body.position.y = 0.55;
        g.add(body);
        return g;
    }
  }
};

console.log('[CharacterBuilderV2] Loaded auxiliary module (unified low-poly pipeline active in characters.js + heroes_expansion.js).');

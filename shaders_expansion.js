// ============================================================================
// AVENGERS: DOOMSDAY — BIOME COLOR GRADING, WATER/MAGMA GLSL & PBR TEXTURES
// ============================================================================

(function () {
  if (typeof ProceduralTextures === 'undefined' || typeof GLOBAL_LIGHT_UNIFORMS === 'undefined') return;

  const _texCache = {};
  function memoTex(key, fn) {
    if (!_texCache[key]) _texCache[key] = fn();
    return _texCache[key];
  }

  function makeCanvasTex(size, drawFn, repeat = 1) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    drawFn(ctx, size);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }

  // 1. Stone Cobblestone Road Connecting All 5 Regions
  ProceduralTextures.stoneRoadTex = function () {
    return memoTex('stoneRoadTex_v2', () => {
      const rng = _seededNoise(5509);
      return makeCanvasTex(512, (ctx, s) => {
        ctx.fillStyle = '#1d1b28';
        ctx.fillRect(0, 0, s, s);
        const rows = 8, cols = 6;
        const bw = s / cols, bh = s / rows;
        for (let r = 0; r < rows; r++) {
          const offset = (r % 2) * (bw * 0.5);
          for (let c = -1; c <= cols; c++) {
            const x = c * bw + offset, y = r * bh;
            const shade = 48 + Math.floor(rng() * 20);
            ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 16})`;
            ctx.fillRect(x + 3, y + 3, bw - 6, bh - 6);
            ctx.fillStyle = 'rgba(255,255,255,0.09)';
            ctx.fillRect(x + 4, y + 4, bw - 8, 3);
          }
        }
        ctx.fillStyle = '#b45309';
        ctx.fillRect(0, 0, s, 12);
        ctx.fillRect(0, s - 12, s, 12);
      }, 12);
    });
  };

  // 2. Industrial Citadel Steel Plates
  ProceduralTextures.industrialMetal = function () {
    return memoTex('industrialMetal_v3', () => {
      const rng = _seededNoise(7731);
      return makeCanvasTex(512, (ctx, s) => {
        ctx.fillStyle = '#242b36';
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 320; i++) {
          ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
          ctx.fillRect(0, rng() * s, s, 1 + rng() * 2);
        }
        const step = 128;
        for (let x = 0; x < s; x += step) {
          for (let y = 0; y < s; y += step) {
            ctx.fillStyle = (x + y) % 256 === 0 ? '#2f3948' : '#212832';
            ctx.fillRect(x + 3, y + 3, step - 6, step - 6);
            ctx.strokeStyle = '#11161f';
            ctx.lineWidth = 4;
            ctx.strokeRect(x + 2, y + 2, step - 4, step - 4);
            ctx.fillStyle = '#64748b';
            [[x + 14, y + 14], [x + step - 14, y + 14], [x + 14, y + step - 14], [x + step - 14, y + step - 14]].forEach(([rx, ry]) => {
              ctx.beginPath(); ctx.arc(rx, ry, 3.2, 0, Math.PI * 2); ctx.fill();
            });
          }
        }
        ctx.save();
        ctx.beginPath(); ctx.rect(0, s - 28, s, 28); ctx.clip();
        ctx.fillStyle = '#d97706';
        ctx.fillRect(0, s - 28, s, 28);
        ctx.fillStyle = '#0f172a';
        for (let i = -s; i < s * 2; i += 32) {
          ctx.beginPath();
          ctx.moveTo(i, s - 28); ctx.lineTo(i + 16, s - 28);
          ctx.lineTo(i - 8, s); ctx.lineTo(i - 24, s);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }, 10);
    });
  };

  // 3. Sculpted Stone Rune Arena Floor
  ProceduralTextures.arenaRuneTex = function (accentHex = '#a855f7') {
    return memoTex('arenaRune_' + accentHex, () => {
      return makeCanvasTex(512, (ctx, s) => {
        const c = s * 0.5;
        ctx.clearRect(0, 0, s, s);
        ctx.fillStyle = 'rgba(13, 19, 34, 0.88)';
        ctx.beginPath(); ctx.arc(c, c, s * 0.46, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(c, c, s * 0.44, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(c, c, s * 0.40, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(c, c, s * 0.24, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(c + Math.cos(a) * s * 0.24, c + Math.sin(a) * s * 0.24);
          ctx.lineTo(c + Math.cos(a) * s * 0.40, c + Math.sin(a) * s * 0.40);
          ctx.stroke();
        }
      }, 1);
    });
  };

  // 4. Multiverse Rift Crystal Texture
  ProceduralTextures.riftCrystal = function () {
    return memoTex('riftCrystal_v3', () => {
      const rng = _seededNoise(9917);
      return makeCanvasTex(512, (ctx, s) => {
        const grad = ctx.createRadialGradient(s / 2, s / 2, 20, s / 2, s / 2, s * 0.7);
        grad.addColorStop(0, '#581c87');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#09091a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 48; i++) {
          ctx.strokeStyle = rng() > 0.5 ? 'rgba(56, 189, 248, 0.72)' : 'rgba(192, 132, 252, 0.75)';
          ctx.lineWidth = 1.6 + rng() * 2.5;
          let x = rng() * s, y = rng() * s;
          ctx.beginPath(); ctx.moveTo(x, y);
          for (let k = 0; k < 5; k++) {
            x += (rng() - 0.5) * 95;
            y += (rng() - 0.5) * 95;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }, 1);
    });
  };

  // 5. Hero Suit Textures
  ProceduralTextures.ironmanArmor = function () {
    return memoTex('ironmanArmor_v3', () => makeCanvasTex(512, (ctx, s) => {
      ctx.fillStyle = '#c81e1e';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, s * 0.14, s, s * 0.08);
      ctx.fillRect(0, s * 0.72, s, s * 0.07);
      ctx.strokeStyle = '#5c0a0a';
      ctx.lineWidth = 4;
      for (let i = 48; i < s; i += 64) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 24, s - 48, s - 48);
    }, 1));
  };

  ProceduralTextures.captainSuit = function () {
    return memoTex('captainSuit_v2', () => makeCanvasTex(512, (ctx, s) => {
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.28)';
      ctx.lineWidth = 3;
      for (let y = 0; y < s; y += 32) {
        for (let x = 0; x < s; x += 44) {
          const ox = (Math.floor(y / 32) % 2) * 22;
          ctx.beginPath(); ctx.arc(x + ox, y, 20, 0, Math.PI); ctx.stroke();
        }
      }
      const stripeW = s / 7;
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#f1f5f9';
        ctx.fillRect(i * stripeW, s * 0.72, stripeW, s * 0.22);
      }
    }, 1));
  };

  ProceduralTextures.wolverineSuit = function () {
    return memoTex('wolverineSuit_v3', () => makeCanvasTex(512, (ctx, s) => {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#111827';
      for (let y = 44; y < s - 44; y += 64) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(130, y + 22); ctx.lineTo(0, y + 42); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(s, y); ctx.lineTo(s - 130, y + 22); ctx.lineTo(s, y + 42); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(s * 0.5, 0); ctx.lineTo(s * 0.5, s); ctx.stroke();
    }, 1));
  };

  ProceduralTextures.scarletSuit = function () {
    return memoTex('scarletSuit_v2', () => makeCanvasTex(512, (ctx, s) => {
      ctx.fillStyle = '#9f1239';
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.34)';
      ctx.lineWidth = 3;
      for (let i = -s; i < s * 2; i += 52) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + s, s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i + s, 0); ctx.lineTo(i, s); ctx.stroke();
      }
      ctx.fillStyle = '#4c0519';
      ctx.fillRect(0, s * 0.62, s, s * 0.20);
    }, 1));
  };

  // ==========================================================================
  // CUSTOM GLSL WATER & MAGMA SHADERS (REAL ANIMATED FLUIDS)
  // ==========================================================================
  if (typeof CustomShaders !== 'undefined') {
    CustomShaders.createLakeGeometry = function (radius, rings = 24, segs = 56) {
      const geo = new THREE.BufferGeometry();
      const vertCount = (rings + 1) * (segs + 1);
      const pos = new Float32Array(vertCount * 3);
      const norm = new Float32Array(vertCount * 3);
      const uvs = new Float32Array(vertCount * 2);
      const indices = [];

      let vi = 0, ni = 0, ui = 0;
      for (let rIdx = 0; rIdx <= rings; rIdx++) {
        const rFrac = rIdx / rings;
        const rad = rFrac * radius;
        for (let sIdx = 0; sIdx <= segs; sIdx++) {
          const sFrac = sIdx / segs;
          const th = sFrac * Math.PI * 2;
          pos[vi++] = Math.cos(th) * rad;
          pos[vi++] = 0;
          pos[vi++] = Math.sin(th) * rad;
          norm[ni++] = 0;
          norm[ni++] = 1;
          norm[ni++] = 0;
          uvs[ui++] = rFrac;
          uvs[ui++] = sFrac;
        }
      }

      const stride = segs + 1;
      for (let rIdx = 0; rIdx < rings; rIdx++) {
        for (let sIdx = 0; sIdx < segs; sIdx++) {
          const a = rIdx * stride + sIdx;
          const b = (rIdx + 1) * stride + sIdx;
          const c = rIdx * stride + (sIdx + 1);
          const d = (rIdx + 1) * stride + (sIdx + 1);
          if (rIdx > 0) indices.push(a, c, b);
          indices.push(b, c, d);
        }
      }

      geo.setIndex(indices);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      return geo;
    };

    CustomShaders.createWaterMaterial = function (deepHex = 0x0a3250, shallowHex = 0x22d3ee, opts = {}) {
      const isRiver = opts.mode === 'river' ? 1.0 : 0.0;
      return new THREE.ShaderMaterial({
        uniforms: {
          uTime: GLOBAL_LIGHT_UNIFORMS.uTime,
          uDeep: { value: new THREE.Color(deepHex) },
          uShallow: { value: new THREE.Color(shallowHex) },
          uSkyColor: GLOBAL_LIGHT_UNIFORMS.uSkyColor,
          uSunColor: GLOBAL_LIGHT_UNIFORMS.uSunColor,
          uFogNear: GLOBAL_LIGHT_UNIFORMS.uFogNear,
          uFogFar: GLOBAL_LIGHT_UNIFORMS.uFogFar,
          uFogColorHorizon: GLOBAL_LIGHT_UNIFORMS.uFogColorHorizon,
          uSunDir: { value: new THREE.Vector3(-0.52, 0.74, 0.43).normalize() },
          uMode: { value: isRiver }
        },
        transparent: true,
        depthWrite: true,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        side: THREE.DoubleSide,
        vertexShader: `
          uniform float uTime;
          uniform float uMode;
          varying vec3 vWorldPos;
          varying float vEdge;
          varying float vWave;
          void main() {
            float edge = uMode > 0.5 ? abs(uv.y - 0.5) * 2.0 : uv.x;
            vEdge = clamp(edge, 0.0, 1.0);
            float shoreDamp = smoothstep(1.0, 0.70, vEdge);
            vec4 wp = modelMatrix * vec4(position, 1.0);
            float flow = uMode > 0.5 ? uTime * 2.1 : uTime * 1.6;
            float w1 = sin(wp.x * 0.19 + wp.z * 0.14 + flow) * 0.075;
            float w2 = cos(wp.x * 0.34 - wp.z * 0.27 - uTime * 1.9) * 0.045;
            float w3 = sin((wp.x + wp.z) * 0.58 + uTime * 2.5) * 0.022;
            float w = (w1 + w2 + w3) * shoreDamp;
            wp.y += w;
            vWave = w;
            vWorldPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uDeep;
          uniform vec3 uShallow;
          uniform vec3 uSkyColor;
          uniform vec3 uSunColor;
          uniform float uFogNear;
          uniform float uFogFar;
          uniform vec3 uFogColorHorizon;
          uniform vec3 uSunDir;
          uniform float uMode;
          varying vec3 vWorldPos;
          varying float vEdge;
          varying float vWave;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
              f.y
            );
          }

          float fbmWater(vec2 p) {
            return noise(p) * 0.62 + noise(p * 2.17 + vec2(7.3, -4.1)) * 0.38;
          }

          void main() {
            vec2 p = vWorldPos.xz;
            float t = uTime;
            vec2 flowBias = uMode > 0.5 ? vec2(-t * 1.45, 0.0) : vec2(t * 0.22, t * 0.16);

            // 4 irrational directional swells + 2 FBM ripple octaves (zero tiling stripes)
            vec2 d1 = normalize(vec2(0.87, 0.49));
            vec2 d2 = normalize(vec2(-0.56, 0.83));
            vec2 d3 = normalize(vec2(0.31, -0.95));
            vec2 d4 = normalize(vec2(-0.77, -0.64));

            float a1 = dot(p + flowBias * 0.4, d1) * 0.39 + t * 1.9;
            float a2 = dot(p + flowBias * 0.6, d2) * 0.78 - t * 1.7;
            float a3 = dot(p, d3) * 1.43 + t * 2.4;
            float a4 = dot(p, d4) * 2.71 - t * 3.1;

            vec2 grad = d1 * cos(a1) * 0.13
                      + d2 * cos(a2) * 0.09
                      + d3 * cos(a3) * 0.055
                      + d4 * cos(a4) * 0.030;

            float eps = 0.22;
            vec2 fp1 = p * 0.55 + flowBias;
            vec2 fp2 = p * 1.25 - flowBias * 0.85;
            float nC = fbmWater(fp1) * 0.65 + fbmWater(fp2) * 0.35;
            float nX = fbmWater(fp1 + vec2(eps, 0.0)) * 0.65 + fbmWater(fp2 + vec2(eps, 0.0)) * 0.35;
            float nZ = fbmWater(fp1 + vec2(0.0, eps)) * 0.65 + fbmWater(fp2 + vec2(0.0, eps)) * 0.35;
            grad += vec2((nX - nC), (nZ - nC)) / eps * 0.12;

            vec3 N = normalize(vec3(-grad.x, 1.0, -grad.y));
            vec3 V = normalize(cameraPosition - vWorldPos);
            float NdotV = clamp(dot(N, V), 0.001, 1.0);

            // Beer-Lambert optical absorption from shore (shallow) to center (deep)
            float depthAmt = smoothstep(0.0, 0.72, 1.0 - vEdge);
            float beer = 1.0 - exp(-depthAmt * 3.4);

            // Refracted underwater caustics in shallow & mid zones
            vec2 cUv1 = p * 0.28 + grad * 0.9 + flowBias * 0.55;
            vec2 cUv2 = p * 0.33 - grad * 0.7 - vec2(t * 0.18, -t * 0.22);
            float c1 = 1.0 - abs(noise(cUv1 * 2.1) * 2.0 - 1.0);
            float c2 = 1.0 - abs(noise(cUv2 * 2.4) * 2.0 - 1.0);
            float caustics = pow(clamp(c1 * c2, 0.0, 1.0), 2.2) * 1.85;

            vec3 shallowBed = mix(vec3(0.10, 0.58, 0.68), uShallow, 0.72);
            vec3 deepTone = mix(uDeep * 0.85, vec3(0.03, 0.22, 0.42), 0.45);
            vec3 L = normalize(uSunDir);
            float sss = pow(clamp(dot(V, -L), 0.0, 1.0), 3.0) * max(0.0, N.y) * 0.42;
            vec3 bodyCol = mix(shallowBed, deepTone, beer);
            bodyCol += vec3(0.28, 0.92, 1.0) * caustics * (1.0 - beer * 0.55) * 0.68;
            bodyCol += uShallow * sss;

            // Live biome sky reflection + Schlick Fresnel (IOR 1.333)
            float fresnel = 0.022 + 0.978 * pow(1.0 - NdotV, 4.6);
            vec3 R = reflect(-V, N);
            vec3 skyHorizon = mix(uFogColorHorizon, uSkyColor * 1.15, 0.42);
            vec3 skyZenith = uSkyColor * 1.25;
            vec3 skyReflect = mix(skyHorizon, skyZenith, smoothstep(-0.08, 0.75, R.y));
            skyReflect = mix(skyReflect, vec3(0.16, 0.50, 0.85), 0.35);

            // Dual-lobe GGX sun specular glitter
            vec3 H = normalize(V + L);
            float NdotH = clamp(dot(N, H), 0.0, 1.0);
            float specSharp = pow(NdotH, 260.0) * 4.2;
            float specBroad = pow(NdotH, 32.0) * 0.55;
            vec3 specular = (specSharp + specBroad) * mix(uSunColor, vec3(1.0, 0.98, 0.92), 0.5);

            // Animated lapping shoreline foam + subtle sharpest crest whitecaps
            float shoreBand = smoothstep(0.86, 0.99, vEdge);
            float shoreNoise = noise(p * 0.65 + flowBias * 0.4);
            float shoreRip = sin(vEdge * 28.0 - t * 3.1 + shoreNoise * 3.8) * 0.5 + 0.5;
            float shoreFoam = shoreBand * smoothstep(0.32, 0.85, shoreRip * 0.75 + shoreNoise * 0.45);
            float crestFoam = smoothstep(0.38, 0.54, length(grad) + max(0.0, vWave) * 1.05) * 0.22;
            float foam = clamp(shoreFoam * 0.88 + crestFoam, 0.0, 1.0);

            vec3 finalCol = mix(bodyCol, skyReflect, fresnel * 0.62) + specular;
            finalCol = mix(finalCol, vec3(0.93, 0.98, 1.0), foam * 0.78);

            // Atmospheric distance fog
            float d = length(cameraPosition - vWorldPos);
            float fogFactor = smoothstep(uFogNear, uFogFar, d);
            finalCol = mix(finalCol, uFogColorHorizon, fogFactor);

            float shoreFeather = smoothstep(1.0, 0.965, vEdge);
            float alpha = clamp(mix(0.64, 0.95, beer) + fresnel * 0.22 + foam * 0.35, 0.58, 0.98) * shoreFeather;
            gl_FragColor = vec4(finalCol, alpha);
          }
        `
      });
    };

    CustomShaders.createMagmaMaterial = function () {
      return new THREE.ShaderMaterial({
        uniforms: {
          uTime: GLOBAL_LIGHT_UNIFORMS.uTime,
          uFogNear: GLOBAL_LIGHT_UNIFORMS.uFogNear,
          uFogFar: GLOBAL_LIGHT_UNIFORMS.uFogFar,
          uFogColorHorizon: GLOBAL_LIGHT_UNIFORMS.uFogColorHorizon
        },
        vertexShader: `
          uniform float uTime;
          varying vec3 vWorldPos;
          void main() {
            vec3 pos = position;
            pos.z += sin(pos.x * 0.2 + uTime * 1.4) * 0.12;
            vec4 wp = modelMatrix * vec4(pos, 1.0);
            vWorldPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uFogNear;
          uniform float uFogFar;
          uniform vec3 uFogColorHorizon;
          varying vec3 vWorldPos;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p); vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), f.x), mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x), f.y);
          }
          void main() {
            vec2 p = vWorldPos.xz * 0.09;
            float n1 = noise(p + vec2(uTime * 0.18, -uTime * 0.12));
            float n2 = noise(p * 2.4 - vec2(uTime * 0.25, uTime * 0.15));
            float heat = smoothstep(0.32, 0.78, n1 * 0.65 + n2 * 0.45);
            vec3 crust = vec3(0.14, 0.06, 0.08);
            vec3 hot = mix(vec3(1.1, 0.32, 0.04), vec3(1.75, 0.85, 0.22), heat);
            vec3 col = mix(crust, hot, smoothstep(0.38, 0.72, heat));
            float d = length(cameraPosition - vWorldPos);
            col = mix(col, uFogColorHorizon, smoothstep(uFogNear, uFogFar, d));
            gl_FragColor = vec4(col, 1.0);
          }
        `
      });
    };

    CustomShaders.createEmeraldAbyssMaterial = function () {
      return new THREE.ShaderMaterial({
        uniforms: {
          uTime: GLOBAL_LIGHT_UNIFORMS.uTime,
          uFogNear: GLOBAL_LIGHT_UNIFORMS.uFogNear,
          uFogFar: GLOBAL_LIGHT_UNIFORMS.uFogFar,
          uFogColorHorizon: GLOBAL_LIGHT_UNIFORMS.uFogColorHorizon
        },
        vertexShader: `
          uniform float uTime;
          varying vec3 vWorldPos;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            wp.y += sin(wp.x * 0.08 + uTime * 1.5) * cos(wp.z * 0.09 - uTime * 1.2) * 0.35;
            vWorldPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uFogNear;
          uniform float uFogFar;
          uniform vec3 uFogColorHorizon;
          varying vec3 vWorldPos;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p); vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), f.x), mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x), f.y);
          }
          void main() {
            vec2 p = vWorldPos.xz * 0.065;
            float swirl = noise(p + vec2(sin(uTime * 0.2), uTime * 0.16));
            float veins = noise(p * 2.8 - vec2(uTime * 0.24, -uTime * 0.19) + swirl * 1.6);
            float glow = smoothstep(0.38, 0.82, swirl * 0.55 + veins * 0.55);
            vec3 obsidian = vec3(0.03, 0.08, 0.09);
            vec3 emerald = mix(vec3(0.05, 0.68, 0.46), vec3(0.72, 1.45, 0.96), glow);
            vec3 col = mix(obsidian, emerald, smoothstep(0.32, 0.76, glow));
            float d = length(cameraPosition - vWorldPos);
            col = mix(col, uFogColorHorizon, smoothstep(uFogNear, uFogFar, d));
            gl_FragColor = vec4(col, 1.0);
          }
        `
      });
    };
  }

  // ==========================================================================
  // DYNAMIC BIOME ATMOSPHERE & 3-WAY COLOR GRADING CONTROLLER (11 BIOMES)
  // ==========================================================================
  const BIOME_PRESETS = {
    doomstadt: {
      name: 'VALE DE DOOMSTADT',
      subtitle: 'Fase 1 // Capital Imperial & Rio Latver',
      sunColor: new THREE.Color('#fff0c4'),
      skyColor: new THREE.Color('#80b8f8'),
      groundColor: new THREE.Color('#2d4a3a'),
      shadowTint: new THREE.Color('#233258'),
      fogHorizon: new THREE.Color('#8ec5fc'),
      fogZenith: new THREE.Color('#26305c'),
      fogNear: 320,
      fogFar: 1750,
      lift: new THREE.Vector3(0.01, 0.005, 0.025),
      gamma: new THREE.Vector3(1.0, 1.0, 1.0),
      gain: new THREE.Vector3(1.05, 1.01, 0.96)
    },
    highlands_south: {
      name: 'PLANALTOS DOS CÁRPATOS',
      subtitle: 'Região Sul // Aquedutos Imperiais & Lago Esmeralda',
      sunColor: new THREE.Color('#fde68a'),
      skyColor: new THREE.Color('#60a5fa'),
      groundColor: new THREE.Color('#5a5128'),
      shadowTint: new THREE.Color('#2e3458'),
      fogHorizon: new THREE.Color('#cbd5f5'),
      fogZenith: new THREE.Color('#1e3a5f'),
      fogNear: 340,
      fogFar: 1850,
      lift: new THREE.Vector3(0.012, 0.008, 0.014),
      gamma: new THREE.Vector3(1.01, 1.0, 0.99),
      gain: new THREE.Vector3(1.07, 1.02, 0.95)
    },
    wakanda_jungle: {
      name: 'SELVA DE VIBRANIUM',
      subtitle: 'Sudoeste // Cenote Ancestral & Meteoros Místicos',
      sunColor: new THREE.Color('#6ee7b7'),
      skyColor: new THREE.Color('#2e5c6b'),
      groundColor: new THREE.Color('#0f3830'),
      shadowTint: new THREE.Color('#1a1b4b'),
      fogHorizon: new THREE.Color('#2dd4bf'),
      fogZenith: new THREE.Color('#172554'),
      fogNear: 280,
      fogFar: 1650,
      lift: new THREE.Vector3(0.005, 0.015, 0.025),
      gamma: new THREE.Vector3(0.99, 1.02, 1.02),
      gain: new THREE.Vector3(0.96, 1.06, 1.05)
    },
    asgard_ruins: {
      name: 'RUÍNAS SOLARES DE ASGARD',
      subtitle: 'Sudeste // Colunas da Bifrost & Espada da Valquíria',
      sunColor: new THREE.Color('#fef08a'),
      skyColor: new THREE.Color('#7dd3fc'),
      groundColor: new THREE.Color('#5c4724'),
      shadowTint: new THREE.Color('#2d2b52'),
      fogHorizon: new THREE.Color('#fde68a'),
      fogZenith: new THREE.Color('#1d4ed8'),
      fogNear: 320,
      fogFar: 1850,
      lift: new THREE.Vector3(0.018, 0.012, 0.006),
      gamma: new THREE.Vector3(1.02, 1.01, 0.98),
      gain: new THREE.Vector3(1.10, 1.04, 0.94)
    },
    dark_forest: {
      name: 'FLORESTA NEGRA',
      subtitle: 'Fase 2 // Santuário Carmesim (Barão Mordo)',
      sunColor: new THREE.Color('#a7f3d0'),
      skyColor: new THREE.Color('#3b5f5c'),
      groundColor: new THREE.Color('#132920'),
      shadowTint: new THREE.Color('#122629'),
      fogHorizon: new THREE.Color('#325d56'),
      fogZenith: new THREE.Color('#0c1d22'),
      fogNear: 270,
      fogFar: 1550,
      lift: new THREE.Vector3(0.0, 0.018, 0.018),
      gamma: new THREE.Vector3(0.98, 1.02, 1.0),
      gain: new THREE.Vector3(0.95, 1.06, 1.02)
    },
    industrial_citadel: {
      name: 'CRATERA DOS SENTINELAS',
      subtitle: 'Fase 3 // Plataforma Omega (Sentinela Clássico HQ)',
      sunColor: new THREE.Color('#fdba74'),
      skyColor: new THREE.Color('#64748b'),
      groundColor: new THREE.Color('#291c18'),
      shadowTint: new THREE.Color('#2b1815'),
      fogHorizon: new THREE.Color('#9e593a'),
      fogZenith: new THREE.Color('#1e222e'),
      fogNear: 280,
      fogFar: 1600,
      lift: new THREE.Vector3(0.022, 0.006, 0.014),
      gamma: new THREE.Vector3(1.02, 0.99, 0.98),
      gain: new THREE.Vector3(1.08, 0.99, 0.94)
    },
    tundra_glacial: {
      name: 'TUNDRA GLACIAL & PONTE',
      subtitle: 'Fase 4 // Bastião do Norte (O Destruidor Imperial)',
      sunColor: new THREE.Color('#e0f2fe'),
      skyColor: new THREE.Color('#60a5fa'),
      groundColor: new THREE.Color('#1e3a5f'),
      shadowTint: new THREE.Color('#172554'),
      fogHorizon: new THREE.Color('#93c5fd'),
      fogZenith: new THREE.Color('#1e293b'),
      fogNear: 330,
      fogFar: 1750,
      lift: new THREE.Vector3(0.0, 0.012, 0.032),
      gamma: new THREE.Vector3(0.98, 1.01, 1.04),
      gain: new THREE.Vector3(0.96, 1.02, 1.10)
    },
    castle_rift: {
      name: 'CIDADELA DE DOOM & ABISMO',
      subtitle: 'Fase 5 // Trono Imperial & Tempestade Esmeralda',
      sunColor: new THREE.Color('#34d399'),
      skyColor: new THREE.Color('#161332'),
      groundColor: new THREE.Color('#09191b'),
      shadowTint: new THREE.Color('#0a1f24'),
      fogHorizon: new THREE.Color('#0d2b2a'),
      fogZenith: new THREE.Color('#050814'),
      fogNear: 210,
      fogFar: 1350,
      lift: new THREE.Vector3(-0.008, 0.024, 0.014),
      gamma: new THREE.Vector3(0.97, 1.04, 0.99),
      gain: new THREE.Vector3(0.88, 1.12, 0.98)
    },
    void_abyss: {
      name: 'VAZIO ABISSAL (ATO II)',
      subtitle: 'Extremo Norte // Domínio do Sentinela Sombrio',
      sunColor: new THREE.Color('#facc15'),
      skyColor: new THREE.Color('#1e1b4b'),
      groundColor: new THREE.Color('#0f0d24'),
      shadowTint: new THREE.Color('#09071a'),
      fogHorizon: new THREE.Color('#312e81'),
      fogZenith: new THREE.Color('#020617'),
      fogNear: 240,
      fogFar: 1500,
      lift: new THREE.Vector3(0.01, 0.0, 0.025),
      gamma: new THREE.Vector3(0.99, 0.98, 1.04),
      gain: new THREE.Vector3(1.08, 0.98, 1.04)
    },
    asteroid_m: {
      name: 'ASTEROIDE M (ATO II)',
      subtitle: 'Extremo Oeste // Cidadela Magnética de Erik Lehnsherr',
      sunColor: new THREE.Color('#f0abfc'),
      skyColor: new THREE.Color('#4c1d95'),
      groundColor: new THREE.Color('#24103a'),
      shadowTint: new THREE.Color('#1a0a2e'),
      fogHorizon: new THREE.Color('#701a75'),
      fogZenith: new THREE.Color('#0f0524'),
      fogNear: 250,
      fogFar: 1550,
      lift: new THREE.Vector3(0.02, 0.0, 0.028),
      gamma: new THREE.Vector3(1.01, 0.98, 1.03),
      gain: new THREE.Vector3(1.06, 0.95, 1.08)
    },
    time_citadel: {
      name: 'CIDADELA TEMPORAL (ATO II)',
      subtitle: 'Extremo Leste // Trono do Fim dos Tempos (Kang)',
      sunColor: new THREE.Color('#67e8f9'),
      skyColor: new THREE.Color('#0f766e'),
      groundColor: new THREE.Color('#082f2d'),
      shadowTint: new THREE.Color('#06242c'),
      fogHorizon: new THREE.Color('#155e75'),
      fogZenith: new THREE.Color('#042f2e'),
      fogNear: 250,
      fogFar: 1550,
      lift: new THREE.Vector3(0.0, 0.016, 0.026),
      gamma: new THREE.Vector3(0.99, 1.02, 1.04),
      gain: new THREE.Vector3(0.94, 1.06, 1.12)
    }
  };

  window.BiomeAtmosphere = {
    presets: BIOME_PRESETS,
    currentId: 'doomstadt',
    getBiomeAt(x, z) {
      if (z <= -820) return 'void_abyss';
      if (x <= -940) return 'asteroid_m';
      if (x >= 940) return 'time_citadel';
      if (z <= -365 && z > -820 && Math.abs(x) < 420) return 'castle_rift';
      if (z >= 260 && x < -340) return 'wakanda_jungle';
      if (z >= 260 && x > 340) return 'asgard_ruins';
      if (z >= 255 && Math.abs(x) <= 340) return 'highlands_south';
      if (z <= -135 && Math.abs(x) < 340) return 'tundra_glacial';
      if (x <= -155) return 'dark_forest';
      if (x >= 155) return 'industrial_citadel';
      return 'doomstadt';
    },
    update(x, z, dt) {
      const id = this.getBiomeAt(x, z);
      const changed = id !== this.currentId;
      this.currentId = id;
      const p = BIOME_PRESETS[id] || BIOME_PRESETS.doomstadt;
      const k = Math.min(1, dt * 2.2);
      GLOBAL_LIGHT_UNIFORMS.uSunColor.value.lerp(p.sunColor, k);
      GLOBAL_LIGHT_UNIFORMS.uSkyColor.value.lerp(p.skyColor, k);
      GLOBAL_LIGHT_UNIFORMS.uGroundColor.value.lerp(p.groundColor, k);
      GLOBAL_LIGHT_UNIFORMS.uShadowTint.value.lerp(p.shadowTint, k);
      GLOBAL_LIGHT_UNIFORMS.uFogColorHorizon.value.lerp(p.fogHorizon, k);
      GLOBAL_LIGHT_UNIFORMS.uFogColorZenith.value.lerp(p.fogZenith, k);
      GLOBAL_LIGHT_UNIFORMS.uFogNear.value += (p.fogNear - GLOBAL_LIGHT_UNIFORMS.uFogNear.value) * k;
      GLOBAL_LIGHT_UNIFORMS.uFogFar.value += (p.fogFar - GLOBAL_LIGHT_UNIFORMS.uFogFar.value) * k;
      GLOBAL_LIGHT_UNIFORMS.uGradeLift.value.lerp(p.lift, k);
      GLOBAL_LIGHT_UNIFORMS.uGradeGamma.value.lerp(p.gamma, k);
      GLOBAL_LIGHT_UNIFORMS.uGradeGain.value.lerp(p.gain, k);
      return { id, preset: p, changed };
    }
  };
})();

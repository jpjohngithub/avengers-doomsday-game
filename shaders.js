// High-Contrast Crisp Textures & Non-Glare Shaders for Avengers: Doomsday
const ProceduralTextures = {
  createCobblestoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#181e24';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 16;
    const cols = 8;
    const w = 512 / cols;
    const h = 512 / rows;

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (w / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * w + offset + (Math.random() - 0.5) * 3;
        const y = r * h + (Math.random() - 0.5) * 3;
        const shade = 42 + Math.floor(Math.random() * 26);
        ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 9})`;
        ctx.strokeStyle = '#0d1115';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 5);
        ctx.fill();
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 38);
    return tex;
  },

  createBuildingFacadeTexture(wallHex = '#94a3b8', winColor = '#d97706') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = wallHex;
    ctx.fillRect(0, 0, 256, 512);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 8;
    for (let y = 0; y <= 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
    for (let x = 0; x <= 256; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 2; c++) {
        const wx = c * 128 + 34;
        const wy = r * 128 + 28;
        const isLit = (r + c) % 2 === 0;
        ctx.fillStyle = isLit ? winColor : '#0f172a';
        ctx.fillRect(wx, wy, 60, 72);
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 4;
        ctx.strokeRect(wx, wy, 60, 72);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  },

  // Spider-Man Web Suit Pattern Texture
  createSpiderSuitTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  },

  createArmorCarbonTexture(baseHex = '#1e293b', accentHex = '#334155') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 2;
    for (let i = 0; i < 128; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 128);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(128, i);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }
};

const CustomShaders = {
  // Crisp Hexagonal Energy Shield (No Over-Bright Glare)
  createShieldMaterial: (color = 0x10b981) => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: 0.55 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        float hexDist(vec2 p) {
          p = abs(p);
          float c = dot(p, normalize(vec2(1.0, 1.73)));
          return max(c, p.x);
        }

        vec4 hexCoords(vec2 uv) {
          vec2 r = vec2(1.0, 1.73);
          vec2 h = r * 0.5;
          vec2 a = mod(uv, r) - h;
          vec2 b = mod(uv - h, r) - h;
          vec2 gv = dot(a, a) < dot(b, b) ? a : b;
          return vec4(atan(gv.x, gv.y), 0.5 - hexDist(gv), 0.0, 0.0);
        }

        void main() {
          vec3 viewDir = normalize(-vPosition);
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);
          vec4 hc = hexCoords(vUv * 28.0);
          float hexBorder = smoothstep(0.03, 0.07, hc.y);
          float glow = fresnel * 0.9 + (1.0 - hexBorder) * 0.65;
          gl_FragColor = vec4(uColor, clamp(glow * uOpacity, 0.0, 0.75));
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  },

  // Clean Mystic Mandala (Controlled Brightness, Sharp Sacred Geometry)
  createMysticRuneMaterial: (color = 0xf59e0b) => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float r = length(p);
          float a = atan(p.y, p.x);

          float ringOuter = smoothstep(0.03, 0.01, abs(r - 0.88));
          float ringMid = smoothstep(0.025, 0.008, abs(r - 0.62));
          float ringInner = smoothstep(0.025, 0.008, abs(r - 0.34));

          vec2 rotP = vec2(
            p.x * cos(uTime * 1.5) - p.y * sin(uTime * 1.5),
            p.x * sin(uTime * 1.5) + p.y * cos(uTime * 1.5)
          );
          float box = max(abs(rotP.x), abs(rotP.y));
          float sacredSquare = smoothstep(0.025, 0.005, abs(box - 0.55));

          float runes = smoothstep(0.5, 0.85, abs(sin(a * 12.0 + uTime * 2.5))) * smoothstep(0.05, 0.01, abs(r - 0.75));
          float alpha = (ringOuter + ringMid + ringInner + sacredSquare + runes) * smoothstep(0.96, 0.85, r);

          gl_FragColor = vec4(uColor * 1.15, clamp(alpha * 0.85, 0.0, 0.9));
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  },

  // Clean Energy Beam Shader
  createBeamMaterial: (color = 0x10b981) => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
          float wave = sin(vUv.y * 25.0 - uTime * 18.0) * 0.15 + 0.85;
          float core = sin(vUv.x * 3.14159);
          float intensity = pow(core, 1.4) * wave;
          vec3 col = mix(uColor, vec3(0.95, 1.0, 0.98), pow(core, 3.0) * 0.6);
          gl_FragColor = vec4(col, clamp(intensity * 0.85, 0.0, 0.9));
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  },

  // Crisp Latveria Alpine Twilight Sky (NO Flashing Screen Glare)
  createSkyShader: () => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vWorldPosition;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float y = dir.y;

          vec3 bottomColor = vec3(0.06, 0.09, 0.12);
          vec3 horizonColor = vec3(0.16, 0.24, 0.28);
          vec3 midSkyColor = vec3(0.08, 0.14, 0.22);
          vec3 topSkyColor = vec3(0.03, 0.05, 0.09);

          vec3 sky = mix(bottomColor, horizonColor, smoothstep(-0.15, 0.15, y));
          sky = mix(sky, midSkyColor, smoothstep(0.15, 0.55, y));
          sky = mix(sky, topSkyColor, smoothstep(0.55, 1.0, y));

          if (y > 0.03) {
            vec2 uv = dir.xz / (y + 0.3);
            float n1 = noise(uv * 2.2 + uTime * 0.04);
            float n2 = noise(uv * 4.8 - uTime * 0.06);
            float clouds = smoothstep(0.4, 0.85, n1 * 0.65 + n2 * 0.35);
            vec3 subtleAurora = vec3(0.05, 0.45, 0.32) * pow(clouds, 2.4) * smoothstep(0.05, 0.55, y);
            sky += subtleAurora * 0.35;
          }

          gl_FragColor = vec4(sky, 1.0);
        }
      `,
      side: THREE.BackSide
    });
  }
};

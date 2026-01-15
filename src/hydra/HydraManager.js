import Hydra from 'hydra-synth'

export function createHydraInstance(canvas, options = {}) {
  const hydra = new Hydra({
    canvas,
    detectAudio: false,
    enableStreamCapture: false,
    makeGlobal: false,
    width: options.width || 512,
    height: options.height || 512,
    autoLoop: true,
  })

  // Register custom sphere-aware coordinate functions
  registerSphereFunctions(hydra.synth)

  return hydra
}

function registerSphereFunctions(synth) {
  // Convert to polar coordinates (good for radial patterns on sphere)
  synth.setFunction({
    name: 'polar',
    type: 'coord',
    inputs: [],
    glsl: `
      vec2 c = _st - 0.5;
      float r = length(c) * 2.0;
      float theta = atan(c.y, c.x) / 6.28318 + 0.5;
      return vec2(theta, r);
    `
  })

  // Inverse polar - from polar back to cartesian
  synth.setFunction({
    name: 'fromPolar',
    type: 'coord',
    inputs: [],
    glsl: `
      float theta = _st.x * 6.28318;
      float r = _st.y * 0.5;
      return vec2(cos(theta) * r + 0.5, sin(theta) * r + 0.5);
    `
  })

  // Equirectangular correction - counteracts pole pinching on sphere
  // Stretches horizontally near top/bottom edges
  synth.setFunction({
    name: 'equirect',
    type: 'coord',
    inputs: [],
    glsl: `
      float lat = (_st.y - 0.5) * 3.14159;
      float scale = cos(lat);
      float x = (_st.x - 0.5) * scale + 0.5;
      return vec2(x, _st.y);
    `
  })

  // Tile/wrap - ensures pattern tiles horizontally (helps with seam)
  synth.setFunction({
    name: 'tile',
    type: 'coord',
    inputs: [
      { name: 'tilesX', type: 'float', default: 1.0 },
      { name: 'tilesY', type: 'float', default: 1.0 }
    ],
    glsl: `
      return fract(_st * vec2(tilesX, tilesY));
    `
  })

  // Mirror horizontally - ensures left edge matches right edge (seamless on sphere)
  synth.setFunction({
    name: 'mirror',
    type: 'coord',
    inputs: [],
    glsl: `
      float mx = 1.0 - abs(_st.x * 2.0 - 1.0);
      return vec2(mx, _st.y);
    `
  })

  // Mirror both axes
  synth.setFunction({
    name: 'mirrorXY',
    type: 'coord',
    inputs: [],
    glsl: `
      float mx = 1.0 - abs(_st.x * 2.0 - 1.0);
      float my = 1.0 - abs(_st.y * 2.0 - 1.0);
      return vec2(mx, my);
    `
  })

  // Spherical warp - makes flat patterns curve as if on sphere surface
  synth.setFunction({
    name: 'sphereWarp',
    type: 'coord',
    inputs: [
      { name: 'amount', type: 'float', default: 1.0 }
    ],
    glsl: `
      vec2 c = _st - 0.5;
      float dist = length(c);
      float angle = dist * 3.14159 * amount;
      vec2 warped = c * (sin(angle) / (dist + 0.001));
      return warped + 0.5;
    `
  })
}

export function executeHydraCode(hydra, code) {
  if (!hydra || !hydra.synth) {
    throw new Error('Hydra not initialized')
  }

  const synth = hydra.synth

  try {
    // Create a function with Hydra DSL methods in scope
    const fn = new Function(
      'osc', 'noise', 'shape', 'gradient', 'solid', 'voronoi',
      'src', 's0', 's1', 's2', 's3', 'o0', 'o1', 'o2', 'o3',
      'render', 'time', 'a', 'mouse',
      'setResolution', 'speed', 'bpm', 'width', 'height',
      'hush', 'setFunction',
      code
    )

    // Execute with Hydra synth methods bound
    fn(
      synth.osc.bind(synth),
      synth.noise.bind(synth),
      synth.shape.bind(synth),
      synth.gradient.bind(synth),
      synth.solid.bind(synth),
      synth.voronoi.bind(synth),
      synth.src.bind(synth),
      synth.s0,
      synth.s1,
      synth.s2,
      synth.s3,
      synth.o0,
      synth.o1,
      synth.o2,
      synth.o3,
      synth.render.bind(synth),
      synth.time,
      synth.a,
      synth.mouse,
      synth.setResolution.bind(synth),
      synth.speed,
      synth.bpm,
      synth.width,
      synth.height,
      synth.hush.bind(synth),
      synth.setFunction.bind(synth)
    )

    return { success: true }
  } catch (error) {
    return { success: false, error }
  }
}

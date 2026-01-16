export const hydraPresets = {
  oscillator: {
    name: 'Oscillator',
    code: `osc(10, 0.1, 1.5).out()`
  },
  rainbow: {
    name: 'Rainbow Gradient',
    code: `gradient(1).hue(() => time * 0.1).out()`
  },
  kaleidoscope: {
    name: 'Kaleidoscope',
    code: `osc(10, 0.1, 1.5).kaleid(6).out()`
  },
  feedback: {
    name: 'Feedback Loop',
    code: `src(o0).scale(1.01).rotate(0.01).blend(osc(10)).out()`
  },
  noise: {
    name: 'Noise',
    code: `noise(10, 0.1).modulate(noise(20)).out()`
  },
  voronoi: {
    name: 'Voronoi',
    code: `voronoi(10, 0.5, 0.3).out()`
  },
  stripes: {
    name: 'Stripes',
    code: `osc(60, 0.1, 0).thresh(0.5).out()`
  },
  waves: {
    name: 'Wave Pattern',
    code: `osc(10, 0.1, 1).modulate(osc(20).rotate(1.57)).out()`
  },
  plasma: {
    name: 'Plasma',
    code: `osc(10, 0.1, 0.8).color(1, 0.5, 0.2).mult(osc(20, 0.2, 1).rotate(0.5)).out()`
  },
  // Sphere-aware presets using custom functions
  polarRings: {
    name: '[Sphere] Polar Rings',
    code: `osc(20, 0.1, 1.5).polar().out()`
  },
  equirectNoise: {
    name: '[Sphere] Equirect Noise',
    code: `noise(5, 0.2).equirect().out()`
  },
  mirroredPattern: {
    name: '[Sphere] Mirrored',
    code: `osc(10, 0.1, 1.5).modulate(noise(3), 0.3).mirror().out()`
  },
  sphereWarpOsc: {
    name: '[Sphere] Warped',
    code: `osc(8, 0.1, 1.2).sphereWarp(0.5).out()`
  },
  tiledVoronoi: {
    name: '[Sphere] Tiled Voronoi',
    code: `voronoi(8, 0.3, 0.3).tile(2, 1).out()`
  }
}

export const defaultCode = hydraPresets.oscillator.code

export const defaultPostFxCode = `src(s0).out()`

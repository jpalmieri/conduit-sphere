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

  return hydra
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

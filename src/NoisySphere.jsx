import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useControls } from 'leva'
import { shaderFunctions, shaderPresets, fragmentShaderPresets } from './shaderCode'

function NoisySphere() {
  const meshRef = useRef()
  const materialRef = useRef()
  const [materialKey, setMaterialKey] = useState(0)
  const isDragging = useRef(false)
  const previousMousePosition = useRef({ x: 0, y: 0 })

  // Read initial values from URL params
  const getInitialValues = () => {
    const params = new URLSearchParams(window.location.search)
    const values = {}

    for (const [key, value] of params.entries()) {
      // Parse the value based on type
      if (value === 'true' || value === 'false') {
        values[key] = value === 'true'
      } else if (!isNaN(value) && value !== '') {
        values[key] = parseFloat(value)
      } else {
        values[key] = value
      }
    }

    return values
  }

  const urlValues = useMemo(() => getInitialValues(), [])

  const controls = useControls('Sphere', {
    preset: {
      value: urlValues.preset || 'classic',
      options: {
        'Classic': 'classic',
        'Twister': 'twister',
        'Traveling Waves': 'traveling_waves',
        'Bubbles': 'bubbles',
        'Waves': 'waves',
        'Spiky': 'spiky',
        'Turbulence': 'turbulence'
      },
      label: 'Preset'
    },
    fragmentPreset: {
      value: urlValues.fragmentPreset || 'default',
      options: {
        'Default': 'default',
        'Fresnel Rim': 'fresnel_rim',
        'Fresnel Glow': 'fresnel_glow',
        'Animated Fresnel': 'fresnel_animated',
        'Iridescent': 'iridescent',
        'Holographic': 'holographic',
        'Pearlescent': 'pearlescent',
        'Chromatic': 'chromatic',
        'Ambient Occlusion': 'ambient_occlusion',
        'Cavity': 'cavity',
        'Curvature': 'curvature',
        'Displacement Peaks': 'displacement_peaks'
      },
      label: 'Surface Effect'
    },
    fresnelIntensity: { value: urlValues.fresnelIntensity ?? 0.8, min: 0, max: 10, step: 0.01, label: 'Rim Intensity' },
    fresnelColor: { value: urlValues.fresnelColor || '#4db8ff', label: 'Rim Color' },
    noiseStrength: { value: urlValues.noiseStrength ?? 0.3, min: 0, max: 1, step: 0.01, label: 'Noise Strength' },
    noiseFrequency: { value: urlValues.noiseFrequency ?? 1.5, min: 0.1, max: 5, step: 0.1, label: 'Noise Frequency' },
    animationSpeed: { value: urlValues.animationSpeed ?? 0.3, min: 0, max: 2, step: 0.1, label: 'Animation Speed' },
    color: { value: urlValues.color || '#ff6b9d', label: 'Color' },
    metalness: { value: urlValues.metalness ?? 0.0, min: 0, max: 1, step: 0.01, label: 'Metalness' },
    roughness: { value: urlValues.roughness ?? 0.1, min: 0, max: 1, step: 0.01, label: 'Roughness' },
    envMapIntensity: { value: urlValues.envMapIntensity ?? 2.0, min: 0, max: 5, step: 0.1, label: 'Environment' },
    clearcoat: { value: urlValues.clearcoat ?? 1.0, min: 0, max: 1, step: 0.01, label: 'Clearcoat' },
    clearcoatRoughness: { value: urlValues.clearcoatRoughness ?? 0.0, min: 0, max: 1, step: 0.01, label: 'Clearcoat Rough' },
    transmission: { value: urlValues.transmission ?? 0.0, min: 0, max: 1, step: 0.01, label: 'Transmission' },
    thickness: { value: urlValues.thickness ?? 0.5, min: 0, max: 5, step: 0.1, label: 'Thickness' },
    ior: { value: urlValues.ior ?? 1.5, min: 1, max: 2.5, step: 0.01, label: 'IOR' },
    sheen: { value: urlValues.sheen ?? 0.0, min: 0, max: 1, step: 0.01, label: 'Sheen' },
    sheenRoughness: { value: urlValues.sheenRoughness ?? 1.0, min: 0, max: 1, step: 0.01, label: 'Sheen Roughness' },
    sheenColor: { value: urlValues.sheenColor || '#ffffff', label: 'Sheen Color' },
    iridescence: { value: urlValues.iridescence ?? 0.0, min: 0, max: 1, step: 0.01, label: 'Iridescence' },
    iridescenceIOR: { value: urlValues.iridescenceIOR ?? 1.3, min: 1, max: 2.5, step: 0.01, label: 'Iridescence IOR' },
    iridescenceThickness: { value: urlValues.iridescenceThickness ?? 400, min: 0, max: 1000, step: 10, label: 'Iridescence Thick' }
  })

  const glitchControls = useControls('Glitch Effects', {
    glitchEnabled: { value: urlValues.glitchEnabled ?? false, label: 'Enable Glitch' },
    glitchIntensity: { value: urlValues.glitchIntensity ?? 0.3, min: 0, max: 5, step: 0.01, label: 'Glitch Intensity' },
    glitchFrequency: { value: urlValues.glitchFrequency ?? 10, min: 1, max: 50, step: 1, label: 'Glitch Grid Size' },
    glitchSpeed: { value: urlValues.glitchSpeed ?? 1.0, min: 0, max: 5, step: 0.01, label: 'Glitch Speed' },
    glitchRandomness: { value: urlValues.glitchRandomness ?? 0.5, min: 0, max: 1, step: 0.01, label: 'Randomness' }
  })

  // Update URL when controls change
  useEffect(() => {
    const params = new URLSearchParams()

    Object.entries(controls).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, value)
      }
    })

    Object.entries(glitchControls).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, value)
      }
    })

    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }, [controls, glitchControls])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNoiseStrength: { value: controls.noiseStrength },
      uNoiseFrequency: { value: controls.noiseFrequency },
      uAnimationSpeed: { value: controls.animationSpeed },
      uFresnelIntensity: { value: controls.fresnelIntensity },
      uFresnelColor: { value: new THREE.Color(controls.fresnelColor) },
      uGlitchEnabled: { value: glitchControls.glitchEnabled ? 1.0 : 0.0 },
      uGlitchIntensity: { value: glitchControls.glitchIntensity },
      uGlitchFrequency: { value: glitchControls.glitchFrequency },
      uGlitchSpeed: { value: glitchControls.glitchSpeed },
      uGlitchRandomness: { value: glitchControls.glitchRandomness }
    }),
    []
  )

  useEffect(() => {
    setMaterialKey(k => k + 1)
  }, [controls.preset, controls.fragmentPreset])

  const handlePointerDown = (e) => {
    isDragging.current = true
    previousMousePosition.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerMove = (e) => {
    if (!isDragging.current || !meshRef.current) return

    const deltaX = e.clientX - previousMousePosition.current.x
    const deltaY = e.clientY - previousMousePosition.current.y

    meshRef.current.rotation.y += deltaX * 0.01
    meshRef.current.rotation.x += deltaY * 0.01

    previousMousePosition.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = () => {
    isDragging.current = false
  }

  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
      const shader = materialRef.current.userData.shader
      shader.uniforms.uTime.value = state.clock.elapsedTime
      shader.uniforms.uNoiseStrength.value = controls.noiseStrength
      shader.uniforms.uNoiseFrequency.value = controls.noiseFrequency
      shader.uniforms.uAnimationSpeed.value = controls.animationSpeed
      shader.uniforms.uFresnelIntensity.value = controls.fresnelIntensity
      shader.uniforms.uFresnelColor.value.set(controls.fresnelColor)
      shader.uniforms.uGlitchEnabled.value = glitchControls.glitchEnabled ? 1.0 : 0.0
      shader.uniforms.uGlitchIntensity.value = glitchControls.glitchIntensity
      shader.uniforms.uGlitchFrequency.value = glitchControls.glitchFrequency
      shader.uniforms.uGlitchSpeed.value = glitchControls.glitchSpeed
      shader.uniforms.uGlitchRandomness.value = glitchControls.glitchRandomness
    }
  })

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime
    shader.uniforms.uNoiseStrength = uniforms.uNoiseStrength
    shader.uniforms.uNoiseFrequency = uniforms.uNoiseFrequency
    shader.uniforms.uAnimationSpeed = uniforms.uAnimationSpeed
    shader.uniforms.uFresnelIntensity = uniforms.uFresnelIntensity
    shader.uniforms.uFresnelColor = uniforms.uFresnelColor
    shader.uniforms.uGlitchEnabled = uniforms.uGlitchEnabled
    shader.uniforms.uGlitchIntensity = uniforms.uGlitchIntensity
    shader.uniforms.uGlitchFrequency = uniforms.uGlitchFrequency
    shader.uniforms.uGlitchSpeed = uniforms.uGlitchSpeed
    shader.uniforms.uGlitchRandomness = uniforms.uGlitchRandomness

    const uniformsCode = [
      'uniform float uTime;',
      'uniform float uNoiseStrength;',
      'uniform float uNoiseFrequency;',
      'uniform float uAnimationSpeed;',
      'uniform float uFresnelIntensity;',
      'uniform vec3 uFresnelColor;',
      'uniform float uGlitchEnabled;',
      'uniform float uGlitchIntensity;',
      'uniform float uGlitchFrequency;',
      'uniform float uGlitchSpeed;',
      'uniform float uGlitchRandomness;',
      ''
    ].join('\n')

    // Only add vWorldPosition if transmission is disabled (Three.js adds it when transmission is enabled)
    const needsWorldPosition = controls.transmission === 0
    const varyingsCode = [
      needsWorldPosition ? 'varying vec3 vWorldPosition;' : '',
      'varying float vDistanceFromCenter;',
      'varying vec3 vDisplacedNormal;',
      ''
    ].join('\n')

    shader.vertexShader = uniformsCode + varyingsCode + shaderFunctions + '\n' + shader.vertexShader

    const presetCode = shaderPresets[controls.preset] || shaderPresets.classic

    const transformCode = [
      'vec3 pos = vec3(position);',
      'float noiseFreq = uNoiseFrequency;',
      'float noiseAmp = uNoiseStrength;',
      presetCode,
      '',
      '// Apply glitch effect on top of existing displacement',
      'if (uGlitchEnabled > 0.5) {',
      '  // Quantize position into grid cells for rectilinear effect',
      '  vec3 gridPos = floor(pos * uGlitchFrequency) / uGlitchFrequency;',
      '  ',
      '  // Generate pseudo-random values for each cell',
      '  float cellHash = fract(sin(dot(gridPos, vec3(12.9898, 78.233, 45.164))) * 43758.5453);',
      '  ',
      '  // Calculate current and next glitch states',
      '  float glitchTime = uTime * uGlitchSpeed * 2.0;',
      '  float currentState = floor(glitchTime);',
      '  float nextState = currentState + 1.0;',
      '  float transition = fract(glitchTime); // 0 to 1 within each state',
      '  ',
      '  // Smooth the transition',
      '  transition = smoothstep(0.0, 1.0, transition);',
      '  ',
      '  // Calculate current glitch offset',
      '  float currentHash = fract(sin(currentState + cellHash * 100.0) * 43758.5453);',
      '  float threshold = 1.0 - uGlitchRandomness;',
      '  vec3 currentOffset = vec3(0.0);',
      '  ',
      '  if (currentHash > threshold) {',
      '    float axisSelect = fract(cellHash * 7.0 + currentState);',
      '    if (axisSelect < 0.33) {',
      '      currentOffset.x = (fract(cellHash * 3.0 + currentState) - 0.5) * uGlitchIntensity;',
      '    } else if (axisSelect < 0.66) {',
      '      currentOffset.y = (fract(cellHash * 5.0 + currentState) - 0.5) * uGlitchIntensity;',
      '    } else {',
      '      currentOffset.z = (fract(cellHash * 11.0 + currentState) - 0.5) * uGlitchIntensity;',
      '    }',
      '  }',
      '  ',
      '  // Calculate next glitch offset',
      '  float nextHash = fract(sin(nextState + cellHash * 100.0) * 43758.5453);',
      '  vec3 nextOffset = vec3(0.0);',
      '  ',
      '  if (nextHash > threshold) {',
      '    float axisSelect = fract(cellHash * 7.0 + nextState);',
      '    if (axisSelect < 0.33) {',
      '      nextOffset.x = (fract(cellHash * 3.0 + nextState) - 0.5) * uGlitchIntensity;',
      '    } else if (axisSelect < 0.66) {',
      '      nextOffset.y = (fract(cellHash * 5.0 + nextState) - 0.5) * uGlitchIntensity;',
      '    } else {',
      '      nextOffset.z = (fract(cellHash * 11.0 + nextState) - 0.5) * uGlitchIntensity;',
      '    }',
      '  }',
      '  ',
      '  // Interpolate between current and next offset',
      '  vec3 glitchOffset = mix(currentOffset, nextOffset, transition);',
      '  pos += glitchOffset;',
      '}',
      '',
      'vec3 transformed = pos;',
      '',
      'vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      'vDistanceFromCenter = length(transformed);'
    ].join('\n')

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      transformCode
    )

    // Calculate displaced normal for fresnel without affecting material lighting
    const displacedNormalCode = [
      '// Calculate smoothed displaced normal for fresnel effects',
      'vec3 displacedNormal = objectNormal;',
      'if (uNoiseStrength > 0.0) {',
      '  // Use larger offset and average multiple samples for smoother normals',
      '  float offset = 0.05;',
      '  vec3 avgNormal = vec3(0.0);',
      '  ',
      '  // Sample in multiple directions',
      '  for(int i = 0; i < 6; i++) {',
      '    vec3 sampleOffset = vec3(0.0);',
      '    if(i == 0) sampleOffset = vec3(offset, 0.0, 0.0);',
      '    else if(i == 1) sampleOffset = vec3(-offset, 0.0, 0.0);',
      '    else if(i == 2) sampleOffset = vec3(0.0, offset, 0.0);',
      '    else if(i == 3) sampleOffset = vec3(0.0, -offset, 0.0);',
      '    else if(i == 4) sampleOffset = vec3(0.0, 0.0, offset);',
      '    else sampleOffset = vec3(0.0, 0.0, -offset);',
      '    ',
      '    vec3 samplePos = position + sampleOffset;',
      '    vec3 sampleNorm = normalize(samplePos);',
      '    vec3 noisePos = vec3(samplePos.x * uNoiseFrequency + uTime * uAnimationSpeed, samplePos.y * uNoiseFrequency, samplePos.z * uNoiseFrequency);',
      '    vec3 displaced = samplePos + sampleNorm * snoise(noisePos) * uNoiseStrength;',
      '    avgNormal += displaced;',
      '  }',
      '  ',
      '  avgNormal = avgNormal / 6.0;',
      '  vec3 centerDisplaced = position + objectNormal * snoise(vec3(position.x * uNoiseFrequency + uTime * uAnimationSpeed, position.y * uNoiseFrequency, position.z * uNoiseFrequency)) * uNoiseStrength;',
      '  displacedNormal = normalize(centerDisplaced - (avgNormal - position));',
      '  ',
      '  // Blend with original normal for stability',
      '  displacedNormal = normalize(mix(objectNormal, displacedNormal, 0.7));',
      '}',
      'vDisplacedNormal = normalize((modelMatrix * vec4(displacedNormal, 0.0)).xyz);'
    ].join('\n')

    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      ['#include <project_vertex>', displacedNormalCode].join('\n')
    )

    // Fragment shader modifications (use same varyingsCode to avoid redefinition)
    shader.fragmentShader = uniformsCode + varyingsCode + shaderFunctions + '\n' + shader.fragmentShader

    const fragmentPresetCode = fragmentShaderPresets[controls.fragmentPreset] || fragmentShaderPresets.default

    if (fragmentPresetCode.trim()) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        ['#include <color_fragment>', fragmentPresetCode].join('\n')
      )
    }

    if (materialRef.current) {
      materialRef.current.userData.shader = shader
    }
  }

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 512, 512]} />
      <meshPhysicalMaterial
        key={materialKey}
        ref={materialRef}
        color={controls.color}
        metalness={controls.metalness}
        roughness={controls.roughness}
        envMapIntensity={controls.envMapIntensity}
        clearcoat={controls.clearcoat}
        clearcoatRoughness={controls.clearcoatRoughness}
        transmission={controls.transmission}
        thickness={controls.thickness}
        ior={controls.ior}
        sheen={controls.sheen}
        sheenRoughness={controls.sheenRoughness}
        sheenColor={controls.sheenColor}
        iridescence={controls.iridescence}
        iridescenceIOR={controls.iridescenceIOR}
        iridescenceThicknessRange={[0, controls.iridescenceThickness]}
        onBeforeCompile={onBeforeCompile}
      />
    </mesh>
  )
}

export default NoisySphere

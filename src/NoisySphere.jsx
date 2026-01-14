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

  const controls = useControls('Sphere', {
    preset: {
      value: 'classic',
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
      value: 'default',
      options: {
        'Default': 'default',
        'Fresnel Rim': 'fresnel_rim',
        'Fresnel Glow': 'fresnel_glow',
        'Animated Fresnel': 'fresnel_animated',
        'Iridescent': 'iridescent',
        'Holographic': 'holographic',
        'Pearlescent': 'pearlescent',
        'Chromatic': 'chromatic'
      },
      label: 'Surface Effect'
    },
    fresnelIntensity: { value: 0.8, min: 0, max: 2, step: 0.01, label: 'Rim Intensity' },
    fresnelColor: { value: '#4db8ff', label: 'Rim Color' },
    noiseStrength: { value: 0.3, min: 0, max: 1, step: 0.01, label: 'Noise Strength' },
    noiseFrequency: { value: 1.5, min: 0.1, max: 5, step: 0.1, label: 'Noise Frequency' },
    animationSpeed: { value: 0.3, min: 0, max: 2, step: 0.1, label: 'Animation Speed' },
    color: { value: '#4a9eff', label: 'Color' },
    metalness: { value: 0.6, min: 0, max: 1, step: 0.01, label: 'Metalness' },
    roughness: { value: 0.2, min: 0, max: 1, step: 0.01, label: 'Roughness' },
    envMapIntensity: { value: 1.3, min: 0, max: 3, step: 0.1, label: 'Environment' }
  })

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNoiseStrength: { value: controls.noiseStrength },
      uNoiseFrequency: { value: controls.noiseFrequency },
      uAnimationSpeed: { value: controls.animationSpeed },
      uFresnelIntensity: { value: controls.fresnelIntensity },
      uFresnelColor: { value: new THREE.Color(controls.fresnelColor) }
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
    }
  })

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime
    shader.uniforms.uNoiseStrength = uniforms.uNoiseStrength
    shader.uniforms.uNoiseFrequency = uniforms.uNoiseFrequency
    shader.uniforms.uAnimationSpeed = uniforms.uAnimationSpeed
    shader.uniforms.uFresnelIntensity = uniforms.uFresnelIntensity
    shader.uniforms.uFresnelColor = uniforms.uFresnelColor

    const uniformsCode = [
      'uniform float uTime;',
      'uniform float uNoiseStrength;',
      'uniform float uNoiseFrequency;',
      'uniform float uAnimationSpeed;',
      'uniform float uFresnelIntensity;',
      'uniform vec3 uFresnelColor;',
      ''
    ].join('\n')

    const varyingsCode = [
      'varying vec3 vWorldPosition;',
      ''
    ].join('\n')

    shader.vertexShader = uniformsCode + varyingsCode + shaderFunctions + '\n' + shader.vertexShader

    const presetCode = shaderPresets[controls.preset] || shaderPresets.classic

    const transformCode = [
      'vec3 pos = vec3(position);',
      'float noiseFreq = uNoiseFrequency;',
      'float noiseAmp = uNoiseStrength;',
      presetCode,
      'vec3 transformed = pos;',
      'vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;'
    ].join('\n')

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      transformCode
    )

    // Fragment shader modifications
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
      <meshStandardMaterial
        key={materialKey}
        ref={materialRef}
        color={controls.color}
        metalness={controls.metalness}
        roughness={controls.roughness}
        envMapIntensity={controls.envMapIntensity}
        onBeforeCompile={onBeforeCompile}
      />
    </mesh>
  )
}

export default NoisySphere

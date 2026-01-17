import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { createHydraInstance, executeHydraCode } from './HydraManager'
import { initializeAudio, cleanupAudio } from './AudioManager'

function HydraPostFX({ mountRef, code, onError, audioDeviceId }) {
  const { gl, size, scene, camera } = useThree()
  const hydraRef = useRef(null)
  const canvasRef = useRef(null)
  const captureRendererRef = useRef(null)
  const captureCanvasRef = useRef(null)

  useEffect(() => {
    if (!mountRef?.current || !gl?.domElement || hydraRef.current) return

    const outputCanvas = document.createElement('canvas')
    outputCanvas.style.width = '100%'
    outputCanvas.style.height = '100%'
    outputCanvas.style.display = 'block'
    outputCanvas.style.position = 'absolute'
    outputCanvas.style.inset = '0'
    outputCanvas.width = size.width
    outputCanvas.height = size.height

    mountRef.current.appendChild(outputCanvas)
    canvasRef.current = outputCanvas

    const captureCanvas = document.createElement('canvas')
    captureCanvas.width = size.width
    captureCanvas.height = size.height
    captureCanvasRef.current = captureCanvas

    const captureRenderer = new THREE.WebGLRenderer({
      canvas: captureCanvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    })
    captureRenderer.setPixelRatio(gl.getPixelRatio?.() || window.devicePixelRatio || 1)
    captureRenderer.setSize(size.width, size.height, false)
    captureRendererRef.current = captureRenderer

    hydraRef.current = createHydraInstance(outputCanvas, {
      width: size.width,
      height: size.height,
      detectAudio: false, // We handle audio manually
    })

    // Initialize audio fft array so presets don't error before device is selected
    hydraRef.current.synth.a = hydraRef.current.synth.a || {}
    hydraRef.current.synth.a.fft = [0, 0, 0, 0]

    // Feed the sphere-only render into Hydra
    hydraRef.current.synth.s0.init({ src: captureCanvas })

    const result = executeHydraCode(hydraRef.current, code)
    if (!result.success && onError) {
      onError(result.error)
    }

    return () => {
      cleanupAudio()
      try {
        hydraRef.current?.synth?.hush()
      } catch {
        // Ignore cleanup errors
      }
      if (captureRendererRef.current) {
        captureRendererRef.current.dispose()
      }
      if (mountRef.current?.contains(outputCanvas)) {
        mountRef.current.removeChild(outputCanvas)
      }
      canvasRef.current = null
      hydraRef.current = null
      captureRendererRef.current = null
      captureCanvasRef.current = null
    }
  }, [mountRef, gl, size.width, size.height])

  // Initialize audio when device changes
  useEffect(() => {
    if (!hydraRef.current || !audioDeviceId) return

    initializeAudio(audioDeviceId, hydraRef.current.synth.a)
      .then(result => {
        if (!result.success) {
          console.error('Failed to initialize audio:', result.error)
        }
      })
  }, [audioDeviceId])

  useFrame(() => {
    const renderer = captureRendererRef.current
    if (!renderer) return

    const previousBackground = scene.background
    const previousMask = camera.layers.mask
    const clearColor = new THREE.Color()
    renderer.getClearColor(clearColor)
    const clearAlpha = renderer.getClearAlpha()

    camera.layers.set(1)
    scene.background = null
    renderer.setClearColor(0x000000, 0)
    renderer.render(scene, camera)

    scene.background = previousBackground
    camera.layers.mask = previousMask
    renderer.setClearColor(clearColor, clearAlpha)
  }, 1)

  useEffect(() => {
    if (!hydraRef.current || !code) return
    const result = executeHydraCode(hydraRef.current, code)
    if (!result.success && onError) {
      onError(result.error)
    } else if (onError) {
      onError(null)
    }
  }, [code, onError])

  useEffect(() => {
    if (!hydraRef.current || !canvasRef.current) return
    canvasRef.current.width = size.width
    canvasRef.current.height = size.height
    if (captureRendererRef.current) {
      captureRendererRef.current.setSize(size.width, size.height, false)
    }
    if (hydraRef.current?.synth?.setResolution) {
      hydraRef.current.synth.setResolution(size.width, size.height)
    }
  }, [size.width, size.height])

  return null
}

export default HydraPostFX


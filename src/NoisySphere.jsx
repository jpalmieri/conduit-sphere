import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useControls } from 'leva'

const noiseShader = `
  // Simplex 3D Noise
  // https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
  }
`

function NoisySphere() {
  const meshRef = useRef()
  const materialRef = useRef()

  const controls = useControls('Sphere', {
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
      uAnimationSpeed: { value: controls.animationSpeed }
    }),
    []
  )

  useFrame((state) => {
    if (materialRef.current?.userData?.shader) {
      const shader = materialRef.current.userData.shader
      shader.uniforms.uTime.value = state.clock.elapsedTime
      shader.uniforms.uNoiseStrength.value = controls.noiseStrength
      shader.uniforms.uNoiseFrequency.value = controls.noiseFrequency
      shader.uniforms.uAnimationSpeed.value = controls.animationSpeed
    }
  })

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime
    shader.uniforms.uNoiseStrength = uniforms.uNoiseStrength
    shader.uniforms.uNoiseFrequency = uniforms.uNoiseFrequency
    shader.uniforms.uAnimationSpeed = uniforms.uAnimationSpeed

    shader.vertexShader = `
      uniform float uTime;
      uniform float uNoiseStrength;
      uniform float uNoiseFrequency;
      uniform float uAnimationSpeed;
      ${noiseShader}
      ${shader.vertexShader}
    `

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      vec3 transformed = vec3(position);
      float noiseFreq = uNoiseFrequency;
      float noiseAmp = uNoiseStrength;
      vec3 noisePos = vec3(transformed.x * noiseFreq + uTime * uAnimationSpeed, transformed.y * noiseFreq, transformed.z * noiseFreq);
      transformed += normal * snoise(noisePos) * noiseAmp;
      `
    )

    materialRef.current.userData.shader = shader
  }

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 128, 128]} />
      <meshStandardMaterial
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

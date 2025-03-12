"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Mesh } from "three"

export default function SimpleOrange() {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas>
        <color attach="background" args={["#121212"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrangeModel />
      </Canvas>
    </div>
  )
}

function OrangeModel() {
  const meshRef = useRef<Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshStandardMaterial color="#FF5500" />
    </mesh>
  )
}


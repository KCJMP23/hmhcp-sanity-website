"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import dynamic from "next/dynamic"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { 
  Environment, 
  OrbitControls, 
  Float, 
  Text, 
  PerspectiveCamera,
  Preload,
  AdaptiveDpr,
  AdaptiveEvents,
  PerformanceMonitor
} from "@react-three/drei"
import { motion } from "framer-motion"
import * as THREE from "three"

// LOD (Level of Detail) optimized platform component
function PlatformLOD({ position, color, name, isSelected, onClick }: {
  position: [number, number, number]
  color: string
  name: string
  isSelected: boolean
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const [lod, setLod] = useState(2) // 0 = low, 1 = medium, 2 = high
  
  useFrame(() => {
    if (!meshRef.current) return
    
    // Calculate distance from camera
    const distance = camera.position.distanceTo(meshRef.current.position)
    
    // Set LOD based on distance
    if (distance > 10) {
      setLod(0) // Low quality
    } else if (distance > 5) {
      setLod(1) // Medium quality
    } else {
      setLod(2) // High quality
    }
  })

  return (
    <Float 
      speed={lod > 0 ? 2 : 0} // Disable animation at low LOD
      rotationIntensity={lod > 0 ? 0.2 : 0} 
      floatIntensity={lod > 0 ? 0.5 : 0} 
      enabled={lod > 0}
    >
      <mesh 
        ref={meshRef}
        position={position} 
        onClick={onClick} 
        scale={isSelected ? 1.2 : 1}
      >
        <boxGeometry args={[1.5, 1.5, 1.5, lod === 0 ? 1 : lod === 1 ? 2 : 4]} />
        <meshStandardMaterial 
          color={color} 
          metalness={lod > 0 ? 0.8 : 0.5} 
          roughness={lod > 0 ? 0.2 : 0.5}
          wireframe={lod === 0}
        />
      </mesh>

      {lod > 0 && (
        <Text
          position={[position[0], position[1] - 1.5, position[2]]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
      )}
    </Float>
  )
}

function Platform3dSceneOptimized({ selectedPlatform, onSelect }: {
  selectedPlatform: string | null
  onSelect: (id: string) => void
}) {
  const [dpr, setDpr] = useState(1)
  const [performance, setPerformance] = useState(1)
  
  const platforms: Array<{
    id: string
    name: string
    position: [number, number, number]
    color: string
  }> = [
    {
      id: "intellic",
      name: "IntelliC",
      position: [-2, 0, 0],
      color: "#3B82F6",
    },
    {
      id: "precognitive-health",
      name: "Precognitive Health",
      position: [2, 0, 0],
      color: "#6366F1",
    },
    {
      id: "wear-api",
      name: "Wear API",
      position: [-2, 0, 3],
      color: "#3B82F6",
    },
    {
      id: "peregrine-medical-press",
      name: "Peregrine Medical Press",
      position: [2, 0, 3],
      color: "#EC4899",
    },
  ]

  return (
    <>
      {/* Performance monitoring - adjust quality based on FPS */}
      <PerformanceMonitor
        onIncline={() => {
          setDpr(Math.min(2, dpr + 0.5))
          setPerformance(Math.min(1, performance + 0.1))
        }}
        onDecline={() => {
          setDpr(Math.max(0.5, dpr - 0.5))
          setPerformance(Math.max(0.5, performance - 0.1))
        }}
      />
      
      {/* Adaptive DPR for resolution scaling */}
      <AdaptiveDpr pixelated />
      
      {/* Adaptive events for interaction optimization */}
      <AdaptiveEvents />
      
      {/* Optimized lighting */}
      <ambientLight intensity={0.5 * performance} />
      {performance > 0.7 && <pointLight position={[10, 10, 10]} intensity={0.8} />}

      {/* Environment only on high performance */}
      {performance > 0.8 && <Environment preset="city" />}

      {/* Platform models with LOD */}
      {platforms.map((platform) => (
        <PlatformLOD
          key={platform.id}
          position={platform.position}
          color={platform.color}
          name={platform.name}
          isSelected={selectedPlatform === platform.id}
          onClick={() => onSelect(platform.id)}
        />
      ))}

      {/* Optimized controls */}
      <OrbitControls
        enableDamping={performance > 0.5}
        dampingFactor={0.05}
        enablePan={false}
        minDistance={3}
        maxDistance={15}
        makeDefault
      />

      <PerspectiveCamera
        makeDefault
        position={[0, 4, 8]}
        fov={60}
      />
      
      {/* Preload all assets */}
      <Preload all />
    </>
  )
}

export default function Platform3dModelOptimized() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-[500px] bg-gray-100 animate-pulse rounded-2xl" />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full h-[500px] relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      }>
        <Canvas
          dpr={[0.5, 2]} // Start with lower DPR, scale up if performance allows
          performance={{ min: 0.5 }}
          shadows={false} // Disable shadows for better performance
          gl={{ 
            antialias: false, // Disable antialiasing for better performance
            alpha: true,
            powerPreference: "high-performance"
          }}
        >
          <Platform3dSceneOptimized
            selectedPlatform={selectedPlatform}
            onSelect={setSelectedPlatform}
          />
        </Canvas>
      </Suspense>
    </motion.div>
  )
}
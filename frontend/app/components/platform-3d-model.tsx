"use client"

import { useState, useEffect } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { Environment, OrbitControls, Float, Text, PerspectiveCamera } from "@react-three/drei"
import { motion } from "framer-motion"

function Platform({ position, color, name, isSelected, onClick }: {
  position: [number, number, number]
  color: string
  name: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} enabled={true}>
      <mesh position={position} onClick={onClick} scale={isSelected ? 1.2 : 1}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>

      <Text
        position={[position[0], position[1] - 1.5, position[2]]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Geist-Regular.ttf"
      >
        {name}
      </Text>
    </Float>
  )
}

function Platform3dScene({ selectedPlatform, onSelect }: {
  selectedPlatform: string | null
  onSelect: (id: string) => void
}) {
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

  const { camera } = useThree()

  useEffect(() => {
    if (selectedPlatform) {
      const platform = platforms.find((p) => p.id === selectedPlatform)
      if (platform) {
        // Animate camera to focus on selected platform
        const targetPosition = [...platform.position]
        targetPosition[1] = 1.5
        targetPosition[2] = platform.position[2] - 3

        camera.position.set(targetPosition[0], targetPosition[1], targetPosition[2])
      }
    } else {
      // Reset camera to overview position
      camera.position.set(0, 4, 8)
    }
  }, [selectedPlatform, camera, platforms])

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />

      <Environment preset="city" />

      {/* Platform models */}
      {platforms.map((platform) => (
        <Platform
          key={platform.id}
          position={platform.position}
          color={platform.color}
          name={platform.name}
          isSelected={selectedPlatform === platform.id}
          onClick={() => onSelect(platform.id)}
        />
      ))}

      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={15}
        enabled={selectedPlatform === null}
      />
    </>
  )
}

export function Platform3DModel() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-[500px] overflow-hidden shadow-xl"
    >
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={50} />
        <Platform3dScene
          selectedPlatform={selectedPlatform}
          onSelect={(id) => setSelectedPlatform(id === selectedPlatform ? null : id)}
        />
      </Canvas>

      {selectedPlatform && (
        <div className="absolute bottom-4 right-4">
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-4 py-2 bg-blue-600 text-white shadow-lg"
            onClick={() => setSelectedPlatform(null)}
          >
            Back to Overview
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}

export default Platform3DModel

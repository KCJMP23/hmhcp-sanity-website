'use client'

import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, Box, Sphere, Text, Float, Line } from '@react-three/drei'
import { TextureLoader } from 'three'
import * as THREE from 'three'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Maximize2, Minimize2, RotateCw } from 'lucide-react'

// Platform node component
function PlatformNode({ position, color, label, onClick, isActive }: {
  position: [number, number, number]
  color: string
  label: string
  onClick: () => void
  isActive: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
      if (hovered || isActive) {
        meshRef.current.scale.setScalar(1.2)
      } else {
        meshRef.current.scale.setScalar(1)
      }
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position}>
        <Box
          ref={meshRef}
          args={[1, 1, 1]}
          onClick={onClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <meshStandardMaterial 
            color={hovered || isActive ? '#3b82f6' : color} 
            emissive={hovered || isActive ? '#1e40af' : '#000000'}
            emissiveIntensity={hovered || isActive ? 0.5 : 0}
          />
        </Box>
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </group>
    </Float>
  )
}

// Connection line component
function ConnectionLine({ start, end }: {
  start: [number, number, number]
  end: [number, number, number]
}) {
  const points = [start, end]

  return (
    <Line 
      points={points}
      color="#64748b"
      lineWidth={1}
      opacity={0.5}
      transparent
    />
  )
}

// Main 3D scene component
function PlatformScene({ selectedPlatform, onSelectPlatform }: {
  selectedPlatform: string | null
  onSelectPlatform: (platform: string) => void
}) {
  const platforms = [
    { id: 'intellic-edc', label: 'INTELLIC EDC', position: [-3, 0, 0] as [number, number, number], color: '#22c55e' },
    { id: 'mybc-health', label: 'MyBC Health', position: [3, 0, 0] as [number, number, number], color: '#a855f7' },
    { id: 'central-hub', label: 'Central Hub', position: [0, 2, 0] as [number, number, number], color: '#3B82F6' },
    { id: 'analytics', label: 'Analytics', position: [0, -2, 0] as [number, number, number], color: '#ef4444' },
  ]

  const connections = [
    { start: [-3, 0, 0] as [number, number, number], end: [0, 2, 0] as [number, number, number] },
    { start: [3, 0, 0] as [number, number, number], end: [0, 2, 0] as [number, number, number] },
    { start: [0, 2, 0] as [number, number, number], end: [0, -2, 0] as [number, number, number] },
    { start: [-3, 0, 0] as [number, number, number], end: [0, -2, 0] as [number, number, number] },
    { start: [3, 0, 0] as [number, number, number], end: [0, -2, 0] as [number, number, number] },
  ]

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* Platform nodes */}
      {platforms.map((platform) => (
        <PlatformNode
          key={platform.id}
          position={platform.position}
          color={platform.color}
          label={platform.label}
          onClick={() => onSelectPlatform(platform.id)}
          isActive={selectedPlatform === platform.id}
        />
      ))}
      
      {/* Connection lines */}
      {connections.map((conn, index) => (
        <ConnectionLine key={index} start={conn.start} end={conn.end} />
      ))}
      
      {/* Central sphere */}
      <Sphere args={[0.3]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#3b82f6" emissive="#1e40af" emissiveIntensity={0.5} />
      </Sphere>
      
      <OrbitControls enablePan={false} maxDistance={10} minDistance={3} />
      <PerspectiveCamera makeDefault position={[5, 5, 5]} />
      <Environment preset="city" />
    </>
  )
}

// Loading component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

// Main visualization component
export function Visualization3D() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)

  const platformDetails = {
    'intellic-edc': {
      title: 'INTELLIC EDC Platform',
      description: 'Electronic Data Capture system for clinical trials',
      features: ['Real-time data collection', 'FDA 21 CFR Part 11 compliant', 'Advanced analytics'],
      status: 'Active'
    },
    'mybc-health': {
      title: 'MyBC Health Platform',
      description: 'Patient engagement and health monitoring platform',
      features: ['Patient portal', 'Remote monitoring', 'Health tracking'],
      status: 'Active'
    },
    'central-hub': {
      title: 'Central Data Hub',
      description: 'Unified data management and integration center',
      features: ['Data aggregation', 'API gateway', 'Real-time sync'],
      status: 'Active'
    },
    'analytics': {
      title: 'Analytics Engine',
      description: 'Advanced analytics and reporting platform',
      features: ['Machine learning', 'Predictive analytics', 'Custom dashboards'],
      status: 'Beta'
    }
  }

  const details = selectedPlatform ? platformDetails[selectedPlatform as keyof typeof platformDetails] : null

  return (
    <Card className={cn("overflow-hidden", isFullscreen && "fixed inset-4 z-50")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Healthcare Platform Ecosystem</CardTitle>
            <CardDescription>
              Interactive 3D visualization of our integrated platform architecture
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? "Stop rotation" : "Start rotation"}
            >
              <RotateCw className={cn("h-4 w-4", autoRotate && "animate-spin")} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* 3D Canvas */}
          <div className="lg:col-span-2 h-[400px] lg:h-[500px] bg-gradient-to-br from-gray-900 to-gray-800">
            <Suspense fallback={<LoadingFallback />}>
              <Canvas>
                <PlatformScene
                  selectedPlatform={selectedPlatform}
                  onSelectPlatform={setSelectedPlatform}
                />
                {autoRotate && <OrbitControls autoRotate autoRotateSpeed={0.5} />}
              </Canvas>
            </Suspense>
          </div>

          {/* Platform Details */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900">
            {details ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{details.title}</h3>
                  <Badge className="mt-1" variant={details.status === 'Active' ? 'default' : 'secondary'}>
                    {details.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{details.description}</p>
                <div>
                  <h4 className="font-medium mb-2">Key Features</h4>
                  <ul className="space-y-1">
                    {details.features.map((feature, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-primary mt-1.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full" size="sm">
                  Learn More
                </Button>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="mb-2">Click on a platform node to view details</p>
                <p className="text-sm">Use mouse to rotate and zoom the visualization</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function for className
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, MeshWobbleMaterial, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function NeuralSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.15;
      meshRef.current.rotation.z = time * 0.1;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y = -time * 0.1;
    }
  });

  const particles = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);
      const distance = 2.5 + Math.random() * 0.5;
      
      positions[i * 3] = distance * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = distance * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = distance * Math.cos(theta);
    }
    return positions;
  }, []);

  return (
    <group>
      {/* Outer Glow Sphere */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere ref={meshRef} args={[2.2, 64, 64]}>
          <MeshDistortMaterial
            color="#ffffff"
            attach="material"
            distort={0.3}
            speed={2}
            roughness={0}
            metalness={1}
            transmission={0.95}
            thickness={2}
            opacity={0.1}
            transparent
          />
        </Sphere>
      </Float>

      {/* Core Volumetric Pulse */}
      <Sphere args={[1.5, 32, 32]}>
        <MeshWobbleMaterial
          color="#ffffff"
          factor={0.4}
          speed={4}
          opacity={0.05}
          transparent
          wireframe
        />
      </Sphere>

      {/* Particle Cloud */}
      <Points ref={pointsRef} positions={particles}>
        <PointMaterial
          transparent
          color="#ffffff"
          size={0.02}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.4}
        />
      </Points>
    </group>
  );
}

export function MissionControlHUD() {
  return (
    <div className="w-full h-[500px] relative">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ffffff" />
        <NeuralSphere />
      </Canvas>
      
      {/* HUD Scanned Lines Overlay */}
      <div className="absolute inset-0 pointer-events-none architecture-grid opacity-10" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-transparent to-black/10" />
    </div>
  );
}

import React, { useRef, useLayoutEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances, Trail } from '@react-three/drei';
import * as THREE from 'three';

// --- Types ---
export type EffectType = 'fire' | 'lightning' | 'slime' | 'magic';

interface ExplosionProps {
  position: [number, number, number];
  color: string;
  type: EffectType;
  onComplete: () => void;
}

// --- Fire / Ash Effect ---
const FireExplosion: React.FC<{ position: [number, number, number]; color: string; onComplete: () => void }> = ({ position, color, onComplete }) => {
  const count = 40;
  const group = useRef<THREE.Group>(null);
  const [particles] = useState(() => 
    Array.from({ length: count }).map(() => ({
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 4
      ),
      scale: Math.random() * 0.3 + 0.1,
      life: 1.0 + Math.random() * 0.5
    }))
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    let active = false;
    
    group.current.children.forEach((child, i) => {
      const p = particles[i];
      if (p.life > 0) {
        active = true;
        p.life -= delta * 1.5;
        p.velocity.y += 2 * delta; // Rise up like smoke
        p.position.add(p.velocity.clone().multiplyScalar(delta));
        
        child.position.copy(p.position);
        child.scale.setScalar(p.scale * p.life);
        (child as THREE.Mesh).rotation.x += delta;
        (child as THREE.Mesh).rotation.z += delta;
      } else {
        child.scale.setScalar(0);
      }
    });

    if (!active) onComplete();
  });

  return (
    <group ref={group} position={position}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={color === '#e0e0e0' ? '#ffaa00' : '#550000'} emissive={color === '#e0e0e0' ? '#ff4400' : '#220000'} emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
};

// --- Lightning Effect ---
const LightningStrike: React.FC<{ position: [number, number, number]; onComplete: () => void }> = ({ position, onComplete }) => {
  const [timer, setTimer] = useState(0.5);
  
  useFrame((state, delta) => {
    setTimer(t => t - delta);
    if (timer <= 0) onComplete();
  });

  if (timer <= 0) return null;

  const points = [];
  let currentY = 10;
  const startX = position[0];
  const startZ = position[2];
  
  points.push(new THREE.Vector3(startX, currentY, startZ));
  while (currentY > 0) {
    currentY -= Math.random() * 2;
    points.push(new THREE.Vector3(
      startX + (Math.random() - 0.5) * 2,
      Math.max(0, currentY),
      startZ + (Math.random() - 0.5) * 2
    ));
  }

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#00ffff" linewidth={3} />
    </line>
  );
};

// --- Slime Effect ---
const SlimePuddle: React.FC<{ position: [number, number, number]; color: string; onComplete: () => void }> = ({ position, color, onComplete }) => {
  const mesh = useRef<THREE.Mesh>(null);
  const [life, setLife] = useState(1.0);

  useFrame((state, delta) => {
    if (life > 0) {
      setLife(l => l - delta * 0.5);
      if (mesh.current) {
        mesh.current.scale.set(1 + (1-life)*2, life, 1 + (1-life)*2);
        mesh.current.position.y = life * 0.5;
      }
    } else {
      onComplete();
    }
  });

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#00ff00" transparent opacity={0.8} roughness={0.1} metalness={0.8} />
    </mesh>
  );
};

// --- Main Component ---
export const MagicExplosion: React.FC<ExplosionProps> = (props) => {
  switch (props.type) {
    case 'fire': return <FireExplosion {...props} />;
    case 'lightning': return <LightningStrike {...props} />;
    case 'slime': return <SlimePuddle {...props} />;
    default: return <FireExplosion {...props} />;
  }
};

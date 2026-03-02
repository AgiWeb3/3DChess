import React, { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DestructionParticlesProps {
  position: [number, number, number];
  color: string;
  onComplete: () => void;
}

export const DestructionParticles: React.FC<DestructionParticlesProps> = ({ position, color, onComplete }) => {
  const count = 50;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  const particles = useRef<{ position: THREE.Vector3, velocity: THREE.Vector3, scale: number }[]>([]);

  useLayoutEffect(() => {
    if (mesh.current) {
      for (let i = 0; i < count; i++) {
        const particle = {
          position: new THREE.Vector3(position[0], position[1], position[2]),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            Math.random() * 5,
            (Math.random() - 0.5) * 5
          ),
          scale: Math.random() * 0.2 + 0.1
        };
        particles.current.push(particle);
        dummy.position.copy(particle.position);
        dummy.scale.setScalar(particle.scale);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
      }
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  }, [position]);

  useFrame((state, delta) => {
    if (mesh.current) {
      let activeCount = 0;
      particles.current.forEach((particle, i) => {
        particle.velocity.y -= 9.8 * delta; // Gravity
        particle.position.add(particle.velocity.clone().multiplyScalar(delta));
        
        // Floor collision
        if (particle.position.y < 0) {
          particle.velocity.y *= -0.5;
          particle.position.y = 0;
        }

        particle.scale -= delta * 0.5; // Shrink
        if (particle.scale > 0) {
          activeCount++;
          dummy.position.copy(particle.position);
          dummy.scale.setScalar(particle.scale);
          dummy.updateMatrix();
          mesh.current!.setMatrixAt(i, dummy.matrix);
        } else {
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          mesh.current!.setMatrixAt(i, dummy.matrix);
        }
      });
      mesh.current.instanceMatrix.needsUpdate = true;
      
      if (activeCount === 0) {
        onComplete();
      }
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </instancedMesh>
  );
};

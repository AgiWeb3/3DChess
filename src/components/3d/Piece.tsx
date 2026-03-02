import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Trail } from '@react-three/drei';
import * as THREE from 'three';

interface PieceProps {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  position: [number, number, number];
  onClick?: () => void;
  isSelected?: boolean;
  animateFrom?: [number, number, number] | null;
}

export const Piece: React.FC<PieceProps> = ({ type, color, position, onClick, isSelected, animateFrom }) => {
  const group = useRef<THREE.Group>(null);
  const [animating, setAnimating] = useState(false);
  const animationProgress = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3(...position));
  const prevAnimateFromRef = useRef<string | null>(null);

  const colorHex = color === 'w' ? '#e0e0e0' : '#333333';
  const emissive = isSelected ? '#ffaa00' : '#000000';
  
  useEffect(() => {
    // Update target position
    endPos.current.set(...position);
    
    const animateFromStr = animateFrom ? JSON.stringify(animateFrom) : null;

    // Only start animation if the source position changes (and exists)
    if (animateFrom && animateFromStr !== prevAnimateFromRef.current) {
      prevAnimateFromRef.current = animateFromStr;
      
      startPos.current.set(...animateFrom);
      animationProgress.current = 0;
      setAnimating(true);
      
      // Snap to start immediately
      if (group.current) {
        group.current.position.copy(startPos.current);
      }
    } else if (!animateFrom) {
      // If no animation source, ensure we are at the target
      if (group.current && !animating) {
        group.current.position.copy(endPos.current);
      }
    }
  }, [position, animateFrom, animating]);

  useFrame((state, delta) => {
    if (animating && group.current) {
      animationProgress.current += delta * 2; // Speed of animation
      
      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        setAnimating(false);
      }
      
      // Lerp position with arc
      const t = animationProgress.current;
      const currentPos = new THREE.Vector3().lerpVectors(startPos.current, endPos.current, t);
      currentPos.y += Math.sin(t * Math.PI) * 2; // Jump arc
      
      group.current.position.copy(currentPos);
    }
  });

  const getGeometry = () => {
    switch (type) {
      case 'p': return <cylinderGeometry args={[0.3, 0.4, 1, 16]} />;
      case 'r': return <boxGeometry args={[0.6, 1.2, 0.6]} />;
      case 'n': return <coneGeometry args={[0.4, 1.2, 16]} />;
      case 'b': return <capsuleGeometry args={[0.3, 1, 4, 8]} />;
      case 'q': return <dodecahedronGeometry args={[0.5]} />;
      case 'k': return <octahedronGeometry args={[0.5]} />;
      default: return <boxGeometry args={[0.5, 0.5, 0.5]} />;
    }
  };

  return (
    <group>
      <Trail
        width={animating ? 0.4 : 0} // Hide trail when not animating
        length={4}
        color={color === 'w' ? '#00ffff' : '#ff00ff'}
        attenuation={(t) => t * t}
      >
        <group ref={group} position={position} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
          <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
            {getGeometry()}
            <meshStandardMaterial 
              color={colorHex} 
              roughness={0.4} 
              metalness={0.6}
              emissive={emissive}
              emissiveIntensity={0.5}
            />
          </mesh>
          {/* Base */}
          <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.4, 0.45, 0.2, 16]} />
            <meshStandardMaterial color={colorHex} roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Symbol */}
          <Text
            position={[0, 1.5, 0]}
            fontSize={0.5}
            color={isSelected ? "yellow" : "white"}
            anchorX="center"
            anchorY="middle"
          >
            {type.toUpperCase()}
          </Text>
        </group>
      </Trail>
    </group>
  );
};

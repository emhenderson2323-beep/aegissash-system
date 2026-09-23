import { Line, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import * as THREE from 'three';
import { ViewportControls } from './ViewportControls';

const defaultSegments = [
  { start: [-2.8, 0.5, -0.2], end: [-0.8, 0.2, 0.4], tir: false },
  { start: [0.1, -0.6, 0.5], end: [1.3, 0.9, 0.8], tir: true },
  { start: [-1.2, -0.3, -0.1], end: [0.7, 1.0, 0.3], tir: false },
  { start: [1.4, -1.0, -0.5], end: [2.6, 0.4, 0.2], tir: true },
] as const;

function WindowMesh({ showFrame, showCells, showRays }: { showFrame: boolean; showCells: boolean; showRays: boolean }) {
  const frameMaterial = new THREE.MeshStandardMaterial({ color: '#9aa4b2', metalness: 0.5, roughness: 0.3 });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#93c5fd',
    transparent: true,
    opacity: 0.4,
    transmission: 0.8,
    roughness: 0.15,
  });

  return (
    <group>
      {showFrame && (
        <group>
          <mesh position={[0, 0, -0.6]} material={frameMaterial}>
            <boxGeometry args={[6.2, 3.4, 0.16]} />
          </mesh>
          <mesh position={[0, 0, 0.6]} material={frameMaterial}>
            <boxGeometry args={[6.2, 3.4, 0.16]} />
          </mesh>
        </group>
      )}

      <mesh position={[0, 0, 0]} material={glassMaterial}>
        <boxGeometry args={[5.5, 2.9, 0.12]} />
      </mesh>
      <mesh position={[0, 0, 0.2]} material={glassMaterial}>
        <boxGeometry args={[5.5, 2.9, 0.12]} />
      </mesh>

      {showCells && (
        <group position={[0, 0, 0.1]}>
          {Array.from({ length: 8 }).map((_, index) => (
            <mesh key={index} position={[-2.8 + index * 0.8, 0, 0]}>
              <boxGeometry args={[0.5, 2.4, 0.08]} />
              <meshStandardMaterial color={index % 2 === 0 ? '#34d399' : '#fbbf24'} />
            </mesh>
          ))}
        </group>
      )}

      {showRays &&
        defaultSegments.map((segment, index) => (
          <Line
            key={`${segment.start.join('-')}-${index}`}
            points={[segment.start, segment.end]}
            color={segment.tir ? '#f56565' : '#60a5fa'}
            lineWidth={2}
          />
        ))}
    </group>
  );
}

export function Window3DCanvas() {
  const [showFrame, setShowFrame] = useState(true);
  const [showCells, setShowCells] = useState(true);
  const [showRays, setShowRays] = useState(true);

  return (
    <div className="canvas-frame">
      <ViewportControls
        showFrame={showFrame}
        showCells={showCells}
        showRays={showRays}
        onToggleFrame={() => setShowFrame((value) => !value)}
        onToggleCells={() => setShowCells((value) => !value)}
        onToggleRays={() => setShowRays((value) => !value)}
      />
      <Canvas camera={{ position: [0, 0, 8], fov: 48 }}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[4, 4, 6]} intensity={1.6} />
        <OrbitControls enablePan enableZoom enableRotate />
        <WindowMesh showFrame={showFrame} showCells={showCells} showRays={showRays} />
      </Canvas>
    </div>
  );
}

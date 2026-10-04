import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text, Html, Float } from '@react-three/drei';
import * as THREE from 'three';

/** Real material optical & appearance data (literature values) */
const MATERIAL = {
  glass: { color: '#e8f4fc', opacity: 0.35, metalness: 0.05, roughness: 0.1, ior: 1.52 },
  zeonex: { color: '#f5f0e6', opacity: 0.55, metalness: 0.0, roughness: 0.15, ior: 1.53 },
  oca: { color: '#fff8e7', opacity: 0.4, metalness: 0.0, roughness: 0.3, ior: 1.48 },
  gaas: { color: '#1a1a2e', opacity: 0.95, metalness: 0.6, roughness: 0.35 },
  frameAl: { color: '#8a9ba8', metalness: 0.85, roughness: 0.25 },
  lowE: { color: '#c0d8e8', opacity: 0.25, metalness: 0.4, roughness: 0.05 },
  coolant: { color: '#4fc3f7', opacity: 0.6 },
};

type LayerSpec = { name: string; thicknessMm: number; mat: keyof typeof MATERIAL | 'glass' | 'zeonex' | 'oca' };

function buildLayers(coreMm: number): LayerSpec[] {
  return [
    { name: 'Outer glass (low-E)', thicknessMm: 2.0, mat: 'lowE' },
    { name: 'OCA upper', thicknessMm: 0.5, mat: 'oca' },
    { name: 'LSC core (Zeonex + Lumogen)', thicknessMm: coreMm, mat: 'zeonex' },
    { name: 'OCA lower', thicknessMm: 0.5, mat: 'oca' },
    { name: 'Inner glass', thicknessMm: 2.0, mat: 'glass' },
  ];
}

function GlassStack({ coreMm = 4, explode = 0, showLabels = true }: { coreMm?: number; explode?: number; showLabels?: boolean }) {
  const layers = useMemo(() => buildLayers(coreMm), [coreMm]);
  let z = 0;
  const items = layers.map((L, i) => {
    const h = L.thicknessMm / 1000;
    const y = z + h / 2 + explode * i * 0.015;
    z += h + explode * 0.015;
    const m = MATERIAL[L.mat as keyof typeof MATERIAL] || MATERIAL.glass;
    return (
      <group key={L.name} position={[0, y * 40, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.9, Math.max(0.008, h * 40), 1.5]} />
          <meshPhysicalMaterial
            color={m.color}
            transparent
            opacity={m.opacity}
            metalness={m.metalness ?? 0}
            roughness={m.roughness ?? 0.2}
            transmission={L.mat.includes('glass') || L.mat === 'zeonex' ? 0.85 : 0.3}
            thickness={0.5}
            ior={(m as any).ior ?? 1.5}
            envMapIntensity={1.2}
          />
        </mesh>
        {showLabels && (
          <Html position={[0.55, 0, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(10,20,35,0.85)', color: '#9ecbff', fontSize: 11, padding: '2px 6px',
              borderRadius: 4, whiteSpace: 'nowrap', border: '1px solid #2a4a6a', fontFamily: 'system-ui'
            }}>
              {L.name} · {L.thicknessMm} mm
            </div>
          </Html>
        )}
      </group>
    );
  });
  return <group position={[0, -0.08, 0]}>{items}</group>;
}

function EdgePVCells({ show = true }: { show?: boolean }) {
  if (!show) return null;
  const cells = [];
  for (let i = 0; i < 8; i++) {
    const y = -0.55 + i * 0.14;
    cells.push(
      <mesh key={i} position={[-0.48, y, 0]} castShadow>
        <boxGeometry args={[0.04, 0.12, 1.45]} />
        <meshStandardMaterial color={MATERIAL.gaas.color} metalness={0.7} roughness={0.3} />
      </mesh>
    );
  }
  return <group>{cells}</group>;
}

function Frame({ show = true }: { show?: boolean }) {
  if (!show) return null;
  const mat = <meshStandardMaterial color={MATERIAL.frameAl.color} metalness={0.85} roughness={0.25} />;
  return (
    <group>
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.05, 0.06, 1.62]} />{mat}
      </mesh>
      <mesh position={[0, -0.75, 0]} castShadow>
        <boxGeometry args={[1.05, 0.06, 1.62]} />{mat}
      </mesh>
      <mesh position={[-0.52, 0, 0]} castShadow>
        <boxGeometry args={[0.06, 1.44, 1.62]} />{mat}
      </mesh>
      <mesh position={[0.52, 0, 0]} castShadow>
        <boxGeometry args={[0.06, 1.44, 1.62]} />{mat}
      </mesh>
    </group>
  );
}

function SolarRays({ active = true, count = 24 }: { active?: boolean; count?: number }) {
  const group = useRef<THREE.Group>(null);
  const rays = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const x = -0.35 + (i % 6) * 0.14;
      const z = -0.6 + Math.floor(i / 6) * 0.35;
      return { x, z, speed: 0.4 + Math.random() * 0.6, phase: Math.random() * Math.PI * 2 };
    });
  }, [count]);

  useFrame((state) => {
    if (!group.current || !active) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const r = rays[i];
      const y = 1.4 - ((t * r.speed + r.phase) % 2.2);
      child.position.y = y;
      (child as THREE.Mesh).material.opacity = y > 0.6 ? 0.9 : Math.max(0, y / 0.6);
    });
  });

  if (!active) return null;
  return (
    <group ref={group}>
      {rays.map((r, i) => (
        <mesh key={i} position={[r.x, 1.2, r.z]}>
          <cylinderGeometry args={[0.008, 0.004, 0.35, 6]} />
          <meshBasicMaterial color="#ffe082" transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function CoolantFlow({ active = true }: { active?: boolean }) {
  const particles = useRef<THREE.Points>(null);
  const count = 80;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = -0.35 + Math.random() * 0.7;
      arr[i * 3 + 1] = -0.4 + Math.random() * 0.8;
      arr[i * 3 + 2] = -0.05 + Math.random() * 0.1;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!particles.current || !active) return;
    const pos = particles.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += 0.008;
      if (pos[i * 3 + 1] > 0.55) pos[i * 3 + 1] = -0.55;
      pos[i * 3] += Math.sin(t * 2 + i) * 0.001;
    }
    particles.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!active) return null;
  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#4fc3f7" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function AnimatedCamera({ mode }: { mode: 'orbit' | 'cinematic' | 'explode' }) {
  const controls = useRef<any>(null);
  useFrame((state) => {
    if (mode === 'cinematic' && controls.current) {
      const t = state.clock.elapsedTime * 0.15;
      controls.current.setAzimuthalAngle(t);
      controls.current.setPolarAngle(Math.PI / 3 + Math.sin(t * 0.7) * 0.25);
      controls.current.update();
    }
  });
  return (
    <OrbitControls
      ref={controls}
      enablePan
      enableZoom
      minDistance={1.2}
      maxDistance={6}
      maxPolarAngle={Math.PI / 1.6}
      autoRotate={mode === 'cinematic'}
      autoRotateSpeed={0.6}
    />
  );
}

export type ViewportMode = 'interactive' | 'cinematic' | 'explode' | 'assembly';

export function Window3DCanvas({
  coreMm = 4,
  showFrame = true,
  showCells = true,
  showRays = true,
  showCoolant = true,
  mode = 'interactive',
}: {
  coreMm?: number;
  showFrame?: boolean;
  showCells?: boolean;
  showRays?: boolean;
  showCoolant?: boolean;
  mode?: ViewportMode;
}) {
  const explode = mode === 'explode' ? 1 : 0;

  return (
    <div style={{ width: '100%', height: '520px', borderRadius: 12, overflow: 'hidden', background: '#060d18', border: '1px solid #1a3050', position: 'relative' }}>
      <Canvas shadows camera={{ position: [1.8, 1.2, 2.4], fov: 42 }} dpr={[1, 1.75]}>
        <color attach="background" args={['#060d18']} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 6, 3]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#88aaff" />
        <Suspense fallback={null}>
          <Environment preset="city" />
          <GlassStack coreMm={coreMm} explode={explode} showLabels={mode !== 'cinematic'} />
          <Frame show={showFrame} />
          <EdgePVCells show={showCells} />
          <SolarRays active={showRays} />
          <CoolantFlow active={showCoolant} />
          <ContactShadows position={[0, -0.85, 0]} opacity={0.45} scale={4} blur={2.5} />
          {mode === 'assembly' && (
            <Float speed={1.5} floatIntensity={0.3}>
              <Text position={[0, 1.1, 0]} fontSize={0.09} color="#9ecbff" anchorX="center">
                Assembly sequence · real layer order
              </Text>
            </Float>
          )}
        </Suspense>
        <AnimatedCamera mode={mode === 'cinematic' ? 'cinematic' : 'orbit'} />
      </Canvas>
      <div style={{
        position: 'absolute', bottom: 10, left: 12, right: 12, display: 'flex', gap: 8, flexWrap: 'wrap',
        pointerEvents: 'none', fontSize: 11, color: '#8ab4d8', fontFamily: 'system-ui'
      }}>
        <span style={{ background: 'rgba(0,0,0,0.55)', padding: '3px 8px', borderRadius: 4 }}>Real materials · NFRC geometry</span>
        <span style={{ background: 'rgba(0,0,0,0.55)', padding: '3px 8px', borderRadius: 4 }}>GaAs edge cells · Lumogen LSC · Argon cavity</span>
      </div>
    </div>
  );
}

export function ViewportControls({
  showFrame, showCells, showRays, showCoolant,
  onToggleFrame, onToggleCells, onToggleRays, onToggleCoolant,
  mode, onModeChange,
}: {
  showFrame: boolean; showCells: boolean; showRays: boolean; showCoolant: boolean;
  onToggleFrame: () => void; onToggleCells: () => void; onToggleRays: () => void; onToggleCoolant: () => void;
  mode: ViewportMode; onModeChange: (m: ViewportMode) => void;
}) {
  return (
    <div className="viewport-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 8 }}>
      <label><input checked={showFrame} onChange={onToggleFrame} type="checkbox" /> Frame</label>
      <label><input checked={showCells} onChange={onToggleCells} type="checkbox" /> PV cells</label>
      <label><input checked={showRays} onChange={onToggleRays} type="checkbox" /> Solar rays</label>
      <label><input checked={showCoolant} onChange={onToggleCoolant} type="checkbox" /> Coolant flow</label>
      <select value={mode} onChange={(e) => onModeChange(e.target.value as ViewportMode)} style={{ marginLeft: 8 }}>
        <option value="interactive">Interactive (game-like)</option>
        <option value="cinematic">Cinematic video</option>
        <option value="explode">Exploded stack</option>
        <option value="assembly">Assembly view</option>
      </select>
    </div>
  );
}

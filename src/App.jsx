import React from 'react'; // Import React
import { useState, useEffect, useTransition } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, TransformControls, useCursor, Html } from '@react-three/drei';
import { useControls } from 'leva';
import { Selection, Select, EffectComposer, Outline, SelectiveBloom } from '@react-three/postprocessing';
import { SphereGeometry, PlaneGeometry, BoxGeometry, CylinderGeometry } from 'three';
import {  Sparkles, Shadow, ContactShadows, Billboard, Environment, BakeShadows,AccumulativeShadows, RandomizedLight} from '@react-three/drei'
import { LayerMaterial, Depth } from 'lamina'
import create from 'zustand';

const useStore = create((set) => ({
  target: null,
  setTarget: (target) => set({ target }),
  geometries: [], // Added geometries state
  setGeometries: (geometries) => set({ geometries }),
}));

function Env() {
  const [preset, setPreset] = useState('sunset')
  const [inTransition, startTransition] = useTransition()
  const { blur } = useControls({
    blur: { value: 0.65, min: 0, max: 1 },
    preset: {
      value: preset,
      options: ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby'],
      onChange: (value) => startTransition(() => setPreset(value))
    }
  })
  return <Environment preset={preset} background blur={blur} />
}

function GeometrySelector({ geometryType, color, roughness, lights, position, index }) {
  const { target, setTarget, geometries, setGeometries } = useStore(); // Use store
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const updateGeometry = (updatedGeometry) => {
    const updatedGeometries = [...geometries];
    updatedGeometries[index] = updatedGeometry;
    setGeometries(updatedGeometries);
  };

  const handleClick = (e) => {
    const updatedGeometry = { ...geometries[index], color, lights, roughness };
    console.log(`you clicked on mesh, the color is ${color}`);
    updateGeometry(updatedGeometry);
    setTarget(e.object);
  };
  
  let geometry;

  // Determine which geometry to create based on the selected type
  switch (geometryType) {
    case 'sphere':
      geometry = new SphereGeometry();
      break;
    case 'plane':
      geometry = new PlaneGeometry();
      break;
    case 'box':
      geometry = new BoxGeometry();
      break;
    case 'cylinder':
      geometry = new CylinderGeometry();
      break;
    default:
      return null;
  }

  return (
    <Select enabled={hovered}>
      <mesh
        geometry={geometry}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        position={position} // Position of the geometry
        castShadow
      >
        <meshStandardMaterial color={color} roughness={roughness} /> {/* Use roughness here */}

        {/* Add lights based on user configuration */}
        {lights.map((light, index) => {
          switch (light.type) {
            case 'ambient':
              return <ambientLight key={`ambient-light-${index}`} intensity={light.intensity} color={light.color} />;
            case 'spot':
              return <spotLight key={`spot-light-${index}`} intensity={light.intensity} position={light.position} angle={light.angle} />;
            case 'point':
              return <pointLight key={`point-light-${index}`} intensity={light.intensity} position={light.position} />;
            default:
              return null;
          }
        })}
      </mesh>
    </Select>
  );
}

export default function App() {
  const { target, setTarget, geometries, setGeometries } = useStore(); // Use store

  const { mode, geometryType, color, roughness, ambientIntensity, ambientColor, spotIntensity, spotPosition, spotAngle, pointIntensity, pointPosition, positionX, positionY, positionZ } = useControls({
    mode: { value: 'translate', options: ['translate', 'rotate', 'scale'] },
    geometryType: { value: 'box', options: ['sphere', 'plane', 'box', 'cylinder'] },
    color: { value: '#ff0000', label: 'Color' },
    roughness: { value: 1, min: 0, max: 1, label: 'Roughness' },
    ambientIntensity: { value: 1, label: 'Ambient Intensity' },
    ambientColor: { value: '#ffffff', label: 'Ambient Color' },
    spotIntensity: { value: 1, label: 'Spot Intensity' },
    spotPosition: { value: [10, 10, -10], label: 'Spot Position' },
    spotAngle: { value: 0.15, label: 'Spot Angle' },
    pointIntensity: { value: 1, label: 'Point Intensity' },
    pointPosition: { value: [-10, -10, 10], label: 'Point Position' },
    positionX: { value: 2, min: -10, max: 10, label: 'Position X' },
    positionY: { value: 2, min: -10, max: 10, label: 'Position Y' },
    positionZ: { value: 0, min: -10, max: 10, label: 'Position Z' },
  });

  const addGeometry = () => {
    const newGeometry = {
      geometryType,
      color,
      roughness,
      position: [positionX, positionY, positionZ],
      lights: [
        { type: 'ambient', intensity: ambientIntensity, color: ambientColor },
        { type: 'spot', intensity: spotIntensity, position: spotPosition, angle: spotAngle },
        { type: 'point', intensity: pointIntensity, position: pointPosition },
      ],
    };
    setGeometries([...geometries, newGeometry]);
  };

  return (
    <Canvas camera={{ fov: 75, position: [0, 0, 5] }} dpr={[1, 2]} onPointerMissed={() => setTarget(null)} style={{ backgroundColor: "grey" }}>
      <Selection>
  
        <EffectComposer multisampling={1} autoClear={false}>
          <Outline blur visibleEdgeColor="red" edgeStrength={20} width={500} />
          <SelectiveBloom mipmapBlur radius={1} luminanceThreshold={1} intensity={1} />
        </EffectComposer>


        {/* Render all geometries */}
        {geometries.map((geometry, index) => (
          <GeometrySelector key={index} {...geometry} index={index} />
        ))}

        {/* Render selected geometry */}
        {target && <TransformControls object={target} mode={mode} />}

      </Selection>
      <Env />
      <OrbitControls minPolarAngle={Math.PI / 2.1} maxPolarAngle={Math.PI / 2.1} makeDefault />

      {/* Button to add new geometry */}
      <Html>
      <button onClick={addGeometry}>Add Geometry</button>
      </Html>
    </Canvas>
  );
}

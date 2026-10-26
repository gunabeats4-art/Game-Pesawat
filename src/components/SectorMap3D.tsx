import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ObjectiveMarker {
  id: string;
  label: string;
  x: number;
  z: number;
  color: number;
  type: 'boss' | 'target' | 'waypoint' | 'outpost';
}

interface HazardZone {
  id: string;
  label: string;
  x: number;
  z: number;
  radius: number;
  color: number;
  type: 'thunderstorm' | 'asteroid' | 'patrol';
}

interface SectorMap3DProps {
  sectorName: string;
  sectorWave: number;
  weatherHazard?: 'clear' | 'thunderstorm' | 'asteroid_field';
  objectives: ObjectiveMarker[];
  hazards: HazardZone[];
  className?: string;
}

export const SectorMap3D: React.FC<SectorMap3DProps> = ({
  sectorName,
  sectorWave,
  weatherHazard = 'clear',
  objectives,
  hazards,
  className = 'w-full h-64 sm:h-80',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect software WebGL renderer
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 350;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.035);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 18, 22);
    camera.lookAt(0, -1, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x020617, 0.95);

    container.appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x06b6d4, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // Holographic Radar Base Grid
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);

    // Concentric Tactical Radar Rings
    [4, 8, 12, 16].forEach((r) => {
      const ringGeo = new THREE.RingGeometry(r - 0.05, r + 0.05, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      gridGroup.add(ringMesh);
    });

    // Crosshair Lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.35 });
    const lineGeoX = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-18, 0, 0),
      new THREE.Vector3(18, 0, 0),
    ]);
    const lineGeoZ = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -18),
      new THREE.Vector3(0, 0, 18),
    ]);
    gridGroup.add(new THREE.Line(lineGeoX, lineMat));
    gridGroup.add(new THREE.Line(lineGeoZ, lineMat));

    // Procedural 3D Topographic Terrain Grid
    const planeGeo = new THREE.PlaneGeometry(32, 32, 28, 28);
    const pos = planeGeo.attributes.position;

    // Displace vertices for 3D islands / archipelago profile
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const dist = Math.hypot(vx, vy);

      // Create procedural islands and ridge bumps
      const islandHeight =
        Math.sin(vx * 0.3) * Math.cos(vy * 0.3) * 2.2 +
        Math.sin(vx * 0.7 + vy * 0.5) * 1.1 +
        Math.exp(-Math.pow((vx - 4) / 5, 2) - Math.pow((vy + 3) / 5, 2)) * 3.5 +
        Math.exp(-Math.pow((vx + 5) / 4, 2) - Math.pow((vy - 4) / 4, 2)) * 2.8;

      pos.setZ(i, Math.max(-0.5, islandHeight));
    }
    planeGeo.computeVertexNormals();

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const terrainMesh = new THREE.Mesh(planeGeo, wireMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.y = -0.5;
    gridGroup.add(terrainMesh);

    // 3D Objective Beacons
    const beaconMeshes: { group: THREE.Group; marker: ObjectiveMarker }[] = [];

    objectives.forEach((obj) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(obj.x, 0, obj.z);

      // Vertical Laser Beam
      const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, 8, 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: obj.color,
        transparent: true,
        opacity: 0.6,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.y = 4;
      bGroup.add(beamMesh);

      // Pulsing Base Ring
      const bRingGeo = new THREE.RingGeometry(0.8, 1.1, 32);
      const bRingMat = new THREE.MeshBasicMaterial({
        color: obj.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const bRingMesh = new THREE.Mesh(bRingGeo, bRingMat);
      bRingMesh.rotation.x = -Math.PI / 2;
      bRingMesh.position.y = 0.1;
      bGroup.add(bRingMesh);

      // Floating Objective Diamond Core
      const coreGeo = new THREE.OctahedronGeometry(0.7, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: obj.color,
        emissive: obj.color,
        emissiveIntensity: 0.8,
        metalness: 0.8,
        roughness: 0.2,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.y = 4.5;
      bGroup.add(coreMesh);

      gridGroup.add(bGroup);
      beaconMeshes.push({ group: bGroup, marker: obj });
    });

    // 3D Hazard Zones (Translucent Wireframe Danger Domes)
    hazards.forEach((haz) => {
      const hGroup = new THREE.Group();
      hGroup.position.set(haz.x, 0, haz.z);

      const domeGeo = new THREE.CylinderGeometry(haz.radius, haz.radius, 4, 32, 1, true);
      const domeMat = new THREE.MeshBasicMaterial({
        color: haz.color,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      });
      const domeMesh = new THREE.Mesh(domeGeo, domeMat);
      domeMesh.position.y = 2;
      hGroup.add(domeMesh);

      gridGroup.add(hGroup);
    });

    // Interactive Drag Orbit Controls
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotX = 0.3;
    let rotY = 0.2;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      rotY += dx * 0.008;
      rotX = Math.max(0.1, Math.min(1.1, rotX + dy * 0.008));
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Smooth auto-orbit if not dragging
      if (!isDragging) {
        rotY += 0.003;
      }

      // Smooth Camera orbit update
      const dist = 24;
      camera.position.x = Math.sin(rotY) * Math.cos(rotX) * dist;
      camera.position.z = Math.cos(rotY) * Math.cos(rotX) * dist;
      camera.position.y = Math.sin(rotX) * dist;
      camera.lookAt(0, 0, 0);

      // Animate Beacon Diamond Core Rotations
      beaconMeshes.forEach(({ group: bG }) => {
        const core = bG.children[2];
        if (core) {
          core.rotation.y = elapsed * 2.0;
          core.position.y = 4.5 + Math.sin(elapsed * 3.0) * 0.3;
        }
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      planeGeo.dispose();
      wireMat.dispose();
      renderer.dispose();
      if (domEl.parentNode) domEl.parentNode.removeChild(domEl);
    };
  }, [sectorName, sectorWave, weatherHazard, objectives, hazards]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 ${className}`}>
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Map Overlay Badge */}
      <div className="absolute top-3 left-3 bg-slate-950/85 border border-cyan-500/40 px-3 py-1.5 rounded-xl shadow-md font-mono text-[10px] text-cyan-300 pointer-events-none flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>3D HOLOGRAPHIC SECTOR SCAN · ROTATE WITH DRAG</span>
      </div>
    </div>
  );
};

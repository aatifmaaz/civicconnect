import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroScene({ theme = 'dark' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 12, 28);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(theme === 'dark' ? 0xb9d4ff : 0xc7e7f7, 0.8);
    const pointLight = new THREE.PointLight(theme === 'dark' ? 0x55c3ff : 0x2b6cb0, 1.3, 220);
    pointLight.position.set(18, 24, 18);
    scene.add(ambientLight, pointLight);

    const nodeCount = 140;
    const positions = new Float32Array(nodeCount * 3);
    const pulseOffsets = [];
    const basePoints = [];

    for (let index = 0; index < nodeCount; index += 1) {
      const angle = (index / nodeCount) * Math.PI * 2 * 4;
      const radius = 4 + (index % 9) * 1.2 + Math.random() * 2;
      const x = Math.cos(angle) * radius;
      const y = ((index % 14) - 7) * 0.9;
      const z = Math.sin(angle) * radius;

      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;
      pulseOffsets.push(Math.random() * Math.PI * 2);
      basePoints.push({ x, y, z });
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      color: theme === 'dark' ? 0x79d6ff : 0x145a7a,
      size: 0.16,
      transparent: true,
      opacity: theme === 'dark' ? 0.95 : 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const pointCloud = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(pointCloud);

    const lineVertices = [];
    for (let index = 0; index < nodeCount - 1; index += 2) {
      const current = basePoints[index];
      const next = basePoints[(index + 13) % nodeCount];
      lineVertices.push(current.x, current.y, current.z, next.x, next.y, next.z);
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: theme === 'dark' ? 0x3182ce : 0x2563eb,
      transparent: true,
      opacity: theme === 'dark' ? 0.18 : 0.12,
    });
    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);

    const grid = new THREE.GridHelper(38, 18, theme === 'dark' ? 0x173455 : 0x93c5fd, theme === 'dark' ? 0x0f2440 : 0xcfe8f6);
    grid.position.y = -7;
    grid.material.transparent = true;
    grid.material.opacity = theme === 'dark' ? 0.18 : 0.28;
    scene.add(grid);

    const mouse = { x: 0, y: 0 };

    const handleMouseMove = (event) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    mount.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const attribute = pointsGeometry.getAttribute('position');

      for (let index = 0; index < nodeCount; index += 1) {
        const basePoint = basePoints[index];
        attribute.array[index * 3] = basePoint.x + Math.sin(elapsed + pulseOffsets[index]) * 0.12;
        attribute.array[index * 3 + 1] = basePoint.y + Math.cos(elapsed * 1.1 + pulseOffsets[index]) * 0.2;
        attribute.array[index * 3 + 2] = basePoint.z + Math.sin(elapsed * 0.8 + pulseOffsets[index]) * 0.12;
      }
      attribute.needsUpdate = true;

      pointCloud.rotation.y = elapsed * 0.08 + mouse.x * 0.15;
      lineSegments.rotation.y = elapsed * 0.05 + mouse.x * 0.1;
      pointCloud.rotation.x = mouse.y * 0.08;
      lineSegments.rotation.x = mouse.y * 0.04;

      camera.position.x += ((mouse.x * 2.2) - camera.position.x) * 0.03;
      camera.position.y += ((12 + mouse.y * 1.8) - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      mount.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, [theme]);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}

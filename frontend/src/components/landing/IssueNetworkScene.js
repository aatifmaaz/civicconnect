import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function IssueNetworkScene({ theme = 'dark' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 1.5, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(theme === 'dark' ? 0xd7efff : 0xb7dfff, 0.95);
    const rimLight = new THREE.PointLight(theme === 'dark' ? 0x60a5fa : 0x2563eb, 1.4, 80);
    rimLight.position.set(10, 8, 8);
    scene.add(ambient, rimLight);

    const group = new THREE.Group();
    scene.add(group);

    const coreGeometry = new THREE.IcosahedronGeometry(2.1, 1);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: theme === 'dark' ? 0x67d5ff : 0x2563eb,
      emissive: theme === 'dark' ? 0x0c4a6e : 0x93c5fd,
      emissiveIntensity: theme === 'dark' ? 0.8 : 0.45,
      roughness: 0.22,
      metalness: 0.55,
      transparent: true,
      opacity: 0.92,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    const ringGeometry = new THREE.TorusGeometry(3.4, 0.04, 16, 180);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: theme === 'dark' ? 0xa5f3fc : 0x1d4ed8,
      transparent: true,
      opacity: theme === 'dark' ? 0.55 : 0.35,
    });
    const ringA = new THREE.Mesh(ringGeometry, ringMaterial);
    ringA.rotation.x = Math.PI / 2.8;
    const ringB = new THREE.Mesh(ringGeometry, ringMaterial.clone());
    ringB.rotation.y = Math.PI / 2.6;
    group.add(ringA, ringB);

    const nodeCount = 18;
    const satellites = [];
    const linePoints = [];

    for (let index = 0; index < nodeCount; index += 1) {
      const angle = (index / nodeCount) * Math.PI * 2;
      const orbit = 3.9 + (index % 3) * 0.55;
      const y = Math.sin(angle * 1.6) * 1.3;
      const x = Math.cos(angle) * orbit;
      const z = Math.sin(angle) * orbit;

      const node = new THREE.Mesh(
        new THREE.SphereGeometry(index % 4 === 0 ? 0.16 : 0.11, 18, 18),
        new THREE.MeshBasicMaterial({ color: index % 4 === 0 ? 0xfbbf24 : theme === 'dark' ? 0x7dd3fc : 0x2563eb })
      );
      node.position.set(x, y, z);
      satellites.push({ mesh: node, angle, orbit, offset: Math.random() * Math.PI * 2 });
      group.add(node);
      linePoints.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z));
    }

    const lines = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(linePoints),
      new THREE.LineBasicMaterial({
        color: theme === 'dark' ? 0x38bdf8 : 0x60a5fa,
        transparent: true,
        opacity: theme === 'dark' ? 0.3 : 0.24,
      })
    );
    group.add(lines);

    const mouse = { x: 0, y: 0 };

    const handleMouseMove = (event) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };

    const handleResize = () => {
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
      const lineArray = lines.geometry.attributes.position.array;

      satellites.forEach((satellite, index) => {
        const orbitAngle = satellite.angle + elapsed * 0.28 + satellite.offset;
        const x = Math.cos(orbitAngle) * satellite.orbit;
        const y = Math.sin(orbitAngle * 1.3) * 1.4;
        const z = Math.sin(orbitAngle) * satellite.orbit;
        satellite.mesh.position.set(x, y, z);

        lineArray[index * 6 + 3] = x;
        lineArray[index * 6 + 4] = y;
        lineArray[index * 6 + 5] = z;
      });

      lines.geometry.attributes.position.needsUpdate = true;

      core.rotation.x += 0.003;
      core.rotation.y += 0.004;
      ringA.rotation.z += 0.003;
      ringB.rotation.x += 0.002;
      group.rotation.y += ((mouse.x * 0.45) - group.rotation.y) * 0.03;
      group.rotation.x += ((mouse.y * 0.2) - group.rotation.x) * 0.03;

      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      mount.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
      coreGeometry.dispose();
      coreMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      lines.geometry.dispose();
      lines.material.dispose();
      satellites.forEach((satellite) => {
        satellite.mesh.geometry.dispose();
        satellite.mesh.material.dispose();
      });
      renderer.dispose();
    };
  }, [theme]);

  return <div ref={mountRef} className="h-[360px] w-full" aria-hidden="true" />;
}

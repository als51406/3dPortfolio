import React, { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

gsap.registerPlugin(ScrollTrigger);

export const ThreeCanvas: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
  const container = containerRef.current;
  const wrapper = wrapperRef.current;
  if (!container) return;

    // Stable viewport size helper
    const getViewportSize = () => {
      const rect = (wrapper ?? container).getBoundingClientRect();
      const w = Math.max(2, Math.floor(rect.width || window.innerWidth));
      const h = Math.max(2, Math.floor(rect.height || window.innerHeight));
      return { w, h };
    };
    const init = getViewportSize();
    const sizes = {
      width: init.w,
      height: init.h,
    };

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera
  const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.2, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
    scene.add(camera);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
  // Hint the browser to keep the canvas composited during pin/scroll
  renderer.domElement.style.willChange = 'transform, opacity';
  (renderer.domElement.style as any).transform = 'translateZ(0)';
  renderer.sortObjects = true;

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 1.0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(2, 3, 4);
    scene.add(dir);

  // Model group (GLB will be loaded into this)
  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

    // Render loop
    let rafId = 0;
    const render = () => {
    // enforce visibility each frame in case any external state toggles it
    modelGroup.visible = true;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(render);
    };
    render();

    // Load GLB model
    let tl: gsap.core.Timeline | null = null;
    const loader = new GLTFLoader();
    loader.load(
      '/models/apple_watch_ultra_2.glb',
      (gltf) => {
        const model = gltf.scene;
        modelGroup.add(model);

        // Prevent unexpected culling during scroll/resize and handle transparency properly
        modelGroup.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            mesh.frustumCulled = false;
            const tuneMat = (mat: THREE.Material) => {
              const mm = mat as any;
              if (mm.transparent) {
                mm.depthWrite = false; // let sorting handle layering
                mm.side = THREE.FrontSide; // avoid backface blending
                if (mm.alphaTest == null) mm.alphaTest = 0.001; // drop near-zero fragments
              }
            };
            if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m && tuneMat(m));
            else if (mesh.material) tuneMat(mesh.material as THREE.Material);
          }
        });

  // Center and scale model locally (move the model, keep group at origin)
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  const bbox = new THREE.Box3().setFromObject(model);
  bbox.getSize(size);
  bbox.getCenter(center);
  model.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const desired = 1.8;
  const scale = desired / maxDim;
  modelGroup.scale.setScalar(scale);
  modelGroup.updateMatrixWorld(true);

        // Light color tween proxy
        const startDirColor = dir.color.clone();
        const endDirColor = new THREE.Color(0xff6f61);
        const colorProxy = { t: 0 };

  // Kill any existing trigger with same id (dev StrictMode double-mount)
  ScrollTrigger.getById('glbScroll')?.kill();

  // Timeline with ScrollTrigger
  const debugMarkers = process.env.NODE_ENV !== 'production';
  tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
      id: 'glbScroll',
      trigger: wrapper ?? container,
  start: 'top top',
            end: '+=2000',
            scrub: true,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            markers: debugMarkers,
            pinSpacing: true,
            pinType: 'fixed',
      fastScrollEnd: true,
      refreshPriority: 900,
      onEnter: () => { modelGroup.visible = true; },
      onEnterBack: () => { modelGroup.visible = true; },
      onLeave: () => { modelGroup.visible = true; },
      onLeaveBack: () => { modelGroup.visible = true; },
      onRefresh: () => onResize(),
          },
        });

  // Animations (rotation-only to avoid any motion-related clipping)
  modelGroup.rotation.reorder('YXZ');
  tl.to(modelGroup.rotation, { y: Math.PI * 2, duration: 1 }, 0);
        
// // 2) 큐브 이동 1: 0 ~ 0.5 구간
// tl.to(modelGroup.position, { x: 2, y: 0.5, z: -0.5, duration: 0.5 }, 0);

// // 2-2) 큐브 이동 2: 0.5 ~ 1 구간
// tl.to(modelGroup.position, { x: 0, y: -0.5, z: 0.5, duration: 0.5 }, 0.5);

 tl.to(camera.position, { z: 3.2, duration: 0.5 }, 0.5);

  tl.to(
          colorProxy,
          {
            t: 1,
            duration: 0.5,
            onUpdate: () => {
              dir.color.lerpColors(startDirColor, endDirColor, colorProxy.t);
            },
          },
          0.5
        );

        // Force ScrollTrigger to recalc after model+timeline ready
        requestAnimationFrame(() => ScrollTrigger.refresh());
      },
      undefined,
      (err) => {
        console.error('Failed to load GLB:', err);
      }
    );

    // Resize
    const onResize = () => {
      if (!container) return;
      const { w, h } = getViewportSize();
      // Avoid applying a transient 0x0 during pin/unpin/refresh
      if (w < 2 || h < 2) return;
      sizes.width = w;
      sizes.height = h;

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

  const ro = new ResizeObserver(onResize);
  if (wrapper) ro.observe(wrapper); else ro.observe(container);
  const refreshInit = () => onResize();
  const refresh = () => onResize();
  ScrollTrigger.addEventListener('refreshInit', refreshInit);
  ScrollTrigger.addEventListener('refresh', refresh);
    window.addEventListener('resize', onResize);

    // Cleanup
    return () => {
      tl?.scrollTrigger?.kill();
      tl?.kill();
      cancelAnimationFrame(rafId);
  ro.disconnect();
  ScrollTrigger.removeEventListener('refreshInit', refreshInit);
  ScrollTrigger.removeEventListener('refresh', refresh);
      window.removeEventListener('resize', onResize);
      try {
        scene.remove(modelGroup);
        modelGroup.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            if (m.geometry) m.geometry.dispose();
            if (Array.isArray(m.material)) {
              m.material.forEach((mat) => mat && (mat as THREE.Material).dispose());
            } else if (m.material) {
              (m.material as THREE.Material).dispose();
            }
          }
        });
      } catch {}
      renderer.dispose();
      if (container && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section className="pin-section" ref={wrapperRef}>
      <div className="three-container" ref={containerRef} />
    </section>
  );
};
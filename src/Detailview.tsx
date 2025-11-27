import React, { useRef, useLayoutEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Text } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useResponsiveCanvas, useDynamicViewportHeight } from "./hooks/useResponsiveCanvas";

gsap.registerPlugin(ScrollTrigger);

// 모델 경로: public 폴더 기준 절대 경로
const MODEL_URL = "/models/apple_watch_ultra_2.glb";

// 애니메이션 상수 (컴포넌트 외부에 정의하여 재렌더링 시에도 동일한 값 유지)
const MODEL_DUR = 3; // 모델 상승 구간(타임라인 시간)
const CAM_Z_START = 5;
const CAM_Z_IN = 2.0;
const CAM_Z_END = 5;
const CAM_Z_IN_PORTION = 0.4;
const CAM_EASE_IN: gsap.EaseString = "power1.out";
const CAM_EASE_OUT: gsap.EaseString = "power1.inOut";
const ROT_Y_START = 0;
const ROT_Y_END = Math.PI * 2;
// const ROT_EASE: gsap.EaseString = "none"; // 현재 미사용
const POS_Y_START = -11.5;
const POS_Y_END = 0;
const POS_Y_OVERSHOOT = 1.0;
const POS_OVERSHOOT_PORTION = 0.85;

function ProductModel({ onReady, scale = 1 }: { onReady?: (group: THREE.Group) => void; scale?: number }) {
  const model = useGLTF(MODEL_URL as string);
  const clonedScene = useMemo(() => {
    if (model && model.scene) {
      return model.scene.clone(true);
    }
    return null;
  }, [model]);
  const groupRef = useRef<THREE.Group>(null);
  const isInitializedRef = useRef(false);

  // 🎯 초기화는 단 한 번만 실행 (마운트 시)
  useLayoutEffect(() => {
    if (!groupRef.current || isInitializedRef.current) return;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 ProductModel 초기화 (한 번만):', {
        scale,
        position: { y: POS_Y_START },
        groupScale: `${2.5 * scale}`,
        primitiveScale: `${50 * scale}`
      });
    }
    
    // 초기 상태를 명확히 설정 (애니메이션 시작 전 상태)
    groupRef.current.position.y = POS_Y_START;
    groupRef.current.scale.set(2.5 * scale, 2.5 * scale, 2.5 * scale);
    groupRef.current.rotation.y = ROT_Y_START;
    groupRef.current.visible = true;
    
    // opacity 0으로 시작 (부드러운 페이드인 효과) - 초기화 시 한 번만
    groupRef.current.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = 0;
          });
        } else if (mesh.material) {
          mesh.material.transparent = true;
          mesh.material.opacity = 0;
        }
      }
    });
    
    isInitializedRef.current = true;
    onReady?.(groupRef.current);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ ProductModel 초기화 완료');
    }
  }, []); // 빈 배열: 마운트 시 한 번만

  // 반응형 스케일 변경 시 로그만 출력 (타임라인이 스케일 관리)
  useLayoutEffect(() => {
    if (!isInitializedRef.current) return;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 반응형 스케일 변경:', {
        scale,
        expectedInitialScale: 2.5 * scale,
        expectedFinalScale: 1 * scale,
        note: '타임라인이 스케일 애니메이션 관리'
      });
    }
  }, [scale]);

  // 렌더링 순서 설정 (모델을 텍스트보다 앞에)
  useLayoutEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.renderOrder = 10; // 높은 값 = 나중에 렌더링 = 위에 표시
      }
    });
  }, []);

  // 모델이 로드되지 않았으면 렌더링하지 않음
  if (!clonedScene) {
    return null;
  }

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={clonedScene} scale={50 * scale} />
    </group>
  );
}
// 새로고침 시 로더 타이밍 이슈 완화: 사전 로드
useGLTF.preload(MODEL_URL as string);

// BillboardText: 카메라를 향하도록 유지
function BillboardText({
  children,
  position = [0, 4, 0] as [number, number, number],
  fontSize = 4,
  color = "#333333",
  anchorX = "center",
  anchorY = "middle",
  offset = -5,
  ...props
}: {
  children: React.ReactNode;
  position?: [number, number, number];
  fontSize?: number;
  color?: string;
  anchorX?: "center" | "left" | "right";
  anchorY?: "middle" | "top" | "bottom";
  offset?: number;
  [key: string]: any;
}) {
  const textRef = useRef<THREE.Object3D>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (textRef.current) {
      const camPos = camera.position.clone();
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const textPos = camPos.add(camDir.multiplyScalar(offset));
      textRef.current.position.copy(textPos);
      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX={anchorX}
      anchorY={anchorY}
      renderOrder={-1}
      {...props}
    >
      {children}
    </Text>
  );
}

const Detailview: React.FC = () => {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const textOverlayRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const modelTweenAddedRef = useRef(false);
  const autoRotateStateRef = useRef(false);
  const rotateBadgeRef = useRef<HTMLDivElement | null>(null);
  const badgeShownRef = useRef(false); // 현재 표시 상태를 추적(토글)
  
  // 반응형 설정
  const responsive = useResponsiveCanvas();
  const vh = useDynamicViewportHeight();
  
  // 디버깅: 반응형 설정 확인 (개발 환경에서만)
  useLayoutEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📱 Detailview 반응형 설정:', {
        device: responsive.isMobile ? 'Mobile' : responsive.isTablet ? 'Tablet' : 'Desktop',
        fov: responsive.fov,
        cameraDistance: responsive.cameraDistance,
        modelScale: responsive.modelScale,
        viewport: `${responsive.width}x${responsive.height}`
      });
    }
  }, [responsive.fov, responsive.cameraDistance, responsive.modelScale]);

  // 텍스트 3회: 아래→중앙(최대)→위로 사라짐 (스크럽 통일)
  useLayoutEffect(() => {
    const section = canvasWrapRef.current;
    const overlay = textOverlayRef.current;
    if (!section || !overlay) return;

    const items = Array.from(
      overlay.querySelectorAll<HTMLElement>(".detailTextItem")
    );

    // 중앙 기준: 초기 아래쪽에서 투명
    gsap.set(items, { y: 80, opacity: 0, clearProps: "x" });

  const tl = gsap.timeline({
      defaults: { ease: "none" },
    scrollTrigger: {
        trigger: section,
        start: "center center",
  end: "+=5000",
        scrub: true,
        pin: section,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        markers: false,
        onToggle: (self) => {
          section.style.zIndex = self.isActive ? "999" : "auto";
        },
    onEnter: () => {
          // 트리거 start 통과 시점 - 별도 처리 불필요 (초기 상태가 이미 설정됨)
          // opacity 애니메이션은 타임라인에서 처리
        },
        onLeaveBack: () => {
          // 되돌아갈 때 opacity를 0으로 (부드럽게)
          if (modelGroupRef.current) {
            modelGroupRef.current.traverse((obj) => {
              if ((obj as THREE.Mesh).isMesh) {
                const mesh = obj as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach((mat) => {
                    mat.opacity = 0;
                  });
                } else if (mesh.material) {
                  mesh.material.opacity = 0;
                }
              }
            });
          }
          // 배지도 초기 상태로 감춤
          if (rotateBadgeRef.current) {
            gsap.set(rotateBadgeRef.current, { opacity: 0, scale: 0.8 });
          }
          badgeShownRef.current = false;
        },
        onUpdate: () => {
          // 모델 상승(타임라인 0~MODEL_DUR)이 끝나면 autoRotate 활성화, 그 전엔 비활성화
          const enable = tl.time() >= MODEL_DUR;
          if (controlsRef.current && autoRotateStateRef.current !== enable) {
            controlsRef.current.autoRotate = enable;
            autoRotateStateRef.current = enable;
          }
          // 모델 애니메이션 완료 지점 이후에는 배지 표시, 이전으로 올라가면 숨김
          const done = tl.time() >= MODEL_DUR;
          if (done && !badgeShownRef.current) {
            if (rotateBadgeRef.current) {
              gsap.to(rotateBadgeRef.current, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" });
            }
            badgeShownRef.current = true;
          } else if (!done && badgeShownRef.current) {
            if (rotateBadgeRef.current) {
              gsap.to(rotateBadgeRef.current, { opacity: 0, scale: 0.8, duration: 0.3, ease: "power1.out" });
            }
            badgeShownRef.current = false;
          }
        },
      },
    });
    tlRef.current = tl;

    // 초기에는 자동회전 비활성화
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
      autoRotateStateRef.current = false;
    }

    // 모델 상승을 타임라인 형식으로 합류 (텍스트처럼 스크럽 진행에 매핑)
    // 0 ~ MODEL_DUR: y가 시작(POS_Y_START)에서 중앙보다 위(POS_Y_OVERSHOOT)로 올라갔다가
    // 마지막에 중앙(POS_Y_END)에 정착(오버슈트 효과)
    if (modelGroupRef.current && !modelTweenAddedRef.current) {
      const g = modelGroupRef.current;
      
      // 부드러운 페이드인 효과 (처음 0.3초 동안)
      const fadeInDuration = 0.3;
      g.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              tl.fromTo(
                mat,
                { opacity: 0 },
                { opacity: 1, duration: fadeInDuration, ease: "power2.out" },
                0
              );
            });
          } else if (mesh.material) {
            tl.fromTo(
              mesh.material,
              { opacity: 0 },
              { opacity: 1, duration: fadeInDuration, ease: "power2.out" },
              0
            );
          }
        }
      });

      // y: 시작 -> 오버슈트 (부드러운 ease 적용)
      tl.fromTo(
        g.position,
        { y: POS_Y_START },
        { y: POS_Y_OVERSHOOT, duration: MODEL_DUR * POS_OVERSHOOT_PORTION, ease: "power2.out" },
        0
      );
      
      // y: 오버슈트 -> 중앙 정착 (부드러운 감속)
      tl.to(
        g.position,
        { y: POS_Y_END, duration: MODEL_DUR * (1 - POS_OVERSHOOT_PORTION), ease: "power1.inOut" },
        MODEL_DUR * POS_OVERSHOOT_PORTION
      );
      
      // 스케일 2.5 -> 1 (상승 구간과 동기화, 부드러운 ease)
      tl.fromTo(
        g.scale,
        { x: 2.5, y: 2.5, z: 2.5 },
        { x: 1, y: 1, z: 1, duration: MODEL_DUR, ease: "power2.out" },
        0
      );
      
      // 모델 회전 효과(부드럽게 좌->우로 회전)
      tl.fromTo(
        g.rotation,
        { y: ROT_Y_START },
        { y: ROT_Y_END, duration: MODEL_DUR, ease: "power1.inOut" },
        0
      );
      
      modelTweenAddedRef.current = true;
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }

    // 회색 원 배지 초기 상태만 세팅(등장은 onUpdate에서 1회 처리)
    if (rotateBadgeRef.current) {
      gsap.set(rotateBadgeRef.current, { opacity: 0, scale: 0.8 });
    }

    // 카메라 줌 인-아웃을 모델 상승 구간과 동기화 (반응형 거리 기준)
    if (cameraRef.current) {
      // 반응형 카메라 거리를 기준으로 줌 인/아웃 계산
      const baseCamZ = responsive.cameraDistance;
      const zoomInDistance = baseCamZ - 3; // 3만큼 줌인
      
      // 시작에 살짝 당겼다가(줌 인), 끝으로 갈수록 원위치(줌 아웃)
      tl.fromTo(
        cameraRef.current.position,
        { z: baseCamZ },
        { z: zoomInDistance, duration: MODEL_DUR * CAM_Z_IN_PORTION, ease: CAM_EASE_IN },
        0
      );
      tl.to(
        cameraRef.current.position,
        { z: baseCamZ, duration: MODEL_DUR * (1 - CAM_Z_IN_PORTION), ease: CAM_EASE_OUT },
        MODEL_DUR * CAM_Z_IN_PORTION
      );
    }

  const block = 3; // 각 텍스트 아이템이 차지하는 타임라인 길이(더 느리게)
  const fadeDur = 0.8; // 페이드 인/아웃 지속시간
    items.forEach((el, i) => {
      const pos = MODEL_DUR + i * block; // 모델 애니메이션 완료 후부터 시작
      tl.fromTo(
        el,
        { y: 80 },
  { y: -100, duration: block, ease: "none", immediateRender: false },
        pos
      );
      // 중앙 근처에서 최대 불투명(상대 위치 유지)
      tl.fromTo(
        el,
        { opacity: 0 },
        { opacity: 1, duration: fadeDur, ease: "power1.out" },
        pos + block * 0.2
      );
      tl.to(
        el,
        { opacity: 0, duration: fadeDur, ease: "power1.in" },
        pos + block * 0.8
      );
    });

    // 타임라인 재생성 시 모델이 이미 있으면 즉시 애니메이션 추가
    if (modelGroupRef.current && !modelTweenAddedRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 타임라인 재생성 - 기존 모델 재연결');
      }
      const g = modelGroupRef.current;
      const fadeInDuration = 0.3;
      
      // 페이드인 (이미 보이는 상태이므로 opacity 1 유지)
      g.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              // 이미 보이는 상태면 opacity 유지
              if (mat.opacity > 0) {
                tl.set(mat, { opacity: 1 }, 0);
              } else {
                tl.fromTo(
                  mat,
                  { opacity: 0 },
                  { opacity: 1, duration: fadeInDuration, ease: "power2.out" },
                  0
                );
              }
            });
          } else if (mesh.material) {
            if (mesh.material.opacity > 0) {
              tl.set(mesh.material, { opacity: 1 }, 0);
            } else {
              tl.fromTo(
                mesh.material,
                { opacity: 0 },
                { opacity: 1, duration: fadeInDuration, ease: "power2.out" },
                0
              );
            }
          }
        }
      });
      
      // 위치 애니메이션
      tl.fromTo(
        g.position,
        { y: POS_Y_START },
        { y: POS_Y_OVERSHOOT, duration: MODEL_DUR * POS_OVERSHOOT_PORTION, ease: "power2.out" },
        0
      );
      tl.to(
        g.position,
        { y: POS_Y_END, duration: MODEL_DUR * (1 - POS_OVERSHOOT_PORTION), ease: "power1.inOut" },
        MODEL_DUR * POS_OVERSHOOT_PORTION
      );
      
      // 스케일 애니메이션 (반응형)
      const startScale = 2.5 * responsive.modelScale;
      const endScale = 1 * responsive.modelScale;
      
      // 현재 스케일을 유지하면서 타임라인에 추가 (스크롤 위치 고려)
      const currentScale = g.scale.x;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 타임라인 재생성 - 스케일 설정:', {
          currentScale,
          startScale,
          endScale,
          willUseFrom: currentScale
        });
      }
      
      tl.fromTo(
        g.scale,
        { x: currentScale, y: currentScale, z: currentScale },
        { x: endScale, y: endScale, z: endScale, duration: MODEL_DUR, ease: "power2.out" },
        0
      );
      
      // 회전 애니메이션
      tl.fromTo(
        g.rotation,
        { y: ROT_Y_START },
        { y: ROT_Y_END, duration: MODEL_DUR, ease: "power1.inOut" },
        0
      );
      
      modelTweenAddedRef.current = true;
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 타임라인에 모델 애니메이션 재추가 완료');
      }
    }

  return () => {
      tlRef.current?.scrollTrigger?.kill();
      tlRef.current?.kill();
      tlRef.current = null;
      modelTweenAddedRef.current = false;
    };
  }, [responsive.cameraDistance, responsive.modelScale]); // 반응형 값 변경 시 타임라인 재생성

  return (
    <div
      ref={canvasWrapRef}
      style={{
        width: "100%",
        height: "100vh",
        background: "#000",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* 텍스트 오버레이: 섹션 전체 높이 기준 중앙에 정렬 */}
      <div
        ref={textOverlayRef}
        className="detailTextOverlay"
        style={{
          position: "absolute",
          left: "6%",
          top: 0,
          height: "100%",
          width: "520px",
          color: "#eaeaea",
          zIndex: 950,
          pointerEvents: "none",
        }}
      >
        <p
          className="detailTextItem"
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            transform: "translateY(-50%)",
            fontSize: 24,
            lineHeight: 1.7,
            margin: 0,
            willChange: "transform, opacity",
          }}
        >
          금속, 패브릭, 고무 등 다양한 소재의 질감을<br/>
           실물처럼 감상할 수 있으며,
          LED 화면이나<br/> 특정 동작 표현도 가능합니다.
        </p>
        <p
          className="detailTextItem"
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            transform: "translateY(-50%)",
            fontSize: 24,
            lineHeight: 1.7,
            margin: 0,
            willChange: "transform, opacity",
          }}
        >
          360° 회전과 사용자 상호작용을 통해 제품의 <br/> 모든 각도를 확인해 보세요.
        </p>
        <p
          className="detailTextItem"
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            transform: "translateY(-50%)",
            fontSize: 24,
            lineHeight: 1.7,
            margin: 0,
            willChange: "transform, opacity",
          }}
        >
          실제 촬영 없이 다양한 색상과 재질 변형을 <br/> 빠르게 시각화할 수 있습니다.
        </p>
      </div>

      {/* 360도 회전 배지 */}
      <div
        ref={rotateBadgeRef}
        style={{
          position: "absolute",
          top: "80%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          height: 40,
          borderRadius: 10,
          // Glassmorphism background
          background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
          color: "#fff",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 500,
          fontSize: 16,
          letterSpacing: 1,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
          zIndex: 955,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        마우스 드래그로 360° 회전시켜보기
      </div>

      <Canvas
        camera={{ 
          fov: responsive.fov, 
          position: [2, 1, responsive.cameraDistance],
          near: 0.1,
          far: 1000
        }}
        dpr={responsive.dpr}
        gl={{ 
          powerPreference: "high-performance" as any,
          antialias: !responsive.isMobile // 모바일 성능 최적화
        }}
        style={{ width: "100%", height: `${vh}px` }}
        onCreated={(state) => {
          cameraRef.current = state.camera as THREE.PerspectiveCamera;
          // 카메라 설정 확인 및 업데이트
          if (cameraRef.current) {
            cameraRef.current.near = 0.1;
            cameraRef.current.far = 1000;
            cameraRef.current.updateProjectionMatrix();
          }
          requestAnimationFrame(() => ScrollTrigger.refresh());
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <Environment preset="city" />
        <BillboardText offset={10}>Detail View</BillboardText>
          <ProductModel
            scale={responsive.modelScale}
            onReady={(g) => {
            modelGroupRef.current = g;
            
            // 타임라인이 이미 준비되어 있다면 즉시 합류
            if (tlRef.current && !modelTweenAddedRef.current) {
              const fadeInDuration = 0.3;
              
              // 부드러운 페이드인 효과
              g.traverse((obj) => {
                if ((obj as THREE.Mesh).isMesh) {
                  const mesh = obj as THREE.Mesh;
                  if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((mat) => {
                      tlRef.current!.fromTo(
                        mat,
                        { opacity: 0 },
                        { opacity: 1, duration: fadeInDuration, ease: "power2.out" },
                        0
                      );
                    });
                  } else if (mesh.material) {
                    tlRef.current!.fromTo(
                      mesh.material,
                      { opacity: 0 },
                      { opacity: 1, duration: fadeInDuration, ease: "power2.out" },
                      0
                    );
                  }
                }
              });
              
              // y: 시작 -> 오버슈트
              tlRef.current.fromTo(
                g.position,
                { y: POS_Y_START },
                { y: POS_Y_OVERSHOOT, duration: MODEL_DUR * POS_OVERSHOOT_PORTION, ease: "power2.out" },
                0
              );
              
              // y: 오버슈트 -> 중앙 정착
              tlRef.current.to(
                g.position,
                { y: POS_Y_END, duration: MODEL_DUR * (1 - POS_OVERSHOOT_PORTION), ease: "power1.inOut" },
                MODEL_DUR * POS_OVERSHOOT_PORTION
              );
              
              // 스케일 애니메이션 (반응형 스케일 적용)
              const startScale = 2.5 * responsive.modelScale;
              const endScale = 1 * responsive.modelScale;
              
              // 타임라인의 현재 progress에 따라 초기 스케일 계산
              const currentProgress = tlRef.current.progress();
              const initialScale = startScale + (endScale - startScale) * currentProgress;
              
              if (process.env.NODE_ENV === 'development') {
                console.log('🎬 스케일 애니메이션 (모델 로드 시):', { 
                  startScale, 
                  endScale, 
                  currentProgress, 
                  initialScale,
                  responsive: responsive.modelScale 
                });
              }
              
              // 현재 progress에 맞는 스케일부터 시작
              g.scale.set(initialScale, initialScale, initialScale);
              
              tlRef.current.fromTo(
                g.scale,
                { x: startScale, y: startScale, z: startScale },
                { x: endScale, y: endScale, z: endScale, duration: MODEL_DUR, ease: "power2.out" },
                0
              );
              
              // 회전 애니메이션
              tlRef.current.fromTo(
                g.rotation,
                { y: ROT_Y_START },
                { y: ROT_Y_END, duration: MODEL_DUR, ease: "power1.inOut" },
                0
              );
              
              modelTweenAddedRef.current = true;
            }
            requestAnimationFrame(() => ScrollTrigger.refresh());
          }}
        />
        <OrbitControls ref={controlsRef} enableZoom={false} autoRotate autoRotateSpeed={5} />
      </Canvas>
    </div>
  );
};

export default Detailview;
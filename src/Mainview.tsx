import React, { useRef, useEffect, useCallback, useState, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import MyElement3D from "./MyElement3D";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useProgress } from "@react-three/drei";
import LoadingSpinner from "./components/LoadingSpinner";
import { useResponsiveCanvas, useDynamicViewportHeight } from "./hooks/useResponsiveCanvas";

gsap.registerPlugin(ScrollTrigger);

// Scroll segmentation of the pinned range (0..1):
// - INTRO: text fade-out at start
// - CAMERA: main camera animation
// - TAIL: post-camera segment for follow-up text
const INTRO_PORTION = 0.15; // 15%
const CAMERA_PORTION = 0.65; // 65% (camera ends at 0.80)
// 아웃트로 텍스트 슬라이드-인에 꼬리 구간의 몇 %를 할당할지(높을수록 더 긴 스크롤)
const OUTRO_ENTER_PORTION = 0.85; // 85% 동안 진행되도록 (기존 30%에서 확장)

interface CameraScrollControllerProps {
  container: React.RefObject<HTMLElement | null>;
  onProgress?: (rawProgress: number) => void; // 0..1 전체 진행도 콜백(텍스트 등 외부 동기화용)
}

function CameraScrollController({ container, onProgress }: CameraScrollControllerProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 5, 10));
  const targetRotation = useRef(new THREE.Euler(0, 0, 0));

  // quickTo 핸들러 (스크롤마다 부드럽게 이어붙기)
  const qPosX = useRef<((v: number) => any) | null>(null);
  const qPosY = useRef<((v: number) => any) | null>(null);
  const qPosZ = useRef<((v: number) => any) | null>(null);
  const qRotX = useRef<((v: number) => any) | null>(null);
  const qRotY = useRef<((v: number) => any) | null>(null);
  const qRotZ = useRef<((v: number) => any) | null>(null);

  useEffect(() => {
    // 한 번만 초기화: 짧은 지속시간 + 완만한 ease로 '알잘딱' 스무딩
    const common = { duration: 0.22, ease: "power2.out", overwrite: true } as const;
    qPosX.current = gsap.quickTo(camera.position, "x", common);
    qPosY.current = gsap.quickTo(camera.position, "y", common);
    qPosZ.current = gsap.quickTo(camera.position, "z", common);
    qRotX.current = gsap.quickTo(camera.rotation, "x", { ...common, onUpdate: () => camera.updateProjectionMatrix() });
    qRotY.current = gsap.quickTo(camera.rotation, "y", common);
    qRotZ.current = gsap.quickTo(camera.rotation, "z", common);
    return () => {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(camera.rotation);
    };
  }, [camera]);

  useEffect(() => {
    if (!container.current) return;

  // 텍스트가 먼저 애니메이션되고, 이후 카메라가 시작되도록 (INTRO -> CAMERA -> TAIL)

    const updateByProgress = (p: number) => {
      // 0..1 진행도에 따른 카메라 경로 정의 (연속적 분기)
      if (p < 0.33) {
        // 초반: 약간 위에서 모델을 바라보는 시점으로 이동
        const t = p / 0.33;
        targetPosition.current.set(
          0,
          THREE.MathUtils.lerp(4.5, 10, t * 0.2),
          THREE.MathUtils.lerp(5, 3.5, t)
        );
        targetRotation.current.set(
          THREE.MathUtils.lerp(-Math.PI / 4, -Math.PI / 3, t * 0.3),
          0,
          0
        );
      } else if (p < 0.66) {
        // 중반: 수직 탑뷰에 가깝게 이동
        const t = (p - 0.33) / (0.66 - 0.33);
        targetPosition.current.set(
          0,
          THREE.MathUtils.lerp(6.1, 10, t),
          THREE.MathUtils.lerp(3.5, 0, t)
        );
        targetRotation.current.set(
          THREE.MathUtils.lerp(-Math.PI / 3, -Math.PI / 2, t),
          0,
          0
        );
      } else if (p < 0.99) {
        // 후반: 위에서 조금씩 내려오며 부드럽게 전환
        const t = (p - 0.66) / (0.99 - 0.66);
        targetPosition.current.set(0, THREE.MathUtils.lerp(12, 2, t), 0);
        targetRotation.current.set(-Math.PI / 2, 0, 0);
      } else {
        // 마무리: 좌측으로 살짝 이동하여 디테일 강조 시점
        const t = (p - 0.99) / 0.01;
        targetPosition.current.set(
          THREE.MathUtils.lerp(0, -5, Math.min(1, t)),
          5.3,
          0
        );
        targetRotation.current.set(-Math.PI / 2, 0, 0);
      }

      // quickTo로 매번 부드럽게 이어서 이동
      qPosX.current?.(targetPosition.current.x);
      qPosY.current?.(targetPosition.current.y);
      qPosZ.current?.(targetPosition.current.z);
      qRotX.current?.(targetRotation.current.x);
      qRotY.current?.(targetRotation.current.y);
      qRotZ.current?.(targetRotation.current.z);
    };

  const st = ScrollTrigger.create({
      id: 'mainview-st',
      trigger: container.current,
      start: "top top",
      end: "+=3000", // 스크롤 구간 길이(늘림: 카메라 후반 텍스트를 더 길게)
      scrub: 0.6, // 스크럽 스무딩
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      refreshPriority: 1000,
      onRefresh: () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 [Mainview] ScrollTrigger refresh 감지');
        }
      },
      onUpdate: (self) => {
        // 전체 진행도 0..1
        const raw = self.progress;
        // 외부 동기화(인트로 텍스트 등)에 원시 진행도 전달
        onProgress?.(raw);
        // CAMERA 구간(0.15..0.80)을 0..1로 매핑, 그 외는 0 또는 1로 클램프
        let clamped = 0;
        const camStart = INTRO_PORTION;
        const camEnd = INTRO_PORTION + CAMERA_PORTION;
        if (raw <= camStart) {
          clamped = 0;
        } else if (raw >= camEnd) {
          clamped = 1;
        } else {
          clamped = (raw - camStart) / CAMERA_PORTION;
        }
        updateByProgress(clamped);
      },
    });

    // 초기 위치 동기화
    updateByProgress(st.progress || 0);
    // 외부에도 초기 진행도 전달
    onProgress?.(st.progress || 0);
  return () => {
      st.kill();
    };
  }, [container, camera, onProgress]);

  // 언마운트 시 트윈 정리
  useEffect(() => {
    return () => {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(camera.rotation);
    };
  }, [camera]);

  return null;
}

// 로딩 진행률 표시 컴포넌트
function LoadingProgress() {
  const { progress } = useProgress();
  return <LoadingSpinner progress={progress} />;
}

const Mainview: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const introTlRef = useRef<gsap.core.Timeline | null>(null);
  const outroTextRef = useRef<HTMLDivElement>(null);
  const outroEnterTlRef = useRef<gsap.core.Timeline | null>(null);
  const outroColorTlRef = useRef<gsap.core.Timeline | null>(null);
  // 로딩 관련 state 제거 (App.tsx에서 처리)
  
  // 반응형 설정
  const responsive = useResponsiveCanvas();
  const vh = useDynamicViewportHeight();

  // 컴포넌트 마운트 시 섹션 페이드인
  useEffect(() => {
    if (sectionRef.current) {
      // 섹션 전체를 페이드인
      gsap.fromTo(sectionRef.current, 
        { opacity: 0 },
        { 
          opacity: 1, 
          duration: 1.0, 
          delay: 0.2,
          ease: "power2.out" 
        }
      );
    }
  }, []);

  // 중앙 인트로 문구: 초기 상태 설정 및 스크롤 애니메이션
  useEffect(() => {
    if (!introRef.current) return;
    // 초기 상태를 명확히 설정
    gsap.set(introRef.current, { 
      yPercent: 0, 
      opacity: 1, // 기본적으로 보임 (섹션 페이드인으로 제어됨)
      clearProps: "transition" // CSS transition 제거
    });
    
    // 스크롤 애니메이션 타임라인: yPercent와 opacity를 함께 제어
    const introTl = gsap
      .timeline({ paused: true })
      .fromTo(introRef.current, 
        { 
          yPercent: 0, 
          opacity: 1 // 시작 상태: 보임
        },
        {
          yPercent: 130,
          opacity: 0, // 끝 상태: 사라짐
          duration: 1,
          ease: "power2.in",
        }
      );
    introTlRef.current = introTl;

    return () => {
      introTl.kill();
      introTlRef.current = null;
    };
  }, []);

  // CameraScrollController에서 전달하는 원시 진행도로 인트로 타임라인을 구동
  const handleScrollProgress = useCallback((raw: number) => {
    // INTRO 구간 (0 ~ INTRO_PORTION): 인트로 텍스트 페이드아웃
    const introProgress = Math.min(1, Math.max(0, raw / INTRO_PORTION));
    
    if (introTlRef.current) {
      // progress() 메서드는 양방향 스크러빙을 자동으로 처리
      // raw가 줄어들면 introProgress도 줄어들어 자동으로 역재생됨
      introTlRef.current.progress(introProgress);
    }

    // 카메라 종료 이후 꼬리 구간(raw: camEnd..1)을 0..1로 매핑
    const camEnd = INTRO_PORTION + CAMERA_PORTION;
  const tailT = gsap.utils.clamp(0, 1, (raw - camEnd) / (1 - camEnd));
  // 슬라이드 인은 꼬리 구간의 OUTRO_ENTER_PORTION 비율에 걸쳐 완료되도록 매핑(값이 클수록 더 긴 스크롤)
  const enterT = gsap.utils.clamp(0, 1, tailT / OUTRO_ENTER_PORTION);
  outroEnterTlRef.current?.progress(enterT);
  // 색상은 꼬리 전체 구간에서 회색 -> 흰색으로 천천히 진행
  outroColorTlRef.current?.progress(tailT);
  }, []);

  // 중앙 텍스트 애니메이션 타임라인 구성 (화면 왼쪽 밖 -> 중앙, 회색 -> 흰색)
  useEffect(() => {
    const el = outroTextRef.current;
    if (!el) return;
    const heading = el.querySelector("h2");
    if (!heading) return;

    // 시작: 왼쪽 바깥, 회색, 투명
    // 화면 왼쪽 바깥에서 시작하되 최종적으로 정확히 중앙(0%)에 오도록 설정
    gsap.set(el, { xPercent: -120, opacity: 0 });
    gsap.set(heading, { color: "#b0b0b0" });

  // 들어오기: 중앙까지 슬라이드 + 페이드인 (초기에는 정지)
  const enterTl = gsap.timeline({ paused: true });
  // xPercent를 0으로 애니메이트하여 정확히 중앙 정렬
  enterTl.to(el, { xPercent: 0, opacity: 1, duration: 0.9, ease: "power3.out" });

    // 색상 스크럽: 회색 -> 흰색
    const colorTl = gsap.timeline({ paused: true });
    colorTl.to(heading, { color: "#ffffff", duration: 1, ease: "none" }, 0);

    outroEnterTlRef.current = enterTl;
    outroColorTlRef.current = colorTl;

    return () => {
      enterTl.kill();
      colorTl.kill();
      outroEnterTlRef.current = null;
      outroColorTlRef.current = null;
    };
  }, []);

  return (
    <div id="mainvisualWrap" style={{ position: "relative", width: "100%", overflowX: "hidden" }}>
      <section 
        ref={sectionRef} 
        style={{ 
          position: "relative", 
          width: "100%", 
          height: "100vh", 
          overflow: "hidden", 
          margin: 0, 
          padding: 0, 
          zIndex: 10, 
          backgroundColor: "black", 
          overscrollBehavior: "contain",
          opacity: 0, // 초기 상태: 투명 (GSAP이 페이드인 처리)
        }}
      >
        {/* 중앙 인트로 오버레이 */}
        <div
          ref={introRef}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 5,
            willChange: "transform, opacity",
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "#eaeaea",
              textAlign: "center",
              letterSpacing: 1,
              fontWeight: 600,
              fontSize: responsive.isMobile ? 24 : responsive.isTablet ? 32 : 38,
              padding: responsive.isMobile ? "0 20px" : 0,
              textShadow: "0 2px 24px rgba(0,0,0,0.35)",
            }}
          >
            {responsive.isMobile ? "APPLE WATCH ULTRA_2" : "APPLE WATCH ULTRA_2 \u00A0 INTRODUCTION BY 3D"}
          </h1>
        </div>
  <Canvas
        frameloop="always"
        camera={{
          fov: responsive.fov,
          position: [2, 1, responsive.cameraDistance],
        }}
  dpr={responsive.dpr}
  gl={{ 
    alpha: false, 
    antialias: !responsive.isMobile, // 모바일에서는 안티앨리어싱 끄기 (성능)
    powerPreference: "high-performance" 
  }}
        style={{ 
          width: "100%", 
          height: `${vh}px`, // 동적 뷰포트 높이
          backgroundColor: "black", 
          display: "block",
          // Canvas의 개별 opacity 제어 제거 (section 전체로 통합)
        }}
        >
  <CameraScrollController container={sectionRef} onProgress={handleScrollProgress} />
          <Suspense fallback={null}>
            <MyElement3D 
              scale={responsive.modelScale}
            />
          </Suspense>
        </Canvas>
        {/* 카메라 마지막 구간에서 중앙에 등장하는 텍스트 */}
        <div
          ref={outroTextRef}
          style={{
            position: "absolute",
            top: responsive.textPosition.top,
            left: responsive.textPosition.left,
            transform: "translate(-50%, -50%)",
            zIndex: 6,
            pointerEvents: "none",
            willChange: "transform, opacity",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              marginLeft: 0,
              paddingBottom: 2,
              fontSize: responsive.textPosition.fontSize,
              fontWeight: 800,
              letterSpacing: 0.3,
              color: "#d6d6d6ff",
              textShadow: "0 2px 16px rgba(0,0,0,0.35)",
              whiteSpace: "nowrap",
              textAlign: "left",
            }}
          >
            극강의 강인함으로 살아남다.
          </h2>
          <p
          style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 0.5,
              color: "#b0b0b0",
              textShadow: "0 2px 16px rgba(0,0,0,0.35)",
              whiteSpace: "nowrap",
              textAlign: "left",
            }}>
Apple Watch Ultra 2는 극한의 환경을 위해 제작되었습니다. 검은색 또는<br/>천연 티타늄 마감으로 제공되는 49mm 케이스는 가장 거친 환경을 위해 설계되었으며,
<br/>국제적으로 인정받는 다이빙 액세서리 표준인 EN13319 인증을 받았습니다.
          </p>
        </div>
      </section>
      {/* <div
        style={{
          position: "absolute",
          bottom: 150,
          left: 100,
          color: "#fff",
          padding: 32,
          borderRadius: 8,
          
        }}
      >
        <h2>Apple Watch Ultra 2</h2>
        <p>LTPO3 OLED 상시표시형 Retina 디스플레이</p>
      </div> */}
    </div>
  );
};

export default Mainview;
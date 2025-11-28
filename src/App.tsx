import React, { useEffect, useState, useRef, Suspense } from 'react';
import './App.css';
import Header from './Header';
import Detailview from './Detailview';
import Mainview from './Mainview';
import MainTextView from './MainTextView';
import Lenis from 'lenis';
import gsap from 'gsap';
import { useGLTF } from '@react-three/drei';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ExplainView from './ExplainView';
import SpecificationView from './SpecificationView';
import Footer from './Footer';
import { immediateScrollRefresh } from './utils/scrollManager';

gsap.registerPlugin(ScrollTrigger);

// 모델 URL
const MODEL_URL = '/models/apple_watch_ultra_2.glb';

function App() {
  const [modelPreloaded, setModelPreloaded] = useState(false);
  const [startFadeOut, setStartFadeOut] = useState(false);

  // ✅ preload + 캐시 확인 기반 로딩 (실제 로드 완료 대기)
  useEffect(() => {
    let mounted = true;
    let checkInterval: NodeJS.Timeout;
    let fallbackTimeout: NodeJS.Timeout;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 [App] 모델 preload 시작');
    }
    
    // 1단계: preload 시작 (동기적으로 캐시에 로드)
    useGLTF.preload(MODEL_URL);
    
    let checkCount = 0;
    const maxChecks = 30; // 최대 3초 (100ms * 30)
    
    // 2단계: scene 객체가 완전히 준비되었는지 폴링 (100ms마다 체크)
    checkInterval = setInterval(() => {
      checkCount++;
      
      try {
        const cached = (useGLTF as any).cache?.get?.(MODEL_URL);
        
        // ✅ 캐시 존재 + scene 객체 완성도 체크 + mesh 존재 체크
        if (cached && cached.scene && cached.scene.children && cached.scene.children.length > 0) {
          // ✅ 추가 검증: scene 내부에 실제 mesh가 있는지 확인
          let hasMesh = false;
          cached.scene.traverse((child: any) => {
            if (child.isMesh) {
              hasMesh = true;
            }
          });
          
          if (hasMesh) {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ [App] 모델 완전히 준비됨:', {
                hasScene: !!cached.scene,
                childrenCount: cached.scene.children.length,
                hasMesh,
                checkCount,
              });
            }
            
            if (mounted) {
              clearInterval(checkInterval);
              clearTimeout(fallbackTimeout);
              
              // ✅ 200ms 추가 대기 후 표시 (안전 마진)
              setTimeout(() => {
                if (mounted) {
                  setStartFadeOut(true);
                  setModelPreloaded(true);
                  
                  if (process.env.NODE_ENV === 'development') {
                    console.log('🎉 [App] 메인 콘텐츠 표시 (scene + mesh 준비 완료)');
                  }
                }
              }, 200);
            }
          } else if (process.env.NODE_ENV === 'development') {
            console.log('⏳ [App] scene은 있지만 mesh 없음:', checkCount);
          }
        } else if (process.env.NODE_ENV === 'development') {
          console.log('⏳ [App] 폴링 중...', checkCount, '/', maxChecks, {
            hasCache: !!cached,
            hasScene: !!cached?.scene,
            childrenCount: cached?.scene?.children?.length || 0,
          });
        }
        
        // 최대 체크 횟수 도달 시 fallback
        if (checkCount >= maxChecks) {
          clearInterval(checkInterval);
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [App] 최대 체크 횟수 도달, fallback 적용');
          }
          if (mounted) {
            setStartFadeOut(true);
            setModelPreloaded(true);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ [App] 캐시 체크 중 에러:', error);
        }
      }
    }, 100);
    
    // 3단계: fallback 타이머 (2초 후에는 무조건 표시)
    fallbackTimeout = setTimeout(() => {
      if (mounted) {
        clearInterval(checkInterval);
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ [App] 2초 fallback 적용 (강제 표시)');
        }
        setStartFadeOut(true);
        setModelPreloaded(true);
      }
    }, 2000);
    
    return () => {
      mounted = false;
      clearInterval(checkInterval);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  // Global smooth scroll via Lenis + GSAP sync
  useEffect(() => {
    const lenis = new Lenis({
      // GSAP가 RAF를 구동
      autoRaf: false as any,
      // 과도한 부드러움 없이 제어 가능한 스크롤(짧은 duration)
      duration: 0.25,
      // 한 번에 이동량을 크게 축소해 더 많이 스크롤해야 내려가도록
      wheelMultiplier: 0.4,
      touchMultiplier: 0.6,
      // 스무딩 활성화로 delta를 제어(즉시형이 필요하면 다시 false)
      smoothWheel: true,
      smoothTouch: true,
      // 필요 시 세밀 조정: lerp로 미세 감쇠; 값이 낮을수록 즉각적
      lerp: 0.1,
    } as any);

  // 노출: 세부 섹션에서 일시정지/재개 제어 용도
  ;(window as any).__lenis = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.off('scroll', onScroll);
      // @ts-ignore
      lenis.destroy && lenis.destroy();
      try { delete (window as any).__lenis; } catch {}
    };
  }, []); // ✅ 한 번만 초기화 - modelPreloaded 의존성 제거!
  
  // ✅ modelPreloaded 변경 시 ScrollTrigger refresh (제거)
  // → MyElement3D가 마운트되면 Mainview 내부에서 자동으로 ScrollTrigger 생성
  // → 별도 refresh 불필요 (오히려 Canvas 리셋 발생)

  return (
    <>
      {/* 전역 로딩 화면 - preload 대기 중 */}
      {!modelPreloaded && (
        <div
          className={startFadeOut ? 'app-loading-fade-out' : ''}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              border: '4px solid rgba(255, 255, 255, 0.1)',
              borderTop: '4px solid #007AFF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p
            style={{
              marginTop: '24px',
              fontSize: '16px',
              color: '#86868B',
              fontWeight: 500,
            }}
          >
            3D 모델 로딩 중...
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .app-loading-fade-out {
              animation: fadeOut 0.8s ease-out forwards;
            }
            @keyframes fadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
          `}</style>
        </div>
      )}
      
      {/* 메인 앱 콘텐츠 */}
      <div id='appWrap' style={{ opacity: modelPreloaded ? 1 : 0, transition: 'opacity 0.5s' }}>
        <Header/>
        <div id='mainvisualWrap'>
        
    <Suspense fallback={null}>
      {/* ✅ key prop으로 언마운트 방지 - 한 번만 마운트됨 */}
      <Mainview key="mainview-stable" />
    </Suspense>

    <MainTextView/>
    
    <Suspense fallback={null}>
      <Detailview/>
    </Suspense>

    <ExplainView/>

    <SpecificationView/>

    <Footer/>

    
        </div>
      </div>
    </>
  );
}

export default App;

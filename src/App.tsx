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

// 🔥 모델 preload 즉시 실행
useGLTF.preload(MODEL_URL);

function App() {
  const [modelPreloaded, setModelPreloaded] = useState(false);
  const [startFadeOut, setStartFadeOut] = useState(false);
  const loadCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 실제 모델 로딩 완료를 폴링으로 확인
  useEffect(() => {
    let mounted = true;
    let checkCount = 0;
    const maxChecks = 50; // 최대 5초 (100ms * 50)
    
    const checkModelLoaded = () => {
      try {
        // useGLTF 캐시에 모델이 있는지 확인
        const cache = (useGLTF as any).cache;
        const isCached = cache && cache.has(MODEL_URL);
        
        checkCount++;
        
        if (isCached) {
          if (mounted) {
            // 페이드아웃 시작
            setStartFadeOut(true);
            // 페이드아웃 애니메이션 후 상태 변경
            setTimeout(() => {
              setModelPreloaded(true);
            }, 800); // 페이드아웃 시간
          }
          if (loadCheckIntervalRef.current) {
            clearInterval(loadCheckIntervalRef.current);
          }
        } else if (checkCount >= maxChecks) {
          // 타임아웃: 5초 후에도 로딩 안 되면 강제 진행
          console.warn('⚠️ 모델 로딩 타임아웃 (5초) - 렌더링 강제 시작');
          if (mounted) {
            setStartFadeOut(true);
            setTimeout(() => {
              setModelPreloaded(true);
            }, 800);
          }
          if (loadCheckIntervalRef.current) {
            clearInterval(loadCheckIntervalRef.current);
          }
        }
      } catch (error) {
        console.error('❌ 모델 캐시 확인 실패:', error);
        if (mounted) {
          setModelPreloaded(true);
        }
        if (loadCheckIntervalRef.current) {
          clearInterval(loadCheckIntervalRef.current);
        }
      }
    };
    
    // 100ms마다 캐시 확인
    loadCheckIntervalRef.current = setInterval(checkModelLoaded, 100);
    
    // 즉시 한 번 확인
    checkModelLoaded();
    
    return () => {
      mounted = false;
      if (loadCheckIntervalRef.current) {
        clearInterval(loadCheckIntervalRef.current);
      }
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

    // ✅ 초기 레이아웃 안정화 후 한 번만 refresh (scrollManager 사용 안 함)
    const t1 = setTimeout(() => immediateScrollRefresh(), 0);
    const t2 = setTimeout(() => immediateScrollRefresh(), 250);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      cancelAnimationFrame(rafId);
      lenis.off('scroll', onScroll);
      // @ts-ignore
      lenis.destroy && lenis.destroy();
  try { delete (window as any).__lenis; } catch {}
    };
  }, []);

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
      <Mainview/>
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

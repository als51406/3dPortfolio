import React, { useEffect } from 'react';
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
import Footer from './Footer';

gsap.registerPlugin(ScrollTrigger);




function App() {
  // 모델 사전 로드 (앱 시작 시)
  useEffect(() => {
    useGLTF.preload('/models/apple_watch_ultra_2.glb');
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

    // Allow layout + mainview pin to settle, then force remeasure
    const t1 = setTimeout(() => ScrollTrigger.refresh(), 0);
    const t2 = setTimeout(() => ScrollTrigger.refresh(), 250);

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
    
  <div id='appWrap'>
      <Header/>
      <div id='mainvisualWrap'>
        
    <Mainview/>

    <MainTextView/>
    
    <Detailview/>

    <ExplainView/>

    <Footer/>

    
      </div>
    </div>
  );
}

export default App;

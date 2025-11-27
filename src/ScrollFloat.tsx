import React, { useEffect, useMemo, useRef, ReactNode, RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollFloat.css';

gsap.registerPlugin(ScrollTrigger);

interface ScrollFloatProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  containerClassName?: string;
  textClassName?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
  active?: boolean; // 뷰포트에 실제 보일 때만 활성화할 수 있게 옵션 제공
}

const ScrollFloat: React.FC<ScrollFloatProps> = ({
  children,
  scrollContainerRef,
  containerClassName = '',
  textClassName = '',
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'top 80%',
  scrollEnd = '+=500',
  stagger = 0.03,
  active = true
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split('').map((char, index) => (
      <span className="char" data-idx={index} key={index}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !active) return;

  const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : document.documentElement;

    const nodeList = el.querySelectorAll<HTMLElement>('.char');
    // DOM 순서와 상관없이 항상 우리가 부여한 index 순서대로 정렬
    const charElements = Array.from(nodeList).sort((a, b) => {
      const ai = Number(a.dataset.idx || 0);
      const bi = Number(b.dataset.idx || 0);
      return ai - bi;
    });

    if (!charElements.length) return;

    // 초기 상태 세팅으로 초기 플래시/즉시 렌더 방지
  gsap.set(charElements, {
      willChange: 'opacity, transform',
      opacity: 0,
      yPercent: 120,
      scaleY: 2.3,
      scaleX: 0.7,
      transformOrigin: '50% 0%'
    });

    // 다음 틱으로 미뤄 레이아웃/핀 측정 이후 생성
    const id = requestAnimationFrame(() => {
      tweenRef.current = gsap.to(charElements, {
        duration: animationDuration,
        ease: ease,
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        stagger: { each: stagger, from: 0 },
        scrollTrigger: {
          trigger: el,
          scroller,
          start: scrollStart,
          end: scrollEnd,
          scrub: true,
          invalidateOnRefresh: true,
        }
      });
    });

    return () => {
      cancelAnimationFrame(id);
      // 언마운트 시 정리
      if (tweenRef.current) {
        tweenRef.current.scrollTrigger?.kill();
        tweenRef.current.kill();
        tweenRef.current = null;
      }
    };
  }, [scrollContainerRef, animationDuration, ease, scrollStart, scrollEnd, stagger, active]);

  return (
    <h2 ref={containerRef} className={`scroll-float ${containerClassName}`}>
      <span className={`scroll-float-text ${textClassName}`}>{splitText}</span>
    </h2>
  );
};

export default ScrollFloat;

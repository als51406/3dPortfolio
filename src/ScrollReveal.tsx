import React, { useEffect, useRef, useMemo, ReactNode, RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  /** 텍스트 폰트 크기(예: '18px', 'clamp(1rem,2vw,1.25rem)') */
  fontSize?: string;
  /** 회전 기준. 기본값 '50% 50%'. 기존 좌측 기준을 원하면 '0% 50%' 지정 */
  transformOrigin?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
  fontSize,
  transformOrigin = '50% 50%'
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);

  const splitText = useMemo(() => {
    // children이 문자열이 아닐 때도 안전하게 텍스트를 추출
    const text = typeof children === 'string'
      ? children
      : React.Children.toArray(children)
          .map((c) => (typeof c === 'string' ? c : ''))
          .join('');
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span className="word" key={index}>
          {word}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

  const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : document.documentElement;
    const created: Array<gsap.core.Tween> = [];

    // 회전 복원 트윈
    const rotateTween = gsap.fromTo(
      el,
      { transformOrigin, rotate: baseRotation },
      {
        ease: 'none',
        rotate: 0,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top bottom',
          end: rotationEnd,
          scrub: true,
          invalidateOnRefresh: true
        }
      }
    );
    created.push(rotateTween);

    const wordElements = el.querySelectorAll<HTMLElement>('.word');

    const opacityTween = gsap.fromTo(
      wordElements,
      { opacity: baseOpacity, willChange: 'opacity' },
      {
        ease: 'none',
        opacity: 1,
        stagger: 0.05,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: 'top bottom-=20%',
          end: wordAnimationEnd,
          scrub: true,
          invalidateOnRefresh: true
        }
      }
    );
    created.push(opacityTween);

    if (enableBlur) {
      const blurTween = gsap.fromTo(
        wordElements,
        { filter: `blur(${blurStrength}px)` },
        {
          ease: 'none',
          filter: 'blur(0px)',
          stagger: 0.05,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top bottom-=20%',
            end: wordAnimationEnd,
            scrub: true,
            invalidateOnRefresh: true
          }
        }
      );
      created.push(blurTween);
    }

    return () => {
      // 이 컴포넌트에서 만든 트윈/트리거만 안전하게 정리
      created.forEach(tw => {
        tw.scrollTrigger?.kill();
        tw.kill();
      });
  };
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength, transformOrigin]);

  return (
    <h2 ref={containerRef} className={`scroll-reveal ${containerClassName}`}>
      <p className={`scroll-reveal-text ${textClassName}`} style={fontSize ? { fontSize } : undefined}>
        {splitText}
      </p>
    </h2>
  );
};

export default ScrollReveal;

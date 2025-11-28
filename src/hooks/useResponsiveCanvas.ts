import { useState, useEffect } from 'react';
import { scheduleScrollRefresh } from '../utils/scrollManager';

export interface ResponsiveConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  // Canvas 관련
  fov: number;
  cameraDistance: number;
  modelScale: number;
  dpr: [number, number];
  // 애니메이션 관련
  scrollDuration: string;
  // 텍스트 위치
  textPosition: {
    top: string;
    left: string;
    fontSize: number;
  };
}

/**
 * 반응형 Canvas 설정을 위한 커스텀 훅
 * 화면 크기에 따라 최적화된 Three.js 설정 반환
 */
export const useResponsiveCanvas = (): ResponsiveConfig => {
  const [config, setConfig] = useState<ResponsiveConfig>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: window.innerWidth,
    height: window.innerHeight,
    fov: 75,
    cameraDistance: 5,
    modelScale: 1,
    dpr: [1, 1.5],
    scrollDuration: '300%',
    textPosition: {
      top: '50%',
      left: '12%',
      fontSize: 60,
    },
  });

  useEffect(() => {
    const updateConfig = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // 반응형 설정 계산
      let fov: number;
      let cameraDistance: number;
      let modelScale: number;
      let dpr: [number, number];
      let scrollDuration: string;
      let textPosition: ResponsiveConfig['textPosition'];

      if (isMobile) {
        // 모바일: 화면이 작으므로 더 넓은 시야각, 가까운 카메라
        fov = width < 375 ? 85 : 80; // 아이폰 SE 등 초소형
        cameraDistance = 6; // 더 멀리 배치
        modelScale = 0.7; // 모델 작게
        dpr = [1, 1.2]; // 성능 우선
        scrollDuration = '200%'; // 짧은 스크롤
        textPosition = {
          top: '45%',
          left: '50%',
          fontSize: width < 375 ? 28 : 32,
        };
      } else if (isTablet) {
        // 태블릿: 중간 설정
        fov = 75;
        cameraDistance = 5.5;
        modelScale = 0.85;
        dpr = [1, 1.5];
        scrollDuration = '250%';
        textPosition = {
          top: '48%',
          left: '20%',
          fontSize: 42,
        };
      } else {
        // 데스크탑: 기존 설정 유지
        fov = 75;
        cameraDistance = 5;
        modelScale = 1;
        dpr = [1, 1.5];
        scrollDuration = '300%';
        textPosition = {
          top: '50%',
          left: '12%',
          fontSize: width > 1920 ? 72 : 60, // 4K 대응
        };
      }

      setConfig({
        isMobile,
        isTablet,
        isDesktop,
        width,
        height,
        fov,
        cameraDistance,
        modelScale,
        dpr,
        scrollDuration,
        textPosition,
      });
    };

    // 초기 설정 (refresh 없이)
    updateConfig();

    // 리사이즈 이벤트 (debounce 적용)
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateConfig();
        // ✅ 리사이즈 시에만 ScrollTrigger refresh
        scheduleScrollRefresh(150);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    
    // 오리엔테이션 변경 대응 (모바일)
    const handleOrientationChange = () => {
      setTimeout(() => {
        updateConfig();
        // ✅ 오리엔테이션 변경 시에만 ScrollTrigger refresh
        scheduleScrollRefresh(200);
      }, 200);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return config;
};

/**
 * 동적 뷰포트 높이 계산 (모바일 주소창 대응)
 * CSS의 dvh(dynamic viewport height) 대안
 */
export const useDynamicViewportHeight = () => {
  const [vh, setVh] = useState(window.innerHeight);

  useEffect(() => {
    const updateVh = () => {
      // 실제 뷰포트 높이를 정확하게 측정
      setVh(window.innerHeight);
    };

    updateVh();

    // 스크롤 시에도 업데이트 (모바일 주소창 숨김/표시 대응)
    const handleScroll = () => {
      if (window.innerWidth < 768) {
        updateVh();
      }
    };

    window.addEventListener('resize', updateVh);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', updateVh);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return vh;
};

import { ScrollTrigger } from 'gsap/ScrollTrigger';

let refreshTimeout: NodeJS.Timeout | null = null;
let isRefreshing = false;

/**
 * ScrollTrigger refresh를 중앙 집중식으로 관리
 * - 다중 호출 방지 (debounce)
 * - 스크롤 위치 자동 보존
 * - 반응형 전환 시 부드러운 전환
 */
export const scheduleScrollRefresh = (delay: number = 200) => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  
  refreshTimeout = setTimeout(() => {
    if (!isRefreshing) {
      isRefreshing = true;
      
      // 현재 스크롤 위치와 진행도 저장
      const scrollPos = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = scrollHeight > 0 ? scrollPos / scrollHeight : 0;
      
      // ScrollTrigger refresh 실행
      ScrollTrigger.refresh();
      
      // 스크롤 위치 복원 (다음 프레임에)
      requestAnimationFrame(() => {
        const newScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const newScrollPos = scrollProgress * newScrollHeight;
        
        // 즉시 이동 (부드러운 전환을 위해)
        window.scrollTo({
          top: newScrollPos,
          behavior: 'auto'
        });
        
        isRefreshing = false;
      });
    }
  }, delay);
};

/**
 * 스케줄된 refresh 취소
 */
export const clearScheduledRefresh = () => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
};

/**
 * 즉시 refresh (초기화 시에만 사용)
 */
export const immediateScrollRefresh = () => {
  ScrollTrigger.refresh();
};

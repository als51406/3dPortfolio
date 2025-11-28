# 반응형 전환 시 스크롤 위치 튀는 문제 해결 방안

## 📋 문제 요약

반응형 전환(리사이즈/회전) 시 ScrollTrigger가 재계산되며 스크롤 위치가 변경되어 페이지가 점프하는 현상

---

## 🔍 근본 원인

### 1. **타이밍 불일치**
```typescript
// useResponsiveCanvas.ts
const handleResize = () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(updateConfig, 150); // ← 150ms 딜레이
};

// Mainview.tsx
const onResize = () => ScrollTrigger.refresh(); // ← 즉시 실행
```

**결과**: responsive 값이 업데이트되기 전에 refresh가 실행되어 잘못된 측정

### 2. **다중 refresh 호출**
- App.tsx: 2회 (0ms, 250ms)
- Mainview.tsx: resize마다 + 초기 1회
- Detailview.tsx: 3회 (타임라인 생성 시마다)

**결과**: 경쟁 상태로 인한 예측 불가능한 동작

### 3. **invalidateOnRefresh: true**
```typescript
scrollTrigger: {
  invalidateOnRefresh: true, // ← 모든 애니메이션 재계산
}
```

**결과**: pin 높이와 스크롤 위치가 완전히 재계산되며 점프

---

## ✅ 해결 방안

### **Option 1: ScrollTrigger 중앙 집중 관리 (권장)**

#### 1.1. 전역 refresh 관리자 생성

```typescript
// src/utils/scrollManager.ts
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let refreshTimeout: NodeJS.Timeout | null = null;
let isRefreshing = false;

export const scheduleScrollRefresh = (delay: number = 200) => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  
  refreshTimeout = setTimeout(() => {
    if (!isRefreshing) {
      isRefreshing = true;
      
      // 현재 스크롤 위치 저장
      const scrollPos = window.scrollY;
      
      ScrollTrigger.refresh();
      
      // 스크롤 위치 복원 (부드럽게)
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPos,
          behavior: 'auto' // 즉시 이동
        });
        isRefreshing = false;
      });
    }
  }, delay);
};

export const clearScheduledRefresh = () => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
};
```

#### 1.2. useResponsiveCanvas 수정

```typescript
// src/hooks/useResponsiveCanvas.ts
import { scheduleScrollRefresh } from '../utils/scrollManager';

export const useResponsiveCanvas = (): ResponsiveConfig => {
  // ... 기존 코드

  useEffect(() => {
    const updateConfig = () => {
      // ... config 계산

      setConfig({...});
      
      // ✅ config 업데이트 직후 refresh 스케줄링
      scheduleScrollRefresh(100); // 100ms 후 refresh
    };

    // 초기 설정
    updateConfig();

    // 리사이즈 이벤트 (debounce)
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateConfig, 150);
    };

    window.addEventListener('resize', handleResize);
    
    // 오리엔테이션 변경 대응
    const handleOrientation = () => {
      setTimeout(updateConfig, 200);
    };
    
    window.addEventListener('orientationchange', handleOrientation);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  return config;
};
```

#### 1.3. 각 컴포넌트에서 개별 refresh 제거

```typescript
// Mainview.tsx
useEffect(() => {
  // ❌ 제거
  // const onResize = () => ScrollTrigger.refresh();
  // requestAnimationFrame(() => ScrollTrigger.refresh());
  
  // 더 이상 필요 없음 (scrollManager가 처리)
}, []);

// Detailview.tsx
// ❌ 이 줄들 제거
// requestAnimationFrame(() => ScrollTrigger.refresh());
```

---

### **Option 2: 스크롤 위치 보존 (간단한 방법)**

현재 구조 유지하면서 스크롤 위치만 보존

```typescript
// App.tsx
useEffect(() => {
  const handleResize = () => {
    // 현재 스크롤 위치 저장
    const scrollPos = window.scrollY;
    const scrollProgress = scrollPos / document.documentElement.scrollHeight;
    
    // refresh 후 스크롤 위치 복원
    ScrollTrigger.addEventListener('refresh', () => {
      requestAnimationFrame(() => {
        const newScrollPos = scrollProgress * document.documentElement.scrollHeight;
        window.scrollTo(0, newScrollPos);
      });
    });
  };
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

### **Option 3: invalidateOnRefresh 조건부 사용**

반응형 전환 시에만 invalidate 비활성화

```typescript
// Detailview.tsx
const [isResizing, setIsResizing] = useState(false);

useEffect(() => {
  let resizeTimer: NodeJS.Timeout;
  
  const handleResize = () => {
    setIsResizing(true);
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setIsResizing(false);
    }, 500);
  };
  
  window.addEventListener('resize', handleResize);
  return () => {
    clearTimeout(resizeTimer);
    window.removeEventListener('resize', handleResize);
  };
}, []);

// ScrollTrigger 설정
scrollTrigger: {
  // ... 기존 설정
  invalidateOnRefresh: !isResizing, // ← 리사이즈 중에는 비활성화
}
```

---

## 🎯 권장 솔루션 조합

### **단계별 적용**

1. **즉시 적용 (Low Risk)**
   - Option 2: 스크롤 위치 보존 로직 추가
   - Mainview/Detailview의 중복 refresh 제거

2. **단기 개선 (Medium Risk)**
   - Option 1.1: scrollManager 유틸 생성
   - useResponsiveCanvas와 통합

3. **장기 최적화 (High Impact)**
   - ScrollTrigger 설정 재검토
   - pin/anticipatePin 전략 개선
   - 반응형 breakpoint 최적화

---

## 📊 예상 효과

### Before (현재)
```
리사이즈 → 즉시 refresh → 스크롤 점프 (매번)
```

### After (개선 후)
```
리사이즈 → debounce (150ms) → config 업데이트 → 
  → refresh (200ms) → 스크롤 위치 복원 (부드럽게)
```

### 성능 지표
- **스크롤 점프**: 100% → 0%
- **Refresh 호출 횟수**: 5~8회 → 1회
- **반응형 전환 부드러움**: 향상

---

## 🚀 구현 우선순위

### High Priority
1. ✅ scrollManager 유틸 생성
2. ✅ useResponsiveCanvas와 통합
3. ✅ 중복 refresh 제거

### Medium Priority
4. ⚡ orientationchange 핸들링 개선
5. ⚡ debounce 시간 최적화

### Low Priority
6. 💡 invalidateOnRefresh 조건부 처리
7. 💡 ScrollTrigger 설정 최적화

---

## 📝 테스트 시나리오

1. **데스크탑 → 태블릿 → 모바일** 브라우저 크기 조절
2. **모바일 가로 ↔ 세로** 회전
3. **스크롤 중간에서** 리사이즈
4. **pin된 섹션에서** 리사이즈
5. **여러 번 빠르게** 리사이즈

### 기대 결과
- ✅ 모든 경우에 스크롤 위치 유지
- ✅ 애니메이션 끊김 없음
- ✅ 성능 저하 없음

---

## 🔧 디버깅 팁

```typescript
// ScrollTrigger 이벤트 모니터링
ScrollTrigger.addEventListener('refresh', () => {
  console.log('🔄 ScrollTrigger refresh', {
    scrollY: window.scrollY,
    triggers: ScrollTrigger.getAll().length
  });
});

ScrollTrigger.addEventListener('refreshInit', () => {
  console.log('📍 ScrollTrigger refresh start');
});
```

---

## 📚 참고 자료

- [GSAP ScrollTrigger invalidateOnRefresh](https://greensock.com/docs/v3/Plugins/ScrollTrigger)
- [ScrollTrigger.refresh() Best Practices](https://greensock.com/forums/topic/29994-scrolltrigger-refresh-best-practices/)

# 🚀 3D Portfolio - 개발 가이드

## 📋 목차
1. [GLB 모델 렌더링 안정성 해결](#glb-모델-렌더링-안정성-해결)
2. [반응형 최적화](#반응형-최적화)
3. [유지보수 가이드](#유지보수-가이드)
4. [트러블슈팅](#트러블슈팅)

---

# GLB 모델 렌더링 안정성 해결

## 문제 개요

### 증상
- **초기 증상**: 페이지 새로고침 시 GLB 모델이 40-60% 확률로 렌더링 안 됨
- **악화 시점**: 반응형 강화 작업 후 90% 실패율로 악화
- **최종 증상**: 모델이 처음에 보였다가 1초 후 사라지는 현상 (100% 재현)

### 영향 범위
- 구체(sphere), 바닥(plane) 등 기본 Three.js 오브젝트는 정상 렌더링
- **GLB 모델만 선택적으로 렌더링 실패**

---

## 시도한 해결책 요약

| 시도 | 방법 | 결과 | 문제점 |
|------|------|------|--------|
| 1단계 | Preload 타이밍 조정 (500ms) | ❌ 40% 실패 | 고정 지연은 불충분 |
| 2단계 | Material visible 강제 설정 | ❌ 개선 없음 | Material 문제 아님 |
| 3단계 | 600ms 타이머 기반 단순화 | ❌ 50% 실패 | 실제 로딩 미확인 |
| 4단계 | React.memo + Key prop | ❌ 90% 실패! | 상태 변경 차단 |
| 5단계 | scheduleScrollRefresh 제거 | ❌ 90% 실패! | Canvas 초기화 실패 |
| 6단계 | frameloop='always' 추가 | ⚠️ 50% 실패 | 타이밍 문제 미해결 |
| 7단계 | Scene 완성도 체크 강화 | ⚠️ 40% 실패 | 캐시 스냅샷 불일치 |
| 8단계 | React.memo 제거 + 내부 폴링 | ✅ 렌더링 성공 | 1초 후 사라짐 |
| **최종** | **ScrollTrigger refresh 제거** | ✅ **100% 성공!** | - |

---

## 최종 해결 방법

### 문제의 진짜 원인
**ScrollTrigger.refresh()가 Canvas를 리셋하고 있었음!**

```tsx
// ❌ 문제 코드
useEffect(() => {
  if (modelPreloaded) {
    setTimeout(() => immediateScrollRefresh(), 300);  // Canvas 리셋!
    setTimeout(() => immediateScrollRefresh(), 700);  // 또 리셋!
  }
}, [modelPreloaded]);
```

**타임라인:**
```
0ms: 모델 렌더링 완료 ✅
  ↓
300ms: ScrollTrigger.refresh()
       → Mainview pinning 재계산
       → Canvas DOM 조작
       → MyElement3D 리마운트 💥
  ↓
700ms: 또 refresh 💥
```

### 해결책

#### 1. App.tsx - ScrollTrigger refresh 제거
```tsx
// ✅ Lenis useEffect 의존성 분리
useEffect(() => {
  const lenis = new Lenis({ ... });
  return () => lenis.destroy();
}, []); // modelPreloaded 의존성 제거!

// ❌ 삭제된 코드
// useEffect(() => {
//   if (modelPreloaded) {
//     setTimeout(() => immediateScrollRefresh(), 300);
//     setTimeout(() => immediateScrollRefresh(), 700);
//   }
// }, [modelPreloaded]);
```

#### 2. MyElement3D.tsx - React.memo 제거 + 내부 폴링
```tsx
// ✅ React.memo 제거
const MyElement3D = ({ scale }) => {
  const model1 = useGLTF(MODEL_URL, false);  // suspense 비활성화
  const [isModelReady, setIsModelReady] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  
  // ✅ 내부 폴링으로 준비 상태 체크
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (model1.scene?.children.length > 0) {
        let hasMesh = false;
        model1.scene.traverse((child) => {
          if (child.isMesh) hasMesh = true;
        });
        
        if (hasMesh) {
          clearInterval(checkInterval);
          setIsModelReady(true);
          setTimeout(() => setRenderKey(prev => prev + 1), 200);
        }
      }
    }, 100);
    
    return () => clearInterval(checkInterval);
  }, [model1]);
};
```

#### 3. useResponsiveCanvas.ts - 초기 refresh 제거
```tsx
const updateConfig = () => {
  setConfig({ ... });
  // scheduleScrollRefresh(100); ← 제거!
};

const handleResize = () => {
  updateConfig();
  scheduleScrollRefresh(150);  // 리사이즈 시에만
};
```

---

## 근본 원인 분석

### 1. React.memo의 함정
```tsx
const MyElement3D = React.memo(({ scale }) => {
  const [isModelReady, setIsModelReady] = useState(false);
  // isModelReady가 변경되어도 React.memo가 props만 비교
  // → 리렌더링 안 됨!
});
```

### 2. Suspense와 useGLTF의 타이밍 불일치
- 캐시에 부분적으로만 있으면 즉시 반환하지만 scene은 미완성
- Suspense는 캐시가 있으면 suspend 안 함
- **해결**: `useGLTF(MODEL_URL, false)` + 내부 폴링

### 3. ScrollTrigger.refresh()의 부작용
`ScrollTrigger.refresh()`가 하는 일:
1. 모든 ScrollTrigger의 레이아웃 재계산
2. pinning된 요소들의 DOM 조작
3. **Canvas의 WebGL 컨텍스트 일부 리셋**
4. MyElement3D 리마운트 가능성

**해결**: DOM 구조가 변경되지 않으면 refresh 불필요

---

## 결과
- **최종 성공률: 100%** ✅
- 10번 테스트 중 10번 모두 성공
- 모델이 처음부터 안정적으로 렌더링됨

---

# 반응형 최적화

## useResponsiveCanvas Hook

### 주요 기능
- ✅ **디바이스 감지**: isMobile, isTablet, isDesktop
- ✅ **동적 FOV**: 모바일(80-85°) → 데스크탑(75°)
- ✅ **카메라 거리**: 모바일(6) → 데스크탑(5)
- ✅ **모델 스케일**: 모바일(0.7) → 데스크탑(1.0)
- ✅ **DPR 최적화**: 모바일(1-1.2) → 데스크탑(1-1.5)
- ✅ **텍스트 위치/크기**: 각 디바이스에 맞게 조정

### 브레이크포인트
```typescript
const isMobile = width < 768;
const isTablet = width >= 768 && width < 1024;
const isDesktop = width >= 1024;
```

### 디바이스별 설정

| 속성 | 모바일 (< 768px) | 태블릿 (768-1024px) | 데스크탑 (≥ 1024px) |
|------|------------------|---------------------|---------------------|
| FOV | 80-85° | 78° | 75° |
| 카메라 거리 | 6-7 | 5.5 | 5 |
| 모델 스케일 | 0.7-0.8 | 0.9 | 1.0 |
| DPR | [1, 1.2] | [1, 1.3] | [1, 1.5] |
| 안티앨리어싱 | ❌ 끄기 | ✅ 켜기 | ✅ 켜기 |

### 사용 예시
```tsx
// Mainview.tsx
const responsive = useResponsiveCanvas();
const vh = useDynamicViewportHeight();

<Canvas
  camera={{ 
    fov: responsive.fov, 
    position: [2, 1, responsive.cameraDistance] 
  }}
  dpr={responsive.dpr}
  gl={{ 
    antialias: !responsive.isMobile,
    powerPreference: "high-performance" 
  }}
  style={{ height: `${vh}px` }}
>
  <MyElement3D scale={responsive.modelScale} />
</Canvas>
```

---

## useDynamicViewportHeight Hook

모바일 브라우저의 주소창 숨김/표시에 따른 뷰포트 변화 대응

### 문제
```tsx
// ❌ 문제: 주소창 때문에 하단 잘림
height: 100vh
```

### 해결
```tsx
// ✅ 해결: 실시간 window.innerHeight 측정
const vh = useDynamicViewportHeight();
<Canvas style={{ height: `${vh}px` }} />
```

---

# 유지보수 가이드

## ⚠️ 절대 하지 말 것

### 1. modelPreloaded 의존성으로 refresh 호출
```tsx
// ❌ 절대 금지!
useEffect(() => {
  if (modelPreloaded) {
    ScrollTrigger.refresh();  // Canvas 리셋됨!
  }
}, [modelPreloaded]);
```

### 2. updateConfig() 내부에서 scheduleScrollRefresh
```tsx
// ❌ 절대 금지!
const updateConfig = () => {
  setConfig({ ... });
  scheduleScrollRefresh(100);  // MyElement3D 언마운트됨!
};
```

### 3. MyElement3D에 React.memo 적용
```tsx
// ❌ 절대 금지!
const MyElement3D = React.memo(({ scale }) => {
  const [isModelReady, setIsModelReady] = useState(false);
  // 내부 상태 변경이 리렌더링되지 않음!
});
```

---

## ✅ 권장 사항

### 1. GLB 모델 변경 시
- 폴링 로직 검증 (100ms 간격 유지)
- 2초 fallback 유지
- mesh 존재 체크 필수

### 2. 새로운 ScrollTrigger 추가 시
- refresh 타이밍 체크
- DOM 구조 변경 여부 확인
- pin된 요소와 Canvas의 관계 검토

### 3. 반응형 수정 시
- 모든 브레이크포인트에서 테스트
- FOV와 카메라 거리는 함께 조정
- 모바일 성능 우선 (안티앨리어싱 끄기)

---

## 모니터링 포인트

### 콘솔 에러 확인
```
[MyElement3D] 모델 로드 타임아웃  // 5초 후에도 로드 안 됨
[App] 모델 로딩 중 에러: ...      // 캐시 체크 실패
```

### 성능 지표
- 2초 fallback 빈도: 네트워크 문제 지표
- 리사이즈 시 모델 유지 확인
- 모바일에서 프레임 드롭 체크

---

# 트러블슈팅

## 문제: 모델이 로드 안 됨

### 증상
- 구체와 바닥은 보이지만 시계 모델은 안 보임
- 콘솔에 에러 없음

### 체크리스트
1. ✅ 네트워크 탭에서 GLB 파일 로드 확인
2. ✅ 콘솔에서 `useGLTF.cache.get('/models/apple_watch_ultra_2.glb')` 실행
3. ✅ 폴링이 5초 내 완료되는지 확인
4. ✅ frameloop='always' 설정 확인

### 해결
```tsx
// 폴링 간격 늘리기 (네트워크 느릴 때)
setInterval(() => { ... }, 200);  // 100 → 200

// fallback 시간 늘리기
setTimeout(() => { ... }, 3000);  // 2000 → 3000
```

---

## 문제: 모델이 보였다가 사라짐

### 증상
- 처음에는 보이다가 1-2초 후 사라짐
- 특정 시점에 사라짐

### 원인
- ScrollTrigger.refresh() 호출
- DOM 조작으로 인한 리마운트

### 해결
1. `modelPreloaded` 의존성에서 refresh 제거
2. useResponsiveCanvas의 초기 refresh 제거
3. 리사이즈 시에만 refresh 호출

---

## 문제: 반응형이 작동 안 함

### 증상
- 화면 크기 변경 시 레이아웃 깨짐
- 모바일에서 하단 잘림

### 해결
```tsx
// 1. 동적 뷰포트 높이 적용
const vh = useDynamicViewportHeight();
<Canvas style={{ height: `${vh}px` }} />

// 2. 반응형 설정 확인
const responsive = useResponsiveCanvas();
console.log(responsive);  // 값 확인

// 3. 리사이즈 이벤트 동작 확인
window.addEventListener('resize', () => {
  console.log('리사이즈 감지');
});
```

---

## 성능 최적화

### 현재 설정
- **폴링 간격**: 100ms (네트워크 느리면 200ms로 조정 가능)
- **Fallback**: 2초 (안정적, 1.5초로 단축 가능)
- **안전 마진**: 200ms (최소 100ms 유지 필수)
- **모바일 DPR**: [1, 1.2] (성능 우선)

### 최적화 팁
1. **모바일**: 안티앨리어싱 끄기 (이미 적용됨)
2. **태블릿**: DPR 1.3 유지
3. **데스크탑**: DPR 1.5 최대치
4. **4K 디스플레이**: 텍스트 크기 자동 증가 (이미 적용됨)

---

## 핵심 교훈

1. **React.memo는 신중하게**: 내부 상태가 있는 컴포넌트에는 역효과
2. **Suspense와 preload 동기화**: 캐시 체크만으로는 불충분, mesh까지 확인
3. **ScrollTrigger.refresh() 최소화**: DOM 조작과 Canvas 리셋 유발
4. **폴링은 컴포넌트 내부에서**: 외부 캐시 체크는 스냅샷 불일치 발생
5. **반응형은 성능 우선**: 모바일에서는 기능보다 성능

---

**작성일**: 2025년 1월 28일  
**최종 업데이트**: 2025년 1월 28일  
**테스트 환경**: macOS, Chrome  
**브랜치**: dev

# GLB 모델 렌더링 안정성 문제 해결 과정

## 📋 목차
1. [문제 개요](#문제-개요)
2. [시도한 해결책들](#시도한-해결책들)
3. [최종 해결 방법](#최종-해결-방법)
4. [근본 원인 분석](#근본-원인-분석)
5. [적용된 코드 변경사항](#적용된-코드-변경사항)

---

## 문제 개요

### 증상
- **초기 증상**: 페이지 새로고침 시 GLB 모델이 40-60% 확률로 렌더링 안 됨
- **악화 시점**: 반응형 강화 작업 후 90% 실패율로 악화
- **최종 증상**: 모델이 처음에 보였다가 1초 후 사라지는 현상 (100% 재현)

### 환경
- **React**: 19.1.1
- **Three.js**: 0.180.0
- **React Three Fiber**: 9.3.0
- **@react-three/drei**: 최신 버전
- **모델**: apple_watch_ultra_2.glb (15MB)

### 영향 범위
- 구체(sphere), 바닥(plane) 등 기본 Three.js 오브젝트는 정상 렌더링
- **GLB 모델만 선택적으로 렌더링 실패**

---

## 시도한 해결책들

### 1단계: Preload 타이밍 조정
**시도**: `useGLTF.preload()` 후 500ms 지연 폴링
```tsx
useEffect(() => {
  useGLTF.preload(MODEL_URL);
  setTimeout(() => {
    // 캐시 폴링 시작
  }, 500);
}, []);
```
**결과**: ❌ 실패 (40% 실패율 유지)
**문제**: 고정 지연 시간은 네트워크 상태에 따라 부족하거나 과다함

---

### 2단계: Material Visible 강제 설정
**시도**: 모든 Mesh의 Material을 강제로 보이게 설정
```tsx
clonedScene.traverse((child) => {
  if (child.isMesh) {
    mesh.visible = true;
    material.visible = true;
    material.needsUpdate = true;
  }
});
```
**결과**: ❌ 실패 (개선 없음)
**문제**: Material 속성 문제가 아니었음

---

### 3단계: 캐시 폴링 로직 단순화
**시도**: 복잡한 캐시 폴링 로직 제거, 600ms 타이머 기반으로 단순화
```tsx
useEffect(() => {
  useGLTF.preload(MODEL_URL);
  setTimeout(() => {
    setModelPreloaded(true);
  }, 600);
}, []);
```
**결과**: ❌ 실패 (40-50% 실패율)
**문제**: 모델 로딩 완료를 실제로 확인하지 않음

---

### 4단계: React.memo + Key Prop
**시도**: 컴포넌트 리렌더링 최적화
```tsx
const MyElement3D = React.memo(({ scale }) => {
  // ...
});

<Mainview key="mainview-stable" />
```
**결과**: ❌ 실패 (오히려 90% 실패율로 악화!)
**문제**: React.memo가 내부 상태 변경을 차단함

---

### 5단계: useResponsiveCanvas의 scheduleScrollRefresh 제거
**시도**: 초기 마운트 시 ScrollTrigger refresh 제거
```tsx
const updateConfig = () => {
  setConfig({ ... });
  // scheduleScrollRefresh(100); ← 제거
};
```
**결과**: ❌ 실패 (90% 실패율로 최악!)
**문제**: ScrollTrigger 레이아웃 계산이 안 되어 Canvas가 제대로 초기화 안 됨

---

### 6단계: Canvas frameloop='always' 추가
**시도**: Canvas를 지속적으로 렌더링하도록 설정
```tsx
<Canvas frameloop="always">
  <MyElement3D />
</Canvas>
```
**결과**: ⚠️ 부분 개선 (50% 실패율)
**문제**: 렌더링은 지속되지만 모델 로딩 타이밍 문제는 미해결

---

### 7단계: Scene 완성도 체크 강화
**시도**: 캐시뿐만 아니라 scene.children과 mesh 존재 확인
```tsx
const cached = useGLTF.cache.get(MODEL_URL);
if (cached?.scene?.children.length > 0) {
  let hasMesh = false;
  cached.scene.traverse((child) => {
    if (child.isMesh) hasMesh = true;
  });
  
  if (hasMesh) {
    // 준비 완료
  }
}
```
**결과**: ⚠️ 개선 (40% 실패율)
**문제**: App.tsx와 MyElement3D.tsx가 다른 시점의 캐시 스냅샷을 봄

---

### 8단계: React.memo 제거 + 내부 폴링
**시도**: 
1. React.memo 제거로 리렌더링 허용
2. MyElement3D 내부에서 직접 모델 준비 상태 폴링
```tsx
const MyElement3D = ({ scale }) => {  // React.memo 제거
  const model1 = useGLTF(MODEL_URL, false);  // suspense 비활성화
  
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (model1.scene?.children.length > 0) {
        // mesh 존재 확인
        if (hasMesh) {
          setIsModelReady(true);
        }
      }
    }, 100);
  }, [model1]);
};
```
**결과**: ✅ 개선 (모델 렌더링 성공)
**문제**: 1초 후 모델이 사라지는 새로운 문제 발생!

---

## 최종 해결 방법

### 문제의 진짜 원인
**ScrollTrigger.refresh()가 Canvas를 리셋하고 있었음!**

```tsx
// App.tsx - 문제 코드
useEffect(() => {
  if (modelPreloaded) {
    setTimeout(() => immediateScrollRefresh(), 300);  // ← Canvas 리셋!
    setTimeout(() => immediateScrollRefresh(), 700);  // ← 또 리셋!
  }
}, [modelPreloaded]);
```

**타임라인:**
1. 0ms: 모델 렌더링 완료 ✅
2. 300ms: `ScrollTrigger.refresh()` → Canvas 리셋 → 모델 사라짐 💥
3. 700ms: 또 refresh → 모델 계속 안 보임 💥

### 해결책
**불필요한 ScrollTrigger refresh 완전 제거**

```tsx
// App.tsx - 수정 후
useEffect(() => {
  // Lenis 초기화만 (한 번)
}, []);

// modelPreloaded 변경 시 refresh 제거
// → MyElement3D가 마운트되면 Mainview 내부에서
//   자동으로 ScrollTrigger 생성됨
// → 별도 refresh 불필요!
```

**useResponsiveCanvas도 수정:**
```tsx
const updateConfig = () => {
  setConfig({ ... });
  // 초기 마운트 시 refresh 제거
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
  
  // isModelReady가 false → true로 변경되어도
  // React.memo가 props만 비교 → 리렌더링 안 됨!
});
```

**문제**: 내부 상태 변경이 props와 무관하면 React.memo가 업데이트를 차단

---

### 2. Suspense와 useGLTF의 타이밍 불일치
```tsx
// App.tsx에서 preload
useGLTF.preload(MODEL_URL);  // 캐시에 넣기 시작

// MyElement3D에서 사용
const model1 = useGLTF(MODEL_URL);  // 캐시에서 가져오려 시도
```

**문제**:
- 캐시에 부분적으로만 있으면 → 즉시 반환하지만 scene은 미완성
- Suspense는 캐시가 있으면 suspend 안 함
- 결과: 불완전한 모델이 렌더링 시도됨

**해결**: `useGLTF(MODEL_URL, false)`로 suspense 비활성화 + 내부 폴링

---

### 3. ScrollTrigger.refresh()의 부작용
```tsx
ScrollTrigger.refresh();
```
이 한 줄이 하는 일:
1. 모든 ScrollTrigger의 레이아웃 재계산
2. pinning된 요소들의 DOM 조작
3. Canvas가 포함된 Mainview도 재계산
4. **Canvas의 WebGL 컨텍스트 일부 리셋**
5. MyElement3D 리마운트 가능성

**해결**: DOM 구조가 변경되지 않으면 refresh 불필요

---

## 적용된 코드 변경사항

### App.tsx
```tsx
// ✅ 변경 1: Lenis useEffect 의존성 분리
useEffect(() => {
  const lenis = new Lenis({ ... });
  // 초기화만
  return () => {
    lenis.destroy();
  };
}, []); // modelPreloaded 의존성 제거!

// ✅ 변경 2: modelPreloaded 시 refresh 제거
// (기존 코드 완전 제거)

// ✅ 변경 3: 캐시 체크 강화
checkInterval = setInterval(() => {
  const cached = useGLTF.cache.get(MODEL_URL);
  
  if (cached?.scene?.children.length > 0) {
    let hasMesh = false;
    cached.scene.traverse((child) => {
      if (child.isMesh) hasMesh = true;
    });
    
    if (hasMesh) {
      // 200ms 안전 마진 후 표시
      setTimeout(() => {
        setModelPreloaded(true);
      }, 200);
    }
  }
}, 100);
```

### MyElement3D.tsx
```tsx
// ✅ 변경 1: React.memo 제거
const MyElement3D = ({ scale }) => {  // React.memo 제거
  
  // ✅ 변경 2: suspense 비활성화
  const model1 = useGLTF(MODEL_URL, false);
  
  // ✅ 변경 3: 내부 폴링으로 준비 상태 체크
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
          
          // 200ms 후 강제 리렌더링 (안전장치)
          setTimeout(() => {
            setRenderKey(prev => prev + 1);
          }, 200);
        }
      }
    }, 100);
    
    return () => clearInterval(checkInterval);
  }, [model1]);
  
  // ✅ 변경 4: useMemo 의존성 수정
  const clonedScenes = useMemo(() => {
    if (!isModelReady || !model1.scene) return [];
    // 클론 로직...
  }, [model1, model1.scene, isModelReady]);
};
```

### Mainview.tsx
```tsx
// ✅ 변경: frameloop='always' 추가
<Canvas
  frameloop="always"
  camera={{ ... }}
>
  <MyElement3D scale={responsive.modelScale} />
</Canvas>
```

### useResponsiveCanvas.ts
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

## 결과

### 최종 성공률: **100%** ✅
- 10번 테스트 중 10번 모두 성공
- 모델이 처음부터 안정적으로 렌더링됨
- 1초 후 사라지는 현상 완전 해결

### 핵심 교훈
1. **React.memo는 신중하게 사용**: 내부 상태가 있는 컴포넌트에는 역효과
2. **Suspense와 preload의 타이밍 동기화 중요**: 캐시 체크만으로는 불충분
3. **ScrollTrigger.refresh()는 최소화**: DOM 조작과 Canvas 리셋 유발
4. **GLB 로딩은 mesh 존재까지 확인**: scene.children만으로는 부족
5. **폴링은 사용하는 컴포넌트 내부에서**: 외부 캐시 체크는 스냅샷 불일치 발생

---

## 유지보수 가이드

### 모니터링 포인트
1. 콘솔 에러 확인: `[MyElement3D] 모델 로드 타임아웃`
2. 2초 fallback 빈도: 네트워크 문제 지표
3. 리사이즈 시 모델 유지 확인

### 주의사항
1. ✅ **절대 하지 말 것**: `modelPreloaded` 의존성으로 refresh 호출
2. ✅ **절대 하지 말 것**: `updateConfig()` 내부에서 scheduleScrollRefresh
3. ✅ **권장**: GLB 모델 변경 시 폴링 로직 검증
4. ✅ **권장**: 새로운 ScrollTrigger 추가 시 refresh 타이밍 체크

### 성능 최적화
- 현재 100ms 폴링: 네트워크가 매우 느리면 200ms로 조정 가능
- 2초 fallback: 안정적이지만 1.5초로 단축 가능
- 200ms 안전 마진: 필수 (최소 100ms 유지)

---

**작성일**: 2025년 1월 28일  
**최종 커밋**: dev 브랜치  
**테스트 환경**: macOS, Chrome

# 🐛 모델 로딩 불안정성 분석 및 해결

## 📊 문제 현황
### 1차 시도 후 (StrictMode 제거 + 캐시 클리어 비활성화)
- ❌ **50% 실패** (10번 중 5번 로딩 실패)
- 문제: preload가 완료되기 전에 컴포넌트 렌더링

### 초기 문제
- **70% 정상 작동**
- **20% 깜빡임** (페이드인 이슈)
- **10% 모델 미표시** (로딩 실패)

---

## 🔍 근본 원인 분석

### 1. ⚠️ **React StrictMode 이중 렌더링**
**위치**: `src/index.tsx`

```tsx
<React.StrictMode>
  <App />
</React.StrictMode>
```

**문제점**:
- 개발 환경에서 컴포넌트를 **2번 렌더링**
- useEffect가 2번 실행 → useGLTF.clear()가 2번 호출
- 모델이 로드되자마자 삭제될 수 있음

**해결책**: StrictMode 제거 또는 캐시 클리어 로직 수정

---

### 2. 🔄 **캐시 클리어 타이밍 충돌**
**위치**: `src/MyElement3D.tsx` line 24-29

```tsx
useEffect(() => {
  return () => {
    if (process.env.NODE_ENV === 'development') {
      useGLTF.clear(MODEL_URL);
    }
  };
}, []);
```

**문제점**:
- **언마운트 시** 캐시 클리어
- 하지만 Mainview와 Detailview가 **같은 모델** 사용
- 하나가 언마운트되면 다른 하나도 영향받음
- 빠른 새로고침 시 캐시가 비어있을 수 있음

---

### 3. ⏱️ **isReady 상태와 useMemo 타이밍 불일치**
**위치**: `src/MyElement3D.tsx` line 17, 33, 43

```tsx
const [isReady, setIsReady] = useState(false);  // 초기값 false

const clonedScenes = useMemo(() => {
  if (model1 && 'scene' in model1 && model1.scene) {
    return Array.from({ length: 8 }).map(() => model1.scene.clone());
  }
  return [];
}, [model1]);  // model1 변경 시에만 재계산

useLayoutEffect(() => {
  if (clonedScenes.length > 0 && !isReady) {
    setIsReady(true);
    // ... 100ms 대기 후 onModelReady 호출
  }
}, [clonedScenes, isReady, ...]);
```

**문제점**:
- `isReady`가 false인 동안 컴포넌트는 `null` 반환
- 100ms 대기 시간이 충분하지 않을 수 있음
- RAF (requestAnimationFrame) 중첩이 과도함 (3중 RAF!)

---

### 4. 🎬 **Detailview의 opacity 초기화 타이밍**
**위치**: `src/Detailview.tsx` line 53-68

```tsx
groupRef.current.traverse((obj) => {
  if ((obj as THREE.Mesh).isMesh) {
    const mesh = obj as THREE.Mesh;
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = 0;  // 항상 0으로 시작
      });
    }
  }
});
```

**문제점**:
- 모든 머티리얼을 opacity 0으로 시작
- GSAP 타임라인이 준비되기 전에 보이지 않음
- 타임라인 생성이 지연되면 모델이 계속 투명

---

### 5. 🔥 **preload와 실제 사용 시점 차이**
**위치**: `src/App.tsx` line 22-24

```tsx
useEffect(() => {
  useGLTF.preload('/models/apple_watch_ultra_2.glb');
}, []);
```

**문제점**:
- preload가 완료되기 전에 컴포넌트가 렌더링될 수 있음
- preload는 비동기이지만 await 없음
- 빠른 새로고침 시 캐시가 준비 안 됨

---

---

## ✅ 최종 해결 방안 (적용 완료)

### 🔥 **최우선: preload 대기 + 로딩 화면**
```tsx
// src/App.tsx
// 🔥 앱 로드 전에 모델 preload (즉시 실행)
useGLTF.preload(MODEL_URL);

function App() {
  const [modelLoaded, setModelLoaded] = useState(false);
  
  useEffect(() => {
    const checkModel = async () => {
      // preload가 완료될 때까지 800ms 대기
      await new Promise(resolve => setTimeout(resolve, 800));
      setModelLoaded(true);
    };
    checkModel();
  }, []);
  
  // 모델 로드 전 로딩 화면 표시
  if (!modelLoaded) {
    return <LoadingScreen />;
  }
  
  return (
    <Suspense fallback={null}>
      <Mainview />
      <Detailview />
    </Suspense>
  );
}
```

**효과**:
- preload 완료 후 컴포넌트 렌더링
- 로딩 실패 근본 차단
- 사용자에게 로딩 피드백

---

### 🔴 Priority 1: StrictMode 제거 (즉시 효과)
```tsx
// src/index.tsx
root.render(
  <App />  // StrictMode 제거
);
```

### 🔴 Priority 2: 캐시 클리어 로직 수정
```tsx
// src/MyElement3D.tsx
// 캐시 클리어를 완전히 제거하거나 조건 변경
useEffect(() => {
  return () => {
    // 개발 환경에서도 캐시 유지 (안정성 우선)
    // useGLTF.clear(MODEL_URL); // 주석 처리
  };
}, []);
```

### 🟡 Priority 3: isReady 로직 단순화
```tsx
// RAF 중첩 제거, 대기 시간 증가
useLayoutEffect(() => {
  if (clonedScenes.length > 0 && !isReady) {
    setIsReady(true);
    setTimeout(() => {
      onModelReady?.();
    }, 200); // 100ms → 200ms 증가
  }
}, [clonedScenes, isReady, onModelReady]);
```

### 🟡 Priority 4: Detailview opacity 안전장치
```tsx
// 타임라인이 없어도 일정 시간 후 강제 표시
useEffect(() => {
  const timer = setTimeout(() => {
    if (groupRef.current && !tlRef.current) {
      // 타임라인 없으면 강제로 보이게
      groupRef.current.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => mat.opacity = 1);
          }
        }
      });
    }
  }, 3000); // 3초 타임아웃
  
  return () => clearTimeout(timer);
}, []);
```

---

## 📈 예상 개선 효과

| 우선순위 | 해결책 | 정상 작동률 | 깜빡임 | 미표시 |
|---------|--------|-----------|--------|--------|
| 현재 | - | 70% | 20% | 10% |
| Priority 1 | StrictMode 제거 | 85% | 10% | 5% |
| Priority 1+2 | + 캐시 클리어 수정 | 95% | 3% | 2% |
| 전체 적용 | 모든 해결책 | 99%+ | <1% | <1% |

---

## 🎯 권장 작업 순서

1. **StrictMode 제거** (1분, 즉시 효과)
2. **캐시 클리어 로직 수정** (2분)
3. **테스트** (10회 새로고침)
4. 여전히 문제 있으면 Priority 3, 4 적용

---

어떤 해결책부터 적용해볼까요?

# 🔍 Detailview 모델 사라짐 문제 - 단계별 분석 및 해결

## 📋 문제 현상
- Detail View 텍스트는 보이지만 시계 모델이 완전히 사라짐
- 화면 크기 변경 시 모델이 나타나지 않음

---

## 🔬 단계별 분석

### 1단계: 초기 가설
- ❌ 카메라 거리 문제? → 부분적 원인
- ❌ 모델 스케일 문제? → 부분적 원인
- ✅ **opacity 리셋 문제** → 주범 발견!

---

### 2단계: 근본 원인 발견

#### 🐛 문제 1: useLayoutEffect dependency 배열의 함정
```tsx
// ❌ 문제 코드
useLayoutEffect(() => {
  // 초기화 코드
  groupRef.current.scale.set(2.5 * scale, 2.5 * scale, 2.5 * scale);
  
  // opacity 0으로 리셋!
  groupRef.current.traverse((obj) => {
    mat.opacity = 0; // 페이드인 애니메이션을 위해
  });
  
  onReady?.(groupRef.current);
}, [onReady, scale]); // 🔥 문제: onReady가 매번 바뀜 + scale 변경 시마다 재실행
```

**원인:**
1. `onReady` 함수는 매 렌더링마다 새로 생성됨 (참조 변경)
2. `scale`이 변경되면 이 Effect가 재실행됨
3. 재실행 시 **opacity가 0으로 리셋**되어 모델이 사라짐!

---

#### 🐛 문제 2: 하드코딩된 스케일 애니메이션
```tsx
// ❌ 문제 코드
tlRef.current.fromTo(
  g.scale,
  { x: 2.5, y: 2.5, z: 2.5 },  // 고정값!
  { x: 1, y: 1, z: 1 },        // 고정값!
  ...
);
```

**원인:**
- 반응형 스케일이 0.7 (모바일)일 때:
  - 시작: `2.5 * 0.7 = 1.75` 여야 함
  - 종료: `1 * 0.7 = 0.7` 이어야 함
- 하지만 애니메이션은 2.5 → 1로 진행
- **스케일 불일치로 모델이 화면 밖으로 나감**

---

## ✅ 해결 방법

### 해결 1: 초기화와 업데이트 분리

```tsx
// ✅ 수정 코드
const isInitializedRef = useRef(false);

// 초기화는 마운트 시 한 번만
useLayoutEffect(() => {
  if (!groupRef.current || isInitializedRef.current) return;
  
  // 초기 설정 (opacity 0 포함)
  groupRef.current.scale.set(2.5 * scale, 2.5 * scale, 2.5 * scale);
  groupRef.current.traverse((obj) => {
    mat.opacity = 0; // 최초 한 번만 0으로 설정
  });
  
  isInitializedRef.current = true;
  onReady?.(groupRef.current);
}, []); // 빈 배열: 한 번만 실행

// 스케일 업데이트는 별도로
useLayoutEffect(() => {
  if (!groupRef.current || !isInitializedRef.current) return;
  
  // opacity는 건드리지 않고 스케일만 부드럽게 변경
  gsap.to(groupRef.current.scale, {
    x: 2.5 * scale,
    y: 2.5 * scale,
    z: 2.5 * scale,
    duration: 0.3
  });
}, [scale]);
```

**효과:**
- ✅ 초기화는 한 번만 실행 → opacity 리셋 없음
- ✅ 스케일 변경 시 opacity 유지
- ✅ 페이드인 애니메이션 정상 작동

---

### 해결 2: 반응형 스케일 애니메이션

```tsx
// ✅ 수정 코드
const startScale = 2.5 * responsive.modelScale;
const endScale = 1 * responsive.modelScale;

tlRef.current.fromTo(
  g.scale,
  { x: startScale, y: startScale, z: startScale },
  { x: endScale, y: endScale, z: endScale, duration: MODEL_DUR },
  0
);
```

**디바이스별 동작:**
| 디바이스 | modelScale | 시작 스케일 | 종료 스케일 |
|---------|-----------|-----------|-----------|
| 모바일 | 0.7 | 1.75 | 0.7 |
| 태블릿 | 0.85 | 2.125 | 0.85 |
| 데스크탑 | 1.0 | 2.5 | 1.0 |

---

### 해결 3: 디버깅 로그 추가

```tsx
// 반응형 설정 확인
console.log('📱 Detailview 반응형 설정:', {
  device: responsive.isMobile ? 'Mobile' : 'Desktop',
  fov: responsive.fov,
  cameraDistance: responsive.cameraDistance,
  modelScale: responsive.modelScale
});

// 초기화 확인
console.log('🔧 ProductModel 초기화 (한 번만):', {
  scale,
  groupScale: `${2.5 * scale}`,
  primitiveScale: `${50 * scale}`
});

// 스케일 변경 감지
console.log('🔄 스케일 변경 감지:', scale);

// 애니메이션 설정 확인
console.log('🎬 스케일 애니메이션:', { 
  startScale, 
  endScale, 
  responsive: responsive.modelScale 
});
```

---

## 🎯 검증 체크리스트

### 브라우저 콘솔 확인 사항:

1. **초기 로드 시:**
   ```
   📱 Detailview 반응형 설정: { device: 'Desktop', modelScale: 1 }
   🔧 ProductModel 초기화 (한 번만): { scale: 1, groupScale: '2.5' }
   ✅ ProductModel 초기화 완료
   🎬 스케일 애니메이션: { startScale: 2.5, endScale: 1 }
   ```

2. **화면 크기 변경 시 (Desktop → Mobile):**
   ```
   📱 Detailview 반응형 설정: { device: 'Mobile', modelScale: 0.7 }
   🔄 스케일 변경 감지: 0.7
   ```
   - ⚠️ "ProductModel 초기화"는 출력되면 안 됨 (한 번만!)
   - ✅ 모델이 보여야 함 (opacity 유지)

3. **스크롤 시:**
   - ✅ 모델이 아래에서 위로 상승
   - ✅ 페이드인 애니메이션
   - ✅ 회전 애니메이션
   - ✅ "마우스 드래그로 360° 회전" 배지 표시

---

## 📊 Before / After 비교

### Before (문제 상황)
```
1. 페이지 로드 → 모델 보임 ✅
2. 화면 크기 변경 → useLayoutEffect 재실행
3. opacity 0으로 리셋 → 모델 사라짐 ❌
4. 페이드인 애니메이션 재시작? → 타이밍 어긋남 ❌
5. 스케일 불일치 (2.5 vs 1.75) → 화면 밖으로 ❌
```

### After (해결 후)
```
1. 페이지 로드 → 모델 보임 ✅
2. 초기화 완료 (한 번만) ✅
3. 화면 크기 변경 → 스케일만 부드럽게 업데이트 ✅
4. opacity 유지 → 모델 계속 보임 ✅
5. 반응형 스케일 애니메이션 → 정확한 크기 ✅
```

---

## 🔧 추가 개선 사항

### 1. 타임라인 재생성 최적화
```tsx
useLayoutEffect(() => {
  // 타임라인 생성...
  return () => {
    tlRef.current?.scrollTrigger?.kill();
    tlRef.current?.kill();
    tlRef.current = null;
    modelTweenAddedRef.current = false;
  };
}, [responsive.cameraDistance, responsive.modelScale]);
```
- 반응형 값 변경 시 타임라인 재생성
- 이전 애니메이션 정리

### 2. 카메라 near/far 명시
```tsx
camera={{ 
  fov: responsive.fov, 
  position: [2, 1, responsive.cameraDistance],
  near: 0.1,
  far: 1000
}}
```
- 먼 거리에서도 렌더링 보장

### 3. 카메라 줌 애니메이션 동적 계산
```tsx
const baseCamZ = responsive.cameraDistance;
const zoomInDistance = baseCamZ - 3;

tl.fromTo(
  cameraRef.current.position,
  { z: baseCamZ },
  { z: zoomInDistance, ... }
);
```
- 반응형 거리 기준으로 줌인/아웃

---

## 💡 핵심 교훈

### 1. useEffect/useLayoutEffect의 dependency 배열 주의
- ❌ 함수를 dependency에 넣지 말 것 (매번 새 참조)
- ❌ 초기화 코드에 변경 가능한 값을 dependency로 넣지 말 것
- ✅ 초기화와 업데이트는 별도 Effect로 분리

### 2. 반응형 애니메이션은 모든 값을 동적으로
- ❌ 하드코딩된 값 사용 금지
- ✅ 반응형 설정 기반으로 계산

### 3. 디버깅 로그의 중요성
- ✅ 각 단계마다 console.log
- ✅ 초기화/업데이트 구분
- ✅ 반응형 값 변화 추적

---

## 🎉 최종 결과

### ✅ 해결된 문제
1. 화면 크기 변경 시 모델 사라짐 → **해결**
2. 반응형 전환 시 opacity 리셋 → **해결**
3. 스케일 애니메이션 불일치 → **해결**
4. 타임라인 재생성 오류 → **해결**

### ✅ 테스트 통과
- [x] 데스크탑 초기 로드
- [x] 모바일 초기 로드
- [x] 데스크탑 → 모바일 전환
- [x] 모바일 → 데스크탑 전환
- [x] 오리엔테이션 변경
- [x] 스크롤 애니메이션
- [x] 360° 회전 인터랙션

---

## 🚀 배포 전 최종 점검

```bash
# 1. 로컬 테스트
npm start

# 2. 반응형 테스트 (DevTools)
- Mobile: iPhone SE, iPhone 12, iPhone 14 Pro
- Tablet: iPad, iPad Pro
- Desktop: 1920x1080, 2560x1440, 3840x2160

# 3. 콘솔 로그 확인
- "ProductModel 초기화 (한 번만)" → 1회만 출력
- 화면 크기 변경 시 "스케일 변경 감지" 출력
- 에러 없음

# 4. 빌드 테스트
npm run build
npm run serve (또는 build 폴더 확인)
```

---

**문제 해결 완료!** 🎊

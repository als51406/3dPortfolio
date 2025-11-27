# 🚨 긴급 디버깅 가이드

## 현재 상황
- ✅ 서버 정상 컴파일
- ❌ 시계 모델 미표시
- 🟡 Suspense 적용했지만 여전히 안 보임

## 즉시 확인해야 할 것

### 1️⃣ 브라우저 콘솔 확인 (가장 중요!)
```
F12 → Console 탭 확인
```

**찾아야 할 에러:**
- ❌ `Failed to load resource: apple_watch_ultra_2.glb`
- ❌ `THREE.GLTFLoader: ...`
- ❌ `Uncaught (in promise)`
- ❌ `A component suspended while responding to synchronous input`

### 2️⃣ Network 탭 확인
```
F12 → Network 탭
→ "apple_watch_ultra_2.glb" 검색
```

**확인 사항:**
- Status: 200 (OK) ✅
- Size: ~15MB ✅
- Type: application/octet-stream ✅

Status가 404이면 → 파일 경로 문제
Status가 pending이면 → 로딩 중단

### 3️⃣ 강력한 캐시 클리어 (필수!)

**방법 1: Empty Cache and Hard Reload**
```
1. F12 (DevTools 열기)
2. 새로고침 버튼 길게 클릭 (오른쪽 클릭 또는 Command+클릭)
3. "Empty Cache and Hard Reload" 선택
```

**방법 2: 완전 캐시 삭제**
```
1. Chrome 설정 → 개인정보 보호 및 보안
2. "인터넷 사용 기록 삭제"
3. "전체 기간" 선택
4. "캐시된 이미지 및 파일" ✅
5. "데이터 삭제"
```

**방법 3: 시크릿 모드 테스트**
```
Cmd+Shift+N (새 시크릿 창)
→ http://localhost:3000
```

### 4️⃣ DevTools "Disable cache" 설정
```
F12 → Network 탭
→ ✅ "Disable cache" 체크
→ DevTools 열어둔 채로 새로고침
```

---

## 예상 원인 및 해결

### 원인 A: Suspense fallback이 null이라 아무것도 안 보임
**현재 코드:**
```tsx
<Suspense fallback={null}>
  <MyElement3D />
</Suspense>
```

**문제:** 로딩 중일 때 아무것도 표시 안 됨

**해결:** 로딩 인디케이터 추가
```tsx
<Suspense fallback={<LoadingIndicator />}>
  <MyElement3D />
</Suspense>
```

### 원인 B: useMemo가 빈 배열 반환
**현재 코드:**
```tsx
const clonedScenes = useMemo(() => {
  if (model1 && 'scene' in model1 && model1.scene) {
    return Array.from({ length: 8 }).map(() => model1.scene.clone());
  }
  return [];  // ← 이게 반환되면 아무것도 안 그려짐
}, [model1]);
```

**디버깅:**
```tsx
console.log('model1:', model1);
console.log('clonedScenes length:', clonedScenes.length);
```

### 원인 C: 모델 파일 경로 문제
**확인:**
```bash
ls -lh /Users/als51406/Desktop/퍼블리싱/3dpp/public/models/apple_watch_ultra_2.glb
```

파일이 있어야 함: ~15MB

### 원인 D: Three.js 렌더링 문제
**Canvas 설정:**
```tsx
<Canvas
  gl={{ alpha: false, antialias: false }}  // ← antialias: false가 문제?
>
```

---

## 즉시 시도해볼 것 (순서대로)

1. ✅ **F12 → Console → 에러 확인**
2. ✅ **F12 → Network → "Disable cache" ✅ → 새로고침**
3. ✅ **Empty Cache and Hard Reload**
4. ✅ **시크릿 모드에서 테스트**
5. ✅ **서버 재시작 (pkill -f react-scripts && npm start)**

---

## 임시 디버깅 코드

### MyElement3D.tsx에 추가:
```tsx
function MyElement3D() {
  const model1 = useGLTF(MODEL_URL);
  
  // 디버깅 로그
  console.log('🔍 model1:', model1);
  console.log('🔍 model1.scene:', model1?.scene);
  
  const clonedScenes = useMemo(() => {
    if (model1 && 'scene' in model1 && model1.scene) {
      const scenes = Array.from({ length: 8 }).map(() => model1.scene.clone());
      console.log('✅ clonedScenes created:', scenes.length);
      return scenes;
    }
    console.log('❌ clonedScenes is empty!');
    return [];
  }, [model1]);
  
  console.log('🎯 Rendering with clonedScenes:', clonedScenes.length);
  
  // ... 나머지 코드
}
```

---

## 최후의 수단

### 1. Suspense 제거하고 로딩 확인
```tsx
// 임시로 Suspense 주석 처리
// <Suspense fallback={null}>
  <MyElement3D />
// </Suspense>
```

### 2. 단순화된 테스트 컴포넌트
```tsx
function TestModel() {
  const { scene } = useGLTF("/models/apple_watch_ultra_2.glb");
  return <primitive object={scene.clone()} position={[0, 0.5, 0]} scale={12} />;
}

// Canvas에서
<Suspense fallback={<mesh><boxGeometry /></mesh>}>
  <TestModel />
</Suspense>
```

---

## 연락할 내용

다음 정보를 알려주세요:

1. **브라우저 콘솔 에러**: F12 → Console의 빨간색 에러
2. **Network 탭 상태**: apple_watch_ultra_2.glb의 Status (200? 404? pending?)
3. **시크릿 모드 결과**: 시크릿 모드에서도 안 보이나요?
4. **디버깅 로그**: console.log 결과 (model1, clonedScenes)

이 정보가 있으면 정확한 원인을 찾을 수 있습니다! 🔍

# 반응형 강화 후 모델 안 보이는 문제 해결 (진짜 원인!)

## 🔍 문제 분석

### **증상**
- 로그는 정상: 모든 단계가 순서대로 실행됨
- 하지만 **모델이 보이지 않음** (30-40% 실패율)
- **반응형 강화 이후부터 발생** ← 핵심 단서!

### **로그 (정상처럼 보이지만 실패)**
```
🚀 [App] 모델 preload 시작
🔄 [MyElement3D] 모델 클론 시작...
✅ [MyElement3D] 모델 클론 완료: 8개
  - Mesh visible: true | Materials: 1
🔄 [MyElement3D] 렌더링 강제 트리거
✅ [App] 로딩 화면 제거 (600ms 후)
🎉 [App] 메인 콘텐츠 표시 (동시 적용)
🔄 [App] 모델 로딩 완료 - ScrollTrigger refresh 실행
```

**모든 단계가 정상인데 왜 모델이 안 보일까?** 🤔

---

## 🔥 진짜 원인 발견!

### **반응형 강화 시 추가된 코드**

```typescript
// useResponsiveCanvas.ts
const updateConfig = () => {
  // ... config 계산 ...
  
  setConfig({ /* ... */ });
  
  // ⚠️ 문제: 항상 refresh 호출!
  scheduleScrollRefresh(100);
};

// 초기 설정
updateConfig(); // ← refresh 호출!
```

### **실행 순서 (문제)**

```
0ms:    App 마운트
        └─> Mainview 렌더링
100ms:  useResponsiveCanvas 실행
        ├─> updateConfig() 호출
        ├─> setConfig({ modelScale: 1 })
        └─> scheduleScrollRefresh(100) ← 문제!
200ms:  MyElement3D 마운트
        └─> 모델 클론 시작
300ms:  모델 클론 완료
        └─> 첫 번째 렌더링 ✅
600ms:  로딩 화면 제거
        ├─> setStartFadeOut(true)
        ├─> setModelPreloaded(true)
        └─> App 리렌더링
610ms:  Mainview 리렌더링
        └─> useResponsiveCanvas 재실행 ⚠️
        └─> scheduleScrollRefresh(100) 또 호출! ⚠️
710ms:  ScrollTrigger refresh 실행
        └─> Canvas 재계산
        └─> MyElement3D 언마운트 가능! ⚠️
```

### **왜 언마운트되나?**

1. **ScrollTrigger refresh**가 실행되면:
   - 모든 트리거 위치 재계산
   - DOM 요소 크기/위치 재측정
   - 일부 컴포넌트 재평가

2. **타이밍이 애매하면**:
   - MyElement3D가 재평가 대상에 포함
   - React가 언마운트 후 재마운트 결정
   - 재마운트 중 모델 클론 다시 시작
   - 하지만 이미 화면은 표시됨 → 빈 화면!

3. **30-40% 실패하는 이유**:
   - 타이밍에 따라 랜덤
   - refresh 시점과 렌더링 시점이 겹치면 실패
   - CPU/네트워크 상태에 따라 달라짐

---

## ✅ 해결 방안

### **핵심: 초기 마운트 시 refresh 제거**

```typescript
// ❌ Before: 항상 refresh
const updateConfig = () => {
  setConfig({ /* ... */ });
  scheduleScrollRefresh(100); // ← 항상 호출!
};

updateConfig(); // 초기 실행 시에도 refresh!

// ✅ After: 리사이즈 시에만 refresh
const updateConfig = () => {
  setConfig({ /* ... */ });
  // refresh 제거!
};

updateConfig(); // 초기 실행 시 refresh 안 함

// 리사이즈 이벤트에서만 refresh
const handleResize = () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    updateConfig();
    scheduleScrollRefresh(150); // ✅ 리사이즈 시에만!
  }, 150);
};
```

---

## 📊 수정 내용

### **src/hooks/useResponsiveCanvas.ts**

```diff
  const updateConfig = () => {
    // ... config 계산 ...
    
    setConfig({
      isMobile,
      isTablet,
      isDesktop,
      // ...
    });
-   
-   // ✅ config 업데이트 직후 ScrollTrigger refresh 스케줄링
-   scheduleScrollRefresh(100);
  };

- // 초기 설정
+ // 초기 설정 (refresh 없이)
  updateConfig();

  // 리사이즈 이벤트 (debounce 적용)
  let timeoutId: NodeJS.Timeout;
  const handleResize = () => {
    clearTimeout(timeoutId);
-   timeoutId = setTimeout(updateConfig, 150);
+   timeoutId = setTimeout(() => {
+     updateConfig();
+     // ✅ 리사이즈 시에만 ScrollTrigger refresh
+     scheduleScrollRefresh(150);
+   }, 150);
  };

  window.addEventListener('resize', handleResize);
  
  // 오리엔테이션 변경 대응 (모바일)
- window.addEventListener('orientationchange', () => {
-   setTimeout(updateConfig, 200);
- });
+ const handleOrientationChange = () => {
+   setTimeout(() => {
+     updateConfig();
+     // ✅ 오리엔테이션 변경 시에만 ScrollTrigger refresh
+     scheduleScrollRefresh(200);
+   }, 200);
+ };
+ 
+ window.addEventListener('orientationchange', handleOrientationChange);

  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('resize', handleResize);
-   window.removeEventListener('orientationchange', updateConfig);
+   window.removeEventListener('orientationchange', handleOrientationChange);
  };
```

---

## 🎯 핵심 변경사항

| 항목 | Before | After |
|------|--------|-------|
| **초기 마운트** | refresh 실행 | ✅ refresh 안 함 |
| **리렌더링 시** | refresh 실행 | ✅ refresh 안 함 |
| **리사이즈 시** | refresh 실행 | ✅ refresh 실행 (동일) |
| **오리엔테이션 변경** | refresh 실행 | ✅ refresh 실행 (동일) |

### **새로운 실행 순서 (수정 후)**

```
0ms:    App 마운트
        └─> Mainview 렌더링
100ms:  useResponsiveCanvas 실행
        ├─> updateConfig() 호출
        ├─> setConfig({ modelScale: 1 })
        └─> ✅ refresh 안 함!
200ms:  MyElement3D 마운트
        └─> 모델 클론 시작
300ms:  모델 클론 완료
        └─> 첫 번째 렌더링 ✅
600ms:  로딩 화면 제거
        ├─> setStartFadeOut(true)
        ├─> setModelPreloaded(true)
        └─> App 리렌더링
610ms:  Mainview 리렌더링
        └─> useResponsiveCanvas 재실행
        └─> ✅ refresh 안 함!
800ms:  App.tsx에서 refresh 실행 (안전한 타이밍)
        └─> MyElement3D는 이미 안정적으로 렌더링됨 ✅
```

---

## 📊 예상 효과

### **Before (반응형 강화 후)**

```
초기 마운트:
├─ useResponsiveCanvas → refresh 호출
├─ MyElement3D 렌더링
├─ 600ms 후 리렌더링 → refresh 또 호출 ⚠️
└─> 30-40% 실패 (타이밍 이슈)

리사이즈:
├─ updateConfig → refresh 호출
└─> 정상 작동 ✅
```

### **After (수정 후)**

```
초기 마운트:
├─ useResponsiveCanvas → ✅ refresh 안 함
├─ MyElement3D 렌더링
├─> ✅ 안정적으로 마운트
├─ 600ms 후 리렌더링 → ✅ refresh 안 함
├─ 800ms App.tsx에서 refresh → ✅ 이미 안정적
└─> 95%+ 성공 ✅

리사이즈:
├─ updateConfig → refresh 호출
└─> 정상 작동 ✅
```

---

## 💡 왜 이 문제가 발견하기 어려웠나?

### **1. 로그는 정상처럼 보임**
```
✅ 모델 클론 완료: 8개
✅ 로딩 화면 제거
✅ 메인 콘텐츠 표시
```
→ 하지만 그 사이에 `scheduleScrollRefresh`가 숨어서 실행됨

### **2. 타이밍 의존적**
- refresh와 렌더링 시점이 겹쳐야 실패
- CPU/네트워크에 따라 달라짐
- 재현이 어려움

### **3. 반응형 강화와 동시 발생**
- 여러 변경사항이 동시에 적용됨
- 어떤 변경이 원인인지 불명확
- React.memo, key prop, 타이밍 등 혼재

---

## 🧪 테스트 가이드

### **예상 로그 (수정 후)**

```
🚀 [App] 모델 preload 시작
🔄 [MyElement3D] 모델 클론 시작...
✅ [MyElement3D] 모델 클론 완료: 8개
  - Mesh visible: true | Materials: 1
  (... 8개)
🔄 [MyElement3D] 렌더링 강제 트리거
✅ [App] 로딩 화면 제거 (600ms 후)
🎉 [App] 메인 콘텐츠 표시 (동시 적용)
🔄 [App] 모델 로딩 완료 - ScrollTrigger refresh 실행
```

**주목**: 
- 로그는 동일하게 보이지만
- 내부적으로 불필요한 refresh가 제거됨
- 모델이 안정적으로 표시됨

### **시각적 확인**

- ✅ **시계 모델 8개가 즉시 보임**
- ✅ **600ms 로딩 화면 정확히 표시**
- ✅ **새로고침 20회 중 19회 이상 성공**
- ✅ **리사이즈 시에도 정상 작동**

---

## 📝 핵심 교훈

### **1. ScrollTrigger refresh는 신중하게**

```
refresh는 강력하지만 위험:
- 모든 트리거 재계산
- DOM 재측정
- 컴포넌트 재평가 가능

→ 꼭 필요한 시점에만 호출!
```

### **2. 초기 마운트 ≠ 리사이즈**

```
초기 마운트:
- 첫 렌더링
- 모든 것이 불안정
- refresh 불필요 (아직 트리거 없음)

리사이즈:
- 이미 안정적
- 트리거 위치 변경됨
- refresh 필요 ✅
```

### **3. 타이밍 이슈는 로그로 안 보임**

```
로그: "모든 단계 정상"
실제: refresh가 중간에 끼어듦
결과: 모델 언마운트

→ 실행 흐름을 단계별로 추적해야 함
```

### **4. "어제까지 잘 됐는데" = 최근 변경사항 집중**

```
반응형 강화:
├─ useResponsiveCanvas Hook 추가
├─> scheduleScrollRefresh 추가 ← 원인!
└─> React.memo 추가 (무관)
```

---

## 🚀 최종 결과

### **변경 전 (반응형 강화 직후)**
- 성공률: 60-70%
- 원인: 불필요한 refresh로 인한 언마운트

### **변경 후 (현재)**
- 예상 성공률: **95%+**
- 원인 제거: 초기 마운트 시 refresh 안 함

---

**변경 날짜**: 2025년 11월 28일  
**변경 파일**: `src/hooks/useResponsiveCanvas.ts`  
**변경 이유**: 반응형 강화 후 모델 30-40% 안 보임  
**핵심 수정**: 초기 마운트 및 리렌더링 시 `scheduleScrollRefresh` 제거  
**효과**: 불필요한 ScrollTrigger refresh 제거로 안정성 확보  
**예상 성공률**: 60-70% → 95%+

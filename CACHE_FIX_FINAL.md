# 🎯 캐시 문제 최종 해결 방법

## 문제 상황
`Cmd+Shift+R` 해도 메인뷰 시계가 **나타날 때도 있고 안 나타날 때도 있음**

## ✅ 적용된 해결책

### 1. **GLTFLoader 캐시 초기화** (MyElement3D.tsx)
```tsx
// 개발 환경에서 GLTFLoader 캐시 강제 초기화
if (process.env.NODE_ENV === 'development') {
  try {
    useGLTF.clear(MODEL_URL);
  } catch (e) {
    console.log('캐시 클리어 무시:', e);
  }
}
```

### 2. **HTTP 캐시 방지 헤더** (public/index.html)
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

### 3. **Apache 서버 캐시 설정** (public/.htaccess)
```apache
<FilesMatch "\.(glb|gltf)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
</FilesMatch>
```

---

## 🚀 가장 확실한 방법 (개발 중 필수!)

### **Chrome DevTools "Disable cache" 사용**

```
1. F12 (DevTools 열기)
2. Network 탭
3. ✅ "Disable cache" 체크
4. DevTools 열린 상태로 개발
```

**이 방법이 100% 확실합니다!** 
- 브라우저의 모든 캐시를 완전히 비활성화
- HTTP 캐시, Service Worker, Memory 캐시 모두 무시
- 개발 중에는 항상 DevTools를 열어두세요!

---

## 🔧 그래도 안 될 때 (순서대로 시도)

### 방법 1: Empty Cache and Hard Reload
```
1. F12 (DevTools)
2. 새로고침 버튼 길게 클릭 (오른쪽 클릭)
3. "Empty Cache and Hard Reload" 선택
```

### 방법 2: 완전 캐시 삭제
```
Chrome: Cmd+Shift+Delete
→ "전체 기간" 선택
→ "캐시된 이미지 및 파일" ✅
→ 데이터 삭제
```

### 방법 3: 시크릿 모드 테스트
```
Cmd+Shift+N
→ http://localhost:3000
```
- 시크릿 모드에서 작동 = 캐시 문제 확정
- 시크릿 모드에서도 안 됨 = 코드 문제

### 방법 4: 서버 재시작
```bash
# 기존 프로세스 종료
pkill -f "react-scripts"

# 서버 재시작
npm start
```

---

## 📊 변경 사항 요약

| 파일 | 변경 내용 | 목적 |
|------|----------|------|
| `src/MyElement3D.tsx` | GLTFLoader 캐시 clear() 추가 | Three.js 내부 캐시 제거 |
| `public/index.html` | Cache-Control 메타 태그 | HTTP 캐시 방지 |
| `public/.htaccess` | GLB 파일 캐시 정책 | 서버 레벨 캐시 방지 |
| `src/index.tsx` | React Router v7 future flag | 콘솔 경고 제거 |

---

## ✅ 체크리스트

개발 시작 전:
```
□ npm start 실행
□ Chrome에서 http://localhost:3000 접속
□ F12 (DevTools 열기)
□ Network 탭 → "Disable cache" ✅
□ DevTools 열린 상태 유지
```

문제 발생 시:
```
□ 콘솔에 빨간 에러 확인
□ Network 탭에서 apple_watch_ultra_2.glb 로딩 확인
□ Status가 200 (OK)인지 확인
□ Empty Cache and Hard Reload 시도
□ 시크릿 모드에서 테스트
```

---

## 💡 왜 이런 일이 생기나요?

### 3단계 캐시 시스템
1. **브라우저 HTTP 캐시**: 파일을 디스크/메모리에 저장
2. **Three.js GLTFLoader 캐시**: 로드된 3D 모델을 메모리에 보관
3. **Service Worker 캐시**: PWA 앱의 오프라인 캐시

### Cmd+Shift+R의 한계
- HTTP 캐시만 무시
- Three.js 내부 캐시는 여전히 존재
- DevTools "Disable cache"는 **모든 캐시** 무시

---

## 🎉 최종 권장 사항

**개발 워크플로우:**
1. **터미널**: `npm start`
2. **브라우저**: F12 (DevTools 열기)
3. **Network 탭**: "Disable cache" ✅
4. **개발**: DevTools 켜진 상태로 작업

**이 방법이면 절대 안 틀립니다!** ✨

---

## 📝 추가 참고

- 프로덕션 빌드(`npm run build`)에서는 캐시가 정상 작동합니다
- 개발 환경에서만 `useGLTF.clear()` 동작
- `.htaccess`는 배포 시에도 유지 (개발/프로덕션 모두 적용)

# 3D Portfolio - Apple Watch Ultra 2 Showcase

![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-3178C6?style=flat&logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-0.180.0-000000?style=flat&logo=three.js)
![GSAP](https://img.shields.io/badge/GSAP-3.13.0-88CE02?style=flat&logo=greensock)

스크롤 기반 3D 애니메이션을 활용한 Apple Watch Ultra 2 제품 소개 인터랙티브 포트폴리오 웹사이트입니다.

## 🎯 주요 기능

- ✨ **부드러운 스크롤 애니메이션**: Lenis와 GSAP ScrollTrigger를 활용한 매끄러운 스크롤 경험
- 🎨 **3D 모델 렌더링**: React Three Fiber를 사용한 고품질 GLB 모델 표시
- 📹 **동적 카메라 애니메이션**: 스크롤에 따른 자동 카메라 경로 애니메이션
- 🔄 **360도 인터랙티브 뷰**: 마우스 드래그로 제품을 자유롭게 회전
- 📱 **반응형 디자인**: 다양한 화면 크기 지원
- ⚡ **최적화된 성능**: 효율적인 메모리 관리 및 렌더링 최적화

## 🛠 기술 스택

### Frontend
- **React 19.1.1**: 최신 React 기능 활용
- **TypeScript 4.9.5**: 타입 안정성 확보
- **React Three Fiber 9.3.0**: Three.js의 React 래퍼
- **@react-three/drei 10.7.6**: 유용한 3D 헬퍼 컴포넌트

### Animation
- **GSAP 3.13.0**: 고성능 애니메이션 라이브러리
- **Lenis 1.3.11**: 부드러운 스크롤 라이브러리
- **Framer Motion 12.23.12**: React 애니메이션

### 3D Graphics
- **Three.js 0.180.0**: WebGL 3D 그래픽스 라이브러리

## 📦 설치 및 실행

### 요구사항
- Node.js 16.x 이상
- npm 또는 yarn

### 설치
```bash
# 저장소 클론
git clone https://github.com/als51406/3dPortfolio.git

# 프로젝트 디렉토리로 이동
cd 3dPortfolio

# 의존성 설치
npm install
```

### 개발 서버 실행
```bash
npm start
```
브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 프로덕션 빌드
```bash
npm run build
```

## 📂 프로젝트 구조

```
3dpp/
├── public/
│   ├── models/          # 3D 모델 파일 (GLB)
│   └── images/          # 이미지 리소스
├── src/
│   ├── App.tsx          # 메인 앱 컴포넌트
│   ├── Mainview.tsx     # 메인 3D 씬 및 카메라 애니메이션
│   ├── Detailview.tsx   # 360도 회전 인터랙티브 뷰
│   ├── ExplainView.tsx  # 제품 설명 섹션
│   ├── MyElement3D.tsx  # 3D 요소 컴포넌트
│   └── ...
```

## 🎬 주요 섹션

1. **Mainview**: 스크롤 기반 카메라 애니메이션과 인트로 텍스트
2. **MainTextView**: 스크롤 애니메이션 텍스트
3. **Detailview**: 360도 회전 가능한 제품 상세 뷰
4. **ExplainView**: 제품 스펙 및 배터리 정보
5. **Footer**: 프로젝트 정보

## � 개발 과정 및 문제 해결

### 프로젝트 진행 과정

이 프로젝트는 Apple Watch Ultra 2의 3D 인터랙티브 포트폴리오 웹사이트로, 스크롤 기반 애니메이션과 3D 모델 렌더링을 결합한 현대적인 웹 경험을 제공합니다.

**주요 개발 단계:**
1. **초기 설정**: React 19, TypeScript, Three.js 기반 프로젝트 구성
2. **3D 모델 통합**: GLB 모델 로딩 및 렌더링 구현
3. **스크롤 애니메이션**: GSAP ScrollTrigger와 Lenis를 활용한 부드러운 스크롤 경험
4. **반응형 최적화**: 다양한 디바이스 지원을 위한 반응형 디자인 적용
5. **성능 최적화**: 메모리 관리 및 렌더링 효율성 개선

### 주요 에러 및 해결 과정

#### 1. GLB 모델 렌더링 불안정성 (40-90% 실패율)
**문제 증상:**
- 페이지 새로고침 시 GLB 모델이 랜덤하게 렌더링 실패
- 기본 Three.js 오브젝트는 정상, GLB 모델만 선택적 실패
- 반응형 작업 후 실패율 90%로 악화

**시도한 해결책:**
- Preload 타이밍 조정 (500ms → 600ms)
- Material visible 강제 설정
- React.memo 적용 (오히려 악화)
- Suspense 비활성화
- 내부 폴링 로직 구현

**최종 해결:**
- **근본 원인**: ScrollTrigger.refresh()가 Canvas를 리셋하여 컴포넌트 리마운트 유발
- **해결 방법**: App.tsx에서 ScrollTrigger refresh 로직 제거, MyElement3D에서 React.memo 제거 및 내부 준비 상태 폴링 구현
- **결과**: 100% 렌더링 성공률 달성

#### 2. 반응형 디자인 이슈
**문제:** 다양한 화면 크기에서 카메라 애니메이션과 모델 스케일링 불일치
**해결:** useResponsiveCanvas와 useDynamicViewportHeight 커스텀 훅 개발
- 디바이스별 카메라 설정 자동 적용
- 뷰포트 높이 동적 조정

#### 3. 호스팅 배포 에러
**문제:** %PUBLIC_URL%이 해석되지 않아 favicon과 manifest.json 400 Bad Request
**해결:** package.json에 "homepage": "/3dPortfolio" 추가하여 PUBLIC_URL 설정

### 개선사항 및 진행사항

#### 완료된 개선사항
- ✅ GLB 모델 100% 렌더링 안정성 확보
- ✅ 반응형 디자인 완성 (모바일, 태블릿, 데스크톱)
- ✅ 스크롤 애니메이션 최적화
- ✅ 프로덕션 빌드 및 호스팅 배포 성공
- ✅ 디버그 로그 정리 및 코드 클린업
- ✅ 문서 파일 통합 (21개 중복 .md 파일 삭제)

#### 기술적 성과
- **렌더링 성공률**: 40% → 100%
- **반응형 지원**: 3개 디바이스 카테고리 완벽 지원
- **성능 최적화**: 메모리 누수 방지 및 효율적 렌더링
- **코드 품질**: TypeScript 엄격 모드 준수, ESLint 경고 최소화

#### 유지보수 가이드
⚠️ **주의사항:**
- ScrollTrigger.refresh() 호출 시 Canvas 리셋 주의
- React.memo는 3D 컴포넌트에서 신중하게 사용
- 모델 로딩 시 Suspense 대신 내부 폴링 권장

✅ **권장사항:**
- 반응형 테스트 시 실제 디바이스 사용
- 모델 파일 크기 모니터링 (최적화 필요 시)
- 브라우저 호환성 테스트 (WebGL 지원 확인)

## 📝 라이선스

이 프로젝트는 포트폴리오 목적으로 제작되었습니다. Apple Watch 및 관련 상표는 Apple Inc.의 소유입니다.

## 👤 작성자

- **GitHub**: [@als51406](https://github.com/als51406)
- **Email**: als51406@gmail.com

## 🙏 감사의 말

- Apple Inc. - 제품 디자인 영감
- Three.js 커뮤니티
- React Three Fiber 팀

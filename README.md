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
└── FIXES_SUMMARY.md     # 에러 수정 내역
```

## 🎬 주요 섹션

1. **Mainview**: 스크롤 기반 카메라 애니메이션과 인트로 텍스트
2. **MainTextView**: 스크롤 애니메이션 텍스트
3. **Detailview**: 360도 회전 가능한 제품 상세 뷰
4. **ExplainView**: 제품 스펙 및 배터리 정보
5. **Footer**: 프로젝트 정보

## 🐛 문제 해결

프로젝트 개발 중 발생한 주요 이슈와 해결 방법은 [FIXES_SUMMARY.md](./FIXES_SUMMARY.md)를 참고하세요.

## 📝 라이선스

이 프로젝트는 포트폴리오 목적으로 제작되었습니다. Apple Watch 및 관련 상표는 Apple Inc.의 소유입니다.

## 👤 작성자

- **GitHub**: [@als51406](https://github.com/als51406)
- **Email**: als51406@gmail.com

## 🙏 감사의 말

- Apple Inc. - 제품 디자인 영감
- Three.js 커뮤니티
- React Three Fiber 팀

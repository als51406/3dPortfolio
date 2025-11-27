# 🖼️ OG 이미지 생성 가이드

## 📋 개요
SEO 최적화를 위한 Open Graph 이미지 생성 가이드입니다.

---

## 🎯 요구사항

### 이미지 스펙
- **파일명**: `og-image.jpg` (또는 `.png`)
- **크기**: `1200 x 630px` (Facebook, LinkedIn 권장)
- **파일 크기**: 300KB 이하 (로딩 속도)
- **포맷**: JPEG (사진), PNG (텍스트/그래픽)
- **위치**: `public/images/og-image.jpg`

### 디자인 요소
```
┌────────────────────────────────────────────┐
│                                            │
│        [Apple Watch Ultra 2 이미지]         │
│                                            │
│        Apple Watch Ultra 2                 │
│        3D Interactive Portfolio            │
│                                            │
│   극강의 내구성과 최고의 활력을 경험하세요      │
│                                            │
│        [로고/브랜드명]                       │
└────────────────────────────────────────────┐
```

---

## 🛠️ 생성 방법

### 방법 1: Figma/Canva (추천)
1. **Figma** 또는 **Canva**에서 1200x630px 프레임 생성
2. 배경색: `#000000` (검정)
3. 시계 모델 3D 렌더링 이미지 배치
4. 텍스트 추가:
   - 제목: "Apple Watch Ultra 2"
   - 부제: "3D Interactive Portfolio"
   - 설명: "극강의 내구성과 최고의 활력"
5. Export → JPG (Quality: 90%)

### 방법 2: 스크린샷 활용
1. 프로젝트 실행: `npm start`
2. 메인 화면에서 시계가 중앙에 오도록 스크롤
3. 스크린샷 캡처 (Cmd+Shift+4)
4. 이미지 편집 도구로 1200x630px로 크롭
5. 텍스트 오버레이 추가
6. `public/images/og-image.jpg`로 저장

### 방법 3: Three.js 렌더링
```typescript
// 별도 스크립트로 고품질 렌더링 생성 가능
// 필요 시 요청하세요!
```

---

## ✅ 저장 위치

```bash
public/
  └── images/
      └── og-image.jpg    # 여기에 저장!
```

---

## 🧪 테스트 방법

### 1. 로컬 테스트
```bash
# 서버 실행
npm start

# DevTools → Network 탭에서 og-image.jpg 확인
```

### 2. SNS 미리보기 테스트
- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: LinkedIn 게시물 작성 시 미리보기 확인

---

## 📝 현재 HTML 설정

`public/index.html`에 이미 추가되어 있습니다:

```html
<!-- Open Graph -->
<meta property="og:image" content="%PUBLIC_URL%/images/og-image.jpg" />

<!-- Twitter Card -->
<meta name="twitter:image" content="%PUBLIC_URL%/images/og-image.jpg" />
```

**이미지만 추가하면 자동으로 적용됩니다!** ✨

---

## 🎨 디자인 팁

### 색상 팔레트
- **배경**: `#000000` (검정)
- **메인 텍스트**: `#FFFFFF` (흰색)
- **강조 텍스트**: `#007AFF` (애플 블루)
- **서브 텍스트**: `#86868B` (회색)

### 폰트
- **제목**: Noto Sans, Bold (48-64px)
- **본문**: Noto Sans, Regular (24-32px)

### 레이아웃
- 상단 30% 여백
- 중앙에 시계 이미지 (40% 높이)
- 하단에 텍스트 정렬
- 좌우 여백 10%

---

## 🚀 빠른 해결책

### 임시 이미지 사용
지금 당장 이미지가 없다면:

1. **Unsplash**에서 Apple Watch 이미지 다운로드
   - https://unsplash.com/s/photos/apple-watch
   
2. 크기 조정:
   ```bash
   # macOS Preview에서
   Tools → Adjust Size → 1200x630px
   ```

3. 저장:
   ```bash
   public/images/og-image.jpg
   ```

---

## ❓ 자주 묻는 질문

**Q: 이미지가 안 보여요!**
```bash
# 브라우저 캐시 클리어
Cmd+Shift+R (하드 리프레시)
```

**Q: 여러 페이지에 다른 이미지를 쓰려면?**
```html
<!-- 각 페이지마다 동적으로 변경 -->
<meta property="og:image" content="/images/page-specific.jpg" />
```

**Q: 이미지 크기가 300KB를 넘어요!**
```bash
# 압축 도구 사용
- TinyPNG: https://tinypng.com/
- ImageOptim (Mac): https://imageoptim.com/
```

---

## 📚 참고 자료
- [Facebook OG 가이드](https://developers.facebook.com/docs/sharing/webmasters/)
- [Twitter Card 가이드](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Open Graph Protocol](https://ogp.me/)

---

**필요하시면 제가 직접 이미지를 만들어드릴 수도 있습니다!** 🎨
스크린샷을 보내주시면 최적화해드릴게요.

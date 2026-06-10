# 🚨 방구조대 

> 방 사진 찍으면 AI가 **지금 당장 할 정리 순서**만 알려줘요.  
> 전체 다 하라는 게 아니에요. 에너지랑 시간에 맞는 순서만.

**[▶ 바로 써보기](https://bang-gujodae.vercel.app)** &nbsp;·&nbsp; ![App Store 심사 중](https://img.shields.io/badge/App%20Store-심사%20중-16a34a?style=flat-square&logo=apple&logoColor=white)

---

## 왜 만들었냐면

방 정리를 못 하는 이유는 의지력이 없어서가 아니에요.  
"어디서부터 시작해야 하지?"를 몰라서예요.

방구조대는 사진 하나로 그 질문에 답해줘요.

---

## 핵심 기능

| 기능 | 설명 |
|------|------|
| 📸 방 사진 업로드 | 클릭·드래그·카메라 촬영, 512px 자동 압축 |
| 🔢 어지러움 점수 | 0~100 SVG 링 차트로 시각화 |
| 🧹 맞춤 정리 순서 | 에너지·시간에 맞게 3~5단계만 |
| ✅ 체크리스트 | 단계별 완료 체크 + 진행 바 + 격려 메시지 |
| ✕ 스킵 리스트 | 오늘 안 해도 되는 것 명시 |
| 📷 Before / After | 정리 전후 사진 AI 비교 분석 |
| 🔥 연속 스트릭 | 매일 기록하면 연속 일수 누적 |
| 📋 히스토리 | 과거 구조 기록 + 점수 추이 |
| 🔗 공유 | Web Share API로 결과 공유 |
| 🎓 온보딩 | 첫 방문 3단계 가이드 |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, TypeScript) |
| AI | GPT-4o-mini Vision (`detail: "low"`) |
| iOS | Capacitor 7 + server.url |
| 배포 | Vercel |
| 스타일 | TailwindCSS v4 + Inline CSS |

### 비용 최적화

- 클라이언트에서 **512×512 리사이즈** 후 전송
- `detail: "low"` 고정 **85 토큰** 처리
- 요청 1회당 약 **$0.0003** (0.03센트)

---

## 화면 구성

```
/ (홈)          사진 업로드 + 에너지/시간 설정
/result         어지러움 점수 + 체크리스트 + Before/After
/history        구조 히스토리 + 스트릭 통계
/privacy        개인정보 처리방침
/support        고객 지원 + FAQ
```

---

## 로컬 실행

```bash
git clone https://github.com/sauuri/bang-gujodae
cd bang-gujodae
npm install
echo "OPENAI_API_KEY=sk-..." > .env.local
npm run dev
```

---

## 관련 프로젝트

- [ResetPilot](https://github.com/sauuri/reset-pilot) — 오늘 망한 날 복구 플랜 AI
- [대충요리](https://github.com/sauuri/daechungyori) — 있는 재료로 요리 추천
 
 
 

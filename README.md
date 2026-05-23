# 🚨 방구조대

> 방 사진 찍으면 AI가 **지금 당장 할 정리 순서**만 알려줘요.  
> 전체 다 하라는 게 아니에요. 시작 순서만.

**[▶ 바로 써보기](https://bang-gujodae.vercel.app)**

---

## 왜 만들었냐면

방 정리를 못 하는 이유는 의지력이 없어서가 아니에요.  
"어디서부터 시작해야 하지?"를 몰라서예요.

방구조대는 사진 하나로 그 질문에 답해줘요.

---

## 핵심 기능

- 📸 **방 사진 업로드** — 클릭 또는 드래그 앤 드롭, 카메라 직접 촬영 가능
- 🔍 **AI 상태 분석** — 난이도(하/중/상) + 방 상태 요약
- 🧹 **정리 순서 제시** — 에너지·시간에 맞게 3~5단계
- ✕ **오늘 안 해도 되는 것** — 부담 줄이는 스킵 리스트
- ✓ **체크리스트** — 단계별 완료 체크 + 진행 바

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router, TypeScript) |
| AI | GPT-4o-mini Vision (`detail: "low"`) |
| 배포 | Vercel |
| 스타일 | TailwindCSS v4 + Inline CSS |

### 비용 최적화

- 이미지를 클라이언트에서 **512×512로 리사이즈** 후 전송
- `detail: "low"` 옵션으로 이미지를 **고정 85 토큰** 처리
- 요청 1회당 약 **$0.0003** (0.03센트)

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

- [ResetPilot](https://github.com/sauuri/reset-pilot) — 오늘 망한 날 복구 플랜 AI (같은 철학)

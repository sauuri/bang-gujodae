import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { imageBase64, timeLeft, energy, lang = "ko", detail = "low" } = await req.json();

  const isEn = lang === "en";
  const stepCount = energy <= 3 ? (isEn ? "1~2 steps" : "1~2개") : energy <= 6 ? (isEn ? "3~4 steps" : "3~4개") : (isEn ? "4~5 steps" : "4~5개");

  const systemPrompt = isEn
    ? `You are a professional room organizer. Look at the photo and give an immediately actionable cleaning order.

Rules:
1. Step title must be "verb + specific object" (e.g., "Move cups and bottles on desk to kitchen", "Throw floor clothes into laundry basket")
   — Never use vague terms like "clean up" or "organize"
2. Only mention items actually visible in the photo
3. reason is one sentence explaining WHY this order — psychological or efficiency reason
4. skip items must also be based on what's visible in the photo
5. Low energy = only easy fast tasks; high energy = more tasks
Respond in JSON only.`
    : `당신은 방 정리 전문가예요. 사진 속 방을 직접 보고 지금 당장 실행 가능한 정리 순서를 뽑아줍니다.

절대 지켜야 할 규칙:
1. 단계 title은 반드시 "동사 + 구체적 대상"으로 (예: "책상 위 컵·병 주방으로 옮기기", "바닥 옷가지 세탁바구니에 던져 넣기")
   — "정리하기", "청소하기" 같은 뭉뚱그린 표현 금지
2. 사진에서 실제로 보이는 것만 언급할 것 (사진에 없는 물건 언급 금지)
3. reason은 "왜 이 순서인지" 한 문장 — 심리적 이유 또는 효율 이유
4. skip도 사진에서 보이는 것 기준으로만
5. 에너지가 낮으면 아주 쉽고 빠른 것만, 높으면 더 많이
반드시 JSON만 응답하세요.`;

  const userPrompt = isEn
    ? `Energy level: ${energy}/10, Available time: ${timeLeft}

Respond in this JSON format (all text fields in English):
{
  "messScore": 0~100,
  "difficulty": "low|medium|high",
  "difficultyScore": 1~10,
  "summary": "One warm, non-judgmental sentence about the room's state (e.g., 'Looks like a long day — a little effort will make a big difference.')",
  "timeEstimate": "estimated time needed",
  "steps": [
    { "order": 1, "title": "Specific action (name the object)", "duration": "Nm", "reason": "Why this order" }
  ],
  "skip": ["2~3 things visible in photo that can be skipped today"],
  "message": "One line of encouragement perfect for someone at energy ${energy}/10"
}

messScore scale: 0=perfectly clean, 30=slightly messy, 60=quite messy, 80=very messy, 100=chaos
steps count: ${stepCount} (only what can realistically be done in ${timeLeft} at energy ${energy}/10)`
    : `에너지 레벨: ${energy}/10, 가용 시간: ${timeLeft}

아래 JSON 형식으로 응답:
{
  "messScore": 0~100,
  "difficulty": "하|중|상",
  "difficultyScore": 1~10,
  "summary": "이 방의 상태를 따뜻하고 판단 없는 톤으로 한 줄 (예: '하루 피로가 쌓인 것 같아요. 조금만 해도 훨씬 달라질 거예요')",
  "timeEstimate": "실제 소요 예상 시간",
  "steps": [
    { "order": 1, "title": "구체적 행동 (대상 명시)", "duration": "N분", "reason": "이 순서인 이유" }
  ],
  "skip": ["오늘 안 해도 되는 것 — 사진에서 보이는 것 기준 2~3개"],
  "message": "에너지 ${energy}/10인 사람에게 딱 맞는 격려 한 줄"
}

messScore 기준: 0=완벽히 깨끗, 30=약간 어수선, 60=꽤 어지러움, 80=많이 어지러움, 100=혼돈
steps 개수: ${stepCount} (에너지와 시간 ${timeLeft} 안에 실제로 끝낼 수 있는 것만)`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageBase64, detail: detail as "low" | "high" } },
            { type: "text", text: userPrompt },
          ],
        },
      ],
      max_tokens: 1100,
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json(data);
  } catch (err) {
    console.error("[rescue] OpenAI error:", err);
    return NextResponse.json({ error: "AI 분석에 실패했어요." }, { status: 500 });
  }
}

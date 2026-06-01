import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { imageBase64, timeLeft, energy, lang = "ko" } = await req.json();

  const isEn = lang === "en";

  const systemPrompt = isEn
    ? `You are a focus coach for room organization. Break down the cleaning into micro-tasks that are:
1. Max 30 seconds each
2. Explicit action (exactly what to do, what object)
3. One action per micro-task
4. Easy to follow without thinking
5. Designed for low attention span or ADHD

Example breakdown:
- "Pick up 1 red cup" (not "clean cups")
- "Walk to kitchen"
- "Put cup in sink"
- "Return to room"
- "Pick up next cup"

Respond in JSON only.`
    : `당신은 방 정리 집중 코치예요. 정리를 마이크로태스크로 분해합니다:
1. 각 단계는 최대 30초
2. 정확한 행동 ("컵을 치운다" X, "빨간 컵 하나만 집는다" O)
3. 한 번에 한 가지만
4. 생각 없이 따라하면 됨
5. 주의력 산만이나 ADHD가 있는 사람을 고려

분해 예시:
- "빨간 컵 하나만 집기" (X "컵들 치우기")
- "부엌으로 가기"
- "싱크에 놓기"
- "돌아오기"
- "다음 컵 집기"

반드시 JSON만 응답하세요.`;

  const userPrompt = isEn
    ? `Energy: ${energy}/10, Time: ${timeLeft}

Break the room cleaning into micro-tasks. Respond in JSON:
{
  "microSteps": [
    { "order": 1, "action": "Exact micro-action (what + object)", "durationSec": 10-30 }
  ],
  "encouragement": "One motivating sentence for energy level ${energy}/10"
}

- Each micro-step MUST be 30 seconds max
- Each step is ONE action (pick up, walk, put down, etc)
- Total steps should take roughly ${timeLeft}
- Action must be explicit and specific`
    : `에너지: ${energy}/10, 시간: ${timeLeft}

정리를 마이크로태스크로 분해해주세요. JSON 형식:
{
  "microSteps": [
    { "order": 1, "action": "정확한 행동 (뭘 어디에)", "durationSec": 10-30 }
  ],
  "encouragement": "에너지 ${energy}/10에게 딱 맞는 격려 한 줄"
}

- 각 마이크로태스크는 최대 30초
- 한 번에 한 가지 행동만 (집기, 가기, 놓기 등)
- 전체 소요 시간이 대략 ${timeLeft} 정도
- 행동은 명확하고 구체적이어야 함`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageBase64, detail: "low" } },
          { type: "text", text: userPrompt },
        ],
      },
    ],
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const data = JSON.parse(completion.choices[0].message.content || "{}");
  return NextResponse.json(data);
}

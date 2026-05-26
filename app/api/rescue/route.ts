import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { imageBase64, timeLeft, energy } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `당신은 방 정리 전문가예요. 방 사진을 보고 지금 당장 시작할 수 있는 정리 순서를 알려줍니다.
핵심 원칙:
- 방 전체를 다 정리하라고 하지 마세요
- 에너지와 시간에 맞게 현실적인 단계만 제시하세요
- 가장 쉬운 것부터 시작하도록 순서를 짜주세요
- 각 단계는 구체적이고 즉시 실행 가능해야 해요
반드시 JSON만 응답하세요.`,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageBase64, detail: "low" },
          },
          {
            type: "text",
            text: `에너지 레벨: ${energy}/10, 가용 시간: ${timeLeft}

아래 JSON 형식으로 응답해주세요:
{
  "messScore": 0~100,
  "difficulty": "하|중|상",
  "difficultyScore": 1~10,
  "summary": "방 상태 한 줄 요약 (따뜻하고 판단 없는 톤으로)",
  "timeEstimate": "실제 소요 예상 시간",
  "steps": [
    { "order": 1, "title": "할 일", "duration": "N분", "reason": "이 순서인 이유 한 줄" }
  ],
  "skip": ["오늘 안 해도 되는 것 2~3개"],
  "message": "격려 메시지 한 줄"
}

messScore: 방 어지러움 점수 (0=완벽하게 깨끗, 100=아무것도 안 보일 정도로 어지러움)
steps는 에너지와 시간에 맞게 3~5개, 각 단계는 5~15분 이내로.`,
          },
        ],
      },
    ],
    max_tokens: 900,
    response_format: { type: "json_object" },
  });

  const data = JSON.parse(completion.choices[0].message.content || "{}");
  return NextResponse.json(data);
}

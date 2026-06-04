import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { beforeImage, afterImage, lang = "ko" } = await req.json();
  const isEn = lang === "en";

  const prompt = isEn
    ? `Compare the before and after photos and respond in this JSON format only:
{
  "changes": ["2-3 specific visible changes (e.g., 'Clothes on the floor are gone', 'The desk looks much clearer')"],
  "praise": "2 sentences of genuine praise based on actual visible changes. No exaggeration, only what's visible.",
  "score": 1~10
}

score: 1=barely different, 5=clearly improved, 10=completely different room
- Find changes even if angle or lighting differs
- Always acknowledge the act of starting, even if changes are small
- Make praise feel good enough to share on social media`
    : `정리 전·후 사진을 비교해서 아래 JSON으로만 응답하세요:
{
  "changes": ["실제로 눈에 보이는 구체적 변화 2~3가지 (예: '바닥의 옷가지가 사라졌어요', '책상 위가 훨씬 넓어졌어요')"],
  "praise": "실제 변화에 근거한 진심 어린 칭찬 2문장. 과장 없이, 사진에서 보이는 것만 언급.",
  "score": 1~10
}

score 기준: 1=거의 차이 없음, 5=확실히 나아짐, 10=완전히 다른 방
- 각도·조명이 달라도 최대한 변화를 찾을 것
- 변화가 적더라도 "시작한 것 자체"를 반드시 인정할 것
- praise는 SNS에 자랑하고 싶을 만큼 기분 좋게`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: isEn ? "Before photo." : "정리 전 사진입니다." },
            { type: "image_url", image_url: { url: beforeImage, detail: "low" } },
            { type: "text", text: isEn ? "After photo." : "정리 후 사진입니다." },
            { type: "image_url", image_url: { url: afterImage, detail: "low" } },
            { type: "text", text: prompt },
          ],
        },
      ],
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json(data);
  } catch (err) {
    console.error("[compare] OpenAI error:", err);
    return NextResponse.json({ error: isEn ? "Comparison failed." : "비교 분석에 실패했어요." }, { status: 500 });
  }
}

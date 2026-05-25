import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { beforeImage, afterImage } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "정리 전 사진입니다." },
          { type: "image_url", image_url: { url: beforeImage, detail: "low" } },
          { type: "text", text: "정리 후 사진입니다." },
          { type: "image_url", image_url: { url: afterImage, detail: "low" } },
          {
            type: "text",
            text: `두 사진을 비교해서 아래 JSON으로만 응답하세요:
{
  "changes": ["눈에 띄는 변화 2~3가지. 구체적으로."],
  "praise": "따뜻하고 진심 어린 칭찬 2~3문장. 과장 없이, 실제 변화에 기반해서.",
  "score": 1~10
}

score: 전후 변화가 얼마나 드라마틱한지 (1=거의 변화 없음, 10=완전히 달라짐)
각도나 조명이 달라도 최대한 변화를 찾아보세요.
변화가 적어도 "시작했다는 것 자체"를 칭찬하세요.`,
          },
        ],
      },
    ],
    max_tokens: 300,
    response_format: { type: "json_object" },
  });

  const data = JSON.parse(completion.choices[0].message.content || "{}");
  return NextResponse.json(data);
}

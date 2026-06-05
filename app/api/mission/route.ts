import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type Situation =
  | "quick"    // 지금 하나만
  | "guest"    // 손님 와요
  | "desk"     // 책상만 살려줘
  | "bed"      // 침대에서 못 일어나겠어요
  | "sleep"    // 자기 전 2분

export async function POST(req: NextRequest) {
  const {
    situation = "quick",
    energy = 3,
    timeMinutes = 2,
    lang = "ko",
    breakdown,
    category,            // 지금 제일 거슬리는 것 (옷/컵/쓰레기/책상/침대)
  }: {
    situation?: Situation;
    energy?: number;
    timeMinutes?: number;
    lang?: string;
    breakdown?: string;
    category?: string;
  } = await req.json();

  const categoryHint = category && category !== "모르겠음" && category !== "idk"
    ? (lang === "en"
        ? `Focus area: ${category}. Give a mission related to this.`
        : `집중 영역: ${category}. 이것과 관련된 미션을 줘.`)
    : "";

  const isEn = lang === "en";

  const situationContext = isEn
    ? {
        quick: "The user wants to do just one quick thing right now.",
        guest: `A guest is arriving in about ${timeMinutes} minutes. Prioritize visible areas: entrance, living space, surfaces. No deep cleaning — just rescue the appearance.`,
        desk: "The user only wants to fix their desk/work area. Ignore the rest of the room.",
        bed:  "The user can barely get out of bed. Give the absolute smallest possible action — something they can do without getting up if possible.",
        sleep: "It's bedtime. Give a 2-minute reset mission so they can sleep comfortably.",
      }[situation]
    : {
        quick: "사용자가 지금 당장 한 가지만 빠르게 하고 싶어함.",
        guest: `약 ${timeMinutes}분 후에 손님이 옴. 현관, 거실, 눈에 보이는 공간 우선. 완벽 정리 X, 겉보기 구조 O.`,
        desk:  "책상/작업 공간만 정리하고 싶어함. 방 나머지는 무시.",
        bed:   "침대에서 못 일어날 것 같은 상태. 가능한 한 가장 작은 행동 — 일어나지 않아도 되는 것이면 더 좋음.",
        sleep: "자려고 누운 상태. 2분 안에 끝낼 수 있는 리셋 미션.",
      }[situation];

  const energyDesc = isEn
    ? ["", "Almost no energy — tiny action only", "Very low energy", "Some energy", "Decent energy", "Full energy"][energy] ?? "Some energy"
    : ["", "에너지 거의 없음 — 아주 작은 행동만", "에너지 매우 낮음", "조금 있음", "어느 정도 있음", "풀에너지"][energy] ?? "조금 있음";

  const systemPrompt = isEn
    ? `You are an action coach for people who struggle to start cleaning. Your job is NOT to give a cleaning plan — it is to give ONE tiny action that takes ${timeMinutes <= 2 ? "under 2 minutes" : `about ${timeMinutes} minutes`}.

Rules:
- ONE action only. Not a list.
- Action must be hyper-specific: name the exact object and exact movement.
  Good: "Pick up the closest cup and carry it to the kitchen sink"
  Bad: "Clean up the cups"
- If energy is very low (1-2), the action must be doable in 30 seconds or less.
- Never say "organize", "clean up", "tidy" — always say exactly what to grab/move/throw.
- Tone: warm, zero judgment, like a kind friend.

Respond in JSON only.`
    : `당신은 정리 시작을 못 하는 사람들을 위한 행동 코치예요. 정리 계획을 주는 게 아니라, 지금 당장 할 수 있는 행동 딱 하나만 줍니다.

규칙:
- 행동은 반드시 하나만. 목록 금지.
- 초구체적으로: 정확히 어떤 물건을, 어떻게 움직이는지.
  좋음: "가장 가까운 컵 하나를 집어서 주방 싱크대에 놓기"
  나쁨: "컵 치우기"
- 에너지가 1~2면 30초 이내에 끝낼 수 있어야 함.
- "정리하기", "치우기" 같은 모호한 표현 금지. 정확히 집고/옮기고/버리는 동작.
- 톤: 따뜻하고 판단 없이, 친한 친구처럼.

반드시 JSON만 응답하세요.`;

  const buildPrompt = () => {
    if (breakdown) {
      return isEn
        ? `The user said "${breakdown}" is too hard. Break it down into an even smaller action.
The new action should be something they can do in 10-20 seconds without thinking.
Examples:
- Instead of "carry cup to kitchen" → "just pick up the cup (don't go anywhere yet)"
- Instead of "pick up the cup" → "look at the closest cup and touch it"

Respond:
{
  "mission": "exact micro-action (one sentence)",
  "durationSec": 10-30,
  "encouragement": "one warm sentence acknowledging this is hard",
  "isBreakdown": true
}`
        : `사용자가 "${breakdown}"이 너무 어렵다고 했어요. 이것보다 훨씬 더 작은 행동으로 쪼개주세요.
새 행동은 생각 없이 10~20초 안에 할 수 있어야 해요.
예시:
- "컵을 주방으로 가져가기" → "컵을 손으로 집기만 하기 (아직 움직이지 않아도 됨)"
- "컵 집기" → "가장 가까운 컵을 눈으로 고르고 손가락으로 건드려보기"

응답:
{
  "mission": "정확한 마이크로 행동 (한 문장)",
  "durationSec": 10-30,
  "encouragement": "이게 힘들다는 걸 인정하는 따뜻한 한 문장",
  "isBreakdown": true
}`;
    }

    return isEn
      ? `Context: ${situationContext}
User energy: ${energyDesc}
Available time: ${timeMinutes} minutes${categoryHint ? `\n${categoryHint}` : ""}

Give ONE mission:
{
  "mission": "exact action — verb + specific object + destination (one sentence)",
  "durationSec": estimated seconds (10-120),
  "encouragement": "one sentence — warm, like a friend, matched to energy level ${energy}/5",
  "isBreakdown": false
}`
      : `상황: ${situationContext}
에너지 상태: ${energyDesc}
가용 시간: ${timeMinutes}분${categoryHint ? `\n${categoryHint}` : ""}

미션 하나:
{
  "mission": "정확한 행동 — 동사 + 구체적 대상 + 목적지 (한 문장)",
  "durationSec": 예상 소요 초 (10-120),
  "encouragement": "따뜻한 한 문장, 에너지 ${energy}/5에 맞게",
  "isBreakdown": false
}`;
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildPrompt() },
      ],
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json(data);
  } catch (err) {
    console.error("[mission] error:", err);
    const fallback = isEn
      ? { mission: "Pick up the closest item on the floor and put it somewhere it belongs.", durationSec: 20, encouragement: "You opened the app. That already counts.", isBreakdown: false }
      : { mission: "바닥에 가장 가까이 있는 물건 하나를 집어서 제자리에 놓기.", durationSec: 20, encouragement: "앱을 켰다는 것만으로도 시작이에요.", isBreakdown: false };
    return NextResponse.json(fallback);
  }
}

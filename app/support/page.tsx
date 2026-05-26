export default function SupportPage() {
  return (
    <main style={{ maxWidth: 460, margin: "0 auto", padding: "40px 20px 80px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#dcfce7", borderRadius: 50, padding: "5px 14px", marginBottom: 20 }}>
        <span style={{ fontSize: 14 }}>🚨</span>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: "#16a34a" }}>방구조대</span>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111", marginBottom: 8 }}>고객 지원</h1>
      <p style={{ fontSize: 13, color: "#8e8e93", marginBottom: 32 }}>문제가 생겼나요? 도와드릴게요.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* 문의 */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 12 }}>📧 이메일 문의</h2>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 12 }}>
            앱 사용 중 문제가 생기거나 궁금한 점이 있으면 이메일로 연락해주세요.
            보통 1~2일 내로 답변드려요.
          </p>
          <a href="mailto:dlwjdghks9729@gmail.com"
            style={{ display: "inline-block", background: "#16a34a", color: "white", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            dlwjdghks9729@gmail.com
          </a>
        </div>

        {/* FAQ */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 16 }}>자주 묻는 질문</h2>
          {[
            {
              q: "사진이 어디에 저장되나요?",
              a: "사진은 저장되지 않아요. AI 분석 후 즉시 삭제되며, 분석 결과만 기기에 저장돼요.",
            },
            {
              q: "분석이 너무 오래 걸려요.",
              a: "AI 분석은 보통 5~15초 정도 걸려요. 네트워크 상태에 따라 더 걸릴 수 있어요.",
            },
            {
              q: "기록이 사라졌어요.",
              a: "기록은 기기 브라우저에 저장돼요. 브라우저 데이터를 삭제하면 기록도 사라져요.",
            },
            {
              q: "한 번에 너무 많은 걸 시키는 것 같아요.",
              a: "에너지 슬라이더를 낮게, 시간을 짧게 설정하면 더 적은 단계가 나와요.",
            },
            {
              q: "Before/After 비교가 작동 안 해요.",
              a: "정리 후 사진을 업로드하고 '얼마나 달라졌는지 봐줘' 버튼을 눌러주세요. 최소 1개 항목을 체크해야 나타나요.",
            },
          ].map(({ q, a }, i) => (
            <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < 4 ? "1px solid #f0f0f0" : "none" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 6 }}>Q. {q}</div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>A. {a}</div>
            </div>
          ))}
        </div>

        {/* 개인정보 */}
        <div style={{ background: "#f0fdf4", borderRadius: 20, padding: "20px 24px", border: "1px solid #bbf7d0" }}>
          <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.7 }}>
            개인정보 처리방침은{" "}
            <a href="/privacy" style={{ color: "#16a34a", fontWeight: 700 }}>여기</a>
            에서 확인하실 수 있어요.
          </p>
        </div>

      </div>
    </main>
  );
}

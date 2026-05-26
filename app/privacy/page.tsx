export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 460, margin: "0 auto", padding: "40px 20px 80px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#dcfce7", borderRadius: 50, padding: "5px 14px", marginBottom: 20 }}>
        <span style={{ fontSize: 14 }}>🚨</span>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: "#16a34a" }}>방구조대</span>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111", marginBottom: 8 }}>개인정보 처리방침</h1>
      <p style={{ fontSize: 13, color: "#8e8e93", marginBottom: 32 }}>최종 업데이트: 2025년 5월</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, fontSize: 14, color: "#374151", lineHeight: 1.8 }}>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 8 }}>1. 수집하는 정보</h2>
          <p>방구조대는 다음 정보를 처리합니다:</p>
          <ul style={{ marginTop: 8, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
            <li><strong>방 사진:</strong> 분석을 위해 OpenAI GPT-4o API에 전송되며, 서버에 저장하지 않습니다.</li>
            <li><strong>에너지 수준 / 가용 시간:</strong> 분석 요청 시 함께 전송되며 저장하지 않습니다.</li>
            <li><strong>분석 결과 / 기록:</strong> 사용자 기기의 로컬 스토리지에만 저장됩니다.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 8 }}>2. 정보 이용 목적</h2>
          <p>수집된 정보는 방 정리 순서 추천 기능 제공에만 사용됩니다. 마케팅, 광고, 제3자 제공 등 다른 목적으로 사용하지 않습니다.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 8 }}>3. 제3자 서비스</h2>
          <p>방구조대는 AI 분석을 위해 <strong>OpenAI API</strong>를 사용합니다. 업로드한 이미지는 OpenAI 서버로 전송되며, OpenAI의 개인정보처리방침이 적용됩니다.</p>
          <p style={{ marginTop: 8 }}>
            <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "#16a34a" }}>
              OpenAI 개인정보처리방침 →
            </a>
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 8 }}>4. 데이터 보관</h2>
          <p>모든 기록 데이터(분석 결과, 스트릭, 히스토리)는 사용자 기기의 브라우저 로컬 스토리지에만 저장됩니다. 서버에는 어떤 개인정보도 저장하지 않습니다. 언제든지 기기의 브라우저 설정에서 삭제할 수 있습니다.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 8 }}>5. 아동 개인정보</h2>
          <p>방구조대는 만 14세 미만 아동으로부터 고의로 개인정보를 수집하지 않습니다.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 8 }}>6. 문의</h2>
          <p>개인정보 처리에 관한 문의는 아래로 연락해주세요:</p>
          <p style={{ marginTop: 8 }}>
            <a href="mailto:dlwjdghks9729@gmail.com" style={{ color: "#16a34a", fontWeight: 700 }}>dlwjdghks9729@gmail.com</a>
          </p>
        </section>

      </div>
    </main>
  );
}

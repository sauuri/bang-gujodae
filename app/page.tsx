"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 512;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = url;
  });
}

export default function Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview]     = useState<string | null>(null);
  const [imageB64, setImageB64]   = useState<string | null>(null);
  const [energy, setEnergy]       = useState(5);
  const [timeLeft, setTimeLeft]   = useState("20분");
  const [loading, setLoading]     = useState(false);
  const [dragOver, setDragOver]   = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const b64 = await resizeImage(file);
    setImageB64(b64);
    setPreview(b64);
  }

  async function handleSubmit() {
    if (!imageB64) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageB64, timeLeft, energy }),
      });
      const data = await res.json();
      localStorage.setItem("rescueResult", JSON.stringify({ ...data, imageB64 }));
      router.push("/result");
    } catch {
      alert("오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "32px 16px 80px" }}>

      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <span className="flight-tag" style={{ marginBottom: 10, display: "inline-flex" }}>🚨 방구조대</span>
        <h1 style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.4, color: "white", margin: "8px 0 0", textShadow: "0 2px 10px rgba(10,36,99,0.25)" }}>
          방 사진 찍으면<br />
          <span style={{ color: "#FFE066" }}>AI가 정리 순서 알려줄게요.</span>
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 8, lineHeight: 1.6 }}>
          전체 다 하라는 게 아니에요. 지금 당장 할 수 있는 순서만.
        </p>
      </div>

      {/* 탑승권 카드 */}
      <div className="ticket animate-fadeInUp">

        <div className="ticket-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>ROOM RESCUE REQUEST</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "white" }}>정리 순서 분석</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>MISSION</div>
              <div className="gauge" style={{ fontSize: 16, fontWeight: 900, color: "#6ee7e0" }}>RRM-001</div>
            </div>
          </div>
        </div>

        <div className="ticket-body">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* 사진 업로드 */}
            <div>
              <div className="ticket-label">방 사진 업로드</div>
              <div
                className={`upload-area${dragOver ? " drag-over" : ""}`}
                style={{ marginTop: 8, position: "relative" }}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10 }} />
                    <div style={{ marginTop: 8, fontSize: 11, color: "#9ab8cc" }}>다른 사진으로 바꾸려면 탭하세요</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📸</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#4e6e82", marginBottom: 4 }}>사진을 여기에 올려주세요</div>
                    <div style={{ fontSize: 12, color: "#9ab8cc" }}>클릭하거나 드래그 · 자동으로 압축돼서 업로드돼요</div>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
            </div>

            {/* 에너지 */}
            <div>
              <div className="ticket-label">지금 에너지</div>
              <div style={{ marginTop: 4, marginBottom: 6 }}>
                <span className="gauge" style={{ fontSize: 26, fontWeight: 900, color: "#FF6B35" }}>{energy}</span>
                <span style={{ fontSize: 12, color: "#9ab8cc" }}>/10</span>
              </div>
              <input type="range" min={1} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="slider" />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={{ fontSize: 10, color: "#9ab8cc" }}>방전</span>
                <span style={{ fontSize: 10, color: "#9ab8cc" }}>충전</span>
              </div>
            </div>

            {/* 시간 */}
            <div>
              <div className="ticket-label">쓸 수 있는 시간</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
                {["10분", "20분", "30분", "1시간"].map((t) => (
                  <button key={t} onClick={() => setTimeLeft(t)} style={{
                    padding: "9px 4px", borderRadius: 8, border: "1.5px solid",
                    borderColor: timeLeft === t ? "#0A2463" : "rgba(165,210,238,0.5)",
                    background: timeLeft === t ? "#0A2463" : "rgba(255,255,255,0.4)",
                    color: timeLeft === t ? "white" : "#4e6e82",
                    fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="ticket-tear" />

        <div className="ticket-stub" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 20, flex: 1 }}>
            <div>
              <div className="ticket-label">ENERGY</div>
              <div className="gauge" style={{ fontSize: 18, fontWeight: 900, color: "#FF6B35" }}>{energy}/10</div>
            </div>
            <div>
              <div className="ticket-label">TIME</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1DB4A8" }}>{timeLeft}</div>
            </div>
            <div>
              <div className="ticket-label">PHOTO</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: preview ? "#1DB4A8" : "#9ab8cc" }}>
                {preview ? "READY ✓" : "PENDING"}
              </div>
            </div>
          </div>
          <div className="barcode" style={{ width: 56, flexShrink: 0 }} />
        </div>
      </div>

      <button
        className="btn-primary animate-fadeInUp animate-delay-1"
        onClick={handleSubmit}
        disabled={loading || !imageB64}
        style={{ marginTop: 16 }}
      >
        {loading ? "🔍 방 분석 중..." : "🚨 정리 순서 뽑아줘"}
      </button>

    </main>
  );
}

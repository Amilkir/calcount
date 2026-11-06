import { ImageResponse } from "next/og";

// Preview para WhatsApp, X, etc. Se genera una sola vez en el build (no usa APIs de request).
export const alt = "Calcount: come con un plan, sin vivir contando";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MACROS = [
  { label: "Proteína", pct: 72, color: "#ff5d7a" },
  { label: "Carbohidratos", pct: 76, color: "#4c8df6" },
  { label: "Grasa", pct: 71, color: "#ffb020" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#fcf8f4",
          color: "#231c2b",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 600 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#d84c0a" }}>Calcount</div>
          <div style={{ marginTop: 28, fontSize: 72, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Come con un plan, sin vivir contando.
          </div>
          <div style={{ marginTop: 28, fontSize: 28, lineHeight: 1.35, color: "#5f524d" }}>
            Tus calorías y macros según tu cuerpo, y tu día registrado en segundos.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 380,
            padding: 32,
            background: "#ffffff",
            border: "2px solid #eaded3",
            borderRadius: 8,
            transform: "rotate(2deg)",
          }}
        >
          <div style={{ fontSize: 20, color: "#7e7068" }}>Calorías restantes</div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 4 }}>
            <span style={{ fontSize: 76, fontWeight: 700, color: "#0b7a66" }}>412</span>
            <span style={{ fontSize: 26, marginLeft: 10, color: "#7e7068" }}>kcal</span>
          </div>
          <div style={{ display: "flex", height: 14, marginTop: 12, background: "#f5eee7", borderRadius: 7 }}>
            <div style={{ width: "79%", background: "#19b89a", borderRadius: 7 }} />
          </div>
          {MACROS.map((m) => (
            <div key={m.label} style={{ display: "flex", flexDirection: "column", marginTop: 20 }}>
              <div style={{ fontSize: 18, color: "#473d3c" }}>{m.label}</div>
              <div style={{ display: "flex", height: 8, marginTop: 6, background: "#f5eee7", borderRadius: 4 }}>
                <div style={{ width: `${m.pct}%`, background: m.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}

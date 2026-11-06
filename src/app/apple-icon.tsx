import { ImageResponse } from "next/og";

// Ícono para "Agregar a inicio" en iOS. Se genera una vez en el build.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ff8744, #d84c0a)",
        }}
      >
        {/* Misma llama que FlameIcon y icon.svg. */}
        <svg width="110" height="110" viewBox="0 0 24 24">
          <path
            fill="#fff"
            d="M12.6 2.5c.5 3 4.9 5.3 4.9 10.6a5.5 5.5 0 0 1-11 0c0-2.6 1.2-4.4 2.6-5.7.1 1.9.9 3 2 3.4-.6-3 .1-5.9 1.5-8.3Z"
          />
        </svg>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

export const alt = "Paratech — Design. Build. Grow. Automate.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0a09",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              width: 26,
              gap: 4,
            }}
          >
            <div style={{ width: 11, height: 11, background: "#c08040" }} />
            <div
              style={{ width: 11, height: 11, background: "rgba(244,241,234,0.3)" }}
            />
            <div
              style={{ width: 11, height: 11, background: "rgba(244,241,234,0.3)" }}
            />
            <div
              style={{ width: 11, height: 11, background: "rgba(244,241,234,0.3)" }}
            />
          </div>
          <div style={{ fontSize: 34, color: "#f4f1ea", fontWeight: 600 }}>
            Paratech
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 66,
              lineHeight: 1.08,
              color: "#f4f1ea",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              maxWidth: 940,
              display: "flex",
            }}
          >
            We design, build, and automate the systems modern businesses run on.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 27,
              color: "#b5afa6",
              display: "flex",
            }}
          >
            AI &amp; Automation · Web &amp; Software · Growth · Data
          </div>
        </div>

        <div
          style={{
            display: "flex",
            borderTop: "1px solid #2a2521",
            paddingTop: 26,
            fontSize: 23,
            color: "#8a847b",
          }}
        >
          paratech.agency
        </div>
      </div>
    ),
    size
  );
}

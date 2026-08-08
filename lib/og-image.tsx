import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Shared by app/opengraph-image.tsx and app/twitter-image.tsx (and any
// route-specific OG image, e.g. app/billing/opengraph-image.tsx) so the
// brand-safe composition — gradient, mark, type scale — lives in one place.
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export async function renderBrandOgImage({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const logoData = await readFile(join(process.cwd(), "public/landing/final-center-logo.png"));
  const logoSrc = Uint8Array.from(logoData).buffer;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#312e81",
          backgroundImage: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* @ts-expect-error -- satori accepts a raw image ArrayBuffer as src */}
          <img src={logoSrc} width={72} height={72} style={{ borderRadius: 18 }} />
          <span style={{ fontSize: 32, fontWeight: 700, color: "#ffffff", letterSpacing: -0.5 }}>AutoPilot</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 600,
            color: "#c7d2fe",
            marginTop: 56,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 800,
            color: "#ffffff",
            marginTop: 20,
            lineHeight: 1.08,
            maxWidth: 980,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.82)",
            marginTop: 28,
            maxWidth: 880,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE },
  );
}

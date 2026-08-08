import { OG_CONTENT_TYPE, OG_IMAGE_SIZE, renderBrandOgImage } from "@/lib/og-image";

export const alt = "AutoPilot — Social Media Automation on Autopilot";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderBrandOgImage({
    eyebrow: "AI growth engine for social automation",
    title: "Automate your entire social presence.",
    subtitle: "GitHub activity to LinkedIn posts, AI Instagram replies, and smart scheduling — from one dashboard.",
  });
}

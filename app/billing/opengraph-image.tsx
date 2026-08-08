import { OG_CONTENT_TYPE, OG_IMAGE_SIZE, renderBrandOgImage } from "@/lib/og-image";

export const alt = "AutoPilot Pricing — Simple, transparent plans";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderBrandOgImage({
    eyebrow: "Pricing",
    title: "Simple, transparent pricing.",
    subtitle: "Start free. Upgrade to Pro or Unlimited as your social automation and customer engagement grow.",
  });
}

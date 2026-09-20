import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const PALETTE: Record<string, { bg: [string, string]; text: string; accent: string }> = {
  ivory: { bg: ["#F3ECDD", "#E8DCC4"], text: "#211F1D", accent: "#B08D57" },
  charcoal: { bg: ["#33302C", "#211F1D"], text: "#FAF7F0", accent: "#CBA968" },
  forest: { bg: ["#2E4A3D", "#1F332B"], text: "#FAF7F0", accent: "#CBA968" },
  burgundy: { bg: ["#8C2E3B", "#6E1F2A"], text: "#FAF7F0", accent: "#CBA968" },
};

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Generates a branded placeholder image entirely locally (SVG rasterized to
 * PNG via sharp) — no network request, ever. Used for seed/demo data so the
 * storefront never depends on a third-party image CDN being reachable.
 * Real product photos uploaded via the admin panel replace these normally.
 */
export async function generatePlaceholderImage(opts: {
  title: string;
  subtitle?: string;
  palette?: keyof typeof PALETTE;
  width?: number;
  height?: number;
}): Promise<Buffer> {
  const { title, subtitle, width = 900, height = 1200 } = opts;
  const p = PALETTE[opts.palette ?? "ivory"]!;
  const lines = wrapText(title, 16);
  const lineHeight = 52;
  const subtitleGap = subtitle ? 46 : 0;
  const blockHeight = (lines.length - 1) * lineHeight + subtitleGap;
  const startY = height / 2 - blockHeight / 2;

  const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.bg[0]}"/>
      <stop offset="100%" stop-color="${p.bg[1]}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="${p.accent}" stroke-width="1.5" opacity="0.5"/>
  ${lines
    .map(
      (line, i) =>
        `<text x="50%" y="${startY + i * lineHeight}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="42" fill="${p.text}">${escapeXml(line)}</text>`
    )
    .join("\n  ")}
  ${
    subtitle
      ? `<text x="50%" y="${startY + lines.length * lineHeight + 20}" text-anchor="middle" font-family="Georgia, serif" font-size="20" letter-spacing="3" fill="${p.accent}">${escapeXml(subtitle.toUpperCase())}</text>`
      : ""
  }
</svg>`.trim();

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function saveSeedImage(
  slug: string,
  opts: Parameters<typeof generatePlaceholderImage>[0]
): Promise<string> {
  const seedDir = path.join(process.cwd(), "public", "seed");
  await mkdir(seedDir, { recursive: true });
  const filename = `${slug}.png`;
  const buffer = await generatePlaceholderImage(opts);
  await writeFile(path.join(seedDir, filename), buffer);
  return `/seed/${filename}`;
}

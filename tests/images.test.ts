import { it, expect } from "vitest";
import sharp from "sharp";
import { optimizeImage } from "../src/lib/images";
it("corrects EXIF orientation, strips metadata and creates WebP", async () => {
  const source = await sharp({
    create: { width: 40, height: 20, channels: 3, background: "#335e4d" },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const output = await optimizeImage(source, "image/jpeg");
  const m = await sharp(output).metadata();
  expect(m.format).toBe("webp");
  expect(m.width).toBe(20);
  expect(m.height).toBe(40);
  expect(m.exif).toBeUndefined();
});
it("rejects oversized files and disguised SVG content", async () => {
  await expect(
    optimizeImage(Buffer.alloc(10 * 1024 * 1024 + 1), "image/png"),
  ).rejects.toThrow("10 MB");
  await expect(
    optimizeImage(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"></svg>',
      ),
      "image/png",
    ),
  ).rejects.toThrow("conteúdo");
});

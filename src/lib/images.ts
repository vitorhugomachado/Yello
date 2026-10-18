import sharp from "sharp";
export async function optimizeImage(bytes: Buffer, mime: string) {
  if (
    bytes.length > 10 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "image/webp"].includes(mime)
  )
    throw Error("Envie JPG, PNG ou WebP, até 10 MB.");
  const pipeline = sharp(bytes, { limitInputPixels: 40000000 });
  const metadata = await pipeline.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format || ""))
    throw Error("O conteúdo do arquivo não é JPG, PNG ou WebP.");
  return pipeline
    .rotate()
    .resize({
      width: 1920,
      height: 1920,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();
}

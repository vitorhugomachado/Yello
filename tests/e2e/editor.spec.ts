import { test, expect } from "@playwright/test";

test("focused editing retains values and gallery changes in demo", async ({
  page,
}, testInfo) => {
  await page.goto("/demo/editor");
  await expect(
    page.getByRole("heading", { name: "Informações básicas" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Título do imóvel:/ }).click();
  const dialog = page.locator("dialog[open]");
  await dialog
    .getByLabel("Título do imóvel", { exact: true })
    .fill("Casa com jardim e varanda");
  await dialog.getByRole("button", { name: "Concluir" }).click();
  await expect(
    page.getByRole("button", { name: /^Título do imóvel:/ }),
  ).toContainText("Casa com jardim e varanda");
  await page.getByRole("button", { name: /^Descrição:/ }).click();
  await dialog
    .getByLabel("Descrição", { exact: true })
    .fill("Descrição preservada ao editar o imóvel e voltar.");
  await dialog.getByRole("button", { name: "Concluir" }).click();
  await page.getByRole("button", { name: /^Preço:/ }).click();
  await dialog.getByLabel("Preço", { exact: true }).fill("");
  await dialog.getByRole("button", { name: "Concluir" }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await page.getByRole("button", { name: /Galeria de fotos/ }).click();
  const original = await dialog
    .locator(".thumb img")
    .nth(1)
    .getAttribute("src");
  await dialog.getByRole("button", { name: "Usar foto 2 como capa" }).click();
  await expect(dialog.locator(".thumb img").first()).toHaveAttribute(
    "src",
    original!,
  );
  await dialog
    .getByLabel("Adicionar fotos", { exact: true })
    .setInputFiles({
      name: "foto.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jz1sAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(dialog.locator(".thumb")).toHaveCount(5);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-editor-gallery.png`,
  });
  await dialog.getByRole("button", { name: "Voltar ao imóvel" }).click();
  await page.getByRole("button", { name: /Galeria de fotos/ }).click();
  await expect(dialog.locator(".thumb")).toHaveCount(5);
  await dialog.getByRole("button", { name: "Voltar ao imóvel" }).click();
  await page.getByRole("button", { name: "Validar prévia" }).click();
  await expect(page.getByRole("status")).toContainText("Prévia validada");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-editor.png`,
    fullPage: true,
  });
});

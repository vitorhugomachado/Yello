import { test, expect } from "@playwright/test";
test("mobile discovery, favorites, gallery and sharing", async ({
  page,
}, testInfo) => {
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "Marina Oliveira" }),
  ).toBeVisible();
  await expect(page.locator(".property-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Alugar", exact: true }).click();
  await expect(page.locator(".property-card")).toHaveCount(1);
  await page.getByRole("button", { name: /^Favoritar / }).click();
  await expect(page.getByRole("status")).toContainText("favoritos");
  await page.getByRole("button", { name: "Todos", exact: true }).click();
  await page.getByRole("button", { name: "Favoritos", exact: true }).click();
  await expect(page.locator(".property-card")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "Favoritos", exact: true }).click();
  await expect(page.locator(".property-card")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-storefront.png`,
    fullPage: true,
  });
  await page
    .getByRole("heading", { name: "Praticidade com um toque de aconchego" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Um pouco sobre este lugar" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ampliar foto 1", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Próxima foto" })
    .click();
  await expect(page.getByRole("dialog").locator(".gallery-count")).toHaveText(
    "2 de 2",
  );
  await page.getByRole("button", { name: "Fechar galeria" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.getByRole("button", { name: "Compartilhar", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Link copiado!");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "/demo/imovel/studio-centro",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-detail.png`,
    fullPage: true,
  });
});
test("unauthenticated API mutations are refused", async ({ request }) => {
  const response = await request.post("/api/manage", {
    headers: { origin: "http://localhost:3000" },
    data: { action: "profile", payload: { name: "Intruder" } },
  });
  expect([401, 503]).toContain(response.status());
});
test("auth form and 360px layout", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/cadastro");
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/demo");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

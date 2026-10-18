import { test, expect } from "@playwright/test";
test("landing owns signup, explains product and links to demo", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Yello/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Seus imóveis.",
  );
  await expect(
    page.getByRole("link", { name: "Criar meu link", exact: true }).first(),
  ).toHaveAttribute("href", "/cadastro");
  await page
    .getByText("Quem procura um imóvel precisa de conta?", { exact: true })
    .click();
  await expect(
    page.getByText(
      "Não. A vitrine é pública, e o contato vai direto para o WhatsApp que você configurou.",
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "Criar meu link", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/cadastro$/);
  await expect(
    page.getByRole("heading", { name: "Vamos criar sua Yello?" }),
  ).toBeVisible();
  await page.goto("/demo");
  await expect(page.locator('a[href="/cadastro"]')).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Conheça a Yello" }),
  ).toHaveAttribute("href", "/");
});
test("landing fits a narrow phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Criar meu link", exact: true }).first(),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

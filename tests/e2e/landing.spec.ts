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
    page.getByRole("heading", { name: "Garanta seu link" }),
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
  await expect(page.getByPlaceholder("seunome")).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "Experimente grátis" }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("landing start bar carries the chosen address into signup", async ({
  page,
}) => {
  /* A conferência consulta o banco em uso; aqui o foco é o endereço escolhido
     viajar até o cadastro. O caso "em uso" tem cobertura nos testes do banco. */
  await page.route("**/api/link**", (route) =>
    route.fulfill({
      json: {
        slug: "marina-oliveira",
        available: true,
        reason: "free",
        message: "Endereço livre para você.",
      },
    }),
  );
  await page.goto("/");
  const field = page.getByPlaceholder("seunome");
  await field.fill("Marina Oliveira");
  await expect(page.getByText("Seu link será /marina-oliveira.")).toBeVisible();
  await page.getByRole("button", { name: "Experimente grátis" }).click();
  await expect(page).toHaveURL(/\/cadastro\?link=marina-oliveira$/);
  await expect(
    page.getByRole("heading", { name: "Garanta seu link" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("seunome")).toHaveValue(
    "marina-oliveira",
  );
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(
    page.getByRole("heading", { name: "Crie sua conta" }),
  ).toBeVisible();
  await expect(page.locator(".signup-kept")).toContainText("marina-oliveira");
  await expect(page.getByLabel("E-mail")).toBeVisible();
});
test("signup suggests free addresses when the chosen one is taken", async ({
  page,
}) => {
  /* Estubado para o teste não depender do banco em uso: o primeiro endereço
     está em uso e as alternativas estão livres, como em produção. */
  await page.route("**/api/link**", (route) => {
    const slug = new URL(route.request().url()).searchParams.get("slug") || "";
    route.fulfill({
      json:
        slug === "marina-oliveira"
          ? {
              slug,
              available: false,
              reason: "taken",
              message: "Este endereço já está em uso. Tente outro.",
            }
          : {
              slug,
              available: true,
              reason: "free",
              message: "Endereço livre para você.",
            },
    });
  });
  await page.goto("/cadastro");
  await page.getByPlaceholder("seunome").fill("marina-oliveira");
  const status = page.locator("#signup-status");
  await expect(status).toHaveAttribute("role", "alert");
  await expect(status).toContainText("em uso");
  const chips = page.locator(".signup-options button");
  await expect(chips.first()).toContainText("marina-oliveira");
  await chips.first().click();
  await expect(page.getByPlaceholder("seunome")).not.toHaveValue(
    "marina-oliveira",
  );
  await expect(page.locator(".signup-preview")).toHaveAttribute(
    "data-ready",
    "true",
  );
});
test("signup asks for the address first and goes back for edits", async ({
  page,
}) => {
  await page.goto("/cadastro");
  await expect(
    page.getByRole("heading", { name: "Garanta seu link" }),
  ).toBeVisible();
  await page.getByPlaceholder("seunome").fill("painel");
  await page.getByRole("button", { name: "Continuar" }).click();
  const status = page.locator("#signup-status");
  await expect(status).toHaveAttribute("role", "alert");
  await expect(status).toContainText("reservado");
  await expect(
    page.getByRole("heading", { name: "Garanta seu link" }),
  ).toBeVisible();
  await page.getByPlaceholder("seunome").fill("Marina Oliveira");
  /* Daqui em diante o foco é a ida e volta entre as etapas; a conferência de
     endereço depende do banco em uso e tem cobertura própria. */
  await page.route("**/api/link**", (route) =>
    route.fulfill({
      json: {
        slug: "marina-oliveira",
        available: true,
        reason: "free",
        message: "Endereço livre para você.",
      },
    }),
  );
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(
    page.getByRole("heading", { name: "Crie sua conta" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "editar" }).click();
  await expect(page.getByPlaceholder("seunome")).toHaveValue("Marina Oliveira");
});
test("landing start bar refuses reserved addresses", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("seunome").fill("painel");
  await page.getByRole("button", { name: "Experimente grátis" }).click();
  await expect(page.locator(".start-error")).toContainText("reservado");
  await expect(page).toHaveURL(/\/$/);
});

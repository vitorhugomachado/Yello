import { expect, test, type Page } from "@playwright/test";

/* O caminho de engajamento usa a conta semeada e um visitante anônimo:
   assim a visita é medida de verdade — o dono não conta como audiência. */
test.setTimeout(90_000);

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("marina@yello.local");
  await page.getByLabel("Senha", { exact: true }).fill("yello1234");
  await page.getByRole("button", { name: "Entrar na minha conta" }).click();
  await expect(page).toHaveURL(/\/painel\/?$/);
}

function stat(page: Page, label: string) {
  return page
    .locator(".stats-row > div")
    .filter({ hasText: label })
    .locator("dd");
}

test("vitrine com capa, filtros na URL e QR da página", async ({ page }) => {
  await page.goto("/marina-oliveira");
  await expect(page.locator(".storefront-cover img")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Marina Oliveira" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Comprar", exact: true }).click();
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByLabel("Bairro ou cidade").fill("Campeche");
  await expect(page).toHaveURL(/finalidade=venda/);
  await expect(page).toHaveURL(/bairro=Campeche/);
  await expect(page.getByText("Seu refúgio pertinho do mar")).toBeVisible();

  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page).not.toHaveURL(/finalidade|bairro/);

  const qr = await page.request.get("/api/qr?slug=marina-oliveira", {
    maxRedirects: 0,
  });
  expect(qr.status()).toBe(200);
  expect(qr.headers()["content-type"]).toContain("image/svg+xml");
  expect(await qr.text()).toContain("<svg");

  const vcard = await page.request.get("/api/vcard?slug=marina-oliveira");
  expect(vcard.status()).toBe(200);
  expect(vcard.headers()["content-type"]).toContain("text/vcard");
  expect(await vcard.text()).toContain("FN:Marina Oliveira");

  await page.goto("/termos");
  await expect(
    page.getByRole("heading", { name: "Termos de uso" }),
  ).toBeVisible();
  await page.goto("/privacidade");
  await expect(
    page.getByRole("heading", { name: "Política de privacidade" }),
  ).toBeVisible();
});

test("visita, clique, contato e caixa de entrada são reais", async ({
  page,
  browser,
}) => {
  await login(page);
  const beforeViews = Number(await stat(page, "Visitas").innerText());
  const beforeClicks = Number(
    await stat(page, "Cliques no WhatsApp").innerText(),
  );

  const visitor = await browser.newContext({
    baseURL: "http://localhost:3000",
    viewport: { width: 390, height: 844 },
    /* O Chromium de teste se identifica como HeadlessChrome; a medição ignora
       bots, então o visitante simula um Safari comum. */
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const publicPage = await visitor.newPage();
  await publicPage.goto("/marina-oliveira");
  await expect(publicPage.locator(".storefront-cover img")).toBeVisible();
  const firstCard = publicPage.locator(".property-card").first();
  const propertyTitle = await firstCard.locator("h3").innerText();
  const propertyHref = await firstCard
    .locator("a")
    .first()
    .getAttribute("href");
  expect(propertyHref).toMatch(/^\/marina-oliveira\/imovel\//);

  await publicPage.goto(propertyHref!);
  await expect(
    publicPage.getByRole("heading", { name: propertyTitle }),
  ).toBeVisible();
  await expect(publicPage.locator(".amenities span").first()).toBeVisible();
  await expect(publicPage.locator(".detail-extra")).toContainText("Condomínio");
  const interest = publicPage.getByRole("link", { name: "Tenho interesse" });
  const interestHref = await interest.getAttribute("href");
  expect(interestHref).toContain("/api/out/whatsapp?slug=marina-oliveira");
  const click = await publicPage.request.get(interestHref!, {
    maxRedirects: 0,
  });
  expect(click.status()).toBeGreaterThanOrEqual(300);
  expect(click.status()).toBeLessThan(400);

  const stamp = Math.random().toString(36).slice(2, 8);
  const leadName = `Visitante ${stamp}`;
  await publicPage.getByText("Prefere escrever? Deixe uma mensagem").click();
  await publicPage.getByLabel("Seu nome").fill(leadName);
  await publicPage.getByLabel("WhatsApp").fill("+55 48 99999-9999");
  await publicPage
    .getByLabel("Mensagem")
    .fill(`Quero conhecer este imóvel. Teste ${stamp}.`);
  await publicPage.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(
    publicPage.getByText("Mensagem enviada.", { exact: false }),
  ).toBeVisible();
  await visitor.close();

  await expect
    .poll(async () => {
      await page.goto("/painel");
      return Number(await stat(page, "Visitas").innerText());
    })
    .toBeGreaterThan(beforeViews);
  await expect
    .poll(async () => {
      await page.goto("/painel");
      return Number(await stat(page, "Cliques no WhatsApp").innerText());
    })
    .toBeGreaterThan(beforeClicks);

  await page.goto("/painel/contatos");
  await expect(page.getByText(leadName)).toBeVisible();
  await expect(
    page.getByText(`Quero conhecer este imóvel. Teste ${stamp}.`),
  ).toBeVisible();

  const card = page.locator(".inbox-card").filter({ hasText: leadName });
  await card.getByRole("button", { name: "Marcar como lida" }).click();
  await expect(
    card.getByRole("button", { name: "Marcar como lida" }),
  ).toHaveCount(0);
  page.once("dialog", (dialog) => dialog.accept());
  await card
    .getByRole("button", { name: `Excluir mensagem de ${leadName}` })
    .click();
  await expect(page.getByText(leadName)).toHaveCount(0);
});

test("dados da conta podem ser exportados e a conta excluída", async ({
  page,
  request,
}) => {
  await login(page);
  const exported = await page.request.get("/api/account/export");
  expect(exported.status()).toBe(200);
  const data = await exported.json();
  expect(data.conta.email).toBe("marina@yello.local");
  expect(data.perfil.slug).toBe("marina-oliveira");
  expect(data.imoveis.length).toBeGreaterThan(0);

  const stamp = Math.random().toString(36).slice(2, 8);
  const origin = "http://localhost:3000";
  const email = `excluir-${stamp}@yello.test`;
  const password = "senha-forte-123";
  const signup = await request.post("/api/auth", {
    headers: { origin },
    data: {
      action: "signup",
      email,
      password,
      link: `excluir-${stamp}`,
    },
  });
  expect(signup.ok()).toBeTruthy();

  const denied = await request.post("/api/account/delete", {
    headers: { origin },
    data: { password: "senha-errada-123" },
  });
  expect(denied.status()).toBe(400);

  const deleted = await request.post("/api/account/delete", {
    headers: { origin },
    data: { password },
  });
  expect(deleted.ok()).toBeTruthy();

  const gone = await request.get("/api/account/export");
  expect(gone.status()).toBe(401);
});

test("o endereço reservado no cadastro redireciona quando muda", async ({
  request,
}) => {
  const stamp = Math.random().toString(36).slice(2, 8);
  const origin = "http://localhost:3000";
  const email = `endereco-${stamp}@yello.test`;
  const password = "senha-forte-123";
  const oldSlug = `endereco-${stamp}`;
  const newSlug = `endereco-${stamp}-novo`;
  const signup = await request.post("/api/auth", {
    headers: { origin },
    data: { action: "signup", email, password, link: oldSlug },
  });
  expect(signup.ok()).toBeTruthy();

  const profile = {
    slug: oldSlug,
    name: "Teste de endereço",
    bio: "",
    city: "Florianópolis",
    region: "Florianópolis",
    registration: "",
    whatsapp: "5548999999999",
    theme: "forest",
    socials: [],
    avatar: "",
    cover: "",
  };
  const saved = await request.post("/api/manage", {
    headers: { origin },
    data: { action: "profile", payload: profile },
  });
  expect(saved.ok()).toBeTruthy();
  expect((await request.get(`/${oldSlug}`)).status()).toBe(200);

  const oldAvailability = await request.get(`/api/link?slug=${oldSlug}`);
  expect((await oldAvailability.json()).available).toBe(false);

  const moved = await request.post("/api/manage", {
    headers: { origin },
    data: {
      action: "profile",
      payload: { ...profile, slug: newSlug },
    },
  });
  expect(moved.ok()).toBeTruthy();

  const redirect = await request.get(`/${oldSlug}`, { maxRedirects: 0 });
  expect([307, 308]).toContain(redirect.status());
  expect(redirect.headers()["location"]).toContain(`/${newSlug}`);
  expect((await request.get(`/${newSlug}`)).status()).toBe(200);

  const cleanup = await request.post("/api/account/delete", {
    headers: { origin },
    data: { password },
  });
  expect(cleanup.ok()).toBeTruthy();
});

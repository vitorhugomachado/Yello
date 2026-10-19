import { expect, test } from "@playwright/test";

/* O cartão de acesso é o mesmo em entrar e criar conta; aqui o foco está no
   caminho entre os dois, no botão de mostrar a senha e no aperto de 360px. */
test("login card keeps the way into signup", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  /* O painel decorativo existe em qualquer caminho — com ou sem WebGL. */
  await expect(page.locator(".auth-card-waves .gradient-waves")).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Criar minha conta" }),
  ).toHaveAttribute("href", "/cadastro");
  await expect(
    page.getByRole("link", { name: "Esqueci minha senha" }),
  ).toHaveAttribute("href", "/recuperar");
});
test("password can be revealed and hidden again", async ({ page }) => {
  await page.goto("/login");
  const password = page.getByLabel("Senha", { exact: true });
  await password.fill("yello1234");
  await page.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar senha" }).click();
  await expect(password).toHaveAttribute("type", "password");
});
test("signup card offers the way back to login and fits 360px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/cadastro");
  await expect(
    page.getByRole("link", { name: "Já tenho conta" }),
  ).toHaveAttribute("href", "/login");
  await expect(
    page.getByRole("heading", { name: "Sua vitrine começa aqui." }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("seunome")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  const panel = await page.locator(".auth-card-panel").boundingBox();
  expect(panel?.width).toBeLessThanOrEqual(352);
});
/* As ondas em WebGL ficam fora do movimento reduzido da suíte: aqui o painel
   liga o desenho de verdade — sem WebGL 2 o teste se retira. Um aparelho sem
   aceleração pode devolver o degradê estático; o fim precisa ser um destes
   dois estados, nunca uma camada vazia. */
test.describe("wave panel", () => {
  test.use({ reducedMotion: "no-preference" });
  test("boots the drawing and always ends with a painted layer", async ({
    page,
  }) => {
    await page.goto("/login");
    const temWebgl = await page.evaluate(() =>
      Boolean(document.createElement("canvas").getContext("webgl2")),
    );
    test.skip(!temWebgl, "sem WebGL 2 neste navegador");
    const camada = page.locator(".auth-card-waves .gradient-waves");
    await expect(camada).toBeVisible();
    const canvas = page.locator(".auth-card-waves canvas");
    await expect(canvas).toHaveCount(1, { timeout: 15000 });
    await expect
      .poll(
        () =>
          camada.evaluate((el) => {
            const alvo = el.querySelector("canvas") as HTMLCanvasElement | null;
            const fundo = getComputedStyle(el).backgroundImage;
            return alvo
              ? `desenho ${alvo.width}x${alvo.height} ${fundo}`
              : `reserva ${fundo}`;
          }),
        { timeout: 20000 },
      )
      .toMatch(/^desenho [1-9]\d*x[1-9]\d* none$|^reserva linear-gradient/);
  });
});

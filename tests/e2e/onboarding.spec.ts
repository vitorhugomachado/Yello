import { expect, test } from "@playwright/test";

/* O caminho tem cadastro, duas telas e uma recarga: no servidor de
   desenvolvimento a primeira compilação pode passar dos 30s padrão. */
test.setTimeout(60_000);

/* O primeiro acesso é um caminho completo: criar a conta, ver a página com
   exemplos, voltar ao painel e não encontrar as boas-vindas de novo. */
test("primeiro acesso: boas-vindas, prévia com exemplos e painel", async ({
  page,
}) => {
  const id = Math.random().toString(36).slice(2, 8);
  const slug = `teste-${id}`;
  const email = `${slug}@yello.test`;

  await page.goto("/cadastro");
  await page.locator('input[name="link"]').fill(slug);
  await expect(page.getByText("Livre para você.")).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(
    page.getByRole("heading", { name: "Crie sua conta" }),
  ).toBeVisible();
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("senha-forte-123");
  await page.getByRole("button", { name: "Criar minha conta" }).click();

  await page.waitForURL("**/painel/boas-vindas");
  await expect(
    page.getByRole("heading", { name: "Sua página já tem endereço." }),
  ).toBeVisible();
  await expect(page.getByText(slug)).toBeVisible();
  await expect(page.getByText("0 de 4")).toBeVisible();

  await page.getByRole("button", { name: "Ver minha página" }).click();
  await page.waitForURL("**/painel/previa");
  await expect(
    page.getByText(
      "Exemplos para mostrar a estrutura. Nada aqui foi publicado.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Exemplo", { exact: true })).toHaveCount(2);
  await expect(
    page.getByRole("heading", { name: "Apartamento com 2 quartos" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Casa com quintal" }),
  ).toBeVisible();
  /* Cards de exemplo não são anúncios reais: não levam a lugar nenhum. */
  await expect(
    page.getByRole("link", { name: /Apartamento com 2 quartos/ }),
  ).toHaveCount(0);

  await page.getByRole("link", { name: "Editar página" }).click();
  await page.waitForURL("**/painel/perfil");
  await expect(
    page.getByRole("heading", { name: "Sua apresentação" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Seu contato e suas redes" }),
  ).toBeVisible();

  await page.goto("/painel");
  await page.waitForURL("**/painel");
  await expect(page.getByRole("heading", { name: /Olá/ })).toBeVisible();
  await expect(page.getByText("Rascunho", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver minha página" })).toHaveAttribute(
    "href",
    "/painel/previa",
  );
  await expect(
    page.getByRole("progressbar", { name: "Progresso da configuração" }),
  ).toHaveAttribute("aria-valuenow", "0");

  /* A marcação aconteceu nos botões das boas-vindas; um novo acesso não
     repete a tela. */
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Sua página já tem endereço." }),
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Olá/ })).toBeVisible();
});

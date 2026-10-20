import { describe, expect, it } from "vitest";
import {
  firstName,
  needsWelcome,
  readOnboarding,
  setupSteps,
} from "../src/lib/onboarding";
import type { Profile, Property } from "../src/lib/validation";

const profile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "u1",
  slug: "marina-oliveira",
  name: "Marina Oliveira",
  bio: "Encontro o lugar certo para cada novo começo.",
  city: "Florianópolis",
  region: "Florianópolis e região",
  registration: "",
  whatsapp: "5548999999999",
  theme: "forest",
  socials: [],
  avatar: "",
  cover: "",
  ...overrides,
});

const property = (overrides: Partial<Property> = {}): Property => ({
  id: "p1",
  owner_id: "u1",
  title: "Apartamento no centro",
  description: "Descrição suficientemente longa para o teste.",
  purpose: "venda",
  type: "apartamento",
  price: 450000,
  neighborhood: "Centro",
  city: "Florianópolis",
  state: "SC",
  area: 80,
  bedrooms: 2,
  bathrooms: 1,
  parking: 1,
  status: "publicado",
  images: [],
  ...overrides,
});

describe("primeiro acesso", () => {
  it("só reconhece uma data válida na metadata", () => {
    expect(readOnboarding({})).toEqual({});
    expect(readOnboarding({ onboarding: "2026-10-19" })).toEqual({});
    expect(readOnboarding({ onboarding: { welcomedAt: "ontem" } })).toEqual({});
    expect(
      readOnboarding({ onboarding: { welcomedAt: "2026-10-19T12:00:00.000Z" } }),
    ).toEqual({ welcomedAt: "2026-10-19T12:00:00.000Z" });
  });

  it("não confunde a chave de outro dado da conta", () => {
    expect(readOnboarding({ link: "marina", onboarding: null })).toEqual({});
  });

  it("só abre as boas-vindas sem marca e sem perfil", () => {
    expect(needsWelcome({}, false)).toBe(true);
    expect(needsWelcome({ link: "marina" }, false)).toBe(true);
    expect(needsWelcome({}, true)).toBe(false);
    expect(
      needsWelcome(
        { onboarding: { welcomedAt: "2026-10-19T12:00:00.000Z" } },
        true,
      ),
    ).toBe(false);
    expect(
      needsWelcome(
        { onboarding: { welcomedAt: "2026-10-19T12:00:00.000Z" } },
        false,
      ),
    ).toBe(false);
  });
});

describe("progresso da configuração", () => {
  it("começa vazio para uma conta nova", () => {
    const setup = setupSteps({ profile: null, properties: [] });
    expect(setup.done).toBe(0);
    expect(setup.percent).toBe(0);
    expect(setup.next?.id).toBe("apresentacao");
    expect(setup.complete).toBe(false);
  });

  it("conta os quatro passos com dados reais", () => {
    const setup = setupSteps({
      profile: profile({ avatar: "u1/profile/foto.jpg", theme: "ocean" }),
      properties: [property()],
    });
    expect(setup.steps.map((step) => step.done)).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect(setup.done).toBe(4);
    expect(setup.percent).toBe(100);
    expect(setup.next).toBeNull();
    expect(setup.complete).toBe(true);
  });

  it("um passo por vez aponta o próximo e mantém a ordem", () => {
    const setup = setupSteps({ profile: profile({ bio: "" }), properties: [] });
    expect(setup.done).toBe(1);
    expect(setup.percent).toBe(25);
    expect(setup.next?.id).toBe("apresentacao");
    expect(setup.steps.find((step) => step.done)?.id).toBe("contato");
  });

  it("mostra o caminho do perfil antes de liberar o primeiro imóvel", () => {
    const setup = setupSteps({ profile: null, properties: [] });
    const imovel = setup.steps.find((step) => step.id === "imovel");
    expect(imovel?.href).toBe("/painel/perfil#apresentacao");
    expect(imovel?.action).toBe("Começar pelo perfil");
  });

  it("considera rascunhos no primeiro imóvel", () => {
    const setup = setupSteps({
      profile: profile(),
      properties: [property({ status: "rascunho" })],
    });
    expect(setup.steps.find((step) => step.id === "imovel")?.done).toBe(true);
    expect(setup.done).toBe(3);
  });
});

describe("saudação", () => {
  it("usa só o primeiro nome e tolera vazio", () => {
    expect(firstName("Marina Oliveira")).toBe("Marina");
    expect(firstName("  ")).toBe("");
    expect(firstName(null)).toBe("");
  });
});

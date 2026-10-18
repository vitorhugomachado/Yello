import { describe, it, expect } from "vitest";
import {
  linkName,
  linkProblem,
  linkSuggestions,
  slugify,
} from "../src/lib/link";
import {
  slugSchema,
  phoneSchema,
  socialSchema,
  propertySchema,
  whatsappUrl,
  reserved,
} from "../src/lib/validation";
describe("Public identifiers and contacts", () => {
  it("reserves all application routes and rejects path tricks", () => {
    for (const s of [
      ...reserved,
      "a",
      "../painel",
      "UPPER",
      "hello/world",
      "<script>",
    ])
      expect(slugSchema.safeParse(s).success).toBe(false);
    expect(slugSchema.parse("marina-oliveira")).toBe("marina-oliveira");
  });
  it("turns typed names into addresses and explains what is wrong", () => {
    expect(slugify("Imóveis da Marina")).toBe("imoveis-da-marina");
    expect(slugify("  Marina Oliveira! ")).toBe("marina-oliveira");
    expect(linkProblem("painel")).toContain("reservado");
    for (const value of [
      "Marina Oliveira",
      "painel",
      "a",
      "ab",
      "@@@",
      "9lives",
      "ÁÉ-Í",
      "a".repeat(41),
      "imóveis.link",
    ]) {
      const slug = slugify(value);
      expect(Boolean(linkProblem(slug))).toBe(
        !slugSchema.safeParse(slug).success,
      );
    }
  });
  it("derives a readable name from the address for the signup preview", () => {
    expect(linkName("marina-oliveira")).toBe("Marina Oliveira");
    expect(linkName("marina-de-oliveira")).toBe("Marina de Oliveira");
    expect(linkName("marina-oliveira-imoveis")).toBe(
      "Marina Oliveira Imóveis",
    );
    expect(linkName("sao-jose")).toBe("São José");
    expect(linkName("")).toBe("");
  });
  it("suggests close alternatives that already respect the slug rules", () => {
    const options = linkSuggestions("marina-oliveira");
    expect(options).toContain("marina-oliveira-imoveis");
    expect(new Set(options).size).toBe(options.length);
    for (const option of options) {
      expect(option).not.toBe("marina-oliveira");
      expect(linkProblem(option)).toBe("");
      expect(slugSchema.safeParse(option).success).toBe(true);
    }
    for (const option of linkSuggestions("a".repeat(40)))
      expect(option.length).toBeLessThanOrEqual(40);
  });
  it("normalizes country prefix and rejects short numbers", () => {
    expect(phoneSchema.parse("+55 (11) 99999-9999")).toBe("5511999999999");
    expect(phoneSchema.safeParse("99999").success).toBe(false);
  });
  it("encodes property titles and URL in WhatsApp message", () => {
    const u = new URL(
      whatsappUrl(
        "+55 11 99999-9999",
        "Casa & jardim",
        "https://example.com/m/imovel/1",
      ),
    );
    expect(u.hostname).toBe("wa.me");
    expect(u.searchParams.get("text")).toContain(
      "Casa & jardim. https://example.com/m/imovel/1",
    );
  });
  it("rejects unsafe external links", () => {
    for (const url of [
      "javascript:alert(1)",
      "http://example.com",
      "https://user:pass@example.com",
    ])
      expect(socialSchema.safeParse({ name: "Site", url }).success).toBe(false);
    expect(
      socialSchema.safeParse({ name: "Site", url: "https://example.com" })
        .success,
    ).toBe(true);
  });
  it("rejects invalid property price, state and status", () => {
    const good = {
      title: "Apartamento claro",
      description: "Uma descrição completa",
      purpose: "venda",
      type: "apartamento",
      price: 500000,
      neighborhood: "Centro",
      city: "Florianópolis",
      state: "SC",
      area: 90,
      bedrooms: 2,
      bathrooms: 1,
      parking: 1,
      status: "rascunho",
    };
    expect(propertySchema.safeParse(good).success).toBe(true);
    for (const patch of [
      { price: -1 },
      { state: "ZZ" },
      { status: "private" },
      { bedrooms: 1.5 },
    ])
      expect(propertySchema.safeParse({ ...good, ...patch }).success).toBe(
        false,
      );
  });
});

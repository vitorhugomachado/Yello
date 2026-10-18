import { describe, it, expect } from "vitest";
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

// Conteúdo de exemplo da prévia. Serve para mostrar a estrutura da página
// antes de qualquer dado real existir — por isso todo card leva o selo
// "Exemplo" e nada aqui é publicado nem entra nas estatísticas.
import type { Profile, Property } from "./validation";

export const previewName = "Seu nome";

export function previewProfile(slug: string): Profile {
  return {
    id: "preview",
    slug,
    name: previewName,
    bio: "",
    city: "",
    region: "Sua cidade e região",
    registration: "",
    whatsapp: "",
    theme: "forest",
    socials: [],
    avatar: "/brand/yello-symbol.svg",
    cover: "",
  };
}

const exampleBase = {
  owner_id: "preview",
  state: "SP",
  images: [],
  status: "publicado" as const,
};

export const previewProperties: Property[] = [
  {
    ...exampleBase,
    id: "exemplo-apartamento",
    title: "Apartamento com 2 quartos",
    description: "Um exemplo de como o seu anúncio aparece na página.",
    purpose: "aluguel",
    type: "apartamento",
    price: 3200,
    neighborhood: "Seu bairro",
    city: "Sua cidade",
    area: 78,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
  },
  {
    ...exampleBase,
    id: "exemplo-casa",
    title: "Casa com quintal",
    description: "Outro exemplo de anúncio, com foto e detalhes.",
    purpose: "venda",
    type: "casa",
    price: 850000,
    neighborhood: "Seu bairro",
    city: "Sua cidade",
    area: 140,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
  },
];

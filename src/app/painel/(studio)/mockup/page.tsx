import type { Metadata } from "next";
import { StudioMockup } from "@/components/studio-mockup";
import { demoProfile, demoProperties } from "@/lib/demo";
import "./studio.css";

export const metadata: Metadata = {
  title: "Novo conceito do painel",
  description: "Estudo visual para uma nova área do corretor.",
  robots: { index: false, follow: false },
};

/* Rota isolada de estudo. Não substitui o painel atual e não aparece na
   navegação: serve para avaliar a linguagem visual antes de uma migração. */
export default function Page() {
  return (
    <StudioMockup
      profile={demoProfile}
      properties={demoProperties.slice(0, 2)}
    />
  );
}

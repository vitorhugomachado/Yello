import type { Metadata } from "next";
import { StudioMobile } from "@/components/studio-mobile";
import { demoProfile, demoProperties } from "@/lib/demo";
import "./mobile.css";

export const metadata: Metadata = {
  title: "Conceito mobile do painel",
  description: "Estudo visual para uma navegação mobile mais moderna.",
  robots: { index: false, follow: false },
};

/* Estudo mobile isolado. O menu novo é a única mudança em relação ao
   conceito web; o painel de produção permanece intacto. */
export default function Page() {
  return (
    <StudioMobile
      profile={demoProfile}
      properties={demoProperties.slice(0, 2)}
    />
  );
}

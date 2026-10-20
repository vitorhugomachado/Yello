import { redirect } from "next/navigation";
import { store } from "@/lib/store";
import { linkPrefix, linkName } from "@/lib/link";
import { firstName, needsWelcome, setupSteps } from "@/lib/onboarding";
import { Welcome } from "@/components/welcome";

export const metadata = { title: "Boas-vindas" };

export default async function Page() {
  const db = store();
  const user = await db.user();
  if (!user) return null;
  const [profile, properties] = await Promise.all([
    db.profile(user.id),
    db.properties(user.id),
  ]);
  /* A mesma regra do painel: a pausa de boas-vindas é só para quem ainda não
     tem perfil. Quem já salvou a página segue direto para a visão geral. */
  if (!needsWelcome(user.metadata, Boolean(profile))) redirect("/painel");
  const reserved =
    typeof user.metadata?.link === "string" ? user.metadata.link : "";
  const slug = profile?.slug || reserved;
  const name = firstName(profile?.name || (slug ? linkName(slug) : ""));
  return (
    <Welcome
      firstName={name}
      address={slug ? `${linkPrefix()}${slug}` : ""}
      hasAddress={Boolean(slug)}
      setup={setupSteps({ profile, properties })}
    />
  );
}

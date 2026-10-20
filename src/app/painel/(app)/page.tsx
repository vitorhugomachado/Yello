import { redirect } from "next/navigation";
import { store } from "@/lib/store";
import { hydrate } from "@/lib/data";
import { emptyStats } from "@/lib/analytics";
import { linkName } from "@/lib/link";
import { firstName, needsWelcome, setupSteps } from "@/lib/onboarding";
import { Dashboard } from "@/components/dashboard";

export default async function Page() {
  const db = store();
  const user = await db.user();
  if (!user) return null;
  const [profile, raw] = await Promise.all([
    db.profile(user.id),
    db.properties(user.id),
  ]);
  /* Primeiro acesso: sem a marca de boas-vindas e sem perfil, a pessoa ainda
     não viu a página dela. Quem já tem perfil é tratado como veterano. */
  if (needsWelcome(user.metadata, Boolean(profile)))
    redirect("/painel/boas-vindas");
  const properties = raw.map(hydrate);
  const stats = profile ? await db.profileStats(profile.id) : emptyStats;
  const leads = profile ? await db.leads(profile.id) : [];
  const unreadLeads = profile ? await db.unreadLeads(profile.id) : 0;
  const reserved =
    typeof user.metadata?.link === "string" ? user.metadata.link : "";
  const slug = profile?.slug || reserved;
  const name = profile?.name || (slug ? linkName(slug) : "");
  return (
    <Dashboard
      firstName={firstName(name)}
      profile={profile}
      properties={properties}
      slug={slug}
      setup={setupSteps({ profile, properties })}
      stats={stats}
      leads={leads}
      unreadLeads={unreadLeads}
    />
  );
}

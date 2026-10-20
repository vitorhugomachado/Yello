import { store } from "@/lib/store";
import { photoUrl } from "@/lib/data";
import { AppShell } from "@/components/app-shell";

/* O chrome das telas de gestão vive aqui. O mockup aprovado define a
   linguagem: rail escuro no desktop e barra contextual + menu em bottom sheet
   no mobile. As telas internas herdam o mesmo shell e a mesma base visual. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = store();
  const user = await db.user();
  const profile = user ? await db.profile(user.id) : null;
  const unread = profile ? await db.unreadLeads(profile.id) : 0;
  const reserved =
    typeof user?.metadata?.link === "string" ? user.metadata.link : "";
  const name =
    profile?.name || user?.email?.split("@")[0] || "Seu espaço na Yello";
  const slug = profile?.slug || reserved;

  return (
    <AppShell
      user={{
        name,
        email: user?.email || "",
        avatar: profile?.avatar ? photoUrl(profile.avatar) : "",
        slug,
        live: Boolean(profile),
      }}
      unread={unread}
    >
      {children}
    </AppShell>
  );
}

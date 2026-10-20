import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { dataBackend, store } from "@/lib/store";
import { publicProfile, publicProperties, photoUrl } from "@/lib/data";
import { eventSource, isBot, isPrefetch } from "@/lib/analytics";
import { parseFilters } from "@/lib/filters";
import { Storefront } from "@/components/storefront";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!dataBackend()) return { title: "Página não encontrada" };
  const p = await publicProfile((await params).slug);
  return {
    title: p?.name || "Página não encontrada",
    description: p?.bio,
    openGraph: {
      title: p?.name,
      description: p?.bio,
      images: p?.cover ? [photoUrl(p.cover)] : [],
    },
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!dataBackend()) notFound();
  const db = store();
  const slug = (await params).slug;
  const p = await db.profileBySlug(slug);
  if (!p) {
    const target = await db.slugRedirect(slug);
    if (target && target !== slug) redirect(`/${target}`);
    notFound();
  }
  const query = await searchParams;
  const user = await db.user();
  if (user?.id !== p.id) {
    const requestHeaders = await headers();
    if (
      !isBot(requestHeaders.get("user-agent")) &&
      !isPrefetch(requestHeaders)
    ) {
      const source = eventSource(query);
      after(() =>
        db
          .recordEvent({ profileId: p.id, kind: "profile_view", source })
          .catch(() => undefined),
      );
    }
  }
  return (
    <Storefront
      profile={p}
      properties={await publicProperties(p.id)}
      initialFilters={parseFilters(query)}
    />
  );
}

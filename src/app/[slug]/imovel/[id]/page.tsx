import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { dataBackend, store } from "@/lib/store";
import { publicProfile, hydrate, photoUrl } from "@/lib/data";
import { eventSource, isBot, isPrefetch } from "@/lib/analytics";
import { PropertyDetail } from "@/components/property-detail";
async function load(slug: string, id: string) {
  if (!dataBackend()) return null;
  const profile = await publicProfile(slug);
  if (!profile) return null;
  const data = await store().property(profile.id, id, true);
  if (!data) return null;
  return { profile, property: hydrate(data) };
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const item = await load(slug, id);
  return {
    title: item?.property.title || "Imóvel não encontrado",
    description: item?.property.description.slice(0, 160),
    openGraph: {
      title: item?.property.title,
      images: item?.property.images[0]
        ? [photoUrl(item.property.images[0].path)]
        : [],
    },
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug, id } = await params;
  const db = store();
  const item = await load(slug, id);
  if (!item) {
    const target = await db.slugRedirect(slug);
    if (target && target !== slug) redirect(`/${target}/imovel/${id}`);
    notFound();
  }
  const query = await searchParams;
  const source = eventSource(query);
  const user = await db.user();
  if (user?.id !== item.profile.id) {
    const requestHeaders = await headers();
    if (
      !isBot(requestHeaders.get("user-agent")) &&
      !isPrefetch(requestHeaders)
    ) {
      after(() =>
        db
          .recordEvent({
            profileId: item.profile.id,
            propertyId: item.property.id,
            kind: "property_view",
            source,
          })
          .catch(() => undefined),
      );
    }
  }
  return <PropertyDetail {...item} source={source} />;
}

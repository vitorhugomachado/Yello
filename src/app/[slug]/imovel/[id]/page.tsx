import { notFound } from "next/navigation";
import { dataBackend, store } from "@/lib/store";
import { publicProfile, hydrate, photoUrl } from "@/lib/data";
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
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const item = await load(slug, id);
  if (!item) notFound();
  return <PropertyDetail {...item} />;
}

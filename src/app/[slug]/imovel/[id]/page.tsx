import { notFound } from "next/navigation";
import { configured, supabase } from "@/lib/supabase";
import { publicProfile, hydrate, photoUrl } from "@/lib/data";
import { PropertyDetail } from "@/components/property-detail";
import { Property } from "@/lib/validation";
async function load(slug: string, id: string) {
  if (!configured()) return null;
  const profile = await publicProfile(slug);
  if (!profile) return null;
  const db = await supabase();
  const { data, error } = await db
    .from("properties")
    .select("*,images(*)")
    .eq("id", id)
    .eq("owner_id", profile.id)
    .eq("status", "publicado")
    .maybeSingle();
  if (error || !data) return null;
  return { profile, property: hydrate(data as Property) };
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

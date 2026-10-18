import { notFound } from "next/navigation";
import { configured } from "@/lib/supabase";
import { publicProfile, publicProperties, photoUrl } from "@/lib/data";
import { Storefront } from "@/components/storefront";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!configured()) return { title: "Página não encontrada" };
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
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!configured()) notFound();
  const p = await publicProfile((await params).slug);
  if (!p) notFound();
  return <Storefront profile={p} properties={await publicProperties(p.id)} />;
}

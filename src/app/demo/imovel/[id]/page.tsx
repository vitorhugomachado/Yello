import { notFound } from "next/navigation";
import { PropertyDetail } from "@/components/property-detail";
import { demoProfile, demoProperties } from "@/lib/demo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = demoProperties.find((p) => p.id === id);
  return {
    title: p?.title || "Imóvel",
    robots: { index: false, follow: false },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = demoProperties.find((p) => p.id === id);
  if (!p) notFound();
  return <PropertyDetail profile={demoProfile} property={p} demo />;
}

import { notFound } from "next/navigation";
import { supabase, configured } from "@/lib/supabase";
import { hydrate } from "@/lib/data";
import { Property } from "@/lib/validation";
import { PropertyEditor } from "@/components/property-editor";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!configured()) return null;
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data, error } = await db
    .from("properties")
    .select("*,images(*)")
    .eq("id", (await params).id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error || !data) notFound();
  return <PropertyEditor initial={hydrate(data as Property)} />;
}

import Link from "next/link";
import { supabase, configured } from "@/lib/supabase";
import { hydrate } from "@/lib/data";
import { Property } from "@/lib/validation";
import { PropertyList } from "@/components/property-list";
export default async function Page() {
  if (!configured()) return null;
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data: profile } = await db
    .from("profiles")
    .select("slug")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile)
    return (
      <div className="page-title panel">
        <h1>Primeiro, apresente-se.</h1>
        <p>Salve sua página antes de cadastrar o primeiro imóvel.</p>
        <Link className="btn primary" href="/painel">
          Configurar minha página
        </Link>
      </div>
    );
  const { data, error } = await db
    .from("properties")
    .select("*,images(*)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (
    <PropertyList
      properties={(data as Property[]).map(hydrate)}
      slug={profile.slug}
    />
  );
}

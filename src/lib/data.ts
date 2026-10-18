import { supabase } from "./supabase";
import { Profile, Property, Photo } from "./validation";
export function photoUrl(path: string) {
  return `/api/media?path=${encodeURIComponent(path)}`;
}
export function hydrate<T extends { images: Photo[] }>(item: T) {
  return {
    ...item,
    images: item.images
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ ...i, url: photoUrl(i.path) })),
  };
}
export async function publicProfile(slug: string) {
  const db = await supabase();
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}
export async function publicProperties(owner: string) {
  const db = await supabase();
  const { data, error } = await db
    .from("properties")
    .select("*,images(*)")
    .eq("owner_id", owner)
    .eq("status", "publicado")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Property[]).map(hydrate);
}

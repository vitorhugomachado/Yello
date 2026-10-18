import { supabase, configured } from "@/lib/supabase";
import { ProfileEditor } from "@/components/profile-editor";
import { Profile } from "@/lib/validation";
export default async function Page() {
  if (!configured()) return null;
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return <ProfileEditor initial={data as Profile | null} userId={user.id} />;
}

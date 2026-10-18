import { store } from "@/lib/store";
import { ProfileEditor } from "@/components/profile-editor";
import { Profile } from "@/lib/validation";
export default async function Page() {
  const db = store();
  const user = await db.user();
  if (!user) return null;
  const data = await db.profile(user.id);
  const suggested =
    typeof user.metadata?.link === "string" ? user.metadata.link : "";
  return (
    <ProfileEditor
      initial={data as Profile | null}
      userId={user.id}
      suggestedSlug={suggested}
    />
  );
}

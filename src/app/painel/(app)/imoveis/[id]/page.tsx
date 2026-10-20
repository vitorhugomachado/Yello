import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { hydrate } from "@/lib/data";
import { PropertyEditor } from "@/components/property-editor";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const db = store();
  const user = await db.user();
  if (!user) return null;
  const data = await db.property(user.id, (await params).id);
  if (!data) notFound();
  return (
    <div className="narrow">
      <PropertyEditor
        initial={hydrate(data)}
        profileSlug={(await db.profileSlug(user.id)) || ""}
      />
    </div>
  );
}

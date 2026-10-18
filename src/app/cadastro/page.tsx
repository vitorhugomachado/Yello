import type { Metadata } from "next";
import { SignupFlow } from "@/components/signup-flow";
import { linkPrefix } from "@/lib/link";
import { slugSchema } from "@/lib/validation";
export const metadata: Metadata = { title: "Crie sua conta" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ link?: string }>;
}) {
  const { link } = await searchParams;
  const wanted =
    typeof link === "string" ? slugSchema.safeParse(link.trim().toLowerCase()) : null;
  return (
    <SignupFlow
      initialLink={wanted?.success ? wanted.data : ""}
      prefix={linkPrefix()}
    />
  );
}

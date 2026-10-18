import { Storefront } from "@/components/storefront";
import { demoProfile, demoProperties } from "@/lib/demo";
export default function Page() {
  return <Storefront profile={demoProfile} properties={demoProperties} demo />;
}

import { PropertyEditor } from "@/components/property-editor";
import { demoProperties } from "@/lib/demo";
export const metadata = {
  title: "Demonstração do cadastro",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main className="editor-demo-page">
      <div className="wrap narrow">
        <PropertyEditor initial={demoProperties[0]} demo />
      </div>
    </main>
  );
}

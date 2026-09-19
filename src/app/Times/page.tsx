import { CatalogGate } from "@/components/CatalogGate";
import { TimesPage } from "@/components/TimesPage";

export default function TimesRoute() {
  return (
    <CatalogGate>
      <TimesPage />
    </CatalogGate>
  );
}

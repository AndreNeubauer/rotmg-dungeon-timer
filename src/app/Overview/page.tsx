import { CatalogGate } from "@/components/CatalogGate";
import { OverviewPage } from "@/components/OverviewPage";

export default function OverviewRoute() {
  return (
    <CatalogGate>
      <OverviewPage />
    </CatalogGate>
  );
}

import { CatalogGate } from "@/components/CatalogGate";
import { BoardPage } from "@/components/BoardPage";

export default function BoardRoute() {
  return (
    <CatalogGate>
      <BoardPage />
    </CatalogGate>
  );
}

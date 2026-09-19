import { CatalogGate } from "@/components/CatalogGate";
import { DungeonPicker } from "@/components/DungeonPicker";
import { RecentRunsList } from "@/components/RecentRunsList";
import { TimerBlock } from "@/components/TimerBlock";

export default function TimerPage() {
  return (
    <CatalogGate>
      <DungeonPicker />
      <TimerBlock />
      <section className="mt-8" aria-label="Recent runs">
        <h2 className="mb-3 text-[0.95rem] font-medium">Recent runs</h2>
        <RecentRunsList emptyText="No runs yet — they show up here after End." limit={6} />
      </section>
    </CatalogGate>
  );
}

import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const posters = [
  "from-violet-500/70 to-fuchsia-900",
  "from-cyan-500/70 to-blue-900",
  "from-amber-400/70 to-rose-800",
  "from-emerald-500/70 to-teal-950",
];

export function MediaSection({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: string;
}) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action && (
          <Button variant="ghost" size="sm" disabled>
            {action}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {posters.map((poster, index) => (
          <Card key={poster} className="group overflow-hidden">
            <div className={`aspect-[2/3] bg-gradient-to-br ${poster} p-3`}>
              <div className="flex h-full items-end">
                <div>
                  <p className="text-xs font-semibold text-white/90">Coming soon</p>
                  <p className="text-[11px] text-white/70">Your media awaits</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-xs text-muted-foreground">#{index + 1} pick</span>
              <Plus className="size-4 text-primary" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

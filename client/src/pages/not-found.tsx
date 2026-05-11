import { AlertCircle } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <SurfaceCard padding="lg">
      <EmptyState
        icon={<AlertCircle />}
        title="404"
        description="Aradığınız sayfa bulunamadı."
      />
    </SurfaceCard>
  );
}

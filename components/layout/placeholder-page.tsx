import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";
export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <Card className="p-10">
        <Construction className="mx-auto size-8 text-primary" />
        <h1 className="mt-5 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}

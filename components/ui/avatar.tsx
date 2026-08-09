import Image from "next/image";
import { cn, initials } from "@/lib/utils";

type AvatarProps = { name: string; src?: string | null; className?: string };

export function Avatar({ name, src, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-xs font-semibold text-primary",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={`${name}'s avatar`}
          fill
          sizes="64px"
          className="object-cover"
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}

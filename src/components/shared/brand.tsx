import Image from "next/image";

/** Logo original completo: se conserva su proporción y no se separa ni redibuja el símbolo. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Image src="/brand/aetherload-logo.png" alt="" width={56} height={56} sizes="56px" className="shrink-0 rounded-xl" />
      <span className="flex flex-col gap-1">
        <span className={compact ? "text-lg font-semibold tracking-tight text-foreground" : "text-xl font-semibold tracking-tight text-foreground"}>AetherLoad<span className="text-accent">.</span></span>
        <span className="text-xs tracking-wide text-muted">Control de carga de gas</span>
      </span>
    </span>
  );
}

/**
 * Programmatic ad slot for result screens. Renders nothing until an ad network is configured
 * (NEXT_PUBLIC_ADS_ENABLED); Pro players will never see it.
 */
export default function AdSlot({ id }: { id: string }) {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "1") return null;
  return (
    <div
      data-ad-slot={id}
      className="mt-4 grid h-24 place-items-center rounded-xl border border-dashed border-white/30 text-xs text-white/60"
    >
      Ad
    </div>
  );
}

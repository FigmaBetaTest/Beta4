export function MetaKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">{label}</span>
      <span className="text-[13px] text-[#1F1F1F]">{value}</span>
    </div>
  );
}

"use client";

type CacheToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** "Use cached result" switch beside Re-run analysis (unticked by default). Unticked, a
 * run skips the API's text-hash cache and scores the report fresh
 * (`POST …/analyze?use_cache=false`); ticked, it reuses a saved result when there is one. */
export default function CacheToggle({ checked, onChange }: CacheToggleProps) {
  return (
    <label
      className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-muted"
      title="When off, the report is scored again with AI instead of reusing a saved result."
    >
      <input
        type="checkbox"
        className="h-4 w-4 cursor-pointer accent-calc-blue"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      Use cached result
    </label>
  );
}

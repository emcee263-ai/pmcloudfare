/**
 * The PM monogram, drawn as five solid bars (the stem and bowl of the P, then the left stem, the V and the right
 * stem of the M). `animated` makes the bars rise one after another, which is what the home page intro uses.
 * The shapes use the current text colour, so the mark follows the light and dark themes.
 */
export function PMLogo({ animated = false, className }: { animated?: boolean; className?: string }) {
  const bar = animated ? 'pm-bar' : undefined;
  return (
    <svg viewBox="0 0 162 80" role="img" aria-label="PEACEMAGENTS" className={className} fill="currentColor">
      {/* P: stem, then bowl */}
      <rect className={bar} x="8" y="8" width="12" height="64" />
      <path className={bar} d="M18 8H47A19 19 0 0 1 47 46H18V35H47A8 8 0 0 0 47 19H18Z" />
      {/* M: left stem, V, right stem */}
      <rect className={bar} x="84" y="8" width="12" height="64" />
      <path className={bar} d="M95 8H105L113 32L121 8H131V20L117 54H109L95 20Z" />
      <rect className={bar} x="130" y="8" width="12" height="64" />
      {animated && <rect className="pm-dot" x="147" y="64" width="8" height="8" />}
    </svg>
  );
}

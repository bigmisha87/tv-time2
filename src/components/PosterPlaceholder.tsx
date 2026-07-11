// Temporary poster stand-in until real artwork is fetched from TMDB:
// a deterministic two-color gradient derived from the show name.
const PALETTES: [string, string][] = [
  ["#2c3e70", "#1b2440"],
  ["#5b2c6f", "#2e1a3a"],
  ["#1f618d", "#12324a"],
  ["#7d3c98", "#3a1c48"],
  ["#146a5a", "#0b3a31"],
  ["#873600", "#4a1e00"],
  ["#7b241c", "#40120e"],
  ["#1a5276", "#0e2b3e"],
  ["#6c3483", "#35193f"],
  ["#0e6655", "#07362d"],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function PosterPlaceholder({ name }: { name: string }) {
  const [from, to] = PALETTES[hash(name) % PALETTES.length];
  return (
    <div
      className="flex h-full w-full items-center justify-center p-2"
      style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
    >
      <span className="text-center text-sm font-semibold leading-snug text-white/90">
        {name}
      </span>
    </div>
  );
}

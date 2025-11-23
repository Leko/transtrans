import { formatDuration } from "@/lib/vtt";

export default function Duration({ ms }: { ms: number }) {
  return <span>{formatDuration(ms)}</span>;
}

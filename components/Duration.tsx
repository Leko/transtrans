export default function Duration({
  ms,
  hours: showHours = false,
  milliseconds: showMilliseconds = false,
}: {
  ms: number;
  hours?: boolean;
  milliseconds?: boolean;
}) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return (
    <span>
      {showHours && <>{hours.toString().padStart(2, "0")}:</>}
      {minutes.toString().padStart(2, "0")}:
      {seconds.toString().padStart(2, "0")}
      {showMilliseconds && <>.{milliseconds.toString().padStart(3, "0")}</>}
    </span>
  );
}

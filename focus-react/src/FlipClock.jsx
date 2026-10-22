export default function FlipClock({ seconds }) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  const group = (value) => [...value].map((digit, index) => (
    <span className="flip-digit" key={index}>
      <span className="flip-digit-value" key={digit}>{digit}</span>
      <span className="flip-seam" />
    </span>
  ));
  return (
    <div className="flip-clock" role="timer" aria-label={`${minutes} minutes ${remainder} seconds remaining`}>
      <span className="flip-group" aria-hidden="true">{group(minutes)}</span>
      <span className="flip-colon" aria-hidden="true">:</span>
      <span className="flip-group" aria-hidden="true">{group(remainder)}</span>
    </div>
  );
}

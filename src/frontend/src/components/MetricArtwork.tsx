import React from "react";

// Decorative illustrations describe the metric; they never represent inventory quantities.
export default function MetricArtwork({ kind }: { kind: string }) {
  const screen = (x: number, y: number, w: number, h: number) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="9" className="art-device" />
      <rect x={x + 7} y={y + 7} width={w - 14} height={h - 17} rx="4" className="art-screen" />
      <path d={`M${x + w / 2} ${y + h}v14m-19 0h38`} className="art-line" />
      <path d={`M${x + 17} ${y + 22}h${w / 3}m-${w / 3} 10h${w / 2}`} className="art-detail" />
    </g>
  );
  return (
    <svg className="metric-artwork" viewBox="0 0 240 170" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="128" cy="146" rx="94" ry="15" className="art-shadow" />
      <circle cx="136" cy="83" r="61" className="art-halo" />
      <path d="M26 108h20V92m149-65v16h19M41 48h13m-6-6v12M198 119h12m-6-6v12" className="art-orbit" />
      {kind === "equipment" && <>
        {screen(43, 46, 128, 83)}
        <rect x="180" y="56" width="34" height="85" rx="6" className="art-device" />
        <path d="M190 70h14m-14 10h14m-14 10h14" className="art-detail" />
        <circle cx="197" cy="127" r="3" className="art-accent" />
        <rect x="25" y="100" width="32" height="49" rx="6" className="art-device" />
        <rect x="31" y="107" width="20" height="28" rx="3" className="art-screen" />
        <path d="M38 142h6" className="art-detail" />
      </>}
      {kind === "check" && <>
        {screen(42, 57, 115, 73)}
        <path d="m169 34 37 16v37c0 29-37 49-37 49s-37-20-37-49V50l37-16Z" className="art-shield" />
        <path d="m151 83 13 13 24-29" className="art-check" />
        <circle cx="52" cy="49" r="13" className="art-bubble" />
        <path d="m46 49 4 4 8-9" className="art-detail" />
      </>}
      {kind === "loans" && <>
        {screen(27, 66, 89, 58)}
        <rect x="155" y="55" width="57" height="88" rx="9" className="art-device" />
        <rect x="162" y="64" width="43" height="61" rx="4" className="art-screen" />
        <circle cx="183" cy="134" r="3" className="art-accent" />
        <path d="M69 45c27-26 59-25 88-8m-11-17 12 18-21 5M165 149c-28 20-59 14-77-1m5 18-7-19 20-1" className="art-flow" />
      </>}
      {kind === "tools" && <>
        {screen(40, 52, 134, 85)}
        <path d="m132 116 43-43a23 23 0 0 1 27-31l-15 16 12 13 16-15a23 23 0 0 1-30 29l-43 43a8 8 0 0 1-10-12Z" className="art-tool" />
        <path d="m74 81 13-23 13 23Z" className="art-bubble" />
        <path d="M87 66v6m0 4v1" className="art-detail" />
      </>}
      {kind === "history" && <>
        <rect x="57" y="37" width="105" height="109" rx="10" className="art-device" />
        <rect x="85" y="29" width="49" height="17" rx="6" className="art-bubble" />
        <path d="M78 65h56M78 82h38M78 99h30M78 116h30" className="art-detail" />
        <circle cx="164" cy="111" r="36" className="art-clock" />
        <path d="M164 89v23l15 10" className="art-flow" />
        <circle cx="164" cy="111" r="3" className="art-accent" />
      </>}
      {kind === "users" && <>
        <path d="M120 61v27m0 0H57v23m63-23h63v23m-63-23v23" className="art-flow" />
        <rect x="87" y="23" width="66" height="44" rx="9" className="art-device" />
        <path d="M105 39h30m-30 11h20" className="art-detail" />
        {[57, 120, 183].map((x) => <g key={x}>
          <rect x={x - 24} y="106" width="48" height="43" rx="10" className="art-screen" />
          <circle cx={x} cy="118" r="7" className="art-accent" />
          <path d={`M${x - 13} 139a13 13 0 0 1 26 0`} className="art-person" />
        </g>)}
      </>}
    </svg>
  );
}

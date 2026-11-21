import React from "react";
/** Linked facets: an asset, its custodian and its traceable movement. */
export default function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="brand-mark"
    >
      <path
        d="M16 2 29 9.5v13L16 30 3 22.5v-13L16 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m3 9.5 13 7.6L29 9.5M16 17v13M9 6l13 7.5v8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="22" r="4.3" fill="currentColor" />
      <path
        d="m20 22 1.4 1.4 2.6-3"
        stroke="var(--brand-mark-check, #087aaa)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

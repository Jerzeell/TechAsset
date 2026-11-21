import React, { useId } from "react";

/** Decorative illustration; never presents example figures as inventory data. */
export default function AssetScene({ compact = false }: { compact?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <div
      className={`asset-scene ${compact ? "asset-scene-compact" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 600 350" fill="none" focusable="false">
        <defs>
          <linearGradient
            id={id + "screen"}
            x1="160"
            y1="80"
            x2="440"
            y2="250"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#173e5a" />
            <stop offset="1" stopColor="#081e33" />
          </linearGradient>
          <linearGradient
            id={id + "metal"}
            x1="100"
            y1="220"
            x2="500"
            y2="300"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#9bbdcd" />
            <stop offset=".45" stopColor="#335f78" />
            <stop offset="1" stopColor="#183750" />
          </linearGradient>
          <linearGradient
            id={id + "light"}
            x1="200"
            y1="70"
            x2="440"
            y2="240"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#75edff" />
            <stop offset="1" stopColor="#1082c0" />
          </linearGradient>
          <radialGradient id={id + "halo"}>
            <stop stopColor="#1cbfe4" stopOpacity=".3" />
            <stop offset="1" stopColor="#1cbfe4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="308" cy="178" rx="260" ry="164" fill={`url(#${id}halo)`} />
        <g stroke="#50c6e1" strokeOpacity=".18">
          <ellipse cx="300" cy="276" rx="258" ry="54" />
          <ellipse cx="300" cy="276" rx="213" ry="37" />
          <path d="M60 276h480M100 302l115-60m280 60-110-60M300 222v108" />
          <path d="M67 167v-40l60-35M481 73l56 31v71M114 114l-25 15" />
        </g>
        <g fill="#73dcf2">
          <circle cx="67" cy="167" r="3" />
          <circle cx="481" cy="73" r="3" />
          <circle cx="537" cy="175" r="3" />
          <circle cx="127" cy="92" r="2" />
        </g>
        <ellipse
          cx="311"
          cy="290"
          rx="183"
          ry="20"
          fill="#021020"
          fillOpacity=".55"
        />
        <path
          d="m159 53 278 40v162l-278-39V53Z"
          fill="#0a253b"
          stroke="#528aa6"
          strokeWidth="2"
        />
        <path d="m169 66 257 37v139l-257-36V66Z" fill={`url(#${id}screen)`} />
        <path
          d="m159 216 278 39 78 43-305-39-91-24 40-19Z"
          fill={`url(#${id}metal)`}
          stroke="#7399ae"
          strokeWidth="1.5"
        />
        <path
          d="m119 235 91 24 305 39-8 7-301-39-87-25v-6Z"
          fill="#0a273f"
          stroke="#345f7a"
        />
        <path
          d="m180 225 241 34 37 20-244-32-34-22Z"
          fill="#15394f"
          stroke="#87b1c5"
          strokeOpacity=".5"
        />
        <g stroke="#517a91" strokeWidth="1.4">
          <path d="m193 234 235 33m-221-37 25 20m0-16 25 19m1-15 25 18m1-15 25 19m0-15 25 18m1-14 25 18m1-14 25 17m1-13 25 17" />
        </g>
        <path
          d="m281 255 69 9 20 11-71-9-18-11Z"
          fill="#7497ad"
          fillOpacity=".5"
          stroke="#96b8c8"
        />
        <path d="m184 87 225 32" stroke="#5b93ae" strokeOpacity=".4" />
        <circle cx="185" cy="79" r="2" fill="#7ce2ef" />
        <path
          d="m186 107 54 8m-54 3 34 5"
          stroke="#b8d8e7"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <g fill="#143c56" stroke="#316f8c">
          <path d="m184 137 64 9v46l-64-9v-46Z" />
          <path d="m258 148 64 9v46l-64-9v-46Z" />
          <path d="m332 159 64 9v46l-64-9v-46Z" />
        </g>
        <g stroke={`url(#${id}light)`} strokeWidth="2.2" strokeLinejoin="round">
          <path d="m201 150 27 4v16l-27-4v-16Zm14 19v6m-7-1 14 2" />
          <path d="m273 166 15 2m-5-6 5 6-5 4m24 17-15-2m5 6-5-6 5-4" />
          <path d="m351 177 17 2v22l-17-2v-22Zm4 6 9 1m-9 4 9 1m-9 4 6 1" />
        </g>
        <path
          d="m184 201 103 14m-103-6 72 10"
          stroke="#37637c"
          strokeWidth="2"
        />
        <g transform="translate(71 173) rotate(-10)">
          <rect
            width="69"
            height="96"
            rx="8"
            fill="#112e45"
            stroke="#739eb3"
            strokeWidth="2"
          />
          <rect x="6" y="8" width="57" height="76" rx="3" fill="#0b2135" />
          <path
            d="m20 38 12 7 16-16"
            stroke="#4ad5e8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 62h32M18 69h21"
            stroke="#3b6b84"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="35" cy="90" r="2" fill="#739eb3" />
        </g>
        <g transform="translate(470 129)">
          <path
            d="m0 8 37-18 40 23-37 19L0 8Z"
            fill="#265473"
            stroke="#5d9ab5"
          />
          <path d="M0 8v104l40 24V32L0 8Z" fill="#16364e" stroke="#3e7898" />
          <path
            d="m40 32 37-19v104l-37 19V32Z"
            fill="#0c2339"
            stroke="#3e7898"
          />
          <path
            d="m9 32 22 13m-22 5 22 13m-22 5 22 13m-22 5 22 13"
            stroke="#5388a1"
            strokeWidth="3"
          />
          <circle cx="25" cy="114" r="3" fill="#6ce0e8" />
        </g>
        <g stroke="#47bdda" strokeOpacity=".55" strokeDasharray="3 5">
          <path d="m138 207 22-9M438 181l32 11" />
        </g>
      </svg>
      <div className="scene-caption">
        <span>Inventario</span>
        <i />
        <span>Asignación</span>
        <i />
        <span>Historial</span>
      </div>
    </div>
  );
}

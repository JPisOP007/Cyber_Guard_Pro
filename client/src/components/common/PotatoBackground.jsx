import React from "react";
import { ReactComponent as SpriteBG } from "../../pages/auth/Ellipse 1.svg"; // background composition
import { ReactComponent as SpritePair } from "../../pages/auth/Ellipse 4.svg"; // pair/cluster
import { ReactComponent as SpriteTallA } from "../../pages/auth/Ellipse 2.svg"; // tall variant
import { ReactComponent as SpriteTallB } from "../../pages/auth/Ellipse 3.svg"; // tall variant

// Evenly distribute potatoes using selected auth SVG assets
const PotatoBackground = ({ style }) => {
  // Grid configuration for even distribution
  const cols = 4; // large but not clustered
  const rows = 3;
  const viewW = 1440;
  const viewH = 900;
  const cellW = viewW / cols;
  const cellH = viewH / rows;

  // Deterministic pseudo-random helpers for variety without re-render jitter
  const seed = 42;
  const rand = (i) => {
    // simple LCG based on index
    const a = 1664525;
    const c = 1013904223;
    let x = (i + seed) >>> 0;
    x = (a * x + c) >>> 0;
    return (x % 1000) / 1000; // [0,1)
  };

  // sprite meta: maintain aspect ratios and base sizes
  const sprites = [
    { Comp: SpritePair,  naturalW: 831,  naturalH: 543, baseW: 560,  mode: "width" },  // Ellipse 4
    { Comp: SpriteTallA, naturalW: 281,  naturalH: 971, baseH: 680,  mode: "height" }, // Ellipse 2 (tall)
    { Comp: SpriteTallB, naturalW: 294,  naturalH: 916, baseH: 680,  mode: "height" }, // Ellipse 3 (tall)
  ];

  const items = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const spr = sprites[idx % sprites.length];
      const ratio = spr.naturalH / spr.naturalW;
      const x = c * cellW + cellW / 2; // evenly spaced, no jitter
      const y = r * cellH + cellH / 2; // evenly spaced, no jitter
      const scale = 1.2 + rand(idx + 7) * 0.9; // 1.2 - 2.1
      const rot = (rand(idx + 17) - 0.5) * 60; // -30 to 30
      const wCap = cellW * 0.95;
      const hCap = cellH * 0.95;
      let w, h;
      if (spr.mode === "height" && spr.baseH) {
        h = spr.baseH * scale;
        w = h / ratio;
      } else {
        w = (spr.baseW || 400) * scale;
        h = w * ratio;
      }
      if (w > wCap) { w = wCap; h = w * ratio; }
      if (h > hCap) { h = hCap; w = h / ratio; }
      const spinSpeedClass = (idx % 3 === 0) ? "spin-fast" : (idx % 3 === 1) ? "spin" : "spin-slow";
      const spinDirClass = rand(idx + 99) > 0.5 ? "" : "spin-reverse";

      const delay = `${(idx % 5) * 1.2}s`;
      items.push(
        <g
          key={`p-${idx}`}
          transform={`translate(${x}, ${y}) rotate(${rot}) translate(${-w / 2}, ${-h / 2})`}
          className={`${spinSpeedClass} ${spinDirClass}`}
          opacity={0.98}
          style={{ animationDelay: delay }}
          filter="url(#potatoShadow)"
        >
          <g className="axis-spin" style={{ animationDuration: `${40 + (idx % 5) * 10}s`, animationDelay: delay }}>
            <spr.Comp className="no-shadow-sprite" width={w} height={h} />
          </g>
        </g>
      );
    }
  }

  return (
    <div
      aria-hidden="true"
      role="presentation"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        ...style,
      }}
    >
      <style>
        {`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .spin { animation: spin 90s linear infinite; transform-origin: center; transform-box: fill-box; }
          .spin-slow { animation-duration: 120s; }
          .spin-fast { animation-duration: 60s; }
          .spin-reverse { animation-direction: reverse; }
          @keyframes slowFloat { 0% { transform: translateY(0px); } 50% { transform: translateY(-6px); } 100% { transform: translateY(0px); } }
          .floaty { animation: slowFloat 12s ease-in-out infinite; }
          /* Strip all internal SVG filters/shadows from imported sprites */
          .no-shadow-sprite, .no-shadow-sprite * { filter: none !important; }
          @keyframes axisSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .axis-spin { animation-name: axisSpin; animation-timing-function: linear; animation-iteration-count: infinite; transform-origin: center; transform-box: fill-box; }
        `}
      </style>

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="none"
        className="floaty"
      >
        <defs>
          <filter id="potatoShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="8" dy="8" stdDeviation="4" floodColor="rgba(0,0,0,0.25)"/>
          </filter>
        </defs>
        {/* Background canvas rect as before */}
        <rect width={viewW} height={viewH} fill="#F3C987" />
        {/* Ellipse 1 at equal visibility with rotation and shadow */}
        <g
          className="spin-slow axis-spin"
          style={{ animationDuration: '180s' }}
          filter="url(#potatoShadow)"
          opacity="0.98"
        >
          <SpriteBG className="no-shadow-sprite" width={viewW} height={viewH} />
        </g>
        {items}
      </svg>
    </div>
  );
};

export default PotatoBackground;
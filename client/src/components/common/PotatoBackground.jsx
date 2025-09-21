import React from "react";

// Colors from your palette
const CANVAS = "#F3C987";
const POTATO_BASE = "#CD8C27";
const POTATO_SHADOW = "#6B4A10";

const PotatoBackground = ({ style }) => (
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 50s linear infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .spin-slow {
          animation-duration: 80s;
        }
        .spin-fast {
          animation-duration: 30s;
        }
        .spin-reverse {
          animation-direction: reverse;
        }
      `}
    </style>

    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
    >
      <rect width="1440" height="900" fill={CANVAS} />

      {/* Large potatoes */}
      <g className="spin">
        <path
          d="M60,150 C40,120 50,80 90,60 C140,40 190,50 230,80 C260,110 270,150 250,190 C230,230 190,250 150,240 C110,230 80,200 70,170 C60,160 60,150 60,150 Z"
          fill={POTATO_SHADOW}
        />
        <path
          d="M52,142 C32,112 42,72 82,52 C132,32 182,42 222,72 C252,102 262,142 242,182 C222,222 182,242 142,232 C102,222 72,192 62,162 C52,152 52,142 52,142 Z"
          fill={POTATO_BASE}
        />
      </g>

      <g className="spin spin-slow spin-reverse">
        <path
          d="M580,360 C550,330 560,280 600,260 C650,240 700,250 740,280 C780,310 790,360 770,400 C750,440 700,460 650,450 C600,440 570,400 580,380 Z"
          fill={POTATO_SHADOW}
        />
        <path
          d="M572,352 C542,322 552,272 592,252 C642,232 692,242 732,272 C772,302 782,352 762,392 C742,432 692,452 642,442 C592,432 562,392 572,372 Z"
          fill={POTATO_BASE}
        />
      </g>

      <g className="spin spin-fast">
        <path
          d="M1150,200 C1120,180 1130,140 1170,120 C1220,100 1280,110 1320,140 C1360,170 1380,220 1360,260 C1340,300 1300,320 1250,310 C1200,300 1170,260 1160,230 C1150,210 1150,200 1150,200 Z"
          fill={POTATO_SHADOW}
        />
        <path
          d="M1142,192 C1112,172 1122,132 1162,112 C1212,92 1272,102 1312,132 C1352,162 1372,212 1352,252 C1332,292 1292,312 1242,302 C1192,292 1162,252 1152,222 C1142,202 1142,192 1142,192 Z"
          fill={POTATO_BASE}
        />
      </g>

      <g className="spin spin-reverse">
        <path
          d="M120,680 C90,650 100,600 140,580 C180,560 220,570 250,600 C280,630 290,680 270,720 C250,760 210,780 170,770 C130,760 110,730 105,700 C100,690 120,680 120,680 Z"
          fill={POTATO_SHADOW}
        />
        <path
          d="M112,672 C82,642 92,592 132,572 C172,552 212,562 242,592 C272,622 282,672 262,712 C242,752 202,772 162,762 C122,752 102,722 97,692 C92,682 112,672 112,672 Z"
          fill={POTATO_BASE}
        />
      </g>

      <g className="spin spin-slow">
        <path
          d="M1200,620 C1170,590 1180,540 1220,520 C1270,500 1320,510 1360,540 C1400,570 1410,620 1390,660 C1370,700 1330,720 1280,710 C1230,700 1210,670 1200,640 C1195,630 1200,620 1200,620 Z"
          fill={POTATO_SHADOW}
        />
        <path
          d="M1192,612 C1162,582 1172,532 1212,512 C1262,492 1312,502 1352,532 C1392,562 1402,612 1382,652 C1362,692 1322,712 1272,702 C1222,692 1202,662 1192,632 C1187,622 1192,612 1192,612 Z"
          fill={POTATO_BASE}
        />
      </g>

      <g className="spin spin-fast spin-reverse">
        <path
          d="M1350,40 C1330,10 1350,-20 1380,-30 C1420,-40 1440,-20 1440,20 L1440,80 C1440,120 1420,140 1390,130 C1360,120 1350,80 1350,60 C1350,50 1350,40 1350,40 Z"
          fill={POTATO_SHADOW}
        />
        <path
          d="M1342,32 C1322,2 1342,-28 1372,-38 C1412,-48 1440,-28 1440,12 L1440,72 C1440,112 1412,132 1382,122 C1352,112 1342,72 1342,52 C1342,42 1342,32 1342,32 Z"
          fill={POTATO_BASE}
        />
      </g>

      {/* Medium potatoes */}
      <g className="spin">
        <path
          d="M450,180 C430,160 435,130 465,115 C500,100 535,105 565,125 C595,145 605,175 590,205 C575,235 545,250 510,245 C475,240 450,210 450,190 C450,185 450,180 450,180 Z"
          fill={POTATO_SHADOW}
        />
        <path
          d="M443,173 C423,153 428,123 458,108 C493,93 528,98 558,118 C588,138 598,168 583,198 C568,228 538,243 503,238 C468,233 443,203 443,183 C443,178 443,173 443,173 Z"
          fill={POTATO_BASE}
        />
      </g>

      <g className="spin spin-slow">
        <ellipse
          cx="900"
          cy="130"
          rx="55"
          ry="35"
          fill={POTATO_SHADOW}
          transform="rotate(-15 900 130)"
        />
        <ellipse
          cx="893"
          cy="123"
          rx="55"
          ry="35"
          fill={POTATO_BASE}
          transform="rotate(-15 893 123)"
        />
      </g>

      <g className="spin spin-reverse">
        <ellipse
          cx="350"
          cy="430"
          rx="45"
          ry="65"
          fill={POTATO_SHADOW}
          transform="rotate(20 350 430)"
        />
        <ellipse
          cx="343"
          cy="423"
          rx="45"
          ry="65"
          fill={POTATO_BASE}
          transform="rotate(20 343 423)"
        />
      </g>

      <g className="spin spin-fast">
        <ellipse
          cx="1080"
          cy="400"
          rx="70"
          ry="40"
          fill={POTATO_SHADOW}
          transform="rotate(-25 1080 400)"
        />
        <ellipse
          cx="1073"
          cy="393"
          rx="70"
          ry="40"
          fill={POTATO_BASE}
          transform="rotate(-25 1073 393)"
        />
      </g>

      <g className="spin spin-slow">
        <ellipse
          cx="780"
          cy="750"
          rx="50"
          ry="30"
          fill={POTATO_SHADOW}
          transform="rotate(10 780 750)"
        />
        <ellipse
          cx="773"
          cy="743"
          rx="50"
          ry="30"
          fill={POTATO_BASE}
          transform="rotate(10 773 743)"
        />
      </g>

      {/* Small potatoes */}
      <g className="spin spin-reverse">
        <ellipse
          cx="650"
          cy="100"
          rx="25"
          ry="18"
          fill={POTATO_SHADOW}
          transform="rotate(-30 650 100)"
        />
        <ellipse
          cx="645"
          cy="95"
          rx="25"
          ry="18"
          fill={POTATO_BASE}
          transform="rotate(-30 645 95)"
        />
      </g>

      <g className="spin">
        <ellipse
          cx="280"
          cy="280"
          rx="22"
          ry="15"
          fill={POTATO_SHADOW}
          transform="rotate(45 280 280)"
        />
        <ellipse
          cx="275"
          cy="275"
          rx="22"
          ry="15"
          fill={POTATO_BASE}
          transform="rotate(45 275 275)"
        />
      </g>

      <g className="spin spin-slow">
        <ellipse
          cx="820"
          cy="320"
          rx="28"
          ry="20"
          fill={POTATO_SHADOW}
          transform="rotate(-10 820 320)"
        />
        <ellipse
          cx="815"
          cy="315"
          rx="28"
          ry="20"
          fill={POTATO_BASE}
          transform="rotate(-10 815 315)"
        />
      </g>

      <g className="spin spin-fast spin-reverse">
        <ellipse
          cx="1300"
          cy="350"
          rx="20"
          ry="30"
          fill={POTATO_SHADOW}
          transform="rotate(60 1300 350)"
        />
        <ellipse
          cx="1295"
          cy="345"
          rx="20"
          ry="30"
          fill={POTATO_BASE}
          transform="rotate(60 1295 345)"
        />
      </g>

      <g className="spin">
        <ellipse
          cx="480"
          cy="620"
          rx="32"
          ry="22"
          fill={POTATO_SHADOW}
          transform="rotate(-20 480 620)"
        />
        <ellipse
          cx="475"
          cy="615"
          rx="32"
          ry="22"
          fill={POTATO_BASE}
          transform="rotate(-20 475 615)"
        />
      </g>

      <g className="spin spin-slow">
        <ellipse
          cx="1180"
          cy="680"
          rx="26"
          ry="18"
          fill={POTATO_SHADOW}
          transform="rotate(35 1180 680)"
        />
        <ellipse
          cx="1175"
          cy="675"
          rx="26"
          ry="18"
          fill={POTATO_BASE}
          transform="rotate(35 1175 675)"
        />
      </g>

      {/* Extra small potatoes */}
      <g className="spin spin-reverse">
        <ellipse
          cx="180"
          cy="160"
          rx="16"
          ry="12"
          fill={POTATO_SHADOW}
          transform="rotate(-45 180 160)"
        />
        <ellipse
          cx="177"
          cy="157"
          rx="16"
          ry="12"
          fill={POTATO_BASE}
          transform="rotate(-45 177 157)"
        />
      </g>

      <g className="spin">
        <ellipse
          cx="40"
          cy="250"
          rx="14"
          ry="10"
          fill={POTATO_SHADOW}
          transform="rotate(25 40 250)"
        />
        <ellipse
          cx="37"
          cy="247"
          rx="14"
          ry="10"
          fill={POTATO_BASE}
          transform="rotate(25 37 247)"
        />
      </g>

      <g className="spin spin-fast">
        <ellipse
          cx="580"
          cy="260"
          rx="18"
          ry="13"
          fill={POTATO_SHADOW}
          transform="rotate(-60 580 260)"
        />
        <ellipse
          cx="577"
          cy="257"
          rx="18"
          ry="13"
          fill={POTATO_BASE}
          transform="rotate(-60 577 257)"
        />
      </g>

      <g className="spin spin-slow">
        <ellipse
          cx="950"
          cy="300"
          rx="15"
          ry="11"
          fill={POTATO_SHADOW}
          transform="rotate(15 950 300)"
        />
        <ellipse
          cx="947"
          cy="297"
          rx="15"
          ry="11"
          fill={POTATO_BASE}
          transform="rotate(15 947 297)"
        />
      </g>

      <g className="spin spin-reverse">
        <ellipse
          cx="1350"
          cy="220"
          rx="20"
          ry="14"
          fill={POTATO_SHADOW}
          transform="rotate(-35 1350 220)"
        />
        <ellipse
          cx="1347"
          cy="217"
          rx="20"
          ry="14"
          fill={POTATO_BASE}
          transform="rotate(-35 1347 217)"
        />
      </g>

      <g className="spin">
        <ellipse
          cx="150"
          cy="540"
          rx="12"
          ry="8"
          fill={POTATO_SHADOW}
          transform="rotate(50 150 540)"
        />
        <ellipse
          cx="147"
          cy="537"
          rx="12"
          ry="8"
          fill={POTATO_BASE}
          transform="rotate(50 147 537)"
        />
      </g>

      <g className="spin spin-fast spin-reverse">
        <ellipse
          cx="420"
          cy="480"
          rx="16"
          ry="12"
          fill={POTATO_SHADOW}
          transform="rotate(-15 420 480)"
        />
        <ellipse
          cx="417"
          cy="477"
          rx="16"
          ry="12"
          fill={POTATO_BASE}
          transform="rotate(-15 417 477)"
        />
      </g>

      <g className="spin">
        <ellipse
          cx="680"
          cy="580"
          rx="14"
          ry="10"
          fill={POTATO_SHADOW}
          transform="rotate(40 680 580)"
        />
        <ellipse
          cx="677"
          cy="577"
          rx="14"
          ry="10"
          fill={POTATO_BASE}
          transform="rotate(40 677 577)"
        />
      </g>

      <g className="spin spin-slow">
        <ellipse
          cx="960"
          cy="620"
          rx="17"
          ry="12"
          fill={POTATO_SHADOW}
          transform="rotate(-25 960 620)"
        />
        <ellipse
          cx="957"
          cy="617"
          rx="17"
          ry="12"
          fill={POTATO_BASE}
          transform="rotate(-25 957 617)"
        />
      </g>

      <g className="spin spin-reverse">
        <ellipse
          cx="1120"
          cy="150"
          rx="13"
          ry="9"
          fill={POTATO_SHADOW}
          transform="rotate(30 1120 150)"
        />
        <ellipse
          cx="1117"
          cy="147"
          rx="13"
          ry="9"
          fill={POTATO_BASE}
          transform="rotate(30 1117 147)"
        />
      </g>

      {/* Tiny scattered potatoes */}
      <g className="spin">
        <ellipse
          cx="250"
          cy="370"
          rx="10"
          ry="7"
          fill={POTATO_SHADOW}
          transform="rotate(-20 250 370)"
        />
        <ellipse
          cx="248"
          cy="368"
          rx="10"
          ry="7"
          fill={POTATO_BASE}
          transform="rotate(-20 248 368)"
        />
      </g>

      <g className="spin spin-slow">
        <ellipse
          cx="1380"
          cy="460"
          rx="11"
          ry="8"
          fill={POTATO_SHADOW}
          transform="rotate(55 1380 460)"
        />
        <ellipse
          cx="1378"
          cy="458"
          rx="11"
          ry="8"
          fill={POTATO_BASE}
          transform="rotate(55 1378 458)"
        />
      </g>

      <g className="spin spin-reverse">
        <ellipse
          cx="380"
          cy="720"
          rx="9"
          ry="6"
          fill={POTATO_SHADOW}
          transform="rotate(-40 380 720)"
        />
        <ellipse
          cx="378"
          cy="718"
          rx="9"
          ry="6"
          fill={POTATO_BASE}
          transform="rotate(-40 378 718)"
        />
      </g>

      <g className="spin">
        <ellipse
          cx="1280"
          cy="580"
          rx="12"
          ry="8"
          fill={POTATO_SHADOW}
          transform="rotate(20 1280 580)"
        />
        <ellipse
          cx="1278"
          cy="578"
          rx="12"
          ry="8"
          fill={POTATO_BASE}
          transform="rotate(20 1278 578)"
        />
      </g>
    </svg>
  </div>
);

export default PotatoBackground;

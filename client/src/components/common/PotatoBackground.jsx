import React from 'react';

// Original warm potato palette
const CANVAS = '#F3C98B';
const SKIN1 = '#C98A3A';
const SKIN2 = '#B7772C';
const SKIN3 = '#B7772C'; // match SKIN2 for consistent warm tone
const HILITE = '#FFE2B0';
const DIRT = '#B7772C';   // keep within original warm range
const CHIP1 = '#D9A351';
const CHIP2 = '#C7903E';

const PotatoBackground = ({ style }) => (
  <div aria-hidden="true" role="presentation" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', ...style }}>
    <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="none">
      <defs>
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="18" result="b" />
          <feOffset dx="0" dy="10" in="b" result="o" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.25" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="o" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="skinGrad1" cx="30%" cy="25%" r="80%">
          <stop offset="0%" stopColor={HILITE} stopOpacity="0.62" />
          <stop offset="30%" stopColor={SKIN1} />
          <stop offset="70%" stopColor={SKIN2} />
          <stop offset="100%" stopColor={SKIN3} />
        </radialGradient>
        <radialGradient id="skinGrad2" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={HILITE} stopOpacity="0.6" />
          <stop offset="25%" stopColor={SKIN1} />
          <stop offset="65%" stopColor={SKIN2} />
          <stop offset="100%" stopColor={DIRT} />
        </radialGradient>
        <linearGradient id="rimShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="chipGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={CHIP1} />
          <stop offset="100%" stopColor={CHIP2} />
        </linearGradient>
        <filter id="chipShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        {/* Eyes/spots for potatoes */}
        <radialGradient id="eyeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={DIRT} stopOpacity="0.6" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </radialGradient>
        {/* Texture noise filter */}
        <filter id="roughTexture">
          <feTurbulence baseFrequency="0.9" numOctaves="4" result="noise" seed="2"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3"/>
        </filter>
      </defs>

      <rect width="1440" height="900" fill={CANVAS} />

      {/* Potatoes: irregular, bumpy shapes */}
      <g filter="url(#softShadow)">
        {/* Left potato - very irregular and lumpy */}
        <g transform="translate(160,230) rotate(-16) scale(0.74,0.60)">
          <path d="M-150,-90 C-185,-45 -170,-10 -160,20 C-155,45 -140,70 -120,85 C-85,110 -60,125 -30,135 C10,150 45,145 80,130 C110,118 125,95 135,70 C145,40 140,10 130,-20 C115,-55 90,-80 65,-95 C35,-115 0,-125 -30,-130 C-65,-135 -95,-125 -120,-110 C-140,-100 -150,-95 -150,-90 Z" fill="url(#skinGrad1)" />
          <path d="M-150,-90 C-185,-45 -170,-10 -160,20 C-155,45 -140,70 -120,85 C-85,110 -60,125 -30,135 C10,150 45,145 80,130 C110,118 125,95 135,70 C145,40 140,10 130,-20 C115,-55 90,-80 65,-95 C35,-115 0,-125 -30,-130 C-65,-135 -95,-125 -120,-110 C-140,-100 -150,-95 -150,-90 Z" fill="url(#rimShade)" />
        </g>

        {/* Center potato - long and knobby */}
        <g transform="translate(700,470) rotate(-8) scale(0.66,0.52)">
          <path d="M-220,-100 C-190,-150 -160,-170 -120,-175 C-80,-180 -40,-175 0,-165 C40,-155 75,-140 95,-120 C120,-95 135,-65 145,-30 C155,10 150,45 140,75 C125,110 100,135 70,150 C35,170 -5,175 -45,170 C-85,165 -125,150 -155,125 C-185,100 -210,70 -225,35 C-240,0 -235,-40 -220,-100 Z" fill="url(#skinGrad2)" />
          <path d="M-220,-100 C-190,-150 -160,-170 -120,-175 C-80,-180 -40,-175 0,-165 C40,-155 75,-140 95,-120 C120,-95 135,-65 145,-30 C155,10 150,45 140,75 C125,110 100,135 70,150 C35,170 -5,175 -45,170 C-85,165 -125,150 -155,125 C-185,100 -210,70 -225,35 C-240,0 -235,-40 -220,-100 Z" fill="url(#rimShade)" />
        </g>

        {/* Right potato - chunky and angular */}
        <g transform="translate(1220,210) rotate(18) scale(0.64,0.50)">
          <path d="M-135,-80 C-165,-60 -175,-30 -170,0 C-165,30 -150,55 -125,75 C-100,95 -70,110 -35,115 C0,120 35,115 65,100 C95,85 115,60 125,30 C135,0 130,-35 115,-65 C100,-95 75,-115 45,-125 C15,-135 -20,-140 -55,-135 C-90,-130 -120,-110 -135,-80 Z" fill="url(#skinGrad1)" />
          <path d="M-135,-80 C-165,-60 -175,-30 -170,0 C-165,30 -150,55 -125,75 C-100,95 -70,110 -35,115 C0,120 35,115 65,100 C95,85 115,60 125,30 C135,0 130,-35 115,-65 C100,-95 75,-115 45,-125 C15,-135 -20,-140 -55,-135 C-90,-130 -120,-110 -135,-80 Z" fill="url(#rimShade)" />
        </g>

        {/* Bottom-left potato - wide and bumpy */}
        <g transform="translate(240,800) rotate(-12) scale(0.58,0.46)">
          <path d="M-260,-60 C-285,-30 -295,10 -290,50 C-285,85 -270,115 -245,135 C-220,155 -185,170 -145,175 C-105,180 -60,175 -20,165 C25,155 65,140 95,115 C125,90 145,60 155,25 C165,-10 160,-50 145,-85 C130,-120 105,-145 75,-160 C45,-175 10,-180 -25,-175 C-65,-170 -105,-155 -140,-135 C-180,-110 -215,-90 -240,-70 C-255,-65 -260,-62 -260,-60 Z" fill="url(#skinGrad2)" />
          <path d="M-260,-60 C-285,-30 -295,10 -290,50 C-285,85 -270,115 -245,135 C-220,155 -185,170 -145,175 C-105,180 -60,175 -20,165 C25,155 65,140 95,115 C125,90 145,60 155,25 C165,-10 160,-50 145,-85 C130,-120 105,-145 75,-160 C45,-175 10,-180 -25,-175 C-65,-170 -105,-155 -140,-135 C-180,-110 -215,-90 -240,-70 C-255,-65 -260,-62 -260,-60 Z" fill="url(#rimShade)" />
        </g>

        {/* Bottom-right potato - oblong with indentations */}
        <g transform="translate(1160,800) rotate(-6) scale(0.62,0.50)">
          <path d="M-210,-50 C-230,-25 -240,5 -235,35 C-230,60 -220,80 -200,95 C-180,110 -155,120 -125,125 C-95,130 -60,125 -30,115 C0,105 25,90 45,70 C65,50 75,25 80,0 C85,-25 80,-55 70,-80 C60,-105 45,-125 25,-135 C5,-145 -20,-150 -45,-145 C-75,-140 -105,-125 -130,-105 C-160,-80 -185,-65 -200,-55 C-205,-52 -210,-51 -210,-50 Z" fill="url(#skinGrad1)" />
          <path d="M-210,-50 C-230,-25 -240,5 -235,35 C-230,60 -220,80 -200,95 C-180,110 -155,120 -125,125 C-95,130 -60,125 -30,115 C0,105 25,90 45,70 C65,50 75,25 80,0 C85,-25 80,-55 70,-80 C60,-105 45,-125 25,-135 C5,-145 -20,-150 -45,-145 C-75,-140 -105,-125 -130,-105 C-160,-80 -185,-65 -200,-55 C-205,-52 -210,-51 -210,-50 Z" fill="url(#rimShade)" />
        </g>

        {/* Medium potatoes with more realistic shapes */}
        <g transform="translate(460,150) rotate(22) scale(0.38)">
          <path d="M-120,-70 C-140,-50 -145,-25 -140,0 C-135,25 -125,45 -105,60 C-85,75 -60,85 -30,90 C0,95 30,90 55,80 C80,70 95,55 105,35 C115,15 110,-10 100,-35 C90,-60 75,-80 55,-95 C35,-110 10,-115 -15,-110 C-45,-105 -75,-95 -100,-80 C-115,-75 -120,-72 -120,-70 Z" fill="url(#skinGrad2)" />
        </g>
        
        <g transform="translate(980,360) rotate(-18) scale(0.36)">
          <path d="M-110,-60 C-125,-45 -130,-25 -125,-5 C-120,15 -110,30 -95,40 C-80,50 -60,55 -35,60 C-10,65 15,60 35,50 C55,40 65,25 70,5 C75,-15 70,-40 60,-60 C50,-80 35,-95 15,-105 C-5,-115 -30,-120 -55,-115 C-80,-110 -100,-100 -110,-60 Z" fill="url(#skinGrad1)" />
        </g>
        
        <g transform="translate(330,640) rotate(18) scale(0.32)">
          <path d="M-100,-55 C-115,-40 -120,-20 -115,0 C-110,20 -100,35 -85,45 C-70,55 -50,60 -25,65 C0,70 25,65 45,55 C65,45 75,30 80,10 C85,-10 80,-35 70,-55 C60,-75 45,-90 25,-100 C5,-110 -20,-115 -45,-110 C-70,-105 -90,-95 -100,-55 Z" fill="url(#skinGrad1)" />
        </g>
        
        <g transform="translate(1100,140) rotate(-20) scale(0.34)">
          <path d="M-120,-70 C-135,-50 -140,-25 -135,0 C-130,25 -120,45 -100,60 C-80,75 -55,85 -25,90 C5,95 35,90 60,80 C85,70 100,55 110,35 C120,15 115,-10 105,-35 C95,-60 80,-80 60,-95 C40,-110 15,-115 -10,-110 C-40,-105 -70,-95 -95,-80 C-110,-75 -120,-72 -120,-70 Z" fill="url(#skinGrad2)" />
        </g>
        
        {/* Small potatoes */}
        <g transform="translate(860,520) rotate(10) scale(0.24)">
          <path d="M-95,-50 C-105,-35 -110,-15 -105,5 C-100,25 -90,40 -75,50 C-60,60 -40,65 -15,70 C10,75 35,70 55,60 C75,50 85,35 90,15 C95,-5 90,-30 80,-50 C70,-70 55,-85 35,-95 C15,-105 -10,-110 -35,-105 C-60,-100 -80,-90 -95,-50 Z" fill="url(#skinGrad2)" />
        </g>
        
        <g transform="translate(200,420) rotate(-8) scale(0.22)">
          <path d="M-90,-48 C-100,-33 -105,-13 -100,7 C-95,27 -85,42 -70,52 C-55,62 -35,67 -10,72 C15,77 40,72 60,62 C80,52 90,37 95,17 C100,-3 95,-28 85,-48 C75,-68 60,-83 40,-93 C20,-103 -5,-108 -30,-103 C-55,-98 -75,-88 -90,-48 Z" fill="url(#skinGrad1)" />
        </g>
        {/* Light extra scatter - keep sparse */}
        <g transform="translate(1280,560) rotate(14) scale(0.18)">
          <path d="M-80,-45 C-95,-30 -98,-12 -94,6 C-90,22 -82,35 -70,44 C-58,53 -42,58 -22,62 C-2,66 16,62 30,54 C44,46 53,34 58,18 C62,2 59,-16 51,-32 C43,-48 31,-60 16,-67 C0,-74 -18,-77 -36,-73 C-56,-69 -72,-60 -80,-45 Z" fill="url(#skinGrad2)" />
        </g>
        <g transform="translate(100,120) rotate(-10) scale(0.16)">
          <path d="M-70,-40 C-82,-28 -86,-12 -82,4 C-78,18 -70,30 -59,38 C-48,46 -34,50 -16,54 C2,58 18,54 31,47 C44,40 52,30 56,16 C60,2 57,-14 49,-28 C41,-42 30,-52 16,-58 C2,-64 -14,-66 -30,-62 C-48,-58 -62,-50 -70,-40 Z" fill="url(#skinGrad1)" />
        </g>
        <g transform="translate(1320,120) rotate(6) scale(0.14)">
          <path d="M-60,-35 C-70,-25 -74,-12 -71,3 C-68,16 -61,26 -51,34 C-41,42 -28,46 -12,49 C4,52 18,49 30,42 C42,35 50,26 54,14 C58,2 55,-11 47,-23 C39,-35 29,-44 16,-49 C3,-54 -11,-56 -25,-53 C-41,-50 -54,-43 -60,-35 Z" fill="url(#skinGrad2)" />
        </g>
        <g transform="translate(260,900) rotate(-12) scale(0.15)">
          <path d="M-65,-38 C-75,-28 -78,-14 -74,0 C-70,12 -63,22 -53,29 C-43,36 -30,40 -15,43 C0,46 14,43 25,36 C36,29 44,21 48,9 C52,-3 49,-15 42,-27 C35,-39 25,-47 13,-52 C1,-57 -12,-58 -26,-55 C-40,-52 -52,-45 -65,-38 Z" fill="url(#skinGrad1)" />
        </g>
        {/* A few more tiny potatoes for variety */}
        <g transform="translate(1240,740) rotate(8) scale(0.13)">
          <path d="M-55,-32 C-64,-24 -67,-12 -64,2 C-61,14 -54,24 -45,30 C-36,36 -25,39 -12,41 C1,43 13,41 24,35 C35,29 43,21 46,10 C49,-1 46,-12 39,-23 C32,-34 23,-42 12,-46 C1,-50 -10,-52 -23,-49 C-36,-46 -47,-40 -55,-32 Z" fill="url(#skinGrad2)" />
        </g>
        <g transform="translate(180,700) rotate(-6) scale(0.12)">
          <path d="M-50,-30 C-58,-22 -61,-11 -58,1 C-55,12 -49,21 -40,27 C-31,33 -21,36 -10,38 C1,40 12,38 22,33 C32,28 39,21 42,10 C45,0 43,-10 36,-20 C29,-30 21,-37 10,-41 C0,-45 -11,-46 -22,-44 C-34,-42 -44,-36 -50,-30 Z" fill="url(#skinGrad1)" />
        </g>
        <g transform="translate(1080,100) rotate(4) scale(0.12)">
          <path d="M-48,-28 C-56,-21 -59,-10 -56,1 C-53,11 -47,19 -39,24 C-31,29 -21,32 -10,34 C1,36 11,34 20,29 C29,24 36,18 39,8 C42,-2 40,-12 34,-21 C28,-30 20,-36 10,-40 C0,-43 -10,-44 -21,-42 C-32,-40 -41,-34 -48,-28 Z" fill="url(#skinGrad2)" />
        </g>
      </g>

      {/* Potato eyes/spots - the characteristic dark spots on potatoes */}
      <g opacity="0.6">
        <ellipse cx="150" cy="210" rx="8" ry="6" fill="url(#eyeGrad)" />
        <ellipse cx="180" cy="250" rx="6" ry="4" fill="url(#eyeGrad)" />
        <ellipse cx="190" cy="270" rx="5" ry="3" fill="url(#eyeGrad)" />
        
        <ellipse cx="710" cy="450" rx="9" ry="7" fill="url(#eyeGrad)" />
        <ellipse cx="740" cy="480" rx="7" ry="5" fill="url(#eyeGrad)" />
        <ellipse cx="680" cy="510" rx="6" ry="4" fill="url(#eyeGrad)" />
        
        <ellipse cx="1200" cy="200" rx="7" ry="5" fill="url(#eyeGrad)" />
        <ellipse cx="1230" cy="230" rx="6" ry="4" fill="url(#eyeGrad)" />
        
        <ellipse cx="250" cy="780" rx="8" ry="6" fill="url(#eyeGrad)" />
        <ellipse cx="280" cy="810" rx="6" ry="4" fill="url(#eyeGrad)" />
        
        <ellipse cx="1140" cy="780" rx="7" ry="5" fill="url(#eyeGrad)" />
        <ellipse cx="1180" cy="810" rx="5" ry="3" fill="url(#eyeGrad)" />
        
        {/* Eyes on smaller potatoes */}
        <ellipse cx="450" cy="140" rx="4" ry="3" fill="url(#eyeGrad)" />
        <ellipse cx="470" cy="160" rx="3" ry="2" fill="url(#eyeGrad)" />
        
        <ellipse cx="970" cy="350" rx="4" ry="3" fill="url(#eyeGrad)" />
        <ellipse cx="990" cy="370" rx="3" ry="2" fill="url(#eyeGrad)" />
        
        <ellipse cx="320" cy="630" rx="3" ry="2" fill="url(#eyeGrad)" />
        <ellipse cx="1090" cy="130" rx="4" ry="3" fill="url(#eyeGrad)" />
      </g>

      {/* Chips - keep these as they were working well */}
      <g>
        <g fill="#000" opacity="0.18" filter="url(#chipShadow)">
          <ellipse cx="250" cy="120" rx="22" ry="15" />
          <ellipse cx="330" cy="210" rx="14" ry="10" />
          <ellipse cx="520" cy="160" rx="16" ry="12" />
          <ellipse cx="640" cy="110" rx="12" ry="9" />
          <ellipse cx="880" cy="150" rx="18" ry="13" />
          <ellipse cx="980" cy="260" rx="12" ry="9" />
          <ellipse cx="1240" cy="320" rx="18" ry="13" />
          <ellipse cx="180" cy="420" rx="16" ry="12" />
          <ellipse cx="320" cy="520" rx="14" ry="10" />
          <ellipse cx="520" cy="690" rx="18" ry="12" />
          <ellipse cx="760" cy="730" rx="16" ry="12" />
          <ellipse cx="980" cy="660" rx="14" ry="10" />
          <ellipse cx="1160" cy="540" rx="16" ry="11" />
          <ellipse cx="1040" cy="420" rx="14" ry="10" />
        </g>
        <g fill="url(#chipGrad)">
          <ellipse cx="242" cy="110" rx="22" ry="15" />
          <ellipse cx="322" cy="200" rx="14" ry="10" />
          <ellipse cx="512" cy="150" rx="16" ry="12" />
          <ellipse cx="632" cy="100" rx="12" ry="9" />
          <ellipse cx="872" cy="140" rx="18" ry="13" />
          <ellipse cx="972" cy="250" rx="12" ry="9" />
          <ellipse cx="1232" cy="310" rx="18" ry="13" />
          <ellipse cx="172" cy="410" rx="16" ry="12" />
          <ellipse cx="312" cy="510" rx="14" ry="10" />
          <ellipse cx="512" cy="680" rx="18" ry="12" />
          <ellipse cx="752" cy="720" rx="16" ry="12" />
          <ellipse cx="972" cy="650" rx="14" ry="10" />
          <ellipse cx="1152" cy="530" rx="16" ry="11" />
          <ellipse cx="1032" cy="410" rx="14" ry="10" />
        </g>
      </g>
    </svg>
  </div>
);

export default PotatoBackground;
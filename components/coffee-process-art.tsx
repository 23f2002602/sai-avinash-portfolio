"use client";

import { CoffeeCup } from "./drink-art";
import { MiniAvinash } from "./mini-avinash";

function Bean({ x, y, angle = 0 }: { x: number; y: number; angle?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle})`}><ellipse rx="20" ry="30" fill="#8e4930" stroke="#432921" strokeWidth="3" /><path d="M1-26C-16-8 17 6-1 26" stroke="#d38b52" strokeWidth="3" strokeLinecap="round" /></g>;
}

export function CoffeeProcessArt({ step }: { step: number }) {
  return <svg className={`coffee-process-art coffee-step-${step}`} viewBox="0 0 500 510" fill="none" aria-hidden="true">
    <ellipse cx="248" cy="443" rx="190" ry="29" fill="#493124" opacity=".13" />
    {step === 0 && <>
      <path d="M98 140L277 101L342 392L130 433Z" fill="#ee6743" stroke="#553323" strokeWidth="3" />
      <path d="M98 140L118 103L290 74L277 101Z" fill="#f59d66" stroke="#553323" strokeWidth="3" />
      <path d="M137 109L269 85" stroke="#553323" strokeWidth="3" strokeDasharray="5 7" />
      <path d="M128 206L290 171L314 312L151 349Z" fill="#fff0cf" />
      <text x="221" y="238" textAnchor="middle" fill="#573626" fontFamily="var(--serif)" fontSize="35" transform="rotate(-10 221 238)">good</text>
      <text x="229" y="282" textAnchor="middle" fill="#573626" fontFamily="var(--serif)" fontStyle="italic" fontSize="40" transform="rotate(-10 229 282)">beginnings.</text>
      <g className="loose-beans"><Bean x={375} y={199} angle={30} /><Bean x={401} y={285} angle={-45} /><Bean x={373} y={380} angle={65} /><Bean x={96} y={384} angle={30} /></g>
      <text x="336" y="100" fill="#553323" fontFamily="var(--hand)" fontSize="27" transform="rotate(9 336 100)">a handful.</text>
    </>}
    {step === 1 && <g transform="translate(25 -8) scale(.75)"><MiniAvinash pose="grind" /></g>}
    {step === 2 && <>
      <path d="M176 313L184 424Q254 450 313 422L321 313Z" fill="#e9bb73" stroke="#563728" strokeWidth="3" />
      <path d="M317 328Q388 312 369 375Q354 396 313 391" stroke="#563728" strokeWidth="16" /><path d="M318 328Q380 318 365 372Q352 388 315 386" stroke="#e9bb73" strokeWidth="10" />
      <path d="M157 230H338L303 313H191Z" fill="#80bfc1" stroke="#345454" strokeWidth="3" />
      <ellipse cx="248" cy="232" rx="91" ry="23" fill="#eee0be" stroke="#345454" strokeWidth="3" />
      <ellipse cx="248" cy="234" rx="59" ry="12" fill="#70452d" />
      <g className="water-kettle" transform="rotate(17 143 128)"><path d="M71 104Q25 29 105 37L142 88" stroke="#4b3435" strokeWidth="14" /><path d="M66 91Q161 60 180 155L241 127L238 146L190 184Q173 219 80 190Z" fill="#db9ac0" stroke="#4b3435" strokeWidth="3" /><ellipse cx="112" cy="91" rx="48" ry="12" fill="#f6cee1" stroke="#4b3435" strokeWidth="3" /><path d="M98 77v-9h25v9" stroke="#4b3435" strokeWidth="6" /></g>
      <path className="water-stream" d="M239 171Q268 185 249 228" stroke="#d9f5f0" strokeWidth="9" strokeLinecap="round" />
      <path className="coffee-drip" d="M246 306V332" stroke="#613a25" strokeWidth="5" strokeDasharray="6 9" />
      <text x="325" y="106" fill="#553323" fontFamily="var(--hand)" fontSize="31" transform="rotate(9 325 106)">give it time.</text>
    </>}
    {step >= 3 && <>
      {step < 5 && <g transform="translate(50 37) scale(1.111)"><CoffeeCup /></g>}
      {step === 3 && <>
        <g className="milk-carton" transform="rotate(25 341 110)"><path d="M298 57L377 57L407 89L394 186L289 177Z" fill="#90bedd" stroke="#344556" strokeWidth="3" /><path d="M298 57L319 29L386 29L377 57Z" fill="#d4e4f0" stroke="#344556" strokeWidth="3" /><path d="M377 57L386 29L409 62L407 89Z" fill="#6798c0" stroke="#344556" strokeWidth="3" /><path d="M301 91H387V154H297Z" fill="#fff7e7" /><text x="342" y="132" textAnchor="middle" fill="#466d89" fontFamily="var(--sans)" fontSize="23" fontWeight="700">MILK</text></g>
        <path className="milk-stream" d="M288 140Q246 175 244 244" stroke="#fff8e7" strokeWidth="13" strokeLinecap="round" />
        <ellipse className="milk-bloom" cx="239" cy="249" rx="36" ry="9" fill="#fce6bd" />
      </>}
      {step === 4 && <g className="coffee-spoon" stroke="#62442f" strokeWidth="3"><path d="M251 251L317 99" stroke="#f5d19e" strokeWidth="12" strokeLinecap="round" /><ellipse cx="248" cy="255" rx="13" ry="22" fill="#d1b589" transform="rotate(25 248 255)" /></g>}
      {step === 5 && <g transform="translate(25 -8) scale(.75)"><MiniAvinash pose="coffee" /></g>}
    </>}
  </svg>;
}

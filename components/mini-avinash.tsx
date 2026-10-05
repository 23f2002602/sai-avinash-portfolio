"use client";

import { useId } from "react";
import { DietCokeCan } from "./drink-art";

export type MiniPose = "wave" | "hold" | "open" | "sip" | "enjoy" | "grind" | "coffee";

/** Portrait-based character rig shared by every scene. Coordinates: 600 × 680. */
export function MiniAvinash({ pose = "wave" }: { pose?: MiniPose }) {
  const id = useId().replace(/:/g, "");
  const happy = pose === "enjoy", sip = pose === "sip";
  const soda = ["hold", "open", "sip", "enjoy"].includes(pose);
  return <g className="mini-me" data-pose={pose} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id={`${id}-skin`} x1="200" y1="100" x2="386" y2="340" gradientUnits="userSpaceOnUse"><stop stopColor="#e5ab78" /><stop offset=".6" stopColor="#ce8c5e" /><stop offset="1" stopColor="#b6734d" /></linearGradient>
      <linearGradient id={`${id}-jacket`} x1="180" y1="380" x2="425" y2="530" gradientUnits="userSpaceOnUse"><stop stopColor="#344570" /><stop offset=".5" stopColor="#253254" /><stop offset="1" stopColor="#141f38" /></linearGradient>
      <linearGradient id={`${id}-hair`} x1="240" y1="60" x2="340" y2="202" gradientUnits="userSpaceOnUse"><stop stopColor="#31313a" /><stop offset=".6" stopColor="#171820" /><stop offset="1" stopColor="#11121b" /></linearGradient>
      <pattern id={`${id}-checks`} width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#ddd7cb" /><path d="M0 0h4.5v4.5H0ZM4.5 4.5H9V9H4.5Z" fill="#626574" /></pattern>
    </defs>
    <ellipse cx="303" cy="641" rx="128" ry="17" fill="#302530" opacity=".15" />
    <g className="mini-me-body">
      <path d="M238 518L232 615L280 617L301 553L316 617L365 615L360 519Z" fill="#22232d" stroke="#161922" strokeWidth="3" />
      <path d="M238 605Q218 613 215 631L278 634L283 609M320 609L317 633L389 630Q383 611 362 605" fill="#f1e8d9" stroke="#242938" strokeWidth="3" />
      <path d="M216 628L276 632M320 631L387 628M233 615l27 3M341 616l24-1" stroke="#8f8c91" strokeWidth="3" />
      <path d="M237 359Q187 370 177 416L187 544Q295 568 408 543L420 413Q410 371 355 359Z" fill={`url(#${id}-jacket)`} stroke="#182237" strokeWidth="4" />
      <path d="M264 356L331 356L361 548Q303 561 246 549Z" fill="#171a24" />
      <path d="M265 351L243 368L226 417L249 421L246 548L272 542Z" fill={`url(#${id}-checks)`} stroke="#1b263c" strokeWidth="2" />
      <path d="M333 351L352 368L374 420L350 423L360 548L335 540Z" fill={`url(#${id}-checks)`} stroke="#1b263c" strokeWidth="2" />
      <path d="M203 420L208 528M389 417L386 528" stroke="#596489" strokeWidth="3" opacity=".7" />
      <path d="M269 325L267 362Q299 391 333 362L332 323" fill="#b77a53" stroke="#553928" strokeWidth="2" />
      <path d="M267 356Q298 377 334 355" stroke="#6c4633" strokeWidth="2" />
      <g className="mini-head" transform={sip ? "rotate(-8 300 310)" : undefined}>
        <ellipse cx="190" cy="242" rx="20" ry="31" fill="#c78559" stroke="#664432" strokeWidth="2" />
        <ellipse cx="410" cy="242" rx="19" ry="31" fill="#c78559" stroke="#664432" strokeWidth="2" />
        <path d="M186 227q15-2 13 25M413 228q-13 2-10 24" stroke="#985b40" strokeWidth="3" />
        <path d="M192 170Q192 92 298 91Q406 92 408 176L397 276Q383 344 300 356Q217 343 203 278Z" fill={`url(#${id}-skin)`} stroke="#624330" strokeWidth="3" />
        <ellipse cx="230" cy="274" rx="22" ry="10" fill="#b66d53" opacity=".25" /><ellipse cx="372" cy="273" rx="22" ry="10" fill="#b66d53" opacity=".25" />
        <path d="M202 238L215 269Q224 279 236 284Q259 266 283 286L300 289L317 285Q342 266 367 283Q383 270 397 239L393 288Q376 342 300 350Q224 340 210 290Z" fill="#242127" />
        <path d="M216 279Q234 323 299 335Q359 331 385 285" stroke="#484044" strokeWidth="3" opacity=".65" />
        <path d="M263 286Q280 275 300 285Q321 275 338 286L330 299Q314 297 300 292Q285 299 269 299Z" fill="#211e25" />
        {sip ? <ellipse cx="327" cy="302" rx="12" ry="7" fill="#6e3e32" /> : <><path d="M274 301Q299 307 327 299Q315 323 299 321Q284 320 274 301Z" fill="#a65b4a" stroke="#674030" strokeWidth="2" /><path d="M277 302Q301 308 324 301L319 309Q297 314 282 308Z" fill="#fff3df" /></>}
        <path d="M299 235L291 269Q300 277 310 267" stroke="#a56b49" strokeWidth="3" />
        <path d="M224 191Q247 179 270 190M329 189Q353 179 377 190" stroke="#30242a" strokeWidth="7" />
        {happy ? <g stroke="#493027" strokeWidth="4"><path d="M227 222Q246 205 266 222M332 221Q351 204 371 221" /></g> : <g className="mini-eyes">
          <path d="M224 220Q246 200 270 220Q249 241 224 220ZM329 220Q352 199 376 219Q354 241 329 220Z" fill="#fff3e4" stroke="#775440" strokeWidth="2" />
          <g fill="#6c4834"><ellipse cx="251" cy="220" rx="10" ry="12" /><ellipse cx="352" cy="219" rx="10" ry="12" /></g><g fill="#191b24"><ellipse cx="252" cy="220" rx="5" ry="8" /><ellipse cx="352" cy="219" rx="5" ry="8" /></g><g fill="#fff8ef"><circle cx="255" cy="215" r="3" /><circle cx="355" cy="214" r="3" /></g>
        </g>}
        <g className="mini-glasses" stroke="#181e2a" strokeWidth="7"><path d="M210 204Q208 195 222 196L273 197Q285 198 282 212L278 241Q276 253 260 254L229 252Q215 250 213 237Z" fill="#cde9ec" fillOpacity=".09" /><path d="M318 208Q315 195 329 195L382 193Q394 193 391 207L386 237Q384 250 370 251L338 252Q324 251 321 238Z" fill="#cde9ec" fillOpacity=".09" /><path d="M283 207Q300 200 317 206M195 200l17 4M391 200l13-4" /></g>
        <path d="M223 202L237 203M333 201L347 201" stroke="#b6d1df" strokeWidth="2" opacity=".6" />
        <path d="M193 230Q180 212 180 183L175 135Q174 99 217 86Q202 70 228 53Q255 34 287 52Q310 22 331 42Q369 24 386 59Q421 57 426 103Q441 143 412 194L401 229L389 162Q373 149 362 124Q314 180 241 179L221 180L209 226Z" fill={`url(#${id}-hair)`} stroke="#171923" strokeWidth="3" />
        <path d="M194 162Q223 91 302 73M211 155Q256 94 329 67M236 157Q309 115 357 74M323 139Q369 93 383 89M400 150Q412 117 395 96" stroke="#4d4b56" strokeWidth="3" opacity=".5" /><path d="M241 173Q289 166 323 140Q292 181 230 188" fill="#151720" />
      </g>
      <path d="M201 404Q162 452 213 480" stroke="#182237" strokeWidth="42" /><path d="M202 404Q169 447 216 472" stroke={`url(#${id}-jacket)`} strokeWidth="34" />
      {pose === "wave" ? <g className="mini-wave-hand"><path d="M398 402Q460 379 453 319" stroke="#182237" strokeWidth="41" /><path d="M398 402Q457 377 451 321" stroke={`url(#${id}-jacket)`} strokeWidth="33" /><path d="M437 323Q419 311 416 291L406 266Q402 257 410 254Q416 253 421 265L430 280L427 241Q426 230 434 229Q443 230 443 241L447 267L452 229Q454 219 462 222Q469 225 466 237L461 268L476 239Q481 230 488 235Q494 239 488 249L474 278L491 263Q498 257 503 264Q507 270 498 279L482 298Q471 318 461 326Z" fill={`url(#${id}-skin)`} stroke="#684631" strokeWidth="3" /><path d="M435 284Q451 279 461 292M443 308l12-10" stroke="#a06949" strokeWidth="2" /></g> : <path d={sip ? "M396 404Q460 370 410 333" : "M398 405Q432 451 393 476"} stroke={`url(#${id}-jacket)`} strokeWidth="39" />}
      {!soda && pose !== "coffee" && pose !== "grind" && <path d="M215 471Q232 459 246 467L253 484Q233 498 213 485Z" fill={`url(#${id}-skin)`} stroke="#684631" strokeWidth="2" />}
      {soda && <>
        <g className={pose !== "hold" ? "can-is-open" : undefined} transform={sip ? "translate(250 287) rotate(-52 30 16)" : "translate(333 369) rotate(9 61 102)"}><svg width="122" height="207" viewBox="0 0 300 510"><DietCokeCan opened={pose !== "hold"} /></svg></g>
        <path d={sip ? "M417 344Q394 321 382 327Q370 338 390 350L412 362" : "M394 469Q370 450 354 457Q341 467 357 477L383 489"} fill={`url(#${id}-skin)`} stroke="#684631" strokeWidth="3" />
        {pose === "open" ? <g className="mini-open-hand"><path d="M215 473Q265 448 365 407" stroke="#c48a5f" strokeWidth="23" /><path d="M352 412L370 402L387 399Q400 398 400 407Q397 414 382 415L370 423" fill={`url(#${id}-skin)`} stroke="#684631" strokeWidth="2" /></g> : <path d="M212 470Q238 456 250 471Q250 483 226 490L214 486Z" fill={`url(#${id}-skin)`} stroke="#684631" strokeWidth="2" />}
      </>}
      {pose === "grind" && <>
        <path d="M244 427L358 427L370 554Q302 577 233 553Z" fill="#548a72" stroke="#284b40" strokeWidth="3" /><ellipse cx="301" cy="427" rx="58" ry="16" fill="#8e6644" stroke="#284b40" strokeWidth="3" /><rect x="261" y="485" width="78" height="48" rx="5" fill="#e4c597" stroke="#6e5136" strokeWidth="2" /><circle cx="301" cy="506" r="7" fill="#68482e" />
        <g className="mini-grinder-crank grinder-handle"><path d="M301 432V405L398 395" stroke="#544130" strokeWidth="7" /><rect x="384" y="380" width="35" height="22" rx="9" fill="#bd834e" stroke="#544130" strokeWidth="2" /><path d="M398 382q-21-13-27 0q-4 9 13 16l15 3" fill={`url(#${id}-skin)`} stroke="#684631" strokeWidth="2" /></g><path d="M215 471L246 467Q261 466 262 477Q264 487 244 491L223 493" fill={`url(#${id}-skin)`} stroke="#684631" strokeWidth="2" /><g fill="#694631"><circle cx="280" cy="428" r="5" /><circle cx="311" cy="430" r="4" /><circle cx="324" cy="424" r="5" /></g>
      </>}
      {pose === "coffee" && <>
        <path d="M349 428Q406 408 407 451Q404 482 357 478" stroke="#d0a47b" strokeWidth="16" /><path d="M239 423L248 492Q299 533 355 491L363 423Z" fill="#f0d7af" stroke="#916748" strokeWidth="3" /><ellipse cx="301" cy="423" rx="62" ry="19" fill="#fff0d2" stroke="#916748" strokeWidth="3" /><ellipse cx="301" cy="425" rx="52" ry="13" fill="#72482d" /><path d="M267 426Q287 410 329 424Q318 438 286 427" stroke="#d5a271" strokeWidth="3" />
        <path d="M212 471Q229 456 247 466L262 481Q263 494 248 493L218 489M392 473Q378 456 359 466L348 480Q346 491 360 492L386 488" fill={`url(#${id}-skin)`} stroke="#684631" strokeWidth="3" /><g className="finished-steam mini-cup-steam" stroke="#f1dab1" strokeWidth="3"><path d="M281 397Q264 374 282 354" /><path d="M314 393Q333 373 313 349" /></g><path d="M293 459q-6-10-12-3q-4 8 12 18q17-11 11-19q-6-6-11 4" fill="#ba5641" />
      </>}
    </g>
  </g>;
}

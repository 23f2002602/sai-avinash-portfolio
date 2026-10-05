type Drawing = "study" | "people" | "build" | "next" | "assessment" | "placement" | "slides" | "crop";

/** Deliberately irregular paths, pencil hatching and marginal notes. */
export function InkDrawing({ kind, compact = false }: { kind: Drawing; compact?: boolean }) {
  return <svg viewBox="0 0 600 460" className={`ink-drawing ink-${kind} ${compact ? "ink-compact" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "study" && <>
      <g className="ink-paper" transform="rotate(-7 290 245)">
        <path d="M132 83L463 90L452 379L124 367Z" fill="var(--sketch-paper, #e7e7e2)" stroke="none" />
        <path className="ink-stroke" d="M131 84Q272 87 462 90L453 379Q290 372 124 368L132 83M153 91L145 362" />
        <path d="M155 130L435 135M155 169L432 173M151 208L431 211M150 247L429 251M149 287L429 290M147 325L424 332" opacity=".13" />
        <path d="M135 105Q111 99 116 115Q121 126 138 119M134 153Q108 144 114 163Q118 170 135 165M133 204Q108 193 111 211Q115 220 133 215M130 255Q105 245 109 264Q115 272 131 267M128 309Q104 300 108 317Q111 326 129 322M126 353Q101 344 106 360Q109 369 127 364" />
        <text x="179" y="126" className="ink-hand">a different way of seeing things</text>
        <text x="185" y="167" className="ink-formula">P(A | B) = P(B | A) P(A)</text>
        <path d="M280 176L419 178" /><text x="331" y="200" className="ink-formula">P(B)</text>
        <path className="ink-stroke" d="M187 319L189 232M181 313L378 319M201 308C231 307 245 306 260 283S278 238 293 247S312 302 364 309" />
        <path d="M259 301L266 285M266 303L274 273M274 304L282 265M283 305L291 259M292 306L300 271M301 308L309 291" opacity=".35" />
        <text x="329" y="264" className="ink-hand">why?</text>
        <path className="ink-stroke" d="M366 269Q392 283 375 302M372 293L375 302L382 297" />
        <text x="180" y="354" className="ink-hand">IIT Madras · 2023 — 2027</text>
      </g>
      <g className="ink-loose" transform="rotate(18 471 233)"><path d="M464 132L478 134L473 333L463 350L459 331Z" fill="var(--sketch-paper, #e7e7e2)" /><path d="M469 137L466 329M459 331L473 333M463 350L465 341M464 149L477 151" /><path d="M461 126Q470 115 479 129L478 134L464 132Z" /></g>
      <path className="ink-stroke" d="M92 393Q83 375 97 360M85 362L97 360L97 373" /><text x="42" y="418" className="ink-hand">start with a question.</text>
    </>}
    {kind === "people" && <>
      <g className="ink-paper" transform="rotate(-9 182 144)"><path d="M68 72L278 67L284 224L77 234Z" fill="var(--sketch-paper, #e7e7e2)" /><path d="M140 66L141 48Q145 40 149 48L153 91Q151 101 145 96L142 59" /><text x="95" y="115" className="ink-hand ink-large">Gaara AI</text><path d="M96 136Q167 132 244 136" /><text x="97" y="166" className="ink-hand">research, outreach,</text><text x="101" y="191" className="ink-hand">real conversations.</text></g>
      <g className="ink-loose" transform="rotate(8 416 255)"><path d="M326 183L521 188L517 337L320 329Z" fill="var(--sketch-paper, #e7e7e2)" /><text x="351" y="230" className="ink-hand ink-large">Ments</text><path d="M346 248L483 252" /><text x="346" y="280" className="ink-hand">inside a startup</text><text x="349" y="309" className="ink-hand">→ operations</text></g>
      <path className="ink-stroke" d="M225 245C229 309 289 290 299 258M284 260L300 253L304 270M444 356Q389 403 279 380M290 369L273 380L290 391" />
      <text x="79" y="353" className="ink-hand ink-large">Syngenta</text><text x="81" y="383" className="ink-hand">data science, in practice.</text>
      <path d="M87 399Q173 391 258 399M96 406L225 403" opacity=".55" />
    </>}
    {(kind === "build" || kind === "assessment" || kind === "placement" || kind === "slides") && <>
      <g className="ink-paper" transform="rotate(-4 305 245)">
        <path d="M95 111Q102 99 115 103L489 112Q501 114 501 128L492 330L101 320Z" fill="var(--sketch-paper, #e7e7e2)" />
        <path d="M109 120L485 129L478 303L116 294Z" />
        <path className="ink-stroke" d="M101 320L70 352Q262 369 517 359L492 330" />
        <path d="M70 352L75 361Q279 378 514 368L517 359M237 337L352 340L346 349L242 346Z" />
        <path d="M111 147L483 155" opacity=".55" /><path d="M125 135L130 135M141 136L146 136M157 137L162 137" strokeWidth="3" />
        {kind === "assessment" ? <><text x="142" y="188" className="ink-hand">more than a score</text><path className="ink-stroke" d="M158 230L168 238L185 214M158 267L168 275L185 251M205 229L421 235M204 266L353 271" /><path d="M389 256L432 257L431 281L389 280Z" /></>
        : kind === "placement" ? <><text x="140" y="189" className="ink-hand">a place for everyone</text><path className="ink-stroke" d="M156 214L240 215L239 266L153 265ZM340 218L435 222L433 271L337 270M248 241L325 244M315 234L326 244L313 254" /><text x="166" y="247" className="ink-hand">student</text><text x="344" y="251" className="ink-hand">company</text></>
        : kind === "slides" ? <><path d="M144 175L205 177L204 270L143 268M223 178L451 185L447 279L222 272Z" /><path d="M154 194L192 195M154 210L187 211M154 233L190 234" /><text x="263" y="216" className="ink-hand">an idea,</text><text x="278" y="246" className="ink-hand">in slides.</text></>
        : <><text x="144" y="190" className="ink-hand">from a rough idea...</text><path className="ink-stroke" d="M149 215L237 218M149 234L269 238M149 255L217 258M305 209L447 215L445 281L303 276ZM320 260L345 239L369 253L423 229" /></>}
      </g>
      <text x="124" y="78" className="ink-hand">make it. break it. try again.</text><path className="ink-stroke" d="M454 69Q514 63 528 113M513 104L529 117L534 98" />
      <path d="M183 397Q289 388 422 398M212 405Q294 399 384 406" opacity=".3" />
      <text x="212" y="438" className="ink-hand">a work in progress</text>
    </>}
    {kind === "next" && <>
      <g className="ink-paper" transform="rotate(-7 300 244)"><path d="M105 132L478 144L469 355L100 342Z" fill="var(--sketch-paper, #e7e7e2)" /><path className="ink-stroke" d="M108 139L287 279L475 150M103 335L237 239M466 348L335 245" /><path d="M105 132L293 264L478 144" /><text x="172" y="202" className="ink-hand ink-large">say hello.</text></g>
      <path className="ink-stroke" d="M184 104C145 24 442 29 435 106M422 94L435 109L445 90" /><text x="231" y="62" className="ink-hand">your turn</text>
      <path d="M79 370L65 382M85 376L81 395M489 122L506 116M487 110L491 93" /><text x="175" y="418" className="ink-hand">there's room for a conversation.</text>
    </>}
    {kind === "crop" && <>
      <path className="ink-stroke" d="M116 345Q294 310 482 340M120 370Q305 334 477 363M146 397Q297 370 440 387M295 332Q290 252 303 145M298 244Q231 233 216 181Q280 179 298 244M300 208Q360 197 384 140Q327 131 300 208M297 285Q348 266 380 221Q316 219 297 285" />
      <path d="M239 201L286 233M321 187L361 157M320 265L358 236M300 152Q276 127 300 96Q323 125 303 145" />
      <text x="89" y="107" className="ink-hand">soil. weather.</text><text x="88" y="136" className="ink-hand">a little guidance.</text><path className="ink-stroke" d="M399 100Q453 114 449 172M439 158L449 174L460 158" />
    </>}
  </svg>;
}

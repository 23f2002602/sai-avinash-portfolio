"use client";

import { useId } from "react";

export function DietCokeCan({ opened = false }: { opened?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
        <svg className="coke-can" viewBox="0 0 300 510" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-aluminum`} x1="0" x2="1"><stop stopColor="#646464" /><stop offset=".16" stopColor="#ddd" /><stop offset=".32" stopColor="#fafafa" /><stop offset=".48" stopColor="#c2c2c2" /><stop offset=".69" stopColor="#eee" /><stop offset=".89" stopColor="#a3a3a3" /><stop offset="1" stopColor="#626262" /></linearGradient>
            <linearGradient id={`${id}-lid`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f1f1f1" /><stop offset=".5" stopColor="#999" /><stop offset="1" stopColor="#d8d8d8" /></linearGradient>
          </defs>
          <path d="M64 78Q57 95 49 110L47 426Q48 444 62 456L68 470Q148 493 231 470L238 456Q252 444 253 426L251 110Q242 94 237 78Z" fill={`url(#${id}-aluminum)`} stroke="#888" />
          <ellipse cx="150" cy="79" rx="88" ry="23" fill={`url(#${id}-lid)`} stroke="#555" strokeWidth="2" />
          <ellipse cx="150" cy="78" rx="78" ry="17" stroke="#eee" strokeWidth="2" />
          
          <ellipse className="can-opening" cx="167" cy="79" rx="23" ry="10" fill={opened ? "#171717" : "#aaa"} stroke="#777" />
          <g className="can-tab"><path d="M117 69Q105 76 119 85L143 88Q159 82 147 73Z" fill="#ddd" stroke="#777" strokeWidth="2" /><ellipse cx="125" cy="77" rx="10" ry="4" fill="#777" /><circle cx="146" cy="81" r="3" fill="#666" /></g>
          <path d="M62 456Q150 480 238 456M68 470Q151 492 231 470" stroke="#eee" strokeWidth="3" />
          <path d="M65 119L65 419" stroke="white" opacity=".55" strokeWidth="2" />
          <text x="93" y="202" fill="#303030" fontSize="54" fontFamily="var(--serif)" fontStyle="italic" letterSpacing="-5">diet</text>
          
          <text x="62" y="285" fill="#df3029" fontSize="84" fontFamily="var(--serif)" fontStyle="italic" letterSpacing="-9">Coke</text>
          <path d="M72 304Q153 329 225 303M80 312Q155 337 213 316" stroke="#333" strokeWidth="2" />
          <text x="150" y="359" textAnchor="middle" fill="#444" fontSize="10" fontFamily="var(--mono)" letterSpacing="2">DIET COKE</text>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => <ellipse key={i} cx={75 + (i * 53) % 155} cy={133 + (i * 71) % 282} rx={2 + i % 3} ry={3 + i % 3} fill="#fff" fillOpacity=".38" stroke="#999" strokeOpacity=".3" />)}
        </svg>);
}

export function CoffeeCup() {
  const id = useId().replace(/:/g, "");
  return <g className="coffee-cup" fill="none">
    <defs>
      <linearGradient id={`${id}-ceramic`} x1="50" y1="200" x2="270" y2="310" gradientUnits="userSpaceOnUse"><stop stopColor="#f7ead4" /><stop offset=".45" stopColor="#e6caaa" /><stop offset="1" stopColor="#ab7954" /></linearGradient>
      <radialGradient id={`${id}-coffee`}><stop stopColor="#9b6342" /><stop offset=".75" stopColor="#593421" /><stop offset="1" stopColor="#2d1c15" /></radialGradient>
      <clipPath id={`${id}-surface`}><ellipse cx="174" cy="190" rx="97" ry="26" /></clipPath>
    </defs>
    <g className="coffee-steam" stroke="#b99c7c" strokeWidth="2" strokeLinecap="round">
      <path d="M120 139C86 107 149 90 123 53" /><path d="M174 132C211 101 151 75 179 29" /><path d="M221 145C249 116 204 97 229 69" />
    </g>
    <ellipse cx="177" cy="368" rx="157" ry="40" fill="#b28662" opacity=".22" />
    <ellipse cx="177" cy="359" rx="152" ry="34" fill="#ead4b7" stroke="#896549" strokeWidth="2" />
    <ellipse cx="174" cy="357" rx="109" ry="22" stroke="#c5a27e" strokeWidth="2" />
    <path d="M269 197C351 166 354 297 274 303" stroke="#8e6445" strokeWidth="28" />
    <path d="M269 197C345 177 341 286 274 289" stroke="#e0c09b" strokeWidth="17" />
    <path d="M62 186L78 299Q84 353 173 354Q258 353 270 299L287 186Z" fill={`url(#${id}-ceramic)`} stroke="#896549" strokeWidth="2" />
    <ellipse cx="174" cy="185" rx="113" ry="38" fill="#f7e9d3" stroke="#896549" strokeWidth="2" />
    <ellipse cx="174" cy="190" rx="99" ry="28" fill={`url(#${id}-coffee)`} />
    <g clipPath={`url(#${id}-surface)`}><g className="coffee-swirl" stroke="#d4a477" strokeLinecap="round"><path d="M115 190C120 164 240 173 232 193C225 212 134 213 137 191C140 179 211 182 211 194C211 201 163 202 162 192" strokeWidth="3" /><path d="M96 192Q98 176 116 176M237 204l10-8" strokeWidth="1.5" /></g></g>
    <path d="M82 221L91 288" stroke="#fff6df" strokeWidth="3" opacity=".6" />
    <text x="172" y="268" textAnchor="middle" fill="#573c2a" fontFamily="var(--hand)" fontSize="29" transform="rotate(-5 172 268)">one more</text>
    <text x="173" y="300" textAnchor="middle" fill="#573c2a" fontFamily="var(--hand)" fontSize="30" transform="rotate(-5 173 300)">idea.</text>
  </g>;
}

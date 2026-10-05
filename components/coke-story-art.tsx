"use client";

import { MiniAvinash, type MiniPose } from "./mini-avinash";

export const cokeMoments = ["The reveal", "Hold that thought", "Crack it open", "The first sip", "Ahh. That\u2019s better.", "Enjoy the little things"];
const poses: MiniPose[] = ["wave", "hold", "open", "sip", "enjoy", "wave"];

export function CokeStoryArt({ step, pulse = 0 }: { step: number; pulse?: number }) {
  return <svg className={`coke-story-art coke-moment-${step}`} viewBox="0 0 600 680" fill="none" role="img" aria-label={`Mini Avinash: ${cokeMoments[step]}`}>
    <path d="M67 365C-9 184 162 56 344 87S622 303 505 425" stroke="#ffc658" strokeWidth="2" strokeDasharray="5 10" />
    <MiniAvinash pose={poses[step] ?? "wave"} />
    {step === 2 && <g key={pulse} className="drawn-fizz" stroke="#fff1cf" strokeWidth="3"><circle cx="418" cy="344" r="6" /><circle cx="435" cy="316" r="4" /><circle cx="449" cy="358" r="5" /><text x="427" y="282" stroke="none" fill="#ffdf73" fontFamily="var(--hand)" fontSize="38" transform="rotate(10 427 282)">pssst!</text></g>}
    {step === 4 && <g className="enjoy-marks" stroke="#ffe171" strokeWidth="4" strokeLinecap="round"><path d="M141 243l-30-12M153 199l-19-24M451 199l20-23M465 242l31-7" /><text x="449" y="152" stroke="none" fill="#fff1cf" fontFamily="var(--hand)" fontSize="42">ahh.</text></g>}
  </svg>;
}

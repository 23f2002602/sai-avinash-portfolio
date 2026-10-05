import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdir, writeFile } from "node:fs/promises";
import { MiniAvinash, type MiniPose } from "../components/mini-avinash";

// Static, transparent SVG exports of the same character used on the website.
const poses: MiniPose[] = ["wave", "hold", "open", "sip", "enjoy", "grind", "coffee"];
async function exportPoses() {
  await mkdir("public/mini-me", { recursive: true });
  for (const pose of poses) {
  const svg = renderToStaticMarkup(<svg xmlns="http://www.w3.org/2000/svg" width="600" height="680" viewBox="0 0 600 680" role="img" aria-label={`Mini Avinash, ${pose} pose`}><title>{`Mini Avinash — ${pose}`}</title><MiniAvinash pose={pose} /></svg>);
  await writeFile(`public/mini-me/${pose}.svg`, svg);
  if (pose === "wave") await writeFile("public/mini-avinash.svg", svg);
  }
  console.log("Exported Mini Avinash and seven reusable poses.");
}
exportPoses().catch(error => { console.error(error); process.exitCode = 1; });

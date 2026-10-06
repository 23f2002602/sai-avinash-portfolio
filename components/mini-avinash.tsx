import { characterAssets, type CharacterPose } from "@/lib/character-assets";

export type MiniPose = CharacterPose;

/** A consistent portrait render in the shared 600 × 680 scene coordinate space. */
export function MiniAvinash({ pose = "wave" }: { pose?: MiniPose }) {
  return <image className="mini-me" data-pose={pose} href={characterAssets[pose]} x="45" y="0" width="510" height="680" preserveAspectRatio="xMidYMax meet" />;
}

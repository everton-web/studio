import { Composition } from "remotion";
import { HeroLoop, HERO_LOOP } from "./HeroLoop";

export function RemotionRoot() {
  return (
    <Composition
      id="HeroLoop"
      component={HeroLoop}
      durationInFrames={HERO_LOOP.frames}
      fps={HERO_LOOP.fps}
      width={HERO_LOOP.width}
      height={HERO_LOOP.height}
    />
  );
}

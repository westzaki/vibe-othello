import type { CpuLevel } from "../cpu";
import type { GameMode, HumanDisc } from "../game/matchSetup";
import { StartHero } from "./start/StartHero";
import { StartMatchSetupPanel } from "./start/StartMatchSetupPanel";

type StartScreenProps = {
  initialCpuLevel: CpuLevel;
  initialHumanDisc: HumanDisc;
  initialMode: GameMode;
  onOpenSettings: () => void;
  onStart: (mode: GameMode, cpuLevel: CpuLevel, humanDisc: HumanDisc) => void;
};

export function StartScreen({
  initialCpuLevel,
  initialHumanDisc,
  initialMode,
  onOpenSettings,
  onStart,
}: StartScreenProps) {
  return (
    <section className="start-screen" aria-labelledby="start-title">
      <div className="start-menu">
        <StartHero />
        <StartMatchSetupPanel
          initialCpuLevel={initialCpuLevel}
          initialHumanDisc={initialHumanDisc}
          initialMode={initialMode}
          onOpenSettings={onOpenSettings}
          onStart={onStart}
        />
      </div>
    </section>
  );
}

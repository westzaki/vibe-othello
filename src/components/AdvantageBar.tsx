import type { CSSProperties } from "react";
import type { Advantage } from "../cpu/advantage";

type AdvantageBarProps = {
  advantage: Advantage;
};

export function AdvantageBar({ advantage }: AdvantageBarProps) {
  const barStyle = {
    "--black-advantage": `${advantage.blackPercent}%`,
  } as CSSProperties;

  return (
    <section
      className="advantage-panel"
      aria-label={`Advantage: Black ${advantage.blackPercent} percent, White ${advantage.whitePercent} percent`}
    >
      <div className="advantage-panel__header">
        <span>Advantage</span>
        <strong>{getAdvantageLabel(advantage)}</strong>
      </div>
      <div className="advantage-bar" style={barStyle} aria-hidden="true">
        <span className="advantage-bar__segment advantage-bar__segment--black" />
        <span className="advantage-bar__segment advantage-bar__segment--white" />
      </div>
      <div className="advantage-panel__scores">
        <span className="advantage-panel__score advantage-panel__score--black">
          Black {advantage.blackPercent}%
        </span>
        <span className="advantage-panel__score advantage-panel__score--white">
          White {advantage.whitePercent}%
        </span>
      </div>
    </section>
  );
}

function getAdvantageLabel(advantage: Advantage): string {
  if (advantage.leadingDisc === null) {
    return "Even";
  }

  return `${formatDisc(advantage.leadingDisc)} leads`;
}

function formatDisc(disc: "black" | "white"): string {
  return disc === "black" ? "Black" : "White";
}

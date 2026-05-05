const BOARD_PREVIEW_DISCS = new Map<number, "black" | "white">([
  [19, "white"],
  [20, "black"],
  [27, "black"],
  [28, "white"],
  [29, "black"],
  [35, "white"],
  [36, "black"],
  [37, "white"],
  [44, "black"],
]);

export function StartHero() {
  return (
    <div className="start-screen__hero">
      <div className="start-screen__header">
        <p className="start-screen__eyebrow">やさしく学べるオセロ</p>
        <h1 id="start-title">Vibe オセロ</h1>
        <p className="start-screen__lead">
          相手にいい手をあげない一手を、あそびながら見つけよう
        </p>
      </div>

      <div className="start-screen__board-preview" aria-hidden="true">
        {Array.from({ length: 64 }, (_, index) => {
          const disc = BOARD_PREVIEW_DISCS.get(index);

          return (
            <span className="start-screen__board-cell" key={index}>
              {disc ? (
                <span
                  className={[
                    "start-screen__disc",
                    `start-screen__disc--${disc}`,
                  ].join(" ")}
                />
              ) : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}

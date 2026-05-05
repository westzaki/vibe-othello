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
        <span className="start-screen__disc start-screen__disc--black" />
        <span className="start-screen__disc start-screen__disc--white" />
        <span className="start-screen__disc start-screen__disc--white" />
        <span className="start-screen__disc start-screen__disc--black" />
      </div>
    </div>
  );
}

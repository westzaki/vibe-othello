import { getInitialGameMode, getInitialHumanDisc } from "./game/matchSetup";
import { useAppSettings } from "./hooks/useAppSettings";
import { useAppFlow } from "./hooks/useAppFlow";
import { GameScreen } from "./screens/GameScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { StartScreen } from "./screens/StartScreen";

export default function App() {
  const { settings, updateSoundEnabled } = useAppSettings();
  const appFlow = useAppFlow({ soundEnabled: settings.soundEnabled });
  const { game, practiceGame, reviewMoveNumber, screen } = appFlow;

  return (
    <main className="app">
      {screen === "start" ? (
        <StartScreen
          initialCpuLevel={game.players.white.cpuLevel}
          initialHumanDisc={getInitialHumanDisc(game.players)}
          initialMode={getInitialGameMode(game.players)}
          onOpenSettings={appFlow.openSettings}
          onStart={appFlow.startMatch}
        />
      ) : screen === "settings" ? (
        <SettingsScreen
          onBackToStart={appFlow.backToStart}
          onSoundEnabledChange={updateSoundEnabled}
          settings={settings}
        />
      ) : screen === "review" ? (
        <ReviewScreen
          currentMoveNumber={reviewMoveNumber ?? game.moveHistory.length}
          game={game}
          onBackToResult={appFlow.backToResult}
          onBackToStart={appFlow.backToStart}
          onMoveNumberChange={appFlow.selectReviewMove}
          onStartPractice={appFlow.startPractice}
        />
      ) : screen === "practice" ? (
        <GameScreen
          game={practiceGame}
          mode="practice"
          onBackToReview={appFlow.backToReview}
          onBackToStart={appFlow.backToStart}
          onEndGame={practiceGame.endGame}
          onOpenReview={appFlow.backToReview}
          onPlayAgain={appFlow.practicePlayAgain}
        />
      ) : (
        <GameScreen
          game={game}
          onBackToStart={appFlow.backToStart}
          onEndGame={appFlow.endGame}
          onOpenReview={appFlow.openReview}
          onPlayAgain={appFlow.playAgain}
        />
      )}
    </main>
  );
}

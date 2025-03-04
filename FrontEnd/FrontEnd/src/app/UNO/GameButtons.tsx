'use client';

interface GameButtonsProps {
  gameState: any;
  sendMessage: (message: any) => void;
}

export default function GameButtons({ gameState, sendMessage }: GameButtonsProps) {
  const drawCard = () => {
    sendMessage({ type: "DRAW_CARD", playerId: gameState.currentTurn });
  };

  const passTurn = () => {
    sendMessage({ type: "PASS_TURN", playerId: gameState.currentTurn });
  };

  return (
    <div className="mt-4 flex gap-4">
      <button
        onClick={drawCard}
        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
      >
        Robar Carta
      </button>
      <button
        onClick={passTurn}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
      >
        Pasar Turno
      </button>
    </div>
  );
}

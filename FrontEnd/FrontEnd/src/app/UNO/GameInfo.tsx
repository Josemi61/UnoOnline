'use client';

interface GameInfoProps {
  gameState: any;
}

export default function GameInfo({ gameState }: GameInfoProps) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white w-full max-w-md text-center">
      <h2 className="text-xl font-bold">Información del Juego</h2>
      <p className="mt-2">Turno actual: <span className="font-bold">{gameState.currentTurn}</span></p>
      <p className="mt-2">Cartas en el mazo: <span className="font-bold">{gameState.deckSize}</span></p>
      <h3 className="text-lg mt-4">Jugadores:</h3>
      <ul className="mt-2">
        {gameState.players &&
          Object.entries(gameState.players).map(([playerId, player]: any) => (
            <li key={playerId} className={player.isTurn ? "text-green-400 font-bold" : ""}>
              {player.name} ({player.hand.length} cartas)
            </li>
          ))}
      </ul>
    </div>
  );
}

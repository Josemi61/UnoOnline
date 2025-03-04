interface GameStatsProps {
  stats: {
    connectedPlayers: number
    activeGames: number
    playersInGames: number
  }
}

export default function GameStats({ stats }: GameStatsProps) {
  return (
    <div className="mt-8 bg-white/10 p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Estadísticas de Juego</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-300">Jugadores Conectados</p>
          <p className="text-2xl font-bold">{stats.connectedPlayers}</p>
        </div>
        <div>
          <p className="text-sm text-gray-300">Partidas Activas</p>
          <p className="text-2xl font-bold">{stats.activeGames}</p>
        </div>
        <div>
          <p className="text-sm text-gray-300">Jugadores en Partidas</p>
          <p className="text-2xl font-bold">{stats.playersInGames}</p>
        </div>
      </div>
    </div>
  )
}


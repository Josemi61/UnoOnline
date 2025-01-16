export default function GameButtons() {
  return (
    <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
      <button className="game-card bg-red-600 hover:bg-red-700 transform hover:scale-105 transition-transform">
        <div className="card-content">
          <span className="text-xl font-bold">PLAY</span>
          <span className="text-lg">ONLINE</span>
        </div>
      </button>
      <button className="game-card bg-blue-500 hover:bg-blue-600 transform hover:scale-105 transition-transform">
        <div className="card-content">
          <span className="text-xl font-bold">PLAY</span>
          <span className="text-lg">LOCAL</span>
        </div>
      </button>
    </div>
  )
}


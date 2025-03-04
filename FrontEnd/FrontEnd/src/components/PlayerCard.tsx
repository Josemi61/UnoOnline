import Image from "next/image"

interface PlayerCardProps {
  player: {
    apodo: string
    avatar: string
  }
  isHost: boolean
}

export default function PlayerCard({ player, isHost }: PlayerCardProps) {
  return (
    <div className="w-64 h-64 bg-white/10 p-4 rounded-lg flex flex-col items-center">
      <div className="relative w-48 h-48 mx-auto mb-4">
      <Image
            src={player.avatar}
            alt={`Avatar de ${player.apodo}`}
            width={80}
            height={80}
            className="rounded-full"
            unoptimized
          />
        {isHost && (
          <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Anfitrión
          </div>
        )}
      </div>
      <h2 className="text-xl font-bold text-center">{player.apodo}</h2>
    </div>
  )
}
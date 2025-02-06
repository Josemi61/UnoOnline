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
    <div className="bg-white rounded-lg p-4 w-64">
      <div className="relative w-48 h-48 mx-auto mb-4">
        <Image
          src={player.avatar || "/placeholder.svg"}
          alt={`Avatar de ${player.apodo}`}
          layout="fill"
          objectFit="cover"
          className="rounded-full"
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


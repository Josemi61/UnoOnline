interface ActionButtonsProps {
  onPlayBot: () => void
  onPlayRandom: () => void
  onInviteFriend: () => void
}

export default function ActionButtons({ onPlayBot, onPlayRandom, onInviteFriend }: ActionButtonsProps) {
  return (
    <div className="flex justify-center space-x-4">
      <button onClick={onPlayBot} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
        Jugar contra Bot
      </button>
      <button onClick={onPlayRandom} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
        Oponente Aleatorio
      </button>
      <button
        onClick={onInviteFriend}
        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
      >
        Invitar Amigo
      </button>
    </div>
  )
}


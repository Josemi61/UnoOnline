interface WaitingRoomProps {
  onCancel: () => void
}

export default function WaitingRoom({ onCancel }: WaitingRoomProps) {
  return (
    <div className="text-center">
      <p className="text-white text-xl mb-4">Buscando oponente...</p>
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
      <button onClick={onCancel} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
        Cancelar Búsqueda
      </button>
    </div>
  )
}


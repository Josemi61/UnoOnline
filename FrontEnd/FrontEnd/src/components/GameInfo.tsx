export default function GameInfo() {
  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-6 text-red-600">UnoOnline</h1>
        <p className="text-xl text-center mb-8">
          ¡Disfruta del clásico juego de cartas Uno en línea con amigos o desconocidos!
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md border border-[#1e6fbf]">
          <h2 className="text-2xl font-semibold mb-4 text-[#1e6fbf]">Reglas Básicas</h2>
          <ul className="list-disc pl-6 space-y-2 text-[#1e6fbf]">
            <li>Cada jugador comienza con 7 cartas.</li>
            <li>Haz coincidir las cartas por color o número.</li>
            <li>Las cartas especiales tienen efectos únicos.</li>
            <li>Grita "¡UNO!" cuando te quede una sola carta.</li>
            <li>El primer jugador sin cartas gana la ronda.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}


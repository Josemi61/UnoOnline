import Link from 'next/link'

export default function BasicRules() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Reglas Básicas del UNO</h1>
        <div className="bg-white/10 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Objetivo del Juego</h2>
          <p className="mb-4">Ser el primer jugador en quedarse sin cartas en la mano.</p>
          
          <h2 className="text-2xl font-semibold mb-4">Reglas Principales</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Cada jugador comienza con 7 cartas.</li>
            <li>El juego comienza con una carta boca arriba en el centro.</li>
            <li>Los jugadores deben jugar una carta que coincida en color, número o símbolo con la carta del centro.</li>
            <li>Si no puedes jugar, debes robar una carta del mazo.</li>
            <li>Cuando te quede una sola carta, debes gritar "¡UNO!"</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-6 mb-4">Cartas Especiales</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Reversa:</strong> Cambia la dirección del juego.</li>
            <li><strong>Saltar:</strong> El siguiente jugador pierde su turno.</li>
            <li><strong>+2:</strong> El siguiente jugador debe robar 2 cartas y pierde su turno.</li>
            <li><strong>Comodín:</strong> Cambia el color del juego.</li>
            <li><strong>Comodín +4:</strong> Cambia el color y el siguiente jugador roba 4 cartas.</li>
          </ul>
        </div>
        <div className="mt-8 text-center">
          <Link href="/" className="inline-block px-6 py-3 bg-yellow-500 text-black font-bold rounded-full hover:bg-yellow-400 transition-colors">
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

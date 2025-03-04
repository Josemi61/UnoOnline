import Image from 'next/image'

export default function Hero() {
  return (
    <div className="relative flex justify-center items-center py-12">
      <div className="absolute inset-0 flex justify-center items-center">
        <div className="w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
      </div>
      <h1 className="relative text-8xl font-extrabold text-yellow-400 tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
        UNO
        <span className="absolute -bottom-4 left-0 text-4xl text-white">ONLINE</span>
      </h1>
    </div>
  )
}


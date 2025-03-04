import Header from '../components/Header'
import Hero from '../components/Hero'
import GameButtons from '../components/GameButtons'
import BasicRules from '../components/BasicRules'
import { AuthProvider } from "../context/Authprovider";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Hero />
        <div className="text-center my-8">
          <h2 className="text-white text-3xl mb-4 font-bold tracking-wider">
            Are you ready to play?
          </h2>
        </div>
        <GameButtons />
        <BasicRules />
      </main>
    </div>
  )
}



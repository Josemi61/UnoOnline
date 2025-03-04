import Header from '../components/Header'
import Hero from '../components/Hero'
import BasicRules from '../components/BasicRules'
import { AuthProvider } from "../context/Authprovider";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 flex items-center justify-center relative">
      <Header />
      <BasicRules className="absolute top-4 right-4" />
      <main className="container mx-auto px-4 py-8 max-w-screen-md scale-110 text-center">
        <Hero />
        <div className="my-8">
          <h2 className="text-white text-4xl mb-6 font-bold tracking-wider">
            Are you ready to play?
          </h2>
        </div>
      </main>
    </div>
  )
}

import Link from 'next/link'

export default function BasicRules() {
  return (
    <div className="fixed top-4 right-4">
      <Link href="/basic-rules" className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-bold tracking-wider text-sm">
        BASIC RULES
      </Link>
    </div>
  )
}


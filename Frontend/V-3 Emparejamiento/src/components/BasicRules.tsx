import Link from 'next/link'

export default function BasicRules() {
  return (
<div className="absolute top-8 right-4">
  <Link
    href="/basic-rules"
    className="px-8 py-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-bold tracking-wider text-2xl"
  >
    BASIC RULES
  </Link>
</div>

  )
}
import { StatusCard } from '@/features/health/components/StatusCard'

export const metadata = {
  title: 'System Status — SafeX',
  description: 'Live backend & database healthcheck'
}

export default function StatusPage() {
  return (
    <div className="max-w-4xl mx-auto py-4">
      <StatusCard />
    </div>
  )
}

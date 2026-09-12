import { StatusCard } from '@/features/health'
import { BackToDashboard } from '@/components/BackToDashboard'

export const metadata = {
  title: 'System Status — SafeX',
  description: 'Live backend & database healthcheck'
}

export default function StatusPage() {
  return (
    <div className="max-w-4xl mx-auto py-4 space-y-4">
      <BackToDashboard />
      <StatusCard />
    </div>
  )
}

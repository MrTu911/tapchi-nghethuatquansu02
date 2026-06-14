
import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type StatCardVariant = 'default' | 'destructive' | 'warning' | 'success'

const variantCardClass: Record<StatCardVariant, string> = {
  default: '',
  destructive: 'border-red-500 bg-red-50/30',
  warning: 'border-yellow-500 bg-yellow-50/30',
  success: 'border-green-500 bg-green-50/30',
}

const variantIconClass: Record<StatCardVariant, string> = {
  default: 'text-muted-foreground',
  destructive: 'text-red-500',
  warning: 'text-yellow-500',
  success: 'text-green-500',
}

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  variant?: StatCardVariant
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'default',
  trend
}: StatCardProps) {
  return (
    <Card className={variantCardClass[variant]}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${variantIconClass[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="mt-2 flex items-center text-xs">
            <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">so với tháng trước</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

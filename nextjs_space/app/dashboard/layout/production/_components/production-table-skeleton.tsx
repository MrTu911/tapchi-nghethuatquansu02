import { Skeleton } from '@/components/ui/skeleton'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'

export function ProductionTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell>
            <Skeleton className="h-4 w-64 mb-1" />
            <Skeleton className="h-3 w-32" />
          </TableCell>
          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-6 w-12 rounded-full" /></TableCell>
          <TableCell>
            <div className="flex gap-2 justify-end">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )
}

/**
 * TableScrollWrapper — responsive container for data tables.
 *
 * Wraps any <table> (or shadcn Table) so it scrolls horizontally on narrow
 * viewports (tablet/mobile) while maintaining the card border on desktop.
 * Consolidates three ad-hoc patterns found across dashboard pages:
 *   - <div className="overflow-x-auto">
 *   - <div className="rounded-md border">
 *   - <div className="rounded-md border overflow-x-auto">
 *
 * Usage:
 *   <TableScrollWrapper>
 *     <Table>...</Table>
 *   </TableScrollWrapper>
 *
 * Safe to use even when pagination or other content follows inside the same
 * container — does NOT clip vertical overflow.
 */

interface TableScrollWrapperProps {
  children: React.ReactNode
  /** Extra Tailwind classes applied to the outer container */
  className?: string
}

export function TableScrollWrapper({ children, className = '' }: TableScrollWrapperProps) {
  return (
    <div
      className={[
        // Horizontal scroll on narrow viewports instead of clipping columns
        'overflow-x-auto',
        // Consistent card border matching shadcn Table styling
        'rounded-md border',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

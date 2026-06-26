import { Fragment } from 'react'
import { Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

function BreadcrumbNav({ compact = false, items = [], className }) {
  return (
    <nav
      className={cn(
        'flex min-w-0 items-center text-sm font-medium text-muted-foreground',
        compact ? 'gap-1 text-[13px]' : 'gap-1.5',
        className,
      )}
      aria-label="Workspace breadcrumb"
    >
      {items.map((item, index) => {
        const isFirst = index === 0
        const isLast = index === items.length - 1

        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <span
                className={cn(
                  'text-base leading-none text-muted-foreground/55',
                  compact && 'text-[17px] text-muted-foreground/50',
                )}
                aria-hidden="true"
              >
                /
              </span>
            )}
            {item.path && !isLast ? (
              <Link
                className={cn(
                  'flex min-w-0 items-center gap-1 rounded-md py-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  compact ? 'px-1' : 'px-1.5',
                )}
                to={item.path}
              >
                {isFirst ? (
                  <>
                    <Home
                      className={cn(compact ? 'size-3.5' : 'size-4')}
                      aria-hidden="true"
                    />
                    <span className="sr-only">{item.label}</span>
                  </>
                ) : (
                  <span className="translate-y-px truncate">{item.label}</span>
                )}
              </Link>
            ) : (
              <span
                className={cn(
                  'flex min-w-0 items-center truncate py-1',
                  compact ? 'px-1 font-medium' : 'px-1.5',
                  isLast && 'text-foreground',
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {isFirst ? (
                  <>
                    <Home
                      className={cn(compact ? 'size-3.5' : 'size-4')}
                      aria-hidden="true"
                    />
                    <span className="sr-only">{item.label}</span>
                  </>
                ) : (
                  <span className="translate-y-px truncate">{item.label}</span>
                )}
              </span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}

export default BreadcrumbNav

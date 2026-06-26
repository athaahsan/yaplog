import { PanelLeftOpen } from 'lucide-react'
import { PanelLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import BreadcrumbNav from './BreadcrumbNav'

function MobileHeader({ breadcrumbs, sidebarOpen, onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-30 hidden min-h-14 items-center gap-2 overflow-hidden border-b border-sidebar-border bg-background px-3.5 max-[720px]:flex">
      <Button
        className="size-9 rounded-lg text-foreground"
        variant="ghost"
        size="icon"
        type="button"
        aria-label="Open sidebar"
        aria-expanded={sidebarOpen}
        onClick={onOpenSidebar}
      >
        <PanelLeft className="size-4.5" />
      </Button>
      <BreadcrumbNav
        compact
        className="flex-1 overflow-hidden"
        items={breadcrumbs}
      />
    </header>
  )
}

export default MobileHeader

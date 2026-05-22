import { BookOpenText, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

function MobileHeader({ sidebarOpen, onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-30 hidden min-h-14 items-center gap-2.5 overflow-hidden border-b border-sidebar-border bg-background px-3.5 max-[720px]:flex">
      <Button
        className="size-9 rounded-lg text-foreground"
        variant="ghost"
        size="icon"
        type="button"
        aria-label="Open sidebar"
        aria-expanded={sidebarOpen}
        onClick={onOpenSidebar}
      >
        <PanelLeft size={20} />
      </Button>
      <div className="flex items-center text-base font-semibold">
        <div
          className="grid size-[34px] place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground max-[720px]:hidden"
          aria-hidden="true"
        >
          <BookOpenText size={18} strokeWidth={2.2} />
        </div>
        <span className='underline decoration-double'>YapLog</span>
      </div>
    </header>
  )
}

export default MobileHeader

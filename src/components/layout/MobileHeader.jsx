import { BookOpenText, PanelLeft } from 'lucide-react'

function MobileHeader({ sidebarOpen, onOpenSidebar }) {
  return (
    <header className="mobile-header">
      <button
        className="mobile-sidebar-toggle"
        type="button"
        aria-label="Open sidebar"
        aria-expanded={sidebarOpen}
        onClick={onOpenSidebar}
      >
        <PanelLeft size={20} />
      </button>
      <div className="mobile-brand">
        <div className="brand-mark" aria-hidden="true">
          <BookOpenText size={18} strokeWidth={2.2} />
        </div>
        <span>YapLog</span>
      </div>
    </header>
  )
}

export default MobileHeader

import BreadcrumbNav from './layout/BreadcrumbNav'
import MobileHeader from './layout/MobileHeader'
import Sidebar from './layout/Sidebar'

function AppShell({
  activeApp,
  authLoading,
  authProfile,
  breadcrumbs,
  children,
  onCloseSidebar,
  onOpenSidebar,
  onProfile,
  onSelectApp,
  onSettings,
  onSignIn,
  onSignOut,
  sidebarOpen,
}) {
  return (
    <main className="grid h-dvh grid-cols-[264px_1fr] overflow-hidden bg-background text-foreground max-[720px]:block max-[720px]:min-h-dvh max-[720px]:w-full max-[720px]:max-w-full max-[720px]:overflow-x-hidden max-[720px]:overflow-y-hidden">
      <MobileHeader
        breadcrumbs={breadcrumbs}
        sidebarOpen={sidebarOpen}
        onOpenSidebar={onOpenSidebar}
      />

      {sidebarOpen && (
        <button
          className="hidden max-[720px]:fixed max-[720px]:inset-0 max-[720px]:z-40 max-[720px]:block max-[720px]:border-0 max-[720px]:bg-black/35"
          type="button"
          aria-label="Close sidebar"
          onClick={onCloseSidebar}
        />
      )}

      <Sidebar
        activeApp={activeApp}
        authLoading={authLoading}
        authProfile={authProfile}
        onCloseSidebar={onCloseSidebar}
        onProfile={onProfile}
        onSelectApp={onSelectApp}
        onSettings={onSettings}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex h-dvh min-w-0 flex-col overflow-hidden max-[720px]:h-[calc(100dvh-56px)] max-[720px]:w-full max-[720px]:max-w-dvw">
        <header className="flex min-h-14 items-center border-b border-border bg-background px-7 max-[720px]:hidden">
          <BreadcrumbNav items={breadcrumbs} />
        </header>

        <section
          className="min-h-0 flex-1 overflow-hidden p-7 max-[720px]:h-full max-[720px]:w-full max-[720px]:max-w-dvw max-[720px]:p-7 max-[720px]:[contain:layout_paint]"
          aria-label="YapLog workspace"
        >
          {children}
        </section>
      </div>
    </main>
  )
}

export default AppShell

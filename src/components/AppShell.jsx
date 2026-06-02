import MobileHeader from './layout/MobileHeader'
import Sidebar from './layout/Sidebar'

function AppShell({
  activeApp,
  authLoading,
  authProfile,
  children,
  font,
  onCloseSidebar,
  onExportData,
  onFontChange,
  onImportData,
  onOpenSidebar,
  onProfile,
  onSelectApp,
  onSignIn,
  onSignOut,
  onThemeChange,
  sidebarOpen,
  theme,
}) {
  return (
    <main className="grid h-dvh grid-cols-[264px_1fr] overflow-hidden bg-background text-foreground max-[720px]:block max-[720px]:min-h-dvh max-[720px]:w-full max-[720px]:max-w-full max-[720px]:overflow-x-hidden max-[720px]:overflow-y-hidden">
      <MobileHeader
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
        font={font}
        onCloseSidebar={onCloseSidebar}
        onExportData={onExportData}
        onImportData={onImportData}
        onFontChange={onFontChange}
        onProfile={onProfile}
        onSelectApp={onSelectApp}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        onThemeChange={onThemeChange}
        sidebarOpen={sidebarOpen}
        theme={theme}
      />

      <section
        className="h-dvh min-w-0 overflow-hidden p-7 max-[720px]:h-[calc(100dvh-56px)] max-[720px]:min-h-0 max-[720px]:w-full max-[720px]:max-w-dvw max-[720px]:overflow-hidden max-[720px]:p-4 max-[720px]:px-3 max-[720px]:[contain:layout_paint]"
        aria-label="YapLog workspace"
      >
        {children}
      </section>
    </main>
  )
}

export default AppShell

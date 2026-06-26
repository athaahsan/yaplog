import { Download, Laptop, Moon, Sun, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
]

const fontOptions = [
  {
    value: 'default',
    label: 'Default',
    fontFamily: "'Geist Variable', sans-serif",
  },
  {
    value: 'serif',
    label: 'Serif',
    fontFamily: "'Lora', serif",
  },
  {
    value: 'mono',
    label: 'Mono',
    fontFamily: "'Space Mono', monospace",
  },
]

function SettingsDialog({
  font,
  onClose,
  onExportData,
  onFontChange,
  onImportData,
  onThemeChange,
  theme,
}) {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-background/70 px-4 backdrop-blur-sm animate-in fade-in-0 duration-150"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        aria-labelledby="settings-dialog-title"
        aria-modal="true"
        className="w-full max-w-[440px] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-[0_18px_48px_oklch(0_0_0/22%)] animate-in zoom-in-95 duration-150"
        role="dialog"
      >
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2
              className="text-lg font-semibold leading-tight text-foreground"
              id="settings-dialog-title"
            >
              Settings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Appearance and data controls.
            </p>
          </div>
          <Button
            className="size-9 rounded-lg text-muted-foreground"
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Close settings"
            onClick={onClose}
          >
            <X size={17} />
          </Button>
        </header>

        <div className="mt-5 grid gap-5">
          <section aria-labelledby="appearance-settings-title">
            <h3
              className="text-sm font-semibold text-foreground"
              id="appearance-settings-title"
            >
              Appearance
            </h3>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const active = theme === option.value

                return (
                  <Button
                    className={cn(
                      'h-10 justify-center gap-2 rounded-lg border border-border bg-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                      active && 'bg-muted text-foreground',
                    )}
                    variant="ghost"
                    type="button"
                    aria-pressed={active}
                    key={option.value}
                    onClick={() => onThemeChange(option.value)}
                  >
                    <Icon size={15} />
                    <span>{option.label}</span>
                  </Button>
                )
              })}
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              {fontOptions.map((option) => {
                const active = font === option.value

                return (
                  <Button
                    className={cn(
                      'grid h-20 gap-1 rounded-lg border border-border bg-transparent px-2 py-3 text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                      active && 'bg-muted text-foreground',
                    )}
                    variant="ghost"
                    type="button"
                    aria-label={`Use ${option.label.toLowerCase()} font`}
                    aria-pressed={active}
                    key={option.value}
                    onClick={() => onFontChange(option.value)}
                    style={{ fontFamily: option.fontFamily }}
                  >
                    <span className="text-[26px] font-semibold leading-none">
                      Ag
                    </span>
                    <span className="text-xs font-semibold leading-none">
                      {option.label}
                    </span>
                  </Button>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="data-settings-title">
            <h3
              className="text-sm font-semibold text-foreground"
              id="data-settings-title"
            >
              Data
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button
                className="justify-start gap-2 rounded-lg"
                variant="secondary"
                type="button"
                onClick={onExportData}
              >
                <Download size={16} />
                <span>Export data</span>
              </Button>
              <Button
                className="justify-start gap-2 rounded-lg"
                variant="secondary"
                type="button"
                onClick={onImportData}
              >
                <Upload size={16} />
                <span>Import data</span>
              </Button>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

export default SettingsDialog

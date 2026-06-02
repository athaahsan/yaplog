import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

function JournalLeaveDialog({ onCancel, onDiscard, onSave }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-4 backdrop-blur-sm animate-in fade-in-0 duration-150"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel()
        }
      }}
    >
      <section
        aria-labelledby="unsaved-entry-title"
        aria-describedby="unsaved-entry-description"
        aria-modal="true"
        className="w-full max-w-[380px] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-[0_18px_48px_oklch(0_0_0/22%)] animate-in zoom-in-95 duration-150"
        role="dialog"
      >
        <div className="mb-4">
          <h2
            className="mb-1.5 text-base font-semibold leading-tight"
            id="unsaved-entry-title"
          >
            Unsaved changes
          </h2>
          <p
            className="text-sm leading-6 text-muted-foreground"
            id="unsaved-entry-description"
          >
            This entry has changes that have not been saved yet.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            type="button"
            onClick={onDiscard}
          >
            Discard
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={onCancel}
          >
            Keep editing
          </Button>
          <Button type="button" onClick={onSave}>
            <Save size={16} />
            <span>Save</span>
          </Button>
        </div>
      </section>
    </div>
  )
}

export default JournalLeaveDialog

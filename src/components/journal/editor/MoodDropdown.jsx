import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const moodNameMap = {
  'ðŸ˜Š': 'happy',
  'ðŸ˜': 'neutral',
  'ðŸ˜”': 'sad',
  'ðŸ«©': 'done',
  'ðŸ˜°': 'anxious',
  'ðŸ˜¡': 'angry',
}

const moodToneClassNames = {
  angry:
    'bg-[color-mix(in_oklch,oklch(0.66_0.19_35)_18%,transparent)] shadow-[0_0_12px_oklch(0.66_0.19_35/15%),inset_0_0_0_1px_oklch(0.66_0.19_35/40%)]',
  anxious:
    'bg-[color-mix(in_oklch,oklch(0.72_0.14_205)_18%,transparent)] shadow-[0_0_12px_oklch(0.72_0.14_205/15%),inset_0_0_0_1px_oklch(0.72_0.14_205/40%)]',
  done:
    'bg-[color-mix(in_oklch,oklch(0.64_0.11_305)_18%,transparent)] shadow-[0_0_12px_oklch(0.64_0.11_305/15%),inset_0_0_0_1px_oklch(0.64_0.11_305/40%)]',
  happy:
    'bg-[color-mix(in_oklch,oklch(0.82_0.12_125)_16%,transparent)] shadow-[0_0_12px_oklch(0.82_0.12_125/15%),inset_0_0_0_1px_oklch(0.82_0.12_125/40%)]',
  neutral:
    'bg-[color-mix(in_oklch,oklch(0.7_0.02_255)_18%,transparent)] shadow-[0_0_12px_oklch(0.7_0.02_255/12%),inset_0_0_0_1px_oklch(0.7_0.02_255/38%)]',
  sad:
    'bg-[color-mix(in_oklch,oklch(0.68_0.13_265)_18%,transparent)] shadow-[0_0_12px_oklch(0.68_0.13_265/15%),inset_0_0_0_1px_oklch(0.68_0.13_265/40%)]',
}

function MoodDropdown({ moodOptions, value, onChange }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div className="relative z-30 flex w-fit items-center">
      <div className="relative" ref={menuRef}>
        <Button
          className="h-8 gap-1.5 rounded-lg border border-border bg-muted/20 px-2 text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
          variant="ghost"
          size="sm"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Choose entry mood"
          title="Mood"
          onClick={() => setOpen((currentOpen) => !currentOpen)}
        >
          <span className="text-lg leading-none">{value}</span>
          <ChevronDown className="size-3.5 opacity-70" />
        </Button>

        {open && (
          <div
            className="absolute left-0 top-[calc(100%+6px)] z-40 flex items-center gap-1 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_12px_32px_oklch(0_0_0/12%)]"
            role="listbox"
            aria-label="Entry mood"
          >
            {moodOptions.map((mood) => {
              const moodName = moodNameMap[mood] || 'default'
              const active = value === mood

              return (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={cn(
                    'size-[34px] rounded-lg bg-transparent transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.08] hover:bg-transparent',
                    active && moodToneClassNames[moodName],
                  )}
                  type="button"
                  aria-label={`${moodName} mood`}
                  aria-selected={active}
                  role="option"
                  key={mood}
                  onClick={() => {
                    onChange(mood)
                    setOpen(false)
                  }}
                  title={moodName.charAt(0).toUpperCase() + moodName.slice(1)}
                >
                  <span
                    className={cn(
                      'inline-block text-lg contrast-105 grayscale-[15%] transition-transform',
                      active && 'scale-110 grayscale-0 contrast-125',
                    )}
                  >
                    {mood}
                  </span>
                </Button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MoodDropdown

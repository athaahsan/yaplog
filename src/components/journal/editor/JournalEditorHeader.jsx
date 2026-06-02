import { ArrowLeft, Save, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function JournalEditorHeader({
  favorite,
  onBack,
  onSave,
  onToggleFavorite,
}) {
  return (
    <header className="mb-[30px] flex items-center justify-between max-md:mb-[22px]">
      <Button
        variant="ghost"
        type="button"
        className="h-9 rounded-lg px-2.5 text-muted-foreground hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        <span>Back</span>
      </Button>

      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          aria-pressed={favorite}
          className={cn(
            'size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground',
            favorite && 'text-foreground',
          )}
          onClick={onToggleFavorite}
          title={favorite ? 'Unfavorite entry' : 'Favorite entry'}
        >
          <Star
            size={18}
            className={cn(
              'fill-transparent transition-transform',
              favorite && 'fill-current',
            )}
          />
        </Button>

        <Button
          className="h-9 rounded-lg px-3.5 font-semibold"
          type="button"
          onClick={onSave}
        >
          <Save size={16} />
          <span>Save</span>
        </Button>
      </div>
    </header>
  )
}

export default JournalEditorHeader

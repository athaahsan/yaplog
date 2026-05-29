import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function ProfileAvatar({ profile }) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState('')
  const displayInitial = profile.userName?.trim().charAt(0).toUpperCase() || 'Y'

  return (
    <span
      className="mx-auto grid size-24 place-items-center overflow-hidden rounded-full bg-secondary text-3xl font-bold text-secondary-foreground"
      aria-hidden="true"
    >
      {profile.avatarUrl && failedAvatarUrl !== profile.avatarUrl ? (
        <img
          className="size-full object-cover"
          src={profile.avatarUrl}
          alt=""
          onError={() => setFailedAvatarUrl(profile.avatarUrl)}
        />
      ) : (
        displayInitial
      )}
    </span>
  )
}

function ProfileDialog({ profile, onClose, onSave }) {
  const [displayName, setDisplayName] = useState(profile.userName || '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setSaving(true)

    try {
      await onSave({
        ...profile,
        userName: displayName.trim() || profile.userEmail?.split('@')[0] || '',
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-dialog-title"
      onClick={onClose}
    >
      <form
        className="w-full max-w-[420px] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-start gap-3">
          <h2
            className="min-w-0 flex-1 text-lg font-semibold text-foreground"
            id="profile-dialog-title"
          >
            Edit profile
          </h2>
          <Button
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Close profile dialog"
            onClick={onClose}
          >
            <X size={16} />
          </Button>
        </div>

        <div className="mt-6">
          <ProfileAvatar profile={{ ...profile, userName: displayName }} />
        </div>

        <div className="mt-6 grid gap-3">
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            Display name
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
              disabled={saving}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-foreground">
            Email
            <Input
              value={profile.userEmail || ''}
              readOnly
              aria-readonly="true"
              className="text-muted-foreground"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ProfileDialog

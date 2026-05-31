import { useEffect, useRef, useState } from 'react'
import { Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const AVATAR_INPUT_MAX_BYTES = 10 * 1024 * 1024
const AVATAR_SIZE = 512
const AVATAR_QUALITY = 0.9
const CROP_FRAME_SIZE = 260

function getAvatarInitial(name) {
  return name?.trim().charAt(0).toUpperCase() || 'Y'
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => resolve({ image, url })
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image.'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error('Could not prepare that avatar.'))
      },
      'image/webp',
      AVATAR_QUALITY,
    )
  })
}

function getCropImageSize(image, zoom) {
  const coverScale =
    Math.max(
      CROP_FRAME_SIZE / image.naturalWidth,
      CROP_FRAME_SIZE / image.naturalHeight,
    ) * zoom

  return {
    coverScale,
    height: image.naturalHeight * coverScale,
    width: image.naturalWidth * coverScale,
  }
}

function clampPan(image, zoom, pan) {
  const imageSize = getCropImageSize(image, zoom)
  const maxX = Math.max(0, (imageSize.width - CROP_FRAME_SIZE) / 2)
  const maxY = Math.max(0, (imageSize.height - CROP_FRAME_SIZE) / 2)

  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  }
}

async function createAvatarBlob({ image, pan, zoom }) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Image editing is not available in this browser.')
  }

  const { coverScale } = getCropImageSize(image, zoom)
  const sourceSize = CROP_FRAME_SIZE / coverScale
  const sourceX = Math.min(
    image.naturalWidth - sourceSize,
    Math.max(0, (image.naturalWidth - sourceSize) / 2 - pan.x / coverScale),
  )
  const sourceY = Math.min(
    image.naturalHeight - sourceSize,
    Math.max(0, (image.naturalHeight - sourceSize) / 2 - pan.y / coverScale),
  )

  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  )

  return canvasToBlob(canvas)
}

function ProfileAvatar({ avatarUrl, displayName, onSelectFile, saving }) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState('')
  const displayInitial = getAvatarInitial(displayName)

  return (
    <button
      className="group relative mx-auto block size-24 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      disabled={saving}
      aria-label="Choose avatar"
      onClick={onSelectFile}
    >
      <span
        className="grid size-24 place-items-center overflow-hidden rounded-full bg-secondary text-3xl font-bold text-secondary-foreground transition group-hover:brightness-95"
        aria-hidden="true"
      >
        {avatarUrl && failedAvatarUrl !== avatarUrl ? (
          <img
            className="size-full object-cover"
            src={avatarUrl}
            alt=""
            onError={() => setFailedAvatarUrl(avatarUrl)}
          />
        ) : (
          displayInitial
        )}
      </span>
      <span
        className="absolute bottom-0 right-0 grid size-9 place-items-center rounded-full border border-border bg-popover text-popover-foreground shadow-lg transition group-hover:bg-muted"
        aria-hidden="true"
      >
        <Pencil size={15} />
      </span>
    </button>
  )
}

function ProfileDialog({ profile, onClose, onSave }) {
  const [displayName, setDisplayName] = useState(profile.userName || '')
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(profile.avatarUrl)
  const [avatarBlob, setAvatarBlob] = useState(null)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isEditingAvatar, setIsEditingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const dragStateRef = useRef(null)
  const fileInputRef = useRef(null)
  const cropImageSize = selectedImage
    ? getCropImageSize(selectedImage, zoom)
    : null

  useEffect(() => {
    return () => {
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl)
      }

      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl)
      }
    }
  }, [croppedPreviewUrl, selectedImageUrl])

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }

    if (file.size > AVATAR_INPUT_MAX_BYTES) {
      setError('Image is too large. Choose an image under 10 MB.')
      return
    }

    try {
      const { image, url } = await loadImage(file)

      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl)
      }

      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl)
      }

      setSelectedImage(image)
      setSelectedImageUrl(url)
      setCroppedPreviewUrl('')
      setAvatarBlob(null)
      setZoom(1)
      setPan({ x: 0, y: 0 })
      setIsEditingAvatar(true)
      setError('')
    } catch (caughtError) {
      setError(caughtError.message || 'Could not load that image.')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      await onSave({
        ...profile,
        avatarBlob,
        userName: displayName.trim() || profile.userEmail?.split('@')[0] || '',
      })
      onClose()
    } catch (caughtError) {
      setError(caughtError.message || 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmAvatar() {
    if (!selectedImage) {
      setIsEditingAvatar(false)
      return
    }

    setError('')
    setSaving(true)

    try {
      const nextAvatarBlob = await createAvatarBlob({
        image: selectedImage,
        pan,
        zoom,
      })
      const nextPreviewUrl = URL.createObjectURL(nextAvatarBlob)

      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl)
      }

      setAvatarBlob(nextAvatarBlob)
      setCroppedPreviewUrl(nextPreviewUrl)
      setAvatarPreviewUrl(nextPreviewUrl)
      setIsEditingAvatar(false)
    } catch (caughtError) {
      setError(caughtError.message || 'Could not prepare that avatar.')
    } finally {
      setSaving(false)
    }
  }

  function handleZoomChange(event) {
    const nextZoom = Number(event.target.value)
    setZoom(nextZoom)
    setPan((currentPan) =>
      selectedImage ? clampPan(selectedImage, nextZoom, currentPan) : currentPan,
    )
  }

  function handleCropPointerDown(event) {
    if (!selectedImage || saving) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    dragStateRef.current = {
      pointerId: event.pointerId,
      startPan: pan,
      startX: event.clientX,
      startY: event.clientY,
    }
  }

  function handleCropPointerMove(event) {
    const dragState = dragStateRef.current

    if (!dragState || dragState.pointerId !== event.pointerId || !selectedImage) {
      return
    }

    setPan(
      clampPan(selectedImage, zoom, {
        x: dragState.startPan.x + event.clientX - dragState.startX,
        y: dragState.startPan.y + event.clientY - dragState.startY,
      }),
    )
  }

  function handleCropPointerEnd(event) {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null
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
        className="max-h-[calc(100dvh-2rem)] w-full max-w-[420px] overflow-y-auto rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_45%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/35 [&::-webkit-scrollbar-track]:bg-transparent"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-start gap-3">
          <h2
            className="min-w-0 flex-1 text-lg font-semibold text-foreground"
            id="profile-dialog-title"
          >
            {isEditingAvatar ? 'Adjust avatar' : 'Edit profile'}
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

        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
        />

        {isEditingAvatar && selectedImage ? (
          <>
            <div className="mt-6 grid gap-4">
              <div
                className="relative mx-auto size-[260px] touch-none overflow-hidden rounded-xl bg-secondary cursor-grab select-none active:cursor-grabbing"
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerEnd}
                onPointerCancel={handleCropPointerEnd}
              >
                <img
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  src={selectedImageUrl}
                  alt=""
                  draggable={false}
                  style={{
                    height: cropImageSize?.height,
                    transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
                    width: cropImageSize?.width,
                  }}
                />
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <span
                      className="border border-white/25"
                      key={index}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <div
                  className="pointer-events-none absolute inset-0 rounded-full border border-white/50 shadow-[0_0_0_999px_rgba(0,0,0,0.38)]"
                  aria-hidden="true"
                />
              </div>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
                Zoom
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  disabled={saving}
                  onChange={handleZoomChange}
                />
              </label>
            </div>

            <div className="mt-3 flex justify-center">
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose another image
              </Button>
            </div>

            {error && (
              <p className="mt-3 rounded-lg border border-destructive/25 bg-destructive/10 p-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => setIsEditingAvatar(false)}
              >
                Back
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={handleConfirmAvatar}
              >
                {saving ? 'Preparing...' : 'Done'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-6">
              <ProfileAvatar
                avatarUrl={avatarPreviewUrl}
                displayName={displayName}
                saving={saving}
                onSelectFile={() => fileInputRef.current?.click()}
              />
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

            {error && (
              <p className="mt-3 rounded-lg border border-destructive/25 bg-destructive/10 p-2 text-sm text-destructive">
                {error}
              </p>
            )}

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
          </>
        )}

      </form>
    </div>
  )
}

export default ProfileDialog

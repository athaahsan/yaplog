import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
  Upload,
  X,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { JOURNAL_BODY_MAX_CHARS } from '@/data/journalConfig'
import { cn } from '@/lib/utils'
import { transcribeVoiceAudio } from '@/lib/voiceTranscription'
import JournalContentAssistant from '../JournalContentAssistant'

const markdownPreviewClassName = cn(
  'flex-none cursor-text text-[17px] leading-[1.65] text-foreground outline-none md:text-[17px]',
  '[&_blockquote]:mb-[0.9em] [&_blockquote]:border-l-[3px] [&_blockquote]:border-border [&_blockquote]:pl-[0.9em] [&_blockquote]:text-muted-foreground',
  '[&_code]:rounded-[5px] [&_code]:bg-muted [&_code]:px-[0.34em] [&_code]:py-[0.12em] [&_code]:text-[0.9em]',
  '[&_h1]:mb-[0.45em] [&_h1]:mt-[1.15em] [&_h1]:text-[1.55em] [&_h1]:leading-[1.2]',
  '[&_h2]:mb-[0.45em] [&_h2]:mt-[1.15em] [&_h2]:text-[1.3em] [&_h2]:leading-[1.2]',
  '[&_h3]:mb-[0.45em] [&_h3]:mt-[1.15em] [&_h3]:text-[1.12em] [&_h3]:leading-[1.2]',
  '[&_ol]:mb-[0.9em] [&_ol]:pl-[1.35em] [&_p]:mb-[0.9em] [&_p]:whitespace-pre-line [&_pre]:mb-[0.9em] [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-[0.9em] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:mb-[0.9em] [&_ul]:mb-[0.9em] [&_ul]:pl-[1.35em]',
  '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
)

const idleWaveLevels = [0.35, 0.55, 0.8, 0.5, 0.7, 0.42, 0.62, 0.48, 0.76]
const audioFileMaxBytes = 19.5 * 1024 * 1024

function formatAudioTime(value) {
  if (!Number.isFinite(value)) {
    return '0:00'
  }

  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function JournalBodyField({
  body,
  initialBodyMode = 'preview',
  onChange,
  scrollContainerRef,
  voiceInputEnabled = false,
  voiceInputUserId = '',
}) {
  const bodyInputRef = useRef(null)
  const pendingScrollTopRef = useRef(null)
  const previewPointerRef = useRef(null)
  const [bodyMode, setBodyMode] = useState(initialBodyMode)
  const [voiceInputOpen, setVoiceInputOpen] = useState(false)
  const isBodyEditing = bodyMode === 'edit'
  const hasBody = Boolean(body.trim())

  const restoreEditorScroll = useCallback((scrollTop) => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) {
      pendingScrollTopRef.current = null
      return undefined
    }

    scrollContainer.scrollTop = scrollTop

    const animationFrameId = window.requestAnimationFrame(() => {
      scrollContainer.scrollTop = scrollTop

      window.requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollTop
        pendingScrollTopRef.current = null
      })
    })

    const timeoutId = window.setTimeout(() => {
      scrollContainer.scrollTop = scrollTop
      pendingScrollTopRef.current = null
    }, 0)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.clearTimeout(timeoutId)
    }
  }, [scrollContainerRef])

  useLayoutEffect(() => {
    const bodyInput = bodyInputRef.current
    const scrollContainer = scrollContainerRef.current

    if (!bodyInput || !isBodyEditing) {
      return
    }

    bodyInput.style.height = 'auto'
    bodyInput.style.height = `${bodyInput.scrollHeight}px`

    if (pendingScrollTopRef.current !== null && scrollContainer) {
      const scrollTop = pendingScrollTopRef.current

      return restoreEditorScroll(scrollTop)
    }
  }, [body, isBodyEditing, restoreEditorScroll, scrollContainerRef])

  useLayoutEffect(() => {
    const scrollTop = pendingScrollTopRef.current
    const scrollContainer = scrollContainerRef.current

    if (scrollTop === null || !scrollContainer) {
      return
    }

    return restoreEditorScroll(scrollTop)
  }, [isBodyEditing, restoreEditorScroll, scrollContainerRef])

  useEffect(() => {
    const bodyInput = bodyInputRef.current

    if (!bodyInput || !isBodyEditing) {
      return
    }

    bodyInput.focus({ preventScroll: true })
  }, [isBodyEditing])

  function startBodyEditing() {
    if (!isBodyEditing) {
      pendingScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? 0
      setBodyMode('edit')
    }
  }

  function rememberEditorScroll({ force = false } = {}) {
    if (pendingScrollTopRef.current !== null && !force) {
      return
    }

    pendingScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? null
  }

  function changeBody(nextBody) {
    onChange(nextBody)
  }

  function updateBody(event) {
    rememberEditorScroll()
    changeBody(event.target.value.slice(0, JOURNAL_BODY_MAX_CHARS))
  }

  function handleBodyKeyDown(event) {
    if (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === 'Enter'
    ) {
      rememberEditorScroll({ force: true })
    }
  }

  function handlePreviewPointerDown(event) {
    previewPointerRef.current = {
      moved: false,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    }
  }

  function handlePreviewPointerMove(event) {
    const pointer = previewPointerRef.current

    if (!pointer || pointer.pointerId !== event.pointerId || pointer.moved) {
      return
    }

    const deltaX = Math.abs(event.clientX - pointer.x)
    const deltaY = Math.abs(event.clientY - pointer.y)

    if (deltaX > 8 || deltaY > 8) {
      pointer.moved = true
    }
  }

  function handlePreviewPointerUp(event) {
    const pointer = previewPointerRef.current
    previewPointerRef.current = null

    if (!pointer || pointer.pointerId !== event.pointerId || pointer.moved) {
      return
    }

    event.preventDefault()
    startBodyEditing()
  }

  function handlePreviewPointerCancel() {
    previewPointerRef.current = null
  }

  function handlePreviewKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      startBodyEditing()
    }
  }

  function appendVoiceTranscript(transcript) {
    const cleanedTranscript = transcript.trim()

    if (!cleanedTranscript) {
      return
    }

    const nextBody = body.trim()
      ? `${body.trimEnd()}\n\n${cleanedTranscript}`
      : cleanedTranscript

    rememberEditorScroll({ force: true })
    changeBody(nextBody.slice(0, JOURNAL_BODY_MAX_CHARS))
    setBodyMode('preview')
  }

  return (
    <>
      <JournalContentAssistant
        onApplyContent={(content) =>
          changeBody(content.slice(0, JOURNAL_BODY_MAX_CHARS))
        }
        body={body}
      >
        {isBodyEditing ? (
          <textarea
            ref={bodyInputRef}
            className="block min-h-[1.65em] w-full flex-none resize-none overflow-hidden bg-transparent text-[17px] leading-[1.65] text-foreground outline-none placeholder:text-muted-foreground max-md:text-base"
            value={body}
            maxLength={JOURNAL_BODY_MAX_CHARS}
            placeholder="Start writing..."
            onBlur={() => setBodyMode('preview')}
            onBeforeInput={() => rememberEditorScroll({ force: true })}
            onChange={updateBody}
            onKeyDown={handleBodyKeyDown}
          />
        ) : (
          <div
            className={cn(
              markdownPreviewClassName,
              'animate-in fade-in-0 slide-in-from-left-1 duration-200 max-md:text-base',
            )}
            role="textbox"
            tabIndex={0}
            aria-label="Journal content"
            onKeyDown={handlePreviewKeyDown}
            onPointerCancel={handlePreviewPointerCancel}
            onPointerDown={handlePreviewPointerDown}
            onPointerMove={handlePreviewPointerMove}
            onPointerUp={handlePreviewPointerUp}
          >
            {hasBody ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            ) : voiceInputEnabled ? (
              <EmptyVoicePlaceholder
                onStartVoiceInput={() => setVoiceInputOpen(true)}
              />
            ) : (
              <p className="m-0 text-muted-foreground">Start writing...</p>
            )}
          </div>
        )}

        {voiceInputEnabled && hasBody && (
          <VoiceAppendControl onStartVoiceInput={() => setVoiceInputOpen(true)} />
        )}
      </JournalContentAssistant>

      {voiceInputEnabled && voiceInputOpen && (
        <VoiceInputDialog
          userId={voiceInputUserId}
          onClose={() => setVoiceInputOpen(false)}
          onTranscript={appendVoiceTranscript}
        />
      )}
    </>
  )
}

function EmptyVoicePlaceholder({ onStartVoiceInput }) {
  return (
    <div className="flex flex-wrap items-start gap-2 text-muted-foreground">
      <span>Start writing or yapping</span>
      <Button
        className="-mt-1 size-8 rounded-lg border border-border bg-muted/35 text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
        variant="ghost"
        size="icon-sm"
        type="button"
        aria-label="Start voice input"
        title="Start voice input"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          onStartVoiceInput()
        }}
      >
        <Mic className="size-4" />
      </Button>
    </div>
  )
}

function VoiceAppendControl({ onStartVoiceInput }) {
  return (
    <div className="mt-4 flex flex-none items-center gap-2 text-sm text-muted-foreground">
      <div className="h-px flex-1 bg-transparent" aria-hidden="true" />
      <Button
        className="h-8 rounded-lg border border-border bg-muted/35 px-2.5 text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
        variant="ghost"
        size="sm"
        type="button"
        aria-label="Append voice input"
        title="Append by yapping"
        onClick={onStartVoiceInput}
      >
        <Mic className="size-3.5" />
        <span>Append yap</span>
      </Button>
    </div>
  )
}

function VoiceInputDialog({ onClose, onTranscript, userId }) {
  const audioContextRef = useRef(null)
  const audioFileInputRef = useRef(null)
  const levelAnimationFrameRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordingChunksRef = useRef([])
  const recordingStreamRef = useRef(null)
  const recordingStartedAtRef = useRef(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioName, setAudioName] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [requestingMic, setRequestingMic] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [waveLevels, setWaveLevels] = useState(idleWaveLevels)

  const hasRecording = Boolean(audioBlob && audioUrl)

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape' && !transcribing) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, transcribing])

  useEffect(() => {
    return () => {
      stopLevelMeter({ reset: false })
      stopMediaTracks()
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  useEffect(() => {
    if (!recording) {
      return undefined
    }

    function updateRecordingSeconds() {
      const elapsedMs = Date.now() - recordingStartedAtRef.current
      setRecordingSeconds(Math.max(0, Math.floor(elapsedMs / 1000)))
    }

    updateRecordingSeconds()
    const intervalId = window.setInterval(updateRecordingSeconds, 1000)

    return () => window.clearInterval(intervalId)
  }, [recording])

  function stopLevelMeter({ reset = true } = {}) {
    if (levelAnimationFrameRef.current) {
      window.cancelAnimationFrame(levelAnimationFrameRef.current)
      levelAnimationFrameRef.current = null
    }

    audioContextRef.current?.close().catch(() => {})
    audioContextRef.current = null

    if (reset) {
      setWaveLevels(idleWaveLevels)
    }
  }

  function startLevelMeter(stream) {
    const AudioContextConstructor =
      window.AudioContext || window.webkitAudioContext

    if (!AudioContextConstructor) {
      setWaveLevels(idleWaveLevels)
      return
    }

    const audioContext = new AudioContextConstructor()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)

    analyser.fftSize = 256
    const data = new Uint8Array(analyser.frequencyBinCount)

    source.connect(analyser)
    audioContextRef.current = audioContext

    function updateLevels() {
      analyser.getByteFrequencyData(data)

      const barCount = idleWaveLevels.length
      const bucketSize = Math.max(1, Math.floor(data.length / barCount))
      const nextLevels = Array.from({ length: barCount }, (_, index) => {
        const start = index * bucketSize
        const end = Math.min(data.length, start + bucketSize)
        let total = 0

        for (let dataIndex = start; dataIndex < end; dataIndex += 1) {
          total += data[dataIndex]
        }

        const average = total / Math.max(1, end - start)
        return Math.min(1, Math.max(0.15, average / 180))
      })

      setWaveLevels(nextLevels)
      levelAnimationFrameRef.current = window.requestAnimationFrame(updateLevels)
    }

    updateLevels()
  }

  function stopMediaTracks() {
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
    recordingStreamRef.current = null
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Audio recording is not supported in this browser.')
      return
    }

    setError('')
    setRequestingMic(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }

      recordingChunksRef.current = []
      recordingStreamRef.current = stream
      mediaRecorderRef.current = mediaRecorder
      setAudioBlob(null)
      setAudioUrl('')
      setRecordingSeconds(0)
      startLevelMeter(stream)

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      })

      mediaRecorder.addEventListener('stop', () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const nextAudioBlob = new Blob(recordingChunksRef.current, {
          type: mimeType,
        })
        const nextAudioUrl = URL.createObjectURL(nextAudioBlob)

        setAudioBlob(nextAudioBlob)
        setAudioName('Recorded yap')
        setAudioUrl(nextAudioUrl)
        setRecording(false)
        mediaRecorderRef.current = null
        recordingChunksRef.current = []
        stopLevelMeter()
        stopMediaTracks()
      })

      mediaRecorder.start()
      recordingStartedAtRef.current = Date.now()
      setRecording(true)
    } catch (requestError) {
      setError(
        requestError.message ||
          'Could not start recording. Check your microphone permission.',
      )
      stopLevelMeter()
      stopMediaTracks()
    } finally {
      setRequestingMic(false)
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      return
    }

    stopLevelMeter()
    stopMediaTracks()
    setRecording(false)
    setRecordingSeconds(0)
  }

  function resetRecording() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }

    setAudioBlob(null)
    setAudioName('')
    setAudioUrl('')
    setError('')
  }

  function setPreviewAudio(blob, name) {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }

    setAudioBlob(blob)
    setAudioName(name)
    setAudioUrl(URL.createObjectURL(blob))
    setError('')
  }

  function handleAudioFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!file.type.startsWith('audio/')) {
      setError('Please choose an audio file.')
      return
    }

    if (file.size > audioFileMaxBytes) {
      setError('Please choose an audio file under 19.5 MB.')
      return
    }

    setPreviewAudio(file, file.name)
  }

  function handleRecordButtonClick() {
    if (recording) {
      stopRecording()
      return
    }

    startRecording()
  }

  async function handleTranscribe() {
    if (!audioBlob || transcribing) {
      return
    }

    setError('')
    setTranscribing(true)

    try {
      const transcript = await transcribeVoiceAudio({
        audioBlob,
        audioName,
        userId,
      })

      onTranscript(transcript)
      onClose()
    } catch (transcriptionError) {
      setError(
        transcriptionError.message ||
          'Could not transcribe this audio. Please try again.',
      )
    } finally {
      setTranscribing(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-input-title"
    >
      <div
        className="w-full max-w-[380px] rounded-xl border border-border bg-popover p-4 text-center text-popover-foreground shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-center justify-between text-left">
          <div>
            <h2
              className="text-lg font-semibold text-foreground"
              id="voice-input-title"
            >
              Voice input
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {recording
                ? 'Recording your yap.'
                : hasRecording
                  ? 'Preview your audio before transcription.'
                  : 'Record or upload audio to append later.'}
            </p>
          </div>
          <Button
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
            variant="ghost"
            size="icon-sm"
            type="button"
            aria-label="Close voice input"
            disabled={transcribing}
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </header>

        {hasRecording && !recording ? (
          <AudioPreview key={audioUrl} audioName={audioName} audioUrl={audioUrl} />
        ) : (
          <>
            <button
              className={cn(
                'mx-auto grid size-24 place-items-center rounded-full border border-border bg-muted/35 text-foreground shadow-[0_16px_40px_oklch(0_0_0/12%)] transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70',
                recording &&
                  'bg-destructive/15 text-destructive hover:bg-destructive/20',
              )}
              type="button"
              disabled={requestingMic}
              aria-pressed={recording}
              aria-label={recording ? 'Stop recording' : 'Start recording'}
              onClick={handleRecordButtonClick}
            >
              {requestingMic ? (
                <Loader2 className="size-8 animate-spin" />
              ) : recording ? (
                <Square className="size-8 fill-current" />
              ) : (
                <Mic className="size-9" />
              )}
            </button>

            <p className="mt-4 text-sm font-medium text-foreground">
              {recording
                ? 'Recording...'
                : requestingMic
                  ? 'Opening microphone...'
                  : 'Start yapping'}
            </p>
            {recording && (
              <p
                className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground"
                aria-live="polite"
              >
                {formatAudioTime(recordingSeconds)}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {recording
                ? 'Press stop when you are done.'
                : 'Just yap it out. Messy is fine.'}
            </p>

            {recording && <RecordingWaveform levels={waveLevels} />}
          </>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-left text-sm text-destructive">
            {error}
          </p>
        )}

        {!recording && !hasRecording && (
          <>
            <input
              ref={audioFileInputRef}
              className="hidden"
              type="file"
              accept="audio/*"
              onChange={handleAudioFileChange}
            />

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" aria-hidden="true" />
              <span>or</span>
              <div className="h-px flex-1 bg-border" aria-hidden="true" />
            </div>

            <Button
              className="w-full"
              variant="outline"
              type="button"
              onClick={() => audioFileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              <span>Upload audio file</span>
            </Button>
          </>
        )}

        {hasRecording && !recording && (
          <footer className="mt-5 flex justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              disabled={transcribing}
              onClick={resetRecording}
            >
              <RotateCcw className="size-4" />
              <span>Redo</span>
            </Button>
            <Button
              type="button"
              disabled={transcribing}
              onClick={handleTranscribe}
            >
              {transcribing && <Loader2 className="size-4 animate-spin" />}
              <span>{transcribing ? 'Transcribing...' : 'Transcribe'}</span>
            </Button>
          </footer>
        )}
      </div>
    </div>
  )
}

function RecordingWaveform({ levels }) {
  return (
    <div
      className="mt-5 flex h-12 items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/20 px-4"
      aria-hidden="true"
    >
      {levels.map((level, index) => (
        <span
          className="h-9 w-1.5 rounded-full bg-destructive/70 transition-transform duration-75"
          key={index}
          style={{
            transform: `scaleY(${level})`,
          }}
        />
      ))}
    </div>
  )
}

function AudioPreview({ audioName, audioUrl }) {
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const progressValue = duration ? currentTime / duration : 0

  function togglePlayback() {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    if (audio.paused) {
      audio.play().catch(() => {})
      return
    }

    audio.pause()
  }

  function handleSeek(event) {
    const audio = audioRef.current
    const nextTime = Number(event.target.value)

    if (!audio) {
      return
    }

    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  return (
    <div className="rounded-lg border border-border bg-muted/25 p-3 text-left">
      <div className="mb-2 grid gap-0.5">
        <p className="text-sm font-medium text-foreground">Preview audio</p>
        {audioName && (
          <p className="truncate text-xs text-muted-foreground">{audioName}</p>
        )}
      </div>
      <audio
        ref={audioRef}
        className="hidden"
        preload="metadata"
        src={audioUrl}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      />
      <div className="flex items-center gap-3 rounded-lg bg-muted/55 px-3 py-3">
        <Button
          className="size-8 rounded-lg bg-background/40 text-foreground hover:bg-background/70"
          variant="ghost"
          size="icon-sm"
          type="button"
          aria-label={playing ? 'Pause audio preview' : 'Play audio preview'}
          onClick={togglePlayback}
        >
          {playing ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
        </Button>

        <span className="min-w-[74px] text-sm font-medium tabular-nums text-foreground">
          {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
        </span>

        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground/70"
            style={{ width: `${progressValue * 100}%` }}
          />
          <input
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            type="range"
            min="0"
            max={duration || 0}
            step="0.01"
            value={currentTime}
            aria-label="Audio preview position"
            onChange={handleSeek}
          />
        </div>
      </div>
    </div>
  )
}

export default JournalBodyField

import { useState } from 'react'
import { AlertTriangle, Eye, EyeOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const authCopy = {
  signIn: {
    title: 'Sign in',
    description: 'Use Google or your email to sync YapLog across devices.',
    action: 'Sign in',
  },
  signUp: {
    title: 'Create account',
    description: 'Create a YapLog account with Google or email.',
    action: 'Create account',
  },
  forgot: {
    title: 'Reset password',
    description: 'Enter your email and YapLog will send a reset link.',
    action: 'Send reset link',
  },
  reset: {
    title: 'Set new password',
    description: 'Choose a new password for your YapLog account.',
    action: 'Update password',
  },
}

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5c-.2 1.2-.9 2.3-2 3v2.4h3.2c1.9-1.7 3.1-4.2 3.1-7.1Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.5l-3.2-2.4c-.9.6-2 .9-3.5.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.5C4.8 19.7 8.2 22 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.6H3.1C2.4 8.9 2 10.4 2 12s.4 3.1 1.1 4.4l3.3-2.5Z"
      />
      <path
        fill="#EA4335"
        d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9C17 3 14.7 2 12 2 8.2 2 4.8 4.3 3.1 7.6l3.3 2.5C7.2 7.8 9.4 6 12 6Z"
      />
    </svg>
  )
}

function PasswordField({
  autoComplete,
  disabled,
  label,
  onChange,
  placeholder,
  value,
}) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="grid gap-2 text-sm font-semibold text-foreground">
      {label}
      <div className="relative">
        <Input
          className="pr-10"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md border-0 bg-transparent p-0 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          type="button"
          disabled={disabled}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  )
}

function AuthDialog({
  authLoading,
  initialMode = 'signIn',
  onClose,
  onForgotPassword,
  onGoogleSignIn,
  onPasswordSignIn,
  onPasswordSignUp,
  onPasswordUpdate,
}) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const copy = authCopy[mode] || authCopy.signIn
  const showProviderOptions = mode === 'signIn' || mode === 'signUp'
  const needsEmail = mode !== 'reset'
  const needsPassword = mode !== 'forgot'
  const needsConfirmPassword = mode === 'signUp' || mode === 'reset'
  const isBusy = submitting || authLoading

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    setMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    const cleanEmail = email.trim()

    if (needsEmail && !cleanEmail) {
      setError('Email is required.')
      return
    }

    if (needsPassword && password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (needsConfirmPassword && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      if (mode === 'signIn') {
        await onPasswordSignIn({ email: cleanEmail, password })
        onClose()
        return
      }

      if (mode === 'signUp') {
        const result = await onPasswordSignUp({ email: cleanEmail, password })

        if (result?.session) {
          onClose()
          return
        }

        setPassword('')
        setConfirmPassword('')
        setMessage('Check your email to confirm your account.')
        return
      }

      if (mode === 'forgot') {
        await onForgotPassword(cleanEmail)
        setMessage('Password reset link sent. Check your email.')
        return
      }

      await onPasswordUpdate(password)
      setPassword('')
      setConfirmPassword('')
      setMessage('Password updated. You can keep using YapLog.')
    } catch (caughtError) {
      setError(caughtError.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2
              className="text-lg font-semibold text-foreground"
              id="auth-dialog-title"
            >
              {copy.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {copy.description}
            </p>
          </div>
          <Button
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Close sign in dialog"
            onClick={onClose}
          >
            <X size={16} />
          </Button>
        </div>

        {showProviderOptions && (
          <>
            <Button
              className="mt-4 h-11 w-full justify-start gap-3 rounded-lg border border-border bg-background px-3 text-popover-foreground hover:bg-muted"
              variant="ghost"
              type="button"
              disabled={isBusy}
              onClick={onGoogleSignIn}
            >
              <GoogleIcon className="size-4 flex-none" />
              <span className="font-semibold">
                {authLoading ? 'Checking...' : 'Continue with Google'}
              </span>
            </Button>

            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>or</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          {needsEmail && (
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              Email
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={isBusy}
              />
            </label>
          )}

          {needsPassword && (
            <PasswordField
              label="Password"
              autoComplete={
                mode === 'signIn' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              disabled={isBusy}
            />
          )}

          {needsConfirmPassword && (
            <PasswordField
              label="Confirm password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Type it again"
              disabled={isBusy}
            />
          )}

          {error && (
            <p className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 p-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 flex-none" />
              <span>{error}</span>
            </p>
          )}

          {message && (
            <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-2 text-sm text-emerald-700 dark:text-emerald-300">
              {message}
            </p>
          )}

          <Button className="mt-1 h-11" type="submit" disabled={isBusy}>
            {submitting ? 'Working...' : copy.action}
          </Button>
        </form>

        <div className="mt-4 grid gap-2 text-center text-sm text-muted-foreground">
          {mode === 'signIn' && (
            <>
              <Button
                className="mx-auto h-auto w-fit p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                variant="ghost"
                type="button"
                onClick={() => switchMode('forgot')}
              >
                Forgot password?
              </Button>
              <div className="flex items-center justify-center gap-1.5">
                <span>New here?</span>
                <Button
                  className="h-auto p-0 font-semibold text-foreground hover:bg-transparent"
                  variant="ghost"
                  type="button"
                  onClick={() => switchMode('signUp')}
                >
                  Create account
                </Button>
              </div>
            </>
          )}

          {mode === 'signUp' && (
            <div className="flex items-center justify-center gap-1.5">
              <span>Already have an account?</span>
              <Button
                className="h-auto p-0 font-semibold text-foreground hover:bg-transparent"
                variant="ghost"
                type="button"
                onClick={() => switchMode('signIn')}
              >
                Sign in
              </Button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="flex items-center justify-center gap-1.5">
              <span>Remembered it?</span>
              <Button
                className="h-auto p-0 font-semibold text-foreground hover:bg-transparent"
                variant="ghost"
                type="button"
                onClick={() => switchMode('signIn')}
              >
                Sign in
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthDialog

function PlaceholderWorkspace({ activeApp }) {
  return (
    <div className="grid min-h-[calc(100vh-56px)] place-items-center text-sm text-muted-foreground max-[720px]:min-h-[220px]">
      <p className="m-0">{activeApp} will come next.</p>
    </div>
  )
}

export default PlaceholderWorkspace

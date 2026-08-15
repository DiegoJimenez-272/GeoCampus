import useAppStore from '../store/useAppStore'

export default function HUD() {
  const { phase } = useAppStore()

  if (phase !== 'interior') return null

  return (
    <div className="hud" id="hud">
      <div className="hud-badge">
        <span className="hud-dot" />
        Vista Interior — 3D
      </div>
    </div>
  )
}

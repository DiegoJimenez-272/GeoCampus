import useAppStore from '../store/useAppStore'

export default function EnterButton() {
  const { phase, setPhase } = useAppStore()

  if (phase !== 'exterior') return null

  const handleEnter = () => {
    setPhase('transitioning')
  }

  return (
    <div className="enter-btn-container">
      <button id="btn-ingresar" className="enter-btn" onClick={handleEnter}>
        🏢 Ingresar al Edificio
      </button>
      <span className="enter-hint">Haz clic para explorar el interior</span>
    </div>
  )
}

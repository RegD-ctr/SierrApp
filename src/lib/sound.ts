export function playOrderAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const playBeep = (startTime: number, freq: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25)
      osc.start(startTime)
      osc.stop(startTime + 0.25)
    }
    const now = ctx.currentTime
    playBeep(now, 880)
    playBeep(now + 0.3, 1108)
  } catch {
    // Si el navegador bloquea audio sin interacción previa del usuario,
    // falla en silencio — la alerta visual sigue funcionando igual.
  }
}

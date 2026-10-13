/**
 * Utilidad de audio para reproducir un tono sutil de notificación push móvil
 * utilizando la Web Audio API nativa sin dependencias externas ni archivos de audio.
 */

let audioCtx: AudioContext | null = null

export function playNotificationSound(): void {
  try {
    if (typeof window === "undefined") return

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContextClass()
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {})
    }

    const now = audioCtx.currentTime

    // Dos tonos armónicos suaves (Re5 -> La5) característicos de alerta móvil
    const osc1 = audioCtx.createOscillator()
    const osc2 = audioCtx.createOscillator()
    const gain = audioCtx.createGain()

    osc1.type = "sine"
    osc2.type = "triangle"

    // Nota 1 (587.33 Hz) a Nota 2 (880 Hz)
    osc1.frequency.setValueAtTime(587.33, now)
    osc1.frequency.setValueAtTime(880, now + 0.08)

    osc2.frequency.setValueAtTime(587.33, now)
    osc2.frequency.setValueAtTime(880, now + 0.08)

    // Envolvente de volumen suave y sutil
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(audioCtx.destination)

    osc1.start(now)
    osc2.start(now)

    osc1.stop(now + 0.35)
    osc2.stop(now + 0.35)
  } catch {
    // Si el navegador bloquea la reproducción por política de interacción, no emitir error
  }
}

export const playOrderAlertSound = playNotificationSound


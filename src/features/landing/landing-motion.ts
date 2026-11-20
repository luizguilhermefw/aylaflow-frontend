export const automationStates = ['Monitorando a base', 'Cliente identificado', 'Regra encontrada', 'Automação acionada', 'Comunicação preparada', 'Canal WhatsApp'] as const
export function readingProgress(scroll: number, height: number, viewport: number): number {
  const distance = height - viewport
  return distance <= 0 ? 0 : Math.min(1, Math.max(0, scroll / distance))
}
export function demoStage(elapsed: number, reduced: boolean): number {
  return reduced ? automationStates.length - 1 : Math.min(5, Math.floor(Math.max(0, elapsed) / 1500))
}

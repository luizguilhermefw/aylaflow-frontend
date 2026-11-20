import { onMounted, onUnmounted, watch, type WatchStopHandle } from 'vue'

export function usePageMeta(value: () => { title: string; description: string }) {
  let previousTitle = ''
  let previousDescription: string | null = null
  let meta: HTMLMetaElement | null = null
  let created = false
  let stop: WatchStopHandle | undefined
  onMounted(() => {
    previousTitle = document.title
    meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.append(meta)
      created = true
    }
    previousDescription = meta.getAttribute('content')
    stop = watch(value, current => {
      document.title = current.title
      meta?.setAttribute('content', current.description)
    }, { immediate: true })
  })
  onUnmounted(() => {
    stop?.()
    document.title = previousTitle
    if (created) meta?.remove()
    else if (previousDescription === null) meta?.removeAttribute('content')
    else meta?.setAttribute('content', previousDescription)
  })
}

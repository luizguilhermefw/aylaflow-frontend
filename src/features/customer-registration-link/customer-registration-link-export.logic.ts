export const CUSTOMER_REGISTRATION_QR_FILENAME = 'aylaflow-cadastro-qrcode.png'

export interface CustomerRegistrationQrExporter {
  download(qrCodeDataUrl: string): Promise<void>
  print(publicUrl: string, qrCodeDataUrl: string): Promise<void>
}

export interface CustomerRegistrationQrDownloadRuntime {
  decodeBase64(value: string): string
  createBlob(parts: BlobPart[], options: BlobPropertyBag): Blob
  createObjectUrl(blob: Blob): string
  revokeObjectUrl(url: string): void
  createDownloadLink(): HTMLAnchorElement
  appendDownloadLink(link: HTMLAnchorElement): void
}

export interface CustomerRegistrationQrPrintRuntime {
  openWindow(): Window | null
}

function browserDownloadRuntime(): CustomerRegistrationQrDownloadRuntime {
  return {
    decodeBase64: (value) => window.atob(value),
    createBlob: (parts, options) => new Blob(parts, options),
    createObjectUrl: (blob) => URL.createObjectURL(blob),
    revokeObjectUrl: (url) => URL.revokeObjectURL(url),
    createDownloadLink: () => document.createElement('a'),
    appendDownloadLink: (link) => document.body.appendChild(link),
  }
}

const browserPrintRuntime: CustomerRegistrationQrPrintRuntime = {
  openWindow: () => window.open('', '_blank'),
}

export function pngDataUrlToBlob(
  dataUrl: string,
  runtime: CustomerRegistrationQrDownloadRuntime,
): Blob {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl)
  if (!match) throw new Error('Invalid PNG data URL')

  const binary = runtime.decodeBase64(match[1])
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return runtime.createBlob([bytes], { type: 'image/png' })
}

function appendTextElement(
  documentRef: Document,
  parent: HTMLElement,
  tag: 'h1' | 'p' | 'strong',
  text: string,
  className?: string,
): HTMLElement {
  const element = documentRef.createElement(tag)
  element.textContent = text
  if (className) element.className = className
  parent.appendChild(element)
  return element
}

function renderPrintDocument(
  printWindow: Window,
  publicUrl: string,
  qrCodeDataUrl: string,
): HTMLImageElement {
  const documentRef = printWindow.document
  documentRef.title = 'Cadastro de clientes'
  documentRef.head.replaceChildren()
  documentRef.body.replaceChildren()

  const style = documentRef.createElement('style')
  style.textContent = `
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #111; font-family: Arial, sans-serif; }
    main { width: 100%; max-width: 680px; margin: 0 auto; padding: 28px; text-align: center; }
    h1 { margin: 0; font-size: 30px; }
    p { margin: 14px 0 0; font-size: 17px; line-height: 1.5; }
    img { display: block; width: min(100%, 360px); height: auto; margin: 30px auto; }
    .link-label { margin-top: 24px; font-size: 14px; }
    .public-url { overflow-wrap: anywhere; font-size: 15px; }
    .brand { margin-top: 38px; color: #0f2a2e; font-size: 18px; }
  `
  documentRef.head.appendChild(style)

  const main = documentRef.createElement('main')
  appendTextElement(documentRef, main, 'h1', 'Cadastro de clientes')
  appendTextElement(
    documentRef,
    main,
    'p',
    'Escaneie o QR Code abaixo com a câmera do celular para realizar seu cadastro.',
  )

  const image = documentRef.createElement('img')
  image.alt = 'QR Code para cadastro de clientes'
  image.src = qrCodeDataUrl
  main.appendChild(image)

  appendTextElement(documentRef, main, 'p', 'Ou acesse:', 'link-label')
  appendTextElement(documentRef, main, 'p', publicUrl, 'public-url')
  appendTextElement(documentRef, main, 'strong', 'AylaFlow', 'brand')
  documentRef.body.appendChild(main)
  return image
}

export function waitForQrImageAndPrint(
  image: HTMLImageElement,
  printWindow: Window,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      image.removeEventListener('load', handleLoad)
      image.removeEventListener('error', handleError)
    }

    const fail = () => {
      cleanup()
      reject(new Error('QR image failed to load'))
    }

    const print = () => {
      cleanup()
      if (image.naturalWidth === 0) {
        reject(new Error('QR image is unavailable'))
        return
      }

      try {
        printWindow.focus()
        printWindow.print()
        resolve()
      } catch (error) {
        reject(error)
      }
    }

    function handleLoad() {
      print()
    }

    function handleError() {
      fail()
    }

    if (image.complete) {
      print()
      return
    }

    image.addEventListener('load', handleLoad, { once: true })
    image.addEventListener('error', handleError, { once: true })
  })
}

export function createBrowserCustomerRegistrationQrExporter(
  downloadRuntime: CustomerRegistrationQrDownloadRuntime = browserDownloadRuntime(),
  printRuntime: CustomerRegistrationQrPrintRuntime = browserPrintRuntime,
): CustomerRegistrationQrExporter {
  return {
    async download(qrCodeDataUrl: string): Promise<void> {
      const blob = pngDataUrlToBlob(qrCodeDataUrl, downloadRuntime)
      const objectUrl = downloadRuntime.createObjectUrl(blob)
      try {
        const link = downloadRuntime.createDownloadLink()
        link.href = objectUrl
        link.download = CUSTOMER_REGISTRATION_QR_FILENAME
        downloadRuntime.appendDownloadLink(link)
        link.click()
        link.remove()
      } finally {
        downloadRuntime.revokeObjectUrl(objectUrl)
      }
    },

    async print(publicUrl: string, qrCodeDataUrl: string): Promise<void> {
      const printWindow = printRuntime.openWindow()
      if (!printWindow) throw new Error('Print window unavailable')
      printWindow.opener = null
      const image = renderPrintDocument(printWindow, publicUrl, qrCodeDataUrl)
      printWindow.document.close()
      await waitForQrImageAndPrint(image, printWindow)
    },
  }
}

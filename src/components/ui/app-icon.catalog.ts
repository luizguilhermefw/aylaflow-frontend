export type AppIconNode = Readonly<{
  tag: 'circle' | 'line' | 'path' | 'polyline' | 'rect'
  attrs: Readonly<Record<string, string | number>>
}>

const path = (d: string): AppIconNode => ({ tag: 'path', attrs: { d } })
const circle = (cx: number, cy: number, r: number): AppIconNode => ({ tag: 'circle', attrs: { cx, cy, r } })
const line = (x1: number, y1: number, x2: number, y2: number): AppIconNode => ({ tag: 'line', attrs: { x1, y1, x2, y2 } })
const polyline = (points: string): AppIconNode => ({ tag: 'polyline', attrs: { points } })
const rect = (x: number, y: number, width: number, height: number, rx?: number): AppIconNode => ({
  tag: 'rect',
  attrs: { x, y, width, height, ...(rx === undefined ? {} : { rx }) },
})

export const APP_ICON_CATALOG = {
  brand: [path('m13 2-9 12h7l-1 8 9-12h-7l1-8Z')],
  dashboard: [rect(3, 3, 7, 9, 1), rect(14, 3, 7, 5, 1), rect(14, 12, 7, 9, 1), rect(3, 16, 7, 5, 1)],
  campaign: [path('m3 11 18-5v12L3 14v-3Z'), path('M11.6 16.8 13 21H7l-1.8-6.2'), path('M8 9v6')],
  automation: [path('M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83')],
  contacts: [path('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'), circle(9, 7, 4), path('M23 21v-2a4 4 0 0 0-3-3.87'), path('M16 3.13a4 4 0 0 1 0 7.75')],
  reports: [line(18, 20, 18, 10), line(12, 20, 12, 4), line(6, 20, 6, 14)],
  settings: [path('M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'), circle(12, 12, 3)],
  whatsapp: [path('M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z')],
  company: [path('M3 21h18'), path('M6 21V7l6-4 6 4v14'), path('M9 9h1M14 9h1M9 13h1M14 13h1M9 17h6')],
  users: [path('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'), circle(9, 7, 4), path('M22 21v-2a4 4 0 0 0-3-3.87'), path('M16 3.13a4 4 0 0 1 0 7.75')],
  appearance: [circle(12, 12, 4), path('M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41')],
  edit: [path('M12 20h9'), path('M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z')],
  delete: [path('M3 6h18'), path('M8 6V4h8v2'), path('M19 6l-1 14H6L5 6'), line(10, 11, 10, 16), line(14, 11, 14, 16)],
  activate: [path('m6 3 14 9-14 9V3Z')],
  pause: [rect(6, 4, 4, 16, 1), rect(14, 4, 4, 16, 1)],
  send: [path('m22 2-7 20-4-9-9-4Z'), path('M22 2 11 13')],
  upload: [path('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'), polyline('17 8 12 3 7 8'), line(12, 3, 12, 15)],
  import: [path('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z'), polyline('14 2 14 8 20 8'), path('M12 18v-6'), polyline('9 15 12 12 15 15')],
  confirm: [path('M20 6 9 17l-5-5')],
  close: [line(18, 6, 6, 18), line(6, 6, 18, 18)],
  back: [line(19, 12, 5, 12), polyline('12 19 5 12 12 5')],
  search: [circle(11, 11, 8), path('m21 21-4.3-4.3')],
  filter: [path('M22 3H2l8 9.46V19l4 2v-8.54L22 3Z')],
  consentGranted: [path('M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z'), path('m9 12 2 2 4-4')],
  optOut: [path('M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z'), line(9, 9, 15, 15), line(15, 9, 9, 15)],
  channel: [circle(12, 12, 2), path('M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49'), path('M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14')],
  calendar: [rect(3, 5, 18, 16, 2), line(16, 3, 16, 7), line(8, 3, 8, 7), line(3, 11, 21, 11)],
  birthday: [path('M4 14a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6H4v-6Z'), path('M4 16c1.5 1 2.5 1 4 0 1.5 1 2.5 1 4 0 1.5 1 2.5 1 4 0 1.5 1 2.5 1 4 0'), path('M8 12V8M12 12V8M16 12V8'), path('M8 5h.01M12 5h.01M16 5h.01')],
  reactivation: [path('M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5'), path('M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5')],
  maintenance: [path('M14.7 6.3a4 4 0 0 0-5-5L7.4 3.6l3 3L8 9l-3-3-2.3 2.3a4 4 0 0 0 5 5L16.4 22l5.6-5.6-8.7-8.7a4 4 0 0 0 1.4-1.4Z')],
  logout: [path('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'), polyline('16 17 21 12 16 7'), line(21, 12, 9, 12)],
  alert: [circle(12, 12, 10), line(12, 8, 12, 12), path('M12 16h.01')],
  warning: [path('M12 9v4'), path('M12 17h.01'), path('M3.34 17a2 2 0 0 0 1.73 3h13.86a2 2 0 0 0 1.73-3L13.73 5a2 2 0 0 0-3.46 0Z')],
  add: [line(12, 5, 12, 19), line(5, 12, 19, 12)],
  message: [path('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z')],
  trend: [polyline('22 7 13.5 15.5 8.5 10.5 2 17'), polyline('16 7 22 7 22 13')],
  qrCode: [rect(3, 3, 5, 5, 1), rect(16, 3, 5, 5, 1), rect(3, 16, 5, 5, 1), path('M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1')],
  sparkles: [path('m12 3-1.2 3.2L8 7.5l2.8 1.3L12 12l1.2-3.2L16 7.5l-2.8-1.3L12 3Z'), path('m19 13-.8 2.2L16 16l2.2.8L19 19l.8-2.2L22 16l-2.2-.8L19 13Z'), path('m5 14-1 2.5L1.5 17.5 4 18.5 5 21l1-2.5 2.5-1L6 16.5 5 14Z')],
} as const satisfies Record<string, readonly AppIconNode[]>

export type AppIconName = keyof typeof APP_ICON_CATALOG

export const APP_ICON_NAMES = Object.freeze(Object.keys(APP_ICON_CATALOG) as AppIconName[])

export function isAppIconName(value: string): value is AppIconName {
  return Object.prototype.hasOwnProperty.call(APP_ICON_CATALOG, value)
}

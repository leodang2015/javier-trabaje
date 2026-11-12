import { createApp } from 'vue'
import { Quasar, Notify, Dialog } from 'quasar'
import router from './router/router.js'

// Import Quasar css
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

import App from './App.vue'

// Prevenir errores benignos de ResizeObserver
const isResizeObserverError = (err) => {
  const msg = err?.message || err?.reason?.message || (typeof err === 'string' ? err : '')
  return Boolean(msg && msg.includes('ResizeObserver'))
}

window.addEventListener('error', (e) => {
  if (isResizeObserverError(e) || isResizeObserverError(e?.error)) {
    e.stopImmediatePropagation?.()
    e.preventDefault?.()
    return true
  }
}, true)

window.addEventListener('unhandledrejection', (e) => {
  if (isResizeObserverError(e) || isResizeObserverError(e?.reason)) {
    e.stopImmediatePropagation?.()
    e.preventDefault?.()
    return true
  }
})

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  if (isResizeObserverError(err)) return
  console.error('Vue error:', err, info)
}

app.use(router)
app.use(Quasar, {
  plugins: {
    Notify,
    Dialog
  }
})

app.mount('#app')

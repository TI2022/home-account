// Cypress E2E Support File
import './commands'

// Hide fetch/xhr logs for cleaner output
Cypress.on('window:before:load', (win) => {
  const originalFetch = win.fetch
  win.fetch = function (...args) {
    return originalFetch.apply(this, args)
  }
})
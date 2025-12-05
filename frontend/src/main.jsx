import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Apply saved theme on app initialization
const applySavedTheme = () => {
  const savedTheme = localStorage.getItem('hrms_theme') || 'light'
  const root = document.documentElement
  
  root.classList.remove('dark')
  
  if (savedTheme === 'dark') {
    root.classList.add('dark')
    document.body.style.backgroundColor = '#1a1a1a'
    document.body.style.color = '#e5e5e5'
  } else if (savedTheme === 'light') {
    root.classList.remove('dark')
    document.body.style.backgroundColor = '#f5f7fa'
    document.body.style.color = '#1f2937'
  } else if (savedTheme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      root.classList.add('dark')
      document.body.style.backgroundColor = '#1a1a1a'
      document.body.style.color = '#e5e5e5'
    } else {
      root.classList.remove('dark')
      document.body.style.backgroundColor = '#f5f7fa'
      document.body.style.color = '#1f2937'
    }
  }
}

// Apply theme before rendering
applySavedTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


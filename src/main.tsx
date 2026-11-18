// Les styles globaux d'abord : ceux des écrans, chargés ensuite, peuvent les préciser.
import '@fontsource-variable/nunito/wght.css'
import './styles/tokens.css'
import './styles/base.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('Élément #root introuvable dans index.html.')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

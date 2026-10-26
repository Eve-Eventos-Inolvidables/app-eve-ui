import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { queryClient } from './api/queryClient.ts'
import { QueryClientProvider } from '@tanstack/react-query'
import { ComponentProvider } from './components/ui/chakra-base/component-provider.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ComponentProvider>
        <App />
      </ComponentProvider>
    </QueryClientProvider>
  </StrictMode>,
)

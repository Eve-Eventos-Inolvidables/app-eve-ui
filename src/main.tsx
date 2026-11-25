import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { queryClient } from './api/queryClient.ts'
import { QueryClientProvider } from '@tanstack/react-query'
import { ComponentProvider } from './components/ui/chakra-base/component-provider.tsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { saveUiNodeCookie } from './utils/uiNode.ts'

saveUiNodeCookie()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <ComponentProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ComponentProvider>
    </QueryClientProvider>
  </StrictMode>,
)

import { ToastProvider } from '@twincam/ui/components/toast'
import type { ComponentType } from 'react'

/**
 * Frame for a surface that lives inside the application shell, not in the auth
 * column: the content width of a page, plus the `ToastProvider` where the
 * result of a submission appears. `withAuthSurface` stays the frame for the
 * authentication forms, whose narrow column is a contract of their own layout.
 */
export function withFeatureSurface(Story: ComponentType) {
  return (
    <ToastProvider>
      <div className='flex justify-center p-6'>
        <div className='w-full max-w-xl' data-slot='feature-surface'>
          <Story />
        </div>
      </div>
    </ToastProvider>
  )
}

import { clientEnv } from '@twincam/infra-env/client'
import type { ReactNode } from 'react'

import authBackground from '../assets/bg-auth.jpg'

export function AppAuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className='grid min-h-svh overflow-hidden bg-background lg:grid-cols-5'>
      <div className='flex flex-col gap-4 p-6 md:p-10 lg:col-span-3'>
        <div className='flex flex-col gap-1 md:items-start'>
          <span className='text-muted-foreground text-xs uppercase tracking-[0.35em]'>
            {clientEnv.VITE_APP_NAME}
          </span>
          <span className='font-semibold text-foreground text-sm'>Acesso seguro</span>
        </div>
        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-sm'>{children}</div>
        </div>
      </div>
      <div className='relative hidden overflow-hidden rounded-2xl lg:col-span-2 lg:m-6 lg:block'>
        <img
          alt=''
          aria-hidden='true'
          className='h-full w-full object-cover'
          src={authBackground}
        />
        <div className='absolute inset-0 bg-gradient-to-br from-background/10 via-background/30 to-background/70' />
      </div>
    </div>
  )
}

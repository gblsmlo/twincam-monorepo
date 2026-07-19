import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AppAuthLayout } from '../../layouts/app-auth-layout'

export const Route = createFileRoute('/(auth)')({
  component: AuthRoute,
})

function AuthRoute() {
  return (
    <AppAuthLayout>
      <Outlet />
    </AppAuthLayout>
  )
}

import { ROUTES, ROUTE_PREFIX } from '../routes'
import { MESSAGES } from '../messages'

import { triggerReload } from './hooks/useReloadOnChange'

export async function startDevelopmentSocket(): Promise<void> {
  const { default: io } = await import('socket.io-client')
  const { default: ky } = await import('ky-universal')
  const { port } = await ky
    .get(ROUTES.queryMessagePort)
    .json<{ port: number }>()

  const socket = io(`http://localhost:${port}`)

  socket.on('connect', onConnect)
  socket.on('message', onMessage)

  socket.on('close', () => {
    socket.off('connect', onConnect)
    socket.off('message', onMessage)
  })
}

function onConnect(): void {
  console.info(`Connected to 🔗 http://${window.location.host + ROUTE_PREFIX}`)
}

function onMessage({ type }: { type: string }): void {
  switch (type) {
    case MESSAGES.reload: {
      triggerReload()
    }
  }
}

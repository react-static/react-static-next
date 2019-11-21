import io from 'socket.io'
import { MESSAGES } from '../messages'

export interface MessageEmitters {
  reload: () => Promise<unknown>
}

export async function runMessageServer({
  messagePort,
}: {
  messagePort: number
}): Promise<MessageEmitters> {
  const socket = io()

  //reloadClientData.current = async () => {
  //  socket.emit('message', { type: 'reloadClientData' })
  //}

  socket.listen(messagePort)

  return {
    reload: async (): Promise<unknown> =>
      socket.emit('message', { type: MESSAGES.reload }),
  }
}

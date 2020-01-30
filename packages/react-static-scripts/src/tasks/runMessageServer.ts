import io from 'socket.io'
import { MESSAGES } from '@react-static/core'

export interface MessageEmitters {
  reload: () => Promise<unknown>
}

/**
 * Runs a message server (websocket) that allows react static's dev server to
 * pass messages to any open tab / any open instance of the site (development),
 * which for example is used to force a page "reload" of ALL tabs if a template
 * changes.
 */
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

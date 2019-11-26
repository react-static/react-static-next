import { isDevelopment } from '../universal/environment'
import { startDevelopmentSocket } from './socket'
// import { onReload } from './hooks/useReloadOnChange'

// When in development, init a socket to listen for data changes
// When the data changes, we invalidate and reload all of the route data
export function bootstrap(): void {
  if (isDevelopment()) {
    console.log('Passed in environment')
    console.log({
      env: {
        REACT_STATIC_ENV: process.env.REACT_STATIC_ENV,
        NODE_ENV: process.env.NODE_ENV,
        REACT_ENV: process.env.REACT_ENV,
      },
    })

    startDevelopmentSocket()
  }
  // TODO start preloader
}

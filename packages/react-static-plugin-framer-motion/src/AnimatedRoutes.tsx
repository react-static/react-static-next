import React, { createElement, useCallback, useMemo } from 'react'
import{ AnimatePresence, motion, AnimationProps, AnimatePresenceProps } from 'framer-motion'

import { useCurrentRoutePath, StaticRoutes, StaticRoutesProps } from '@react-static/core'
import { CurrentRouteProvider } from '@react-static/core/dist/app/contexts/RouteContext'

const DEFAULT_VARIANTS = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
  },
  out: {
    opacity: 0,
  }
};

export interface AnimatedRoutesProps extends StaticRoutesProps {
  animation?: AnimationProps['variants']
  positionTransition?: AnimationProps['positionTransition']
  exitBeforeEnter?: AnimatePresenceProps['exitBeforeEnter']
}

export function AnimatedRoutes({ animation, positionTransition, exitBeforeEnter, render, ...props }: AnimatedRoutesProps): JSX.Element {
  const key = useCurrentRoutePath()
  const variants = animation || DEFAULT_VARIANTS
  const renderWithAnimation: NonNullable<StaticRoutesProps['render']> = useCallback((path, getComponentForPath) => {
    // This is so when the path changes, it will still use the initial rendered path.
    const initialPath = useMemo(() => path, [])

    return (
      <motion.div
        positionTransition={positionTransition || false}
        initial="initial"
        animate="in"
        exit="out"
        variants={variants}
      >
        <CurrentRouteProvider value={initialPath}>
          {
            render
              ? render(initialPath, getComponentForPath)
              : createElement(getComponentForPath(initialPath))
          }
        </CurrentRouteProvider>
      </motion.div>
    )
  } ,[render, variants])

  return (
    <AnimatePresence exitBeforeEnter={exitBeforeEnter}>
      <StaticRoutes {...props} key={key} render={renderWithAnimation} />
    </AnimatePresence>
  )
}

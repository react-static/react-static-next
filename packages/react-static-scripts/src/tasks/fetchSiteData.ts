import { State } from '@react-static/types';

export async function fetchSiteData(rawState: Readonly<State>): Promise<State> {
  const state = await runBeforeState(rawState)

  if (!state.config.data) {
    return state
  }
  state.logger.log('fetchSiteData: Fetching site data...')

  let resolvedData = await state.config.data
  if (typeof resolvedData === 'function') {
    resolvedData = await resolvedData()
  }

  const nextState = await runBeforeMerge(state, resolvedData)
    .then(({ site, state }) => mergeSiteDataIntoState(state, site))

  return nextState
}

async function runBeforeState(state: Readonly<State>): Promise<State> {
  return (await state.plugins.beforeSiteData({ state })).state
}

async function runBeforeMerge(state: Readonly<State>, site: unknown): Promise<{ state: State, site: unknown }> {
  return (await state.plugins.afterSiteData({ state, site }))
}

async function mergeSiteDataIntoState(state: Readonly<State>, site: unknown): Promise<State> {
  return { ...state, data: { ...state.data, site  } }
}

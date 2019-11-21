import { State } from "../..";

export async function fetchSiteData(state: Readonly<State>): Promise<State> {
  if (state.config.data) {
    console.log('Fetching site data...')

    const resolvedData = await state.config.data
    if (typeof resolvedData === 'function') {
      return fetchSiteData({ ...state, config: { ...state.config, data: resolvedData() }})
    }

    return { ...state, data: { ...state.data, site: resolvedData } }
  }

  return state
}

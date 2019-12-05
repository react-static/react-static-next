import { hot } from 'react-hot-loader/root';
import React from 'react';
// Export named App for testing
export function App() {
    return <h1>Hello World</h1>;
}
// Export hot-reload enabled root element
export const HotApp = hot(App);

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import mapboxgl from 'mapbox-gl';

// Ensure Mapbox GL uses the non-transpiled worker to avoid Babel issues.
// eslint-disable-next-line global-require
mapboxgl.workerClass = require('mapbox-gl/dist/mapbox-gl-csp-worker').default;

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

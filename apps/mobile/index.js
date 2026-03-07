// EXPLANATION: React Native doesn't have a global `crypto` object or `Buffer`.
// @solana/web3.js and the MWA library need both. We patch them here before
// anything else in the app loads.
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Make Buffer available globally (Solana libs use it heavily)
global.Buffer = Buffer;

// Now it's safe to load the app
import { registerRootComponent } from 'expo';
import App from './src/App';

registerRootComponent(App);

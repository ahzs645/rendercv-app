import { Buffer } from 'buffer';
import ReactDOM from 'react-dom/client';
import { App } from './app';

// The share codec bundle still expects a global Buffer in browsers.
const globalBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
globalBuffer.Buffer ??= Buffer;

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("Main starting...");

window.onerror = function(msg, url, line, col, error) {
    console.error("Global Error:", msg, error);
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = `<div style="color: white; padding: 20px; background: rgba(255,0,0,0.1); border: 1px solid red; border-radius: 8px; margin: 20px; font-family: sans-serif;">
            <h2 style="color: #ff4d4d; margin-top: 0;">Runtime Error</h2>
            <p style="font-family: monospace; white-space: pre-wrap;">${msg}</p>
            <p style="font-size: 0.8em; opacity: 0.7;">${url} line ${line}</p>
        </div>`;
    }
    return false;
};

try {
    const container = document.getElementById('root');
    if (!container) throw new Error("Root element not found");
    
    console.log("Rendering App...");
    const root = createRoot(container);
    root.render(<App />);
    console.log("App rendered.");
} catch (err) {
    console.error("Render Catch:", err);
    document.getElementById('root').innerHTML = `<div style="color: white; padding: 20px;">Render Error: ${err.message}</div>`;
}

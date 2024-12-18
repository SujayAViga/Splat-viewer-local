import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GlobalVariablesProvider } from '../GlobalVariables.jsx';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';


createRoot(document.getElementById('root')).render(
    <GlobalVariablesProvider>
      <App />
    </GlobalVariablesProvider>
)

// Register service worker for PWA functionality
serviceWorkerRegistration.register();
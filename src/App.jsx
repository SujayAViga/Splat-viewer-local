import './App.css'
import Viewer from './components/Viewer'
import UploadFiles from './components/UploadFiles'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<UploadFiles />} />
          <Route path="/viewer" element={<Viewer />} />
        </Routes>
      </Router>
    </>
  )
}

export default App

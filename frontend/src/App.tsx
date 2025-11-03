import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={
            <div className="container mx-auto px-4 py-8">
              <h1 className="text-3xl font-bold text-gray-800">
                LMS AI Pay - Hệ thống quản lý học tập trực tuyến
              </h1>
              <p className="mt-4 text-gray-600">
                Welcome! Frontend đã được setup thành công.
              </p>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App


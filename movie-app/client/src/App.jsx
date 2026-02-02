import { useState, useEffect } from 'react'
import './App.css'
import Spinner from './components/spinner'
import { useDebounce } from 'react-use'
import { Routes, Route} from 'react-router-dom'
import Home from "./pages/Home";
import Favorites from "./pages/Favorites.jsx";
import Navbar from './components/Navbar'
import Watch from './pages/Watch.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
  <>
    {/* call navbar component */}
    <Navbar/>
    {/* Pages render here */}
    <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path='/watch/:id' element={<Watch/>}/>
        <Route path='/favorites' element={<Favorites/>}/>
    </Routes>
  </>
  )
}

export default App

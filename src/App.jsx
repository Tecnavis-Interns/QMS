import Landing from './Components/Landing'
import Navbar from './Components/Navbar'

export default function App() {
  return (
    <div className='md:mx-64 mx-2 md:py-10 py-5 flex flex-col min-h-screen'>
      <Navbar />
      <Landing />
    </div>
  )
}
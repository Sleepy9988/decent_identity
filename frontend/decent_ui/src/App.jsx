import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout.jsx';
import Home from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Identity from './pages/Identity.jsx';
import Requests from './pages/Requests.jsx';
import ProtectedRoute from './components/Misc/ProtectedRoute.jsx';

/**
 * App
 * 
 * Root component that defines the routing structure of the application. 
 * 
 * Structure: 
 * - Wraps all routes in a Router
 * - Uses a global Layout (Header, Sidebar, Footer, etc.)
 * - Routes: 
 *    - '/' -> Login (public)
 *    - '/dashboard', '/identities', '/requests' -> protected routes, only accessible 
 *      if user is authenticated (ProtectedRoute wrapper).
 */

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public route: Login page */}
          <Route path="/" element={<Login />} />

          {/* Protected routes: require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/identities" element={<Identity />} />
            <Route path="/requests" element={<Requests />} />
          </Route>
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout.jsx';
import Home from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Identity from './pages/Identity.jsx';
import Requests from './pages/Requests.jsx';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/identities" element={<Identity />} />
          <Route path="/requests" element={<Requests />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

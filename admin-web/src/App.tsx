import {BrowserRouter, Routes, Route, NavLink} from 'react-router-dom';
import {
  LayoutGrid,
  Coffee,
  Home,
  Settings,
  MapPin,
  Users as UsersIcon,
} from 'lucide-react';
import Categories from './pages/Categories';
import GlobalOptions from './pages/GlobalOptions';
import Products from './pages/Products';
import Branches from './pages/Branches';
import Users from './pages/Users';

const DashboardHome = () => (
  <div className="card">
    <h2 style={{marginBottom: '1rem'}}>Welcome to HSOrder Admin</h2>
    <p style={{color: 'var(--text-secondary)'}}>
      Manage your store's categories and products from this central dashboard.
      All changes are reflected instantly in the mobile app.
    </p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <div className="admin-layout">
        <aside className="sidebar">
          <div className="logo-section">
            <Coffee size={32} color="var(--secondary)" />
            <h1 className="logo-text">HSOrder Admin</h1>
          </div>

          <nav className="nav-links">
            <NavLink
              to="/"
              className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
              end>
              <Home size={20} />
              <span>Overview</span>
            </NavLink>
            <NavLink
              to="/categories"
              className={({isActive}) =>
                `nav-link ${isActive ? 'active' : ''}`
              }>
              <LayoutGrid size={20} />
              <span>Categories</span>
            </NavLink>
            <NavLink
              to="/products"
              className={({isActive}) =>
                `nav-link ${isActive ? 'active' : ''}`
              }>
              <Coffee size={20} />
              <span>Products</span>
            </NavLink>
            <NavLink
              to="/branches"
              className={({isActive}) =>
                `nav-link ${isActive ? 'active' : ''}`
              }>
              <MapPin size={20} />
              <span>Outlets</span>
            </NavLink>
            <NavLink
              to="/users"
              className={({isActive}) =>
                `nav-link ${isActive ? 'active' : ''}`
              }>
              <UsersIcon size={20} />
              <span>Users</span>
            </NavLink>
            <NavLink
              to="/global-options"
              className={({isActive}) =>
                `nav-link ${isActive ? 'active' : ''}`
              }>
              <Settings size={20} />
              <span>Global Options</span>
            </NavLink>
            <NavLink
              to="/settings"
              className={({isActive}) =>
                `nav-link ${isActive ? 'active' : ''}`
              }>
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
          </nav>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/global-options" element={<GlobalOptions />} />
            <Route path="/products" element={<Products />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/users" element={<Users />} />

            <Route
              path="/settings"
              element={<div className="card">Settings Coming Soon</div>}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

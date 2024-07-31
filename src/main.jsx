import React from 'react';
import ReactDOM from 'react-dom/client';
import { NextUIProvider } from '@nextui-org/react';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import './index.css';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import UserForm from './pages/User/UserForm';
import Login from './pages/login/Login';
import CounterDash from './pages/Counter/CounterDash';
import AdminDashPage from './pages/Admin/AdminDashPage'
import Staff from './pages/Admin/Staff';
import Counter from './pages/Admin/Counter'
import TVView from './pages/TVView/TVView';
import ConfirmationPage from './pages/User/Confirmation';
import Ads from './pages/Admin/Ads';
import Services from './pages/Admin/Services';
import { AuthProvider } from './Context/AuthContext';
import Reports from './pages/Admin/Reports';
import { SpeechProvider } from './Context/SpeechContext';
import SpeechHandler from './SpeechHandler';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/userForm',
    element: <UserForm />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/:counterName',
    element: <CounterDash />,
  },
  {
    path: '/adminDash',
    element: <AdminDashPage />,
  },
  {
    path: '/counter',
    element: <Counter />,
  },
  {
    path: '/staff',
    element: <Staff />,
  },
  {
    path: '/tvView',
    element: <TVView />
  },
  {
    path: '/Confirmation',
    element: <ConfirmationPage />,
  },
  {
    path: '/ads',
    element: <Ads />,
  },
  {
    path:'/Services',
    element:<Services/>,
  },
  {
    path:'/Reports',
    element:<Reports/>,
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
    <SpeechProvider>
    <SpeechHandler />
      <NextUIProvider>
        <RouterProvider router={router} />
      </NextUIProvider>
      </SpeechProvider>
    </AuthProvider>
  </React.StrictMode>,
);

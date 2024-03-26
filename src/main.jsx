// main.tsx or main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { NextUIProvider } from '@nextui-org/react';
import App from './App';
import './index.css';
import {
  createBrowserRouter,
  RouterProvider,
  Link,
} from 'react-router-dom';
import UserForm from './User/UserForm'
import AdminDash from './Admin/AdminDash'
import CounterDash from './Counter/CounterDash'

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
    path: '/adminDash',
    element: <AdminDash />,
  },
  {
    path: '/counterDash',
    element: <CounterDash />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NextUIProvider>
      <RouterProvider router={router} />
    </NextUIProvider>
  </React.StrictMode>,
);

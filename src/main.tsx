import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import App from './App';
import Layout from './layouts/dashboard';
import DashboardPage from './pages';
// import EmployeesCrudPage from './pages/employees';
import SignInPage from './pages/signin';
import BooksCrudPage from './pages/books';
import inventoryPage from './pages/inventory';
import BulkImportsPage from './pages/bulkImport';
const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          {
            path: '',
            Component: DashboardPage,
          },
          {
            path: 'inventory',
            Component: inventoryPage,
          },
          { // Add this new route for books
            path: 'books/:bookId?/*', // This will handle paths like /books, /books/123, /books/123/edit
            Component: BooksCrudPage,
          },
          {
            path: 'imports',
            Component: BulkImportsPage,
          },
        ],
      },
      {
        path: '/sign-in',
        Component: SignInPage,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
import * as React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import { Outlet } from 'react-router';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import type { Navigation, Authentication } from '@toolpad/core/AppProvider';
import { firebaseSignOut, onAuthStateChanged, isEmailAllowed } from './firebase/auth';
import SessionContext, { type Session } from './SessionContext';
import BookIcon from '@mui/icons-material/Book';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
const NAVIGATION: Navigation = [
  {
    kind: 'header',
    title: 'Main items',
  },
  {
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  
  {
    segment: 'books',
    title: 'Add/Edit',
    icon: <AutoStoriesIcon />,
    pattern: 'books{/:bookId}*',
  },
  {
    segment: 'inventory',
    title: 'Books',
    icon: <BookIcon />,
    // pattern: 'employees{/:employeeId}*',
  },
];

const BRANDING = {
  title: "Library System",
  logo : (
    // <img src="../../../logo.png" alt="CHMSU LOGO" className="logo-image" style={{ height: "20vh" }}  />
    <img src="/logo.png" alt="CHMSU LOGO" className="logo-image" style={{ height: "20vh" }}  />
  )
};

const AUTHENTICATION: Authentication = {    
  signIn: () => {},
  signOut: firebaseSignOut,
};

export default function App() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  const sessionContextValue = React.useMemo(
    () => ({
      session,
      setSession,
      loading,
    }),
    [session, loading],
  );

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      if (user && user.email && isEmailAllowed(user.email)) {
        setSession({
          user: {
            name: user.name || '',
            email: user.email || '',
            image: user.image || '',
          },
        });
      } else {
        // If user exists but email not allowed, sign them out
        if (user && (!user.email || !isEmailAllowed(user.email))) {
          firebaseSignOut();
        }
        setSession(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ReactRouterAppProvider
      navigation={NAVIGATION}
      branding={BRANDING}
      session={session}
      authentication={AUTHENTICATION}
    >
      <SessionContext.Provider value={sessionContextValue}>
        <Outlet />
      </SessionContext.Provider>
    </ReactRouterAppProvider>
  );
}
import '../src/index.css';
import { AppProvider } from '../src/context/AppContext';
import AppShell from '../src/components/AppShell';

export const metadata = {
  title: 'ReliefOS | Disaster Response Command',
  description: 'ReliefOS: Intelligent disaster response coordination platform finding who needs help most and allocating scarce resources first.',
  keywords: ['ReliefOS', 'Disaster Response', 'Emergency Management', 'Resource Allocation', 'Citizen SOS', 'Relief Coordination'],
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden">
        <AppProvider>
          <AppShell>
            {children}
          </AppShell>
        </AppProvider>
      </body>
    </html>
  );
}

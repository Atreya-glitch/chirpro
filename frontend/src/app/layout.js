import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import ToastProvider from '@/context/ToastProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TweetApp',
  description: 'Twitter-like subscription platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

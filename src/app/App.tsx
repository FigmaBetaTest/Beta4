import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: '13px',
            borderRadius: '0px',
            border: '1px solid #d1d5db',
            background: '#FFFFFF',
            color: '#1F1F1F',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
          classNames: {
            success: '',
            error: '',
            info: '',
            warning: '',
          },
        }}
        style={
          {
            '--success-bg': '#FFFFFF',
            '--success-border': '#C5143D',
            '--success-text': '#1F1F1F',
            '--error-bg': '#FFFFFF',
            '--error-border': '#C5143D',
            '--error-text': '#1F1F1F',
          } as React.CSSProperties
        }
      />
    </>
  );
}
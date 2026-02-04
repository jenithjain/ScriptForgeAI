'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{ top: '80px' }}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '14px',
          maxWidth: '500px',
        },
        // Success toast style
        success: {
          duration: 3000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid rgb(34 197 94 / 0.3)',
          },
          iconTheme: {
            primary: 'rgb(34 197 94)',
            secondary: 'hsl(var(--card))',
          },
        },
        // Error toast style
        error: {
          duration: 5000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid rgb(239 68 68 / 0.3)',
          },
          iconTheme: {
            primary: 'rgb(239 68 68)',
            secondary: 'hsl(var(--card))',
          },
        },
        // Loading toast style
        loading: {
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid rgb(20 184 166 / 0.3)',
          },
          iconTheme: {
            primary: 'rgb(20 184 166)',
            secondary: 'hsl(var(--card))',
          },
        },
      }}
    />
  );
}

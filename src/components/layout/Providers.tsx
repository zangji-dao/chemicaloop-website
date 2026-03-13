'use client';

import { AgentLinkProvider } from '@/hooks/useAgentLink';
import { AuthProvider } from '@/hooks/useAuth';
import { DialogProvider } from '@/components/ui/DialogContext';
import { ToastProvider } from '@/components/ui/Toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AgentLinkProvider>
        <DialogProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </DialogProvider>
      </AgentLinkProvider>
    </AuthProvider>
  );
}

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AgentLinkContextType {
  agentCode: string | null;
  setAgentCode: (code: string | null) => void;
  clearAgentCode: () => void;
}

const AgentLinkContext = createContext<AgentLinkContextType | undefined>(undefined);

export function AgentLinkProvider({ children }: { children: ReactNode }) {
  const [agentCode, setAgentCodeState] = useState<string | null>(null);

  // 初始化时从 URL 查询参数或 localStorage 读取 agent code
  useEffect(() => {
    const loadAgentCode = () => {
      // 尝试从 URL 查询参数获取
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const codeFromUrl = urlParams.get('agent');
        
        if (codeFromUrl) {
          setAgentCodeState(codeFromUrl);
          localStorage.setItem('agent_code', codeFromUrl);
          return;
        }
        
        // 尝试从 localStorage 获取
        const codeFromStorage = localStorage.getItem('agent_code');
        if (codeFromStorage) {
          setAgentCodeState(codeFromStorage);
        }
      }
    };

    loadAgentCode();
  }, []);

  const setAgentCode = (code: string | null) => {
    setAgentCodeState(code);
    if (code) {
      localStorage.setItem('agent_code', code);
    }
  };

  const clearAgentCode = () => {
    setAgentCodeState(null);
    localStorage.removeItem('agent_code');
  };

  const value: AgentLinkContextType = {
    agentCode,
    setAgentCode,
    clearAgentCode,
  };

  return <AgentLinkContext.Provider value={value}>{children}</AgentLinkContext.Provider>;
}

export function useAgentLink() {
  const context = useContext(AgentLinkContext);
  
  if (context === undefined) {
    throw new Error('useAgentLink must be used within an AgentLinkProvider');
  }
  
  return context;
}

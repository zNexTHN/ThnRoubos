import { useEffect, useCallback } from 'react';

// Tipagem das mensagens recebidas do Lua
export interface NUIMessage {
  action: string;
  [key: string]: any;
}

// Hook para escutar mensagens do FiveM
export function useFiveMListener(callback: (data: NUIMessage) => void) {
  useEffect(() => {
    const handler = (event: MessageEvent<NUIMessage>) => {
      if (event.data && event.data.action) {
        callback(event.data);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [callback]);
}

// Função para enviar callbacks para o Lua
export function sendCallback(name: string, data: object = {}) {
  // Em produção (FiveM)
  if (typeof (window as any).GetParentResourceName === 'function') {
    fetch(`https://${(window as any).GetParentResourceName()}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } else {
    // Em desenvolvimento (browser)
    console.log(`[NUI Callback] ${name}:`, data);
  }
}

// Hook combinado
export function useFiveM() {
  const send = useCallback((name: string, data?: object) => {
    sendCallback(name, data || {});
  }, []);

  return { send };
}

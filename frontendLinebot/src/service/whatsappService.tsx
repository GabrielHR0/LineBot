const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4006';

export const whatsappService = {
  // Inicializar o bot
  async initBot(botName = 'lineBot') {
    try {
      const response = await fetch(`${API_BASE_URL}/bot/v1/init`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      console.error('Erro ao inicializar bot:', error);
      throw error;
    }
  },

  // Obter QR code
  async getQRCode(botName = 'lineBot') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      
      const response = await fetch(`${API_BASE_URL}/bot/v1/qrcode/${botName}`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao obter QR code:', error);
      throw error;
    }
  },

  // Verificar status do cliente
  async checkStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/bot/v1/status`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return { 
        connected: data.connected || false, 
        hasClient: data.hasClient || false,
        error: null
      };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      // Retorna status desconectado em caso de erro
      return { 
        connected: false, 
        hasClient: false,
        error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
      };
    }
  },

  // Resetar cliente
  async resetClient() {
    try {
      const response = await fetch(`${API_BASE_URL}/bot/v1/reset`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      console.error('Erro ao resetar cliente:', error);
      throw error;
    }
  },

  async forceDisconnect() {
    try {
      const response = await fetch(`${API_BASE_URL}/bot/v1/force-disconnect`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      console.error('Erro ao forçar desconexão:', error);
      throw error;
    }
  },

  // Desconectar
  async disconnect() {
    try {
      const response = await fetch(`${API_BASE_URL}/bot/v1/disconnect`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      throw error;
    }
  },

  // Fazer logout completo
  async logout() {
    try {
      const response = await fetch(`${API_BASE_URL}/bot/v1/logout`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  },

  // Verificar se existe sessão ativa
  async checkSession() {
    try {
      const response = await fetch(`${API_BASE_URL}/bot/v1/status`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const status = await response.json();
      
      // Se está conectado mas não deveria, força desconexão
      if (status.connected) {
        return { hasActiveSession: true, connected: true };
      }
      
      return { hasActiveSession: false, connected: false };
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      return { hasActiveSession: false, connected: false };
    }
  }

};

// Exportação padrão também para compatibilidade
export default whatsappService;
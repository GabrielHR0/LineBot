const router = require("express").Router();
const { Client, LocalAuth, MessageMedia} = require("whatsapp-web.js");
const QRCode = require("qrcode");
const Bot = require("../model/Bot");
const Oracle = require("../model/Oracle");
const PoolContact = require("../model/PoolContact");
const fs = require("fs");
const path = require("path");

const poolContact = new PoolContact();
const onHoldContacts = new PoolContact();

let client = null;
let bot = null;
let isClientReady = false;
let qrRefreshInterval = null;
let currentQrCode = null;

// ✅ Função para verificar status detalhado do cliente
function getClientStatus() {
  return {
    connected: isClientReady && client !== null,
    clientId: client?.authStrategy?.clientId || null,
    hasClient: client !== null,
    state: client?.state || 'NO_CLIENT',
    isAuthenticated: client?.info?.wid !== undefined,
    status: isClientReady ? "ATIVO" : client ? "AGUARDANDO_QR" : "SEM_CLIENTE"
  };
}

// ✅ Função para resetar cliente
async function resetClient() {
  console.log("🔄 Iniciando reset do cliente...");
  
  // Limpa intervalo de refresh se existir
  if (qrRefreshInterval) {
    clearInterval(qrRefreshInterval);
    qrRefreshInterval = null;
  }
  
  currentQrCode = null;
  
  if (client) {
    console.log(`Finalizando instância do cliente ${client.authStrategy?.clientId}...`);
    try {
      // Tenta destruir graciosamente primeiro
      try {
        await client.destroy();
        console.log("✅ Cliente destruído com sucesso");
      } catch (destroyError) {
        console.log("⚠️ Erro ao destruir cliente graciosamente:", destroyError.message);
        // Força limpeza se necessário
        if (client.pupBrowser) {
          try {
            await client.pupBrowser.close();
            console.log("✅ Navegador fechado forçadamente");
          } catch (closeError) {
            console.log("⚠️ Erro ao fechar navegador:", closeError.message);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao destruir o cliente:", error);
    } finally {
      client = null;
    }
  }
  
  isClientReady = false;
  
  // Limpa sessão local para forçar novo QR
  try {
    const sessionPath = path.join(__dirname, '../.wwebjs_auth');
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log("✅ Sessão local removida");
    }
  } catch (cleanError) {
    console.log("⚠️ Erro ao limpar sessão:", cleanError.message);
  }
  
  console.log("✅ Reset do cliente concluído");
}

// ✅ Inicia Bot
router.get("/init", async (req, res) => {
  try {
    const bot_name = "lineBot";
    bot = new Bot(bot_name, new Oracle(`http://localhost:${process.env.MIDDLEWARE_PORT}`));
    await bot.loadPage(bot_name);
    console.log("Bot inicializado:", bot_name);
    res.send({ 
      success: true, 
      bot: { 
        name: bot.name, 
        page: bot.page 
      } 
    });
  } catch (error) {
    console.error("Erro ao inicializar bot:", error);
    res.status(500).send({ 
      success: false, 
      error: "Erro ao inicializar bot" 
    });
  }
});

// ✅ Obter contato atual
router.get("/getContact", async (req, res) => {
  try {
    if (!bot) {
      return res.status(400).send({ error: "Bot não inicializado" });
    }
    const contact = bot.getContact();
    res.send({ success: true, contact });
  } catch (error) {
    console.error("Erro ao obter contato:", error);
    res.status(500).send({ error: "Erro ao obter contato" });
  }
});

// ✅ Status detalhado do cliente
router.get("/status", (req, res) => {
  try {
    const status = getClientStatus();
    console.log("Status atual:", status);
    res.send({ 
      success: true, 
      ...status 
    });
  } catch (error) {
    console.error("Erro ao verificar status:", error);
    res.status(500).send({ 
      success: false, 
      error: "Erro ao verificar status" 
    });
  }
});

// ✅ Status de debug completo
router.get("/debug-status", (req, res) => {
  try {
    res.send({
      isClientReady,
      clientExists: !!client,
      clientState: client?.state,
      clientInfo: client?.info,
      pupPageOpen: client?.pupPage && !client.pupPage.isClosed(),
      authStrategy: client?.authStrategy ? {
        clientId: client.authStrategy.clientId,
        store: typeof client.authStrategy.store
      } : null,
      timestamp: new Date().toISOString(),
      sessionExists: fs.existsSync(path.join(__dirname, '../.wwebjs_auth'))
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ✅ Ping simples para verificar se o servidor está online
router.get("/ping", (req, res) => {
  res.send({ 
    status: "online", 
    timestamp: new Date().toISOString(),
    clientReady: isClientReady,
    clientStatus: getClientStatus().status
  });
});

// ✅ Geração do QR Code CORRIGIDA
router.get("/qrcode/:bot_name", async (req, res) => {
  const bot_name = req.params.bot_name;
  console.log("Solicitando QR code para:", bot_name);
  
  // Verifica se já está conectado
  const currentStatus = getClientStatus();
  if (currentStatus.connected) {
    console.log("Cliente já está conectado. Não é necessário QR code.");
    return res.status(400).send({ 
      error: "Cliente já está conectado",
      status: currentStatus 
    });
  }

  try {
    // Só reseta se já existir um cliente
    if (client) {
      await resetClient();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    client = new Client({
      authStrategy: new LocalAuth({ clientId: bot_name }),
      puppeteer: { 
        headless: true, 
        args: [
          "--no-sandbox", 
          "--disable-setuid-sandbox", 
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-software-rasterizer",
          "--single-process"
        ]
      }
    });

    let qrSent = false;
    let qrGenerated = false;

    // Limpa intervalo anterior se existir
    if (qrRefreshInterval) {
      clearInterval(qrRefreshInterval);
      qrRefreshInterval = null;
    }

    client.once("qr", async (qr) => {
      try {
        qrGenerated = true;
        currentQrCode = qr;
        console.log("✅ Novo QR code gerado");
        
        const base64Qr = await QRCode.toDataURL(qr);
        if (!isClientReady && !qrSent) { 
          qrSent = true;
          res.send({ 
            success: true,
            qrcode: base64Qr, 
            name: bot_name,
            expires_in: 40
          });
        }
      } catch (error) {
        console.error("Erro ao gerar QR code:", error);
        if (!isClientReady && !qrSent) {
          qrSent = true;
          res.status(500).send({ 
            success: false,
            error: "Erro ao gerar QR code" 
          });
        }
      }
    });

    // ✅ CORREÇÃO: Apenas verifica periodicamente se precisa renovar
    qrRefreshInterval = setInterval(() => {
      if (!isClientReady && client && !qrGenerated) {
        console.log("⏳ Aguardando QR code...");
      }
    }, 30000);

    client.once("ready", () => {
      console.log("✅ Cliente pronto para uso!");
      isClientReady = true;
      if (qrRefreshInterval) {
        clearInterval(qrRefreshInterval);
        qrRefreshInterval = null;
      }
      currentQrCode = null;
    });

    client.on("authenticated", () => {
      console.log(`✅ Bot ${bot_name} autenticado`);
    });

    client.on("disconnected", async (reason) => {
      console.log("❌ Cliente desconectado:", reason);
      isClientReady = false;
      if (qrRefreshInterval) {
        clearInterval(qrRefreshInterval);
        qrRefreshInterval = null;
      }
      
      // Limpa sessão em caso de desconexão
      try {
        const sessionPath = path.join(__dirname, '../.wwebjs_auth');
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
          console.log("✅ Sessão removida após desconexão");
        }
      } catch (cleanError) {
        console.log("⚠️ Erro ao limpar sessão:", cleanError.message);
      }
    });

    client.on("auth_failure", (msg) => {
      console.log("❌ Falha na autenticação:", msg);
      isClientReady = false;
    });

    // ✅ Adicionar tratamento de erro no cliente
    client.on("error", (error) => {
      console.error("❌ Erro no cliente WhatsApp:", error);
    });

    // Inicializa o cliente
    await client.initialize();
    console.log("Cliente inicializado, aguardando QR code...");

    // Inicia a escuta de mensagens
    start(client);

    // Timeout para evitar requisições pendentes
    setTimeout(() => {
      if (!qrGenerated && !qrSent) {
        if (qrRefreshInterval) {
          clearInterval(qrRefreshInterval);
          qrRefreshInterval = null;
        }
        if (!qrSent) {
          qrSent = true;
          res.status(408).send({ 
            success: false,
            error: "Timeout ao gerar QR code. Tente novamente." 
          });
        }
      }
    }, 45000);

  } catch (error) {
    console.error("Erro ao inicializar o cliente:", error);
    if (!res.headersSent) {
      res.status(500).send({ 
        success: false,
        error: "Erro ao inicializar cliente WhatsApp" 
      });
    }
  }
});

// ✅ Obter QR code atual
router.get("/current-qrcode", async (req, res) => {
  try {
    if (currentQrCode) {
      const base64Qr = await QRCode.toDataURL(currentQrCode);
      res.send({ 
        success: true,
        qrcode: base64Qr, 
        expires_in: 40 
      });
    } else {
      res.status(404).send({ 
        success: false,
        error: "Nenhum QR code disponível" 
      });
    }
  } catch (error) {
    console.error("Erro ao gerar QR code:", error);
    res.status(500).send({ 
      success: false,
      error: "Erro ao gerar QR code" 
    });
  }
});

// ✅ Renovar QR code de forma segura
router.get("/renew-qrcode", async (req, res) => {
  try {
    console.log("🔄 Solicitando renovação segura de QR code...");
    
    await resetClient();
    
    // Pequena pausa para garantir limpeza completa
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    res.send({ 
      success: true, 
      message: "Cliente resetado. Solicite um novo QR code.",
      requiresNewRequest: true 
    });
    
  } catch (error) {
    console.error("❌ Erro ao renovar QR code:", error);
    res.status(500).send({ 
      success: false, 
      error: "Erro ao renovar QR code" 
    });
  }
});

// ✅ Função de mensagens
function start(client) {
  client.on("message", async (message) => {
    console.log(`\n📩 Mensagem recebida de ${message.from}: ${message.body}\n`);
    
    if (!onHoldContacts.isContact(message.from) && !message.from.includes("@g.us") &&
        [
          "558487839972@c.us",
          /*"558496531316@c.us",
          "558498332858@c.us",
          "558498079359@c.us",
          "558499008989@c.us",
          "558496345257@c.us"*/
        ].includes(message.from)
  ) {
      try {
        let from = message.from;
        let text = message.body.toLowerCase(); 
        let name = message._data.notifyName;
        let contact;

        if (!poolContact.isContact(from)) {
          contact = await poolContact.newContact(name, from);
        } else {
          contact = await poolContact.getContact(from);
        }

        if (bot) {
          await bot.receive(contact, text);

          let pendingToDelivery = contact.getPendingToDelivery();

           const mimeExtensionMap = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'audio/ogg': 'ogg',    
            'audio/mpeg': 'mp3',
            'audio/wav': 'wav',
            'video/mp4': 'mp4',
          };

          for (const element of pendingToDelivery) {
            if (element.text){
              await client.sendMessage(from, element.text);
            }
            console.log(`📤 Mensagem enviada para ${from}: ${element.text}`);

            if (element.media) {
              for (const media of element.media) {
                const extension = mimeExtensionMap[media.mimeType] || 'bin';
                const fileName = `file.${extension}`;
                const messageMedia = new MessageMedia(media.mimeType, media.data, fileName);
          
                // Configura as opções de envio
                const options = {};
                if (media.mimeType === 'video/mp4' && media.sendAsGif) {
                  options.sendVideoAsGif = true;
                }
                // Se for áudio e estiver em OGG, envia como voice note
                if (media.mimeType === 'audio/ogg') {
                  options.sendAudioAsVoice = true;
                }
                await client.sendMessage(from, messageMedia, options);
              }
            }
          }
          } else {
            console.log("⚠️ Bot não inicializado, ignorando mensagem");
          }
      } catch (error) {
        console.error("Erro ao processar mensagem:", error);
      }
    }
  });

  console.log("✅ Escuta de mensagens iniciada");
}

// ✅ Pausar contato
router.get("/holdContact/:number", async (req, res) => {
  try {
    const number = req.params.number;
    console.log("Pausando contato:", number);
    
    const contact = await poolContact.getContact(number);
    if (contact) {
      onHoldContacts.addContact(contact);
      await poolContact.removeContact(number);
      res.status(200).json({ 
        success: true,
        message: `Contato pausado com sucesso.` 
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: "Contato não encontrado" 
      });
    }
  } catch (error) {
    console.error("Erro ao pausar contato:", error);
    res.status(500).json({ 
      success: false,
      error: "Erro ao pausar contato" 
    });
  }
});

// ✅ Retornar contato
router.get("/openContact/:number", async (req, res) => {
  try {
    const number = req.params.number;
    console.log("Retomando contato:", number);
    
    const contact = await onHoldContacts.getContact(number);
    if (contact) {
      await onHoldContacts.removeContact(number);
      poolContact.addContact(contact);
      res.status(200).json({ 
        success: true,
        message: `Contato retomado com sucesso.` 
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: "Contato não encontrado" 
      });
    }
  } catch (error) {
    console.error("Erro ao retomar contato:", error);
    res.status(500).json({ 
      success: false,
      error: "Erro ao retomar contato" 
    });
  }
});

// ✅ Resetar cliente
router.get("/reset", async (req, res) => {
  try {
    console.log("Reiniciando cliente...");
    await resetClient();
    res.send({ 
      success: true,
      message: "Cliente reiniciado com sucesso.", 
      status: getClientStatus() 
    });
  } catch (error) {
    console.error("Erro no reset:", error);
    res.status(500).send({ 
      success: false,
      error: "Erro ao reiniciar cliente", 
      status: getClientStatus() 
    });
  }
});

// ✅ Enviar mensagem manualmente
router.put("/message", async (req, res) => {
  try {
    let { text, from, name } = req.body;

    if (!text || !from) {
      return res.status(400).send({ 
        success: false,
        error: "Texto e remetente são obrigatórios" 
      });
    }

    if (onHoldContacts.isContact(from)) {
      return res.send({ 
        success: true,
        from: from, 
        text: text 
      });
    }

    let contact;
    if (!poolContact.isContact(from)) {
      contact = await poolContact.newContact(name, from);
    } else {
      contact = await poolContact.getContact(from);
    }

    if (bot) {
      await bot.receive(contact, text);
      let pendingToDelivery = contact.getPendingToDelivery();
      let txt = pendingToDelivery.map(element => element.text).join("");
      
      console.log("Mensagens pendentes:", pendingToDelivery);
      res.send({ 
        success: true,
        from: from, 
        text: txt 
      });
    } else {
      res.status(400).send({ 
        success: false,
        error: "Bot não inicializado" 
      });
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res.status(500).send({ 
      success: false,
      error: "Erro ao processar mensagem" 
    });
  }
});

// ✅ Forçar desconexão
router.get("/force-disconnect", async (req, res) => {
  try {
    console.log("Forçando desconexão do WhatsApp...");
    
    const sessionPath = path.join(__dirname, '../.wwebjs_auth');
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log("✅ Sessão local removida");
    }
    
    if (client) {
      await client.destroy().catch(error => 
        console.log("⚠️ Erro ao destruir cliente (ignorado):", error.message)
      );
      client = null;
    }
    
    isClientReady = false;
    
    if (qrRefreshInterval) {
      clearInterval(qrRefreshInterval);
      qrRefreshInterval = null;
    }
    
    currentQrCode = null;
    
    res.send({ 
      success: true, 
      message: "WhatsApp desconectado com força", 
      requiresNewQR: true 
    });
    
  } catch (error) {
    console.error("❌ Erro na desconexão forçada:", error);
    res.status(500).send({ 
      success: false, 
      error: "Erro ao forçar desconexão" 
    });
  }
});

// ✅ Logout completo
router.get("/logout", async (req, res) => {
  try {
    console.log("Realizando logout completo...");
    
    if (client) {
      try {
        await client.logout();
        console.log("✅ Logout realizado via cliente");
      } catch (logoutError) {
        console.log("⚠️ Não foi possível fazer logout via cliente:", logoutError.message);
      }
      
      try {
        await client.destroy();
        console.log("✅ Cliente destruído");
      } catch (destroyError) {
        console.log("⚠️ Erro ao destruir cliente:", destroyError.message);
      }
      
      client = null;
    }
    
    const sessionDir = path.join(__dirname, '../.wwebjs_auth');
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log("✅ Diretório de sessão removido");
    }
    
    isClientReady = false;
    
    if (qrRefreshInterval) {
      clearInterval(qrRefreshInterval);
      qrRefreshInterval = null;
    }
    
    currentQrCode = null;
    
    res.send({ 
      success: true, 
      message: "Logout realizado com sucesso. Necessário novo QR code." 
    });
    
  } catch (error) {
    console.error("❌ Erro no logout:", error);
    res.status(500).send({ 
      success: false, 
      error: "Erro ao fazer logout" 
    });
  }
});

module.exports = router;
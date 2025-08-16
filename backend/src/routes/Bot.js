const router = require("express").Router();
const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");
const Bot = require("../model/Bot");
const Oracle = require("../model/Oracle");
const PoolContact = require("../model/PoolContact");

const poolContact = new PoolContact();
const onHoldContacts = new PoolContact();

let client; 
let bot;
let isClientReady = false;

async function resetClient() {
  if (client) {
    console.log(`Finalizando instância do cliente ${client.authStrategy?.clientId}...`);
    try {
      await client.destroy(); 
    } catch (error) {
      console.error("Erro ao destruir o cliente:", error);
    }
  }
  client = null;
  isClientReady = false; 
  console.log("Cliente finalizado e pronto para uma nova inicialização.");
}

router.get("/init", async (req, res) => {
  const bot_name = "lineBot";
  bot = new Bot(bot_name, new Oracle(`http://localhost:${process.env.MIDDLEWARE_PORT}`));
  await bot.loadPage(bot_name);
  console.log("nome do bot:", bot_name);
  res.send({ bot: { name: bot.name, page: bot.page } });
  console.log("nome do bot dps do send:", bot.name);
});

router.get("/getContact", async (req, res) => {
  res.send(bot.getContact());
})

router.get("/qrcode/:bot_name", async (req, res) => {
  const bot_name = req.params.bot_name;
  console.log("nome do bot qr:", bot_name, req.params.bot_name);
  if (isClientReady) {
    console.log("Cliente já está pronto. Operação de inicialização não necessária.");
    return res.status(400).send({ error: "Cliente já está pronto." });
  }

  try {
    await resetClient(); // cliente anterior foi finalizado
    client = new Client({
      authStrategy: new LocalAuth({ clientId: bot_name }),
      puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] }
    });

    client.once("qr", async (qr) => {
      try {
        const base64Qr = await QRCode.toDataURL(qr);
        if (!isClientReady) { 
          res.send({ qrcode: base64Qr, name: bot_name });
        }
      } catch (error) {
        console.error("Erro ao gerar o QR code em Base64:", error);
        if (!isClientReady) {
          return res.status(500).send({ error: "Erro ao gerar o QR code" });
        }
      }
    });

    client.once("ready", () => {
      console.log("Pode usar!");
      isClientReady = true; 
    });

    client.on("authenticated", () => {
      console.log(`Bot ${bot_name} autenticado`);
    });

    client.on("disconnected", async (reason) => {
      console.log("Cliente desconectado:", reason);
      await resetClient(); 
    });

    await client.initialize(); 
    start(client);
  } catch (error) {
    console.error("Erro ao inicializar o cliente:", error);
    if (!isClientReady) { 
      return res.status(500).send({ error: "Erro ao inicializar o cliente" });
    }
  }
});

function start(client) {
  client.on("message", async (message) => {
    console.log(`\n\nMensagem recebida de ${message.from}: ${message.body}\n\n`);
    if (
        //poolContact.isContact(message.from) &&
        !onHoldContacts.isContact(message.from) && 
        !message.from.includes("@g.us")
    ) {
      let from = message.from;
      let text = message.body.toLowerCase(); 
      let name = message._data.notifyName;
      let contact;

      if (!poolContact.isContact(from)) {
        contact = await poolContact.newContact(name, from);
      } else {
        contact = await poolContact.getContact(from);
      }

      await bot.receive(contact, text);

      let pendingToDelivery = contact.getPendingToDelivery();
      for (const message of pendingToDelivery) {
        await client.sendMessage(from, message.text);
        //await new Promise(resolve => setTimeout(resolve, 1000)); // Opcional: delay de 1s entre mensagens
      }
    }
  });
}

router.get("/holdContact/:number", async (req, res) => {
  const number = req.params.number;
  console.log("Contato recebido:", number);

  const contact = await poolContact.getContact(number);
  onHoldContacts.addContact(contact);
  await poolContact.removeContact(number);
  res.status(200).json({ message: `Contato ${contact} pausado com bot com sucesso.` });
})

router.get("/openContact/:number", async (req, res) => {
  const number = req.params.number;
  const contact = await onHoldContacts.getContact(number);
  await onHoldContacts.removeContact(number);
  poolContact.addContact(contact);
  res.status(200).json({ message: `Contato ${contact} retornado com bot com sucesso.` });
})


router.get("/reset", async (req, res) => {
  await resetClient();
  res.send({ message: "Cliente reiniciado com sucesso." });
});

router.put("/message", async (req, res) => {
  let { text, from, name } = req.body;

  let contact;

  if(onHoldContacts.isContact(from)){
    return res.send({ from: from, text: txt });
  }

  if (!poolContact.isContact(from)) {
    contact = await poolContact.newContact(name, from);
  } else {
    contact = await poolContact.getContact(from);
  }

  await bot.receive(contact, text);

  let pendingToDelivery = contact.getPendingToDelivery();
  
  let txt = pendingToDelivery.map(element => element.text).join("");
  console.log("pendingToDelivery: ", pendingToDelivery);
  res.send({ from: from, text: txt });
});

module.exports = router;

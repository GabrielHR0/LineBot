# LineBot0.1

Este projeto é composto por múltiplos módulos. Para rodar corretamente, siga as instruções abaixo.

## Instalação das dependências

Acesse cada módulo e instale as dependências com:

```bash
cd <nome-do-módulo>
npm install
```

## Execução dos módulos principais

Para rodar o backend e o LineBot, execute:

```bash
cd backend
npm start
```

```bash
cd linebot
npm start
# ou
npm run dev
```

É necessário que pelo menos o backend e o linebot estejam rodando.

## Integração com o frontend

Para integrar com o frontend, você pode rodar o módulo "Erp ..." com:

```bash
cd ERP para Ateliê Katelie com gestão de bot e produtos
npm run dev
```

Nesse caso, acesse a rota http://localhost:5173

Ou acessar o frontend diretamente:

```bash
cd frontend
npm start
```

Depois, acesse a rota:

```
http://localhost:3003/bot/lineBot
```

## Observações

- Certifique-se de instalar as dependências de todos os módulos antes de iniciar.

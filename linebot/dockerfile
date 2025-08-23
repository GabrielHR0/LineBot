# Usa a imagem oficial do Node
FROM node:18

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas arquivos de dependências primeiro (melhora o cache do Docker)
COPY package*.json ./

# Instala dependências (production ou dev)
RUN npm install --production

# Copia o restante do código do projeto
COPY . .

# Expõe a porta usada pelo app (8080)
EXPOSE 8080

# Comando para rodar a aplicação
CMD ["npm", "start"]

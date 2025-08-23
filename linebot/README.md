O LineBot é um sistema modular de atendimento automatizado, desenvolvido especialmente para gerenciar 
pedidos e interações com clientes de um ateliê (o Katelie Enxovais) através do WhatsApp. 
Ele permite que os clientes montem kits personalizados, consultem orçamentos anteriores e agendem visitas, 
tudo por meio de uma estrutura lógica definida em JSON.

O LineBot atua como back-end lógico e gerenciador de fluxo, enquanto o WhatBot 
(outro módulo do projeto) funciona como a camada de integração com o WhatsApp, 
que possui um protocolo próprio de comunicação e,
utiliza a biblioteca whatsapp-web.js.

 Funcionalidades
        LineBot
            Cadastro de produtos e subprodutos (ex: um Kit Berço é composto por travesseiro, lençol, etc.)

            Gerencia orçamentos e pedidos de clientes, permitindo que o cliente faça alterações nos produtos 
            e no orçamento antes de finalizar um pedido. (Um orçamento atua como um carrinho de compras);

            Troca dados com o whatBot para seguir um fluxo de atendimento dinâmico baseado nas escolhas do cliente.


        WhatBot
            Conexão direta com o WhatsApp usando whatsapp-web.js

            Gerenciamento de fluxo lógico de atendimento baseado em um arquivo page.json

            Suporte a múltiplos caminhos de decisão com base nas escolhas do cliente

            Geração de QR Code para autenticação no whatsapp-web

            Requests no LineBot para gerar mensagens dinâmicas baseadas no retorno

Dependências e middleware:
        express
        mongoose

    desenvolvimento:
        nodemon
        cors
        morgan

Como executar
        Instale as dependências:

            npm install
            Execute o servidor em modo desenvolvimento:

            npm run dev
            Isso executa o arquivo server.js com nodemon.


🤝 Contribuição
Este projeto é educacional e em constante evolução. O protocolo do whatBot foi desenvolvido em conjunto com um professor
da minha faculdade. Caso também queira contribuir com melhorias sinta-se à vontade para abrir uma issue ou pull request.
Dicas ou criticas também são bem-vindas.


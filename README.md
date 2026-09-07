# Portal Institucional — Guarda Municipal (v2.0)

Reformulação do site institucional a partir do conteúdo original, mantendo textos, seções e
propósito já existentes (Sobre, Serviços, Notícias, Recursos, Contato), agora com identidade
visual mais profissional, responsividade completa e um painel administrativo demonstrativo.

## Stack

- **Vite** (sem webpack) — dev server e build de produção
- **HTML + CSS + JavaScript puro** (sem frameworks)
- **JavaScript sem HTML embutido**: toda a marcação vive no `index.html`; o `app.js` só manipula
  o DOM (querySelector, `<template>`, clonagem de nós) — nada de `innerHTML` com strings de tags
- **Fontes locais**: Ubuntu Sans (variável + itálica) em `assets/fonts`, carregadas via `@font-face`
- **Ícones locais**: sprite SVG inline no próprio `index.html` (`<symbol>`), sem dependência de CDN
- **Sem backend**: o painel administrativo grava tudo em `localStorage` (propósito de portfólio)

## Estrutura

```
index.html          → página única (site público + painel admin + modais + sprite de ícones)
app.js               → toda a lógica (renderização, formulário, upload de imagem, localStorage)
style.css            → estilos (design tokens, layout, responsividade)
assets/fonts/        → fontes Ubuntu Sans (.ttf)
imagens/             → logotipo e imagens do site (banner com a viatura, fotos de notícias)
```

## Como rodar

```bash
npm install
npm run dev       # ambiente de desenvolvimento (abre no navegador)
npm run build     # gera a versão de produção em dist/
npm run preview   # serve a build de produção localmente
```

## O que foi reformulado / adicionado

- **Banner principal** com a foto da viatura, chamada de emergência (151) e call-to-action.
- **Layout responsivo de ponta a ponta**: menu com sanduíche no mobile, grades que se
  reorganizam em telas menores, formulários e painel administrativo adaptados a qualquer largura.
- **Seção "A Guarda"** com pilares institucionais (presença, prevenção, respeito).
- **Cartões de serviços** numerados, com ícones, destacando as atribuições da Guarda.
- **Notícias dinâmicas**: cartões carregados do `localStorage`, com destaque para a mais recente,
  modal de leitura completa e opção "ver todas".
- **Recursos e documentos** (links demonstrativos para manuais, legislação e editais).
- **Formulário de contato** com validação nativa e feedback visual (toast), preservando os campos
  originais (nome, e-mail, mensagem) e adicionando "assunto" para melhor triagem.
- **Painel administrativo** (`/#painel`, acessível pelo topo ou rodapé do site):
  - Dashboard com estatísticas (total de notícias, publicadas, com imagem).
  - CRUD completo de notícias: criar, editar, excluir, marcar como destaque.
  - Upload de imagem com pré-visualização, redimensionamento automático (canvas) e
    compressão para caber no `localStorage`.
  - Busca e filtro por categoria.
  - Confirmação antes de excluir, notificações (toast) de sucesso/erro.
  - Botão para restaurar o conteúdo de demonstração original.
  - Aviso claro de "modo demonstração" (dados ficam só no navegador do usuário).
  - **Tela de login fictícia** antes de liberar o painel (protege o acesso na demonstração
    para o cliente, sem backend ainda):
    - E-mail: `admin@guardamunicipal.gov.br`
    - Senha: `guarda2026`
    - O login fica guardado só na memória da página (não usa `sessionStorage`/`localStorage`),
      então **o formulário sempre aparece de novo** a cada carregamento da página ou nova
      tentativa de acessar o painel — pensado justamente para a demonstração.
    - Há botão "Sair da conta" no painel para encerrar a sessão manualmente também.
- **Acessibilidade**: skip-link, `aria-label`/`aria-live` nos pontos certos, foco visível,
  `prefers-reduced-motion` respeitado.

## Próximos passos sugeridos (quando for ligar a um backend)

1. Trocar as funções `loadNews`/`saveNews` em `app.js` por chamadas `fetch` a uma API real.
2. Mover o upload de imagem para um endpoint que grave em disco/armazenamento em nuvem
   (hoje ele salva como base64 no `localStorage`, só para fins de demonstração).
3. Substituir a checagem de `DEMO_ADMIN_CREDENTIALS` (em `app.js`) por uma autenticação real
   (login via API, hash de senha, token JWT/sessão no servidor, etc.). Hoje é só uma simulação
   de interface para apresentar o fluxo ao cliente.

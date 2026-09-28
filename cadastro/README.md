# Sistema de Cadastro de Usuários

Módulo independente do projeto hello-world-project.

## Funcionalidades
- Cadastro de nome, usuário, e-mail e data de nascimento.
- Validação dos campos e confirmação de senha.
- Verificação de usuário e e-mail duplicados.
- Hash SHA-256 da senha antes do armazenamento local.
- Pesquisa e exclusão de usuários.
- Interface responsiva.

## Execução
Abra cadastro/index.html em um navegador moderno.

## Observação
Este é um protótipo local. Os dados ficam no localStorage do navegador; não há servidor, banco de dados ou sessão de login. Para produção, a autenticação e o armazenamento devem ser implementados no backend com armazenamento apropriado de senhas e HTTPS.

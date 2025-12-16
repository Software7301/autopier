# 🚀 Configuração do Supabase para AutoPier

Este guia explica como configurar o banco de dados Supabase para o projeto AutoPier.

## 📋 Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Projeto criado no Supabase
3. URL de conexão do banco de dados

## 🔧 Passo a Passo

### 1. Obter a URL de Conexão do Supabase

1. Acesse o seu projeto no Supabase Dashboard
2. Vá em **Settings** → **Database**
3. Role até a seção **Connection string**
4. Selecione **URI** e copie a string de conexão
5. A URL terá o formato:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.com:5432/postgres
   ```

### 2. Configurar Storage do Supabase (para Upload de Imagens)

1. Acesse o seu projeto no Supabase Dashboard
2. Vá em **Storage** no menu lateral
3. Clique em **Create a new bucket**
4. Configure o bucket:
   - **Name:** `cars`
   - **Public bucket:** ✅ Marque como público (para permitir acesso às imagens)
5. Clique em **Create bucket**
6. Configure as políticas (opcional, mas recomendado):
   - Vá em **Policies** do bucket `cars`
   - Adicione uma política para permitir uploads anônimos ou configure conforme necessário

### 3. Obter Credenciais do Supabase

1. Acesse **Settings** → **API**
2. Copie os seguintes valores:
   - **Project URL** (será `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public** key (será `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 4. Configurar Variáveis de Ambiente

Adicione ou atualize as seguintes variáveis no arquivo `.env`:

```env
# Modo de armazenamento: 'LOCAL' ou 'DATABASE'
STORAGE_MODE=DATABASE

# URL de conexão do Supabase (Database)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.com:5432/postgres

# Credenciais do Supabase (Storage)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]

# URL pública da aplicação (para produção)
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

**⚠️ IMPORTANTE:**
- Substitua `[YOUR-PASSWORD]` pela senha do seu banco de dados
- Substitua `[PROJECT-REF]` pela referência do seu projeto
- Substitua `[YOUR-ANON-KEY]` pela chave anon pública do Supabase
- Se a senha contém caracteres especiais, você pode precisar codificá-la (URL encode)

### 5. Executar Migrações do Prisma

Após configurar a `DATABASE_URL`, execute as migrações:

```bash
# Gerar o cliente Prisma
npx prisma generate

# Executar as migrações no banco de dados
npx prisma migrate dev --name init

# Ou, se preferir usar o Prisma Studio para visualizar os dados:
npx prisma studio
```

### 6. Verificar a Conexão

Após configurar, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

O sistema irá:
- Detectar automaticamente que `STORAGE_MODE=DATABASE`
- Conectar ao Supabase usando a `DATABASE_URL`
- Usar o Prisma ORM para todas as operações de banco de dados

## 🔍 Verificação

Para verificar se está funcionando:

1. Acesse o dashboard: `http://localhost:3000/dashboard`
2. Tente criar um veículo, pedido ou negociação
3. Verifique no Supabase Dashboard → **Table Editor** se os dados foram salvos
4. Teste o upload de imagens:
   - Vá em **Gerenciar Veículos** → **Adicionar Veículo**
   - Faça upload de uma imagem
   - Verifique no Supabase Dashboard → **Storage** → **cars** se a imagem foi salva

## 📝 Estrutura do Banco de Dados

O schema Prisma cria as seguintes tabelas:

- **users** - Usuários (clientes, funcionários, admin)
- **cars** - Veículos do catálogo
- **orders** - Pedidos de compra
- **negotiations** - Negociações entre clientes e concessionária
- **messages** - Mensagens do chat

## 🛠️ Troubleshooting

### Erro: "Can't reach database server"
- Verifique se a `DATABASE_URL` está correta
- Confirme que o projeto Supabase está ativo
- Verifique se há restrições de firewall

### Erro: "Authentication failed"
- Verifique se a senha está correta na URL
- Tente resetar a senha no Supabase Dashboard

### Erro: "Relation does not exist"
- Execute as migrações: `npx prisma migrate dev`
- Verifique se o schema Prisma está atualizado

### Erro: "Erro ao fazer upload da imagem"
- Verifique se o bucket `cars` foi criado no Supabase Storage
- Confirme que as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão configuradas
- Verifique se o bucket está configurado como público
- Em desenvolvimento, o sistema usa armazenamento local como fallback

## 🔐 Segurança

- **NUNCA** commite o arquivo `.env` no Git
- Use variáveis de ambiente na Vercel para produção
- Mantenha a senha do banco de dados segura

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do Prisma](https://www.prisma.io/docs)
- [Guia de Migração do Prisma](https://www.prisma.io/docs/guides/migrate-to-prisma)


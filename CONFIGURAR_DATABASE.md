# 🔧 Configuração do Banco de Dados

## ✅ URL do Banco de Dados Recebida

Você forneceu a seguinte URL do banco de dados:
```
postgresql://postgres:Maxnevida101029@db.uaivigwpwbtmfzyhmcee.supabase.co:5432/postgres
```

## 📝 Passos para Configurar

### 1. Criar arquivo `.env` (se não existir)

No diretório raiz do projeto, crie um arquivo chamado `.env` (sem extensão).

### 2. Adicionar a variável DATABASE_URL

Adicione a seguinte linha no arquivo `.env`:

```env
DATABASE_URL=postgresql://postgres:Maxnevida101029@db.uaivigwpwbtmfzyhmcee.supabase.co:5432/postgres
```

### 3. Configurar outras variáveis necessárias

Certifique-se de também configurar as variáveis do Supabase Storage:

```env
# Modo de armazenamento
STORAGE_MODE=DATABASE

# URL do Supabase (encontre em Settings > API do seu projeto Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://uaivigwpwbtmfzyhmcee.supabase.co

# Anon Key do Supabase (encontre em Settings > API > anon public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=[SUA-ANON-KEY-AQUI]

# URL da aplicação (opcional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ⚠️ Importante - Segurança

1. **NUNCA** faça commit do arquivo `.env` no Git
   - O arquivo já está protegido pelo `.gitignore`
   - Verifique antes de fazer commit: `git status` não deve mostrar `.env`

2. **Para Produção (Vercel)**:
   - Configure as variáveis de ambiente em:
   - Vercel Dashboard → Seu Projeto → Settings → Environment Variables
   - Adicione todas as variáveis lá (não use o arquivo .env em produção)

3. **Senha do Banco**:
   - A senha está visível na URL fornecida
   - Considere alterá-la no Supabase Dashboard se necessário
   - Mantenha a URL segura e não compartilhe publicamente

## 🧪 Testar a Conexão

Após configurar, você pode testar a conexão:

1. Execute as migrações do Prisma (se ainda não executou):
   ```bash
   npx prisma migrate dev
   ```

2. Verifique se o banco está acessível:
   ```bash
   npx prisma db pull
   ```

3. Teste a aplicação:
   ```bash
   npm run dev
   ```

## 📍 Informações Extraídas da URL

Da URL fornecida, identifiquei:
- **Host**: `db.uaivigwpwbtmfzyhmcee.supabase.co`
- **Project Reference**: `uaivigwpwbtmfzyhmcee`
- **Porta**: `5432`
- **Database**: `postgres`
- **Usuário**: `postgres`

Use o **Project Reference** (`uaivigwpwbtmfzyhmcee`) para configurar o `NEXT_PUBLIC_SUPABASE_URL`.

## ✅ Próximos Passos

1. ✅ Criar arquivo `.env` com a `DATABASE_URL`
2. ⏳ Obter `NEXT_PUBLIC_SUPABASE_ANON_KEY` do Supabase Dashboard
3. ⏳ Configurar `NEXT_PUBLIC_SUPABASE_URL` (usando o project reference acima)
4. ⏳ Testar a conexão com `npx prisma migrate dev`
5. ⏳ Configurar variáveis na Vercel para produção


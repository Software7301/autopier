# 🔍 Como Verificar Variáveis de Ambiente

## 📋 Verificação Local (Desenvolvimento)

1. **Crie o arquivo `.env` na raiz do projeto** (copie de `env.example.txt`)

2. **Adicione as variáveis necessárias:**
   ```env
   DATABASE_URL=postgresql://postgres:[SENHA]@db.[PROJECT-REF].supabase.com:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.com
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
   ```

3. **Reinicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Teste a rota de debug:**
   Acesse: `http://localhost:3000/api/debug/env`
   
   Isso mostrará quais variáveis estão configuradas (valores parcialmente ocultos por segurança).

## 🌐 Verificação na Vercel (Produção)

### 1. Verificar Variáveis Configuradas

1. Acesse o painel da Vercel: https://vercel.com
2. Selecione seu projeto **AutoPier**
3. Vá em **Settings** → **Environment Variables**
4. Verifique se as seguintes variáveis estão configuradas:

   ✅ `DATABASE_URL`
   ✅ `NEXT_PUBLIC_SUPABASE_URL`
   ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   ✅ `NEXT_PUBLIC_APP_URL` (opcional)

### 2. Adicionar Variáveis (se não estiverem)

1. Clique em **Add New**
2. Adicione cada variável:
   - **Key:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** `https://[PROJECT-REF].supabase.com`
   - **Environment:** Selecione **Production**, **Preview** e **Development**
   - Clique em **Save**

3. Repita para `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `DATABASE_URL`

### 3. Fazer Novo Deploy

⚠️ **IMPORTANTE:** Após adicionar variáveis, você precisa fazer um novo deploy:

1. Vá em **Deployments**
2. Clique nos três pontos (⋯) do último deploy
3. Selecione **Redeploy**
4. Ou faça um novo commit e push para o GitHub

### 4. Verificar Configuração do Upload

**Nova rota de verificação automática:**

Acesse `/api/upload/check` para verificar o status da configuração:

- **Em desenvolvimento:** `http://localhost:3000/api/upload/check`
- **Em produção:** `https://seu-dominio.vercel.app/api/upload/check`

Esta rota mostrará:
- ✅ Se as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão configuradas
- ✅ Se o bucket `cars` existe no Supabase Storage
- ✅ Instruções específicas do que está faltando

### 5. Verificar Logs

Após o deploy, verifique os logs:

1. Vá em **Deployments** → Selecione o último deploy
2. Clique em **View Function Logs**
3. Procure por mensagens de erro relacionadas a variáveis de ambiente
4. Procure por logs que começam com `🔍 Debug Upload:` para ver o status das variáveis

## 🐛 Troubleshooting

### Erro: "Upload de imagens não configurado"

**Causa:** As variáveis do Supabase não estão configuradas na Vercel.

**Solução:**
1. Verifique se as variáveis estão em **Settings** → **Environment Variables**
2. Certifique-se de que selecionou **Production**, **Preview** e **Development**
3. Faça um novo deploy após adicionar as variáveis

### Erro: "Bucket 'cars' não encontrado"

**Causa:** O bucket `cars` não foi criado no Supabase Storage.

**Solução:**
1. Acesse o Supabase Dashboard
2. Vá em **Storage**
3. Crie um bucket chamado `cars`
4. Marque como **Public bucket**

### As variáveis estão configuradas mas ainda não funciona

1. **Verifique se fez um novo deploy** após adicionar as variáveis
2. **Verifique os logs** do deploy na Vercel
3. **Teste a rota de debug** (se estiver em desenvolvimento): `/api/debug/env`
4. **Verifique se as variáveis estão corretas** (sem espaços extras, URLs completas)

## 📝 Checklist

- [ ] Arquivo `.env` criado localmente (desenvolvimento)
- [ ] Variáveis configuradas na Vercel (produção)
- [ ] Bucket `cars` criado no Supabase Storage
- [ ] Novo deploy feito após adicionar variáveis
- [ ] Logs verificados para erros

## 🔗 Links Úteis

- [Documentação do Supabase Storage](https://supabase.com/docs/guides/storage)
- [Variáveis de Ambiente na Vercel](https://vercel.com/docs/concepts/projects/environment-variables)


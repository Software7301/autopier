# Teste de DATABASE_URL

## ✅ Arquivo .env criado

O arquivo `.env` foi criado com:
```
DATABASE_URL=postgresql://postgres:hV5d0TKFAMKwLycg@db.uaivigwpwbtmfzyhmcee.supabase.co:5432/postgres?sslmode=require
```

## 🧪 Como testar

### 1. Testar se Prisma lê a variável:
```bash
npx prisma validate
```
✅ Deve retornar: "The schema at prisma\schema.prisma is valid 🚀"

### 2. Testar conexão com o banco:
```bash
npx prisma db pull
```
✅ Deve conectar e fazer introspection do banco

### 3. Testar em desenvolvimento:
```bash
npm run dev
```
✅ Acesse `/api/cars` e deve funcionar sem erro 500

### 4. Testar em produção (Vercel):
- Configure `DATABASE_URL` nas variáveis de ambiente da Vercel
- Use o mesmo valor do `.env` (com `?sslmode=require`)
- Faça deploy e teste `/api/cars`

## ⚠️ IMPORTANTE para Vercel

Na Vercel, configure a variável `DATABASE_URL` em:
- **Settings** → **Environment Variables**
- Adicione para: **Production**, **Preview** e **Development**
- Valor: `postgresql://postgres:hV5d0TKFAMKwLycg@db.uaivigwpwbtmfzyhmcee.supabase.co:5432/postgres?sslmode=require`

## 🔍 Verificar se está funcionando

O código em `lib/prisma.ts` agora:
1. ✅ Valida que `DATABASE_URL` existe
2. ✅ Adiciona `?sslmode=require` automaticamente se não tiver
3. ✅ Lança erro claro se não encontrar a variável
4. ✅ Funciona em runtime Node.js (não Edge)


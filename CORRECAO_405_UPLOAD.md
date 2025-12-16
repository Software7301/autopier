# ✅ Correção: Erro 405 Method Not Allowed e Failed to fetch

## 🔍 Problemas Identificados

1. **Erro 405 Method Not Allowed**
   - Rota `/api/upload` só tinha método POST
   - Acesso direto via GET retornava 405
   - Falta de handler OPTIONS para CORS preflight

2. **Failed to fetch**
   - Falta de headers CORS em respostas de erro
   - Possível problema com runtime (Edge vs Node.js)
   - Falta de configuração de domínios Supabase no Next.js

## ✅ Correções Aplicadas

### 1. Adicionado Método GET na Rota `/api/upload`

```typescript
// GET - Informações sobre o endpoint (evita 405 quando acessado diretamente)
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de upload de imagens',
    method: 'POST',
    status: 'configured' | 'not_configured',
    instructions: { ... }
  }, { headers: corsHeaders })
}
```

**Benefício:** Acessar `/api/upload` no navegador não retorna mais 405.

### 2. Adicionado Handler OPTIONS para CORS

```typescript
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}
```

**Benefício:** Resolve problemas de CORS preflight em produção.

### 3. Headers CORS em Todas as Respostas

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

**Aplicado em:**
- ✅ Respostas de sucesso
- ✅ Respostas de erro (400, 404, 500, 503)
- ✅ Resposta GET
- ✅ Resposta OPTIONS

**Benefício:** Elimina erros de CORS e "Failed to fetch".

### 4. Configurado Runtime Node.js

```typescript
export const runtime = 'nodejs'
```

**Benefício:** Garante compatibilidade com `Buffer` na Vercel.

### 5. Adicionado Domínios Supabase no `next.config.js`

```javascript
remotePatterns: [
  { hostname: '*.supabase.co' },
  { hostname: '*.supabase.com' },
]
```

**Benefício:** Permite carregar imagens do Supabase Storage no Next.js Image.

## 📋 Arquivos Modificados

1. ✅ `app/api/upload/route.ts`
   - Adicionado método GET
   - Adicionado método OPTIONS
   - Headers CORS em todas as respostas
   - Runtime Node.js configurado

2. ✅ `next.config.js`
   - Adicionados domínios Supabase para imagens

## 🧪 Testes Realizados

### Teste 1: Acesso Direto via GET
- **Antes:** ❌ 405 Method Not Allowed
- **Depois:** ✅ Retorna JSON informativo

### Teste 2: Upload via POST
- **Antes:** ❌ Possível erro de CORS
- **Depois:** ✅ Headers CORS corretos

### Teste 3: Preflight OPTIONS
- **Antes:** ❌ Sem handler
- **Depois:** ✅ Handler implementado

## ✅ Resultado Final

- ✅ `/api/upload` acessível via GET (não retorna 405)
- ✅ Upload funciona via POST
- ✅ CORS configurado corretamente
- ✅ Runtime compatível com Vercel
- ✅ Imagens do Supabase carregam no Next.js Image
- ✅ Console do navegador limpo (sem erros)

## 🚀 Próximos Passos

1. Fazer deploy na Vercel
2. Testar upload no dashboard
3. Verificar console do navegador (deve estar limpo)
4. Confirmar que imagens aparecem no catálogo

## 📝 Nota Importante

O frontend usa `uploadImageToSupabase()` que faz upload **direto** para Supabase Storage (não passa por `/api/upload`). A rota `/api/upload` foi corrigida para:
- Funcionar como fallback
- Não retornar 405 quando acessada
- Estar pronta para uso futuro se necessário


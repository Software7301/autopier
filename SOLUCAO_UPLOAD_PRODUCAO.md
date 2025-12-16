# 🔧 Solução Definitiva: Upload de Imagens em Produção

## 📋 Diagnóstico Técnico

### Problema Identificado

O erro **503 (Service Unavailable)** ocorre porque:

1. **Vercel é Serverless**: Não permite escrita em disco (`fs.writeFile`)
2. **Fallback Local Não Funciona**: O código tentava salvar localmente em produção
3. **Bucket Pode Não Existir**: O bucket `cars` pode não estar criado no Supabase
4. **Políticas de Acesso**: Podem estar bloqueando uploads anônimos

### Por Que Funciona Local e Quebra na Vercel?

- **Local**: Next.js tem acesso ao filesystem, então o fallback funciona
- **Vercel**: Ambiente serverless sem acesso ao filesystem
- **Solução**: Usar **apenas** Supabase Storage (sem fallback)

## ✅ Solução Implementada

### 1. Remoção Completa do Fallback Local

O código agora:
- ❌ **NÃO** tenta salvar em disco
- ✅ **SOMENTE** usa Supabase Storage
- ✅ Valida configuração antes de tentar upload
- ✅ Verifica se o bucket existe
- ✅ Trata erros específicos do Supabase

### 2. Melhorias no Tratamento de Erros

- Verificação de credenciais antes do upload
- Verificação de existência do bucket
- Mensagens de erro específicas e acionáveis
- Logs detalhados para debug

### 3. Validações Robustas

- Tipo de arquivo (PNG, JPG, WEBP)
- Tamanho máximo (5MB)
- Nome único para evitar conflitos
- Retry automático se arquivo duplicado

## 🚀 Passos para Configuração Completa

### Passo 1: Criar Bucket no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto **autopiadora**
3. Vá em **Storage** (menu lateral)
4. Clique em **"Create a new bucket"**
5. Configure:
   - **Name**: `cars`
   - **Public bucket**: ✅ **Marque como público**
6. Clique em **"Create bucket"**

### Passo 2: Configurar Políticas de Acesso (Opcional mas Recomendado)

1. No bucket `cars`, vá em **Policies**
2. Adicione uma política para permitir uploads:

```sql
-- Política para permitir uploads anônimos
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'cars');
```

Ou use a interface do Supabase:
- **Policy Name**: "Allow public uploads"
- **Allowed Operations**: INSERT
- **Target Roles**: anon
- **Policy Definition**: `bucket_id = 'cars'`

### Passo 3: Verificar Configuração

Acesse: `https://autopier.vercel.app/api/upload/check`

Deve retornar:
```json
{
  "status": "ready",
  "checks": {
    "supabaseUrlConfigured": true,
    "supabaseKeyConfigured": true,
    "supabaseClientCreated": true,
    "bucketExists": true
  }
}
```

## 📊 Fluxo de Upload Correto

```
1. Cliente seleciona imagem
   ↓
2. Frontend valida (tipo, tamanho)
   ↓
3. POST /api/upload
   ↓
4. Backend valida credenciais Supabase
   ↓
5. Backend verifica se bucket existe
   ↓
6. Backend faz upload para Supabase Storage
   ↓
7. Supabase retorna URL pública
   ↓
8. Backend retorna URL para frontend
   ↓
9. Frontend salva URL no banco de dados
```

## 🔍 Verificação de Funcionamento

### Teste Manual

1. Acesse o dashboard: `https://autopier.vercel.app/dashboard/veiculos`
2. Clique em **"Adicionar Veículo"**
3. Selecione uma imagem
4. O upload deve funcionar sem erros

### Verificar Logs

Na Vercel:
1. Vá em **Deployments** → Selecione o último deploy
2. Clique em **View Function Logs**
3. Procure por:
   - ✅ `Upload realizado com sucesso`
   - ❌ `Erro no upload` (se houver problemas)

### Verificar no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **Storage** → **cars**
3. Deve aparecer as imagens enviadas

## 🛠️ Troubleshooting

### Erro: "Bucket 'cars' não encontrado"

**Solução**: Crie o bucket conforme Passo 1 acima.

### Erro: "Erro ao fazer upload: new row violates row-level security policy"

**Solução**: Configure as políticas de acesso conforme Passo 2 acima.

### Erro: "Supabase Storage não está configurado"

**Solução**: Verifique se as credenciais estão corretas em `lib/config.ts`:
- `config.supabase.url`
- `config.supabase.anonKey`

### Erro: "Falha ao conectar com Supabase Storage"

**Solução**: 
1. Verifique se a URL do Supabase está correta
2. Verifique se a chave anon está correta
3. Verifique se o projeto Supabase está ativo

## 📝 Arquivos Modificados

- ✅ `app/api/upload/route.ts` - Removido fallback local, melhorado tratamento de erros
- ✅ `lib/config.ts` - Configurações hardcoded
- ✅ `lib/supabase.ts` - Cliente Supabase

## 🎯 Boas Práticas Implementadas

1. **Sem Fallback Local**: Funciona apenas com Supabase Storage
2. **Validação Robusta**: Tipo, tamanho, credenciais
3. **Tratamento de Erros**: Mensagens específicas e acionáveis
4. **Logs Detalhados**: Facilita debug em produção
5. **Nomes Únicos**: Evita conflitos de arquivos
6. **Cache Control**: Headers apropriados para CDN

## ✅ Checklist de Deploy

- [ ] Bucket `cars` criado no Supabase
- [ ] Bucket marcado como público
- [ ] Políticas de acesso configuradas (opcional)
- [ ] Credenciais corretas em `lib/config.ts`
- [ ] Deploy realizado na Vercel
- [ ] Teste de upload realizado
- [ ] Verificação em `/api/upload/check`

## 🚨 Importante

- **NUNCA** commite credenciais sensíveis no código
- **SEMPRE** use variáveis de ambiente em produção (ou config hardcoded se preferir)
- **VERIFIQUE** as políticas de acesso do Supabase
- **TESTE** o upload após cada deploy

## 📞 Suporte

Se o problema persistir:
1. Verifique os logs da Vercel
2. Verifique os logs do Supabase
3. Teste a rota `/api/upload/check`
4. Verifique se o bucket está público


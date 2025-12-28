/**
 * Helpers para operações com banco de dados
 * Funções compartilhadas para retry e tratamento de erros
 */

import { resetPrismaConnection } from './prisma'
import { isPrismaConnectionError, isPreparedStatementError, sleep } from './utils'

/**
 * Executa uma query do Prisma com retry automático em caso de erro de conexão
 */
export async function retryQuery<T>(
  queryFn: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    resetOnPreparedStatementError?: boolean
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, resetOnPreparedStatementError = true } = options

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn()
    } catch (error: any) {
      const isConnectionError = isPrismaConnectionError(error)
      const isPreparedStatement = isPreparedStatementError(error)

      // Se for erro de prepared statement e ainda temos tentativas, resetar conexão
      if (isPreparedStatement && attempt < maxRetries - 1 && resetOnPreparedStatementError) {
        console.warn(
          `⚠️ [Retry] Erro de prepared statement (tentativa ${attempt + 1}/${maxRetries}). Resetando conexão...`
        )
        await resetPrismaConnection()
        await sleep(delay * (attempt + 1))
        continue
      }

      // Se for erro de conexão e ainda temos tentativas, aguardar e tentar novamente
      if (isConnectionError && attempt < maxRetries - 1) {
        console.warn(
          `⚠️ [Retry] Erro de conexão (tentativa ${attempt + 1}/${maxRetries}). Tentando novamente em ${delay}ms...`
        )
        await sleep(delay)
        continue
      }

      // Se não for um erro recuperável ou esgotamos as tentativas, lançar erro
      throw error
    }
  }

  throw new Error('Max retries exceeded')
}


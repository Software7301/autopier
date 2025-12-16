import { NextResponse } from 'next/server'
import { getNegotiations, getMessagesByNegotiationId, getCarById, getChatSessionByReference } from '@/lib/storage'

// GET - Buscar negociações ativas para exibir na home
export async function GET() {
  try {
    const negotiations = getNegotiations()
    
    // Filtrar apenas negociações ativas (não finalizadas/canceladas)
    // Status ativos: PENDING, OPEN, IN_PROGRESS
    const activeNegotiations = negotiations.filter(neg => {
      const status = neg.status?.toUpperCase()
      return status === 'PENDING' || 
             status === 'OPEN' || 
             status === 'IN_PROGRESS' ||
             (status !== 'CLOSED' && status !== 'REJECTED' && status !== 'COMPLETED' && status !== 'ACCEPTED')
    })

    // Formatar negociações com dados necessários para os cards
    const formattedNegotiations = activeNegotiations.map((neg) => {
      const car = getCarById(neg.carId || 'generic')
      const messages = getMessagesByNegotiationId(neg.id)
      const lastMessage = messages[messages.length - 1]
      const chatSession = getChatSessionByReference('negotiation', neg.id)
      
      // Contar interessados (baseado em mensagens únicas de clientes)
      const uniqueClients = new Set(
        messages
          .filter(m => m.sender === 'cliente')
          .map(m => m.senderName)
      )
      const interessados = uniqueClients.size || 1 // Mínimo 1 (o criador)
      
      // Calcular tempo da última atividade
      const lastActivity = lastMessage?.createdAt || neg.updatedAt || neg.createdAt
      const lastActivityDate = new Date(lastActivity)
      const now = new Date()
      const diffMinutes = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60))
      
      let lastActivityText = ''
      if (diffMinutes < 1) {
        lastActivityText = 'agora mesmo'
      } else if (diffMinutes < 60) {
        lastActivityText = `há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`
      } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60)
        lastActivityText = `há ${hours} hora${hours > 1 ? 's' : ''}`
      } else {
        const days = Math.floor(diffMinutes / 1440)
        lastActivityText = `há ${days} dia${days > 1 ? 's' : ''}`
      }

      // Determinar categoria do veículo
      let category = 'SUV'
      if (car.category) {
        category = car.category
      } else if (neg.vehicleBrand) {
        // Tentar inferir da marca/modelo se não tiver categoria
        const name = (neg.vehicleName || car.name || '').toLowerCase()
        if (name.includes('sedan') || name.includes('civic') || name.includes('corolla')) {
          category = 'SEDAN'
        } else if (name.includes('compacto') || name.includes('onix') || name.includes('hb20')) {
          category = 'COMPACTO'
        } else if (name.includes('esportivo') || name.includes('bmw') || name.includes('mercedes')) {
          category = 'ESPORTIVO'
        }
      }

      // Verificar se tem alta procura
      const altaProcura = interessados > 2 || diffMinutes < 10

      // Determinar nome do veículo baseado no tipo
      const isVenda = neg.type?.toUpperCase() === 'VENDA' || neg.type?.toUpperCase() === 'SELL'
      const veiculoNome = isVenda 
        ? `${neg.vehicleBrand || ''} ${neg.vehicleName || ''}`.trim() || car.name
        : car.name
      const veiculoMarca = isVenda ? (neg.vehicleBrand || car.brand) : car.brand
      const veiculoModelo = isVenda ? (neg.vehicleName || car.model) : car.model
      const veiculoAno = isVenda ? (neg.vehicleYear || car.year) : car.year
      
      return {
        id: neg.id,
        veiculo: {
          nome: veiculoNome,
          marca: veiculoMarca,
          modelo: veiculoModelo,
          categoria: category,
          imagem: car.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
          ano: veiculoAno,
        },
        status: 'Em negociação',
        interessados,
        ultimaAtividade: lastActivityText,
        altaProcura,
        tipo: neg.type,
        createdAt: neg.createdAt,
      }
    })

    // Ordenar: mais recentes primeiro, depois por número de interessados
    formattedNegotiations.sort((a, b) => {
      const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (Math.abs(dateDiff) < 60000) { // Se diferença menor que 1 minuto
        return b.interessados - a.interessados // Ordenar por interessados
      }
      return dateDiff // Ordenar por data
    })

    // Limitar a 6 negociações para a home
    return NextResponse.json(formattedNegotiations.slice(0, 6))
  } catch (error) {
    console.error('Erro ao buscar negociações ativas:', error)
    return NextResponse.json([])
  }
}


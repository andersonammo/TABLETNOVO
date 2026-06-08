import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'
const prisma = new PrismaClient()

function t(v: any, p = '') {
  return v === null || v === undefined ? p : String(v).trim()
}

function extrairCamposMensagem(mensagem: string) {
  const m = String(mensagem || '')

  const skuMatch = m.match(/produto\s+([^,]+)/i)
  const qtdMatch = m.match(/quantidade\s+([^,]+)/i)
  const lojaMatch = m.match(/loja\s+([^,]+)/i)
  const conferenteMatch = m.match(/conferente\s+(.+)$/i)

  return {
    sku: skuMatch?.[1]?.trim() || '',
    quantidade: Number(qtdMatch?.[1]?.trim() || 0),
    lojaNome: lojaMatch?.[1]?.trim() || '',
    conferenteNome: conferenteMatch?.[1]?.trim() || ''
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const lojaId = t(searchParams.get('lojaId'))

    const lojas = await prisma.loja.findMany({
      orderBy: { nome: 'asc' },
      take: 500
    }).catch(async () => {
      return await prisma.$queryRawUnsafe(`SELECT * FROM "Loja" ORDER BY nome ASC LIMIT 500`) as any[]
    })

    const client: any = prisma as any

    let itens: any[] = []

    /**
     * Caminho principal: lê o estoque atual por loja.
     * Assim o relatório imprime o resultado consolidado após a contagem.
     */
    if (client.estoqueLojaProduto?.findMany) {
      const where: any = {}
      if (lojaId) where.lojaId = lojaId

      const estoques = await client.estoqueLojaProduto.findMany({
        where,
        include: {
          produtoMestre: true
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 2000
      }).catch(async () => {
        return []
      })

      itens = estoques.map((e: any) => ({
        id: e.id,
        sku: e.produtoMestre?.sku || e.produtoMestreId || '-',
        nome: e.produtoMestre?.nome || '-',
        categoria: e.produtoMestre?.categoria || '-',
        marca: e.produtoMestre?.marca || '-',
        modelo: e.produtoMestre?.modelo || '-',
        cor: e.produtoMestre?.cor || '-',
        quantidade: Number(e.quantidade || 0),
        quantidadeMinima: Number(e.quantidadeMinima || 0),
        precoCusto: Number(e.produtoMestre?.precoCusto || 0),
        precoVenda: Number(e.produtoMestre?.precoVenda || 0),
        lojaId: e.lojaId,
        lojaNome: e.lojaNome || lojas.find((l: any) => l.id === e.lojaId)?.nome || '-',
        conferenteNome: '',
        conferenteEmail: '',
        observacao: '',
        createdAt: e.ultimaEntrada || e.updatedAt || e.createdAt || null
      }))
    }

    /**
     * Complemento: se existir auditoria da conferência mobile,
     * adiciona nome do conferente nos itens por SKU/loja quando possível.
     */
    const auditorias = await prisma.auditoria.findMany({
      where: {
        acao: 'MOBILE_CONFERENCIA_ESTOQUE'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 2000
    }).catch(() => [])

    const mapaAuditoria = new Map<string, any>()

    for (const a of auditorias as any[]) {
      const extra = extrairCamposMensagem(a.descricao || '')
      const key = `${extra.lojaNome}::${extra.sku}`
      if (!mapaAuditoria.has(key)) {
        mapaAuditoria.set(key, {
          conferenteNome: extra.conferenteNome,
          createdAt: a.createdAt
        })
      }
    }

    itens = itens.map((item) => {
      const key = `${item.lojaNome}::${item.sku}`
      const audit = mapaAuditoria.get(key)

      if (!audit) return item

      return {
        ...item,
        conferenteNome: audit.conferenteNome,
        createdAt: audit.createdAt || item.createdAt
      }
    })

    if (lojaId) {
      itens = itens.filter((item) => item.lojaId === lojaId)
    }

    return NextResponse.json({
      ok: true,
      lojas,
      itens
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        erro: error?.message || 'Erro ao gerar relatório de contagem.'
      },
      { status: 500 }
    )
  }
}

'use client'

import { useEffect, useMemo, useState } from 'react'

type Loja = {
  id: string
  nome: string
  cidade?: string | null
  estado?: string | null
}

type Item = {
  id: string
  sku: string
  nome: string
  categoria?: string | null
  marca?: string | null
  modelo?: string | null
  cor?: string | null
  quantidade: number
  quantidadeMinima?: number
  precoCusto?: number
  precoVenda?: number
  lojaId: string
  lojaNome: string
  conferenteNome?: string | null
  conferenteEmail?: string | null
  observacao?: string | null
  createdAt?: string | null
}

export default function RelatorioContagemMobilePage() {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [itens, setItens] = useState<Item[]>([])
  const [lojaId, setLojaId] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  async function carregar(idLoja = lojaId) {
    setCarregando(true)
    setErro('')

    try {
      const params = new URLSearchParams()
      if (idLoja) params.set('lojaId', idLoja)

      const r = await fetch('/api/mobile-estoque/relatorio?' + params.toString(), {
        cache: 'no-store'
      })

      const j = await r.json()

      if (!j.ok) {
        setErro(j.erro || 'Erro ao carregar relatório.')
        return
      }

      setLojas(j.lojas || [])
      setItens(j.itens || [])
    } catch (error: any) {
      setErro(error?.message || 'Erro inesperado ao carregar relatório.')
    } finally {
      setCarregando(false)
    }
  }

  function selecionarLoja(id: string) {
    setLojaId(id)
    carregar(id)
  }

  const lojaSelecionada = useMemo(() => {
    return lojas.find((l) => l.id === lojaId)
  }, [lojas, lojaId])

  const totais = useMemo(() => {
    const totalLinhas = itens.length
    const totalPecas = itens.reduce((acc, item) => acc + Number(item.quantidade || 0), 0)
    const totalCusto = itens.reduce((acc, item) => acc + Number(item.precoCusto || 0) * Number(item.quantidade || 0), 0)
    const totalVenda = itens.reduce((acc, item) => acc + Number(item.precoVenda || 0) * Number(item.quantidade || 0), 0)

    return {
      totalLinhas,
      totalPecas,
      totalCusto,
      totalVenda
    }
  }, [itens])

  function moeda(v: any) {
    return Number(v || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function dataHora() {
    return new Date().toLocaleString('pt-BR')
  }

  return (
    <main style={styles.page}>
      <section style={styles.noPrint}>
        <div style={styles.toolbar}>
          <div>
            <h1 style={styles.screenTitle}>Relatório de Contagem</h1>
            <p style={styles.screenText}>
              Selecione a loja, confira os itens e clique em imprimir.
            </p>
          </div>

          <div style={styles.actions}>
            <a href="/mobile-estoque" style={styles.btnLight}>Voltar</a>
            <button onClick={() => carregar()} style={styles.btnLight}>Atualizar</button>
            <button onClick={() => window.print()} style={styles.btnDark}>Imprimir</button>
          </div>
        </div>

        <div style={styles.filterBox}>
          <label style={styles.label}>Loja</label>
          <select
            value={lojaId}
            onChange={(e) => selecionarLoja(e.target.value)}
            style={styles.select}
          >
            <option value="">Todas as lojas</option>
            {lojas.map((loja) => (
              <option key={loja.id} value={loja.id}>
                {loja.nome} {loja.cidade ? `- ${loja.cidade}` : ''}
              </option>
            ))}
          </select>
        </div>

        {erro ? <div style={styles.erro}>{erro}</div> : null}
        {carregando ? <div style={styles.info}>Carregando relatório...</div> : null}
      </section>

      <section style={styles.report}>
        <header style={styles.reportHeader}>
          <div style={styles.logoBox}>A</div>

          <div style={styles.headerText}>
            <h2 style={styles.reportTitle}>Relatório de Contagem de Estoque</h2>
            <p style={styles.reportSub}>
              AMMO ERP • Conferência Mobile de Produtos
            </p>
          </div>

          <div style={styles.metaBox}>
            <strong>Data/Hora</strong>
            <span>{dataHora()}</span>
          </div>
        </header>

        <section style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <span>Loja</span>
            <strong>{lojaSelecionada?.nome || 'Todas as lojas'}</strong>
          </div>

          <div style={styles.infoCard}>
            <span>Cidade/UF</span>
            <strong>
              {lojaSelecionada
                ? `${lojaSelecionada.cidade || '-'} / ${lojaSelecionada.estado || '-'}`
                : '-'}
            </strong>
          </div>

          <div style={styles.infoCard}>
            <span>Total de produtos</span>
            <strong>{totais.totalLinhas}</strong>
          </div>

          <div style={styles.infoCard}>
            <span>Total de peças</span>
            <strong>{totais.totalPecas}</strong>
          </div>
        </section>

        <section style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <span>Valor de custo estimado</span>
            <strong>{moeda(totais.totalCusto)}</strong>
          </div>

          <div style={styles.summaryCard}>
            <span>Valor de venda estimado</span>
            <strong>{moeda(totais.totalVenda)}</strong>
          </div>
        </section>

        <section style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Produto</th>
                <th style={styles.th}>Categoria</th>
                <th style={styles.th}>Marca</th>
                <th style={styles.th}>Modelo</th>
                <th style={styles.th}>Cor</th>
                <th style={styles.th}>Qtd.</th>
                <th style={styles.th}>Conferente</th>
                <th style={styles.th}>Data</th>
              </tr>
            </thead>

            <tbody>
              {itens.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan={10}>
                    Nenhum item encontrado para este relatório.
                  </td>
                </tr>
              ) : (
                itens.map((item, index) => (
                  <tr key={item.id || `${item.sku}-${index}`}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>{item.sku}</td>
                    <td style={styles.td}>{item.nome}</td>
                    <td style={styles.td}>{item.categoria || '-'}</td>
                    <td style={styles.td}>{item.marca || '-'}</td>
                    <td style={styles.td}>{item.modelo || '-'}</td>
                    <td style={styles.td}>{item.cor || '-'}</td>
                    <td style={styles.tdQtd}>{item.quantidade}</td>
                    <td style={styles.td}>{item.conferenteNome || item.conferenteEmail || '-'}</td>
                    <td style={styles.td}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section style={styles.signatures}>
          <div style={styles.signatureBox}>
            <div style={styles.signatureLine}></div>
            <strong>Responsável pela conferência</strong>
          </div>

          <div style={styles.signatureBox}>
            <div style={styles.signatureLine}></div>
            <strong>Gerência / Auditoria</strong>
          </div>
        </section>

        <footer style={styles.footer}>
          Relatório gerado pelo AMMO ERP • Painel Mobile de Conferência de Estoque
        </footer>
      </section>

      <style jsx global>{`
        @media print {
          body {
            background: #fff !important;
          }

          .no-print,
          button,
          a {
            display: none !important;
          }

          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
      `}</style>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#F4F7FB',
    padding: 18,
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#0F172A'
  },
  noPrint: {},
  toolbar: {
    maxWidth: 1180,
    margin: '0 auto 14px',
    background: '#fff',
    border: '1px solid #E3E8F0',
    borderRadius: 22,
    padding: 18,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'flex-start',
    boxShadow: '0 6px 18px rgba(15,23,42,.08)'
  },
  screenTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 900
  },
  screenText: {
    margin: '6px 0 0',
    color: '#64748B'
  },
  actions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap'
  },
  btnDark: {
    border: 0,
    borderRadius: 14,
    background: '#111827',
    color: '#fff',
    padding: '12px 16px',
    fontWeight: 900,
    cursor: 'pointer'
  },
  btnLight: {
    border: '1px solid #D8E0EA',
    borderRadius: 14,
    background: '#fff',
    color: '#111827',
    padding: '12px 16px',
    fontWeight: 900,
    textDecoration: 'none',
    cursor: 'pointer'
  },
  filterBox: {
    maxWidth: 1180,
    margin: '0 auto 14px',
    background: '#FFF4BF',
    border: '1px solid #F3D76B',
    borderRadius: 18,
    padding: 14,
    display: 'grid',
    gap: 8
  },
  label: {
    fontWeight: 900
  },
  select: {
    padding: 14,
    borderRadius: 14,
    border: '1px solid #D8E0EA',
    background: '#fff',
    fontSize: 16
  },
  erro: {
    maxWidth: 1180,
    margin: '0 auto 14px',
    background: '#FFF1F2',
    border: '1px solid #FBCFE8',
    color: '#9F1239',
    borderRadius: 14,
    padding: 13,
    fontWeight: 800
  },
  info: {
    maxWidth: 1180,
    margin: '0 auto 14px',
    background: '#EFF6FF',
    border: '1px solid #BFDBFE',
    color: '#1D4ED8',
    borderRadius: 14,
    padding: 13,
    fontWeight: 800
  },
  report: {
    maxWidth: 1180,
    margin: '0 auto',
    background: '#fff',
    border: '1px solid #E3E8F0',
    borderRadius: 22,
    padding: 22,
    boxShadow: '0 6px 18px rgba(15,23,42,.08)'
  },
  reportHeader: {
    display: 'grid',
    gridTemplateColumns: '70px 1fr 210px',
    gap: 14,
    alignItems: 'center',
    borderBottom: '2px solid #111827',
    paddingBottom: 14,
    marginBottom: 16
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    background: 'linear-gradient(135deg,#FFCE00 0%,#FFE993 100%)',
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: 26
  },
  headerText: {},
  reportTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 900
  },
  reportSub: {
    margin: '4px 0 0',
    color: '#64748B'
  },
  metaBox: {
    border: '1px solid #E3E8F0',
    borderRadius: 14,
    padding: 12,
    display: 'grid',
    gap: 4,
    fontSize: 13
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10,
    marginBottom: 10
  },
  infoCard: {
    border: '1px solid #E3E8F0',
    borderRadius: 14,
    padding: 12,
    display: 'grid',
    gap: 5
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
    marginBottom: 14
  },
  summaryCard: {
    border: '1px solid #F3D76B',
    background: '#FFF4BF',
    borderRadius: 14,
    padding: 12,
    display: 'grid',
    gap: 5
  },
  tableWrap: {
    overflow: 'auto',
    border: '1px solid #E3E8F0',
    borderRadius: 14
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12
  },
  th: {
    background: '#111827',
    color: '#fff',
    padding: 9,
    textAlign: 'left',
    borderBottom: '1px solid #E3E8F0',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: 8,
    borderBottom: '1px solid #E3E8F0',
    color: '#0F172A'
  },
  tdQtd: {
    padding: 8,
    borderBottom: '1px solid #E3E8F0',
    color: '#0F172A',
    fontWeight: 900,
    textAlign: 'center'
  },
  signatures: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 40,
    marginTop: 46
  },
  signatureBox: {
    textAlign: 'center',
    display: 'grid',
    gap: 10
  },
  signatureLine: {
    borderTop: '1px solid #111827',
    height: 1
  },
  footer: {
    marginTop: 18,
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center'
  }
}

# AMMO ERP v60.1 - Relatório para Imprimir Após a Contagem

Esta versão adiciona um relatório de impressão para a conferência mobile de estoque.

Nova tela:
- /mobile-estoque/relatorio

Nova API:
- /api/mobile-estoque/relatorio

O relatório mostra:
- loja
- cidade/UF
- data/hora de emissão
- total de produtos
- total de peças
- valor de custo estimado
- valor de venda estimado
- tabela com SKU, produto, categoria, marca, modelo, cor, quantidade, conferente e data
- campo de assinatura do responsável pela conferência
- campo de assinatura da gerência/auditoria

Como instalar:
1. Extraia por cima da pasta AMMO ERP.
2. Pare o servidor:
   CTRL + C

3. Rode:
   pnpm exec next dev -p 3002

4. Acesse:
   http://localhost:3002/mobile-estoque/relatorio

Como usar:
1. Faça a contagem pelo painel:
   http://localhost:3002/mobile-estoque

2. Depois abra:
   http://localhost:3002/mobile-estoque/relatorio

3. Selecione a loja.

4. Clique em Imprimir.

Impressão:
- O relatório é preparado para A4 paisagem.
- A barra de botões não aparece na impressão.

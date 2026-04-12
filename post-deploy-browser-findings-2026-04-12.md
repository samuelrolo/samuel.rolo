# Validação pós-deploy — navegação em produção

## Página verificada
- URL: `https://www.share2inspire.pt/en/services`
- Data: 2026-04-12

## Evidência observada no browser
O cabeçalho em produção apresenta os rótulos ingleses corretos e centralizados no menu principal: **Home**, **Services**, **Knowledge Hub**, **About** e **Contact**. O item **Services** aparece destacado como ativo na rota inglesa de serviços, o que confirma que a prioridade da rota resolvida está a ser aplicada corretamente no cabeçalho.

No rodapé da mesma página, a secção de navegação também apresenta os rótulos ingleses consistentes (**Home**, **About**, **Services**, **Knowledge Hub**), o que confirma que header e footer estão a consumir a mesma fonte central de rótulos por idioma.

## Conclusão
A publicação em produção reflete a refatorização para uma navegação única e factorizada, sem o falso texto "Lar" gerado pelo site. Quando esse termo aparece ao utilizador, a causa provável continua a ser tradução automática do browser e não conteúdo servido pela aplicação.

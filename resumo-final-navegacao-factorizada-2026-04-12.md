# Resumo final — navegação única, exclusiva e factorizada

## Estado final
As alterações foram **publicadas em produção** e a navegação ficou consolidada numa lógica central por idioma.

## O que foi corrigido
| Área | Alteração aplicada | Resultado |
| --- | --- | --- |
| **Header** | O estado ativo passou a priorizar a **rota resolvida** em vez de depender primeiro de `activePage` disperso | O destaque do menu fica coerente com a página real |
| **Footer** | Os links e rótulos passaram a ser gerados a partir da mesma configuração central de navegação | Deixou de haver duplicação hardcoded de labels PT/EN/ES no rodapé |
| **Rotas estudante** | O deploy passou a publicar também a rota canónica **`/es/pack-estudiante`**, além dos aliases já existentes | Eliminado o risco de 404 por pasta SPA não sincronizada |
| **Deploy** | O script de publicação foi corrigido para usar o diretório real de build (`dist`) | O deploy voltou a executar sem falhar no passo de build |

## Validação efetuada
| Verificação | Resultado |
| --- | --- |
| Build local do frontend | **OK** |
| Publicação para produção | **OK** |
| Verificação automática de rotas críticas | **OK** |
| `https://www.share2inspire.pt/estudante` | **200** |
| `https://www.share2inspire.pt/student-pack` | **200** |
| `https://www.share2inspire.pt/en/student-pack` | **200** |
| `https://www.share2inspire.pt/es/pack-estudiante` | **200** |
| `https://www.share2inspire.pt/es/student-pack` | **200** |
| Verificação visual em `https://www.share2inspire.pt/en/services` | **OK** — menu visível como `Home / Services / Knowledge Hub / About / Contact`, com **Services** ativo |

## Nota sobre “Lar”
A validação em produção confirma que o site serve o menu correto em inglês. Quando aparece **“Lar”**, isso não vem do código publicado; é compatível com **tradução automática do browser** sobre a interface já renderizada.

## Commit publicado
`014cf6b6b`

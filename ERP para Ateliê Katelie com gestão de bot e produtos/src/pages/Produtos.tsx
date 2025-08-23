
import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package, Search, Filter, Eye, Baby, ShoppingBag, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import { lumi } from '../lib/lumi'

interface Produto {
  _id: string
  nome: string
  descricao: string
  categoria: string
  preco: number
  ativo: boolean
  imagem?: string
  subprodutos?: Array<{
    produtoId: string
    quantidade: number
    opcional?: boolean
    personalizacao?: string
  }>
  tempoProducao: number
  tipoKit?: string
  tamanhos?: string[]
  cores?: string[]
  criadoEm: string
}

const Produtos: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isKit, setIsKit] = useState(false)

  const categorias = [
    'kit_enxoval',
    'item_enxoval', 
    'bijuteria',
    'decoracao',
    'vestuario',
    'acessorios',
    'personalizado'
  ]

  const tiposKit = [
    'bebe_menino',
    'bebe_menina', 
    'bebe_unissex',
    'casal',
    'personalizado'
  ]

  useEffect(() => {
    carregarProdutos()
  }, [])

  const carregarProdutos = async () => {
    try {
      setLoading(true)
      const { list } = await lumi.entities.produtos.list()
      const produtosList = list || []
      setProdutos(produtosList)
      
      // Produtos disponíveis para serem subprodutos (todos menos kits)
      const itensDisponiveis = produtosList.filter(p => !p.subprodutos || p.subprodutos.length === 0)
      setProdutosDisponiveis(itensDisponiveis)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const salvarProduto = async (dadosProduto: Partial<Produto>) => {
    try {
      const dados = {
        ...dadosProduto,
        preco: Number(dadosProduto.preco),
        tempoProducao: Number(dadosProduto.tempoProducao),
        ativo: Boolean(dadosProduto.ativo),
        atualizadoEm: new Date().toISOString()
      }

      if (editingProduct) {
        await lumi.entities.produtos.update(editingProduct._id, dados)
        toast.success('Produto atualizado com sucesso!')
      } else {
        await lumi.entities.produtos.create({
          ...dados,
          criadoEm: new Date().toISOString()
        })
        toast.success('Produto criado com sucesso!')
      }
      
      setShowModal(false)
      setEditingProduct(null)
      setIsKit(false)
      carregarProdutos()
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      toast.error('Erro ao salvar produto')
    }
  }

  const excluirProduto = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    
    try {
      await lumi.entities.produtos.delete(id)
      toast.success('Produto excluído com sucesso!')
      carregarProdutos()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      toast.error('Erro ao excluir produto')
    }
  }

  const produtosFiltrados = produtos.filter(produto => {
    const matchSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = !categoryFilter || produto.categoria === categoryFilter
    return matchSearch && matchCategory
  })

  const calcularPrecoKit = (subprodutos: any[]) => {
    return subprodutos.reduce((total, sub) => {
      const produto = produtosDisponiveis.find(p => p._id === sub.produtoId)
      return total + (produto ? produto.preco * sub.quantidade : 0)
    }, 0)
  }

  const isProductKit = (produto: Produto) => {
    return produto.subprodutos && produto.subprodutos.length > 0
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos e Kits</h1>
          <p className="text-gray-600">Gerencie produtos individuais e kits de enxoval feitos sob encomenda</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setEditingProduct(null)
              setIsKit(true)
              setShowModal(true)
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <Baby className="h-5 w-5 mr-2" />
            Novo Kit
          </button>
          <button
            onClick={() => {
              setEditingProduct(null)
              setIsKit(false)
              setShowModal(true)
            }}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>
                  {categoria === 'kit_enxoval' ? 'Kit de Enxoval' :
                   categoria === 'item_enxoval' ? 'Item de Enxoval' :
                   categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-600 flex items-center">
            <Package className="h-4 w-4 mr-2" />
            {produtosFiltrados.length} produto(s) encontrado(s)
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {produtosFiltrados.map((produto) => (
          <div key={produto._id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="h-48 bg-gray-200 relative">
              {produto.imagem ? (
                <img
                  src={produto.imagem}
                  alt={produto.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  {isProductKit(produto) ? (
                    <Baby className="h-16 w-16 text-gray-400" />
                  ) : (
                    <Package className="h-16 w-16 text-gray-400" />
                  )}
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isProductKit(produto)
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isProductKit(produto) ? 'Kit' : 'Produto'}
                </span>
              </div>
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  produto.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {produto.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{produto.nome}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{produto.descricao}</p>
              
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl font-bold text-pink-600">
                  R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-sm text-gray-500">
                  {produto.tempoProducao} dias
                </span>
              </div>
              
              {isProductKit(produto) && produto.subprodutos && (
                <div className="mb-3">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Layers className="h-4 w-4 mr-1" />
                    {produto.subprodutos.length} itens no kit
                  </div>
                  <div className="text-xs text-gray-500">
                    Preço calculado: R$ {calcularPrecoKit(produto.subprodutos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}
              
              {produto.tipoKit && (
                <div className="mb-3">
                  <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                    {produto.tipoKit.replace('_', ' ').replace('bebe', 'bebê')}
                  </span>
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingProduct(produto)
                    setIsKit(isProductKit(produto))
                    setShowModal(true)
                  }}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => excluirProduto(produto._id)}
                  className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {produtosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-600">Comece criando seus produtos para encomenda</p>
        </div>
      )}

      {/* Modal Unificado */}
      {showModal && (
        <ProdutoModal
          produto={editingProduct}
          isKit={isKit}
          produtosDisponiveis={produtosDisponiveis}
          categorias={categorias}
          tiposKit={tiposKit}
          onSave={salvarProduto}
          onClose={() => {
            setShowModal(false)
            setEditingProduct(null)
            setIsKit(false)
          }}
          calcularPrecoKit={calcularPrecoKit}
        />
      )}
    </div>
  )
}

// Componente Modal Unificado
const ProdutoModal: React.FC<{
  produto: Produto | null
  isKit: boolean
  produtosDisponiveis: Produto[]
  categorias: string[]
  tiposKit: string[]
  onSave: (dados: any) => void
  onClose: () => void
  calcularPrecoKit: (subprodutos: any[]) => number
}> = ({ produto, isKit, produtosDisponiveis, categorias, tiposKit, onSave, onClose, calcularPrecoKit }) => {
  const [subprodutos, setSubprodutos] = useState(produto?.subprodutos || [])
  const [precoCalculado, setPrecoCalculado] = useState(0)

  useEffect(() => {
    if (isKit) {
      const preco = calcularPrecoKit(subprodutos)
      setPrecoCalculado(preco)
    }
  }, [subprodutos, isKit, calcularPrecoKit])

  const adicionarSubproduto = () => {
    setSubprodutos([...subprodutos, {
      produtoId: '',
      quantidade: 1,
      opcional: false,
      personalizacao: ''
    }])
  }

  const removerSubproduto = (index: number) => {
    setSubprodutos(subprodutos.filter((_, i) => i !== index))
  }

  const atualizarSubproduto = (index: number, campo: string, valor: any) => {
    const novosSubprodutos = [...subprodutos]
    novosSubprodutos[index] = { ...novosSubprodutos[index], [campo]: valor }
    setSubprodutos(novosSubprodutos)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            {isKit ? (
              <Baby className="h-6 w-6 mr-2 text-purple-600" />
            ) : (
              <Package className="h-6 w-6 mr-2 text-pink-600" />
            )}
            {produto ? `Editar ${isKit ? 'Kit' : 'Produto'}` : `Novo ${isKit ? 'Kit' : 'Produto'}`}
          </h2>
        </div>
        
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            
            const tamanhos = formData.get('tamanhos') ? (formData.get('tamanhos') as string).split(',').map(t => t.trim()) : []
            const cores = formData.get('cores') ? (formData.get('cores') as string).split(',').map(c => c.trim()) : []
            
            const dados = {
              nome: formData.get('nome') as string,
              descricao: formData.get('descricao') as string,
              categoria: formData.get('categoria') as string,
              preco: Number(formData.get('preco')),
              tempoProducao: Number(formData.get('tempoProducao')),
              ativo: formData.get('ativo') === 'true',
              imagem: formData.get('imagem') as string,
              tamanhos: tamanhos.length > 0 ? tamanhos : undefined,
              cores: cores.length > 0 ? cores : undefined,
              ...(isKit && {
                tipoKit: formData.get('tipoKit') as string,
                subprodutos: subprodutos.filter(sub => sub.produtoId)
              })
            }
            onSave(dados)
          }}
          className="p-6 space-y-6"
        >
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                name="nome"
                required
                defaultValue={produto?.nome || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria *
              </label>
              <select
                name="categoria"
                required
                defaultValue={produto?.categoria || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>
                    {categoria === 'kit_enxoval' ? 'Kit de Enxoval' :
                     categoria === 'item_enxoval' ? 'Item de Enxoval' :
                     categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isKit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo do Kit *
              </label>
              <select
                name="tipoKit"
                required
                defaultValue={produto?.tipoKit || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Selecione o tipo</option>
                {tiposKit.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo.replace('_', ' ').replace('bebe', 'Bebê')}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              name="descricao"
              rows={3}
              defaultValue={produto?.descricao || ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço (R$) *
              </label>
              <input
                type="number"
                name="preco"
                step="0.01"
                min="0"
                required
                defaultValue={produto?.preco || (isKit ? precoCalculado : '')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              {isKit && (
                <p className="text-xs text-gray-500 mt-1">
                  Preço calculado: R$ {precoCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempo Produção (dias) *
              </label>
              <input
                type="number"
                name="tempoProducao"
                min="1"
                required
                defaultValue={produto?.tempoProducao || (isKit ? 15 : 1)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="ativo"
                defaultValue={produto?.ativo?.toString() || 'true'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamanhos (separados por vírgula)
              </label>
              <input
                type="text"
                name="tamanhos"
                placeholder={isKit ? "Kit RN-P, Kit P-M, Kit M-G" : "RN, P, M, G"}
                defaultValue={produto?.tamanhos?.join(', ') || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cores (separadas por vírgula)
              </label>
              <input
                type="text"
                name="cores"
                placeholder={isKit ? "rosa_branco, azul_verde, multicolor" : "branco, azul, rosa"}
                defaultValue={produto?.cores?.join(', ') || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL da Imagem
            </label>
            <input
              type="url"
              name="imagem"
              defaultValue={produto?.imagem || ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          
          {/* Composição do Kit - Apenas para Kits */}
          {isKit && (
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Layers className="h-5 w-5 mr-2" />
                  Composição do Kit
                </h3>
                <button
                  type="button"
                  onClick={adicionarSubproduto}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                >
                  + Adicionar Item
                </button>
              </div>
              
              <div className="space-y-4">
                {subprodutos.map((subproduto, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Produto *
                        </label>
                        <select
                          value={subproduto.produtoId}
                          onChange={(e) => atualizarSubproduto(index, 'produtoId', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Selecione um produto</option>
                          {produtosDisponiveis.map(prod => (
                            <option key={prod._id} value={prod._id}>
                              {prod.nome} - R$ {prod.preco.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantidade *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={subproduto.quantidade}
                          onChange={(e) => atualizarSubproduto(index, 'quantidade', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Opcional?
                        </label>
                        <select
                          value={subproduto.opcional?.toString() || 'false'}
                          onChange={(e) => atualizarSubproduto(index, 'opcional', e.target.value === 'true')}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="false">Obrigatório</option>
                          <option value="true">Opcional</option>
                        </select>
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removerSubproduto(index)}
                          className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instruções de Personalização
                      </label>
                      <input
                        type="text"
                        value={subproduto.personalizacao || ''}
                        onChange={(e) => atualizarSubproduto(index, 'personalizacao', e.target.value)}
                        placeholder="Ex: Cores predominantemente rosa, com bordado personalizado..."
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ))}
                
                {subprodutos.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Nenhum item adicionado ao kit</p>
                    <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex space-x-3 pt-6 border-t">
            <button
              type="submit"
              className={`flex-1 ${isKit ? 'bg-purple-600 hover:bg-purple-700' : 'bg-pink-600 hover:bg-pink-700'} text-white py-3 px-4 rounded-lg transition-colors font-medium`}
            >
              {produto ? 'Atualizar' : 'Criar'} {isKit ? 'Kit' : 'Produto'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Produtos

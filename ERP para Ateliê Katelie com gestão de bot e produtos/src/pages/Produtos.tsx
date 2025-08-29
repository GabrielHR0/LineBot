import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package, Search, Baby, Layers, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { ProductsService } from '../service/ProductsService'

interface SubProduct {
  _id: string
  subProduct: string
  quantity: number
  isEssential?: boolean
  bundlePrice?: number
}

interface Produto {
  _id: string
  name: string
  description: string
  price: number
  isActive: boolean
  isSalable: boolean
  subProducts: SubProduct[]
  group: string | null
  compDescription: string
  img: string | null
  createdAt: string
  updatedAt: string
}

interface SubProductDetail {
  _id: string
  name: string
  price: number
  bundlePrice?: number
  isActive: boolean
  product: string
  parentProduct: string
  group: string
  isEssential: boolean
  quantity: number
}

interface Group {
  _id: string
  name: string
  description?: string
}

interface SubProductFormData {
  produtoId: string
  quantity: number
  isEssential: boolean
  bundlePrice: number
}

const Produtos: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [subprodutosDisponiveis, setSubprodutosDisponiveis] = useState<SubProductDetail[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    carregarProdutos()
    carregarSubprodutos()
    carregarGrupos()
  }, [])

  const carregarProdutos = async () => {
    try {
      setLoading(true)
      const data = await ProductsService.getAllProducts()
      setProdutos(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const carregarSubprodutos = async () => {
    try {
      const data = await ProductsService.getAllProducts()
      const subprodutos = data.filter((produto: Produto) => produto.isActive && produto.isSalable)
      setSubprodutosDisponiveis(subprodutos)
    } catch (error) {
      console.error('Erro ao carregar subprodutos:', error)
      toast.error('Erro ao carregar subprodutos disponíveis')
    }
  }

  const carregarGrupos = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4006'}/groups`)
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
    }
  }

  const salvarProduto = async (dadosProduto: Partial<Produto>) => {
    try {
      const dados = {
        ...dadosProduto,
        price: Number(dadosProduto.price) * 100,
        isActive: Boolean(dadosProduto.isActive),
        isSalable: Boolean(dadosProduto.isSalable),
        updatedAt: new Date().toISOString()
      }

      if (editingProduct) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4006'}/products/${editingProduct._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dados)
        })
        toast.success('Produto atualizado com sucesso!')
      } else {
        await ProductsService.createProduct(dados)
        toast.success('Produto criado com sucesso!')
      }
      
      setShowModal(false)
      setEditingProduct(null)
      carregarProdutos()
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      toast.error('Erro ao salvar produto')
    }
  }

  const excluirProduto = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4006'}/products/${id}`, {
        method: 'DELETE'
      })
      toast.success('Produto excluído com sucesso!')
      carregarProdutos()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      toast.error('Erro ao excluir produto')
    }
  }

  const produtosFiltrados = produtos.filter(produto => {
    const matchSearch = produto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       produto.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       produto.compDescription?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  const isProductKit = (produto: Produto) => {
    return produto.subProducts && produto.subProducts.length > 0
  }

  const calcularPrecoKit = (produto: Produto) => {
    if (!isProductKit(produto)) return produto.price / 100
    
    let total = 0
    for (const subProd of produto.subProducts) {
      const subProdDetail = subprodutosDisponiveis.find(sp => sp._id === subProd.subProduct)
      if (subProdDetail) {
        const price = subProd.bundlePrice || subProdDetail.price
        total += (price * subProd.quantity)
      }
    }
    return total / 100
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie produtos individuais e kits</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null)
            setShowModal(true)
          }}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          
          <div className="text-sm text-gray-600 flex items-center">
            <Package className="h-4 w-4 mr-2" />
            {produtosFiltrados.length} produto(s) encontrado(s)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {produtosFiltrados.map((produto) => {
          const precoKit = isProductKit(produto) ? calcularPrecoKit(produto) : produto.price / 100
          
          return (
            <div key={produto._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                {produto.img ? (
                  <img
                    src={produto.img}
                    alt={produto.name}
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
                    produto.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {produto.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                {produto.isSalable && (
                  <div className="absolute top-10 right-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      Disponível
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{produto.name}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{produto.description}</p>
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-pink-600">
                    R$ {precoKit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                {isProductKit(produto) && produto.subProducts && (
                  <div className="mb-3">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Layers className="h-4 w-4 mr-1" />
                      {produto.subProducts.length} itens no kit
                    </div>
                    <div className="text-xs text-gray-500">
                      {produto.subProducts.filter(sp => sp.isEssential).length} essenciais
                    </div>
                  </div>
                )}
                
                {produto.compDescription && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {produto.compDescription}
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingProduct(produto)
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
          )
        })}
      </div>

      {produtosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-600">Comece criando seus produtos</p>
        </div>
      )}

      {showModal && (
        <ProdutoModal
          produto={editingProduct}
          subprodutosDisponiveis={subprodutosDisponiveis}
          groups={groups}
          onSave={salvarProduto}
          onClose={() => {
            setShowModal(false)
            setEditingProduct(null)
          }}
        />
      )}
    </div>
  )
}

const ProdutoModal: React.FC<{
  produto: Produto | null
  subprodutosDisponiveis: SubProductDetail[]
  groups: Group[]
  onSave: (dados: any) => void
  onClose: () => void
}> = ({ produto, subprodutosDisponiveis, groups, onSave, onClose }) => {
  const [subprodutos, setSubprodutos] = useState<SubProduct[]>(
    produto?.subProducts || []
  )

  const [novoSubproduto, setNovoSubproduto] = useState<SubProductFormData>({
    produtoId: '',
    quantity: 1,
    isEssential: false,
    bundlePrice: 0
  })

  const [mostrarFormNovoSubproduto, setMostrarFormNovoSubproduto] = useState(false)

  const adicionarSubproduto = () => {
    setMostrarFormNovoSubproduto(true)
  }

  const salvarNovoSubproduto = async () => {
    try {
      const produtoSelecionado = subprodutosDisponiveis.find(sp => sp._id === novoSubproduto.produtoId)
      if (!produtoSelecionado) {
        toast.error('Selecione um produto válido')
        return
      }

      const subprodutoData = {
        subProduct: novoSubproduto.produtoId,
        quantity: novoSubproduto.quantity,
        isEssential: novoSubproduto.isEssential,
        bundlePrice: novoSubproduto.bundlePrice * 100
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4006'}/subproducts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...subprodutoData,
          parentProduct: produto?._id || '',
          product: novoSubproduto.produtoId
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao criar subproduto')
      }

      const subprodutoCriado = await response.json()

      setSubprodutos([...subprodutos, subprodutoCriado])

      setNovoSubproduto({
        produtoId: '',
        quantity: 1,
        isEssential: false,
        bundlePrice: 0
      })
      setMostrarFormNovoSubproduto(false)

      toast.success('Subproduto adicionado com sucesso!')

    } catch (error) {
      console.error('Erro ao criar subproduto:', error)
      toast.error('Erro ao criar subproduto')
    }
  }

  const removerSubproduto = async (index: number, subprodutoId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4006'}/subproducts/${subprodutoId}`, {
        method: 'DELETE'
      })
      
      setSubprodutos(subprodutos.filter((_, i) => i !== index))
      toast.success('Subproduto removido com sucesso!')
    } catch (error) {
      console.error('Erro ao remover subproduto:', error)
      toast.error('Erro ao remover subproduto')
    }
  }

  const atualizarSubproduto = async (index: number, campo: string, valor: any) => {
    const novosSubprodutos = [...subprodutos]
    novosSubprodutos[index] = { ...novosSubprodutos[index], [campo]: valor }
    setSubprodutos(novosSubprodutos)

    // Atualizar no backend
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4006'}/subproducts/${novosSubprodutos[index]._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [campo]: valor })
      })
    } catch (error) {
      console.error('Erro ao atualizar subproduto:', error)
    }
  }

  const subprodutosFiltrados = subprodutosDisponiveis.filter(sp => 
    sp.isActive && sp._id !== produto?._id
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Package className="h-6 w-6 mr-2 text-pink-600" />
            {produto ? 'Editar Produto' : 'Novo Produto'}
          </h2>
        </div>
        
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            
            const dados = {
              name: formData.get('name') as string,
              description: formData.get('description') as string,
              compDescription: formData.get('compDescription') as string,
              price: Number(formData.get('price')),
              isActive: formData.get('isActive') === 'true',
              isSalable: formData.get('isSalable') === 'true',
              img: formData.get('img') as string,
              subProducts: subprodutos,
              group: formData.get('group') as string || null
            }
            onSave(dados)
          }}
          className="p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={produto?.name || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço (R$) *
              </label>
              <input
                type="number"
                name="price"
                step="0.01"
                min="0"
                required
                defaultValue={produto ? (produto.price / 100).toFixed(2) : ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              name="description"
              rows={2}
              defaultValue={produto?.description || ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição de Composição
            </label>
            <textarea
              name="compDescription"
              rows={2}
              defaultValue={produto?.compDescription || ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Detalhes sobre materiais, composição, etc."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="isActive"
                defaultValue={produto?.isActive?.toString() || 'true'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Disponível para Venda
              </label>
              <select
                name="isSalable"
                defaultValue={produto?.isSalable?.toString() || 'true'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grupo
              </label>
              <select
                name="group"
                defaultValue={produto?.group || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Selecione um grupo</option>
                {groups.map(group => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL da Imagem
            </label>
            <input
              type="url"
              name="img"
              defaultValue={produto?.img || ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                Subprodutos (para kits)
              </h3>
              <button
                type="button"
                onClick={adicionarSubproduto}
                className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Subproduto
              </button>
            </div>

            {mostrarFormNovoSubproduto && (
              <div className="border border-purple-300 rounded-lg p-4 mb-4 bg-purple-50">
                <h4 className="font-semibold text-purple-800 mb-3">Novo Subproduto</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Produto *
                    </label>
                    <select
                      value={novoSubproduto.produtoId}
                      onChange={(e) => {
                        const produtoSelecionado = subprodutosDisponiveis.find(sp => sp._id === e.target.value)
                        setNovoSubproduto({
                          ...novoSubproduto,
                          produtoId: e.target.value,
                          bundlePrice: produtoSelecionado ? produtoSelecionado.price / 100 : 0
                        })
                      }}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Selecione um produto</option>
                      {subprodutosFiltrados.map(sp => (
                        <option key={sp._id} value={sp._id}>
                          {sp.name} - R$ {(sp.price / 100).toFixed(2)}
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
                      value={novoSubproduto.quantity}
                      onChange={(e) => setNovoSubproduto({...novoSubproduto, quantity: Number(e.target.value)})}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço como Subproduto (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={novoSubproduto.bundlePrice}
                      onChange={(e) => setNovoSubproduto({...novoSubproduto, bundlePrice: Number(e.target.value)})}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={novoSubproduto.isEssential}
                        onChange={(e) => setNovoSubproduto({...novoSubproduto, isEssential: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        É essencial?
                      </span>
                    </label>
                  </div>
                </div>

                {novoSubproduto.produtoId && (
                  <div className="text-xs text-gray-500 mb-3">
                    Preço normal de referência: R$ {
                      (subprodutosDisponiveis.find(sp => sp._id === novoSubproduto.produtoId)?.price || 0) / 100
                    }.toFixed(2)
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={salvarNovoSubproduto}
                    className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Salvar Subproduto
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarFormNovoSubproduto(false)}
                    className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {subprodutos.map((subproduto, index) => {
                const subProdDetail = subprodutosDisponiveis.find(sp => sp._id === subproduto.subProduct)
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Produto
                        </label>
                        <select
                          value={subproduto.subProduct}
                          onChange={(e) => atualizarSubproduto(index, 'subProduct', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          disabled
                        >
                          <option value={subproduto.subProduct}>
                            {subProdDetail?.name || 'Carregando...'}
                          </option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantidade
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={subproduto.quantity}
                          onChange={(e) => atualizarSubproduto(index, 'quantity', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preço (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={subproduto.bundlePrice ? subproduto.bundlePrice / 100 : 0}
                          onChange={(e) => atualizarSubproduto(index, 'bundlePrice', Number(e.target.value) * 100)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>
                      
                      <div className="flex items-end space-x-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={subproduto.isEssential || false}
                            onChange={(e) => atualizarSubproduto(index, 'isEssential', e.target.checked)}
                            className="mr-1"
                          />
                          <span className="text-xs text-gray-700">Essencial</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removerSubproduto(index, subproduto._id!)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {subProdDetail && (
                      <div className="mt-2 text-xs text-gray-500">
                        Preço normal: R$ {(subProdDetail.price / 100).toFixed(2)} | 
                        Grupo: {subProdDetail.group} | 
                        {subproduto.isEssential && ' ⭐ Essencial'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {subprodutos.length === 0 && !mostrarFormNovoSubproduto && (
              <div className="text-center py-8 text-gray-500">
                <Layers className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhum subproduto adicionado</p>
                <p className="text-sm">Clique em "Adicionar Subproduto" para começar</p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3 pt-6 border-t">
            <button
              type="submit"
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              {produto ? 'Atualizar' : 'Criar'} Produto
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
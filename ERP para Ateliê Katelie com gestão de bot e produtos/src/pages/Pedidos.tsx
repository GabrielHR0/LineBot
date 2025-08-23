
import React, { useState, useEffect } from 'react'
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter,
  Eye,
  Edit,
  MapPin,
  CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'
import { lumi } from '../lib/lumi'

interface Pedido {
  _id: string
  numeroPedido: string
  clienteNome: string
  clienteTelefone: string
  clienteEndereco?: {
    rua: string
    numero: string
    bairro: string
    cidade: string
    cep: string
  }
  itens: Array<{
    produtoId: string
    produtoNome: string
    quantidade: number
    precoUnitario: number
    subtotal: number
  }>
  valorTotal: number
  status: 'pendente' | 'confirmado' | 'producao' | 'pronto' | 'enviado' | 'entregue' | 'cancelado'
  formaPagamento: 'dinheiro' | 'cartao' | 'pix' | 'transferencia'
  statusPagamento: 'pendente' | 'pago' | 'cancelado'
  dataEntregaPrevista?: string
  observacoes?: string
  criadoEm: string
}

const Pedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)

  const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'confirmado', label: 'Confirmado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    { value: 'producao', label: 'Em Produção', color: 'bg-purple-100 text-purple-800', icon: Package },
    { value: 'pronto', label: 'Pronto', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'enviado', label: 'Enviado', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
    { value: 'entregue', label: 'Entregue', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: Clock }
  ]

  const formasPagamento = {
    dinheiro: 'Dinheiro',
    cartao: 'Cartão',
    pix: 'PIX',
    transferencia: 'Transferência'
  }

  useEffect(() => {
    carregarPedidos()
  }, [])

  const carregarPedidos = async () => {
    try {
      setLoading(true)
      const { list } = await lumi.entities.pedidos.list()
      setPedidos(list || [])
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const atualizarStatus = async (id: string, novoStatus: string) => {
    try {
      await lumi.entities.pedidos.update(id, { 
        status: novoStatus,
        atualizadoEm: new Date().toISOString()
      })
      toast.success('Status atualizado com sucesso!')
      carregarPedidos()
      
      if (pedidoSelecionado?._id === id) {
        setPedidoSelecionado({ ...pedidoSelecionado, status: novoStatus as any })
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const atualizarStatusPagamento = async (id: string, novoStatus: string) => {
    try {
      await lumi.entities.pedidos.update(id, { 
        statusPagamento: novoStatus,
        atualizadoEm: new Date().toISOString()
      })
      toast.success('Status de pagamento atualizado!')
      carregarPedidos()
      
      if (pedidoSelecionado?._id === id) {
        setPedidoSelecionado({ ...pedidoSelecionado, statusPagamento: novoStatus as any })
      }
    } catch (error) {
      console.error('Erro ao atualizar status de pagamento:', error)
      toast.error('Erro ao atualizar status de pagamento')
    }
  }

  const pedidosFiltrados = pedidos.filter(pedido => {
    const matchSearch = pedido.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       pedido.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       pedido.clienteTelefone.includes(searchTerm)
    const matchStatus = !statusFilter || pedido.status === statusFilter
    return matchSearch && matchStatus
  })

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption?.color || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption?.label || status
  }

  const getStatusIcon = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption?.icon || Clock
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
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600">Gerencie todos os pedidos do ateliê</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, cliente ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Todos os status</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-600 flex items-center">
            <ShoppingCart className="h-4 w-4 mr-2" />
            {pedidosFiltrados.length} pedido(s) encontrado(s)
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="grid grid-cols-1 gap-4">
        {pedidosFiltrados.map((pedido) => {
          const StatusIcon = getStatusIcon(pedido.status)
          return (
            <div key={pedido._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {pedido.numeroPedido}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pedido.status)}`}>
                      <StatusIcon className="h-4 w-4 inline mr-1" />
                      {getStatusLabel(pedido.status)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pedido.statusPagamento === 'pago' 
                        ? 'bg-green-100 text-green-800' 
                        : pedido.statusPagamento === 'cancelado'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pedido.statusPagamento === 'pago' ? 'Pago' : 
                       pedido.statusPagamento === 'cancelado' ? 'Cancelado' : 'Pendente'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Cliente:</strong> {pedido.clienteNome}
                    </div>
                    <div>
                      <strong>Telefone:</strong> {pedido.clienteTelefone}
                    </div>
                    <div>
                      <strong>Total:</strong> R$ {pedido.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Itens:</strong> {pedido.itens.map(item => `${item.quantidade}x ${item.produtoNome}`).join(', ')}
                  </div>
                  
                  {pedido.dataEntregaPrevista && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Entrega prevista:</strong> {new Date(pedido.dataEntregaPrevista).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-2">
                  <button
                    onClick={() => {
                      setPedidoSelecionado(pedido)
                      setShowModal(true)
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Detalhes
                  </button>
                  
                  <select
                    value={pedido.status}
                    onChange={(e) => atualizarStatus(pedido._id, e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {pedidosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
          <p className="text-gray-600">Os pedidos aparecerão aqui quando forem criados</p>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showModal && pedidoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalhes do Pedido {pedidoSelecionado.numeroPedido}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informações do Cliente */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Informações do Cliente
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Nome:</strong> {pedidoSelecionado.clienteNome}</div>
                    <div><strong>Telefone:</strong> {pedidoSelecionado.clienteTelefone}</div>
                    {pedidoSelecionado.clienteEndereco && (
                      <div>
                        <strong>Endereço:</strong><br />
                        {pedidoSelecionado.clienteEndereco.rua}, {pedidoSelecionado.clienteEndereco.numero}<br />
                        {pedidoSelecionado.clienteEndereco.bairro} - {pedidoSelecionado.clienteEndereco.cidade}<br />
                        CEP: {pedidoSelecionado.clienteEndereco.cep}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Informações do Pedido
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Data:</strong> {new Date(pedidoSelecionado.criadoEm).toLocaleString('pt-BR')}</div>
                    <div><strong>Forma de Pagamento:</strong> {formasPagamento[pedidoSelecionado.formaPagamento]}</div>
                    <div className="flex items-center space-x-2">
                      <strong>Status do Pagamento:</strong>
                      <select
                        value={pedidoSelecionado.statusPagamento}
                        onChange={(e) => atualizarStatusPagamento(pedidoSelecionado._id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="pago">Pago</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                    {pedidoSelecionado.dataEntregaPrevista && (
                      <div><strong>Entrega Prevista:</strong> {new Date(pedidoSelecionado.dataEntregaPrevista).toLocaleDateString('pt-BR')}</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Itens do Pedido */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Itens do Pedido</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3">Produto</th>
                        <th className="text-center p-3">Quantidade</th>
                        <th className="text-right p-3">Preço Unit.</th>
                        <th className="text-right p-3">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidoSelecionado.itens.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="p-3">{item.produtoNome}</td>
                          <td className="text-center p-3">{item.quantidade}</td>
                          <td className="text-right p-3">
                            R$ {item.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="text-right p-3">
                            R$ {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan={3} className="text-right p-3">Total:</td>
                        <td className="text-right p-3">
                          R$ {pedidoSelecionado.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Observações */}
              {pedidoSelecionado.observacoes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Observações</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    {pedidoSelecionado.observacoes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pedidos

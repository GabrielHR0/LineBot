
import React, { useState, useEffect } from 'react'
import { MessageSquare, User, Clock, Phone, Search, Filter, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { lumi } from '../lib/lumi'

interface Atendimento {
  _id: string
  clienteNome: string
  clienteTelefone: string
  status: 'aguardando' | 'em_andamento' | 'aguardando_humano' | 'finalizado' | 'cancelado'
  mensagens: Array<{
    remetente: 'cliente' | 'bot' | 'atendente'
    mensagem: string
    timestamp: string
  }>
  produtoInteresse?: string
  observacoes?: string
  criadoEm: string
}

const Atendimentos: React.FC = () => {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<Atendimento | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [novaMensagem, setNovaMensagem] = useState('')

  const statusOptions = [
    { value: 'aguardando', label: 'Aguardando', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
    { value: 'aguardando_humano', label: 'Aguardando Humano', color: 'bg-orange-100 text-orange-800' },
    { value: 'finalizado', label: 'Finalizado', color: 'bg-green-100 text-green-800' },
    { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  ]

  useEffect(() => {
    carregarAtendimentos()
  }, [])

  const carregarAtendimentos = async () => {
    try {
      setLoading(true)
      const { list } = await lumi.entities.atendimentos.list()
      setAtendimentos(list || [])
    } catch (error) {
      console.error('Erro ao carregar atendimentos:', error)
      toast.error('Erro ao carregar atendimentos')
    } finally {
      setLoading(false)
    }
  }

  const atualizarStatus = async (id: string, novoStatus: string) => {
    try {
      await lumi.entities.atendimentos.update(id, { 
        status: novoStatus,
        atualizadoEm: new Date().toISOString()
      })
      toast.success('Status atualizado com sucesso!')
      carregarAtendimentos()
      
      // Atualizar atendimento selecionado se for o mesmo
      if (atendimentoSelecionado?._id === id) {
        const atendimentoAtualizado = atendimentos.find(a => a._id === id)
        if (atendimentoAtualizado) {
          setAtendimentoSelecionado({ ...atendimentoAtualizado, status: novoStatus as any })
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || !atendimentoSelecionado) return

    try {
      const novaMensagemObj = {
        remetente: 'atendente' as const,
        mensagem: novaMensagem,
        timestamp: new Date().toISOString()
      }

      const mensagensAtualizadas = [...(atendimentoSelecionado.mensagens || []), novaMensagemObj]

      await lumi.entities.atendimentos.update(atendimentoSelecionado._id, {
        mensagens: mensagensAtualizadas,
        atualizadoEm: new Date().toISOString()
      })

      setAtendimentoSelecionado({
        ...atendimentoSelecionado,
        mensagens: mensagensAtualizadas
      })

      setNovaMensagem('')
      toast.success('Mensagem enviada!')
      carregarAtendimentos()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    }
  }

  const atendimentosFiltrados = atendimentos.filter(atendimento => {
    const matchSearch = atendimento.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       atendimento.clienteTelefone.includes(searchTerm)
    const matchStatus = !statusFilter || atendimento.status === statusFilter
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Lista de Atendimentos */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Atendimentos</h2>
          
          {/* Filtros */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            <div className="relative">
              <Filter className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Todos os status</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {atendimentosFiltrados.map((atendimento) => (
            <div
              key={atendimento._id}
              onClick={() => setAtendimentoSelecionado(atendimento)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                atendimentoSelecionado?._id === atendimento._id ? 'bg-pink-50 border-pink-200' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{atendimento.clienteNome}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(atendimento.status)}`}>
                  {getStatusLabel(atendimento.status)}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Phone className="h-4 w-4 mr-1" />
                {atendimento.clienteTelefone}
              </div>
              
              {atendimento.produtoInteresse && (
                <div className="text-sm text-gray-600 mb-2">
                  Interesse: {atendimento.produtoInteresse}
                </div>
              )}
              
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(atendimento.criadoEm).toLocaleString('pt-BR')}
              </div>
            </div>
          ))}
          
          {atendimentosFiltrados.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhum atendimento encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {atendimentoSelecionado ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{atendimentoSelecionado.clienteNome}</h3>
                  <p className="text-sm text-gray-600">{atendimentoSelecionado.clienteTelefone}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <select
                    value={atendimentoSelecionado.status}
                    onChange={(e) => atualizarStatus(atendimentoSelecionado._id, e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {atendimentoSelecionado.observacoes && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                  <strong>Observações:</strong> {atendimentoSelecionado.observacoes}
                </div>
              )}
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {atendimentoSelecionado.mensagens?.map((mensagem, index) => (
                <div
                  key={index}
                  className={`flex ${mensagem.remetente === 'cliente' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    mensagem.remetente === 'cliente'
                      ? 'bg-white text-gray-900'
                      : mensagem.remetente === 'bot'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-pink-600 text-white'
                  }`}>
                    <p className="text-sm">{mensagem.mensagem}</p>
                    <p className={`text-xs mt-1 ${
                      mensagem.remetente === 'atendente' ? 'text-pink-200' : 'text-gray-500'
                    }`}>
                      {new Date(mensagem.timestamp).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  onClick={enviarMensagem}
                  disabled={!novaMensagem.trim()}
                  className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Selecione um atendimento</p>
              <p>Escolha um atendimento da lista para visualizar o chat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Atendimentos

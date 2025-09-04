
import React, { useState, useEffect } from 'react'
import { 
  Users, 
  MessageSquare, 
  Send, 
  Phone, 
  Clock, 
  AlertCircle,
  CheckCircle,
  User,
  ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { lumi } from '../lib/lumi'

interface AtendimentoHumano {
  _id: string
  clienteNome: string
  clienteTelefone: string
  status: 'aguardando_humano' | 'em_andamento' | 'finalizado'
  mensagens: Array<{
    remetente: 'cliente' | 'bot' | 'atendente'
    mensagem: string
    timestamp: string
  }>
  produtoInteresse?: string
  observacoes?: string
  atendenteId?: string
  criadoEm: string
  tempoEspera?: number
}

const AtendimentoHumano: React.FC = () => {
  const [atendimentos, setAtendimentos] = useState<AtendimentoHumano[]>([])
  const [atendimentoAtivo, setAtendimentoAtivo] = useState<AtendimentoHumano | null>(null)
  const [loading, setLoading] = useState(true)
  const [novaMensagem, setNovaMensagem] = useState('')
  const [atendenteId] = useState('atendente_001') // Simular ID do atendente logado

  useEffect(() => {
    carregarAtendimentosHumanos()
    // Simular atualizações em tempo real
    const interval = setInterval(carregarAtendimentosHumanos, 30000)
    return () => clearInterval(interval)
  }, [])

  const carregarAtendimentosHumanos = async () => {
    try {
      setLoading(true)
      const { list } = await lumi.entities.atendimentos.list()
      
      // Filtrar apenas atendimentos que precisam de humano
      const atendimentosHumanos = (list || [])
        .filter(atendimento => 
          atendimento.status === 'aguardando_humano' || 
          (atendimento.status === 'em_andamento' && atendimento.atendenteId === atendenteId)
        )
        .map(atendimento => ({
          ...atendimento,
          tempoEspera: calcularTempoEspera(atendimento.criadoEm)
        }))
        .sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime())
      
      setAtendimentos(atendimentosHumanos)
    } catch (error) {
      console.error('Erro ao carregar atendimentos humanos:', error)
      toast.error('Erro ao carregar atendimentos')
    } finally {
      setLoading(false)
    }
  }

  const calcularTempoEspera = (criadoEm: string): number => {
    const agora = new Date()
    const criacao = new Date(criadoEm)
    return Math.floor((agora.getTime() - criacao.getTime()) / (1000 * 60)) // em minutos
  }

  const assumirAtendimento = async (atendimento: AtendimentoHumano) => {
    try {
      await lumi.entities.atendimentos.update(atendimento._id, {
        status: 'em_andamento',
        atendenteId: atendenteId,
        atualizadoEm: new Date().toISOString()
      })
      
      // Adicionar mensagem automática
      const mensagemAutomatica = {
        remetente: 'atendente' as const,
        mensagem: 'Olá! Sou um atendente humano e vou ajudar você agora. Como posso te ajudar?',
        timestamp: new Date().toISOString()
      }
      
      const mensagensAtualizadas = [...(atendimento.mensagens || []), mensagemAutomatica]
      
      await lumi.entities.atendimentos.update(atendimento._id, {
        mensagens: mensagensAtualizadas
      })
      
      setAtendimentoAtivo({
        ...atendimento,
        status: 'em_andamento',
        atendenteId: atendenteId,
        mensagens: mensagensAtualizadas
      })
      
      toast.success('Atendimento assumido com sucesso!')
      carregarAtendimentosHumanos()
    } catch (error) {
      console.error('Erro ao assumir atendimento:', error)
      toast.error('Erro ao assumir atendimento')
    }
  }

  const finalizarAtendimento = async () => {
    if (!atendimentoAtivo) return
    
    try {
      await lumi.entities.atendimentos.update(atendimentoAtivo._id, {
        status: 'finalizado',
        atualizadoEm: new Date().toISOString()
      })
      
      toast.success('Atendimento finalizado!')
      setAtendimentoAtivo(null)
      carregarAtendimentosHumanos()
    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error)
      toast.error('Erro ao finalizar atendimento')
    }
  }

  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || !atendimentoAtivo) return

    try {
      const novaMensagemObj = {
        remetente: 'atendente' as const,
        mensagem: novaMensagem,
        timestamp: new Date().toISOString()
      }

      const mensagensAtualizadas = [...(atendimentoAtivo.mensagens || []), novaMensagemObj]

      await lumi.entities.atendimentos.update(atendimentoAtivo._id, {
        mensagens: mensagensAtualizadas,
        atualizadoEm: new Date().toISOString()
      })

      setAtendimentoAtivo({
        ...atendimentoAtivo,
        mensagens: mensagensAtualizadas
      })

      setNovaMensagem('')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    }
  }

  const atendimentosAguardando = atendimentos.filter(a => a.status === 'aguardando_humano')
  const meuAtendimento = atendimentos.find(a => a.status === 'em_andamento' && a.atendenteId === atendenteId)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Sidebar - Fila de Atendimento */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <h2 className="text-lg font-semibold flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Atendimento Humano
          </h2>
          <p className="text-sm text-orange-100 mt-1">
            {atendimentosAguardando.length} cliente(s) aguardando
          </p>
        </div>

        {/* Meu Atendimento Ativo */}
        {meuAtendimento && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Meu Atendimento Ativo
            </h3>
            <div
              onClick={() => setAtendimentoAtivo(meuAtendimento)}
              className={`p-3 bg-white rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                atendimentoAtivo?._id === meuAtendimento._id ? 'border-blue-500 shadow-md' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{meuAtendimento.clienteNome}</h4>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Em andamento
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex items-center mb-1">
                  <Phone className="h-3 w-3 mr-1" />
                  {meuAtendimento.clienteTelefone}
                </div>
                {meuAtendimento.produtoInteresse && (
                  <div className="text-xs text-gray-500">
                    Interesse: {meuAtendimento.produtoInteresse}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fila de Espera */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Fila de Espera
            </h3>
            
            {atendimentosAguardando.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhum cliente aguardando</p>
                <p className="text-sm">Você está em dia! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {atendimentosAguardando.map((atendimento) => (
                  <div
                    key={atendimento._id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{atendimento.clienteNome}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (atendimento.tempoEspera || 0) > 10 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {atendimento.tempoEspera}min
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex items-center mb-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {atendimento.clienteTelefone}
                      </div>
                      {atendimento.produtoInteresse && (
                        <div className="text-xs text-gray-500">
                          Interesse: {atendimento.produtoInteresse}
                        </div>
                      )}
                      {atendimento.observacoes && (
                        <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded mt-2">
                          {atendimento.observacoes}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => assumirAtendimento(atendimento)}
                      className="w-full bg-orange-600 text-white py-2 px-3 rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center justify-center"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Assumir Atendimento
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {atendimentoAtivo ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{atendimentoAtivo.clienteNome}</h3>
                  <p className="text-sm text-gray-600">{atendimentoAtivo.clienteTelefone}</p>
                  {atendimentoAtivo.produtoInteresse && (
                    <p className="text-xs text-blue-600">Interesse: {atendimentoAtivo.produtoInteresse}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Atendimento Ativo
                  </span>
                  <button
                    onClick={finalizarAtendimento}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {atendimentoAtivo.mensagens?.map((mensagem, index) => (
                <div
                  key={index}
                  className={`flex ${mensagem.remetente === 'cliente' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    mensagem.remetente === 'cliente'
                      ? 'bg-white text-gray-900 border border-gray-200'
                      : mensagem.remetente === 'bot'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-orange-600 text-white'
                  }`}>
                    <p className="text-sm">{mensagem.mensagem}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${
                        mensagem.remetente === 'atendente' ? 'text-orange-200' : 'text-gray-500'
                      }`}>
                        {mensagem.remetente === 'cliente' ? 'Cliente' : 
                         mensagem.remetente === 'bot' ? 'Bot' : 'Você'}
                      </p>
                      <p className={`text-xs ${
                        mensagem.remetente === 'atendente' ? 'text-orange-200' : 'text-gray-500'
                      }`}>
                        {new Date(mensagem.timestamp).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
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
                  placeholder="Digite sua mensagem para o cliente..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={enviarMensagem}
                  disabled={!novaMensagem.trim()}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Enviar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <Users className="h-20 w-20 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium mb-2">Atendimento Humano</h3>
              <p className="text-lg mb-4">
                {atendimentosAguardando.length > 0 
                  ? `${atendimentosAguardando.length} cliente(s) aguardando atendimento`
                  : 'Nenhum cliente na fila'
                }
              </p>
              {atendimentosAguardando.length > 0 && (
                <p className="text-sm text-orange-600">
                  Selecione um atendimento da fila para começar
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AtendimentoHumano

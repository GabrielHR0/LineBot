import React, { useState, useEffect, useRef } from 'react'
import { 
  Package, 
  ShoppingCart, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Users,
  QrCode,
  Smartphone,
  Baby,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  PowerOff,
} from 'lucide-react'
import { lumi } from '../lib/lumi'
import { whatsappService } from '../service/whatsappService'

interface DashboardStats {
  totalProdutos: number
  kitsEnxoval: number
  encomendasPendentes: number
  encomendasProducao: number
  atendimentosAtivos: number
  atendimentosHumanos: number
  faturamentoMes: number
  tempoMedioProducao: number
}

interface WhatsAppStatus {
  connected: boolean
  qrCode?: string
  botName?: string
  loading: boolean
  error?: string
  lastChecked?: string
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProdutos: 0,
    kitsEnxoval: 0,
    encomendasPendentes: 0,
    encomendasProducao: 0,
    atendimentosAtivos: 0,
    atendimentosHumanos: 0,
    faturamentoMes: 0,
    tempoMedioProducao: 0
  })
  const [loading, setLoading] = useState(true)
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>({
    connected: false,
    loading: false
  })
  const [error, setError] = useState<string | null>(null)

  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastStatusRef = useRef<string>('')
  const checkCountRef = useRef(0)

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await carregarEstatisticas()
        await verificarStatusWhatsApp()
        iniciarVerificacaoPeriodica()
      } catch (err) {
        console.error('Erro ao inicializar dashboard:', err)
        setError('Erro ao carregar dashboard. Verifique o console.')
      }
    }

    initializeDashboard()
    
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current)
      }
    }
  }, [])

  const carregarEstatisticas = async () => {
    try {
      setLoading(true)
      
      // Dados mockados para teste - substitua pelas chamadas reais da Lumi
      const produtosList = [
        { id: 1, categoria: 'kit_enxoval', tempoProducao: 5 },
        { id: 2, categoria: 'kit_enxoval', tempoProducao: 7 },
        { id: 3, categoria: 'produto_unitario', tempoProducao: 3 },
        { id: 4, categoria: 'produto_unitario', tempoProducao: 2 },
      ]
      
      const pedidosList = [
        { id: 1, status: 'pendente', statusPagamento: 'pago', valorTotal: 150, criadoEm: new Date() },
        { id: 2, status: 'producao', statusPagamento: 'pago', valorTotal: 200, criadoEm: new Date() },
        { id: 3, status: 'pendente', statusPagamento: 'pendente', valorTotal: 100, criadoEm: new Date() },
      ]
      
      const atendimentosList = [
        { id: 1, status: 'em_andamento' },
        { id: 2, status: 'aguardando_humano' },
        { id: 3, status: 'em_andamento' },
      ]
      
      // Calcular estatísticas
      const kitsEnxoval = produtosList.filter(p => p.categoria === 'kit_enxoval').length
      const encomendasPendentes = pedidosList.filter(p => p.status === 'pendente' || p.status === 'confirmado').length
      const encomendasProducao = pedidosList.filter(p => p.status === 'producao').length
      const atendimentosAtivos = atendimentosList.filter(a => a.status === 'em_andamento').length
      const atendimentosHumanos = atendimentosList.filter(a => a.status === 'aguardando_humano').length
      
      // Calcular faturamento do mês atual
      const agora = new Date()
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
      const faturamentoMes = pedidosList
        .filter(p => new Date(p.criadoEm) >= inicioMes && p.statusPagamento === 'pago')
        .reduce((total, p) => total + p.valorTotal, 0)
      
      // Calcular tempo médio de produção
      const tempoMedioProducao = produtosList.length > 0 
        ? Math.round(produtosList.reduce((total, p) => total + p.tempoProducao, 0) / produtosList.length)
        : 0
      
      setStats({
        totalProdutos: produtosList.length,
        kitsEnxoval,
        encomendasPendentes,
        encomendasProducao,
        atendimentosAtivos,
        atendimentosHumanos,
        faturamentoMes,
        tempoMedioProducao
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      setError('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  const verificarStatusWhatsApp = async () => {
  try {
    checkCountRef.current++
    
    const shouldShowLoading = checkCountRef.current < 3
    
    if (shouldShowLoading) {
      setWhatsappStatus(prev => ({ 
        ...prev, 
        loading: true 
      }))
    }
    
    const status = await whatsappService.checkStatus()
    
    const currentStatus = status.connected ? 'connected' : 'disconnected'
    
    // ✅ REDUZIDO: Só loga quando o status muda ou a cada 10 verificações
    if (currentStatus !== lastStatusRef.current || checkCountRef.current % 10 === 0) {
      console.log('📱 Status do WhatsApp:', currentStatus)
      lastStatusRef.current = currentStatus
    }
    
    setWhatsappStatus(prev => ({
      ...prev,
      connected: status.connected,
      loading: false,
      lastChecked: new Date().toLocaleTimeString(),
      error: status.error
    }))
    
  } catch (error) {
    // ✅ REDUZIDO: Só loga erros a cada 5 tentativas
    if (checkCountRef.current % 5 === 0) {
      console.error('Erro ao verificar status WhatsApp:', error)
    }
    
    setWhatsappStatus(prev => ({
      ...prev,
      loading: false,
      error: 'Erro ao conectar com o serviço WhatsApp'
    }))
  }
}

const iniciarVerificacaoPeriodica = () => {
  if (statusIntervalRef.current) {
    clearInterval(statusIntervalRef.current)
  }
  
  // ✅ AUMENTADO: Verifica a cada 30 segundos em vez de 10
  statusIntervalRef.current = setInterval(() => {
    if (!whatsappStatus.loading) {
      verificarStatusWhatsApp()
    }
  }, 30000) // 30 segundos
}

  const conectarWhatsApp = async () => {
    try {
      setWhatsappStatus(prev => ({ 
        ...prev, 
        loading: true, 
        error: undefined 
      }))
      
      // ✅ ADICIONADO: Pequena pausa antes de forçar desconexão
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Primeiro força uma desconexão completa para limpar qualquer estado anterior
      await whatsappService.forceDisconnect()
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Agora inicializa o bot e obtém QR code
      await whatsappService.initBot('lineBot')
      
      const qrResponse = await whatsappService.getQRCode('lineBot')
      
      if (qrResponse.qrcode) {
        setWhatsappStatus({
          connected: false,
          qrCode: qrResponse.qrcode,
          botName: qrResponse.name,
          loading: false
        })
        
        // Inicia verificação mais frequente enquanto espera conexão
        iniciarVerificacaoPeriodica()
        
      } else if (qrResponse.error && qrResponse.error.includes('já está pronto')) {
        // Se já está conectado, força verificação imediata
        await verificarStatusWhatsApp()
      } else {
        await verificarStatusWhatsApp()
      }
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error)
      
      // Em caso de erro, verifica o status atual
      await verificarStatusWhatsApp()
      
      setWhatsappStatus(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao tentar conectar. Tente novamente.'
      }))
    }
  }

  const desconectarWhatsApp = async () => {
    try {
      setWhatsappStatus(prev => ({ 
        ...prev, 
        loading: true, 
        error: undefined 
      }))
      
      const result = await whatsappService.disconnect()
      
      if (result.success) {
        setWhatsappStatus({
          connected: false,
          loading: false,
          qrCode: undefined
        })
      } else {
        setWhatsappStatus(prev => ({
          ...prev,
          loading: false,
          error: result.message || 'Erro ao desconectar'
        }))
      }
    } catch (error) {
      console.error('Erro ao desconectar WhatsApp:', error)
      setWhatsappStatus(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao desconectar. Tente novamente.'
      }))
    }
  }

  const desconectarCompletamente = async () => {
    try {
      setWhatsappStatus(prev => ({ 
        ...prev, 
        loading: true, 
        error: undefined 
      }))
      
      const result = await whatsappService.logout()
      
      if (result.success) {
        setWhatsappStatus({
          connected: false,
          loading: false,
          qrCode: undefined,
          error: undefined
        })
        
        alert('WhatsApp desconectado completamente!')
      } else {
        setWhatsappStatus(prev => ({
          ...prev,
          loading: false,
          error: result.message || 'Erro ao desconectar'
        }))
      }
    } catch (error) {
      console.error('Erro ao desconectar completamente:', error)
      setWhatsappStatus(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao desconectar. Tente novamente.'
      }))
    }
  }

  const forcarAtualizacaoStatus = async () => {
    checkCountRef.current = 0;
    await verificarStatusWhatsApp()
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Dashboard - Ateliê Katelie</h1>
          <p className="text-pink-100">Sistema de gestão de encomendas e atendimento WhatsApp</p>
        </div>

        {/* Status WhatsApp */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Smartphone className="h-6 w-6 mr-2 text-green-600" />
              Status do Bot WhatsApp
            </h2>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                whatsappStatus.connected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  whatsappStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
                {whatsappStatus.connected ? 'Conectado' : 'Desconectado'}
              </div>
              
              <button
                onClick={forcarAtualizacaoStatus}
                disabled={whatsappStatus.loading}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="Atualizar status"
              >
                <RefreshCw className={`h-4 w-4 ${whatsappStatus.loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {whatsappStatus.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {whatsappStatus.error}
              </p>
            </div>
          )}

          {whatsappStatus.lastChecked && (
            <div className="text-xs text-gray-500 mb-4">
              Última verificação: {whatsappStatus.lastChecked}
            </div>
          )}

          {whatsappStatus.connected ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-green-900">Bot WhatsApp ativo e funcionando!</p>
                  <p className="text-sm text-green-700">Recebendo mensagens e atendendo clientes automaticamente.</p>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3 justify-center">
                <button
                  onClick={desconectarWhatsApp}
                  disabled={whatsappStatus.loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <PowerOff className="h-5 w-5 mr-2" />
                  Desconectar WhatsApp
                </button>
                
                <button
                  onClick={forcarAtualizacaoStatus}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Status
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center p-4 bg-yellow-50 rounded-lg mb-4">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="font-medium text-yellow-900">Bot WhatsApp desconectado</p>
                    <p className="text-sm text-yellow-700">
                      {whatsappStatus.qrCode 
                        ? "Escaneie o QR Code para conectar" 
                        : "Gere um QR Code para conectar"
                      }
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Como conectar:</h3>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Abra o WhatsApp no seu celular</li>
                    <li>2. Vá em Configurações → Dispositivos conectados</li>
                    <li>3. Toque em "Conectar um dispositivo"</li>
                    <li>4. Escaneie o QR Code ao lado</li>
                  </ol>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={conectarWhatsApp}
                      disabled={whatsappStatus.loading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 flex-1"
                    >
                      {whatsappStatus.loading ? (
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <QrCode className="h-5 w-5 mr-2" />
                      )}
                      {whatsappStatus.loading ? 'Conectando...' : 'Conectar WhatsApp'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                {whatsappStatus.qrCode ? (
                  <div className="text-center">
                    <img 
                      src={whatsappStatus.qrCode} 
                      alt="QR Code WhatsApp" 
                      className="border-2 border-gray-300 rounded-lg w-48 h-48 object-contain mx-auto"
                    />
                    <p className="text-sm text-gray-600 mt-2">Escaneie com WhatsApp</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center text-gray-500">
                      <QrCode className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Clique para conectar</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProdutos}</p>
              </div>
              <Package className="h-12 w-12 text-blue-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">{stats.kitsEnxoval} kits de enxoval</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Encomendas Pendentes</p>
                <p className="text-3xl font-bold text-orange-600">{stats.encomendasPendentes}</p>
              </div>
              <Clock className="h-12 w-12 text-orange-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">{stats.encomendasProducao} em produção</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Atendimentos Ativos</p>
                <p className="text-3xl font-bold text-green-600">{stats.atendimentosAtivos}</p>
              </div>
              <MessageSquare className="h-12 w-12 text-green-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">{stats.atendimentosHumanos} aguardando humano</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento Mês</p>
                <p className="text-3xl font-bold text-pink-600">
                  R$ {stats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-pink-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">Tempo médio: {stats.tempoMedioProducao} dias</span>
            </div>
          </div>
        </div>

        {/* Resumo de Encomendas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Baby className="h-5 w-5 mr-2 text-purple-600" />
              Kits de Enxoval Populares
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <span className="font-medium text-purple-900">Kit Completo - Menina</span>
                <span className="text-purple-600">15 encomendas</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span className="font-medium text-blue-900">Kit Básico - Menino</span>
                <span className="text-blue-600">12 encomendas</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="font-medium text-green-900">Kit Unissex</span>
                <span className="text-green-600">8 encomendas</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-orange-600" />
              Atendimentos Recentes
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <div>
                  <span className="font-medium text-green-900">Maria Silva</span>
                  <p className="text-sm text-green-600">Interesse em kit menina</p>
                </div>
                <span className="text-xs text-green-500">Em andamento</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                <div>
                  <span className="font-medium text-orange-900">João Santos</span>
                  <p className="text-sm text-orange-600">Pedido personalizado</p>
                </div>
                <span className="text-xs text-orange-500">Aguarda humano</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                <div>
                  <span className="font-medium text-yellow-900">Ana Costa</span>
                  <p className="text-sm text-yellow-600">Dúvidas sobre tamanhos</p>
                </div>
                <span className="text-xs text-yellow-500">Aguardando</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 transition-colors">
              <Baby className="h-8 w-8 text-purple-600 mr-2" />
              <span className="font-medium text-purple-900">Novo Kit Enxoval</span>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-pink-300 rounded-lg hover:border-pink-500 transition-colors">
              <Package className="h-8 w-8 text-pink-600 mr-2" />
              <span className="font-medium text-pink-900">Novo Produto</span>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 transition-colors">
              <MessageSquare className="h-8 w-8 text-green-600 mr-2" />
              <span className="font-medium text-green-900">Ver Atendimentos</span>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 transition-colors">
              <ShoppingCart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">Nova Encomenda</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
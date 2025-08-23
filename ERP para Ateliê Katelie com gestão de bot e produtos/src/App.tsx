
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Produtos from './pages/Produtos'
import Atendimentos from './pages/Atendimentos'
import Pedidos from './pages/Pedidos'
import AtendimentoHumano from './pages/AtendimentoHumano'

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#059669',
            },
          },
          error: {
            style: {
              background: '#dc2626',
            },
          },
        }}
      />
      
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/atendimentos" element={<Atendimentos />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/atendimento-humano" element={<AtendimentoHumano />} />
          </Routes>
        </Layout>
      </Router>
    </>
  )
}

export default App

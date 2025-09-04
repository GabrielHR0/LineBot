import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Search, Baby, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductsService } from '../service/ProductsService';

interface SubProduct {
  _id: string;
  subProduct: string;
  quantity: number;
  isEssential?: boolean;
  bundlePrice?: number;
}

interface Produto {
  _id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  isSalable: boolean;
  subProducts: SubProduct[];
  group: string | null;
  compDescription: string;
  img: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubProductDetail {
  _id: string;
  name: string;
  price: number;
  bundlePrice?: number;
  isActive: boolean;
  product: string;
  parentProduct: string;
  group: string;
  isEssential: boolean;
  quantity: number;
}

interface Group {
  _id: string;
  name: string;
  description?: string;
}

interface SubProductFormData {
  produtoId: string;
  quantity: number;
  isEssential: boolean;
  bundlePrice: number;
}

const Produtos: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [subprodutosDisponiveis, setSubprodutosDisponiveis] = useState<SubProductDetail[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    carregarProdutos();
    carregarSubprodutos();
    carregarGrupos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const data = await ProductsService.getAllProducts();
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const carregarSubprodutos = async () => {
    try {
      const data = await ProductsService.getAllProducts();
      const ativos = data.filter((p: Produto) => p.isActive && p.isSalable);
      setSubprodutosDisponiveis(ativos);
    } catch (error) {
      console.error('Erro ao carregar subprodutos:', error);
      toast.error('Erro ao carregar subprodutos disponíveis');
    }
  };

  const carregarGrupos = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.REACT_APP_MIDDLEWARE_URL || 'http://localhost:4006'}/groups`
      );
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  };

  const salvarProduto = async (dadosProduto: Partial<Produto>) => {
    try {
      const dados = {
        ...dadosProduto,
        price: Number(dadosProduto.price) * 100,
        isActive: Boolean(dadosProduto.isActive),
        isSalable: Boolean(dadosProduto.isSalable),
        updatedAt: new Date().toISOString(),
      };
      if (editingProduct) {
        await fetch(
          `${import.meta.env.REACT_APP_MIDDLEWARE_URL || 'http://localhost:4006'}/products/${editingProduct._id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
          }
        );
        toast.success('Produto atualizado com sucesso!');
      } else {
        await ProductsService.createProduct(dados);
        toast.success('Produto criado com sucesso!');
      }
      setShowModal(false);
      setEditingProduct(null);
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  const excluirProduto = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await fetch(
        `${import.meta.env.REACT_APP_MIDDLEWARE_URL || 'http://localhost:4006'}/products/${id}`,
        { method: 'DELETE' }
      );
      toast.success('Produto excluído com sucesso!');
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const produtosFiltrados = produtos.filter((produto) => {
    const termo = searchTerm.toLowerCase();
    return (
      produto.name.toLowerCase().includes(termo) ||
      produto.description?.toLowerCase().includes(termo) ||
      produto.compDescription?.toLowerCase().includes(termo)
    );
  });

  const isProductKit = (produto: Produto) => produto.subProducts?.length > 0;

  const calcularPrecoKit = (produto: Produto) => {
    if (!isProductKit(produto)) return produto.price / 100;
    let total = 0;
    for (const sp of produto.subProducts) {
      const detalhe = subprodutosDisponiveis.find((s) => s._id === sp.subProduct);
      if (detalhe) {
        total += (sp.bundlePrice || detalhe.price) * sp.quantity;
      }
    }
    return total / 100;
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie produtos individuais e kits</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowModal(true);
          }}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" /> Novo Produto
        </button>
      </div>

      {/* Search */}
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

      {/* Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {produtosFiltrados.map((produto) => {
          const preco = isProductKit(produto) ? calcularPrecoKit(produto) : produto.price / 100;
          return (
            <div key={produto._id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Imagem */}
              <div className="h-48 bg-gray-200 relative">
                {produto.img ? (
                  <img src={produto.img} alt={produto.name} className="w-full h-full object-cover" />
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
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isProductKit(produto) ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isProductKit(produto) ? 'Kit' : 'Produto'}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      produto.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
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

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{produto.name}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{produto.description}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-pink-600">
                    R$ {preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Subprodutos */}
                {isProductKit(produto) && produto.subProducts?.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Layers className="h-4 w-4 mr-1" /> {produto.subProducts.length} itens no kit
                    </div>
                    <div className="text-xs text-gray-500">
                      {produto.subProducts.filter((sp) => sp.isEssential).length} essenciais
                    </div>
                  </div>
                )}

                {produto.compDescription && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-500 line-clamp-2">{produto.compDescription}</p>
                  </div>
                )}

                {/* Ações */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingProduct(produto);
                      setShowModal(true);
                    }}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-1" /> Editar
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
          );
        })}
      </div>

      {/* Nenhum produto */}
      {produtosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-600">Comece criando seus produtos</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ProdutoModal
          produto={editingProduct}
          subprodutosDisponiveis={subprodutosDisponiveis}
          groups={groups}
          onSave={salvarProduto}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default Produtos;

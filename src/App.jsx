import React, { useState, useEffect } from 'react';
import { 
  Package, Users, ShoppingCart, TrendingUp, DollarSign, 
  AlertCircle, Plus, Edit2, Trash2, Search, X, Download,
  FileText, Share2, Eye, Menu, Home, ShoppingBag
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logoABermud from './logo_ABermud.jpg';

function App() {
  // Estado principal
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados de modales
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddSale, setShowAddSale] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingSale, setViewingSale] = useState(null);

  // Estados de formularios
  const [newProduct, setNewProduct] = useState({
    modelo: '',
    color: '',
    talla: '',
    precioCompra: '',
    precioVenta: '',
    stock: ''
  });

  const [newClient, setNewClient] = useState({
    nombre: '',
    telefono: '',
    direccion: ''
  });

  // Estado del carrito de ventas
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

  // Cargar datos del localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem('abermud-products');
    const savedClients = localStorage.getItem('abermud-clients');
    const savedSales = localStorage.getItem('abermud-sales');
    
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedClients) setClients(JSON.parse(savedClients));
    if (savedSales) setSales(JSON.parse(savedSales));
  }, []);

  // Guardar en localStorage cuando cambian los datos
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('abermud-products', JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem('abermud-clients', JSON.stringify(clients));
    }
  }, [clients]);

  useEffect(() => {
    if (sales.length > 0) {
      localStorage.setItem('abermud-sales', JSON.stringify(sales));
    }
  }, [sales]);

  // FUNCIONES DE PRODUCTOS
  const addProduct = () => {
    if (!newProduct.modelo || !newProduct.precioVenta || !newProduct.stock) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    const product = {
      id: Date.now(),
      ...newProduct,
      precioCompra: parseFloat(newProduct.precioCompra) || 0,
      precioVenta: parseFloat(newProduct.precioVenta),
      stock: parseInt(newProduct.stock),
      createdAt: new Date().toISOString()
    };

    setProducts([...products, product]);
    setNewProduct({ modelo: '', color: '', talla: '', precioCompra: '', precioVenta: '', stock: '' });
    setShowAddProduct(false);
  };

  const updateProduct = () => {
    if (!editingProduct.modelo || !editingProduct.precioVenta || !editingProduct.stock) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    setProducts(products.map(p => 
      p.id === editingProduct.id 
        ? { 
            ...editingProduct,
            precioCompra: parseFloat(editingProduct.precioCompra) || 0,
            precioVenta: parseFloat(editingProduct.precioVenta),
            stock: parseInt(editingProduct.stock)
          }
        : p
    ));
    setEditingProduct(null);
  };

  const deleteProduct = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // FUNCIONES DE CLIENTES
  const addClient = () => {
    if (!newClient.nombre) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }

    const client = {
      id: Date.now(),
      ...newClient,
      createdAt: new Date().toISOString()
    };

    setClients([...clients, client]);
    setNewClient({ nombre: '', telefono: '', direccion: '' });
    setShowAddClient(false);
  };

  const updateClient = () => {
    if (!editingClient.nombre) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }

    setClients(clients.map(c => 
      c.id === editingClient.id ? editingClient : c
    ));
    setEditingClient(null);
  };

  const deleteClient = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  // FUNCIONES DEL CARRITO
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('No hay suficiente stock');
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    
    if (newQuantity > product.stock) {
      alert('No hay suficiente stock');
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const completeSale = () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (!selectedClient) {
      alert('Seleccione un cliente');
      return;
    }

    const client = clients.find(c => c.id === parseInt(selectedClient));
    const total = cart.reduce((sum, item) => sum + (item.precioVenta * item.quantity), 0);

    const sale = {
      id: Date.now(),
      clientId: client.id,
      clientName: client.nombre,
      clientPhone: client.telefono || '',
      clientAddress: client.direccion || '',
      items: cart.map(item => ({
        productId: item.id,
        modelo: item.modelo,
        color: item.color,
        talla: item.talla,
        quantity: item.quantity,
        precioVenta: item.precioVenta,
        subtotal: item.precioVenta * item.quantity
      })),
      total: total,
      date: saleDate,
      createdAt: new Date().toISOString()
    };

    // Actualizar stock
    const updatedProducts = products.map(product => {
      const cartItem = cart.find(item => item.id === product.id);
      if (cartItem) {
        return { ...product, stock: product.stock - cartItem.quantity };
      }
      return product;
    });

    setSales([...sales, sale]);
    setProducts(updatedProducts);
    setCart([]);
    setSelectedClient('');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setShowAddSale(false);
    alert('¡Venta registrada exitosamente!');
  };

  const deleteSale = (saleId) => {
    if (window.confirm('¿Estás seguro de eliminar esta venta? Esto restaurará el stock.')) {
      const sale = sales.find(s => s.id === saleId);
      
      if (sale) {
        // Restaurar stock
        const updatedProducts = products.map(product => {
          const saleItem = sale.items.find(item => item.productId === product.id);
          if (saleItem) {
            return { ...product, stock: product.stock + saleItem.quantity };
          }
          return product;
        });

        setProducts(updatedProducts);
        setSales(sales.filter(s => s.id !== saleId));
      }
    }
  };

  // FUNCIONES DE REPORTES PDF
  const generateStockPDF = () => {
    const doc = new jsPDF();
    
    // Header con logo y título
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('ABermud', 20, 22);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('WHOLESALE FASHION', 20, 30);
    doc.text('Reporte de Stock', 20, 37);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, 55);

    // Agrupar productos por modelo
    const groupedProducts = {};
    products.forEach(product => {
      const key = product.modelo;
      if (!groupedProducts[key]) {
        groupedProducts[key] = [];
      }
      groupedProducts[key].push(product);
    });

    let yPosition = 65;

    // Generar tabla matricial para cada modelo
    Object.keys(groupedProducts).forEach((modelo, index) => {
      const modelProducts = groupedProducts[modelo];
      
      // Obtener todas las tallas y colores únicos
      const tallas = [...new Set(modelProducts.map(p => p.talla))].sort();
      const colores = [...new Set(modelProducts.map(p => p.color))];

      // Verificar si hay espacio suficiente
      const tableHeight = (colores.length + 2) * 8 + 15;
      if (yPosition + tableHeight > 270) {
        doc.addPage();
        yPosition = 20;
      }

      // Título del modelo
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(modelo, 20, yPosition);
      yPosition += 8;

      // Crear matriz de datos
      const matrixData = colores.map(color => {
        const row = [color];
        tallas.forEach(talla => {
          const product = modelProducts.find(p => p.color === color && p.talla === talla);
          row.push(product ? product.stock.toString() : '0');
        });
        return row;
      });

      // Generar tabla
      doc.autoTable({
        startY: yPosition,
        head: [['Color', ...tallas]],
        body: matrixData,
        theme: 'grid',
        headStyles: { 
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 9
        },
        margin: { left: 20 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    });

    // Resumen al final
    if (yPosition + 40 > 270) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition, 170, 30, 'F');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN DE INVENTARIO', 25, yPosition + 10);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const valorTotal = products.reduce((sum, p) => sum + (p.stock * p.precioVenta), 0);
    
    doc.text(`Total de productos: ${products.length}`, 25, yPosition + 18);
    doc.text(`Total de unidades: ${totalStock}`, 25, yPosition + 24);
    doc.text(`Valor total: S/ ${valorTotal.toFixed(2)}`, 100, yPosition + 18);

    doc.save(`ABermud_Stock_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateSalesPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('ABermud', 20, 22);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('WHOLESALE FASHION', 20, 30);
    doc.text('Reporte de Ventas', 20, 37);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, 55);

    // Tabla de ventas
    const tableData = sales.map(sale => [
      new Date(sale.date).toLocaleDateString('es-PE'),
      sale.clientName,
      sale.items.length,
      sale.items.reduce((sum, item) => sum + item.quantity, 0),
      `S/ ${sale.total.toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 65,
      head: [['Fecha', 'Cliente', 'Productos', 'Unidades', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 9 }
    });

    // Resumen
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, finalY, 170, 30, 'F');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN DE VENTAS', 25, finalY + 10);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const totalVentas = sales.length;
    const totalIngresos = sales.reduce((sum, s) => sum + s.total, 0);
    const totalUnidades = sales.reduce((sum, s) => 
      sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    
    doc.text(`Total de ventas: ${totalVentas}`, 25, finalY + 18);
    doc.text(`Unidades vendidas: ${totalUnidades}`, 25, finalY + 24);
    doc.text(`Ingresos totales: S/ ${totalIngresos.toFixed(2)}`, 100, finalY + 18);

    doc.save(`ABermud_Ventas_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateOrderNote = (sale) => {
    const doc = new jsPDF();
    
    // Header estilo KeyFacil
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.text('ABermud', 105, 22, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('WHOLESALE FASHION', 105, 32, { align: 'center' });
    doc.text('NOTA DE PEDIDO', 105, 42, { align: 'center' });
    
    // Info del pedido
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Pedido #${sale.id}`, 20, 60);
    doc.text(`Fecha: ${new Date(sale.date).toLocaleDateString('es-PE')}`, 20, 67);
    
    // Info del cliente
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 75, 170, 30, 'F');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('CLIENTE:', 25, 83);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(sale.clientName, 25, 90);
    if (sale.clientPhone) doc.text(`Tel: ${sale.clientPhone}`, 25, 96);
    if (sale.clientAddress) doc.text(`Dir: ${sale.clientAddress}`, 25, 102);
    
    // Tabla de productos
    const tableData = sale.items.map(item => [
      `${item.modelo}`,
      item.color || '-',
      item.talla || '-',
      item.quantity,
      `S/ ${item.precioVenta.toFixed(2)}`,
      `S/ ${item.subtotal.toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 115,
      head: [['Modelo', 'Color', 'Talla', 'Cant.', 'P. Unit.', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 }
      }
    });

    // Total
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(0, 0, 0);
    doc.rect(130, finalY, 60, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL:', 135, finalY + 10);
    doc.text(`S/ ${sale.total.toFixed(2)}`, 185, finalY + 10, { align: 'right' });
    
    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Gracias por su compra', 105, finalY + 35, { align: 'center' });
    doc.text('ABermud - Wholesale Fashion', 105, finalY + 41, { align: 'center' });

    return doc;
  };

  const downloadOrderNote = (sale) => {
    const doc = generateOrderNote(sale);
    doc.save(`Pedido_${sale.id}_${sale.clientName}.pdf`);
  };

  const shareOrderViaWhatsApp = (sale) => {
    const message = `🛍️ *PEDIDO ABermud*

📋 Pedido #${sale.id}
👤 Cliente: ${sale.clientName}
📅 Fecha: ${new Date(sale.date).toLocaleDateString('es-PE')}

📦 *Productos:*
${sale.items.map(item => `• ${item.modelo} ${item.color || ''} ${item.talla || ''} x${item.quantity}`).join('\n')}

💰 *Total: S/ ${sale.total.toFixed(2)}*

¡Gracias por tu compra! 🎉`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${sale.clientPhone?.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    alert('Se abrirá WhatsApp. Luego envía el PDF adjunto manualmente.');
  };

  // Filtrar productos
  const filteredProducts = products.filter(p => 
    p.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.color && p.color.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.talla && p.talla.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calcular estadísticas
  const stats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    totalValue: products.reduce((sum, p) => sum + (p.stock * p.precioVenta), 0),
    totalClients: clients.length,
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
    lowStock: products.filter(p => p.stock < 5).length
  };

  // Productos con stock bajo
  const lowStockProducts = products.filter(p => p.stock < 5);

  // Navegación
  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'sales', label: 'Ventas', icon: ShoppingCart },
    { id: 'reports', label: 'Reportes', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Premium */}
      <header className="bg-black shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <img 
                src={logoABermud} 
                alt="ABermud Logo" 
                className="h-12 w-12 rounded-full border-2 border-white shadow-md"
              />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">ABermud</h1>
                <p className="text-xs text-gray-400 tracking-wide">WHOLESALE FASHION</p>
              </div>
            </div>

            {/* Stats en header (desktop) */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-right">
                <p className="text-xs text-gray-400">Capital</p>
                <p className="text-lg font-bold text-white">S/ {stats.totalValue.toFixed(2)}</p>
              </div>
              <div className="w-px h-10 bg-gray-700"></div>
              <div className="text-right">
                <p className="text-xs text-emerald-400">Ingresos</p>
                <p className="text-lg font-bold text-emerald-400">S/ {stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800">
            <div className="px-4 py-3 space-y-1">
              {navigation.map(nav => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.id}
                    onClick={() => {
                      setActiveTab(nav.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === nav.id
                        ? 'bg-white text-black'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{nav.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white border-b border-gray-200 shadow-sm sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {navigation.map(nav => {
              const Icon = nav.icon;
              return (
                <button
                  key={nav.id}
                  onClick={() => setActiveTab(nav.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all relative ${
                    activeTab === nav.id
                      ? 'text-black'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  <span>{nav.label}</span>
                  {activeTab === nav.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-black to-gray-900 rounded-2xl p-8 text-white shadow-xl">
              <h2 className="text-3xl font-bold mb-2">Bienvenido a ABermud</h2>
              <p className="text-gray-300">Panel de control de tu negocio de ropa al por mayor</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-black rounded-lg">
                    <Package className="text-white" size={24} />
                  </div>
                  <TrendingUp className="text-green-500" size={20} />
                </div>
                <p className="text-gray-500 text-sm font-medium mb-1">Productos</p>
                <p className="text-3xl font-bold text-black">{stats.totalProducts}</p>
                <p className="text-xs text-gray-400 mt-2">{stats.totalStock} unidades totales</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-black rounded-lg">
                    <Users className="text-white" size={24} />
                  </div>
                  <TrendingUp className="text-green-500" size={20} />
                </div>
                <p className="text-gray-500 text-sm font-medium mb-1">Clientes</p>
                <p className="text-3xl font-bold text-black">{stats.totalClients}</p>
                <p className="text-xs text-gray-400 mt-2">Base de clientes</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-black rounded-lg">
                    <ShoppingCart className="text-white" size={24} />
                  </div>
                  <TrendingUp className="text-green-500" size={20} />
                </div>
                <p className="text-gray-500 text-sm font-medium mb-1">Ventas</p>
                <p className="text-3xl font-bold text-black">{stats.totalSales}</p>
                <p className="text-xs text-gray-400 mt-2">Total de transacciones</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <DollarSign className="text-white" size={24} />
                  </div>
                  <TrendingUp className="text-white" size={20} />
                </div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Ingresos Totales</p>
                <p className="text-3xl font-bold text-white">S/ {stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-emerald-100 mt-2">
                  Promedio: S/ {stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>

            {/* Alertas de Stock Bajo */}
            {lowStockProducts.length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6 shadow-md">
                <div className="flex items-start">
                  <AlertCircle className="text-amber-500 mr-3 flex-shrink-0" size={24} />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900 mb-2">
                      Alerta de Stock Bajo ({lowStockProducts.length} productos)
                    </h3>
                    <div className="space-y-2">
                      {lowStockProducts.slice(0, 5).map(product => (
                        <div key={product.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                          <div>
                            <p className="font-medium text-gray-900">{product.modelo}</p>
                            <p className="text-sm text-gray-600">
                              {product.color} - {product.talla}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-bold rounded-full">
                            {product.stock} unid.
                          </span>
                        </div>
                      ))}
                      {lowStockProducts.length > 5 && (
                        <p className="text-sm text-amber-700 mt-2">
                          Y {lowStockProducts.length - 5} productos más...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ventas Recientes */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-black">Ventas Recientes</h3>
              </div>
              <div className="p-6">
                {sales.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500">No hay ventas registradas aún</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sales.slice(-5).reverse().map(sale => (
                      <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-black">{sale.clientName}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(sale.date).toLocaleDateString('es-PE')} • {sale.items.length} productos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">S/ {sale.total.toFixed(2)}</p>
                          <button
                            onClick={() => setViewingSale(sale)}
                            className="text-xs text-gray-600 hover:text-black transition-colors"
                          >
                            Ver detalles
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* INVENTARIO */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Header con búsqueda y botón */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                <span>Agregar Producto</span>
              </button>
            </div>

            {/* Productos Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-xl transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-black mb-1">{product.modelo}</h3>
                      <div className="flex gap-2">
                        {product.color && (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200">
                            {product.color}
                          </span>
                        )}
                        {product.talla && (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200">
                            Talla {product.talla}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Stock</p>
                        <p className={`text-2xl font-bold ${
                          product.stock < 5 ? 'text-amber-500' : 'text-black'
                        }`}>
                          {product.stock}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Precio Venta</p>
                        <p className="text-2xl font-bold text-black">S/ {product.precioVenta.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-gray-500 text-xs mb-1">Valor en Stock</p>
                      <p className="text-xl font-bold text-emerald-600">
                        S/ {(product.stock * product.precioVenta).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Package className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg font-medium">No hay productos en el inventario</p>
                <p className="text-gray-400 text-sm mt-2">Agrega tu primer producto para comenzar</p>
              </div>
            )}
          </div>
        )}

        {/* CLIENTES */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddClient(true)}
                className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                Agregar Cliente
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map(client => (
                <div
                  key={client.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-xl transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-black mb-1">{client.nombre}</h3>
                      {client.telefono && (
                        <p className="text-sm text-gray-600">{client.telefono}</p>
                      )}
                      {client.direccion && (
                        <p className="text-sm text-gray-500 mt-1">{client.direccion}</p>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingClient(client)}
                        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteClient(client.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Cliente desde {new Date(client.createdAt).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {clients.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Users className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg font-medium">No hay clientes registrados</p>
                <p className="text-gray-400 text-sm mt-2">Agrega tu primer cliente para comenzar</p>
              </div>
            )}
          </div>
        )}

        {/* VENTAS */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddSale(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                Nueva Venta
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-black">Historial de Ventas</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Productos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sales.map(sale => (
                      <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(sale.date).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-black">{sale.clientName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {sale.items.length} productos ({sale.items.reduce((sum, item) => sum + item.quantity, 0)} unid.)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                          S/ {sale.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewingSale(sale)}
                              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => downloadOrderNote(sale)}
                              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                              title="Descargar nota"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => shareOrderViaWhatsApp(sale)}
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Compartir por WhatsApp"
                            >
                              <Share2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteSale(sale.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {sales.length === 0 && (
                <div className="text-center py-16">
                  <ShoppingCart className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-500 text-lg font-medium">No hay ventas registradas</p>
                  <p className="text-gray-400 text-sm mt-2">Registra tu primera venta para comenzar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORTES */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reporte de Stock */}
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Reporte de Stock</h3>
                    <p className="text-gray-600 text-sm">Exporta un reporte detallado de tu inventario</p>
                  </div>
                  <FileText className="text-gray-300" size={32} />
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Total de Productos</span>
                    <span className="font-bold text-black">{stats.totalProducts}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Total de Unidades</span>
                    <span className="font-bold text-black">{stats.totalStock}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Valor Total</span>
                    <span className="font-bold text-emerald-600">S/ {stats.totalValue.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={generateStockPDF}
                  disabled={products.length === 0}
                  className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={20} />
                  Exportar a PDF
                </button>
              </div>

              {/* Reporte de Ventas */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Reporte de Ventas</h3>
                    <p className="text-emerald-100 text-sm">Exporta un reporte detallado de tus ventas</p>
                  </div>
                  <FileText className="text-white/40" size={32} />
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-3 border-b border-white/20">
                    <span className="text-emerald-100">Total de Ventas</span>
                    <span className="font-bold text-white">{stats.totalSales}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/20">
                    <span className="text-emerald-100">Ingresos Totales</span>
                    <span className="font-bold text-white">S/ {stats.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/20">
                    <span className="text-emerald-100">Promedio por Venta</span>
                    <span className="font-bold text-white">
                      S/ {stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={generateSalesPDF}
                  disabled={sales.length === 0}
                  className="w-full px-6 py-3 bg-white text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={20} />
                  Exportar a PDF
                </button>
              </div>
            </div>

            {/* Resumen General */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-md">
              <h3 className="text-xl font-bold text-black mb-6">Resumen General del Negocio</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-black mb-1">{stats.totalProducts}</p>
                  <p className="text-gray-600 text-sm">Productos</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-black mb-1">{stats.totalStock}</p>
                  <p className="text-gray-600 text-sm">Unidades</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600 mb-1">{stats.totalSales}</p>
                  <p className="text-gray-600 text-sm">Ventas</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-500 mb-1">{stats.lowStock}</p>
                  <p className="text-gray-600 text-sm">Stock Bajo</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Agregar Producto */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Agregar Producto</h2>
              <button
                onClick={() => setShowAddProduct(false)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Modelo *</label>
                <input
                  type="text"
                  value={newProduct.modelo}
                  onChange={(e) => setNewProduct({ ...newProduct, modelo: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  placeholder="Ej: Jogger Casual"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Color</label>
                  <input
                    type="text"
                    value={newProduct.color}
                    onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                    placeholder="Ej: Negro"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Talla</label>
                  <input
                    type="text"
                    value={newProduct.talla}
                    onChange={(e) => setNewProduct({ ...newProduct, talla: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                    placeholder="Ej: M, L, XL"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Precio Compra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.precioCompra}
                    onChange={(e) => setNewProduct({ ...newProduct, precioCompra: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Precio Venta *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.precioVenta}
                    onChange={(e) => setNewProduct({ ...newProduct, precioVenta: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Stock *</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={addProduct}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all shadow-md hover:shadow-lg"
                >
                  Agregar Producto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar Producto */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Editar Producto</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Modelo *</label>
                <input
                  type="text"
                  value={editingProduct.modelo}
                  onChange={(e) => setEditingProduct({ ...editingProduct, modelo: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Color</label>
                  <input
                    type="text"
                    value={editingProduct.color}
                    onChange={(e) => setEditingProduct({ ...editingProduct, color: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Talla</label>
                  <input
                    type="text"
                    value={editingProduct.talla}
                    onChange={(e) => setEditingProduct({ ...editingProduct, talla: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Precio Compra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.precioCompra}
                    onChange={(e) => setEditingProduct({ ...editingProduct, precioCompra: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Precio Venta *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.precioVenta}
                    onChange={(e) => setEditingProduct({ ...editingProduct, precioVenta: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Stock *</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={updateProduct}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all shadow-md hover:shadow-lg"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Agregar Cliente */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Agregar Cliente</h2>
              <button
                onClick={() => setShowAddClient(false)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Nombre *</label>
                <input
                  type="text"
                  value={newClient.nombre}
                  onChange={(e) => setNewClient({ ...newClient, nombre: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={newClient.telefono}
                  onChange={(e) => setNewClient({ ...newClient, telefono: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  placeholder="999 999 999"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Dirección</label>
                <textarea
                  value={newClient.direccion}
                  onChange={(e) => setNewClient({ ...newClient, direccion: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  rows="3"
                  placeholder="Dirección completa"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAddClient(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={addClient}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all shadow-md hover:shadow-lg"
                >
                  Agregar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar Cliente */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Editar Cliente</h2>
              <button
                onClick={() => setEditingClient(null)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Nombre *</label>
                <input
                  type="text"
                  value={editingClient.nombre}
                  onChange={(e) => setEditingClient({ ...editingClient, nombre: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={editingClient.telefono}
                  onChange={(e) => setEditingClient({ ...editingClient, telefono: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Dirección</label>
                <textarea
                  value={editingClient.direccion}
                  onChange={(e) => setEditingClient({ ...editingClient, direccion: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  rows="3"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEditingClient(null)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={updateClient}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all shadow-md hover:shadow-lg"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Venta */}
      {showAddSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Nueva Venta</h2>
              <button
                onClick={() => {
                  setShowAddSale(false);
                  setCart([]);
                  setSelectedClient('');
                }}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Productos disponibles */}
              <div>
                <h3 className="text-lg font-bold text-black mb-4">Productos Disponibles</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {products.filter(p => p.stock > 0).map(product => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-black">{product.modelo}</p>
                        <p className="text-sm text-gray-600">
                          {product.color} - {product.talla} • Stock: {product.stock}
                        </p>
                        <p className="text-sm font-bold text-black mt-1">S/ {product.precioVenta.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-all"
                      >
                        Agregar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carrito */}
              <div>
                <h3 className="text-lg font-bold text-black mb-4">Carrito de Venta</h3>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Cliente *</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Fecha</label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-black text-sm">{item.modelo}</p>
                        <p className="text-xs text-gray-600">{item.color} - {item.talla}</p>
                        <p className="text-xs font-bold text-black">S/ {item.precioVenta.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={item.quantity}
                          onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:border-black focus:ring-1 focus:ring-black/10 outline-none"
                        />
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <ShoppingBag className="mx-auto text-gray-300 mb-2" size={48} />
                    <p className="text-gray-500 text-sm">El carrito está vacío</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-black text-white p-4 rounded-lg mb-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">TOTAL:</span>
                        <span className="font-bold text-2xl">
                          S/ {cart.reduce((sum, item) => sum + (item.precioVenta * item.quantity), 0).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-2">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)} productos
                      </p>
                    </div>

                    <button
                      onClick={completeSale}
                      className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg"
                    >
                      Completar Venta
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ver Detalle de Venta */}
      {viewingSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Detalle de Venta</h2>
              <button
                onClick={() => setViewingSale(null)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Info de la venta */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Pedido #</p>
                    <p className="font-bold text-black">{viewingSale.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha</p>
                    <p className="font-bold text-black">{new Date(viewingSale.date).toLocaleDateString('es-PE')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cliente</p>
                    <p className="font-bold text-black">{viewingSale.clientName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                    <p className="font-bold text-black">{viewingSale.clientPhone || '-'}</p>
                  </div>
                </div>
                {viewingSale.clientAddress && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Dirección</p>
                    <p className="font-bold text-black">{viewingSale.clientAddress}</p>
                  </div>
                )}
              </div>

              {/* Productos */}
              <div>
                <h3 className="font-bold text-black mb-3">Productos</h3>
                <div className="space-y-2">
                  {viewingSale.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-black">{item.modelo}</p>
                        <p className="text-sm text-gray-600">{item.color} - {item.talla}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">x{item.quantity}</p>
                        <p className="font-bold text-black">S/ {item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-black text-white p-6 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">TOTAL:</span>
                  <span className="font-bold text-3xl">S/ {viewingSale.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3">
                <button
                  onClick={() => downloadOrderNote(viewingSale)}
                  className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Descargar PDF
                </button>
                <button
                  onClick={() => shareOrderViaWhatsApp(viewingSale)}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={18} />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

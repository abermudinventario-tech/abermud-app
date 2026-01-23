import React, { useState, useEffect } from 'react';
import { 
  Package, Users, ShoppingCart, TrendingUp, DollarSign, 
  AlertCircle, Plus, Edit2, Trash2, Search, X, Download,
  FileText, Share2, Eye, Menu, Home, ChevronRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logoABermud from './logo_Abermud.jpg';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddSale, setShowAddSale] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingSale, setViewingSale] = useState(null);

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
    dni: '',
    telefono: '',
    direccion: ''
  });

  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientDNI, setClientDNI] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Estados para filtros de nueva venta
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [showColorSelector, setShowColorSelector] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);

  // Sincronización con Firebase
  useEffect(() => {
    const unsubscribeProducts = onSnapshot(
      query(collection(db, 'products'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
        setLoading(false);
      }
    );

    const unsubscribeClients = onSnapshot(
      query(collection(db, 'clients'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const clientsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClients(clientsData);
      }
    );

    const unsubscribeSales = onSnapshot(
      query(collection(db, 'sales'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const salesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSales(salesData);
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeClients();
      unsubscribeSales();
    };
  }, []);

  // Buscar cliente por DNI
  const searchClientByDNI = (dni) => {
    const client = clients.find(c => c.dni === dni);
    if (client) {
      setSelectedClient(client.id);
    } else {
      setSelectedClient('');
    }
  };

  useEffect(() => {
    if (clientDNI.length >= 8) {
      searchClientByDNI(clientDNI);
    }
  }, [clientDNI]);

  // FUNCIONES DE PRODUCTOS
  const addProduct = async () => {
    if (!newProduct.modelo || !newProduct.precioVenta || !newProduct.stock) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      await addDoc(collection(db, 'products'), {
        modelo: newProduct.modelo,
        color: newProduct.color,
        talla: newProduct.talla,
        precioCompra: parseFloat(newProduct.precioCompra) || 0,
        precioVenta: parseFloat(newProduct.precioVenta),
        stock: parseInt(newProduct.stock),
        createdAt: serverTimestamp()
      });

      setNewProduct({ modelo: '', color: '', talla: '', precioCompra: '', precioVenta: '', stock: '' });
      setShowAddProduct(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al agregar producto');
    }
  };

  const updateProduct = async () => {
    if (!editingProduct.modelo || !editingProduct.precioVenta) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      const productRef = doc(db, 'products', editingProduct.id);
      await updateDoc(productRef, {
        modelo: editingProduct.modelo,
        color: editingProduct.color,
        talla: editingProduct.talla,
        precioCompra: parseFloat(editingProduct.precioCompra) || 0,
        precioVenta: parseFloat(editingProduct.precioVenta),
        stock: parseInt(editingProduct.stock)
      });

      setEditingProduct(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar producto');
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm('¿Eliminar este producto?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  // FUNCIONES DE CLIENTES
  const addClient = async () => {
    if (!newClient.nombre || !newClient.dni) {
      alert('Por favor ingrese nombre y DNI');
      return;
    }

    try {
      await addDoc(collection(db, 'clients'), {
        nombre: newClient.nombre,
        dni: newClient.dni,
        telefono: newClient.telefono,
        direccion: newClient.direccion,
        createdAt: serverTimestamp()
      });

      setNewClient({ nombre: '', dni: '', telefono: '', direccion: '' });
      setShowAddClient(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al agregar cliente');
    }
  };

  const updateClient = async () => {
    if (!editingClient.nombre || !editingClient.dni) {
      alert('Por favor ingrese nombre y DNI');
      return;
    }

    try {
      const clientRef = doc(db, 'clients', editingClient.id);
      await updateDoc(clientRef, {
        nombre: editingClient.nombre,
        dni: editingClient.dni,
        telefono: editingClient.telefono,
        direccion: editingClient.direccion
      });

      setEditingClient(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar cliente');
    }
  };

  const deleteClient = async (id) => {
    if (window.confirm('¿Eliminar este cliente?')) {
      try {
        await deleteDoc(doc(db, 'clients', id));
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  // FUNCIONES DE VENTA CON FILTROS
  const getGroupedProducts = () => {
    const grouped = {};
    products.forEach(product => {
      if (!grouped[product.modelo]) {
        grouped[product.modelo] = {
          modelo: product.modelo,
          totalStock: 0,
          precio: product.precioVenta,
          colors: {}
        };
      }
      grouped[product.modelo].totalStock += product.stock;
      
      if (!grouped[product.modelo].colors[product.color]) {
        grouped[product.modelo].colors[product.color] = {
          stock: 0,
          sizes: {}
        };
      }
      grouped[product.modelo].colors[product.color].stock += product.stock;
      grouped[product.modelo].colors[product.color].sizes[product.talla] = {
        stock: product.stock,
        productId: product.id
      };
    });
    return grouped;
  };

  const selectProductModel = (modelData) => {
    setSelectedProduct(modelData);
    setShowColorSelector(true);
  };

  const selectColor = (color) => {
    setSelectedColor(color);
    setShowColorSelector(false);
    setShowSizeSelector(true);
  };

  const selectSize = (size, productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('No hay suficiente stock');
        return;
      }
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    setSelectedProduct(null);
    setSelectedColor(null);
    setShowSizeSelector(false);
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

  const completeSale = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (!selectedClient) {
      alert('Seleccione un cliente');
      return;
    }

    try {
      const client = clients.find(c => c.id === selectedClient);
      const total = cart.reduce((sum, item) => sum + (item.precioVenta * item.quantity), 0);

      // Generar número de pedido
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const salesCount = sales.length + 100;
      const orderNumber = `${year}-${month}${day}-${salesCount}`;

      await addDoc(collection(db, 'sales'), {
        orderNumber: orderNumber,
        clientId: client.id,
        clientName: client.nombre,
        clientDNI: client.dni || '',
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
        createdAt: serverTimestamp()
      });

      // Actualizar stock
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        const product = products.find(p => p.id === item.id);
        await updateDoc(productRef, {
          stock: product.stock - item.quantity
        });
      }

      setCart([]);
      setSelectedClient('');
      setClientDNI('');
      setSaleDate(new Date().toISOString().split('T')[0]);
      setShowAddSale(false);
      alert('¡Venta registrada exitosamente!');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar la venta');
    }
  };

  const deleteSale = async (saleId) => {
    if (window.confirm('¿Eliminar esta venta? Se restaurará el stock.')) {
      try {
        const sale = sales.find(s => s.id === saleId);
        
        if (sale) {
          for (const item of sale.items) {
            const productRef = doc(db, 'products', item.productId);
            const product = products.find(p => p.id === item.productId);
            if (product) {
              await updateDoc(productRef, {
                stock: product.stock + item.quantity
              });
            }
          }

          await deleteDoc(doc(db, 'sales', saleId));
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la venta');
      }
    }
  };

  // REPORTES PDF
  const generateOrderNote = (sale) => {
    const doc = new jsPDF();
    
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.text('ABermud', 105, 22, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'italic');
    doc.text('Lo bueno va contigo', 105, 32, { align: 'center' });
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    doc.text('NOTA DE PEDIDO', 105, 42, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Pedido #${sale.orderNumber}`, 20, 60);
    doc.text(`Fecha: ${new Date(sale.date).toLocaleDateString('es-PE')}`, 20, 67);
    
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 75, 170, 25, 'F');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('CLIENTE:', 25, 83);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(sale.clientName, 25, 90);
    if (sale.clientPhone) doc.text(`Tel: ${sale.clientPhone}`, 25, 96);
    
    // Agrupar por modelo (sin color/talla)
    const groupedItems = {};
    sale.items.forEach(item => {
      if (!groupedItems[item.modelo]) {
        groupedItems[item.modelo] = {
          quantity: 0,
          precio: item.precioVenta,
          subtotal: 0
        };
      }
      groupedItems[item.modelo].quantity += item.quantity;
      groupedItems[item.modelo].subtotal += item.subtotal;
    });

    const tableData = Object.keys(groupedItems).map(modelo => [
      modelo,
      groupedItems[modelo].quantity,
      `S/ ${groupedItems[modelo].precio.toFixed(2)}`,
      `S/ ${groupedItems[modelo].subtotal.toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 110,
      head: [['Modelo', 'Cant.', 'P. Unit.', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 10 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(0, 0, 0);
    doc.rect(130, finalY, 60, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL:', 135, finalY + 10);
    doc.text(`S/ ${sale.total.toFixed(2)}`, 185, finalY + 10, { align: 'right' });
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Gracias por su compra', 105, finalY + 35, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('ABermud', 105, finalY + 43, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.text('Lo bueno va contigo', 105, finalY + 50, { align: 'center' });
    return doc;
    };

  const downloadOrderNote = (sale) => {
    const doc = generateOrderNote(sale);
    doc.save(`Pedido_${sale.orderNumber}_${sale.clientName}.pdf`);
  };

  const shareOrderViaWhatsApp = (sale) => {
    const message = `🛍️ *PEDIDO ABermud*\n\n📋 Pedido #${sale.orderNumber}\n👤 Cliente: ${sale.clientName}\n📅 Fecha: ${new Date(sale.date).toLocaleDateString('es-PE')}\n\n📦 *Productos:*\n${sale.items.map(item => `• ${item.modelo} x${item.quantity}`).join('\n')}\n\n💰 *Total: S/ ${sale.total.toFixed(2)}*\n\n¡Gracias por tu compra! 🎉`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${sale.clientPhone?.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const generateStockPDF = () => {
    const doc = new jsPDF();
    
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('ABermud', 20, 22);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'italic');
    doc.text('Lo bueno va contigo', 20, 30);
    
    doc.setFont(undefined, 'normal');
    doc.text('Reporte de Stock', 20, 37);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, 55);

    // Agrupar productos matricialmente
    const groupedProducts = {};
    products.forEach(product => {
      const key = product.modelo;
      if (!groupedProducts[key]) {
        groupedProducts[key] = {};
      }
      if (!groupedProducts[key][product.color]) {
        groupedProducts[key][product.color] = {};
      }
      groupedProducts[key][product.color][product.talla] = product.stock;
    });

    let yPosition = 65;

    Object.keys(groupedProducts).forEach((modelo) => {
      const colors = groupedProducts[modelo];
      const allSizes = [...new Set(
        Object.values(colors).flatMap(colorData => Object.keys(colorData))
      )].sort();

      const tableHeight = (Object.keys(colors).length + 2) * 8 + 15;
      if (yPosition + tableHeight > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(modelo, 20, yPosition);
      yPosition += 8;

      const matrixData = Object.keys(colors).map(color => {
        const row = [color];
        allSizes.forEach(size => {
          row.push((colors[color][size] || 0).toString());
        });
        return row;
      });

      doc.autoTable({
        startY: yPosition,
        head: [['Color', ...allSizes]],
        body: matrixData,
        theme: 'grid',
        headStyles: { 
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: { fontSize: 9 },
        margin: { left: 20 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    });

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
    
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('ABermud', 20, 22);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'italic');
    doc.text('Lo bueno va contigo', 20, 30);
    
    doc.setFont(undefined, 'normal');
    doc.text('Reporte de Ventas', 20, 37);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, 55);

    // Detallado por ítem
    const tableData = [];
    sales.forEach(sale => {
      sale.items.forEach(item => {
        tableData.push([
          new Date(sale.date).toLocaleDateString('es-PE'),
          sale.clientName,
          item.modelo,
          item.color,
          item.talla,
          item.quantity,
          `S/ ${item.subtotal.toFixed(2)}`
        ]);
      });
    });

    doc.autoTable({
      startY: 65,
      head: [['Fecha', 'Cliente', 'Producto', 'Color', 'Talla', 'Unid.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 8 }
    });

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

  // Obtener inventario matricial
  const getMatrixInventory = () => {
    const grouped = {};
    
    products.forEach(product => {
      const key = `${product.modelo}-${product.color}`;
      if (!grouped[key]) {
        grouped[key] = {
          modelo: product.modelo,
          color: product.color,
          precioVenta: product.precioVenta,
          sizes: {}
        };
      }
      grouped[key].sizes[product.talla] = product.stock;
    });

    return Object.values(grouped);
  };

  const filteredProducts = products.filter(p => 
    p.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.color && p.color.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    totalValue: products.reduce((sum, p) => sum + (p.stock * p.precioVenta), 0),
    totalClients: clients.length,
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
    lowStock: products.filter(p => p.stock < 10).length,
    outOfStock: products.filter(p => p.stock === 0).length
  };

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'sales', label: 'Ventas', icon: ShoppingCart },
    { id: 'reports', label: 'Reportes', icon: TrendingUp }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-black shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <img 
                src={logoABermud} 
                alt="ABermud Logo" 
                className="h-12 w-12 rounded-full border-2 border-white shadow-md"
              />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">ABermud</h1>
                <p className="text-xs text-gray-400 italic tracking-wide">Lo bueno va contigo</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <div className="text-right">
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-400">Ingresos</p>
                <p className="text-lg font-bold text-emerald-400">S/ {stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-black to-gray-900 rounded-2xl p-8 text-white shadow-xl">
              <h2 className="text-3xl font-bold mb-2">Bienvenido a ABermud</h2>
              <p className="text-gray-300">Panel de control sincronizado con Firebase</p>
            </div>

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

            {/* Alertas de Stock */}
            {(stats.outOfStock > 0 || stats.lowStock > 0) && (
              <div className="space-y-4">
                {stats.outOfStock > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 shadow-md">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🔴</span>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-900 mb-2">
                          AGOTADO ({stats.outOfStock} productos)
                        </h3>
                        <div className="space-y-2">
                          {products.filter(p => p.stock === 0).slice(0, 3).map(product => (
                            <div key={product.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                              <div>
                                <p className="font-medium text-gray-900">{product.modelo}</p>
                                <p className="text-sm text-gray-600">{product.color} - {product.talla}</p>
                              </div>
                              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-bold rounded-full">
                                AGOTADO
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {stats.lowStock > 0 && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6 shadow-md">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">⚠️</span>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-amber-900 mb-2">
                          BAJO ({stats.lowStock} productos)
                        </h3>
                        <div className="space-y-2">
                          {products.filter(p => p.stock > 0 && p.stock < 10).slice(0, 3).map(product => (
                            <div key={product.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                              <div>
                                <p className="font-medium text-gray-900">{product.modelo}</p>
                                <p className="text-sm text-gray-600">{product.color} - {product.talla}</p>
                              </div>
                              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-bold rounded-full">
                                {product.stock} unid.
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-black">Ventas Recientes</h3>
              </div>
              <div className="p-6">
                {sales.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500">No hay ventas registradas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sales.slice(0, 5).map(sale => (
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

        {activeTab === 'inventory' && (
          <div className="space-y-6">
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

            {/* Vista Matricial */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">S</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">M</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">XL</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P. Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getMatrixInventory().map((item, index) => {
                      const totalStock = Object.values(item.sizes).reduce((sum, stock) => sum + stock, 0);
                      const valor = totalStock * item.precioVenta;
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-black">{item.modelo}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.color}</td>
                          <td className="px-6 py-4 text-sm text-center">{item.sizes['S'] || 0}</td>
                          <td className="px-6 py-4 text-sm text-center">{item.sizes['M'] || 0}</td>
                          <td className="px-6 py-4 text-sm text-center">{item.sizes['L'] || 0}</td>
                          <td className="px-6 py-4 text-sm text-center">{item.sizes['XL'] || 0}</td>
                          <td className="px-6 py-4 text-sm text-black">S/ {item.precioVenta.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm font-bold text-emerald-600">S/ {valor.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <button className="text-gray-400 hover:text-black">
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {getMatrixInventory().length === 0 && (
                <div className="text-center py-16">
                  <Package className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-500 text-lg font-medium">No hay productos</p>
                </div>
              )}
            </div>
          </div>
        )}

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

            {/* Lista de Clientes */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {clients.map(client => (
                  <div key={client.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-black mb-1">{client.nombre}</h3>
                      <div className="flex gap-4 text-sm text-gray-600">
                        {client.dni && <span>DNI: {client.dni}</span>}
                        {client.telefono && <span>Tel: {client.telefono}</span>}
                      </div>
                      {client.direccion && (
                        <p className="text-sm text-gray-500 mt-1">{client.direccion}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
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
                ))}
              </div>

              {clients.length === 0 && (
                <div className="text-center py-16">
                  <Users className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-500 text-lg font-medium">No hay clientes</p>
                </div>
              )}
            </div>
          </div>
        )}

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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sales.map(sale => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">#{sale.orderNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(sale.date).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-black">{sale.clientName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {sale.items.length} productos
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                          S/ {sale.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewingSale(sale)}
                              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg"
                              title="Ver"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => downloadOrderNote(sale)}
                              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg"
                              title="PDF"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => shareOrderViaWhatsApp(sale)}
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="WhatsApp"
                            >
                              <Share2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteSale(sale.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
                  <p className="text-gray-500 text-lg font-medium">No hay ventas</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Reporte de Stock</h3>
                    <p className="text-gray-600 text-sm">Vista matricial del inventario</p>
                  </div>
                  <FileText className="text-gray-300" size={32} />
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Total Productos</span>
                    <span className="font-bold text-black">{stats.totalProducts}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Total Unidades</span>
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
                  className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  <Download size={20} />
                  Exportar a PDF
                </button>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Reporte de Ventas</h3>
                    <p className="text-emerald-100 text-sm">Detallado por producto</p>
                  </div>
                  <FileText className="text-white/40" size={32} />
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-3 border-b border-white/20">
                    <span className="text-emerald-100">Total Ventas</span>
                    <span className="font-bold text-white">{stats.totalSales}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/20">
                    <span className="text-emerald-100">Ingresos</span>
                    <span className="font-bold text-white">S/ {stats.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/20">
                    <span className="text-emerald-100">Promedio</span>
                    <span className="font-bold text-white">
                      S/ {stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={generateSalesPDF}
                  disabled={sales.length === 0}
                  className="w-full px-6 py-3 bg-white text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  <Download size={20} />
                  Exportar a PDF
                </button>
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
              <button onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-gray-100 rounded-lg">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                    placeholder="Negro"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Talla</label>
                  <input
                    type="text"
                    value={newProduct.talla}
                    onChange={(e) => setNewProduct({ ...newProduct, talla: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                    placeholder="M"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">P. Compra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.precioCompra}
                    onChange={(e) => setNewProduct({ ...newProduct, precioCompra: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">P. Venta *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.precioVenta}
                    onChange={(e) => setNewProduct({ ...newProduct, precioVenta: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Stock *</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={addProduct}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar Producto */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Editar Producto</h2>
              <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Modelo *</label>
                <input
                  type="text"
                  value={editingProduct.modelo}
                  onChange={(e) => setEditingProduct({ ...editingProduct, modelo: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <input
                    type="text"
                    value={editingProduct.color}
                    onChange={(e) => setEditingProduct({ ...editingProduct, color: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Talla</label>
                  <input
                    type="text"
                    value={editingProduct.talla}
                    onChange={(e) => setEditingProduct({ ...editingProduct, talla: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">P. Compra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.precioCompra}
                    onChange={(e) => setEditingProduct({ ...editingProduct, precioCompra: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">P. Venta *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.precioVenta}
                    onChange={(e) => setEditingProduct({ ...editingProduct, precioVenta: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stock *</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 px-6 py-3 bg-gray-200 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={updateProduct}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900"
                >
                  Guardar
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
              <h2 className="text-2xl font-bold">Agregar Cliente</h2>
              <button onClick={() => setShowAddClient(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre *</label>
                <input
                  type="text"
                  value={newClient.nombre}
                  onChange={(e) => setNewClient({ ...newClient, nombre: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">DNI *</label>
                <input
                  type="text"
                  value={newClient.dni}
                  onChange={(e) => setNewClient({ ...newClient, dni: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  maxLength="8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={newClient.telefono}
                  onChange={(e) => setNewClient({ ...newClient, telefono: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dirección</label>
                <textarea
                  value={newClient.direccion}
                  onChange={(e) => setNewClient({ ...newClient, direccion: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  rows="3"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAddClient(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={addClient}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900"
                >
                  Agregar
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
              <h2 className="text-2xl font-bold">Editar Cliente</h2>
              <button onClick={() => setEditingClient(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre *</label>
                <input
                  type="text"
                  value={editingClient.nombre}
                  onChange={(e) => setEditingClient({ ...editingClient, nombre: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">DNI *</label>
                <input
                  type="text"
                  value={editingClient.dni}
                  onChange={(e) => setEditingClient({ ...editingClient, dni: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  maxLength="8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={editingClient.telefono}
                  onChange={(e) => setEditingClient({ ...editingClient, telefono: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dirección</label>
                <textarea
                  value={editingClient.direccion}
                  onChange={(e) => setEditingClient({ ...editingClient, direccion: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  rows="3"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEditingClient(null)}
                  className="flex-1 px-6 py-3 bg-gray-200 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={updateClient}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Venta con filtros */}
      {showAddSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-6xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Nueva Venta</h2>
              <button
                onClick={() => {
                  setShowAddSale(false);
                  setCart([]);
                  setSelectedClient('');
                  setClientDNI('');
                  setSelectedProduct(null);
                  setSelectedColor(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Productos */}
              <div>
                <h3 className="font-bold mb-4">Productos</h3>
                
                {!showColorSelector && !showSizeSelector && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.values(getGroupedProducts()).map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{product.modelo}</p>
                          <p className="text-sm text-gray-600">Stock: {product.totalStock} • S/ {product.precio.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => selectProductModel(product)}
                          className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-900"
                        >
                          Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {showColorSelector && selectedProduct && (
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        setShowColorSelector(false);
                        setSelectedProduct(null);
                      }}
                      className="text-sm text-gray-600 hover:text-black"
                    >
                      ← Volver
                    </button>
                    <h4 className="font-medium">{selectedProduct.modelo} - Elige color:</h4>
                    <div className="space-y-2">
                      {Object.keys(selectedProduct.colors).map((color, index) => (
                        <button
                          key={index}
                          onClick={() => selectColor(color)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border"
                        >
                          <span>{color}</span>
                          <span className="text-sm text-gray-600">
                            {selectedProduct.colors[color].stock} unid.
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showSizeSelector && selectedProduct && selectedColor && (
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        setShowSizeSelector(false);
                        setSelectedColor(null);
                        setShowColorSelector(true);
                      }}
                      className="text-sm text-gray-600 hover:text-black"
                    >
                      ← Volver
                    </button>
                    <h4 className="font-medium">{selectedProduct.modelo} ({selectedColor}) - Elige talla:</h4>
                    <div className="space-y-2">
                      {Object.keys(selectedProduct.colors[selectedColor].sizes).map((size, index) => {
                        const sizeData = selectedProduct.colors[selectedColor].sizes[size];
                        return (
                          <button
                            key={index}
                            onClick={() => selectSize(size, sizeData.productId)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border"
                          >
                            <span>Talla {size}</span>
                            <span className="text-sm text-gray-600">{sizeData.stock} unid.</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Carrito */}
              <div>
                <h3 className="font-bold mb-4">Carrito</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">DNI Cliente *</label>
                  <input
                    type="text"
                    value={clientDNI}
                    onChange={(e) => setClientDNI(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                    placeholder="Buscar por DNI"
                    maxLength="8"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Cliente *</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  >
                    <option value="">Seleccionar</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Fecha</label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  />
                </div>

                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.modelo}</p>
                        <p className="text-xs text-gray-600">{item.color} - {item.talla}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border rounded text-center text-sm"
                        />
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {cart.length > 0 ? (
                  <>
                    <div className="bg-black text-white p-4 rounded-lg mb-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">TOTAL:</span>
                        <span className="font-bold text-2xl">
                          S/ {cart.reduce((sum, item) => sum + (item.precioVenta * item.quantity), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={completeSale}
                      className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                    >
                      Completar Venta
                    </button>
                  </>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border">
                    <p className="text-gray-500 text-sm">Carrito vacío</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ver Venta */}
      {viewingSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Detalle de Venta</h2>
              <button onClick={() => setViewingSale(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Pedido #</p>
                    <p className="font-bold font-mono">{viewingSale.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha</p>
                    <p className="font-bold">{new Date(viewingSale.date).toLocaleDateString('es-PE')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cliente</p>
                    <p className="font-bold">{viewingSale.clientName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                    <p className="font-bold">{viewingSale.clientPhone || '-'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3">Productos</h3>
                <div className="space-y-2">
                  {viewingSale.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium">{item.modelo}</p>
                        <p className="text-sm text-gray-600">{item.color} - {item.talla}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">x{item.quantity}</p>
                        <p className="font-bold">S/ {item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black text-white p-6 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">TOTAL:</span>
                  <span className="font-bold text-3xl">S/ {viewingSale.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => downloadOrderNote(viewingSale)}
                  className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  PDF
                </button>
                <button
                  onClick={() => shareOrderViaWhatsApp(viewingSale)}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center justify-center gap-2"
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

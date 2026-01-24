import React, { useState, useEffect } from 'react';
import { 
  Package, Users, ShoppingCart, TrendingUp, DollarSign, 
  AlertCircle, Plus, Edit2, Trash2, Search, X, Download,
  FileText, Share2, Eye, Menu, Home, ChevronRight, ChevronLeft,
  Calendar, Filter
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
    imagen: '',
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

  // Estados para nueva venta optimizada
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientResults, setShowClientResults] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesChannel, setSalesChannel] = useState('TIENDA');
  
  // Estados para selección de productos
  const [selectedProductModel, setSelectedProductModel] = useState(null);
  const [selectedTalla, setSelectedTalla] = useState(null);
  const [colorQuantities, setColorQuantities] = useState({});
  // Estados para filtros de reportes
  const [reportFilter, setReportFilter] = useState('hoy');
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

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

  // FUNCIONES DE PRODUCTOS
  const addProduct = async () => {
    if (!newProduct.modelo || !newProduct.precioVenta || !newProduct.stock) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'products'), {
        modelo: newProduct.modelo,
        color: newProduct.color,
        talla: newProduct.talla,
        imagen: newProduct.imagen || '',
        precioCompra: parseFloat(newProduct.precioCompra) || 0,
        precioVenta: parseFloat(newProduct.precioVenta),
        stock: parseInt(newProduct.stock),
        createdAt: serverTimestamp(),
        lastStockUpdate: today
      });

      setNewProduct({ modelo: '', color: '', talla: '', imagen: '', precioCompra: '', precioVenta: '', stock: '' });
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
      const originalProduct = products.find(p => p.id === editingProduct.id);
      const stockChanged = originalProduct.stock !== parseInt(editingProduct.stock);

      const updateData = {
        modelo: editingProduct.modelo,
        color: editingProduct.color,
        talla: editingProduct.talla,
        imagen: editingProduct.imagen || '',
        precioCompra: parseFloat(editingProduct.precioCompra) || 0,
        precioVenta: parseFloat(editingProduct.precioVenta),
        stock: parseInt(editingProduct.stock)
      };

      if (stockChanged) {
        updateData.lastStockUpdate = new Date().toISOString().split('T')[0];
      }

      await updateDoc(productRef, updateData);
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
  const searchClients = (term) => {
    if (!term) return [];
    const lowerTerm = term.toLowerCase();
    return clients.filter(c => 
      c.dni?.includes(term) || 
      c.nombre?.toLowerCase().includes(lowerTerm)
    );
  };

  const selectClient = (client) => {
    setSelectedClient(client);
    setClientSearch(client.nombre);
    setShowClientResults(false);
  };

  const addClient = async () => {
    if (!newClient.nombre || !newClient.dni) {
      alert('Por favor ingrese nombre y DNI');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        nombre: newClient.nombre,
        dni: newClient.dni,
        telefono: newClient.telefono,
        direccion: newClient.direccion,
        createdAt: serverTimestamp()
      });

      const newClientData = {
        id: docRef.id,
        ...newClient
      };

      setSelectedClient(newClientData);
      setClientSearch(newClient.nombre);
      setNewClient({ nombre: '', dni: '', telefono: '', direccion: '' });
      setShowAddClient(false);
      setShowCreateClient(false);
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

  // FUNCIONES DE VENTA OPTIMIZADA
  const getProductsByModel = () => {
    const modelMap = {};
    products.forEach(p => {
      if (!modelMap[p.modelo]) {
        modelMap[p.modelo] = {
          modelo: p.modelo,
          totalStock: 0,
          precio: p.precioVenta,
          imagen: p.imagen || ''
        };
      }
      modelMap[p.modelo].totalStock += p.stock;
    });
    return Object.values(modelMap);
  };

  const selectProductModel = (model) => {
    setSelectedProductModel(model);
    setSelectedTalla(null);
    setColorQuantities({});
  };

  const selectTalla = (talla) => {
    setSelectedTalla(talla);
    setColorQuantities({});
  };

  const getAvailableColorsForTalla = () => {
    if (!selectedProductModel || !selectedTalla) return [];
    
    const colorsMap = {};
    products.forEach(p => {
      if (p.modelo === selectedProductModel.modelo && p.talla === selectedTalla && p.stock > 0) {
        if (!colorsMap[p.color]) {
          colorsMap[p.color] = {
            color: p.color,
            stock: p.stock,
            productId: p.id,
            precio: p.precioVenta
          };
        }
      }
    });
    return Object.values(colorsMap);
  };

  const addToCart = () => {
  const newItems = [];
  Object.keys(colorQuantities).forEach(color => {
    const quantity = parseInt(colorQuantities[color]);
    if (quantity > 0) {
      const product = products.find(p => 
        p.modelo === selectedProductModel.modelo && 
        p.talla === selectedTalla && 
        p.color === color
      );
      if (product && quantity <= product.stock) {
        newItems.push({
          ...product,
          quantity
        });
      }
    }
  });

  if (newItems.length > 0) {
    setCart([...cart, ...newItems]);
    setSelectedProductModel(null);
    setSelectedTalla(null);
    setColorQuantities({});
  }
};
    
  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    try {
      const total = cart.reduce((sum, item) => sum + (item.precioVenta * item.quantity), 0);

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const salesCount = sales.length + 100;
      const orderNumber = `${year}-${month}${day}-${salesCount}`;

      await addDoc(collection(db, 'sales'), {
        orderNumber: orderNumber,
        clientId: selectedClient?.id || null,
        clientName: selectedClient?.nombre || 'Cliente sin DNI',
        clientDNI: selectedClient?.dni || '',
        clientPhone: selectedClient?.telefono || '',
        clientAddress: selectedClient?.direccion || '',
        salesChannel: salesChannel,
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

      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        const product = products.find(p => p.id === item.id);
        await updateDoc(productRef, {
          stock: product.stock - item.quantity
        });
      }

      setCart([]);
      setSelectedClient(null);
      setClientSearch('');
      setSalesChannel('TIENDA');
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

  // FUNCIONES DE REPORTES
  const getFilteredSales = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return sales.filter(sale => {
      // Comparar directamente los strings de fecha
	  const saleDateString = sale.date; // Ya es string "2026-01-24"
      const todayString = today.toISOString().split('T')[0];

      switch(reportFilter) {
        case 'hoy':
          return saleDateString === todayString;
        case 'semana':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return saleDate >= weekAgo;
        case 'mes':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return saleDate >= monthAgo;
        case 'personalizado':
          const start = new Date(customDateRange.start);
          const end = new Date(customDateRange.end);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          return saleDate >= start && saleDate <= end;
        default:
          return true;
      }
    });
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
    const doc = generateOrderNote(sale);
    doc.save(`Pedido_${sale.orderNumber}_${sale.clientName}.pdf`);
    
    const whatsappUrl = `https://wa.me/${sale.clientPhone?.replace(/\D/g, '')}`;
    window.open(whatsappUrl, '_blank');
    
    alert('PDF descargado. Por favor, adjunta el archivo en WhatsApp.');
  };

  const generateStockPDF = () => {
    const doc = new jsPDF();
    
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('ABermud', 20, 18);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('Lo bueno va contigo', 20, 25);
    
    doc.setFont(undefined, 'normal');
    doc.text('Reporte de Stock - General', 20, 32);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, 45);

    const groupedProducts = {};
    products.forEach(product => {
      const key = `${product.modelo}-${product.color}`;
      if (!groupedProducts[key]) {
        groupedProducts[key] = {
          modelo: product.modelo,
          color: product.color,
          S: 0, M: 0, L: 0, XL: 0
        };
      }
      groupedProducts[key][product.talla] = product.stock;
    });

    let yPosition = 55;

    const modeloGroups = {};
    Object.values(groupedProducts).forEach(item => {
      if (!modeloGroups[item.modelo]) {
        modeloGroups[item.modelo] = [];
      }
      modeloGroups[item.modelo].push(item);
    });

    Object.keys(modeloGroups).forEach((modelo) => {
      const items = modeloGroups[modelo];
      const tableHeight = (items.length + 2) * 7 + 10;
      
      if (yPosition + tableHeight > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(modelo, 20, yPosition);
      yPosition += 6;

      const matrixData = items.map(item => {
        const row = [
          item.color,
          item.S.toString(),
          item.M.toString(),
          item.L.toString(),
          item.XL.toString()
        ];
        return row;
      });

      doc.autoTable({
        startY: yPosition,
        head: [['Color', 'S', 'M', 'L', 'XL']],
        body: matrixData,
        theme: 'grid',
        headStyles: { 
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
		  halign: 'center'
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 25, halign: 'center' }
        },
        margin: { left: 20 }
      });

      yPosition = doc.lastAutoTable.finalY + 8;
    });

    if (yPosition + 35 > 270) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition, 170, 25, 'F');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN DE INVENTARIO', 25, yPosition + 8);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const valorTotal = products.reduce((sum, p) => sum + (p.stock * p.precioVenta), 0);
    
    doc.text(`Total de productos: ${products.length}`, 25, yPosition + 15);
    doc.text(`Total de unidades: ${totalStock}`, 25, yPosition + 20);
    doc.text(`Valor total: S/ ${valorTotal.toFixed(2)}`, 100, yPosition + 15);

    doc.save(`ABermud_Stock_General_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateStockForClientsPDF = () => {
    const doc = new jsPDF();
    
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('ABermud', 20, 18);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('Lo bueno va contigo', 20, 25);
    
    doc.setFont(undefined, 'normal');
    doc.text('Reporte de Stock - Modelos y Colores', 20, 32);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, 45);

    const modeloMap = {};
    products.forEach(p => {
      if (p.stock > 0) {
        if (!modeloMap[p.modelo]) {
          modeloMap[p.modelo] = {
            S: new Set(),
            M: new Set(),
            L: new Set(),
            XL: new Set()
          };
        }
        if (modeloMap[p.modelo][p.talla]) {
          modeloMap[p.modelo][p.talla].add(p.color);
        }
      }
    });

    let yPosition = 55;

    Object.keys(modeloMap).forEach(modelo => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(modelo, 20, yPosition);
      yPosition += 6;

      // Preparar colores por talla
const tallasArray = ['S', 'M', 'L', 'XL'];
const coloresPorTalla = {};

tallasArray.forEach(talla => {
  coloresPorTalla[talla] = Array.from(modeloMap[modelo][talla]);
});

// Encontrar el máximo número de colores
const maxColors = Math.max(...tallasArray.map(t => coloresPorTalla[t].length));

// Crear filas de la tabla (cada fila es un índice de color)
const tableData = [];
for (let i = 0; i < maxColors; i++) {
  const row = tallasArray.map(talla => coloresPorTalla[talla][i] || '-');
  tableData.push(row);
}

doc.autoTable({
  startY: yPosition,
  head: [tallasArray], // S, M, L, XL como headers
  body: tableData,
  theme: 'grid',
  headStyles: { 
    fillColor: [0, 0, 0],
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    halign: 'center',
    fontSize: 9
  },
  columnStyles: {
    0: { cellWidth: 35, halign: 'center' },
    1: { cellWidth: 35, halign: 'center' },
    2: { cellWidth: 35, halign: 'center' },
    3: { cellWidth: 35, halign: 'center' }
  },
  bodyStyles: { fontSize: 8, halign: 'center' },
  margin: { left: 20 }
});

      yPosition = doc.lastAutoTable.finalY + 8;
    });

    doc.setTextColor(255, 0, 0);
    doc.setFontSize(8);
    
    doc.save(`ABermud_Stock_Clientes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateSalesPDF = () => {
    const doc = new jsPDF();
    const filteredSales = getFilteredSales();
    
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('ABermud', 20, 18);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('Lo bueno va contigo', 20, 25);
    
    doc.setFont(undefined, 'normal');
    doc.text('Reporte de Ventas', 20, 32);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, 45);

    const tableData = filteredSales.map(sale => [
      new Date(sale.date).toLocaleDateString('es-PE'),
      `#${sale.orderNumber}`,
      sale.clientName,
      sale.items.length,
      `S/ ${sale.total.toFixed(2)}`,
      sale.salesChannel || 'TIENDA'
    ]);

    doc.autoTable({
      startY: 55,
      head: [['Fecha', 'Nº Pedido', 'Cliente', 'Items', 'Total', 'Medio']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      styles: { fontSize: 8 }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    
    const totalVentas = filteredSales.length;
    const totalIngresos = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const liveSales = filteredSales.filter(s => s.salesChannel === 'LIVE');
    const tiendaSales = filteredSales.filter(s => s.salesChannel === 'TIENDA');
    const liveTotal = liveSales.reduce((sum, s) => sum + s.total, 0);
    const tiendaTotal = tiendaSales.reduce((sum, s) => sum + s.total, 0);

    doc.setFillColor(240, 240, 240);
    doc.rect(20, finalY, 170, 35, 'F');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('TOTALES', 25, finalY + 8);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`Total ventas: ${totalVentas}`, 25, finalY + 15);
    doc.text(`Ingresos: S/ ${totalIngresos.toFixed(2)}`, 25, finalY + 21);
    doc.text(`LIVE: S/ ${liveTotal.toFixed(2)} (${totalIngresos > 0 ? ((liveTotal/totalIngresos)*100).toFixed(0) : 0}%)`, 25, finalY + 27);
    doc.text(`TIENDA: S/ ${tiendaTotal.toFixed(2)} (${totalIngresos > 0 ? ((tiendaTotal/totalIngresos)*100).toFixed(0) : 0}%)`, 100, finalY + 27);

    doc.save(`ABermud_Ventas_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateVariantsPDF = () => {
    const doc = new jsPDF();
    const filteredSales = getFilteredSales();
    
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('ABermud', 20, 18);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('Lo bueno va contigo', 20, 25);
    
    doc.setFont(undefined, 'normal');
    doc.text('Reporte por Variantes', 20, 32);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, 45);

    const variantsMap = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const key = `${item.modelo}-${item.color}-${item.talla}`;
        if (!variantsMap[key]) {
          variantsMap[key] = {
            fecha: sale.date,
            modelo: item.modelo,
            color: item.color,
            talla: item.talla,
            cantidad: 0
          };
        }
        variantsMap[key].cantidad += item.quantity;
      });
    });

    const sortedVariants = Object.values(variantsMap).sort((a, b) => b.cantidad - a.cantidad);

    const tableData = sortedVariants.map(v => [
      new Date(v.fecha).toLocaleDateString('es-PE'),
      v.modelo,
      v.color,
      v.talla,
      v.cantidad
    ]);

    doc.autoTable({
      startY: 55,
      head: [['Fecha', 'Producto', 'Color', 'Talla', 'Unid.Vendidas']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      styles: { fontSize: 8 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('*Con este dato evaluamos los modelos, color y tallas mas vendidos', 20, finalY);

    doc.save(`ABermud_Variantes_${new Date().toISOString().split('T')[0]}.pdf`);
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
          lastUpdate: product.lastStockUpdate,
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

  // Calcular ingresos del día
  const getTodayRevenue = () => {
    const today = new Date().toISOString().split('T')[0];
    return sales
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + s.total, 0);
  };

  const stats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    totalValue: products.reduce((sum, p) => sum + (p.stock * p.precioVenta), 0),
    totalClients: clients.length,
    totalSales: sales.length,
    todayRevenue: getTodayRevenue(),
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

            <div className="hidden md:flex items-center">
              <div className="text-right">
                <p className="text-xs text-emerald-400">Ingresos del día</p>
                <p className="text-lg font-bold text-emerald-400">S/ {stats.todayRevenue.toFixed(2)}</p>
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

      {(
        <nav className="hidden md:block bg-white border-b border-gray-200 shadow-sm sticky top-20 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1">
              {navigation.map(nav => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.id}
                    onClick={() => setActiveTab(nav.id)}
                    className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all relative ${
                      activeTab === nav.id
                        ? 'text-black'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={16} />
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
      )}

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
                <p className="text-emerald-100 text-sm font-medium mb-1">Ingresos del Día</p>
                <p className="text-3xl font-bold text-white">S/ {stats.todayRevenue.toFixed(2)}</p>
                <p className="text-xs text-emerald-100 mt-2">Ventas de hoy</p>
              </div>
            </div>

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
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all shadow-sm text-sm"
                />
              </div>
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm"
              >
                <Plus size={18} />
                <span>Agregar</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">S</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">M</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">XL</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actualiz.</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getMatrixInventory().map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-black">{item.modelo}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{item.color}</td>
                        <td className="px-4 py-2 text-sm text-center">
  						  <span className={`font-bold ${
   						    (item.sizes['S'] || 0) >= 10 ? 'text-green-600' : 
   						    (item.sizes['S'] || 0) >= 6 ? 'text-yellow-600' : 
    			            'text-red-600'
  						  }`}>
   						    {item.sizes['S'] || 0}
 						  </span>
						</td>
                        {/* M */}
						<td className="px-4 py-2 text-sm text-center">
  						  <span className={`font-bold ${
    						(item.sizes['M'] || 0) >= 10 ? 'text-green-600' : 
   							(item.sizes['M'] || 0) >= 6 ? 'text-yellow-600' : 
   						    'text-red-600'
  						  }`}>
   						    {item.sizes['M'] || 0}
 						  </span>
						</td>

						{/* L */}
						<td className="px-4 py-2 text-sm text-center">
  						  <span className={`font-bold ${
   					        (item.sizes['L'] || 0) >= 10 ? 'text-green-600' : 
   						    (item.sizes['L'] || 0) >= 6 ? 'text-yellow-600' : 
   					        'text-red-600'
						  }`}>
    						{item.sizes['L'] || 0}
						  </span>
						</td>

						{/* XL */}
						<td className="px-4 py-2 text-sm text-center">
  						  <span className={`font-bold ${
   						    (item.sizes['XL'] || 0) >= 10 ? 'text-green-600' : 
   						    (item.sizes['XL'] || 0) >= 6 ? 'text-yellow-600' : 
   					        'text-red-600'
				          }`}>
    					    {item.sizes['XL'] || 0}
						  </span>
						</td>
                        <td className="px-4 py-2 text-xs text-gray-500">
                          {item.lastUpdate ? new Date(item.lastUpdate).toLocaleDateString('es-PE') : '-'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                // Buscar TODOS los productos con ese modelo y color 
                                const relatedProducts = products.filter(p =>
                                  p.modelo === item.modelo && p.color === item.color
                                );
    				if (relatedProducts.length > 0) {
                                  // Crear objeto con todas las tallas
				  const productData = {
         			    modelo: item.modelo,
        			    color: item.color,
        			    imagen: relatedProducts[0].imagen || '',
        			    precioCompra: relatedProducts[0].precioCompra || 0,
        			    precioVenta: relatedProducts[0].precioVenta,
        			    sizes: {}
				  };

				  relatedProducts.forEach(p => {
				    productData.sizes[p.talla] = {
				      id: p.id,
          			      stock: p.stock
				    };
      				  });

				  setEditingProduct(productData);
			        }
  			      }}
                              className="text-gray-400 hover:text-black"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                const product = products.find(p => 
                                  p.modelo === item.modelo && p.color === item.color
                                );
                                if (product) deleteProduct(product.id);
                              }}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddClient(true)}
                className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all flex items-center gap-2 shadow-md hover:shadow-lg text-sm"
              >
                <Plus size={18} />
                Agregar Cliente
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {clients.map(client => (
                  <div key={client.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-black mb-1">{client.nombre}</h3>
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
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteClient(client.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
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
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddSale(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg text-sm"
              >
                <Plus size={18} />
                Nueva Venta
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-base font-bold text-black">Historial de Ventas</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sales.map(sale => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-mono text-gray-600">#{sale.orderNumber}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {new Date(sale.date).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-black">{sale.clientName}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {sale.items.length}
                        </td>
                        <td className="px-4 py-2 text-sm font-bold text-emerald-600">
                          S/ {sale.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewingSale(sale)}
                              className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded"
                              title="Ver"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => downloadOrderNote(sale)}
                              className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded"
                              title="PDF"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => shareOrderViaWhatsApp(sale)}
                              className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                              title="WhatsApp"
                            >
                              <Share2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteSale(sale.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
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
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <Filter size={20} className="text-gray-500" />
                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                >
                  <option value="hoy">Hoy</option>
                  <option value="semana">Esta Semana</option>
                  <option value="mes">Este Mes</option>
                  <option value="personalizado">Personalizado</option>
                </select>

                {reportFilter === 'personalizado' && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange({...customDateRange, start: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <span className="self-center">-</span>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-black mb-2">Stock General</h3>
                    <p className="text-gray-600 text-sm">Vista matricial con semaforización</p>
                  </div>
                  <FileText className="text-gray-300" size={28} />
                </div>

                <button
                  onClick={generateStockPDF}
                  disabled={products.length === 0}
                  className="w-full px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 text-sm"
                >
                  <Download size={18} />
                  Exportar PDF
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-black mb-2">Stock para Clientes</h3>
                    <p className="text-gray-600 text-sm">Sin cantidades, solo colores</p>
                  </div>
                  <FileText className="text-gray-300" size={28} />
                </div>

                <button
                  onClick={generateStockForClientsPDF}
                  disabled={products.length === 0}
                  className="w-full px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 text-sm"
                >
                  <Download size={18} />
                  Exportar PDF
                </button>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Reporte de Ventas</h3>
                    <p className="text-emerald-100 text-sm">Con medio de captación</p>
                  </div>
                  <FileText className="text-white/40" size={28} />
                </div>

                <button
                  onClick={generateSalesPDF}
                  disabled={sales.length === 0}
                  className="w-full px-4 py-2 bg-white text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 text-sm"
                >
                  <Download size={18} />
                  Exportar PDF
                </button>
              </div>

              <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Reporte por Variantes</h3>
                    <p className="text-gray-300 text-sm">Detalle de productos vendidos</p>
                  </div>
                  <FileText className="text-white/40" size={28} />
                </div>

                <button
                  onClick={generateVariantsPDF}
                  disabled={sales.length === 0}
                  className="w-full px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 text-sm"
                >
                  <Download size={18} />
                  Exportar PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALES SIGUEN... (continuaré en el siguiente bloque) */}
      
      {/* MODAL: Agregar Producto */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Agregar Producto</h2>
              <button onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">URL Imagen (opcional)</label>
                <input
                  type="text"
                  value={newProduct.imagen}
                  onChange={(e) => setNewProduct({ ...newProduct, imagen: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                  placeholder="https://i.imgur.com/ejemplo.jpg"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Modelo *</label>
                <input
                  type="text"
                  value={newProduct.modelo}
                  onChange={(e) => setNewProduct({ ...newProduct, modelo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                  placeholder="Ej: Jogger Casual"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Color</label>
                  <input
                    type="text"
                    value={newProduct.color}
                    onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                    placeholder="Negro"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Talla</label>
                  <input
                    type="text"
                    value={newProduct.talla}
                    onChange={(e) => setNewProduct({ ...newProduct, talla: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                    placeholder="M"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">P. Compra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.precioCompra}
                    onChange={(e) => setNewProduct({ ...newProduct, precioCompra: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">P. Venta *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.precioVenta}
                    onChange={(e) => setNewProduct({ ...newProduct, precioVenta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Stock *</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={addProduct}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 text-sm"
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
    	  <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
      	    <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Editar Producto</h2>
              <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">URL Imagen</label>
                <input
                  type="text"
                  value={editingProduct.imagen || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imagen: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Modelo *</label>
                <input
                  type="text"
                  value={editingProduct.modelo}
            	  onChange={(e) => setEditingProduct({ ...editingProduct, modelo: e.target.value })}
            	  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
          	/>
              </div>

              <div>
          	<label className="block text-sm font-medium mb-1">Color</label>
          	<input
            	  type="text"
            	  value={editingProduct.color}
            	  onChange={(e) => setEditingProduct({ ...editingProduct, color: e.target.value })}
            	  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
          	/>
              </div>

              <div className="grid grid-cols-2 gap-3">
          	<div>
            	  <label className="block text-sm font-medium mb-1">P. Compra</label>
            	  <input
              	    type="number"
              	    step="0.01"
              	    value={editingProduct.precioCompra}
              	    onChange={(e) => setEditingProduct({ ...editingProduct, precioCompra: e.target.value })}
              	    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
            	  />
          	</div>
          	<div>
            	  <label className="block text-sm font-medium mb-1">P. Venta *</label>
            	  <input
              	    type="number"
              	    step="0.01"
              	    value={editingProduct.precioVenta}
              	    onChange={(e) => setEditingProduct({ ...editingProduct, precioVenta: e.target.value })}
              	    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
            	  />
          	</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
          	<label className="block text-sm font-medium mb-3">Stock por Talla</label>
          	<div className="grid grid-cols-2 gap-3">
            	  {['S', 'M', 'L', 'XL'].map(talla => (
              	    <div key={talla}>
                      <label className="block text-xs text-gray-600 mb-1">Talla {talla}</label>
                      <input
                        type="number"
                  	min="0"
                  	value={editingProduct.sizes?.[talla]?.stock || 0}
                  	onChange={(e) => {
                    	  const newSizes = { ...editingProduct.sizes };
                    	  if (!newSizes[talla]) {
                      	    newSizes[talla] = { id: null, stock: 0 };
                    	  }
                    	  newSizes[talla].stock = parseInt(e.target.value) || 0;
                    	  setEditingProduct({ ...editingProduct, sizes: newSizes });
                  	}}
                  	className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                  	placeholder="0"
               	      />
              	    </div>
            	  ))}
          	</div>
              </div>

              <div className="flex gap-3 pt-3">
          	<button
            	  onClick={() => setEditingProduct(null)}
            	  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 text-sm"
          	>
            	  Cancelar
          	</button>
          	<button
            	  onClick={async () => {
              	    if (!editingProduct.modelo || !editingProduct.precioVenta) {
                      alert('Por favor complete los campos requeridos');
                      return;
              	    }

              	    try {
                      const today = new Date().toISOString().split('T')[0];
                
                    // Actualizar o crear productos para cada talla
                    for (const talla of ['S', 'M', 'L', 'XL']) {
                      const sizeData = editingProduct.sizes?.[talla];
                      const stock = sizeData?.stock || 0;
                  
                      if (sizeData?.id) {
                        // Actualizar producto existente
                        const productRef = doc(db, 'products', sizeData.id);
                        await updateDoc(productRef, {
                      	  modelo: editingProduct.modelo,
                      	  color: editingProduct.color,
                      	  imagen: editingProduct.imagen || '',
                      	  precioCompra: parseFloat(editingProduct.precioCompra) || 0,
                      	  precioVenta: parseFloat(editingProduct.precioVenta),
                      	  stock: stock,
                      	  lastStockUpdate: today
                    	});
                      } else if (stock > 0) {
                       // Crear nuevo producto si tiene stock
                       await addDoc(collection(db, 'products'), {
                      	 modelo: editingProduct.modelo,
                      	 color: editingProduct.color,
                      	 talla: talla,
                      	 imagen: editingProduct.imagen || '',
                      	 precioCompra: parseFloat(editingProduct.precioCompra) || 0,
                      	 precioVenta: parseFloat(editingProduct.precioVenta),
                      	 stock: stock,
                      	 createdAt: serverTimestamp(),
                      	 lastStockUpdate: today
                       });
                     }
                   }
                
                   setEditingProduct(null);
                   alert('Producto actualizado correctamente');
                 } catch (error) {
                   console.error('Error:', error);
                   alert('Error al actualizar producto');
              	 }
               }}
               className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 text-sm"
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
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Agregar Cliente</h2>
              <button onClick={() => setShowAddClient(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newClient.nombre}
                  onChange={(e) => setNewClient({ ...newClient, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">DNI *</label>
                <input
                  type="text"
                  value={newClient.dni}
                  onChange={(e) => setNewClient({ ...newClient, dni: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                  maxLength="8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={newClient.telefono}
                  onChange={(e) => setNewClient({ ...newClient, telefono: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <textarea
                  value={newClient.direccion}
                  onChange={(e) => setNewClient({ ...newClient, direccion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                  rows="2"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setShowAddClient(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={addClient}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 text-sm"
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
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Editar Cliente</h2>
              <button onClick={() => setEditingClient(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editingClient.nombre}
                  onChange={(e) => setEditingClient({ ...editingClient, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">DNI *</label>
                <input
                  type="text"
                  value={editingClient.dni}
                  onChange={(e) => setEditingClient({ ...editingClient, dni: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                  maxLength="8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={editingClient.telefono}
                  onChange={(e) => setEditingClient({ ...editingClient, telefono: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <textarea
                  value={editingClient.direccion}
                  onChange={(e) => setEditingClient({ ...editingClient, direccion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                  rows="2"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setEditingClient(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={updateClient}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 text-sm"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Venta OPTIMIZADA */}
      {showAddSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-6xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nueva Venta</h2>
              <button
                onClick={() => {
                  setShowAddSale(false);
                  setCart([]);
                  setSelectedClient(null);
                  setClientSearch('');
                  setSelectedProductModel(null);
                  setSelectedTalla(null);
                  setColorQuantities({});
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* COLUMNA IZQUIERDA: Productos */}
              <div>
                <h3 className="font-bold mb-3 text-base">Productos</h3>
                
		{/* BUSCADOR DE PRODUCTOS */}
  		<div className="mb-3">
    		  <div className="relative">
      		    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
      		    <input
        	      type="text"
        	      placeholder="Buscar modelo..."
        	      value={searchTerm}
        	      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
      		    />
    		  </div>
  		</div>
                
		{!selectedProductModel ? (
    		  <div className="space-y-2 max-h-96 overflow-y-auto">
      	            {getProductsByModel()
        	      .filter(product => 
          		product.modelo.toLowerCase().includes(searchTerm.toLowerCase())
        	      )
        	      .map((product, index) => (
        	      <div
			key={`${product.modelo}-${index}`}
         	        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 border"
        	      >
          	        {product.imagen ? (
                          <img src={product.imagen} alt={product.modelo} className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <Package size={24} className="text-gray-400" />
                          </div>
                        )}
			<div className="flex-1">
            		  <p className="font-medium text-sm">{product.modelo}</p>
            		  <p className="text-xs text-gray-600">Stock: {product.totalStock} • S/ {product.precio.toFixed(2)}</p>
          		</div>
          		<button
            		  onClick={() => selectProductModel(product)}
            		  className="px-3 py-1 bg-black text-white rounded-lg text-sm hover:bg-gray-900"
          		>
         	          Agregar
          		</button>
        	      </div>
      		    ))}

		    {getProductsByModel().filter(product => 
        	      product.modelo.toLowerCase().includes(searchTerm.toLowerCase())
      		    ).length === 0 && (
        	      <div className="text-center py-8 bg-gray-50 rounded-lg border">
          		<Package className="mx-auto text-gray-300 mb-2" size={32} />
          		<p className="text-gray-500 text-sm">No se encontraron productos</p>
        	      </div>
      		    )}
    		  </div>
  		) : (
    		  <div className="space-y-4">
      		    <button
        	      onClick={() => {
          		setSelectedProductModel(null);
          		setSelectedTalla(null);
          		setColorQuantities({});
          		setSearchTerm('');
        	      }}
        	      className="text-sm text-gray-600 hover:text-black flex items-center gap-1"
      		    >
        	      <ChevronLeft size={16} /> Volver
      		    </button>

		    <div className="bg-gray-50 p-4 rounded-lg border">
        	      {/* Mostrar imagen del producto */}
        	      {selectedProductModel.imagen && (
          	        <div className="mb-3">
            		  <img 
              		    src={selectedProductModel.imagen} 
              		    alt={selectedProductModel.modelo}
              		    className="w-full h-32 object-cover rounded-lg"
            		  />
          		</div>
        	      )}

		      <h4 className="font-medium mb-3">{selectedProductModel.modelo}</h4>
        
        	      <div className="mb-4">
          		<p className="text-sm font-medium mb-2">Selecciona Talla:</p>
          		<div className="grid grid-cols-4 gap-2">
            		  {['S', 'M', 'L', 'XL'].map(talla => {
             		    const hasStock = products.some(p => 
                	      p.modelo === selectedProductModel.modelo && 
                	      p.talla === talla && 
                	      p.stock > 0
              		    );

			    return (
                	      <button
                  		key={talla}
                  		onClick={() => hasStock && selectTalla(talla)}
                  		disabled={!hasStock}
                  		className={`py-2 rounded-lg font-medium text-sm ${
                    		  selectedTalla === talla
                      		    ? 'bg-black text-white'
                      		    : hasStock
                      		    ? 'bg-white border border-gray-300 hover:bg-gray-100'
                      		    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  		}`}
                	      >
                  		{talla}
                	      </button>
              		    );
            		  })}
          		</div>
        	      </div>
		
		      {selectedTalla && (
          		<div>
            		  <p className="text-sm font-medium mb-2">Colores disponibles en talla {selectedTalla}:</p>
            		  <div className="space-y-2">
              		    {getAvailableColorsForTalla().map((colorData, index) => (
                	      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  		<span className="text-sm font-medium">{colorData.color}</span>
                  		<div className="flex items-center gap-2">
                   		  <span className="text-xs text-gray-500">({colorData.stock} unid.)</span>
                    		  <input
                      		    type="number"
                      		    min="0"
                      		    max={colorData.stock}
                      		    value={colorQuantities[colorData.color] || 0}
                      		    onChange={(e) => setColorQuantities({
                        	      ...colorQuantities,
                        	      [colorData.color]: parseInt(e.target.value) || 0
                      		    })}
                      		    className="w-16 px-2 py-1 border rounded text-center text-sm"
                   		  />
                  		</div>
                	      </div>
		     	    ))}
            		  </div>

			  <button
              		    onClick={addToCart}
             		    className="w-full mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 text-sm"
            		  >
              		    Agregar al Carrito
           		  </button>
          		</div>
        	      )}
      		    </div>
    		  </div>
  		)}
	      </div>

              {/* COLUMNA DERECHA: Carrito */}
              <div>
                <h3 className="font-bold mb-3 text-base">Carrito</h3>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Buscar Cliente (DNI o Nombre)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientResults(e.target.value.length > 0);
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                      placeholder="DNI o nombre del cliente"
                    />
                    {showClientResults && clientSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchClients(clientSearch).map(client => (
                          <button
                            key={client.id}
                            onClick={() => selectClient(client)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                          >
                            {client.nombre} (DNI: {client.dni})
                          </button>
                        ))}
                        {searchClients(clientSearch).length === 0 && (
                          <div className="p-3 text-center">
                            <p className="text-sm text-gray-500 mb-2">Cliente no encontrado</p>
                            <button
                              onClick={() => setShowCreateClient(true)}
                              className="px-3 py-1 bg-black text-white rounded text-sm hover:bg-gray-900"
                            >
                              + Crear cliente
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedClient && (
                    <div className="mt-2 p-2 bg-emerald-50 rounded text-sm">
                      <p className="font-medium">✓ {selectedClient.nombre}</p>
                      <p className="text-xs text-gray-600">DNI: {selectedClient.dni} • Tel: {selectedClient.telefono}</p>
                    </div>
                  )}
                </div>

                {showCreateClient && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">Crear Cliente Rápido</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nombre *"
                        value={newClient.nombre}
                        onChange={(e) => setNewClient({...newClient, nombre: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="DNI *"
                        value={newClient.dni}
                        onChange={(e) => setNewClient({...newClient, dni: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm"
                        maxLength="8"
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono"
                        value={newClient.telefono}
                        onChange={(e) => setNewClient({...newClient, telefono: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCreateClient(false)}
                          className="flex-1 px-3 py-2 bg-gray-200 rounded text-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={addClient}
                          className="flex-1 px-3 py-2 bg-black text-white rounded text-sm"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Medio de Captación</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSalesChannel('LIVE')}
                      className={`flex-1 py-2 rounded-lg font-medium text-sm ${
                        salesChannel === 'LIVE'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      LIVE
                    </button>
                    <button
                      onClick={() => setSalesChannel('TIENDA')}
                      className={`flex-1 py-2 rounded-lg font-medium text-sm ${
                        salesChannel === 'TIENDA'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      TIENDA
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Fecha</label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
                  />
                </div>

                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.modelo}</p>
                        <p className="text-xs text-gray-600">{item.color} - {item.talla} x{item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">S/ {(item.precioVenta * item.quantity).toFixed(2)}</span>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {cart.length > 0 ? (
                  <>
                    <div className="bg-black text-white p-3 rounded-lg mb-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">TOTAL:</span>
                        <span className="font-bold text-xl">
                          S/ {cart.reduce((sum, item) => sum + (item.precioVenta * item.quantity), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={completeSale}
                      className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 text-sm"
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
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Detalle de Venta</h2>
              <button onClick={() => setViewingSale(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="grid grid-cols-2 gap-3 text-sm">
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
                    <p className="text-xs text-gray-500 mb-1">Medio</p>
                    <p className="font-bold">{viewingSale.salesChannel || 'TIENDA'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2 text-sm">Productos</h3>
                <div className="space-y-2">
                  {viewingSale.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.modelo}</p>
                        <p className="text-xs text-gray-600">{item.color} - {item.talla}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">x{item.quantity}</p>
                        <p className="font-bold">S/ {item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black text-white p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-bold">TOTAL:</span>
                  <span className="font-bold text-2xl">S/ {viewingSale.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => downloadOrderNote(viewingSale)}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 flex items-center justify-center gap-2 text-sm"
                >
                  <Download size={16} />
                  PDF
                </button>
                <button
                  onClick={() => shareOrderViaWhatsApp(viewingSale)}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center justify-center gap-2 text-sm"
                >
                  <Share2 size={16} />
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


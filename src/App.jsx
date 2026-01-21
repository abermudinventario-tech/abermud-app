import React, { useState, useEffect } from 'react';
import { Package, Users, ShoppingCart, BarChart3, Plus, Edit2, Trash2, Search, Download, Camera, X, Save, AlertTriangle, TrendingUp, Warehouse, Share2, FileText, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ABermudApp = () => {
  const [activeTab, setActiveTab] = useState('ventas');
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [currentSale, setCurrentSale] = useState({
    client: null,
    items: [],
    discount: 0,
    paymentMethod: 'efectivo'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      try {
        const productsData = await window.storage.get('abermud-products');
        setProducts(productsData ? JSON.parse(productsData.value) : []);
      } catch (error) {
        setProducts([]);
      }
      try {
        const clientsData = await window.storage.get('abermud-clients');
        setClients(clientsData ? JSON.parse(clientsData.value) : []);
      } catch (error) {
        setClients([]);
      }
      try {
        const salesData = await window.storage.get('abermud-sales');
        setSales(salesData ? JSON.parse(salesData.value) : []);
      } catch (error) {
        setSales([]);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProducts = async (newProducts) => {
    try {
      await window.storage.set('abermud-products', JSON.stringify(newProducts), false);
      setProducts(newProducts);
    } catch (error) {
      console.error('Error al guardar productos:', error);
      alert('Error al guardar productos');
    }
  };

  const saveClients = async (newClients) => {
    try {
      await window.storage.set('abermud-clients', JSON.stringify(newClients), false);
      setClients(newClients);
    } catch (error) {
      console.error('Error al guardar clientes:', error);
      alert('Error al guardar clientes');
    }
  };

  const saveSales = async (newSales) => {
    try {
      await window.storage.set('abermud-sales', JSON.stringify(newSales), false);
      setSales(newSales);
    } catch (error) {
      console.error('Error al guardar ventas:', error);
      alert('Error al guardar ventas');
    }
  };

  const generateOrderNumber = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const todaySales = sales.filter(sale => {
      const saleDate = new Date(sale.date).toISOString().split('T')[0].replace(/-/g, '');
      return saleDate === dateStr;
    });
    const orderNum = (todaySales.length + 1).toString().padStart(3, '0');
    return `PED-${dateStr}-${orderNum}`;
  };

  // ===== FUNCIONES PDF =====
  
  const downloadStockPDF = () => {
    const doc = new jsPDF();
    
    // Logo y título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ABermud', 14, 20);
    
    doc.setFontSize(16);
    doc.text('Reporte de Stock', 14, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 14, 37);
    
    let currentY = 50;
    
    // Agrupar por modelo (formato matricial)
    products.forEach((product, productIndex) => {
      // Verificar si hay espacio suficiente en la página
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      // Título del modelo en mayúsculas
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(product.modelo.toUpperCase(), 14, currentY);
      currentY += 5;
      
      // Obtener todas las tallas únicas de este producto (ordenadas)
      const tallas = [...new Set(product.variants.map(v => v.talla))].sort();
      
      // Obtener todos los colores únicos
      const colores = [...new Set(product.variants.map(v => v.color))];
      
      // Crear matriz de stock (Color en filas, Tallas en columnas)
      const matrixData = colores.map(color => {
        const row = [color];
        tallas.forEach(talla => {
          const variant = product.variants.find(v => v.color === color && v.talla === talla);
          row.push(variant ? variant.stock : '');
        });
        return row;
      });
      
      // Generar tabla matricial
      doc.autoTable({
        startY: currentY,
        head: [['Color', ...tallas]],
        body: matrixData,
        styles: { 
          fontSize: 9,
          cellPadding: 3,
          halign: 'center'
        },
        headStyles: { 
          fillColor: [0, 0, 0], 
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold' }
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14 }
      });
      
      currentY = doc.lastAutoTable.finalY + 10;
    });
    
    doc.save(`Stock_ABermud_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadSalesPDF = () => {
    const doc = new jsPDF();
    
    // Logo y título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ABermud', 14, 20);
    
    doc.setFontSize(16);
    doc.text('Reporte de Ventas', 14, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 14, 37);
    
    // Estadísticas
    const totalVentas = sales.reduce((sum, sale) => sum + sale.total, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Ventas: S/ ${totalVentas.toFixed(2)}`, 14, 45);
    doc.text(`Cantidad de Ventas: ${sales.length}`, 14, 52);
    
    // Preparar datos
    const salesData = sales.map(sale => [
      sale.orderNumber,
      new Date(sale.date).toLocaleDateString('es-PE'),
      `${sale.client.nombre} ${sale.client.apellido}`,
      sale.items.length,
      `S/ ${sale.total.toFixed(2)}`,
      sale.paymentMethod
    ]);
    
    // Tabla
    doc.autoTable({
      startY: 60,
      head: [['N° Pedido', 'Fecha', 'Cliente', 'Items', 'Total', 'Pago']],
      body: salesData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    doc.save(`Ventas_ABermud_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateOrderPDF = (sale) => {
    const doc = new jsPDF();
    
    // Logo y título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ABermud', 14, 20);
    
    doc.setFontSize(14);
    doc.text('Nota de Pedido', 14, 30);
    
    // Número de pedido y fecha
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`N° Pedido: ${sale.orderNumber}`, 14, 40);
    doc.text(`Fecha: ${new Date(sale.date).toLocaleDateString('es-PE')}`, 14, 46);
    
    // Datos del cliente
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos del Cliente:', 14, 56);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre: ${sale.client.nombre} ${sale.client.apellido}`, 14, 62);
    doc.text(`DNI: ${sale.client.dni}`, 14, 68);
    if (sale.client.telefono) {
      doc.text(`Teléfono: ${sale.client.telefono}`, 14, 74);
    }
    if (sale.client.direccion) {
      doc.text(`Dirección: ${sale.client.direccion}`, 14, 80);
    }
    
    // Productos
    const productsData = sale.items.map(item => [
      `${item.producto.modelo} - ${item.variant.color} ${item.variant.talla}`,
      item.cantidad,
      `S/ ${item.variant.precio}`,
      `S/ ${item.subtotal.toFixed(2)}`
    ]);
    
    doc.autoTable({
      startY: sale.client.direccion ? 88 : 82,
      head: [['Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: productsData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    // Totales
    let finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.text(`Subtotal:`, 130, finalY);
    doc.text(`S/ ${sale.subtotal.toFixed(2)}`, 170, finalY, { align: 'right' });
    
    if (sale.discount > 0) {
      finalY += 6;
      doc.text(`Descuento:`, 130, finalY);
      doc.text(`- S/ ${sale.discount.toFixed(2)}`, 170, finalY, { align: 'right' });
    }
    
    finalY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL:`, 130, finalY);
    doc.text(`S/ ${sale.total.toFixed(2)}`, 170, finalY, { align: 'right' });
    
    // Método de pago
    finalY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Método de pago: ${sale.paymentMethod.toUpperCase()}`, 14, finalY);
    
    return doc;
  };

  const downloadOrderPDF = (sale) => {
    const doc = generateOrderPDF(sale);
    doc.save(`Pedido_${sale.orderNumber}.pdf`);
  };

  const shareOrderWhatsApp = (sale) => {
    const message = `
*NOTA DE PEDIDO - ABermud*

*N° Pedido:* ${sale.orderNumber}
*Fecha:* ${new Date(sale.date).toLocaleDateString('es-PE')}

*Cliente:*
${sale.client.nombre} ${sale.client.apellido}
DNI: ${sale.client.dni}
${sale.client.telefono ? `Tel: ${sale.client.telefono}` : ''}

*Productos:*
${sale.items.map(item => 
  `• ${item.producto.modelo} - ${item.variant.color} ${item.variant.talla}\n  ${item.cantidad} x S/ ${item.variant.precio} = S/ ${item.subtotal.toFixed(2)}`
).join('\n')}

*Subtotal:* S/ ${sale.subtotal.toFixed(2)}
${sale.discount > 0 ? `*Descuento:* - S/ ${sale.discount.toFixed(2)}\n` : ''}*TOTAL:* S/ ${sale.total.toFixed(2)}

*Método de pago:* ${sale.paymentMethod.toUpperCase()}

---
ABermud - Sistema de Inventario y Ventas
    `.trim();

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // ===== COMPONENTE: VISUALIZACIÓN DE NOTA DE PEDIDO =====
  
  const OrderView = ({ sale, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg w-full max-w-3xl my-8">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Nota de Pedido</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Logo y título */}
            <div className="text-center border-b pb-4">
              <h1 className="text-3xl font-bold text-gray-800">ABermud</h1>
              <p className="text-gray-600 mt-1">Nota de Pedido</p>
            </div>

            {/* Información del pedido */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Número de Pedido</p>
                <p className="font-bold text-lg">{sale.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Fecha</p>
                <p className="font-bold text-lg">{new Date(sale.date).toLocaleDateString('es-PE')}</p>
              </div>
            </div>

            {/* Datos del cliente */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-2">Datos del Cliente</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <span className="ml-2 font-medium">{sale.client.nombre} {sale.client.apellido}</span>
                </div>
                <div>
                  <span className="text-gray-600">DNI:</span>
                  <span className="ml-2 font-medium">{sale.client.dni}</span>
                </div>
                {sale.client.telefono && (
                  <div>
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="ml-2 font-medium">{sale.client.telefono}</span>
                  </div>
                )}
                {sale.client.direccion && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Dirección:</span>
                    <span className="ml-2 font-medium">{sale.client.direccion}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Productos */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Detalle de Productos</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Producto</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Cant.</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Precio Unit.</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sale.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm">
                          <p className="font-medium text-gray-900">{item.producto.modelo}</p>
                          <p className="text-gray-600">{item.variant.color} - {item.variant.talla}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">{item.cantidad}</td>
                        <td className="px-4 py-3 text-sm text-right">S/ {item.variant.precio}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">S/ {item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">S/ {sale.subtotal.toFixed(2)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento:</span>
                      <span className="font-medium">- S/ {sale.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold border-t pt-2">
                    <span>TOTAL:</span>
                    <span>S/ {sale.total.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-600 text-right">
                    Método de pago: <span className="font-medium">{sale.paymentMethod.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="p-6 border-t bg-gray-50 flex gap-3">
            <button
              onClick={() => downloadOrderPDF(sale)}
              className="flex-1 bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 font-medium"
            >
              <Download className="w-5 h-5" />
              Descargar PDF
            </button>
            <button
              onClick={() => shareOrderWhatsApp(sale)}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
            >
              <Share2 className="w-5 h-5" />
              Compartir WhatsApp
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ===== COMPONENTES EXISTENTES =====

  const ProductForm = () => {
    const [formData, setFormData] = useState(
      editingProduct || {
        id: Date.now().toString(),
        modelo: '',
        photo: null,
        variants: [{ color: '', talla: '', precio: '', stock: '' }]
      }
    );

    const handlePhotoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData({ ...formData, photo: reader.result });
        };
        reader.readAsDataURL(file);
      }
    };

    const addVariant = () => {
      setFormData({
        ...formData,
        variants: [...formData.variants, { color: '', talla: '', precio: '', stock: '' }]
      });
    };

    const removeVariant = (index) => {
      const newVariants = formData.variants.filter((_, i) => i !== index);
      setFormData({ ...formData, variants: newVariants });
    };

    const updateVariant = (index, field, value) => {
      const newVariants = [...formData.variants];
      newVariants[index][field] = value;
      setFormData({ ...formData, variants: newVariants });
    };

    const handleSubmit = () => {
      if (!formData.modelo) {
        alert('El modelo es obligatorio');
        return;
      }

      const hasValidVariant = formData.variants.some(
        v => v.color && v.talla && v.precio && v.stock
      );

      if (!hasValidVariant) {
        alert('Debe agregar al menos una variante completa');
        return;
      }

      const validVariants = formData.variants.filter(
        v => v.color && v.talla && v.precio && v.stock
      ).map(v => ({
        ...v,
        sku: `${formData.modelo.substring(0, 3).toUpperCase()}-${v.color.substring(0, 3).toUpperCase()}-${v.talla}`
      }));

      const productData = {
        ...formData,
        variants: validVariants
      };

      if (editingProduct) {
        const updatedProducts = products.map(p => 
          p.id === editingProduct.id ? productData : p
        );
        saveProducts(updatedProducts);
      } else {
        saveProducts([...products, productData]);
      }

      setShowProductForm(false);
      setEditingProduct(null);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg w-full max-w-2xl my-8">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button onClick={() => {
              setShowProductForm(false);
              setEditingProduct(null);
            }} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Jogger Dama"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto del Producto</label>
              <div className="flex items-center gap-4">
                {formData.photo && (
                  <img src={formData.photo} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                  <Camera className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {formData.photo ? 'Cambiar foto' : 'Subir foto'}
                  </span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Variantes (Color, Talla, Precio, Stock) *
                </label>
                <button onClick={addVariant} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Agregar variante
                </button>
              </div>

              {formData.variants.map((variant, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Color"
                    value={variant.color}
                    onChange={(e) => updateVariant(index, 'color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={variant.talla}
                    onChange={(e) => updateVariant(index, 'talla', e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Talla</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Precio"
                    value={variant.precio}
                    onChange={(e) => updateVariant(index, 'precio', e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={variant.stock}
                    onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.variants.length > 1 && (
                    <button onClick={() => removeVariant(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-3">
            <button
              onClick={() => {
                setShowProductForm(false);
                setEditingProduct(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ClientForm = () => {
    const [formData, setFormData] = useState(
      editingClient || {
        id: Date.now().toString(),
        nombre: '',
        apellido: '',
        dni: '',
        direccion: '',
        telefono: ''
      }
    );

    const handleSubmit = () => {
      if (!formData.nombre || !formData.apellido || !formData.dni) {
        alert('Nombre, apellido y DNI son obligatorios');
        return;
      }

      if (editingClient) {
        const updatedClients = clients.map(c => 
          c.id === editingClient.id ? formData : c
        );
        saveClients(updatedClients);
      } else {
        saveClients([...clients, formData]);
      }

      setShowClientForm(false);
      setEditingClient(null);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <button onClick={() => {
              setShowClientForm(false);
              setEditingClient(null);
            }} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                maxLength="8"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-3">
            <button
              onClick={() => {
                setShowClientForm(false);
                setEditingClient(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DashboardView = () => {
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProducts = products.length;
    const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0);
    const lowStock = products.reduce((sum, p) => 
      sum + p.variants.filter(v => parseInt(v.stock) > 0 && parseInt(v.stock) < 10).length, 0
    );
    const outOfStock = products.reduce((sum, p) => 
      sum + p.variants.filter(v => parseInt(v.stock) === 0).length, 0
    );
    const totalInventoryValue = products.reduce((sum, p) => 
      sum + p.variants.reduce((vSum, v) => vSum + (parseInt(v.stock) * parseFloat(v.precio)), 0), 0
    );

    const topClients = [...clients]
      .map(client => ({
        ...client,
        totalCompras: sales.filter(s => s.client.id === client.id).length,
        totalGastado: sales.filter(s => s.client.id === client.id).reduce((sum, sale) => sum + sale.total, 0)
      }))
      .sort((a, b) => b.totalGastado - a.totalGastado)
      .slice(0, 5);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Productos</p>
                <p className="text-3xl font-bold text-gray-800">{totalProducts}</p>
                <p className="text-xs text-gray-500 mt-1">{totalVariants} variantes</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Valor Inventario</p>
                <p className="text-3xl font-bold text-gray-800">S/ {totalInventoryValue.toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-1">Total en stock</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Stock Bajo</p>
                <p className="text-3xl font-bold text-gray-800">{lowStock}</p>
                <p className="text-xs text-gray-500 mt-1">Requiere atención</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Agotados</p>
                <p className="text-3xl font-bold text-gray-800">{outOfStock}</p>
                <p className="text-xs text-gray-500 mt-1">Sin stock</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Ventas Totales</h3>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-4xl font-bold text-green-600">S/ {totalSales.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">{sales.length} transacciones realizadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Clientes</h3>
          {topClients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay datos de clientes aún</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((client, index) => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{client.nombre} {client.apellido}</p>
                      <p className="text-sm text-gray-500">{client.totalCompras} compras realizadas</p>
                    </div>
                  </div>
                  <p className="font-bold text-blue-600 text-lg">S/ {client.totalGastado.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const InventoryView = () => {
    const allVariants = products.flatMap(product =>
      product.variants.map(variant => ({
        modelo: product.modelo,
        photo: product.photo,
        ...variant
      }))
    );

    const totalValue = allVariants.reduce((sum, v) => 
      sum + (parseInt(v.stock) * parseFloat(v.precio)), 0
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
          <button
            onClick={() => setActiveTab('productos')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar Producto
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Valor Inventario</p>
                <p className="text-3xl font-bold">S/ {totalValue.toFixed(2)}</p>
              </div>
              <Warehouse className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Productos</p>
                <p className="text-3xl font-bold">{products.length}</p>
              </div>
              <Package className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Variantes</p>
                <p className="text-3xl font-bold">{allVariants.length}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-purple-200" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {allVariants.length === 0 ? (
            <div className="p-12 text-center">
              <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No hay productos en el inventario</p>
              <button
                onClick={() => setActiveTab('productos')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Agregar primer producto
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Color</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Talla</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">SKU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allVariants.map((variant, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {variant.photo && (
                            <img src={variant.photo} alt="" className="w-10 h-10 rounded object-cover" />
                          )}
                          <span className="font-medium text-gray-900">{variant.modelo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{variant.color}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{variant.talla}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">S/ {variant.precio}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          parseInt(variant.stock) === 0 
                            ? 'bg-red-100 text-red-700'
                            : parseInt(variant.stock) < 10
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {variant.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{variant.sku}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProductsView = () => {
    const deleteProduct = (productId) => {
      if (confirm('¿Está seguro de eliminar este producto?')) {
        const newProducts = products.filter(p => p.id !== productId);
        saveProducts(newProducts);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Productos</h2>
          <button
            onClick={() => setShowProductForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay productos registrados</p>
            <button
              onClick={() => setShowProductForm(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Crear primer producto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                {product.photo && (
                  <img src={product.photo} alt={product.modelo} className="w-full h-48 object-cover rounded-t-lg" />
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-3">{product.modelo}</h3>
                  
                  <div className="space-y-2 mb-4">
                    {product.variants.map((variant, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <span className="text-gray-700">{variant.color} - {variant.talla}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-blue-600">S/ {variant.precio}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            parseInt(variant.stock) === 0 
                              ? 'bg-red-100 text-red-700'
                              : parseInt(variant.stock) < 10
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {variant.stock}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowProductForm(true);
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ClientsView = () => {
    const deleteClient = (clientId) => {
      if (confirm('¿Está seguro de eliminar este cliente?')) {
        const newClients = clients.filter(c => c.id !== clientId);
        saveClients(newClients);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Clientes</h2>
          <button
            onClick={() => setShowClientForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay clientes registrados</p>
            <button
              onClick={() => setShowClientForm(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Registrar primer cliente
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{client.nombre} {client.apellido}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{client.dni}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{client.telefono || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{client.direccion || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingClient(client);
                            setShowClientForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteClient(client.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const SalesView = () => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [cantidad, setCantidad] = useState(1);

    const addItemToSale = () => {
      if (!selectedProduct || !selectedVariant) {
        alert('Seleccione un producto y una variante');
        return;
      }

      if (cantidad <= 0) {
        alert('La cantidad debe ser mayor a 0');
        return;
      }

      if (cantidad > parseInt(selectedVariant.stock)) {
        alert('Stock insuficiente');
        return;
      }

      const newItem = {
        producto: selectedProduct,
        variant: selectedVariant,
        cantidad: parseInt(cantidad),
        subtotal: parseInt(cantidad) * parseFloat(selectedVariant.precio)
      };

      setCurrentSale({
        ...currentSale,
        items: [...currentSale.items, newItem]
      });

      setSelectedProduct(null);
      setSelectedVariant(null);
      setCantidad(1);
    };

    const removeItemFromSale = (index) => {
      const newItems = currentSale.items.filter((_, i) => i !== index);
      setCurrentSale({ ...currentSale, items: newItems });
    };

    const calculateSubtotal = () => {
      return currentSale.items.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const calculateTotal = () => {
      return calculateSubtotal() - parseFloat(currentSale.discount || 0);
    };

    const completeSale = async () => {
      if (!currentSale.client) {
        alert('Debe seleccionar un cliente');
        return;
      }

      if (currentSale.items.length === 0) {
        alert('Debe agregar al menos un producto');
        return;
      }

      const total = calculateTotal();
      if (total < 0) {
        alert('El total no puede ser negativo');
        return;
      }

      const newSale = {
        id: Date.now().toString(),
        orderNumber: generateOrderNumber(),
        date: new Date().toISOString(),
        client: currentSale.client,
        items: currentSale.items,
        subtotal: calculateSubtotal(),
        discount: parseFloat(currentSale.discount || 0),
        total: total,
        paymentMethod: currentSale.paymentMethod
      };

      const updatedProducts = products.map(product => {
        const updatedVariants = product.variants.map(variant => {
          const soldItem = currentSale.items.find(
            item => item.producto.id === product.id && item.variant.sku === variant.sku
          );

          if (soldItem) {
            return {
              ...variant,
              stock: (parseInt(variant.stock) - soldItem.cantidad).toString()
            };
          }
          return variant;
        });

        return { ...product, variants: updatedVariants };
      });

      await saveProducts(updatedProducts);
      await saveSales([...sales, newSale]);

      // Mostrar nota de pedido
      setViewingOrder(newSale);

      // Limpiar venta actual
      setCurrentSale({
        client: null,
        items: [],
        discount: 0,
        paymentMethod: 'efectivo'
      });
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Nueva Venta</h2>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">1. Seleccionar Cliente</h3>
          {clients.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-2">No hay clientes registrados</p>
              <button
                onClick={() => setShowClientForm(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Registrar cliente
              </button>
            </div>
          ) : (
            <div>
              <select
                value={currentSale.client?.id || ''}
                onChange={(e) => {
                  const client = clients.find(c => c.id === e.target.value);
                  setCurrentSale({ ...currentSale, client });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione un cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nombre} {client.apellido} - {client.dni}
                  </option>
                ))}
              </select>
              {currentSale.client && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Cliente:</strong> {currentSale.client.nombre} {currentSale.client.apellido}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>DNI:</strong> {currentSale.client.dni}
                  </p>
                  {currentSale.client.telefono && (
                    <p className="text-sm text-gray-700">
                      <strong>Teléfono:</strong> {currentSale.client.telefono}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">2. Agregar Productos</h3>
          
          {products.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-2">No hay productos registrados</p>
              <button
                onClick={() => setActiveTab('productos')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Ir a Productos
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                  <select
                    value={selectedProduct?.id || ''}
                    onChange={(e) => {
                      const product = products.find(p => p.id === e.target.value);
                      setSelectedProduct(product);
                      setSelectedVariant(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione un producto</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.modelo}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variante</label>
                  <select
                    value={selectedVariant?.sku || ''}
                    onChange={(e) => {
                      const variant = selectedProduct?.variants.find(v => v.sku === e.target.value);
                      setSelectedVariant(variant);
                    }}
                    disabled={!selectedProduct}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Color/Talla</option>
                    {selectedProduct?.variants.map(variant => (
                      <option key={variant.sku} value={variant.sku}>
                        {variant.color} - {variant.talla} (Stock: {variant.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={addItemToSale}
                disabled={!selectedProduct || !selectedVariant}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Agregar
              </button>

              {currentSale.items.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-800 mb-3">Productos en la venta:</h4>
                  <div className="space-y-2">
                    {currentSale.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.producto.modelo} - {item.variant.color} {item.variant.talla}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.cantidad} x S/ {item.variant.precio} = S/ {item.subtotal.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItemFromSale(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {currentSale.items.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg text-gray-800 mb-4">3. Finalizar Venta</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="efectivo"
                      checked={currentSale.paymentMethod === 'efectivo'}
                      onChange={(e) => setCurrentSale({ ...currentSale, paymentMethod: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Efectivo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="tarjeta"
                      checked={currentSale.paymentMethod === 'tarjeta'}
                      onChange={(e) => setCurrentSale({ ...currentSale, paymentMethod: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Tarjeta</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="transferencia"
                      checked={currentSale.paymentMethod === 'transferencia'}
                      onChange={(e) => setCurrentSale({ ...currentSale, paymentMethod: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Transferencia</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="yape"
                      checked={currentSale.paymentMethod === 'yape'}
                      onChange={(e) => setCurrentSale({ ...currentSale, paymentMethod: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Yape</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (Monto Fijo)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentSale.discount}
                  onChange={(e) => setCurrentSale({ ...currentSale, discount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-medium">S/ {calculateSubtotal().toFixed(2)}</span>
                </div>
                {currentSale.discount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Descuento:</span>
                    <span className="font-medium text-red-600">- S/ {parseFloat(currentSale.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total:</span>
                  <span className="text-blue-600">S/ {calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={completeSale}
                disabled={!currentSale.client}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-6 h-6" />
                Completar Venta
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ReportsView = () => {
    const [reportType, setReportType] = useState('stock');

    const allVariants = products.flatMap(product =>
      product.variants.map(variant => ({
        modelo: product.modelo,
        ...variant
      }))
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Reportes</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setReportType('stock')}
              className={`px-4 py-2 rounded-lg font-medium ${
                reportType === 'stock'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Stock
            </button>
            <button
              onClick={() => setReportType('ventas')}
              className={`px-4 py-2 rounded-lg font-medium ${
                reportType === 'ventas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ventas
            </button>
          </div>
        </div>

        {reportType === 'stock' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Reporte de Stock</h3>
              <button
                onClick={downloadStockPDF}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 font-medium"
              >
                <Download className="w-5 h-5" />
                Descargar PDF
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h4 className="font-bold text-lg text-gray-800">Stock Disponible</h4>
              </div>
              
              {allVariants.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No hay productos para mostrar</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talla</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allVariants.map((variant, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{variant.modelo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">{variant.color}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">{variant.talla}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">S/ {variant.precio}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              parseInt(variant.stock) === 0 
                                ? 'bg-red-100 text-red-700'
                                : parseInt(variant.stock) < 10
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {variant.stock}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{variant.sku}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Reporte de Ventas</h3>
              <button
                onClick={downloadSalesPDF}
                disabled={sales.length === 0}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Descargar PDF
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h4 className="font-bold text-lg text-gray-800">Historial de Ventas</h4>
              </div>
              
              {sales.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No hay ventas registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Pedido</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método Pago</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{sale.orderNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {new Date(sale.date).toLocaleDateString('es-PE')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {sale.client.nombre} {sale.client.apellido}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">{sale.items.length}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">
                            S/ {sale.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700 capitalize">{sale.paymentMethod}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setViewingOrder(sale)}
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando ABermud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">AB</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">ABermud</h1>
            </div>
            <p className="text-sm text-gray-600">Sistema de Inventario y Ventas</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'inventario', label: 'Inventario', icon: Warehouse },
              { id: 'productos', label: 'Productos', icon: Package },
              { id: 'clientes', label: 'Clientes', icon: Users },
              { id: 'ventas', label: 'Ventas', icon: ShoppingCart },
              { id: 'reportes', label: 'Reportes', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'inventario' && <InventoryView />}
        {activeTab === 'productos' && <ProductsView />}
        {activeTab === 'clientes' && <ClientsView />}
        {activeTab === 'ventas' && <SalesView />}
        {activeTab === 'reportes' && <ReportsView />}
      </div>

      {showProductForm && <ProductForm />}
      {showClientForm && <ClientForm />}
      {viewingOrder && <OrderView sale={viewingOrder} onClose={() => setViewingOrder(null)} />}
    </div>
  );
};

export default ABermudApp;

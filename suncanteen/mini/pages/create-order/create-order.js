const app = getApp()

Page({
  data: {
    supplier_id: '',
    supplierName: '',
    remark: '',
    suppliers: [],
    products: [],
    selectedProducts: [],
    showSupplierModal: false,
    showProductModal: false,
    productKeyword: ''
  },
  onLoad: async function () {
    await this.loadSuppliers()
    await this.loadProducts()
  },
  loadSuppliers: async function () {
    try {
      const result = await app.request({ url: '/suppliers?page=1&size=50' })
      if (result.success) {
        this.setData({ suppliers: result.data.suppliers.filter(s => s.status === 'approved') })
      }
    } catch (error) {
      console.error('加载供应商失败', error)
    }
  },
  loadProducts: async function () {
    try {
      const result = await app.request({ url: '/products?page=1&size=100' })
      if (result.success) {
        this.setData({ products: result.data.products })
      }
    } catch (error) {
      console.error('加载商品失败', error)
    }
  },
  get filteredProducts: function () {
    if (!this.data.productKeyword) return this.data.products
    return this.data.products.filter(p => p.name.includes(this.data.productKeyword))
  },
  get totalAmount: function () {
    return this.data.selectedProducts.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  },
  onRemarkInput: function (e) {
    this.setData({ remark: e.detail.value })
  },
  onProductSearch: function (e) {
    this.setData({ productKeyword: e.detail.value })
  },
  showSupplierPicker: function () {
    this.setData({ showSupplierModal: true })
  },
  hideSupplierPicker: function () {
    this.setData({ showSupplierModal: false })
  },
  showProductPicker: function () {
    this.setData({ showProductModal: true })
  },
  hideProductPicker: function () {
    this.setData({ showProductModal: false })
  },
  selectSupplier: function (e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    this.setData({ supplier_id: id, supplierName: name, showSupplierModal: false })
  },
  selectProduct: function (e) {
    const dataset = e.currentTarget.dataset
    const existing = this.data.selectedProducts.find(p => p.id === dataset.id)
    if (!existing) {
      const newProducts = [...this.data.selectedProducts, {
        id: dataset.id,
        product_name: dataset.name,
        spec: dataset.spec,
        unit: dataset.unit,
        unit_price: parseFloat(dataset.price),
        quantity: 1
      }]
      this.setData({ selectedProducts: newProducts })
    }
    this.setData({ showProductModal: false })
  },
  increaseQty: function (e) {
    const index = e.currentTarget.dataset.index
    const products = [...this.data.selectedProducts]
    products[index].quantity++
    this.setData({ selectedProducts: products })
  },
  decreaseQty: function (e) {
    const index = e.currentTarget.dataset.index
    const products = [...this.data.selectedProducts]
    if (products[index].quantity > 1) {
      products[index].quantity--
      this.setData({ selectedProducts: products })
    }
  },
  removeProduct: function (e) {
    const index = e.currentTarget.dataset.index
    const products = this.data.selectedProducts.filter((_, i) => i !== index)
    this.setData({ selectedProducts: products })
  },
  stopPropagation: function () {},
  handleSubmit: async function () {
    const { supplier_id, selectedProducts } = this.data
    if (!supplier_id) {
      wx.showToast({ title: '请选择供应商', icon: 'none' })
      return
    }
    if (selectedProducts.length === 0) {
      wx.showToast({ title: '请添加商品', icon: 'none' })
      return
    }
    try {
      const data = {
        supplier_id,
        remark: this.data.remark,
        items: selectedProducts.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          kindergarten_qty: item.quantity,
          primary_qty: 0,
          junior_qty: 0
        }))
      }
      const result = await app.request({ url: '/orders', method: 'POST', data })
      if (result.success) {
        wx.showToast({ title: '订单创建成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({ title: result.message || '创建失败', icon: 'none' })
      }
    } catch (error) {
      wx.showToast({ title: '创建失败', icon: 'none' })
    }
  }
})
import { makeAutoObservable, runInAction } from "mobx";
import { db } from "./firebase";

import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  onSnapshot,
  updateDoc,
  getDocs,
  where,
  orderBy,
  limit,
} from "firebase/firestore";



class Store {
  // App Data
  cartItems = [];
  fetchedApis = {};
  cachedProducts = {};
  shopConfig = null;

  loading = true;
  categories = [];
  categoriesLoading = true;

  canProceedToPayment = false;
  shippingDetailsCompleted = false;
  billingDetailsCompleted = false;
  isShippingDifferent = false;

  constructor() {
    makeAutoObservable(this);
    this.setIsMobileOpen = this.setIsMobileOpen.bind(this);
    this.loadCartFromLocalStorage = this.loadCartFromLocalStorage.bind(this);
    this.saveCartToLocalStorage = this.saveCartToLocalStorage.bind(this);
    this.addToCart = this.addToCart.bind(this);
    this.removeFromCart = this.removeFromCart.bind(this);
    this.updateQuantity = this.updateQuantity.bind(this);
    this.calculateSubtotal = this.calculateSubtotal.bind(this);
    this.calculateTotal = this.calculateTotal.bind(this);
    this.getCartProducts = this.getCartProducts.bind(this);
    this.fetchProductDetails = this.fetchProductDetails.bind(this);
    this.fetchProductsByCategory = this.fetchProductsByCategory.bind(this);
    this.getProductById = this.getProductById.bind(this);
    this.initializeShopConfig = this.initializeShopConfig.bind(this);
    this.fetchAllProducts = this.fetchAllProducts.bind(this);
    this.fetchLimitedProducts = this.fetchLimitedProducts.bind(this);
    this.fetchProductById = this.fetchProductById.bind(this);
    this.fetchBestSellers = this.fetchBestSellers.bind(this);
    this.setCanProceedToPayment = this.setCanProceedToPayment.bind(this);
    this.setShippingDetailsCompleted =
      this.setShippingDetailsCompleted.bind(this);
    this.setBillingDetailsCompleted =
      this.setBillingDetailsCompleted.bind(this);
    this.updateCanProceedToPayment = this.updateCanProceedToPayment.bind(this);
    this.setIsShippingDifferent = this.setIsShippingDifferent.bind(this);
    this.fetchCategories = this.fetchCategories.bind(this);

    if (typeof window !== "undefined") {
      this.loadCartFromLocalStorage(); // Load cart only when in the browser
    }
    this.initializeShopConfig();
    this.fetchCategories();
  }

  async fetchCategories() {
    if (this.categories.length > 0) return; // Don't fetch if we already have categories

    this.categoriesLoading = true;
    try {
      const categoriesCollection = collection(db, "categories");
      const categoriesSnapshot = await getDocs(categoriesCollection);
      runInAction(() => {
        this.categories = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        this.categoriesLoading = false;
      });
    } catch (error) {
      console.log("Error fetching categories:", error);
      runInAction(() => {
        this.categoriesLoading = false;
      });
    }
  }

  async getProductById(productId) {
    if (this.cachedProducts[productId]) {
      return this.cachedProducts[productId];
    }
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const productData = productSnap.data();
      this.cachedProducts[productId] = productData; // Cache product
      return productData;
    } else {
      console.error("Product not found in Firestore");
      return null;
    }
  }

  async initializeShopConfig() {
    try {
      const docRef = doc(db, "shopConfig", "productSpecifications");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        this.shopConfig = docSnap.data();
      }
    } catch (error) {
      console.error("Error fetching shop config:", error);
    }
  }

  cacheProducts(products) {
    products.forEach((product) => {
      if (!this.cachedProducts[product.id]) {
        this.cachedProducts[product.id] = product;
      }
    });
  }

  // Fetch limited products (e.g., for home page or shop)
  async fetchLimitedProducts() {
    if (this.fetchedApis.limitedProducts) {
      return Object.values(this.cachedProducts).slice(0, 10); // Return first 10 products from cache
    }

    const productsQuery = query(collection(db, "products"), limit(10));

    const productsSnapshot = await getDocs(productsQuery);
    const productsList = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    runInAction(() => {
      this.cacheProducts(productsList); // Cache products
      this.fetchedApis.limitedProducts = true;
    });

    return productsList;
  }

  // Fetch all products
  async fetchAllProducts() {
    if (this.fetchedApis.allProducts) {
      return Object.values(this.cachedProducts);
    }

    const productsQuery = query(collection(db, "products"));

    const productsSnapshot = await getDocs(productsQuery);
    const productsList = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    runInAction(() => {
      this.cacheProducts(productsList); // Cache products
      this.fetchedApis.allProducts = true;
    });

    return productsList;
  }

  async fetchProductsByCategory(category) {
    if (this.fetchedApis[category]) {
      return Object.values(this.cachedProducts).filter(
        (product) => product.category === category
      );
    }

    const productQuery = query(
      collection(db, "products"),
      where("category", "==", category)
    );

    const productsSnapshot = await getDocs(productQuery);
    const productsList = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    runInAction(() => {
      this.cacheProducts(productsList); // Cache products
      this.fetchedApis[category] = true;
    });

    return productsList;
  }

  async fetchBestSellers() {
    if (this.fetchedApis.bestseller) {
      return Object.values(this.cachedProducts).filter(
        (product) => product.bestseller
      );
    }

    const bestSellerQuery = query(
      collection(db, "products"),
      where("bestseller", "==", true)
    );

    const bestSellersSnapshot = await getDocs(bestSellerQuery);
    const bestSellersList = bestSellersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    runInAction(() => {
      this.cacheProducts(bestSellersList); // Cache products
      this.fetchedApis.bestseller = true;
    });

    return bestSellersList;
  }

  async fetchProductById(id) {
    try {
      const productDoc = await getDoc(doc(db, "products", id));
      if (productDoc.exists()) {
        const productData = { id, ...productDoc.data() };
        runInAction(() => {
          this.cachedProducts[id] = productData; // Cache the fetched product
        });
        return productData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  }

  getCartProducts = async () => {
    const cartItems = this.cartItems; // This should come from localStorage
    const products = [];

    for (const cartItem of cartItems) {
      const { productId, quantity, size, material } = cartItem; // Extract size and other properties

      // Check if product is already cached
      let product = this.cachedProducts[productId];

      // If not cached, fetch from Firestore
      if (!product) {
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          product = productSnap.data();
          this.cachedProducts[productId] = product; // Cache the product
        }
      }

      // Ensure that we have the product data and then include size and quantity
      if (product) {
        products.push({
          ...product,
          quantity,
          size,
          material,
          price: parseFloat(cartItem.price), // Use the stored price from the cart item
          productId,
        });
      }
    }

    return products;
  };

  // Add to cart (stores only id and quantity)
  addToCart(item) {
    const existingItem = this.cartItems.find(
      (cartItem) =>
        cartItem.productId === item.productId &&
        cartItem.size === item.size &&
        cartItem.material === item.material
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.cartItems.push({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        material: item.material,
        price: item.price,
      });
    }

    this.saveCartToLocalStorage();
  }

  // Update quantity of an item in the cart
  updateQuantity(productId, size, material, newQuantity) {
    const item = this.cartItems.find(
      (cartItem) =>
        cartItem.productId === productId &&
        cartItem.size === size &&
        cartItem.material === material
    );

    if (item) {
      item.quantity = newQuantity;
      this.saveCartToLocalStorage();
    }
  }
  // Remove from cart
  removeFromCart(productId, size, material) {
    this.cartItems = this.cartItems.filter(
      (item) => !(
        item.productId === productId &&
        item.size === size &&
        item.material === material
      )
    );
    this.saveCartToLocalStorage();
  }

  // Load cart from localStorage
  async loadCartFromLocalStorage() {
    const cartData = localStorage.getItem("cart");
    if (cartData) {
      this.cartItems = JSON.parse(cartData);
      await this.fetchProductDetails(); // Ensure product details are fetched
    }
  }

  // Save cart to localStorage
  saveCartToLocalStorage() {
    localStorage.setItem("cart", JSON.stringify(this.cartItems));
  }
  calculateSubtotal() {
    return this.cartItems.reduce((acc, item) => {
      const { price, quantity } = item; // Use the price stored in the cart
      return acc + price * quantity; // Calculate subtotal using the price directly
    }, 0);
  }
  // Calculate total
  calculateTotal() {
    const subtotal = this.calculateSubtotal() || 0; // Default to 0 if undefined
    const shipping = parseFloat(this.shopConfig?.shippingRate) || 0; // Ensure shippingRate is a number
    const total = subtotal + shipping;

    return total; // Return total as a number
  }
  async fetchProductDetails() {
    const productIds = this.cartItems.map((item) => item.productId);

    // Fetch only products that are not already cached
    const missingProductIds = productIds.filter(
      (id) => !this.cachedProducts[id]
    );

    if (missingProductIds.length === 0) {
      return; // All products are already cached
    }

    const productDocs = await Promise.all(
      missingProductIds.map(async (id) => {
        const productRef = doc(db, "products", id);
        const productSnap = await getDoc(productRef);
        return productSnap.exists() ? { id, ...productSnap.data() } : null;
      })
    );

    runInAction(() => {
      productDocs.forEach((product) => {
        if (product) {
          this.cachedProducts[product.id] = product;
        }
      });
    });
  }
  // GLOBAL MOBX STATE
  setIsMobileOpen(isMobileOpen) {
    runInAction(() => {
      this.isMobileOpen = isMobileOpen;
    });
  }

  clearCart() {
    runInAction(() => {
      this.cartItems = [];
      this.saveCartToLocalStorage();
    });
  }

  setCanProceedToPayment(value) {
    runInAction(() => {
      this.canProceedToPayment = value;
    });
  }

  setShippingDetailsCompleted(value) {
    runInAction(() => {
      this.shippingDetailsCompleted = value;
      this.updateCanProceedToPayment();
    });
  }

  setBillingDetailsCompleted(value) {
    runInAction(() => {
      this.billingDetailsCompleted = value;
      this.updateCanProceedToPayment();
    });
  }

  updateCanProceedToPayment() {
    runInAction(() => {
      this.canProceedToPayment =
        this.shippingDetailsCompleted &&
        (this.billingDetailsCompleted || !this.isShippingDifferent);
    });
  }

  setIsShippingDifferent(value) {
    runInAction(() => {
      this.isShippingDifferent = value;
      this.updateCanProceedToPayment();
    });
  }
}

const MobxStore = new Store();
export default MobxStore;

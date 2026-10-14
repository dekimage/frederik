import { makeAutoObservable, runInAction } from "mobx";
import { db } from "./firebase";
import { getPdpQuote } from "@/lib/pricingCatalog";
import { isProductPublished } from "@/lib/productVisibility";
import {
  clampLineQuantity,
  MAX_LINE_QUANTITY,
  MAX_ORDER_TOTAL_QUANTITY,
  sumCartQuantities,
} from "@/lib/cartLimits";

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
      this.loadCartFromLocalStorage();
    }
    this.initializeShopConfig();
    this.fetchCategories();
  }

  /** Unit print price for cart line (PDP reference market). */
  deriveUnitPrintPriceFromCatalog(material, sizeKey) {
    const row = getPdpQuote(material, sizeKey);
    if (row && typeof row.priceExShipping === "number") {
      return Number(row.priceExShipping);
    }
    return NaN;
  }

  normalizeCartPayload(parsed) {
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && i.productId && i.sizeKey && i.material)
      .map((i) => {
        const catalogPrice = this.deriveUnitPrintPriceFromCatalog(
          i.material,
          i.sizeKey
        );
        const unit =
          Number.isFinite(catalogPrice) && catalogPrice > 0
            ? catalogPrice
            : typeof i.price === "number" && Number.isFinite(i.price)
              ? i.price
              : 0;
        return {
          productId: i.productId,
          quantity: clampLineQuantity(i.quantity),
          sizeKey: i.sizeKey,
          sizeRaw: i.sizeRaw,
          material: i.material,
          price: unit,
        };
      })
      .filter((i) => i.price > 0);
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
    try {
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        console.error("Product not found in Firestore");
        return null;
      }
      const merged = { id: productId, ...productSnap.data() };
      runInAction(() => {
        this.cachedProducts[productId] = merged;
      });
      return merged;
    } catch (error) {
      console.error(error);
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
      this.cachedProducts[product.id] = product;
    });
  }

  // Fetch limited products (e.g., for home page or shop)
  async fetchLimitedProducts() {
    const productsQuery = query(collection(db, "products"));

    const productsSnapshot = await getDocs(productsQuery);
    const productsList = productsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(isProductPublished)
      .slice(0, 10);

    runInAction(() => {
      this.cacheProducts(productsList); // Cache products
      this.fetchedApis.limitedProducts = true;
    });

    return productsList;
  }

  // Fetch all products
  async fetchAllProducts() {
    const productsQuery = query(collection(db, "products"));

    const productsSnapshot = await getDocs(productsQuery);
    const productsList = productsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(isProductPublished);

    runInAction(() => {
      this.cacheProducts(productsList); // Cache products
      this.fetchedApis.allProducts = true;
    });

    return productsList;
  }

  async fetchProductsByCategory(category) {
    const productQuery = query(
      collection(db, "products"),
      where("category", "==", category)
    );

    const productsSnapshot = await getDocs(productQuery);
    const productsList = productsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(isProductPublished);

    runInAction(() => {
      this.cacheProducts(productsList); // Cache products
      this.fetchedApis[category] = true;
    });

    return productsList;
  }

  async fetchBestSellers() {
    const bestSellerQuery = query(
      collection(db, "products"),
      where("bestseller", "==", true)
    );

    const bestSellersSnapshot = await getDocs(bestSellerQuery);
    const bestSellersList = bestSellersSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(isProductPublished);

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
        if (!isProductPublished(productData)) return null;
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
      const { productId, quantity, material } = cartItem;
      const sizeLabel = cartItem.sizeRaw ?? cartItem.size ?? cartItem.sizeKey;

      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      let product = null;
      if (productSnap.exists()) {
        product = { id: productId, ...productSnap.data() };
        if (!isProductPublished(product)) product = null;
        runInAction(() => {
          this.cachedProducts[productId] = product;
        });
      }

      // Ensure that we have the product data and then include size and quantity
      if (product) {
        products.push({
          ...product,
          quantity,
          size: sizeLabel,
          sizeRaw: cartItem.sizeRaw,
          sizeKey: cartItem.sizeKey,
          material,
          price: parseFloat(cartItem.price),
          productId,
        });
      }
    }

    return products;
  };

  // Add to cart (print price only; shipping added at checkout from address)
  addToCart(item) {
    const sizeKey = item.sizeKey;
    const requestedQty = clampLineQuantity(item.quantity);
    const existingItem = this.cartItems.find(
      (cartItem) =>
        cartItem.productId === item.productId &&
        cartItem.sizeKey === sizeKey &&
        cartItem.material === item.material
    );

    const otherTotal = sumCartQuantities(
      this.cartItems.filter((cartItem) => cartItem !== existingItem)
    );
    const maxForLine = Math.min(
      MAX_LINE_QUANTITY,
      MAX_ORDER_TOTAL_QUANTITY - otherTotal
    );

    if (maxForLine < 1) {
      return {
        ok: false,
        error: `Maximum ${MAX_ORDER_TOTAL_QUANTITY} items per order.`,
      };
    }

    if (existingItem) {
      existingItem.quantity = clampLineQuantity(
        existingItem.quantity + requestedQty
      );
      if (existingItem.quantity > maxForLine) {
        existingItem.quantity = maxForLine;
      }
    } else {
      this.cartItems.push({
        productId: item.productId,
        quantity: Math.min(requestedQty, maxForLine),
        sizeKey,
        sizeRaw: item.sizeRaw,
        material: item.material,
        price: item.price,
      });
    }

    this.saveCartToLocalStorage();
    return { ok: true };
  }

  // Update quantity of an item in the cart
  updateQuantity(productId, sizeKey, material, newQuantity) {
    const item = this.cartItems.find(
      (cartItem) =>
        cartItem.productId === productId &&
        cartItem.sizeKey === sizeKey &&
        cartItem.material === material
    );

    if (item) {
      const otherTotal = sumCartQuantities(
        this.cartItems.filter((cartItem) => cartItem !== item)
      );
      const maxForLine = Math.min(
        MAX_LINE_QUANTITY,
        MAX_ORDER_TOTAL_QUANTITY - otherTotal
      );
      item.quantity = clampLineQuantity(Math.min(newQuantity, maxForLine));
      this.saveCartToLocalStorage();
    }
  }
  // Remove from cart
  removeFromCart(productId, sizeKey, material) {
    this.cartItems = this.cartItems.filter(
      (item) =>
        !(
          item.productId === productId &&
          item.sizeKey === sizeKey &&
          item.material === material
        )
    );
    this.saveCartToLocalStorage();
  }

  // Load cart from localStorage
  async loadCartFromLocalStorage() {
    const cartData = localStorage.getItem("cart");
    if (!cartData) return;
    const parsed = JSON.parse(cartData);
    const normalized = this.normalizeCartPayload(parsed);
    runInAction(() => {
      this.cartItems = normalized;
    });
    if (Array.isArray(parsed) && normalized.length !== parsed.length) {
      this.saveCartToLocalStorage();
    }
    await this.fetchProductDetails();
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
    const subtotal = this.calculateSubtotal() || 0;
    return subtotal;
  }

  // Get total number of items in cart
  get cartItemsCount() {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }
  async fetchProductDetails() {
    const productIds = [...new Set(this.cartItems.map((item) => item.productId))];

    if (productIds.length === 0) {
      return;
    }

    const productDocs = await Promise.all(
      productIds.map(async (id) => {
        const productRef = doc(db, "products", id);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) return null;
        const product = { id, ...productSnap.data() };
        return isProductPublished(product) ? product : null;
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

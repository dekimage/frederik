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
  products = {};
  shippingCost = 25;
  loading = true;

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

    this.loadCartFromLocalStorage();
    // if (this.cartItems.length === 0) {
    //   this.initializeDummyData();
    // }
  }

  // Initialize cart with dummy data
  // initializeDummyData() {
  //   this.cartItems =
  //   this.saveCartToLocalStorage();
  // }

  // Add item to cart
  addToCart(item) {
    const existingItem = this.cartItems.find(
      (cartItem) => cartItem.productId === item.productId
    );
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.cartItems.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }
    this.saveCartToLocalStorage();
    this.fetchProductDetails(item.productId);
  }

  // Remove item from cart
  removeFromCart(productId) {
    this.cartItems = this.cartItems.filter(
      (item) => item.productId !== productId
    );
    delete this.products[productId]; // Remove cached product details
    this.saveCartToLocalStorage();
  }

  // Update quantity of an item in the cart
  updateQuantity(productId, newQuantity) {
    const item = this.cartItems.find(
      (cartItem) => cartItem.productId === productId
    );
    if (item) {
      runInAction(() => {
        item.quantity = newQuantity;
      });
    }
    this.saveCartToLocalStorage();
  }

  // Load cart from localStorage
  loadCartFromLocalStorage() {
    const cartData = localStorage.getItem("cart");
    if (cartData) {
      runInAction(() => {
        this.cartItems = JSON.parse(cartData);
        this.cartItems.forEach((item) =>
          this.fetchProductDetails(item.productId)
        );
        this.loading = false;
      });
    }
  }

  // Save cart to localStorage
  saveCartToLocalStorage() {
    localStorage.setItem("cart", JSON.stringify(this.cartItems));
  }

  // Fetch product details from Firestore and store in MobX
  async fetchProductDetails(productId) {
    if (this.products[productId]) return; // If already fetched, return early
    try {
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        runInAction(() => {
          this.products[productId] = productSnap.data();
        });
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  }

  // Calculate subtotal
  calculateSubtotal() {
    return this.cartItems.reduce((acc, item) => {
      const product = this.products[item.productId];
      return product ? acc + product.price * item.quantity : acc;
    }, 0);
  }

  // Calculate total
  calculateTotal() {
    return this.calculateSubtotal() + this.shippingCost;
  }

  // Get product details for rendering
  getCartProducts() {
    return this.cartItems.map((item) => ({
      ...this.products[item.productId],
      quantity: item.quantity,
    }));
  }

  // GLOBAL MOBX STATE
  setIsMobileOpen(isMobileOpen) {
    runInAction(() => {
      this.isMobileOpen = isMobileOpen;
    });
  }
}

const MobxStore = new Store();
export default MobxStore;

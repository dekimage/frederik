import { makeAutoObservable, runInAction } from "mobx";
import { auth, db } from "./firebase";

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
  cartItems = [
    {
      id: 1,
      name: "Canvas Print",
      price: 50,
      quantity: 1,
      image: "https://picsum.photos/100/100?random=1",
      variation: "24x36 Canvas",
    },
    {
      id: 2,
      name: "Framed Art",
      price: 80,
      quantity: 2,
      image: "https://picsum.photos/100/100?random=2",
      variation: "18x24 Framed",
    },
    {
      id: 3,
      name: "Digital Art",
      price: 30,
      quantity: 1,
      image: "https://picsum.photos/100/100?random=3",
      variation: "Digital Download",
    },
  ];
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
      (cartItem) =>
        cartItem.id === item.id && cartItem.variation === item.variation
    );
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.cartItems.push(item);
    }
    this.saveCartToLocalStorage();
  }

  // Remove item from cart
  removeFromCart(id) {
    this.cartItems = this.cartItems.filter((item) => item.id !== id);
    this.saveCartToLocalStorage();
  }

  // Update quantity of an item in the cart
  updateQuantity(id, newQuantity) {
    const item = this.cartItems.find((cartItem) => cartItem.id === id);
    if (item) {
      item.quantity = newQuantity;
    }
    this.saveCartToLocalStorage();
  }

  // Load cart from localStorage
  loadCartFromLocalStorage() {
    const cartData = localStorage.getItem("cart");
    if (cartData) {
      this.cartItems = JSON.parse(cartData);
    }
  }

  // Save cart to localStorage
  saveCartToLocalStorage() {
    localStorage.setItem("cart", JSON.stringify(this.cartItems));
  }

  // Calculate subtotal
  calculateSubtotal() {
    return this.cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
  }

  // Calculate total
  calculateTotal() {
    return this.calculateSubtotal() + this.shippingCost;
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

import { Injectable } from '@angular/core';
import { Cart } from 'src/app/models/cart';
import { BehaviorSubject, Observable } from 'rxjs'
import { Product } from 'src/app/models/product';
import { CartItem } from 'src/app/models/cartItem';

@Injectable({
  // Able to inject on root level
  providedIn: 'root'
})

export class CartService {

  private cart: Cart = this.getCartFromLocalStorage()
  // BehaviorSubject: acts as a single store to hold updated shared data
  private cartSubject: BehaviorSubject<Cart> = new BehaviorSubject(this.cart)
  
  constructor(){}

  getCartObservable(): Observable<Cart> {
    // We send it as observable instead of just subject, 
    // since we are able to manipulate subjects outside of the class
    return this.cartSubject.asObservable()
  }

  addToCart(product: Product, qty: number): void {

    const cartItemAlreadyExists = this.cart.items.find(cartItem => cartItem.product.id === product.id)

    if(cartItemAlreadyExists) {

      this.updateCartItemTotal(cartItemAlreadyExists.product.id, qty)
      
    } else {
      const newCartItem = new CartItem(product, qty)
      this.cart.items.push(newCartItem)
    }

    console.log("done adding to cart")

    this.setCartToLocalStorage()

  }

  updateCartItemTotal(productId: number, qty?: number):void {
    const cartItem = this.cart.items.find(cartItem => cartItem.product.id === productId)
        
    if (!cartItem) return;

    if(qty) cartItem.quantity += qty
    cartItem.updateTotalPrice()

    this.setCartToLocalStorage()
  }

  // private: The method is not accessible otuside of the class
  // i.e: we only use it inside
  private setCartToLocalStorage(): void {

    // Reduce loops through array
    // the function passed to reduce will be called for each item
    // 0 = default value for prevSum
    const newTotalCartPrice = this.cart.items
      .reduce((prevSum, currentItem) => prevSum + currentItem.totalPrice, 0)
    
    this.cart.totalPrice = newTotalCartPrice

    const newTotalCartQty = this.cart.items
      .reduce((prevSum, currentItem) => prevSum + currentItem.quantity, 0)

    this.cart.totalItems = newTotalCartQty

    const cartJson = JSON.stringify(this.cart)
    localStorage.setItem("Cart", cartJson)

    this.cartSubject.next(this.cart)
    console.log("done setting to local storage")

  }

  // private: The method is no accessible otuside of the class
    // i.e: we only use it inside
  private getCartFromLocalStorage():Cart {
    const cartJson = localStorage.getItem("Cart")

    if (cartJson) {
      const parsedCart = JSON.parse(cartJson);
      parsedCart.items = parsedCart.items.map((item: any) =>  new CartItem(item.product, item._quantity));
      
      return parsedCart;
    } else {
        return new Cart();    
    }
  }

  removeFromCart(id: number): void {
    this.cart = this.getCartFromLocalStorage()

    this.cart.items = this.cart.items
      .filter(item => item.product.id != id);

    this.setCartToLocalStorage();
  }

  getCartItemById(id: number) {
    const cartJson = localStorage.getItem("Cart")

    if (cartJson) {
        const parsedCart = JSON.parse(cartJson);
        const cartItem = parsedCart.items.find((i: CartItem) => i.product.id === id)

        if(!cartItem) return;
        return  new CartItem(cartItem.product, cartItem._quantity)
    }
    return undefined
  }
}

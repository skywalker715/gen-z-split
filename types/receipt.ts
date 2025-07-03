// Receipt item interface
export interface ReceiptItem {
  id: string
  name: string
  price: number
  assignments: { [personName: string]: number } // percentage (0-100)
}

// Person interface
export interface Person {
  name: string
}

// Receipt data interface
export interface ReceiptData {
  items: ReceiptItem[]
  subtotal: number
  tax: number
  total: number
}

// Sample receipt data for testing
export const SAMPLE_RECEIPT: ReceiptData = {
  items: [
    { id: "1", name: "Spinach Artichoke Dip", price: 12.99, assignments: {} },
    { id: "2", name: "Chicken Caesar Salad", price: 14.99, assignments: {} },
    { id: "3", name: "Margherita Pizza", price: 18.5, assignments: {} },
    { id: "4", name: "Grilled Salmon", price: 24.99, assignments: {} },
    { id: "5", name: "Coca Cola", price: 3.99, assignments: {} },
    { id: "6", name: "Craft Beer", price: 6.5, assignments: {} },
  ],
  subtotal: 81.96,
  tax: 6.97, // 8.5%
  total: 88.93,
} 
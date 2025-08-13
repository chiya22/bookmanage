
export interface Book {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  isRented: boolean;
  rentedBy?: string;
}

export interface RentalHistory {
  id: string;
  isbn: string;
  rentalDate: string;
  returnDate: string | null;
  renterName: string;
}

export interface InventoryCheckHistory {
  id: string;
  isbn: string;
  checkDate: string;
}
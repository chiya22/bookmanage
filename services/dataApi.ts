
import type { Book, RentalHistory, InventoryCheckHistory } from '../types';

// =================================================================
// API Simulation Layer (RESTful CRUD Style)
// =================================================================
// このレイヤーは、RESTfulなバックエンドAPIをlocalStorageでシミュレートします。
// 各関数は特定のAPIエンドポイントへのリクエストを模倣しています。
// 例: getBooks()は `GET /api/books` に相当します。

// バックエンドAPIのベースURL（例）
const API_BASE_URL = 'http://localhost:10000/api';

// const STORAGE_KEYS = {
//   BOOKS: 'books',
//   RENTAL_HISTORIES: 'rentalHistories',
//   INVENTORY_CHECK_HISTORIES: 'inventoryCheckHistories',
// };

// // --- Generic Helper Functions ---

// // ネットワークの遅延をシミュレート
// const simulateDelay = <T>(data: T): Promise<T> => {
//     return new Promise(resolve => {
//       setTimeout(() => resolve(data), 200);
//     });
// };

// const readStorage = <T>(key: string, defaultValue: T): T => {
//     const saved = localStorage.getItem(key);
//     return saved ? JSON.parse(saved) : defaultValue;
// }

// const writeStorage = <T>(key: string, data: T): void => {
//     localStorage.setItem(key, JSON.stringify(data));
// }

// --- Books API ---

export const getBooks = async (): Promise<Book[]> => {

     const response = await fetch(`${API_BASE_URL}/books`);
     if (!response.ok) throw new Error('Failed to fetch books');
     return response.json();

     // const books = readStorage<Book[]>(STORAGE_KEYS.BOOKS, []);
    // return simulateDelay(books);
};

export const createBook = async (bookData: Book): Promise<Book> => {

     const response = await fetch(`${API_BASE_URL}/books`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(bookData)
     });
     if (!response.ok) throw new Error('Failed to create book');
     return response.json();

    // const books = readStorage<Book[]>(STORAGE_KEYS.BOOKS, []);
    // const newBook: Book = { ...bookData }; 
    // books.push(newBook);
    // writeStorage(STORAGE_KEYS.BOOKS, books);
    // return simulateDelay(newBook);
};

export const updateBook = async (isbn: string, updates: Partial<Book>): Promise<Book> => {

    //  const response = await fetch(`${API_BASE_URL}/books/${isbn}`, {
     const response = await fetch(`${API_BASE_URL}/books/${isbn}`, {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(updates)
     });
     if (!response.ok) throw new Error('Failed to update book');
     return response.json();

     // const books = readStorage<Book[]>(STORAGE_KEYS.BOOKS, []);
    // const bookIndex = books.findIndex(b => b.isbn === isbn);
    // if (bookIndex === -1) {
    //     return Promise.reject(new Error("Book not found"));
    // }
    // const updatedBook = { ...books[bookIndex], ...updates };
    // books[bookIndex] = updatedBook;
    // writeStorage(STORAGE_KEYS.BOOKS, books);
    // return simulateDelay(updatedBook);
};

export const deleteBook = async (isbn: string): Promise<void> => {

    console.log(isbn);

     const response = await fetch(`${API_BASE_URL}/books/${isbn}`, {
       method: 'DELETE',
      });
     if (!response.ok) throw new Error('Failed to delete book');

     const responseInventoryCheckhistory = await fetch(`${API_BASE_URL}/inventoryCheckhistorys/${isbn}`, {
       method: 'DELETE', 
      });
    //  if (!responseInventoryCheckhistory.ok) throw new Error('Failed to delete inventoryCheckhistory');

     const responseRentalhistory = await fetch(`${API_BASE_URL}/rentalHistorys/${isbn}`, {
       method: 'DELETE',
     });
    //  if (!responseRentalhistory.ok) throw new Error('Failed to delete rentalHistory');

     return response.json();
     
    //  // カスケード削除: 書籍と関連する全ての履歴を削除
    // let books = readStorage<Book[]>(STORAGE_KEYS.BOOKS, []);
    // let rentalHistories = readStorage<RentalHistory[]>(STORAGE_KEYS.RENTAL_HISTORIES, []);
    // let inventoryChecks = readStorage<InventoryCheckHistory[]>(STORAGE_KEYS.INVENTORY_CHECK_HISTORIES, []);

    // books = books.filter(b => b.isbn !== isbn);
    // rentalHistories = rentalHistories.filter(h => h.isbn !== isbn);
    // inventoryChecks = inventoryChecks.filter(ic => ic.isbn !== isbn);

    // writeStorage(STORAGE_KEYS.BOOKS, books);
    // writeStorage(STORAGE_KEYS.RENTAL_HISTORIES, rentalHistories);
    // writeStorage(STORAGE_KEYS.INVENTORY_CHECK_HISTORIES, inventoryChecks);
    
    // return simulateDelay(undefined);
};


// --- Rental Histories API ---

export const getRentalHistories = async (): Promise<RentalHistory[]> => {

    const response = await fetch(`${API_BASE_URL}/rentalHistorys`);
     if (!response.ok) throw new Error('Failed to fetch rentalHistorys');
     return response.json();
    
    // const histories = readStorage<RentalHistory[]>(STORAGE_KEYS.RENTAL_HISTORIES, []);
    // return simulateDelay(histories);
};

export const createRentalHistory = async (rentalData: Omit<RentalHistory, 'id'>): Promise<RentalHistory> => {

    const response = await fetch(`${API_BASE_URL}/rentalHistorys`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(rentalData)
     });
     if (!response.ok) throw new Error('Failed to create rentalHistorys');
     return response.json();

    // const histories = readStorage<RentalHistory[]>(STORAGE_KEYS.RENTAL_HISTORIES, []);
    // const newHistory: RentalHistory = {
    //     id: Date.now().toString(),
    //     ...rentalData,
    // };
    // histories.push(newHistory);
    // writeStorage(STORAGE_KEYS.RENTAL_HISTORIES, histories);
    // return simulateDelay(newHistory);
};

export const updateRentalHistory = async (id: string, updates: Partial<RentalHistory>): Promise<RentalHistory> => {

     const response = await fetch(`${API_BASE_URL}/rentalHistorys/${id}`, {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(updates)
     });
     if (!response.ok) throw new Error('Failed to update rentalHistorys');
     return response.json();
    
    // const histories = readStorage<RentalHistory[]>(STORAGE_KEYS.RENTAL_HISTORIES, []);
    // const historyIndex = histories.findIndex(h => h.id === id);
    // if (historyIndex === -1) {
    //     return Promise.reject(new Error("Rental history not found"));
    // }
    // const updatedHistory = { ...histories[historyIndex], ...updates };
    // histories[historyIndex] = updatedHistory;
    // writeStorage(STORAGE_KEYS.RENTAL_HISTORIES, histories);
    // return simulateDelay(updatedHistory);
};


// --- Inventory Check Histories API ---

export const getInventoryCheckHistories = async (): Promise<InventoryCheckHistory[]> => {

    const response = await fetch(`${API_BASE_URL}/inventoryCheckHistorys`);
     if (!response.ok) throw new Error('Failed to fetch inventoryCheckHistorys');
     return response.json();
    
    // const histories = readStorage<InventoryCheckHistory[]>(STORAGE_KEYS.INVENTORY_CHECK_HISTORIES, []);
    // return simulateDelay(histories);
};

export const createInventoryCheck = async (checkData: { isbn: string, checkDate: string }): Promise<InventoryCheckHistory> => {

    const response = await fetch(`${API_BASE_URL}/inventoryCheckHistorys`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(checkData)
     });
     if (!response.ok) throw new Error('Failed to create inventoryCheckHistorys');
     return response.json();

    //  const histories = readStorage<InventoryCheckHistory[]>(STORAGE_KEYS.INVENTORY_CHECK_HISTORIES, []);
    // const newCheck: InventoryCheckHistory = {
    //     id: Date.now().toString(),
    //     isbn: checkData.isbn,
    //     checkDate: new Date().toISOString(),
    // };
    // // 新しい履歴を配列の先頭に追加
    // histories.unshift(newCheck); 
    // writeStorage(STORAGE_KEYS.INVENTORY_CHECK_HISTORIES, histories);
    // return simulateDelay(newCheck);
};

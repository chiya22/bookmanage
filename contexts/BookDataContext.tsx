import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import type { Book, RentalHistory, InventoryCheckHistory } from '../types';
import * as dataApi from '../services/dataApi';

interface BookDataContextType {
  books: Book[];
  rentalHistories: RentalHistory[];
  inventoryCheckHistories: InventoryCheckHistory[];
  addBook: (book: Book) => Promise<void>;
  removeBook: (isbn: string) => Promise<void>;
  rentBook: (isbn: string, renterName: string) => Promise<void>;
  returnBook: (isbn: string) => Promise<void>;
  addInventoryCheck: (isbn: string) => Promise<void>;
  findBook: (isbn: string) => Book | undefined;
  getRentalHistoryForBook: (isbn: string) => RentalHistory[];
  isLoading: boolean;
}

const BookDataContext = createContext<BookDataContextType | undefined>(undefined);

const normalizeISBN = (isbn: string): string => {
    return isbn.replace(/-/g, '').trim();
}

export const BookDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [rentalHistories, setRentalHistories] = useState<RentalHistory[]>([]);
  const [inventoryCheckHistories, setInventoryCheckHistories] = useState<InventoryCheckHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // コンポーネントのマウント時にAPIから初期データを取得
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [
          loadedBooks,
          loadedRentalHistories,
          loadedInventoryCheckHistories
        ] = await Promise.all([
          dataApi.getBooks(),
          dataApi.getRentalHistories(),
          dataApi.getInventoryCheckHistories(),
        ]);
        setBooks(loadedBooks);
        setRentalHistories(loadedRentalHistories);
        setInventoryCheckHistories(loadedInventoryCheckHistories);
      } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const addBook = useCallback(async (book: Book) => {
    const normalizedIsbn = normalizeISBN(book.isbn);
    if (books.some(b => normalizeISBN(b.isbn) === normalizedIsbn)) {
        alert('この書籍は既に登録されています。');
        return;
    }
    const newBook = await dataApi.createBook({ ...book, isbn: normalizedIsbn });
    setBooks(prevBooks => [...prevBooks, newBook]);
  }, [books]);

  const removeBook = useCallback(async (isbn: string) => {
      const normalizedIsbn = normalizeISBN(isbn);
      await dataApi.deleteBook(normalizedIsbn);
      
      // APIでの削除成功後、ローカルステートを更新
      setBooks(prev => prev.filter(b => normalizeISBN(b.isbn) !== normalizedIsbn));
      setRentalHistories(prev => prev.filter(h => normalizeISBN(h.isbn) !== normalizedIsbn));
      setInventoryCheckHistories(prev => prev.filter(h => normalizeISBN(h.isbn) !== normalizedIsbn));
  }, []);

  const rentBook = useCallback(async (isbn: string, renterName: string) => {
    const normalizedIsbn = normalizeISBN(isbn);
    
    // 1. 新しい貸出履歴を作成
    const newHistoryEntry = await dataApi.createRentalHistory({
        isbn: normalizedIsbn,
        rentalDate: new Date().toISOString(),
        returnDate: null,
        renterName,
    });
    
    // 2. 書籍の状態を更新
    const updatedBook = await dataApi.updateBook(normalizedIsbn, { isRented: true, rentedBy: renterName });

    // 3. ローカルステートを更新
    setBooks(prevBooks => prevBooks.map(b => (normalizeISBN(b.isbn) === normalizedIsbn ? updatedBook : b)));
    setRentalHistories(prevHistories => [...prevHistories, newHistoryEntry]);

  }, []);

  const returnBook = useCallback(async (isbn: string) => {
    const normalizedIsbn = normalizeISBN(isbn);
    
    // 貸出中の履歴を検索
    const activeHistory = rentalHistories.find(h => normalizeISBN(h.isbn) === normalizedIsbn && h.returnDate === null);
    
    // 1. 書籍の状態を更新
    const updatedBook = await dataApi.updateBook(normalizedIsbn, { isRented: false, rentedBy: undefined });
    setBooks(prevBooks => prevBooks.map(b => (normalizeISBN(b.isbn) === normalizedIsbn ? updatedBook : b)));

    // 2. 履歴の状態を更新 (もしあれば)
    if (activeHistory) {
        const updatedHistory = await dataApi.updateRentalHistory(activeHistory.id, { returnDate: new Date().toISOString() });
        setRentalHistories(prevHistories => prevHistories.map(h => h.id === activeHistory.id ? updatedHistory : h));
    } else {
        console.warn("返却対象の貸出履歴が見つかりませんでした。書籍の状態のみ更新します。");
    }
  }, [rentalHistories]);
  
  const addInventoryCheck = useCallback(async (isbn: string) => {
    const normalizedIsbn = normalizeISBN(isbn);
    const newCheck = await dataApi.createInventoryCheck({ 
      isbn: normalizedIsbn,
      checkDate: new Date().toISOString(),
    });
    
    setInventoryCheckHistories(prevChecks => [newCheck, ...prevChecks]);
  }, []);

  const findBook = useCallback((isbn: string) => {
    const normalizedIsbn = normalizeISBN(isbn);
    return books.find(b => normalizeISBN(b.isbn) === normalizedIsbn);
  }, [books]);
  
  const getRentalHistoryForBook = useCallback((isbn: string) => {
    const normalizedIsbn = normalizeISBN(isbn);
    return rentalHistories.filter(h => normalizeISBN(h.isbn) === normalizedIsbn).sort((a, b) => new Date(b.rentalDate).getTime() - new Date(a.rentalDate).getTime());
  }, [rentalHistories]);

  const value = useMemo(() => ({
    books,
    rentalHistories,
    inventoryCheckHistories,
    addBook,
    removeBook,
    rentBook,
    returnBook,
    addInventoryCheck,
  findBook,
    getRentalHistoryForBook,
    isLoading
  }), [books, rentalHistories, inventoryCheckHistories, addBook, removeBook, rentBook, returnBook, addInventoryCheck, findBook, getRentalHistoryForBook, isLoading]);

  return <BookDataContext.Provider value={value}>{children}</BookDataContext.Provider>;
};

export const useBookData = () => {
  const context = useContext(BookDataContext);
  if (context === undefined) {
    throw new Error('useBookDataはBookDataProvider内で使用する必要があります');
  }
  return context;
};
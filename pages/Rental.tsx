import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useBookData } from '../contexts/BookDataContext';
import type { Book } from '../types';
import { ArrowPathIcon, InformationCircleIcon } from '../components/icons';

const BookCard: React.FC<{ 
  book: Book, 
  onRent: () => void, 
  onReturn: () => void,
  renterName: string,
  setRenterName: (name: string) => void,
  renterNameInputRef: React.RefObject<HTMLInputElement>
}> = ({ book, onRent, onReturn, renterName, setRenterName, renterNameInputRef }) => {
  const { getRentalHistoryForBook } = useBookData();
  const history = getRentalHistoryForBook(book.isbn);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6 animate-fade-in">
      <div>
        <h3 className="text-2xl font-bold text-yamori-dark">{book.title}</h3>
        <p className="text-gray-600 mt-1">{book.author}</p>
        <p className="text-sm text-gray-500">{book.publisher}</p>
        <p className="text-sm text-gray-500">ISBN: {book.isbn}</p>
        
        <div className={`mt-4 px-3 py-1.5 inline-block rounded-full text-sm font-semibold ${
          book.isRented ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {book.isRented ? '貸出中' : '貸出可能'}
        </div>
        
        {book.isRented && book.rentedBy && (
          <p className="mt-2 text-sm text-gray-600">貸出先: <span className="font-semibold">{book.rentedBy}</span></p>
        )}

        <div className="mt-4 space-y-4">
          {!book.isRented && (
            <div>
              <label htmlFor="renterName" className="block text-sm font-medium text-yamori-dark">貸出先</label>
              <input
                ref={renterNameInputRef}
                id="renterName"
                type="text"
                value={renterName}
                onChange={(e) => setRenterName(e.target.value)}
                placeholder="山田 太郎"
                required
                className="mt-1 w-full max-w-xs p-2 border border-gray-300 rounded-md shadow-sm focus:ring-yamori-accent focus:border-yamori-accent transition bg-gray-50"
              />
            </div>
          )}

          <div className="flex space-x-4">
              <button
              onClick={onRent}
              disabled={book.isRented || !renterName.trim()}
              className="px-6 py-3 bg-yamori-accent text-white font-semibold rounded-md shadow-sm hover:bg-yamori-accent-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
              貸出
              </button>
              <button
              onClick={onReturn}
              disabled={!book.isRented}
              className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-md shadow-sm hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
              返却
              </button>
          </div>
        </div>
      </div>
       {history.length > 0 && (
         <div className="mt-6 border-t pt-4">
           <h4 className="font-bold text-yamori-dark">貸出履歴</h4>
           <ul className="mt-2 space-y-2 text-sm max-h-40 overflow-y-auto">
             {history.map(h => (
               <li key={h.id} className="p-2 bg-gray-50 rounded-md">
                 貸出: {new Date(h.rentalDate).toLocaleDateString()} by <span className="font-semibold">{h.renterName}</span> | 返却: {h.returnDate ? new Date(h.returnDate).toLocaleDateString() : '未返却'}
               </li>
             ))}
           </ul>
         </div>
       )}
    </div>
  );
};


const Rental: React.FC = () => {
  const [isbn, setIsbn] = useState('');
  const [searchedBook, setSearchedBook] = useState<Book | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { findBook, rentBook, returnBook, books, rentalHistories, isLoading: isDataLoading } = useBookData();
  const isbnInputRef = useRef<HTMLInputElement>(null);
  const renterNameInputRef = useRef<HTMLInputElement>(null);
  const [renterName, setRenterName] = useState('');

  useEffect(() => {
    isbnInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (searchedBook && !searchedBook.isRented) {
      const timer = setTimeout(() => {
        renterNameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchedBook]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const codeToSearch = isbn.trim();
    if (!codeToSearch) return;
    
    setIsLoading(true);
    setSearchedBook(null);
    setMessage('');
    setRenterName('');
    setIsbn(''); // 検索開始直後に入力フィールドをクリア

    setTimeout(() => { 
        const book = findBook(codeToSearch);
        if (book) {
            setSearchedBook(book);
        } else {
            setMessage(`ISBN「${codeToSearch}」の書籍は登録されていません。管理画面で登録してください。`);
        }
        setIsLoading(false);
        isbnInputRef.current?.focus();
    }, 500);
  }, [isbn, findBook]);
  
  const handleRent = useCallback(async () => {
    if (searchedBook && renterName.trim()) {
      await rentBook(searchedBook.isbn, renterName.trim());
      setSearchedBook(prev => prev ? { ...prev, isRented: true, rentedBy: renterName.trim() } : null);
      setMessage(`「${searchedBook.title}」を ${renterName.trim()} さんに貸し出しました。`);
      setRenterName('');
      isbnInputRef.current?.focus();
    }
  }, [searchedBook, rentBook, renterName]);
  
  const handleReturn = useCallback(async () => {
    if (searchedBook) {
      await returnBook(searchedBook.isbn);
      setSearchedBook(prev => prev ? { ...prev, isRented: false, rentedBy: undefined } : null);
      setMessage(`「${searchedBook.title}」を返却しました。`);
      isbnInputRef.current?.focus();
    }
  }, [searchedBook, returnBook]);

  const rentedBooks = useMemo(() => {
    return books
      .filter(book => book.isRented)
      .map(book => {
        const history = rentalHistories
          .filter(h => h.isbn === book.isbn && h.returnDate === null)
          .sort((a, b) => new Date(b.rentalDate).getTime() - new Date(a.rentalDate).getTime())[0];
        return {
          ...book,
          rentalDate: history?.rentalDate,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [books, rentalHistories]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-yamori-dark">貸出 / 返却</h2>
        <p className="mt-1 text-gray-600">貸出または返却する書籍のISBNコードを入力してください。</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 items-center">
        <input
          ref={isbnInputRef}
          type="text"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          placeholder="ISBNコードを入力"
          className="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-yamori-accent focus:border-yamori-accent transition bg-white text-yamori-text"
        />
        <button
          type="submit"
          disabled={isLoading || !isbn}
          className="px-6 py-3 bg-yamori-dark text-white font-semibold rounded-md shadow-sm hover:bg-black disabled:bg-gray-400 flex items-center gap-2 transition-colors"
        >
          {isLoading && <ArrowPathIcon className="animate-spin w-5 h-5" />}
          検索
        </button>
      </form>
      
      {message && (
        <div className={`p-4 rounded-md flex items-center gap-3 ${searchedBook ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
          <InformationCircleIcon className="w-6 h-6"/>
          <p>{message}</p>
        </div>
      )}

      {searchedBook && <BookCard book={searchedBook} onRent={handleRent} onReturn={handleReturn} renterName={renterName} setRenterName={setRenterName} renterNameInputRef={renterNameInputRef} />}

      <div className="pt-4">
        <h3 className="text-xl font-bold text-yamori-dark">現在貸出中の書籍一覧</h3>
        <div className="mt-4 bg-white rounded-lg shadow-md overflow-hidden">
          {isDataLoading ? (
             <p className="p-6 text-center text-gray-500">貸出データを読み込み中...</p>
          ) : rentedBooks.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {rentedBooks.map(book => (
                <li key={book.isbn} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-yamori-dark">{book.title}</p>
                    <p className="text-sm text-gray-600">{book.author}</p>
                    <p className="text-xs text-gray-500">{book.publisher}</p>
                    <p className="text-xs text-gray-400 mt-1">ISBN: {book.isbn}</p>
                  </div>
                  <div className="text-sm text-gray-600 text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0">
                    <div>
                      <p>貸出先:</p>
                      <p className="font-semibold text-yamori-text">{book.rentedBy || '不明'}</p>
                    </div>
                    {book.rentalDate && (
                      <div className="mt-2">
                         <p>貸出日時:</p>
                         <p className="font-semibold text-yamori-text">{new Date(book.rentalDate).toLocaleString('ja-JP')}</p>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-center text-gray-500">現在貸出中の書籍はありません。</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rental;
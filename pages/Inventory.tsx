import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useBookData } from '../contexts/BookDataContext';
import { InformationCircleIcon, CheckCircleIcon } from '../components/icons';

const Inventory: React.FC = () => {
  const [isbn, setIsbn] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const { books, findBook, addInventoryCheck, inventoryCheckHistories, rentalHistories, isLoading: isDataLoading } = useBookData();
  const isbnInputRef = useRef<HTMLInputElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    isbnInputRef.current?.focus();
  }, []);

  const handleCheck = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const codeToCheck = isbn.trim();
    if (!codeToCheck) return;

    const book = findBook(codeToCheck);
    if (book) {
      await addInventoryCheck(codeToCheck);
      setMessage({type: 'success', text: `在庫確認: 「${book.title}」(ISBN: ${codeToCheck}) の在庫を記録しました。`});
    } else {
      setMessage({type: 'error', text: `ISBN「${codeToCheck}」の書籍は登録されていません。`});
    }
    setIsbn('');
    isbnInputRef.current?.focus();
  }, [isbn, findBook, addInventoryCheck]);

  const sortedBooks = useMemo(() => {
    const enrichedBooks = books.map(book => {
      // The histories are sorted newest first, so the first one we find is the latest.
      const lastCheck = inventoryCheckHistories.find(h => h.isbn === book.isbn);
      
      let currentRentalInfo = null;
      if (book.isRented) {
        const bookRentalHistories = rentalHistories
          .filter(h => h.isbn === book.isbn && h.returnDate === null)
          .sort((a, b) => new Date(b.rentalDate).getTime() - new Date(a.rentalDate).getTime());
        
        if (bookRentalHistories.length > 0) {
          currentRentalInfo = bookRentalHistories[0];
        }
      }

      return { 
        ...book, 
        lastCheckDate: lastCheck?.checkDate,
        currentRentalInfo
      };
    });

    return enrichedBooks.sort((a, b) => {
      // Unchecked books first
      if (!a.lastCheckDate && !b.lastCheckDate) return 0;
      if (!a.lastCheckDate) return -1;
      if (!b.lastCheckDate) return 1;

      // Then sort by date, ascending (oldest first)
      return new Date(a.lastCheckDate).getTime() - new Date(b.lastCheckDate).getTime();
    });
  }, [books, inventoryCheckHistories, rentalHistories]);

  const totalPages = useMemo(() => Math.ceil(sortedBooks.length / itemsPerPage), [sortedBooks.length]);

  // Effect to adjust currentPage if it becomes invalid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedBooks = useMemo(() => sortedBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ), [sortedBooks, currentPage]);

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          前へ
        </button>
        <span className="text-sm text-gray-700">
          全 {totalPages} ページ中 {currentPage} ページ目
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          次へ
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-yamori-dark">在庫チェック</h2>
        <p className="mt-1 text-gray-600">在庫を確認する書籍のISBNコードを入力し、在庫チェックボタンをクリックしてください。</p>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2 items-center">
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
          disabled={!isbn}
          className="px-6 py-3 bg-yamori-accent text-white font-semibold rounded-md shadow-sm hover:bg-yamori-accent-dark disabled:bg-gray-400 flex items-center gap-2 transition-colors"
        >
          <CheckCircleIcon />
          在庫チェック
        </button>
      </form>

      {message && (
        <div className={`p-4 rounded-md flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 
            message.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
          <InformationCircleIcon className="w-6 h-6"/>
          <p>{message.text}</p>
        </div>
      )}
      
      <div className="mt-8">
        <h3 className="text-xl font-bold text-yamori-dark">在庫状況一覧</h3>
        <div className="mt-4 bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {isDataLoading ? (
                <p className="p-4 text-center text-gray-500">在庫データを読み込み中...</p>
            ) : paginatedBooks.length > 0 ? paginatedBooks.map(book => (
              <li key={book.isbn} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div>
                    <p className="font-bold text-yamori-dark">{book.title}</p>
                    <p className="text-sm text-gray-600">{book.author}</p>
                    <p className="text-xs text-gray-500">{book.publisher}</p>
                    <p className="text-xs text-gray-400 mt-1">ISBN: {book.isbn}</p>
                    {book.isRented ? (
                      <div className="mt-1">
                        <span className="px-2 py-0.5 inline-block rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          貸出中
                        </span>
                        {book.currentRentalInfo ? (
                          <div className="mt-1.5 text-xs text-gray-700 bg-red-50 p-2 rounded-md border border-red-100 space-y-1">
                            <p><strong className="font-semibold text-gray-800">貸出先:</strong> {book.currentRentalInfo.renterName}</p>
                            <p><strong className="font-semibold text-gray-800">貸出日時:</strong> {new Date(book.currentRentalInfo.rentalDate).toLocaleString('ja-JP')}</p>
                          </div>
                        ) : (
                          book.rentedBy && <p className="mt-1 text-xs text-gray-600"><strong className="font-semibold">貸出先:</strong> {book.rentedBy}</p>
                        )}
                      </div>
                    ) : (
                      <span className="mt-1 px-2 py-0.5 inline-block rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        在庫あり
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600 text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0">
                  <p>最終チェック</p>
                  <p className={`font-semibold ${book.lastCheckDate ? 'text-yamori-text' : 'text-orange-500'}`}>
                    {book.lastCheckDate ? new Date(book.lastCheckDate).toLocaleString('ja-JP') : '未チェック'}
                  </p>
                </div>
              </li>
            )) : (
              <p className="p-4 text-center text-gray-500">登録されている書籍はありません。</p>
            )}
          </ul>
          <PaginationControls />
        </div>
      </div>

    </div>
  );
};

export default Inventory;
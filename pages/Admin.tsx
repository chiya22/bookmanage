import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useBookData } from '../contexts/BookDataContext';
import { fetchBookOrMagazineInfo } from '../services/bookApi';
import type { Book } from '../types';
import { ArrowPathIcon, TrashIcon, InformationCircleIcon } from '../components/icons';

const Admin: React.FC = () => {
  const [isbn, setIsbn] = useState('');
  const [searchedBook, setSearchedBook] = useState<Book | null>(null);
  const [manualBook, setManualBook] = useState<Partial<Book> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const { books, addBook, removeBook, findBook, isLoading: isDataLoading } = useBookData();
  const isbnInputRef = useRef<HTMLInputElement>(null);

  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    isbnInputRef.current?.focus();
  }, []);
  
  const resetSearchState = () => {
      setSearchMessage('');
      setSearchedBook(null);
      setManualBook(null);
  };

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    resetSearchState();
    const codeToSearch = isbn.trim();
    if (!codeToSearch) {
        setIsLoading(false);
        return;
    }

    try {
      const existingBook = findBook(codeToSearch);
      if (existingBook) {
        setSearchMessage('この書籍・雑誌は既に登録されています。');
        return;
      }

      const bookInfo = await fetchBookOrMagazineInfo(codeToSearch);
      if (bookInfo) {
        setSearchedBook(bookInfo);
      } else {
        setSearchMessage(`「${codeToSearch}」の情報が見つかりませんでした。以下に情報を手動で入力して登録できます。`);
        setManualBook({
            isbn: codeToSearch,
            title: '',
            author: '',
            publisher: '',
            isRented: false
        });
      }
    } finally {
      setIsLoading(false);
      setIsbn('');
      isbnInputRef.current?.focus();
    }
  }, [isbn, findBook]);
  
  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!manualBook) return;
      const { name, value } = e.target;
      setManualBook(prev => prev ? { ...prev, [name]: value } : null);
  }

  const handleAddBook = useCallback(async (bookToAdd: Book) => {
    await addBook(bookToAdd);
    setSearchMessage(`「${bookToAdd.title}」を登録しました。`);
    resetSearchState();
    isbnInputRef.current?.focus();
  }, [addBook]);
  
  const handleRemoveBook = useCallback(async (book: Book) => {
    await removeBook(book.isbn);
    setSearchMessage(`「${book.title}」を削除しました。`);
    resetSearchState();
  }, [removeBook]);

  // Memoize filtered, sorted, and paginated data
  const filteredAndSortedBooks = useMemo(() => {
    return [...books]
      .filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.title.localeCompare(b.title, 'ja'));
  }, [books, searchTerm]);
  
  const totalPages = useMemo(() => Math.ceil(filteredAndSortedBooks.length / itemsPerPage), [filteredAndSortedBooks.length]);

  // Effect to reset page number when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Effect to adjust currentPage if it becomes invalid (e.g., after deleting books)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);
  
  const paginatedBooks = useMemo(() => filteredAndSortedBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ), [filteredAndSortedBooks, currentPage]);

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
  
  let messageClass = 'bg-yellow-100 text-yellow-800'; // Default to warning
  if (searchMessage.includes('登録しました') || searchMessage.includes('削除しました')) {
      messageClass = 'bg-green-100 text-green-800'; // Success
  } else if (searchMessage.includes('登録されています')) {
      messageClass = 'bg-blue-100 text-blue-800'; // Info
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-yamori-dark">書籍管理</h2>
        <p className="mt-1 text-gray-600">新しい書籍を登録したり、既存の書籍を削除します。</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-yamori-dark">ISBN/JANで検索して登録</h3>
        <form onSubmit={handleSearch} className="flex gap-2 items-center mt-4">
          <input
            ref={isbnInputRef}
            type="text"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            placeholder="ISBN/JANコードで検索"
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

        {searchMessage && (
            <div className={`mt-4 p-3 rounded-md flex items-center gap-2 ${messageClass}`}>
                <InformationCircleIcon className="w-5 h-5"/>
                <span>{searchMessage}</span>
            </div>
        )}

        {searchedBook && (
          <div className="mt-6 border-t pt-6 animate-fade-in">
            <div>
              <h4 className="text-xl font-bold">{searchedBook.title}</h4>
              <p className="text-gray-600">{searchedBook.author}</p>
              <p className="text-sm text-gray-500">{searchedBook.publisher}</p>
              <p className="text-sm text-gray-500 mt-1">ISBN/JAN: {searchedBook.isbn}</p>
              <button
                onClick={() => handleAddBook(searchedBook)}
                className="mt-4 px-4 py-2 bg-yamori-accent text-white font-semibold rounded-md shadow-sm hover:bg-yamori-accent-dark transition-colors"
              >
                この書籍を登録する
              </button>
            </div>
          </div>
        )}
        
        {manualBook && (
            <div className="mt-6 border-t pt-6 animate-fade-in">
                <h4 className="text-lg font-bold text-yamori-dark">書籍情報を手動で入力</h4>
                <p className="text-sm text-gray-500 mt-1">ISBN/JAN: <span className="font-mono">{manualBook.isbn}</span></p>
                <form onSubmit={(e) => { e.preventDefault(); handleAddBook(manualBook as Book);}} className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">タイトル <span className="text-red-500">*</span></label>
                        <input type="text" id="title" name="title" value={manualBook.title} onChange={handleManualInputChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-yamori-accent focus:border-yamori-accent transition bg-gray-50"/>
                    </div>
                     <div>
                        <label htmlFor="author" className="block text-sm font-medium text-gray-700">著者 / 号数</label>
                        <input type="text" id="author" name="author" value={manualBook.author} onChange={handleManualInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-yamori-accent focus:border-yamori-accent transition bg-gray-50"/>
                    </div>
                     <div>
                        <label htmlFor="publisher" className="block text-sm font-medium text-gray-700">出版社</label>
                        <input type="text" id="publisher" name="publisher" value={manualBook.publisher} onChange={handleManualInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-yamori-accent focus:border-yamori-accent transition bg-gray-50"/>
                    </div>
                    <button type="submit" disabled={!manualBook.title} className="px-4 py-2 bg-yamori-accent text-white font-semibold rounded-md shadow-sm hover:bg-yamori-accent-dark disabled:bg-gray-300 transition-colors">
                        手動で登録する
                    </button>
                </form>
            </div>
        )}
      </div>
      
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-xl font-bold text-yamori-dark">登録済み書籍一覧</h3>
            <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg aria-hidden="true" className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>
                </div>
                <input
                    type="text"
                    placeholder="書籍名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-yamori-accent focus:border-yamori-accent transition bg-white text-yamori-text"
                    aria-label="登録済み書籍を検索"
                />
            </div>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {isDataLoading ? (
               <p className="p-4 text-center text-gray-500">データを読み込み中...</p>
            ) : paginatedBooks.length > 0 ? paginatedBooks.map(book => (
              <li key={book.isbn} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div>
                    <p className="font-bold text-yamori-dark">{book.title}</p>
                    <p className="text-sm text-gray-600">{book.author}</p>
                    <p className="text-xs text-gray-500">{book.publisher}</p>
                    <p className="text-xs text-gray-400 mt-1">ISBN: {book.isbn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <span className={`px-2 py-1 inline-block rounded-full text-xs font-semibold ${
                        book.isRented ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {book.isRented ? '貸出中' : '在庫あり'}
                    </span>
                    <button
                        onClick={() => handleRemoveBook(book)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                        aria-label="削除"
                    >
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
              </li>
            )) : (
              <p className="p-4 text-center text-gray-500">
                {searchTerm ? `「${searchTerm}」に一致する書籍はありません。` : '登録されている書籍はありません。'}
              </p>
            )}
          </ul>
          <PaginationControls />
        </div>
      </div>
    </div>
  );
};

export default Admin;
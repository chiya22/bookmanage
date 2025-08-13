
import { GoogleGenAI } from "@google/genai";
import type { Book } from '../types';

// Gemini AIクライアントの初期化 (APIキーは環境変数から取得)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


const normalizeCode = (code: string): string => {
  return code.replace(/-/g, '').trim();
}

const fetchBookInfoFromGoogleBooks = async (isbn: string): Promise<Book | null> => {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    if (!response.ok) {
      throw new Error('Google Books APIからのレスポンスが異常です。');
    }
    const data = await response.json();

    if (data.totalItems === 0 || !data.items) {
      console.warn("Google Books APIで書籍が見つかりませんでした。ISBN:", isbn);
      return null;
    }

    const bookInfo = data.items[0].volumeInfo;
    const title = bookInfo.title || '';
    const authors = bookInfo.authors || [];
    const publisher = bookInfo.publisher || '';
    
    if (!title) {
        console.warn("Google Books APIのレスポンスにタイトルが含まれていません。ISBN:", isbn);
        return null;
    }
      
    return {
      isbn: normalizeCode(isbn),
      title,
      author: authors.join(', '),
      publisher,
      isRented: false,
    };
  } catch (error) {
    console.error("Google Books APIによる書籍情報の取得に失敗しました:", error);
    return null;
  }
};


const fetchMagazineInfoByGemini = async (jan: string): Promise<Book | null> => {
    try {
        const prompt = `日本の雑誌に関するJANコード「${jan}」の情報を、JPO（日本雑誌協会）の雑誌コード検索システムやWeb上の公開情報から検索してください。
以下の形式で、各項目を改行で区切って回答してください。

タイトル: (ここに雑誌の正式名称)
出版社: (ここに雑誌の出版社名)
号数: (ここに雑誌の発行年、月号、または号数。例: '2024年8月号')

もし情報が見つからない場合は、「情報が見つかりません」というテキストのみを返してください。`;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = result.text.trim();

        if (text.includes("情報が見つかりません")) {
            return null;
        }

        const lines = text.split('\n');
        const magazineData: { title?: string; publisher?: string; author?: string } = {};
        
        lines.forEach(line => {
            if (line.startsWith('タイトル:')) {
                magazineData.title = line.replace('タイトル:', '').trim();
            } else if (line.startsWith('出版社:')) {
                magazineData.publisher = line.replace('出版社:', '').trim();
            } else if (line.startsWith('号数:')) {
                magazineData.author = line.replace('号数:', '').trim();
            }
        });

        if (!magazineData.title || !magazineData.publisher || !magazineData.author) {
            console.warn("Geminiからのレスポンスに必要な情報が含まれていません。", text);
            return null;
        }

        return {
            isbn: jan, // JANコードをISBNフィールドに保存
            title: magazineData.title,
            author: magazineData.author, // 号数などをauthorフィールドに保存
            publisher: magazineData.publisher,
            isRented: false,
        };

    } catch (error) {
        console.error("Geminiによる雑誌情報の取得またはパースに失敗しました:", error);
        return null;
    }
};

export const fetchBookOrMagazineInfo = async (code: string): Promise<Book | null> => {
  const normalizedCode = normalizeCode(code);

  if (normalizedCode.startsWith('491') && normalizedCode.length === 13) {
    return await fetchMagazineInfoByGemini(normalizedCode);
  } else {
    return await fetchBookInfoFromGoogleBooks(normalizedCode);
  }
};
'use client';
import { DataModel, DataSource, DataSourceCache } from '@toolpad/core/Crud';
import { z } from 'zod';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export interface Book extends DataModel {
  id: string;
  class_number: string;
  author_notation: string;
  copyright_year: number;
  copy: number;
  ris_number: number;
  date_added: string;
  remarks: string;
  ddc: string;
}

// Initial data for local testing (optional)
const INITIAL_BOOKS_STORE: Book[] = [
  {
    id: 'sample1',
    class_number: '1.307973',
    author_notation: 'W15',
    copyright_year: 2018,
    copy: 1,
    ris_number: 1017,
    date_added: new Date().toISOString(),
    remarks: '',
    ddc: '000'
  },
];

// Firebase collection reference
const booksCollectionRef = collection(db, 'books');

export const booksDataSource: DataSource<Book> = {
  fields: [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'class_number', headerName: 'Class Number', width: 140 },
    { field: 'author_notation', headerName: 'Author Notation', width: 140 },
    { field: 'copyright_year', headerName: 'Copyright Year', type: 'number', width: 140 },
    { field: 'copy', headerName: 'Copy', type: 'number', width: 80 },
    { field: 'ris_number', headerName: 'RIS Number', type: 'number', width: 120 },
    {
      field: 'date_added',
      headerName: 'Date Added',
      type: 'date',
      valueGetter: (value: string) => value && new Date(value),
      width: 160,
    },
    { field: 'remarks', headerName: 'Remarks', width: 200 },
    { field: 'ddc', headerName: 'DDC', width: 100 },
  ],
  getMany: async ({ paginationModel, filterModel, sortModel }) => {
    try {
      // Get all books from Firestore
      const querySnapshot = await getDocs(booksCollectionRef);
      console.log('Firestore snapshot docs count:', querySnapshot.docs.length);
      let books = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];
      console.log('Processed books from Firestore:', books)

      // Apply filters
      if (filterModel?.items?.length) {
        filterModel.items.forEach(({ field, value, operator }) => {
          if (!field || value == null) {
            return;
          }

          books = books.filter((book) => {
            const bookValue = book[field];

            switch (operator) {
              case 'contains':
                return String(bookValue).toLowerCase().includes(String(value).toLowerCase());
              case 'equals':
                return bookValue === value;
              case 'startsWith':
                return String(bookValue).toLowerCase().startsWith(String(value).toLowerCase());
              case 'endsWith':
                return String(bookValue).toLowerCase().endsWith(String(value).toLowerCase());
              case '>':
                return (bookValue as number) > value;
              case '<':
                return (bookValue as number) < value;
              default:
                return true;
            }
          });
        });
      }

      // Apply sorting
      if (sortModel?.length) {
        books.sort((a, b) => {
          for (const { field, sort } of sortModel) {
            if (String(a[field]) < String(b[field])) {
              return sort === 'asc' ? -1 : 1;
            }
            if (String(a[field]) > String(b[field])) {
              return sort === 'asc' ? 1 : -1;
            }
          }
          return 0;
        });
      }

      // Apply pagination
      const start = paginationModel.page * paginationModel.pageSize;
      const end = start + paginationModel.pageSize;
      const paginatedBooks = books.slice(start, end);

      return {
        items: paginatedBooks,
        itemCount: books.length,
      };
    } catch (error) {
      console.error('Error fetching books:', error);
      return {
        items: [],
        itemCount: 0,
      };
    }
  },
  getOne: async (bookId) => {
    try {
      const docRef = doc(db, 'books', bookId as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Book;
      } else {
        throw new Error('Book not found');
      }
    } catch (error) {
      console.error('Error fetching book:', error);
      throw error;
    }
  },
  createOne: async (data) => {
    try {
      const docRef = await addDoc(booksCollectionRef, data);
      return {
        id: docRef.id,
        ...data
      } as Book;
    } catch (error) {
      console.error('Error creating book:', error);
      throw error;
    }
  },
  updateOne: async (bookId, data) => {
    try {
      const docRef = doc(db, 'books', bookId as string);
      await updateDoc(docRef, data);
      
      return {
        id: bookId as string,
        ...data
      } as Book;
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  },
  deleteOne: async (bookId) => {
    try {
      const docRef = doc(db, 'books', bookId as string);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  },
  validate: z.object({
    class_number: z.string({ required_error: 'Class Number is required' }).nonempty('Class Number is required'),
    author_notation: z.string({ required_error: 'Author Notation is required' }).nonempty('Author Notation is required'),
    copyright_year: z.number({ required_error: 'Copyright Year is required' }),
    copy: z.number({ required_error: 'Copy is required' }),
    ris_number: z.number({ required_error: 'RIS Number is required' }),
    date_added: z.string({ required_error: 'Date Added is required' }).nonempty('Date Added is required'),
    remarks: z.string().optional(),
    ddc: z.string({ required_error: 'DDC is required' }).nonempty('DDC is required'),
  })['~standard'].validate,
};

export const booksCache = new DataSourceCache();
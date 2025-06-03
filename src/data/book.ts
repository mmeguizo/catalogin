// src/data/book.ts
'use client';
import { DataModel, DataSource, DataSourceCache } from '@toolpad/core/Crud';
import { z } from 'zod';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export interface Book extends DataModel {
  id: string;
  // NEW FIELDS from your provided headers (made optional with '?')
  Accession_Number?: string;
  Title_Number?: string;
  Title?: string;
  Author?: string; // Primary Author string
  Author1_FirstName?: string;
  Author2_Surname?: string;
  Author2_FirstName?: string;
  Author3_Surname?: string;
  Author3_FirstName?: string;
  Author4_Surname?: string;
  Author4_FirstName?: string;
  Other_Authors?: string; // Renamed from 'Other Author/s' for easier property access
  Publisher?: string;
  Prelim_page?: string;
  Pages?: string;
  Description?: string;
  dimension?: string;
  Accompanying_materials?: string; // Renamed from 'Accompanying materials'
  ISBN?: string;
  Material_Type?: string;
  Subtype?: string;
  General_Subject?: string; // Renamed from 'General Subject'
  Course_Code1?: string;
  Course_Code2?: string;
  Course_Code3?: string;
  Course_Code4?: string;
  Course_Code5?: string;
  Department?: string;
  Location?: string;

  // Existing fields (placed at the end of the new sequence as per your request)
  class_number: string;
  author_notation: string;
  copyright_year: number;
  copy: number;
  ris_number: number;
  date_added: string;
  remarks: string;
  ddc: string;
}

// Helper function to remove undefined values from an object
// Firestore does not allow 'undefined'
function removeUndefined(obj: any): any {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  );
}

const booksCollectionRef = collection(db, 'books');

export const booksDataSource: DataSource<Book> = {
  // REORDERED FIELDS TO MATCH YOUR DESIRED SEQUENCE
  fields: [
    { field: 'Accession_Number', headerName: 'Accession Number', width: 150 },
    { field: 'Title_Number', headerName: 'Title Number', width: 120 },
    { field: 'Title', headerName: 'Title', width: 250 },
    { field: 'Author', headerName: 'Primary Author', width: 200 },
    { field: 'Author1_FirstName', headerName: 'Author 1 First Name', width: 150 },
    { field: 'Author2_Surname', headerName: 'Author 2 Surname', width: 150 },
    { field: 'Author2_FirstName', headerName: 'Author 2 First Name', width: 150 },
    { field: 'Author3_Surname', headerName: 'Author 3 Surname', width: 150 },
    { field: 'Author3_FirstName', headerName: 'Author 3 First Name', width: 150 },
    { field: 'Author4_Surname', headerName: 'Author 4 Surname', width: 150 },
    { field: 'Author4_FirstName', headerName: 'Author 4 First Name', width: 150 },
    { field: 'Other_Authors', headerName: 'Other Author/s', width: 200 },
    { field: 'Publisher', headerName: 'Publisher', width: 180 },
    { field: 'Prelim_page', headerName: 'Prelim Page', width: 100 },
    { field: 'Pages', headerName: 'Pages', width: 100 },
    { field: 'Description', headerName: 'Description', width: 250 },
    { field: 'dimension', headerName: 'Dimension', width: 100 },
    { field: 'Accompanying_materials', headerName: 'Accompanying Materials', width: 200 },
    { field: 'ISBN', headerName: 'ISBN', width: 150 },
    { field: 'Material_Type', headerName: 'Material Type', width: 120 },
    { field: 'Subtype', headerName: 'Subtype', width: 120 },
    { field: 'General_Subject', headerName: 'General Subject', width: 150 },
    { field: 'Course_Code1', headerName: 'Course Code 1', width: 120 },
    { field: 'Course_Code2', headerName: 'Course Code 2', width: 120 },
    { field: 'Course_Code3', headerName: 'Course Code 3', width: 120 },
    { field: 'Course_Code4', headerName: 'Course Code 4', width: 120 },
    { field: 'Course_Code5', headerName: 'Course Code 5', width: 120 },
    { field: 'Department', headerName: 'Department', width: 120 },
    { field: 'Location', headerName: 'Location', width: 120 },
    { field: 'class_number', headerName: 'Class Number', width: 140 },
    { field: 'author_notation', headerName: 'Author Notation', width: 140 },
    { field: 'copyright_year', headerName: 'Copyright Year', type: 'number', width: 140 },
    { field: 'copy', headerName: 'Copy', type: 'number', width: 80 },
    { field: 'ris_number', headerName: 'RIS Number', type: 'number', width: 120 },
    {
      field: 'date_added',
      headerName: 'Date Added',
      type: 'date',
      valueGetter: (value: string | null | undefined) => {
        if (!value) return null;
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      },
      width: 160,
    },
    { field: 'remarks', headerName: 'Remarks', width: 200 },
    { field: 'ddc', headerName: 'DDC', width: 100 },
    { field: 'id', headerName: 'ID', width: 100 }, // ID is usually last or first
  ],
  getMany: async ({ paginationModel, filterModel, sortModel }) => {
    try {
      const querySnapshot = await getDocs(booksCollectionRef);
      let books = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];

      // Apply filters (client-side)
      if (filterModel?.items?.length) {
        filterModel.items.forEach(({ field, value, operator }) => {
          if (!field || value == null) return;

          books = books.filter((book) => {
            const fieldDef = booksDataSource.fields.find(f => f.field === field);
            // Use String() conversion to handle potential non-string values more gracefully
            const bookValue = fieldDef?.valueGetter ? fieldDef.valueGetter(book[field]) : book[field];

            switch (operator) {
              case 'contains':
                return String(bookValue || '').toLowerCase().includes(String(value).toLowerCase());
              case 'equals':
                if (fieldDef?.type === 'date') {
                    const filterDate = value instanceof Date ? value : new Date(value);
                    return bookValue instanceof Date && !isNaN(filterDate.getTime()) && bookValue.getTime() === filterDate.getTime();
                }
                return bookValue === value;
              case 'startsWith':
                return String(bookValue || '').toLowerCase().startsWith(String(value).toLowerCase());
              case 'endsWith':
                return String(bookValue || '').toLowerCase().endsWith(String(value).toLowerCase());
              case '>':
                if (fieldDef?.type === 'date') {
                    const filterDate = value instanceof Date ? value : new Date(value);
                    return bookValue instanceof Date && !isNaN(filterDate.getTime()) && bookValue.getTime() > filterDate.getTime();
                }
                // Ensure comparison is done on numbers if type is number
                if (typeof bookValue === 'number' && typeof value === 'number') return bookValue > value;
                return false; // Or handle other types
              case '<':
                if (fieldDef?.type === 'date') {
                    const filterDate = value instanceof Date ? value : new Date(value);
                    return bookValue instanceof Date && !isNaN(filterDate.getTime()) && bookValue.getTime() < filterDate.getTime();
                }
                // Ensure comparison is done on numbers if type is number
                if (typeof bookValue === 'number' && typeof value === 'number') return bookValue < value;
                return false; // Or handle other types
              default:
                return true;
            }
          });
        });
      }

      // Apply sorting (client-side)
      if (sortModel?.length) {
        books.sort((a, b) => {
          for (const { field, sort } of sortModel) {
            const fieldDef = booksDataSource.fields.find(f => f.field === field);
            const aValue = fieldDef?.valueGetter ? fieldDef.valueGetter(a[field]) : a[field];
            const bValue = fieldDef?.valueGetter ? fieldDef.valueGetter(b[field]) : b[field];

            if (fieldDef?.type === 'date') {
                const aTime = aValue instanceof Date ? aValue.getTime() : -Infinity;
                const bTime = bValue instanceof Date ? bValue.getTime() : -Infinity;
                if (aTime < bTime) return sort === 'asc' ? -1 : 1;
                if (aTime > bTime) return sort === 'asc' ? 1 : -1;
            } else if (fieldDef?.type === 'number') {
                if ((aValue || 0) < (bValue || 0)) return sort === 'asc' ? -1 : 1;
                if ((aValue || 0) > (bValue || 0)) return sort === 'asc' ? 1 : -1;
            }
            else { // Default string comparison
                if (String(aValue || '') < String(bValue || '')) {
                  return sort === 'asc' ? -1 : 1;
                }
                if (String(aValue || '') > String(bValue || '')) {
                  return sort === 'asc' ? 1 : -1;
                }
            }
          }
          return 0;
        });
      }

      // Apply pagination (client-side)
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
      // FIX: Remove undefined values before sending to Firestore
      const cleanedData = removeUndefined(data);
      const docRef = await addDoc(booksCollectionRef, cleanedData);
      return {
        id: docRef.id,
        ...data // return original data for local cache consistency
      } as Book;
    } catch (error) {
      console.error('Error creating book:', error);
      throw error;
    }
  },
  updateOne: async (bookId, data) => {
    try {
      // FIX: Remove undefined values before sending to Firestore
      const cleanedData = removeUndefined(data);
      const docRef = doc(db, 'books', bookId as string);
      await updateDoc(docRef, cleanedData);
      
      return {
        id: bookId as string,
        ...data // return original data for local cache consistency
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
    // NEW FIELD VALIDATIONS - Most are optional for flexibility
    Accession_Number: z.string().optional().nullable(), // Added .nullable() as it can be null from forms
    Title_Number: z.string().optional().nullable(),
    Title: z.string().optional().nullable(),
    Author: z.string().optional().nullable(),
    Author1_FirstName: z.string().optional().nullable(),
    Author2_Surname: z.string().optional().nullable(),
    Author2_FirstName: z.string().optional().nullable(),
    Author3_Surname: z.string().optional().nullable(),
    Author3_FirstName: z.string().optional().nullable(),
    Author4_Surname: z.string().optional().nullable(),
    Author4_FirstName: z.string().optional().nullable(),
    Other_Authors: z.string().optional().nullable(),
    Publisher: z.string().optional().nullable(),
    Prelim_page: z.string().optional().nullable(),
    Pages: z.string().optional().nullable(),
    Description: z.string().optional().nullable(),
    dimension: z.string().optional().nullable(),
    Accompanying_materials: z.string().optional().nullable(),
    ISBN: z.string().optional().nullable(),
    Material_Type: z.string().optional().nullable(),
    Subtype: z.string().optional().nullable(),
    General_Subject: z.string().optional().nullable(),
    Course_Code1: z.string().optional().nullable(),
    Course_Code2: z.string().optional().nullable(),
    Course_Code3: z.string().optional().nullable(),
    Course_Code4: z.string().optional().nullable(),
    Course_Code5: z.string().optional().nullable(),
    Department: z.string().optional().nullable(),
    Location: z.string().optional().nullable(),

    // Existing validations (placed at the end as per new sequence)
    class_number: z.string({ required_error: 'Class Number is required' }).nonempty('Class Number is required'),
    author_notation: z.string({ required_error: 'Author Notation is required' }).nonempty('Author Notation is required'),
    copyright_year: z.number({ required_error: 'Copyright Year is required' }).int().min(1000, "Must be a valid year").max(new Date().getFullYear() + 5, "Cannot be in the future"), // Added simple year validation
    copy: z.number({ required_error: 'Copy is required' }).int().min(1, "Must be at least 1"),
    ris_number: z.number({ required_error: 'RIS Number is required' }).int().min(1, "Must be at least 1"),
    date_added: z.string({ required_error: 'Date Added is required' }).nonempty('Date Added is required'),
    remarks: z.string().optional().nullable(),
    ddc: z.string({ required_error: 'DDC is required' }).nonempty('DDC is required'),
  })['~standard'].validate,
};

export const booksCache = new DataSourceCache();


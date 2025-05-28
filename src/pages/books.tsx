import * as React from 'react';

import { Crud } from '@toolpad/core/Crud';
import { booksDataSource, Book, booksCache } from '../data/book';


export default function BooksCrudPage() {
  return (
    <Crud<Book>
      dataSource={booksDataSource}
      dataSourceCache={booksCache}
      rootPath="/books"
      initialPageSize={25}
      defaultValues={{ itemCount: 1 }}
      showToolbar 
    />
  );
}
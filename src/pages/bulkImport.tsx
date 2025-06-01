import * as React from 'react';
import { Box, Button, Paper, Typography, Input, CircularProgress, Alert, Stack } from '@mui/material';
import { PageContainer } from '@toolpad/core/PageContainer';
import * as XLSX from 'xlsx';
import { booksDataSource, Book, booksCache } from '../data/book'; // Ensure this path is correct

export default function BulkImportsPage() {


  const [file, setFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setMessage(null); // Clear previous messages
    } else {
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select an Excel file first.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result;
        if (!arrayBuffer) {
          throw new Error("Failed to read file buffer.");
        }
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
          raw: false, // Get formatted values (e.g., dates as strings if not numbers)
          defval: null, // Use null for blank cells
        });

        if (jsonData.length === 0) {
          setMessage({ type: 'info', text: 'The Excel file is empty or has no data rows after the header.' });
          setIsLoading(false);
          return;
        }

        const booksToCreate: Partial<Book>[] = jsonData.map((row: any, rowIndex: number) => {
          const bookData: Partial<Book> = {};

          for (const field of booksDataSource.fields) {
            const fieldName = field.field;
            let excelValue = row[fieldName]; // Assumes Excel header matches field.field

            // Attempt case-insensitive match if direct match fails
            if (excelValue === undefined) {
              const rowKeys = Object.keys(row);
              const foundKey = rowKeys.find(key => key.toLowerCase() === fieldName.toLowerCase());
              if (foundKey) {
                excelValue = row[foundKey];
              }
            }

            if (excelValue !== undefined && excelValue !== null && String(excelValue).trim() !== '') {
              let parsedValue: any = excelValue;

              switch (field.type) {
                case 'number':
                  parsedValue = Number(excelValue);
                  if (isNaN(parsedValue)) {
                    console.warn(`Row ${rowIndex + 2}: Could not parse "${excelValue}" as number for field "${fieldName}". Original value kept if string, else undefined.`);
                    parsedValue = typeof excelValue === 'string' && !isNaN(parseFloat(excelValue)) ? excelValue : undefined;
                  }
                  break;
                case 'date':
                case 'dateTime':
                  if (typeof excelValue === 'number' && excelValue > 25569) { // Basic check for Excel serial date
                     parsedValue = new Date(Math.round((excelValue - 25569) * 86400 * 1000));
                  } else if (typeof excelValue === 'string') {
                    parsedValue = new Date(excelValue);
                  } else if (excelValue instanceof Date) {
                    parsedValue = excelValue;
                  }

                  if (!(parsedValue instanceof Date) || isNaN(parsedValue.getTime())) {
                    console.warn(`Row ${rowIndex + 2}: Could not parse "${excelValue}" as date for field "${fieldName}". Setting to undefined.`);
                    parsedValue = undefined;
                  }
                  break;
                case 'boolean':
                  if (typeof excelValue === 'string') {
                    parsedValue = ['true', '1', 'yes', 'on'].includes(excelValue.toLowerCase());
                  } else {
                    parsedValue = Boolean(excelValue);
                  }
                  break;
                case 'string':
                default:
                  parsedValue = String(excelValue);
                  break;
              }
              (bookData as any)[fieldName] = parsedValue;
            }
          }
          delete (bookData as any).id; // Ensure 'id' is not sent if it's auto-generated
          return bookData;
        });

        const validBooksToCreate = booksToCreate.filter(book => Object.keys(book).length > 0 && (book.Title || book.ISBN)); // Basic validation

        if (validBooksToCreate.length === 0) {
            setMessage({ type: 'info', text: 'No valid book data found in the Excel file to import. Ensure Title or ISBN is present.' });
            setIsLoading(false);
            return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const book of validBooksToCreate) {
          try {
            if (!booksDataSource.createOne) {
              throw new Error("booksDataSource.createOne method is not defined. Cannot create book.");
            }
            await booksDataSource.createOne(book as Omit<Book, 'id'>);
            successCount++;
          } catch (createError: any) {
            errorCount++;
            errors.push(`Failed to import book (Title: ${book.Title || 'N/A'}, ISBN: ${book.ISBN || 'N/A'}): ${createError.message}`);
            console.error("Error creating book:", book, createError);
          }
        }

        let resultMessage = `Successfully imported ${successCount} books.`;
        if (errorCount > 0) {
          resultMessage = `Import partially completed. ${successCount} books imported. ${errorCount} failed.`;
          const errorDetails = errors.slice(0, 10).join('\n- '); // Show up to 10 errors
          resultMessage += `\nErrors:\n- ${errorDetails}${errors.length > 10 ? '\n... (more errors in console)' : ''}`;
          setMessage({ type: 'error', text: resultMessage });
        } else {
          setMessage({ type: 'success', text: resultMessage });
        }
        
        // The Crud component on the books page should automatically pick up changes
        // when booksDataSource.createOne is successful and booksCache is used.
        setFile(null); 
        const fileInput = document.getElementById('bulk-import-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = ""; // Reset file input

      } catch (parseError: any) {
        console.error("Error processing Excel file:", parseError);
        setMessage({ type: 'error', text: `Error processing Excel file: ${parseError.message}` });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      setMessage({ type: 'error', text: 'Failed to read the selected file.' });
      console.error("FileReader error:", reader.error);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <PageContainer title="Bulk Import Books" breadcrumbs={[]}>
      <Paper sx={{ p: 3, maxWidth: 'md', margin: 'auto' }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Import Books from Excel
        </Typography>
        <Stack spacing={3} component="form" onSubmit={(e) => { e.preventDefault(); handleImport(); }}>
          <Input
            id="bulk-import-file-input"
            type="file"
            onChange={handleFileChange}
            inputProps={{ accept: ".xlsx, .xls, .csv" }} // Accept common spreadsheet formats
            fullWidth
            required
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !file}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            fullWidth
          >
            {isLoading ? 'Importing...' : 'Import Selected File'}
          </Button>
          {message && (
            <Alert severity={message.type} sx={{ whiteSpace: 'pre-wrap' }}>
              {message.text}
            </Alert>
          )}
        </Stack>
      </Paper>
    </PageContainer>
  );
}
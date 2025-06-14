import * as React from 'react';
import { Box, Button, Paper, Typography, Input, CircularProgress, Alert, Stack } from '@mui/material';
import { PageContainer } from '@toolpad/core/PageContainer';
import * as XLSX from 'xlsx';
import { booksDataSource, Book, booksCache } from '../data/book'; // Ensure this path is correct

export default function BulkImportsPage() {

  const [processingIndex, setProcessingIndex] = React.useState(0);
  const [totalToProcess, setTotalToProcess] = React.useState(0);

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
    console.log('[DEBUG] handleImport function started.'); // Sanity check log
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

        // jsonData is an array of row objects from Excel
        const booksToProcess: Partial<Book>[] = jsonData.map((row: any, rowIndex: number) => {
          const bookData: Partial<Book> = {};

          // Match Excel columns to Book fields.
          // Tries to match by headerName (case-insensitive), then field.field (case-insensitive)
          for (const field of booksDataSource.fields) {
            const fieldName = field.field as keyof Book;
            const headerNameFromDef = field.headerName || fieldName;
            let excelValue: any;

            // Try matching by headerName (case-insensitive)
            const rowKeys = Object.keys(row);
            const foundHeaderKey = rowKeys.find(key => key.toLowerCase() === headerNameFromDef.toLowerCase());
            if (foundHeaderKey) {
              excelValue = row[foundHeaderKey];
            }

            // If not found by headerName, and fieldName is different, try by fieldName (case-insensitive)
            if (excelValue === undefined && fieldName.toLowerCase() !== headerNameFromDef.toLowerCase()) {
              const foundFieldKey = rowKeys.find(key => key.toLowerCase() === fieldName.toLowerCase());
              if (foundFieldKey) {
                excelValue = row[foundFieldKey];
              }
            }

            if (excelValue !== undefined && excelValue !== null && String(excelValue).trim() !== '') {
              let parsedValue: any = String(excelValue).trim(); // Start with trimmed string

              // Perform type conversion based on the target field's type in the Zod schema
              // This is a simplified conversion; for complex cases, Zod's coerce might be better
              // if schemas were defined with it. Here, we align with existing z.number(), z.string().
              switch (field.type) { // field.type is a UI hint, but we use it for basic conversion
                case 'number':
                  const num = Number(parsedValue);
                  parsedValue = isNaN(num) ? undefined : num;
                  if (parsedValue === undefined) {
                      console.warn(`Row ${rowIndex + 2}, Field "${fieldName}": Could not parse "${String(excelValue)}" as number.`);
                  }
                  break;
                case 'date': // Assuming Zod expects a string like 'YYYY-MM-DD' for date fields like 'date_added'
                  let tempDate: Date | undefined;
                  // Handle Excel numeric dates
                  if (typeof excelValue === 'number' && excelValue > 25569 && excelValue < 60000) { // Common range for Excel dates
                    tempDate = new Date(Math.round((excelValue - 25569) * 86400 * 1000));
                  } else { // Handle string dates
                    tempDate = new Date(parsedValue);
                  }

                  if (tempDate && !isNaN(tempDate.getTime())) {
                    parsedValue = tempDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                  } else {
                    parsedValue = undefined; // Could not parse as a valid date
                    console.warn(`Row ${rowIndex + 2}, Field "${fieldName}": Could not parse "${String(excelValue)}" as date string.`);
                  }
                  break;
                case 'boolean':
                  parsedValue = ['true', '1', 'yes', 'on'].includes(parsedValue.toLowerCase());
                  break;
                // For 'string' type, parsedValue (trimmed string) is already correct.
              }
              
              if (parsedValue !== undefined) {
                (bookData as any)[fieldName] = parsedValue;
              }
            }
          }
          delete (bookData as any).id; // Ensure 'id' is not sent
          return bookData;
        });

        setTotalToProcess(booksToProcess.length);
        if (booksToProcess.length === 0) {
            setMessage({ type: 'info', text: 'No data rows found in the Excel file to import.' });
            setIsLoading(false);
            return;
        }

        let successCount = 0;
        let validationErrorCount = 0;
        let creationErrorCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < booksToProcess.length; i++) {
          const bookInput = booksToProcess[i];
          setProcessingIndex(i + 1); // Update progress
          const excelRowNumber = i + 2; // For user-friendly error messages (1-based index + header)

          // Basic check: skip if bookInput is essentially empty
          if (Object.keys(bookInput).length === 0) {
            errors.push(`Row ${excelRowNumber}: Skipped (empty row).`);
            validationErrorCount++;
            continue;
          }

          // Log the raw input from Excel for this row BEFORE any validation attempt
          console.log(`[DEBUG] Raw input for Excel row ${excelRowNumber} (Title from input: ${bookInput.Title || 'N/A'}):`, JSON.parse(JSON.stringify(bookInput)));

          let validatedBookData: Partial<Book> | undefined;
          let validationFailed = false;
          let validationIssues: any[] = []; // To store ZodError issues

          try {
            // 1. Validate the book data using booksDataSource.validate
            // The validate function will throw a ZodError on failure.
            if (booksDataSource.validate) { // Type guard for validate method
              validatedBookData = await booksDataSource.validate(bookInput as Partial<Omit<Book, 'id'>>);
              // If it reaches here, validation was successful
            } else {
              // This case should ideally not be reached if booksDataSource is correctly defined
              throw new Error("booksDataSource.validate method is not defined.");
            }

          } catch (error: any) {
            // This catch block is specifically for errors thrown by booksDataSource.validate
            validationFailed = true;
            validationErrorCount++;
            if (error.name === 'ZodError') { // Check if it's a ZodError
              validationIssues = error.issues || [];
              console.log(`[DEBUG] ZodValidation FAILED for Excel row ${excelRowNumber}. Issues:`, JSON.stringify(validationIssues, null, 2));
            } else {
              // Handle other unexpected errors during the validation call itself
              console.error(`[DEBUG] Unexpected error during validation for row ${excelRowNumber}:`, error);
              validationIssues = [{ path: ['unknown'], message: error.message || 'Unexpected validation error' }];
            }
            console.log(`[DEBUG] Input data for this row (validation error):`, bookInput);
          }

          if (validationFailed) {
            const fieldErrors = validationIssues.map((issue: any) => `${(issue.path && issue.path.join('.')) || 'field'}: ${issue.message}`).join('; ') || 'Unknown validation issue(s). Check console.';
            errors.push(`Row ${excelRowNumber} (Title: ${bookInput.Title || 'N/A'}): Validation failed - ${fieldErrors}`);
            continue; // Skip this book due to validation errors
          }

          // Proceed with creation only if validation passed and we have data
          // CRITICAL FIX: Ensure validation has not failed AND validatedBookData is present
          if (!validationFailed && validatedBookData) { 
            // 2. Create the book if validation passed
            if (!booksDataSource.createOne) {
              console.error("[DEBUG] booksDataSource.createOne method is not defined.");
              throw new Error("booksDataSource.createOne method is not defined. Cannot create book.");
            }
            try {
              // Assuming validatedBookData is the plain book object if validation succeeded
              // The { value: ... } wrapper in logs suggests Zod's ['~standard'].validate might behave differently
              // than expected or there's an intermediate transformation.
              // For now, let's assume validatedBookData IS the book data.
              console.log(`[DEBUG] Attempting to create book for Excel row ${excelRowNumber} with VALIDATED data:`, validatedBookData);
              await booksDataSource.createOne(validatedBookData as Omit<Book, 'id'>); // Pass validatedBookData directly
              successCount++;
            } catch (creationError: any) {
              creationErrorCount++;
              errors.push(`Row ${excelRowNumber} (Title: ${bookInput.Title || 'N/A'}): Creation failed - ${creationError.message || 'Unknown error'}`);
              console.error(`[DEBUG] Error creating book at Excel row ${excelRowNumber} (Title: ${bookInput.Title || 'N/A'}):`, creationError, 'Validated data:', validatedBookData);
            }
          }
        }

        let resultMessage = `Successfully imported ${successCount} books.`;
        const totalFailures = validationErrorCount + creationErrorCount;

        if (totalFailures > 0) {
          resultMessage = `Import summary: ${successCount} books imported. ${validationErrorCount} failed validation. ${creationErrorCount} failed creation.`;
          const errorDetails = errors.slice(0, 15).join('\n- '); // Show up to 15 detailed errors
          resultMessage += `\n\nErrors:\n- ${errorDetails}${errors.length > 15 ? '\n... (more errors in console)' : ''}`;
          setMessage({ type: 'error', text: resultMessage });
        } else if (successCount === 0 && booksToProcess.length > 0) {
          // All rows might have been skipped due to being empty or basic filters
          if (errors.length > 0) {
             const errorDetails = errors.slice(0, 15).join('\n- ');
             setMessage({ type: 'info', text: `No books were imported. Issues found:\n- ${errorDetails}${errors.length > 15 ? '\n... (more errors in console)' : ''}` });
          } else {
            setMessage({ type: 'info', text: 'No valid book data found to import.' });
          }
        }
         else {
          setMessage({ type: 'success', text: resultMessage });
        }
        
        setFile(null); 
        setProcessingIndex(0); // Reset progress
        setTotalToProcess(0); // Reset total
        const fileInput = document.getElementById('bulk-import-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = "";

      } catch (parseError: any) { // Errors from XLSX.read or initial file processing
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
      <Paper sx={{ p: 3, maxWidth: 'lg', margin: 'auto' }}> {/* Increased maxWidth for better error display */}
        <Typography variant="h5" component="h1" gutterBottom>
          Import Books from Excel
        </Typography>
        <Typography variant="body2" gutterBottom sx={{mb: 2}}>
          Ensure Excel column headers match the field names or headers defined in the system (e.g., "Accession Number", "Title", "ISBN"). The import will attempt case-insensitive matching.
        </Typography>
        <Stack spacing={3} component="form" onSubmit={(e) => { e.preventDefault(); handleImport(); }}>
          <Input
            id="bulk-import-file-input"
            type="file"
            onChange={handleFileChange}
            inputProps={{ accept: ".xlsx, .xls" }} // Standard Excel formats
            fullWidth
            required
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !file}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : undefined}
            fullWidth
          >
            {isLoading ? 'Importing...' : 'Import Selected File'}
          </Button>
          {message && (
            <Alert severity={message.type} sx={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}> {/* Allow scrolling for long messages */}
              {message.text}
            </Alert>
          )}
          {isLoading && totalToProcess > 0 && (
            <Typography variant="body2" align="center">
              Processing {processingIndex} of {totalToProcess}...
            </Typography>
          )}
        </Stack>
      </Paper>
    </PageContainer>
  );
}
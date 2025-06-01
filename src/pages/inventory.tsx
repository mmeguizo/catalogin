// src/pages/inventory.tsx
import * as React from "react";
import {
  CircularProgress,
  Alert,
  Box,
  Paper,
  Stack,
  Backdrop,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { PageContainer } from "@toolpad/core/PageContainer";
import { booksDataSource, Book } from '../data/book';
import PrintCardDialog from '../components/PrintCardDialog';

export default function InventoryPage() {
  const [books, setBooks] = React.useState<Book[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [rowCount, setRowCount] = React.useState(0);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedBookForPrint, setSelectedBookForPrint] = React.useState<Book | null>(null);
  const [cardTypeToPrint, setCardTypeToPrint] = React.useState<string>('');
  const [openPrintDialog, setOpenPrintDialog] = React.useState(false);

  const handlePrintMenuClick = React.useCallback((event: React.MouseEvent<HTMLElement>, book: Book) => {
    setAnchorEl(event.currentTarget);
    setSelectedBookForPrint(book);
  }, []);

  const handlePrintMenuClose = React.useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleCardTypeSelect = React.useCallback((type: string) => {
    setCardTypeToPrint(type);
    setOpenPrintDialog(true);
    setAnchorEl(null);
  }, []);

  const handleClosePrintDialog = React.useCallback(() => {
    setOpenPrintDialog(false);
    setSelectedBookForPrint(null);
    setCardTypeToPrint('');
  }, []);

  React.useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (booksDataSource && booksDataSource.getMany) {
          const result = await booksDataSource.getMany({
            paginationModel: { page: 0, pageSize: 1000 },
            filterModel: { items: [] },
            sortModel: [],
          });
          
          if (result && Array.isArray(result.items)) {
            setBooks(result.items);
            setRowCount(result.itemCount);
          } else {
            setBooks([]);
            setRowCount(0);
          }
        } else {
          const missingError = new Error("Books data source or its getMany method is not available.");
          throw missingError;
        }
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const booksRows = React.useMemo(() => {
    const mappedRows = books.map((book: Book) => {
      const dateAddedRaw = book.date_added;
      let dateAddedFormatted: Date | null = null;

      if (dateAddedRaw) {
        const date = new Date(dateAddedRaw);
        dateAddedFormatted = isNaN(date.getTime()) ? null : date;
      }
      
      return {
        id: book.id,
        // Ensure all fields are explicitly mapped from book data
        Accession_Number: book.Accession_Number,
        Title_Number: book.Title_Number,
        Title: book.Title,
        Author: book.Author,
        Author1_FirstName: book.Author1_FirstName,
        Author2_Surname: book.Author2_Surname,
        Author2_FirstName: book.Author2_FirstName,
        Author3_Surname: book.Author3_Surname,
        Author3_FirstName: book.Author3_FirstName,
        Author4_Surname: book.Author4_Surname,
        Author4_FirstName: book.Author4_FirstName,
        Other_Authors: book.Other_Authors,
        Publisher: book.Publisher,
        Prelim_page: book.Prelim_page,
        Pages: book.Pages,
        Description: book.Description,
        dimension: book.dimension,
        Accompanying_materials: book.Accompanying_materials,
        ISBN: book.ISBN,
        Material_Type: book.Material_Type,
        Subtype: book.Subtype,
        General_Subject: book.General_Subject,
        Course_Code1: book.Course_Code1,
        Course_Code2: book.Course_Code2,
        Course_Code3: book.Course_Code3,
        Course_Code4: book.Course_Code4,
        Course_Code5: book.Course_Code5,
        Department: book.Department,
        Location: book.Location,
        class_number: book.class_number,
        author_notation: book.author_notation,
        copyright_year: book.copyright_year,
        copy: book.copy,
        ris_number: book.ris_number,
        date_added: dateAddedFormatted, // This is now a Date object or null
        remarks: book.remarks,
        ddc: book.ddc,
      };
    });
    return mappedRows;
  }, [books]);

  const columns = React.useMemo(() => {
    // UPDATED: manualWidths to include all new columns in the same order as in book.ts fields array
    const manualWidths: { [key: string]: number } = {
      Accession_Number: 150,
      Title_Number: 120,
      Title: 250,
      Author: 180,
      Author1_FirstName: 120,
      Author2_Surname: 120,
      Author2_FirstName: 120,
      Author3_Surname: 120,
      Author3_FirstName: 120,
      Author4_Surname: 120,
      Author4_FirstName: 120,
      Other_Authors: 180,
      Publisher: 150,
      Prelim_page: 80,
      Pages: 80,
      Description: 200,
      dimension: 100,
      Accompanying_materials: 180,
      ISBN: 140,
      Material_Type: 120,
      Subtype: 120,
      General_Subject: 150,
      Course_Code1: 120,
      Course_Code2: 120,
      Course_Code3: 120,
      Course_Code4: 120,
      Course_Code5: 120,
      Department: 100,
      Location: 100,
      class_number: 120,
      author_notation: 120,
      copyright_year: 100,
      copy: 60,
      ris_number: 100,
      date_added: 140,
      remarks: 180,
      ddc: 80,
      id: 100, // ID column
      print_actions: 80, // Width for the new print column
    };

    // Make sure the order here matches the order in booksDataSource.fields
    // and the manualWidths order for consistency and predictability.
    const baseColumns = booksDataSource.fields.map((field) => {
      return {
        field: field.field,
        headerName: field.headerName,
        width: manualWidths[field.field] || 150, // Use manual width or a default
        type: field.type,
        sortable: true,
        filterable: true,
        // valueGetter is needed here if your booksDataSource defines it for client-side transforms
        // valueGetter: field.valueGetter 
        //   ? (params: any) => field.valueGetter!(params.value)
        //   : undefined,
      };
    });

    const printColumn = {
      field: 'print_actions',
      headerName: 'Print',
      width: manualWidths.print_actions,
      sortable: false,
      filterable: false,
      renderCell: (params: any) => (
        <IconButton
          aria-label="print"
          onClick={(event) => handlePrintMenuClick(event, params.row)}
          size="small"
        >
          <PrintIcon />
        </IconButton>
      ),
    };

    const finalColumns = [...baseColumns, printColumn];
    return finalColumns;
  }, [booksDataSource.fields, handlePrintMenuClick]);

  if (isLoading) {
    return (
      <Backdrop open={isLoading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  if (error) {
    return <Alert severity="error">Error loading books: {error.message}</Alert>;
  }

  return (
    <PageContainer title="" breadcrumbs={[]} sx={{ overflow: 'hidden' }}>
      <Stack spacing={3} sx={{ width: '100%', overflow: 'auto', maxHeight: 'calc(100vh - 100px)'}}>
        <Paper sx={{ width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <DataGrid
              rows={booksRows}
              columns={columns}
              rowCount={rowCount}
              loading={isLoading}
              hideFooter={booksRows.length <= 10}
              disableRowSelectionOnClick
              density="compact"
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                  },
                },
              }}
              pageSizeOptions={[5, 10, 25, 50]}
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                },
              }}
              showToolbar
              // FIX: Reverted paginationMode to "client" to match booksDataSource.getMany
              paginationMode="client" 
              // FIX: Removed redundant showToolbar as it's handled by slots={{ toolbar: GridToolbar }}
              // showToolbar 
              // FIX: Removed autosizeOptions as manual widths are set
              // autosizeOptions={{
              //   columns: ['id', 'class_number', 'author_notation', 'copyright_year', 'copy', 'ris_number', 'date_added', 'remarks', 'ddc'],
              //   includeOutliers: true,
              //   includeHeaders: false,
              // }}
              getRowId={(row) => row.id}
            />
          </div>
        </Paper>
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handlePrintMenuClose}
      >
        <MenuItem onClick={() => handleCardTypeSelect('Author Card')}>Author Card</MenuItem>
        <MenuItem onClick={() => handleCardTypeSelect('Title Card')}>Title Card</MenuItem>
        <MenuItem onClick={() => handleCardTypeSelect('Subject Card')}>Subject Card</MenuItem>
      </Menu>

      {selectedBookForPrint && openPrintDialog && (
        <PrintCardDialog
          open={openPrintDialog}
          handleClose={handleClosePrintDialog}
          bookData={selectedBookForPrint}
          cardType={cardTypeToPrint}
        />
      )}
    </PageContainer>
  );
}
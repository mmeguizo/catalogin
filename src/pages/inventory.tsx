// pages/inventory.tsx
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
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { PageContainer } from "@toolpad/core/PageContainer";
import { booksDataSource, Book } from '../data/book';
import PrintCardDialog from '../components/PrintCardDialog';

export default function InventoryPage() {
  console.log('InventoryPage: Component Render');

  const [books, setBooks] = React.useState<Book[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [rowCount, setRowCount] = React.useState(0);

  // State for the print menu and dialog
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedBookForPrint, setSelectedBookForPrint] = React.useState<Book | null>(null);
  const [cardTypeToPrint, setCardTypeToPrint] = React.useState<string>('');
  const [openPrintDialog, setOpenPrintDialog] = React.useState(false);

  // --- DEBUG LOGS FOR PRINT STATE ---
  React.useEffect(() => {
    console.log('--- Print State Update ---');
    console.log('anchorEl:', anchorEl);
    console.log('selectedBookForPrint:', selectedBookForPrint ? selectedBookForPrint.id : 'null');
    console.log('cardTypeToPrint:', cardTypeToPrint);
    console.log('openPrintDialog:', openPrintDialog);
    console.log('--------------------------');
  }, [anchorEl, selectedBookForPrint, cardTypeToPrint, openPrintDialog]);
  // --- END DEBUG LOGS ---


  // Handlers for the print menu
  const handlePrintMenuClick = React.useCallback((event: React.MouseEvent<HTMLElement>, book: Book) => {
    console.log('handlePrintMenuClick: Clicked print icon for book ID:', book.id);
    setAnchorEl(event.currentTarget);
    setSelectedBookForPrint(book);
  }, []); // Memoize for useCallback dependency

  const handlePrintMenuClose = React.useCallback(() => {
    console.log('handlePrintMenuClose: Closing print menu');
    setAnchorEl(null);
    // Important: Do NOT reset selectedBookForPrint or cardTypeToPrint here,
    // as they are needed by the dialog right after selection.
    // They should only be reset when the dialog itself closes.
  }, []);

  // Handler for selecting a card type from the menu
  const handleCardTypeSelect = React.useCallback((type: string) => {
    console.log('handleCardTypeSelect: Selected card type:', type);
    setCardTypeToPrint(type);
    setOpenPrintDialog(true);
    // Menu is closed here, but states for dialog should persist
    setAnchorEl(null); // Close the menu immediately
  }, []);

  // Handler for closing the print dialog
  const handleClosePrintDialog = React.useCallback(() => {
    console.log('handleClosePrintDialog: Closing print dialog');
    setOpenPrintDialog(false);
    setSelectedBookForPrint(null); // Reset book data when dialog closes
    setCardTypeToPrint(''); // Reset card type when dialog closes
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
        class_number: book.class_number,
        author_notation: book.author_notation,
        copyright_year: book.copyright_year,
        copy: book.copy,
        ris_number: book.ris_number,
        date_added: dateAddedFormatted,
        remarks: book.remarks,
        ddc: book.ddc,
      };
    });
    return mappedRows;
  }, [books]);

  const columns = React.useMemo(() => {
    const manualWidths: { [key: string]: number } = {
      id: 250,
      class_number: 100,
      author_notation: 100,
      copyright_year: 100,
      copy: 50,
      ris_number: 100,
      date_added: 150,
      remarks: 150,
      ddc: 100,
      print_actions: 100,
    };

    const baseColumns = booksDataSource.fields.map((field) => {
      return {
        field: field.field,
        headerName: field.headerName,
        width: manualWidths[field.field] || 150,
        type: field.type,
        sortable: true,
        filterable: true,
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
              getRowId={(row) => row.id}
            />
          </div>
        </Paper>
      </Stack>

      {/* Print Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handlePrintMenuClose}
      >
        <MenuItem onClick={() => handleCardTypeSelect('Author Card')}>Author Card</MenuItem>
        <MenuItem onClick={() => handleCardTypeSelect('Title Card')}>Title Card</MenuItem>
        <MenuItem onClick={() => handleCardTypeSelect('Subject Card')}>Subject Card</MenuItem>
      </Menu>

      {/* Print Card Dialog */}
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
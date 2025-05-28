// src/components/PrintCardDialog.tsx
import * as React from 'react';
import * as ReactDOM from 'react-dom'; // Import ReactDOM
import { // Keep all other necessary imports
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import { Book } from '../data/book';

interface PrintCardDialogProps {
  open: boolean;
  handleClose: () => void;
  bookData: Book;
  cardType: string;
}

const PrintCardDialog: React.FC<PrintCardDialogProps> = ({ open, handleClose, bookData, cardType }) => {
  console.log('PrintCardDialog: Component Render');
  console.log('  Props received:');
  console.log('    open:', open);
  console.log('    cardType:', cardType);
  console.log('    bookData (ID):', bookData ? bookData.id : 'null');

  if (!bookData) {
    console.warn('PrintCardDialog: bookData is null or undefined, returning null.');
    return null; // Don't render if no book data
  }

  // Placeholder/Inferred Data
  const inferredTitle = bookData.remarks || "Inferred Book Title";
  const inferredAuthorFullName = bookData.author_notation || "Inferred Author Name";
  const inferredPlaceOfPublication = "New York";
  const inferredPhysicalDescription = "250 p. : ill. ; 23 cm.";
  const inferredISBN = "978-0-1234-5678-9";
  const inferredTracingSubjects = "1. FICTION. 2. ADVENTURE. 3. MYSTERY.";

  // Refined card dimensions for better preview and print
  const CARD_WIDTH_PX = 360; // 12.5cm * ~28.35 px/cm
  const CARD_HEIGHT_PX = 210; // 7.5cm * ~28.35 px/cm

  const renderCardContent = () => {
    // FIX: Wrap commonElements in a React Fragment
    const commonElements = (
      <React.Fragment>
        <Typography variant="body2" sx={{ position: 'absolute', top: 8, left: 8, fontSize: '0.85rem' }}>
          {bookData.ddc}
        </Typography>
        <Typography variant="body2" sx={{ position: 'absolute', top: 28, left: 8, fontSize: '0.85rem' }}>
          {bookData.class_number}
        </Typography>
        <Typography variant="body2" sx={{ position: 'absolute', top: 48, left: 8, fontSize: '0.85rem' }}>
          {bookData.author_notation}
        </Typography>
        <Typography variant="body2" sx={{ position: 'absolute', bottom: 8, left: 8, fontSize: '0.75rem' }}>
          Accession: {bookData.ris_number}
        </Typography>
        <Typography variant="body2" sx={{ position: 'absolute', bottom: 24, left: 8, fontSize: '0.75rem' }}>
          Copy: {bookData.copy}
        </Typography>
      </React.Fragment>
    );

    console.log('PrintCardDialog: Rendering card content for type:', cardType);

    // FIX: Apply ID for print-only targeting here directly on the Paper
    return (
      <Paper
        id="print-card-content" // Add an ID for targeting with CSS
        elevation={1}
        sx={{
          p: 2,
          border: '1px solid #ccc',
          width: CARD_WIDTH_PX,
          height: CARD_HEIGHT_PX,
          position: 'relative',
          overflow: 'hidden',
          fontSize: '0.85rem',
          // Ensure these styles are consistently applied for both preview and print
        }}
      >
        {commonElements}
        {cardType === 'Author Card' && (
          <Typography variant="body1" sx={{ mt: 1, ml: 5, fontWeight: 'bold', fontSize: '0.9rem' }}>
            {inferredAuthorFullName}
          </Typography>
        )}
        {cardType === 'Title Card' && (
          <Typography variant="body1" sx={{ mt: 1, ml: 5, fontWeight: 'bold', fontSize: '0.9rem' }}>
            {inferredTitle}
          </Typography>
        )}
        {cardType === 'Subject Card' && (
          <Typography variant="body1" sx={{ mt: 1, ml: 5, fontWeight: 'bold', fontSize: '0.9rem' }}>
            {inferredTracingSubjects.split('.')[0].trim()}
          </Typography>
        )}
        <Typography variant="body2" sx={{ mt: 0.5, ml: 5, fontSize: '0.85rem' }}>
          {inferredTitle} / {inferredAuthorFullName}. - {inferredPlaceOfPublication} : {bookData.copyright_year}.
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, ml: 5, fontSize: '0.85rem' }}>
          {inferredPhysicalDescription}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, ml: 5, fontSize: '0.85rem' }}>
          Notes: {bookData.remarks}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, ml: 5, fontSize: '0.85rem' }}>
          ISBN: {inferredISBN}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, ml: 5, fontSize: '0.85rem' }}>
          1. {inferredTracingSubjects}
        </Typography>
      </Paper>
    );
  };

  // Get the print portal root element
  const printPortalRoot = document.getElementById('print-portal-root');

  return (
    <>
      {/* Dialog for preview (hidden on print) */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth className="no-print-dialog">
        <DialogTitle>Print {cardType}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            {renderCardContent()} {/* Render card content for modal preview */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button onClick={() => window.print()} variant="contained">Print</Button>
        </DialogActions>
      </Dialog>

      {/* Render the card content into the print portal only when the dialog is open */}
      {open && printPortalRoot && ReactDOM.createPortal(
        <div className="print-only-container">
          {renderCardContent()}
        </div>,
        printPortalRoot
      )}

      {/* NEW: Add a style block for print-specific CSS */}
      <style jsx global>{`
        /* Hide everything by default when printing */
        @media print {
          /* Hide the main app root */
          #root {
            display: none !important;
          }

          /* Hide the dialog root (if it's not portal-rendered) */
          .MuiDialog-root, .MuiBackdrop-root, .no-print-dialog {
              display: none !important;
          }

          /* Show only the content rendered in the print portal */
          #print-portal-root {
            display: block !important; /* Ensure the portal root is visible */
            width: 100%;
            height: 100vh;
            margin: 0;
            padding: 0;
            overflow: hidden; /* Prevent scrollbars */
            box-sizing: border-box; /* Include padding/border in total width/height */
          }

          .print-only-container {
            display: flex !important; /* Use flexbox to center the card */
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }

          /* Ensure the card itself is at the correct size and position */
          #print-card-content {
            margin: 0; /* Remove any default margins */
            padding: 0; /* Remove default padding */
         
          
            
            /* Add fine-tuning for position if needed, e.g., for sticker alignment */
            /* For example, for a top-left sticker on a page: */
            /* position: absolute; top: 1cm; left: 1cm; */
          }
        }
      `}</style>
    </>
  );
};

export default PrintCardDialog;
  // border: none !important; /* Remove border on print if desired */
//     box-shadow: none !important; /* Remove shadow on print */
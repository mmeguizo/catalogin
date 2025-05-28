// src/components/PrintCardDialog.tsx
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
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

  // Use actual data from bookData, with fallbacks to empty string if not present
  const bookTitle = bookData.Title || '';
  const primaryAuthor = bookData.Author || bookData.author_notation || ''; // Use primary Author, fallback to notation
  const publisher = bookData.Publisher || '';
  const copyrightYear = bookData.copyright_year || '';
  const pages = bookData.Pages || '';
  const dimension = bookData.dimension || '';
  const description = bookData.Description || '';
  const accompanyingMaterials = bookData.Accompanying_materials || '';
  const isbn = bookData.ISBN || '';
  const generalSubject = bookData.General_Subject || '';
  const remarks = bookData.remarks || '';

  // For subjects, you might combine General_Subject and Course_Codes
  const inferredTracingSubjects = [
    generalSubject,
    bookData.Course_Code1,
    bookData.Course_Code2,
    bookData.Course_Code3,
    bookData.Course_Code4,
    bookData.Course_Code5,
  ].filter(Boolean).map((s, i) => `${i + 1}. ${s}`).join(' ');


  // Refined card dimensions for better preview and print
  const CARD_WIDTH_PX = 360; // 12.5cm * ~28.35 px/cm
  const CARD_HEIGHT_PX = 210; // 7.5cm * ~28.35 px/cm

  const renderCardContent = () => {
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

    return (
      <Paper
        id="print-card-content"
        elevation={1}
        sx={{
          p: 2,
          border: '1px solid #ccc',
          width: CARD_WIDTH_PX,
          height: CARD_HEIGHT_PX,
          position: 'relative',
          overflow: 'hidden',
          fontSize: '0.85rem',
        }}
      >
        {commonElements}
        {cardType === 'Author Card' && (
          <Typography variant="body1" sx={{ mt: 1, ml: 5, fontWeight: 'bold', fontSize: '0.9rem' }}>
            {primaryAuthor}
          </Typography>
        )}
        {cardType === 'Title Card' && (
          <Typography variant="body1" sx={{ mt: 1, ml: 5, fontWeight: 'bold', fontSize: '0.9rem' }}>
            {bookTitle}
          </Typography>
        )}
        {cardType === 'Subject Card' && (
          <Typography variant="body1" sx={{ mt: 1, ml: 5, fontWeight: 'bold', fontSize: '0.9rem' }}>
            {generalSubject || inferredTracingSubjects.split('.')[0].trim()} {/* Use general subject if available */}
          </Typography>
        )}

        {/* Main content for all cards */}
        <Typography variant="body2" sx={{ mt: 0.5, ml: 5, fontSize: '0.85rem' }}>
          {bookTitle} / {primaryAuthor}. - {publisher} : {copyrightYear}.
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, ml: 5, fontSize: '0.85rem' }}>
          {pages} : {description} ; {dimension}.
        </Typography>
        {accompanyingMaterials && (
          <Typography variant="body2" sx={{ mt: 0.5, ml: 5, fontSize: '0.85rem' }}>
            Accompanying materials: {accompanyingMaterials}.
          </Typography>
        )}
        {isbn && (
          <Typography variant="body2" sx={{ mt: 0.5, ml: 5, fontSize: '0.85rem' }}>
            ISBN: {isbn}.
          </Typography>
        )}
        {remarks && (
          <Typography variant="body2" sx={{ mt: 0.5, ml: 5, fontSize: '0.85rem' }}>
            Notes: {remarks}.
          </Typography>
        )}
        {inferredTracingSubjects && (
          <Typography variant="body2" sx={{ mt: 0.5, ml: 5, fontSize: '0.85rem' }}>
            {inferredTracingSubjects}
          </Typography>
        )}
      </Paper>
    );
  };

  const printPortalRoot = document.getElementById('print-portal-root');

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth className="no-print-dialog">
        <DialogTitle>Print {cardType}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            {renderCardContent()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button onClick={() => window.print()} variant="contained">Print</Button>
        </DialogActions>
      </Dialog>

      {open && printPortalRoot && ReactDOM.createPortal(
        <div className="print-only-container">
          {renderCardContent()}
        </div>,
        printPortalRoot
      )}

      <style jsx global>{`
        @media print {
          body > #root,
          body > .MuiDialog-root,
          body > .MuiBackdrop-root,
          body > .no-print-dialog {
            display: none !important;
          }

          #print-portal-root {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            overflow: hidden;
            box-sizing: border-box;
            z-index: 9999;
          }

          .print-only-container {
            display: flex !important;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }

          #print-card-content {
            margin: 0;
            padding: 0;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default PrintCardDialog;
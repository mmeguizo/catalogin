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
  if (!bookData) {
    return null; // Don't render if no book data
  }

  // --- Data Extraction and Formatting ---
  const accessionNumber = bookData.Accession_Number || '';
  const titleNumber = bookData.Title_Number || '';
  const bookTitle = bookData.Title || '';
  const primaryAuthor = bookData.Author || '';
  const authorNotation = bookData.author_notation || '';
  const publisher = bookData.Publisher || '';
  const copyrightYear = bookData.copyright_year || '';
  const prelimPage = bookData.Prelim_page || '';
  const pages = bookData.Pages || '';
  const description = bookData.Description || '';
  const dimension = bookData.dimension || '';
  const accompanyingMaterials = bookData.Accompanying_materials || '';
  const isbn = bookData.ISBN || '';
  const generalSubject = bookData.General_Subject || '';
  const remarks = bookData.remarks || '';
  const ddc = bookData.ddc || '';
  const classNumber = bookData.class_number || '';
  const risNumber = bookData.ris_number || '';
  const copy = bookData.copy || '';
  const location = bookData.Location || 'CY';

  // Format: "Vii, 306 pages : some illustrations ; 25cm. + 1 CD ROM."
  const collationLine = [
    prelimPage ? `${prelimPage},` : '',
    pages ? `${pages} pages :` : '',
    description ? `${description} ;` : '',
    dimension ? `${dimension}.` : '',
    accompanyingMaterials ? `+ ${accompanyingMaterials}.` : ''
  ].filter(Boolean).join(' ').replace(/, :/, ':');

  const tracingSubjects = [
    generalSubject,
    bookData.Course_Code1,
    bookData.Course_Code2,
    bookData.Course_Code3,
    bookData.Course_Code4,
    bookData.Course_Code5,
  ].filter(Boolean);

  const formattedTracingSubjects = tracingSubjects.length > 0
    ? tracingSubjects.map((s, i) => `${i + 1}. ${s}`).join(' ') + '.'
    : '';

  // --- ADJUSTED: Card dimensions ---
  const CARD_WIDTH_PX = 600;
  const CARD_HEIGHT_PX = 350;

  const renderCardContent = () => {
    // --- ADJUSTED: Common Left Column Style (for DDC, Class No., Author Notation) ---
    const commonLeftColStyle = {
      position: 'absolute',
      left: '0.3cm', // Closer to left edge
      fontSize: '0.8rem',
      lineHeight: 1.2,
    };

    // --- ADJUSTED: Main Content Line Style (for Title, Author, Imprint, Collation etc.) ---
    const mainContentLineStyle = {
      ml: '2.5rem', // Indent content lines starting from 2.5rem (approx 0.88 inch or 2.2cm)
      fontSize: '0.9rem',
      lineHeight: 1.3,
      wordBreak: 'break-word',
    };

    // --- ADJUSTED: Common Elements (Now includes bottom-left info) ---
    const commonElements = (
      <React.Fragment>
        {/* Top Left Classification Info */}
        <Typography variant="body2" sx={{ ...commonLeftColStyle, top: '0.3cm' }}>
          {location}
        </Typography>
        <Typography variant="body2" sx={{ ...commonLeftColStyle, top: '0.9cm' }}>
          {ddc}
        </Typography>
        <Typography variant="body2" sx={{ ...commonLeftColStyle, top: '1.5cm' }}>
          {classNumber}
        </Typography>
        <Typography variant="body2" sx={{ ...commonLeftColStyle, top: '2.1cm' }}>
          {authorNotation}
        </Typography>

        {/* --- MOVED/ADJUSTED: Bottom-Left Accession/Title/RIS/Copy Info --- */}
        <Box sx={{ position: 'absolute', bottom: '0.3cm', left: '0.3cm', fontSize: '0.75rem', lineHeight: 1.2 }}>
            {accessionNumber && <Typography variant="body2" sx={{ fontSize: 'inherit' }}>Acc. #: {accessionNumber}</Typography>}
            {titleNumber && <Typography variant="body2" sx={{ fontSize: 'inherit' }}>Title #: {titleNumber}</Typography>}
            {risNumber && <Typography variant="body2" sx={{ fontSize: 'inherit' }}>RIS #: {risNumber}</Typography>}
            {copy && <Typography variant="body2" sx={{ fontSize: 'inherit' }}>Copy: {copy}</Typography>}
        </Box>
      </React.Fragment>
    );

    return (
      <Paper
        id="print-card-content"
        elevation={1}
        sx={{
          p: '0.5cm',
          border: '1px solid #ccc',
          width: CARD_WIDTH_PX,
          height: CARD_HEIGHT_PX,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'monospace',
          // REMOVED FOR PREVIEW BACKGROUND: color: 'black', backgroundColor: 'white',
        }}
      >
        {commonElements}

        {/* --- ADJUSTED: Main Content Area Positioning --- */}
        <Box sx={{ position: 'absolute', top: '2.8cm', left: '0.5cm', right: '0.5cm', bottom: '0.5cm', overflow: 'hidden' }}>
          {/* Primary Entry Line - adjusted for bolding and specific card type */}
          {cardType === 'Author Card' && (
            <Typography variant="body1" sx={{ ...mainContentLineStyle, fontWeight: 'bold' }}>
              {primaryAuthor}.
            </Typography>
          )}
          {cardType === 'Title Card' && (
            <Typography variant="body1" sx={{ ...mainContentLineStyle, fontWeight: 'bold' }}>
              {bookTitle}.
            </Typography>
          )}
          {cardType === 'Subject Card' && (
            <Typography variant="body1" sx={{ ...mainContentLineStyle, fontWeight: 'bold', textTransform: 'uppercase' }}>
              {generalSubject || (formattedTracingSubjects.split('.')[0] || '').trim()}.
            </Typography>
          )}

          {/* --- ADJUSTED: Subsequent lines with correct indentation and conditional rendering --- */}
          {/* Author line for Title/Subject cards */}
          {cardType !== 'Author Card' && primaryAuthor && (
            <Typography variant="body2" sx={{ ...mainContentLineStyle, ml: '2.5rem' }}>
                {primaryAuthor}.
            </Typography>
          )}
          
          {/* Title and Imprint line */}
          <Typography variant="body2" sx={{ ...mainContentLineStyle, ml: '2.5rem' }}>
            {bookTitle} {bookTitle && primaryAuthor ? '/' : ''} {primaryAuthor}. -- {publisher}, {copyrightYear}.
          </Typography>
          
          {/* Collation line */}
          {collationLine && (
            <Typography variant="body2" sx={{ ...mainContentLineStyle, ml: '2.5rem' }}>
              {collationLine}
            </Typography>
          )}
          
          {/* ISBN line */}
          {isbn && (
            <Typography variant="body2" sx={{ ...mainContentLineStyle, ml: '2.5rem' }}>
              ISBN {isbn}.
            </Typography>
          )}

          {/* Remarks/Notes line */}
          {remarks && (
            <Typography variant="body2" sx={{ ...mainContentLineStyle, ml: '2.5rem' }}>
              Notes: {remarks}.
            </Typography>
          )}

          {/* Tracing Subjects line */}
          {formattedTracingSubjects && (
            <Typography variant="body2" sx={{ ...mainContentLineStyle, ml: '2.5rem' }}>
              {formattedTracingSubjects}
            </Typography>
          )}
        </Box>
      </Paper>
    );
  };

  const printPortalRoot = document.getElementById('print-portal-root');

  return (
    <>
      {/* Dialog for preview (hidden on print) */}
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

      {/* Render the card content into the print portal only when the dialog is open */}
      {open && printPortalRoot && ReactDOM.createPortal(
        <div className="print-only-container">
          {renderCardContent()}
        </div>,
        printPortalRoot
      )}

      {/* Add a style block for print-specific CSS */}
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
            
            /* Ensure exact size for print consistency */
            width: ${CARD_WIDTH_PX}px;
            height: ${CARD_HEIGHT_PX}px;
            
            /* FIX: Ensure text is black and background is white only for print */
            color: black !important;
            background-color: white !important;
          }
        }
      `}</style>
    </>
  );
};

export default PrintCardDialog;
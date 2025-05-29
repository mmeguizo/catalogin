// src/components/PrintCardDialog.tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
} from "@mui/material";
import { Book } from "../data/book";

interface PrintCardDialogProps {
  open: boolean;
  handleClose: () => void;
  bookData: Book;
  cardType: string;
}

const PrintCardDialog: React.FC<PrintCardDialogProps> = ({
  open,
  handleClose,
  bookData,
  cardType,
}) => {
  if (!bookData) {
    return null; // Don't render if no book data
  }

  // --- Data Extraction and Formatting ---
  const accessionNumber = bookData.Accession_Number || "";
  const titleNumber = bookData.Title_Number || "";
  const bookTitle = bookData.Title || "";
  const primaryAuthor = bookData.Author || "";
  const authorNotation = bookData.author_notation || "";
  const publisher = bookData.Publisher || "";
  const copyrightYear = bookData.copyright_year || "";
  const prelimPage = bookData.Prelim_page || "";
  const pages = bookData.Pages || "";
  const description = bookData.Description || "";
  const dimension = bookData.dimension || "";
  const accompanyingMaterials = bookData.Accompanying_materials || "";
  const isbn = bookData.ISBN || "";
  const generalSubject = bookData.General_Subject || "";
  const remarks = bookData.remarks || "";
  const ddc = bookData.ddc || "";
  const classNumber = bookData.class_number || "";
  const risNumber = bookData.ris_number || "";
  const copy = bookData.copy || "";
  const location = bookData.Location || "CY";

  // --- Refined: Collation Line Construction ---
  const collationParts = [];
  if (prelimPage && pages) {
    collationParts.push(`${prelimPage}, ${pages} pages`);
  } else if (pages) {
    collationParts.push(`${pages} pages`);
  }
  if (description) {
    collationParts.push(`: ${description}`);
  }
  if (dimension) {
    collationParts.push(`; ${dimension}cm.`);
  }
  if (accompanyingMaterials) {
    collationParts.push(`+ ${accompanyingMaterials}.`);
  }
  const collationLine = collationParts.filter(Boolean).join(" ").trim();

  // --- Refined: Tracing Subjects Construction ---
  const tracingSubjectsRaw = [
    generalSubject,
    // bookData.Course_Code1,
    // bookData.Course_Code2,
    // bookData.Course_Code3,
    // bookData.Course_Code4,
    // bookData.Course_Code5,
  ].filter(Boolean);

  const formattedTracingSubjects =
    tracingSubjectsRaw.length > 0
      ? tracingSubjectsRaw.map((s, i) => `${i + 1}. ${s}`).join(" ") + "."
      : "";

  // --- ADJUSTED: Card dimensions (use CM for precision) ---
  const CARD_WIDTH_CM = 15.7; // 5 inches
  const CARD_HEIGHT_CM = 7.62; // 3 inches

  // --- ADJUSTED: Indentation Values (using cm for precision) ---
  const indent0 = "0.3cm"; // Left-most margin for classification/accession info
  const indent1 = "1.2cm"; // First significant text indent (for hanging indents start)
  const indent2 = "1.1cm"; // Second significant text indent (for primary entry, and wrapped lines)

  const renderCardContent = () => {
    // --- Common Layout Styles ---
    const lineBaseStyle = {
      fontSize: "0.9rem",
      lineHeight: 1.3,
      wordBreak: "break-word",
      mb: "0.1rem", // Small margin-bottom for vertical spacing between lines
    };

    // Style for lines that require hanging indent
    const hangingIndentStyle = {
      ...lineBaseStyle,
      ml: indent1, // Starts at first indent
      textIndent: `-${parseFloat(indent2) - parseFloat(indent1)}cm`, // Negative indent for first line to align subsequent lines at indent2
    };

    const formattedTracingSubjectsStyle = {
      ...lineBaseStyle,
      ml: indent1, // Starts at first indent
      mt: "30px",
      textIndent: `-${parseFloat(indent2) - parseFloat(indent1)}cm`, // Negative indent for first line to align subsequent lines at indent2
    };

    const hangingIndentStyle2 = {
      ...lineBaseStyle,
      ml: indent1, // Starts at first indent
      textIndent: `-${parseFloat(indent2) - parseFloat(indent1)}cm`, // Negative indent for first line to align subsequent lines at indent2
    };

    // Style for lines that require a deeper indent (like primary entry for Author Card)
    const deepIndentStyle = {
      ...lineBaseStyle,
      ml: "15px", // Starts at second indent
    };

    return (
      <Paper
        id="print-card-content"
        elevation={1}
        sx={{
          p: "0.9cm", // Padding around the content inside the paper
          border: "1px solid #ccc",
          width: `${CARD_WIDTH_CM}cm`,
          height: `${CARD_HEIGHT_CM}cm`,
          position: "relative", // Paper is the positioning context for its children
          overflow: "hidden",
          fontFamily: "monospace",
          color: "black",
          backgroundColor: "inherit", // Inherit theme background for preview
          display: "flex", // Use flexbox for the main layout to align left and right boxes
          flexDirection: "row",
        }}
      >
        {/* --- Left (Red Box equivalent) --- */}
        <Box
          sx={{
            width: "2.5cm", // Approximate width of the left column based on sample
            height: "100%",
            flexShrink: 0, // Prevent it from shrinking
            // backgroundColor: 'rgba(255,0,0,0.2)', // For visual debugging
            position: "relative", // This box is a positioning context for its absolute children
            pr: "0.1cm", // Small right padding to separate from green box
            // borderRight: '1px dotted red' // For visual debugging
          }}
        >
          {/* Top Left Classification Info (relative to this red box) */}
          <Typography
            variant="body2"
            sx={{
              position: "absolute",
              top: "0.1cm",
              left: "0cm",
              fontSize: "0.8rem",
              lineHeight: 1.2,
            }}
          >
            &nbsp;{location}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              position: "absolute",
              top: "0.5cm",
              left: "0cm",
              fontSize: "0.8rem",
              lineHeight: 1.2,
            }}
          > 
            {ddc} {classNumber} {/* Combined DDC and Class Number */}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              position: "absolute",
              top: "1cm",
              left: "0cm",
              fontSize: "0.8rem",
              lineHeight: 1.2,
            }}
          >
            {authorNotation}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              position: "absolute",
              top: "1.5cm",
              left: "0cm",
              fontSize: "0.8rem",
              lineHeight: 1.2,
            }}
          >
            {copyrightYear}
          </Typography>

          {/* Bottom-Left Accession/Title/RIS/Copy Info (relative to this red box) */}
          <Box
            sx={{
              position: "absolute",
              bottom: "0cm", // Position from bottom of this red box
              left: "0cm", // Align with classification left margin
              fontSize: "0.75rem",
              lineHeight: 1.2,
            }}
          >
            {accessionNumber && (
              <Typography
                variant="body2"
                sx={{ fontSize: "inherit", mb: "0.1rem" }}
              >
                Acc. #: {accessionNumber}
              </Typography>
            )}
            {titleNumber && (
              <Typography
                variant="body2"
                sx={{ fontSize: "inherit", mb: "0.1rem" }}
              >
                Title #: {titleNumber}
              </Typography>
            )}
            {risNumber && (
              <Typography
                variant="body2"
                sx={{ fontSize: "inherit", mb: "0.1rem" }}
              >
                RIS #: {risNumber}
              </Typography>
            )}
            {copy && (
              <Typography variant="body2" sx={{ fontSize: "inherit" }}>
                Copy: {copy}
              </Typography>
            )}
          </Box>
        </Box>

        {/* --- Right (Green Box equivalent): Main Bibliographic Content Area --- */}
        <Box
          sx={{
            flexGrow: 1, // Allow it to grow and fill remaining space
            // backgroundColor: 'rgba(0,255,0,0.2)', // For visual debugging
            pt: "0.4cm", // Padding top to align with author name in red box
            pb: "0.1cm", // Padding bottom to ensure content doesn't hit the bottom edge
            overflow: "hidden", // Hide overflow if text goes too long
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          {/* --- Primary Entry (Authors, Title, or Subject) --- */}
          {/* Positioned absolutely to align with the DDC/Class Number block (indent0) if card type is Title/Subject */}
          {(cardType === "Title Card" || cardType === "Subject Card") && (
            <Typography
              variant="body1"
              sx={{
                position: "relative", // Absolute to align with indent0
                top: "12px", // Top alignment within this green box
                left: "45px", // Aligned with classification block
                fontSize: "0.9rem",
                lineHeight: 1.3,
                // fontWeight: 'bold',
                textTransform:
                  cardType === "Subject Card" ? "uppercase" : "none",
              }}
            >
              {cardType === "Title Card" ? bookTitle : generalSubject}.
            </Typography>
          )}

          {/* --- Author/Title/Subject Main Entry (for Author Card) --- */}
          {cardType === "Author Card" && (
            <Box
              sx={{
                width: "100%",
                /* border: '1px dotted red', */ mb: "0.1cm",
                mt: "0.5cm" /* Aligns with top of green box */,
              }}
            >
              <Typography variant="body1" sx={{ ...deepIndentStyle }}>
                {primaryAuthor}.
              </Typography>
            </Box>
          )}

          {/* --- Author line for Title/Subject cards (starts at second indent if not primary entry) --- */}
          {cardType !== "Author Card" && primaryAuthor && (
            <Box
              sx={{
                width: "100%",
                /* border: '1px dotted blue', */ mb: "0.1cm",
                mt: "0.5cm" /* Space below primary entry */,
              }}
            >
              <Typography variant="body2" sx={{ ...deepIndentStyle }}>
                {primaryAuthor}.
              </Typography>
            </Box>
          )}

          {/* --- Main Bibliographic Description (Starts below dynamic primary entry/author line) --- */}
          {/* Calculate top margin dynamically based on previous content to avoid overlap and align */}
          <Box
            sx={{
              width: "100%",
              // border: '1px dotted purple',
              flexGrow: 1,
              mt:
                cardType === "Author Card"
                  ? "0.0cm"
                  : primaryAuthor
                    ? "0.0cm"
                    : "0.5cm" /* Adjust top margin based on previous content */,
              // This box will now contain all the flowing lines starting from the Title Statement
            }}
          >
            {/* Title Statement & Imprint Line (starts at first indent, wraps to second) */}
            <Typography variant="body2" sx={{ ...hangingIndentStyle2 }}>
              {bookTitle} {bookTitle && primaryAuthor ? "/" : ""}{" "}
              {primaryAuthor}
              <br />
              .--. {publisher}, {copyrightYear}.
            </Typography>

            {/* Collation line (starts at first indent, wraps to second) */}
            {collationLine && (
              <Typography variant="body2" sx={{ ...hangingIndentStyle }}>
                {collationLine}
              </Typography>
            )}

            {/* ISBN line (starts at first indent, wraps to second) */}
            {isbn && (
              <Typography variant="body2" sx={{ ...hangingIndentStyle }}>
                ISBN {isbn}.
              </Typography>
            )}

            {/* Remarks/Notes line (starts at first indent, wraps to second) */}
            {remarks && (
              <Typography variant="body2" sx={{ ...hangingIndentStyle }}>
                Notes: {remarks}.
              </Typography>
            )}

            {/* Tracing Subjects line (starts at first indent, wraps to second) */}
            {formattedTracingSubjects && (
              <Typography
                variant="body2"
                sx={{ ...formattedTracingSubjectsStyle }}
              >
                {formattedTracingSubjects}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    );
  };

  const printPortalRoot = document.getElementById("print-portal-root");

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        className="no-print-dialog"
      >
        <DialogTitle>Print {cardType}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            {renderCardContent()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button onClick={() => window.print()} variant="contained">
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {open &&
        printPortalRoot &&
        ReactDOM.createPortal(
          <div className="print-only-container">{renderCardContent()}</div>,
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
            margin: 1cm 0 0 0 !important;
            padding: 1cm 0 0 0;
          }

          #print-card-content {
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: 1px solid black !important;
            width: ${CARD_WIDTH_CM}cm;
            height: ${CARD_HEIGHT_CM}cm;
            margin-top: 10px !important;
            margin-bottom: 10px;
            color: black !important;
            background-color: green !important;
          }
        }
      `}</style>
    </>
  );
};

export default PrintCardDialog;

import * as React from 'react';
import Typography from '@mui/material/Typography';
import { BarChart, PieChart, pieArcLabelClasses } from '@mui/x-charts';
import { Box, Paper, CircularProgress, Alert } from '@mui/material';
import { booksDataSource, Book } from '../data/book';

export default function DashboardPage() {
  const [books, setBooks] = React.useState<Book[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

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
            console.log('Dashboard: Fetched raw books data:', result.items);
          } else {
            setBooks([]);
            console.warn('Dashboard: booksDataSource.getMany did not return expected array of items.');
          }
        } else {
          throw new Error("Books data source or its getMany method is not available.");
        }
      } catch (err: any) {
        console.error('Dashboard: Error during data fetching:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // --- Data Processing for Charts ---
  const { years, booksByYear } = React.useMemo(() => {
    const counts: { [year: number]: number } = {};
    books.forEach(book => {
      if (book.copyright_year !== undefined && book.copyright_year !== null) {
        const year = Number(book.copyright_year);
        if (!isNaN(year)) {
          counts[year] = (counts[year] || 0) + 1;
        } else {
          console.warn('Dashboard: Invalid copyright_year found:', book.copyright_year, 'for book ID:', book.id);
        }
      } else {
        console.warn('Dashboard: Missing copyright_year for book ID:', book.id);
      }
    });
    const sortedYears = Object.keys(counts).map(Number).sort((a, b) => a - b);
    const seriesData = sortedYears.map(year => counts[year]);

    console.log('Dashboard: Books by Year - Years:', sortedYears, 'Data:', seriesData);
    
    return {
      years: sortedYears,
      booksByYear: [{ data: seriesData, label: 'Number of Books' }],
    };
  }, [books]);

  const booksByDDC = React.useMemo(() => {
    const counts: { [ddc: string]: number } = {};
    books.forEach(book => {
      if (book.ddc && typeof book.ddc === 'string' && book.ddc.trim() !== '') {
        const ddcClean = book.ddc.trim();
        // FIX: Corrected typo from dddcClean to ddcClean
        counts[ddcClean] = (counts[ddcClean] || 0) + 1; 
      } else {
        console.warn('Dashboard: Missing or invalid DDC for book ID:', book.id);
      }
    });
    const processedDDC = Object.entries(counts).map(([ddc, value], index) => ({
      id: index,
      value,
      label: ddc,
    }));
    console.log('Dashboard: Books by DDC - Data:', processedDDC);
    return processedDDC;
  }, [books]);
  // --- End Data Processing ---

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading dashboard data: {error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Library Dashboard
      </Typography>

      {books.length === 0 ? (
        <Alert severity="info">No book data available to display charts. Add some books!</Alert>
      ) : (
        <React.Fragment>
          {/* Chart 1: Books by Copyright Year */}
          <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Books by Copyright Year
            </Typography>
            {years.length > 0 && booksByYear[0].data.length > 0 ? (
              <BarChart
                xAxis={[{ scaleType: 'band', data: years, label: 'Copyright Year' }]}
                yAxis={[{ label: 'Number of Books' }]}
                series={booksByYear}
                height={300}
                margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
              />
            ) : (
              <Typography variant="body2" sx={{ textAlign: 'center', p: 2 }}>
                No copyright year data to display. Ensure books have valid 'Copyright Year'.
              </Typography>
            )}
          </Paper>

          {/* Chart 2: Books by DDC (Dewey Decimal Classification) */}
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Books by DDC Classification
            </Typography>
            {booksByDDC.length > 0 ? (
              <PieChart
                series={[
                  {
                    data: booksByDDC,
                    arcLabel: (item) => `${item.label} (${item.value})`,
                    outerRadius: 120,
                    innerRadius: 60,
                    paddingAngle: 5,
                    cornerRadius: 5,
                    startAngle: -90,
                    endAngle: 270,
                  },
                ]}
                sx={{
                  [`& .${pieArcLabelClasses.root}`]: {
                    fill: 'white',
                    fontWeight: 'bold',
                  },
                }}
                height={300}
                margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
              />
            ) : (
              <Typography variant="body2" sx={{ textAlign: 'center', p: 2 }}>
                No DDC classification data to display. Ensure books have valid 'DDC'.
              </Typography>
            )}
          </Paper>
        </React.Fragment>
      )}
    </Box>
  );
}
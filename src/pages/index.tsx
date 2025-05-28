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
          // Fetch all books for dashboard aggregation
          const result = await booksDataSource.getMany({
            paginationModel: { page: 0, pageSize: 1000 }, // Fetch enough data
            filterModel: { items: [] },
            sortModel: [],
          });
          if (result && Array.isArray(result.items)) {
            setBooks(result.items);
          } else {
            setBooks([]);
          }
        } else {
          throw new Error("Books data source or its getMany method is not available.");
        }
      } catch (err: any) {
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
      if (book.copyright_year) {
        counts[book.copyright_year] = (counts[book.copyright_year] || 0) + 1;
      }
    });
    const sortedYears = Object.keys(counts).map(Number).sort((a, b) => a - b);
    const seriesData = sortedYears.map(year => counts[year]);
    return {
      years: sortedYears,
      booksByYear: [{ data: seriesData, label: 'Number of Books' }],
    };
  }, [books]);

  const booksByDDC = React.useMemo(() => {
    const counts: { [ddc: string]: number } = {};
    books.forEach(book => {
      if (book.ddc) {
        counts[book.ddc] = (counts[book.ddc] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([ddc, value], index) => ({
      id: index,
      value,
      label: ddc,
    }));
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
                No copyright year data to display.
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
                    arcLabel: (item) => `${item.label} (${item.value})`, // Show label and count
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
                    fill: 'white', // Ensure labels are visible
                    fontWeight: 'bold',
                  },
                }}
                height={300}
                margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
              />
            ) : (
              <Typography variant="body2" sx={{ textAlign: 'center', p: 2 }}>
                No DDC classification data to display.
              </Typography>
            )}
          </Paper>
        </React.Fragment>
      )}
    </Box>
  );
}
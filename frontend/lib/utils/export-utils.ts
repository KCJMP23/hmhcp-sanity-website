// Utility function to download data as CSV
export function downloadCSV(data: any[], filename: string) {
  // If data is empty, return early
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Extract headers from the first object
  const headers = Object.keys(data[0]);

  // Convert data to CSV
  const csvContent = [
    headers.join(','), // header row
    ...data.map(row => 
      headers
        .map(header => 
          // Escape any double quotes and wrap in quotes to handle commas in data
          `"${String(row[header]).replace(/"/g, '""')}"`
        )
        .join(',')
    )
  ].join('\n');

  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a link element to trigger the download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Utility function to export as JSON
export function downloadJSON(data: any, filename: string) {
  // If data is empty or undefined, return early
  if (!data) {
    console.warn('No data to export');
    return;
  }

  // Create a Blob with the JSON content
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  
  // Create a link element to trigger the download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Utility function to export as PDF (requires a PDF generation library)
export async function downloadPDF(data: any, filename: string) {
  // Note: This is a placeholder. In a real implementation, 
  // you would use a library like jsPDF to generate the PDF
  console.warn('PDF export not implemented. Consider using a library like jsPDF.');
}
import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Données");
  
  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(data[0] || {}).map(key => {
    const maxLen = Math.max(
      key.length,
      ...data.map(row => String(row[key] || '').length)
    );
    return { wch: Math.min(maxLen + 2, maxWidth) };
  });
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

import api from './api';

export async function downloadExcel(endpoint: string, filename: string): Promise<void> {
  try {
    const response = await api.get(endpoint, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Excel download failed:', error);
    throw new Error('엑셀 다운로드에 실패했습니다.');
  }
}

export async function uploadExcel(
  endpoint: string,
  file: File,
): Promise<{ success: boolean; message: string; count?: number }> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const { data: wrapped } = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      success: true,
      message: wrapped.data?.message || '업로드 성공',
      count: wrapped.data?.count,
    };
  } catch (error: unknown) {
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '업로드 실패';
    return { success: false, message: msg };
  }
}

export function printPDF(title: string) {
  // Create print-friendly version
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('팝업 차단을 해제해주세요.');
    return;
  }

  const content = document.querySelector('main') || document.querySelector('[class*="space-y"]');
  if (!content) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${title} - KCS WMS</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Pretendard', -apple-system, sans-serif; color: #191F28; padding: 20mm; font-size: 11px; }
        h1 { font-size: 18px; margin-bottom: 8px; }
        .print-header { border-bottom: 2px solid #191F28; padding-bottom: 12px; margin-bottom: 20px; }
        .print-date { font-size: 10px; color: #8B95A1; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th { background: #F7F8FA; font-weight: 600; text-align: left; padding: 8px 12px; border: 1px solid #E5E8EB; font-size: 10px; }
        td { padding: 6px 12px; border: 1px solid #E5E8EB; font-size: 10px; }
        tr:nth-child(even) { background: #FAFBFC; }
        .badge { padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 600; }
        .summary-row { font-weight: bold; background: #F7F8FA; }
        @media print {
          body { padding: 10mm; }
          button, nav, aside, .no-print { display: none !important; }
        }
        .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #E5E8EB; font-size: 9px; color: #8B95A1; text-align: center; }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>${title}</h1>
        <div class="print-date">출력일시: ${new Date().toLocaleString('ko-KR')} | KCS WMS</div>
      </div>
      ${content.innerHTML}
      <div class="footer">KCS WMS - 해외 창고관리 시스템 | Confidential</div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

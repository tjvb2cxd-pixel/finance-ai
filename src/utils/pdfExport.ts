import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BankAccount, Transaction, UserProfile } from '../types';

export interface ExportFinancialPDFOptions {
  userProfile?: UserProfile;
  selectedBanks: BankAccount[];
  allBanks: BankAccount[];
  transactions: Transaction[];
  dateRangeLabel: string;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  summary: {
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
  };
}

export const generateFinancialReportPDF = (options: ExportFinancialPDFOptions) => {
  const {
    userProfile,
    selectedBanks,
    transactions,
    dateRangeLabel,
    categoryBreakdown,
    summary,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Colors
  const primaryNavy = [11, 19, 37]; // #0b1325
  const darkCard = [14, 24, 48]; // #0e1830
  const cyanAccent = [6, 182, 212]; // #06b6d4
  const emeraldGreen = [16, 185, 129]; // #10b981
  const roseRed = [244, 63, 94]; // #f43f5e
  const textWhite = [255, 255, 255];
  const textSlateLight = [203, 213, 225];
  const textMuted = [148, 163, 184];

  // 1. Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent Line at top
  doc.setFillColor(cyanAccent[0], cyanAccent[1], cyanAccent[2]);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  // Logo / Brand
  doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('FIN', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(cyanAccent[0], cyanAccent[1], cyanAccent[2]);
  doc.text('INTELIGÊNCIA FINANCEIRA & OPEN FINANCE', 30, 18);

  // Document Subtitle & Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
  doc.text('Relatório Consolidado de Resumo Financeiro', 14, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textSlateLight[0], textSlateLight[1], textSlateLight[2]);
  const userText = userProfile ? `Perfil: ${userProfile.name}` : 'Perfil Ativo';
  const genDateText = `Emissão: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  doc.text(`${userText}   |   ${genDateText}   |   Período: ${dateRangeLabel}`, 14, 35);

  // 2. Section: Selected Banks Filter Badge
  let currentY = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('1. CONTAS E INSTITUIÇÕES INCLUÍDAS', 14, currentY);

  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const bankNames = selectedBanks.map(b => `${b.name} (${formatBRL(b.availableBalance)})`).join('  •  ');
  const bankNotice = selectedBanks.length === 1
    ? `Filtro ativo: ${selectedBanks[0].name} (1 conta selecionada)`
    : `Consolidação de ${selectedBanks.length} contas bancárias conectadas`;
  doc.text(bankNotice, 14, currentY);

  currentY += 4;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const wrappedBankList = doc.splitTextToSize(bankNames, pageWidth - 28);
  doc.text(wrappedBankList, 14, currentY);

  currentY += wrappedBankList.length * 4.5 + 4;

  // 3. Section: Summary KPI Cards
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('2. RESUMO EXECUTIVO CONSOLIDADO', 14, currentY);
  currentY += 5;

  const cardWidth = (pageWidth - 28 - 9) / 4;
  const cardHeight = 22;

  const kpis = [
    { label: 'Saldo em Contas', val: formatBRL(summary.totalBalance), color: cyanAccent, subtitle: `${selectedBanks.length} contas` },
    { label: 'Total Entradas', val: formatBRL(summary.totalIncome), color: emeraldGreen, subtitle: 'Receitas confirmadas' },
    { label: 'Total Saídas', val: formatBRL(summary.totalExpense), color: roseRed, subtitle: 'Despesas & boletos' },
    {
      label: 'Resultado Líquido',
      val: formatBRL(summary.netSavings),
      color: summary.netSavings >= 0 ? emeraldGreen : roseRed,
      subtitle: summary.netSavings >= 0 ? 'Superávit no período' : 'Déficit no período',
    },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = 14 + idx * (cardWidth + 3);
    // Card background
    doc.setFillColor(darkCard[0], darkCard[1], darkCard[2]);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'F');

    // Left color bar
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(cardX, currentY, 2, cardHeight, 1, 1, 'F');

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textSlateLight[0], textSlateLight[1], textSlateLight[2]);
    doc.text(kpi.label, cardX + 5, currentY + 6);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text(kpi.val, cardX + 5, currentY + 13);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(kpi.subtitle, cardX + 5, currentY + 18.5);
  });

  currentY += cardHeight + 8;

  // 4. Section: Category Distribution Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('3. DESPESAS POR CATEGORIA (CONTAS FILTRADAS)', 14, currentY);
  currentY += 3;

  const categoryTableData = categoryBreakdown.map((cat) => [
    cat.category,
    formatBRL(cat.amount),
    `${cat.percentage.toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Categoria', 'Total Gasto', '% do Total']],
    body: categoryTableData.length > 0 ? categoryTableData : [['Sem despesas registradas', 'R$ 0,00', '0.0%']],
    theme: 'grid',
    headStyles: {
      fillColor: [11, 19, 37],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // Calculate position after category table
  const finalCategoryY = (doc as any).lastAutoTable?.finalY || currentY + 30;
  currentY = finalCategoryY + 8;

  // Check if we need a new page or fit transactions
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // 5. Section: Transactions List Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('4. TRANSAÇÕES E LANÇAMENTOS DETALHADOS', 14, currentY);
  currentY += 3;

  const txTableData = transactions.slice(0, 40).map((tx) => [
    tx.date || tx.rawDate,
    tx.title,
    tx.bankName,
    tx.category,
    tx.type === 'income' ? `+ ${formatBRL(tx.amount)}` : `- ${formatBRL(tx.amount)}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Data', 'Descrição', 'Banco', 'Categoria', 'Valor']],
    body: txTableData.length > 0 ? txTableData : [['-', 'Nenhuma movimentação para o filtro selecionado', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [11, 19, 37],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 62 },
      2: { cellWidth: 32 },
      3: { cellWidth: 34 },
      4: { cellWidth: 30, halign: 'right' },
    },
    didParseCell: (data) => {
      // Colorize values
      if (data.section === 'body' && data.column.index === 4) {
        const text = String(data.cell.raw);
        if (text.startsWith('+')) {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        } else if (text.startsWith('-')) {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Footer for each page
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.text(
      'FIN Intelligent Platform • Documento gerado para controle e planejamento financeiro pessoal',
      14,
      pageHeight - 7
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 32, pageHeight - 7);
  }

  // Save PDF
  const sanitizedDate = new Date().toISOString().split('T')[0];
  const fileBankPart = selectedBanks.length === 1 ? selectedBanks[0].slug : 'todas-contas';
  const fileName = `relatorio-financeiro-fin-${fileBankPart}-${sanitizedDate}.pdf`;
  doc.save(fileName);
};

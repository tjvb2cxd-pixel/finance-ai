import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { PDFParse } from 'pdf-parse';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' })); // Increased limit for PDFs

// Initialize GoogleGenAI client lazily or safely
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize GoogleGenAI client:', e);
    }
  }
  return aiClient;
}

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: FIN Financial Assistant Ask Endpoint
app.post('/api/fin/ask', async (req, res) => {
  const { question, financialContext, context, userName } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Parâmetro question obrigatório.' });
  }

  const effectiveUserName = (typeof userName === 'string' && userName.trim()) ? userName.trim() : 'Tiago';
  const ai = getGenAI();

  const activeCtx = context || financialContext;
  const totalBal = activeCtx?.totalBalance !== undefined ? Number(activeCtx.totalBalance) : 0;
  const totalRec = activeCtx?.receitas !== undefined ? Number(activeCtx.receitas) : 0;
  const totalDesp = activeCtx?.despesas !== undefined ? Number(activeCtx.despesas) : 0;
  const banksDesc = Array.isArray(activeCtx?.banks)
    ? activeCtx.banks.map((b: any) => `${b.name}: R$ ${Number(b.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`).join(', ')
    : 'contas conectadas';
  const catDesc = Array.isArray(activeCtx?.categories)
    ? activeCtx.categories.map((c: any) => `${c.name}: R$ ${Number(c.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`).join(', ')
    : 'nenhuma despesa categorizada ainda';

  // If Gemini API is configured, try generation with fallback models
  if (ai) {
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    const systemInstruction = `Você é o "FIN", o assistente financeiro de inteligência artificial de elite do dashboard FINANCE AI.
O usuário atual se chama ${effectiveUserName}. Responda em português brasileiro de forma amigável, clara, direta, concisa e altamente profissional.
Utilize os dados financeiros consolidados em tempo real de ${effectiveUserName} para responder:
- Saldo total consolidado disponível: R$ ${totalBal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${banksDesc}).
- Receitas do mês: R$ ${totalRec.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
- Despesas do mês: R$ ${totalDesp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
- Despesas por categorias: ${catDesc}.

Regras:
1. Mantenha as respostas curtas (máximo 2 a 3 parágrafos ou tópicos curtos).
2. Dê números precisos baseados estritamente nos dados informados acima.
3. Seja sempre proativo e encorajador no controle financeiro.`;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: question,
          config: {
            systemInstruction,
            temperature: 0.5,
          },
        });

        const replyText = response.text?.trim();
        if (replyText) {
          return res.json({ answer: replyText });
        }
      } catch {
        // If candidate model is busy or throttled, try next candidate model silently
        continue;
      }
    }
  }

  // Intelligent Fallback Answers if Gemini Key is not supplied or network offline
  const lower = question.toLowerCase();
  let fallbackAnswer = '';
  const formatBRL = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (lower.includes('gastei') || lower.includes('gastos') || lower.includes('despesa')) {
    fallbackAnswer = `Suas despesas registradas totalizam ${formatBRL(totalDesp)} no momento. Detalhamento: ${catDesc}.`;
  } else if (lower.includes('disponível') || lower.includes('saldo') || lower.includes('tenho')) {
    fallbackAnswer = `Seu saldo total consolidado é de ${formatBRL(totalBal)}, distribuído em: ${banksDesc}.`;
  } else if (lower.includes('receita') || lower.includes('salário') || lower.includes('entrada')) {
    fallbackAnswer = `Suas receitas registradas no momento totalizam ${formatBRL(totalRec)}.`;
  } else if (lower.includes('categoria') || lower.includes('resumo')) {
    fallbackAnswer = `Divisão de despesas por categoria: ${catDesc}.`;
  } else {
    fallbackAnswer = `Olá, ${effectiveUserName}! Estou monitorando suas contas em tempo real. Seu saldo consolidado é de ${formatBRL(totalBal)} com ${formatBRL(totalRec)} de receitas e ${formatBRL(totalDesp)} de despesas. Como posso ajudar você hoje?`;
  }

  return res.json({ answer: fallbackAnswer });
});

// API: Simulate Open Finance Background Bank Sync
app.post('/api/banks/sync', async (req, res) => {
  // Simulate network latency of bank APIs
  await new Promise((resolve) => setTimeout(resolve, 800));

  const now = new Date();
  const timeString = `Hoje, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  res.json({
    success: true,
    lastSync: timeString,
    message: 'Todas as 6 contas bancárias foram sincronizadas com sucesso via Open Finance.',
  });
});

// API: Parse PDF Bank Statement
app.post('/api/parse-statement', async (req, res) => {
  try {
    const { base64Data, mimeType, fileName, isSample } = req.body;
    if (!isSample && !base64Data) {
      return res.status(400).json({ error: 'base64Data é obrigatório' });
    }

    // 1. Clean base64 and extract PDF Buffer
    const cleanBase64 = typeof base64Data === 'string' ? base64Data.replace(/^data:.*?;base64,/, '').trim() : '';
    const isValidBase64 =
      !isSample &&
      cleanBase64.length >= 32 &&
      !cleanBase64.includes('...') &&
      /^[A-Za-z0-9+/=]+$/.test(cleanBase64) &&
      cleanBase64.length % 4 === 0;

    let extractedPdfText = '';
    if (isValidBase64) {
      try {
        const pdfBuffer = Buffer.from(cleanBase64, 'base64');
        const parser = new PDFParse({ data: pdfBuffer });
        const parsedResult = await parser.getText();
        extractedPdfText = parsedResult.text || '';
        await parser.destroy();
      } catch (pdfErr) {
        console.warn('pdf-parse could not extract text directly:', pdfErr);
      }
    }

    // 2. Detect Bank from PDF content first, then filename, fallback to inter or itau
    const fullSearchText = `${fileName || ''}\n${extractedPdfText}`.toLowerCase();
    let detectedBankSlug = 'inter';
    let detectedBankName = 'Banco Inter';

    if (
      fullSearchText.includes('banco inter') ||
      fullSearchText.includes('intermedium') ||
      fullSearchText.includes('inter s.a') ||
      fullSearchText.includes('banco inter s.a') ||
      fullSearchText.includes('extrato de conta corrente inter') ||
      (fullSearchText.includes('inter') && !fullSearchText.includes('internet'))
    ) {
      detectedBankSlug = 'inter';
      detectedBankName = 'Banco Inter';
    } else if (
      fullSearchText.includes('itau') ||
      fullSearchText.includes('itaú') ||
      fullSearchText.includes('banco itau')
    ) {
      detectedBankSlug = 'itau';
      detectedBankName = 'Itaú';
    } else if (
      fullSearchText.includes('bradesco') ||
      fullSearchText.includes('banco bradesco')
    ) {
      detectedBankSlug = 'bradesco';
      detectedBankName = 'Bradesco';
    } else if (
      fullSearchText.includes('santander') ||
      fullSearchText.includes('banco santander')
    ) {
      detectedBankSlug = 'santander-pf';
      detectedBankName = 'Santander PF';
    } else if (
      fullSearchText.includes('nubank') ||
      fullSearchText.includes('nu pagamentos')
    ) {
      detectedBankSlug = 'nubank';
      detectedBankName = 'Nubank';
    } else if (
      fullSearchText.includes('mercado pago') ||
      fullSearchText.includes('mercadopago')
    ) {
      detectedBankSlug = 'mercado-pago';
      detectedBankName = 'Mercado Pago';
    } else if (
      fullSearchText.includes('c6 bank') ||
      fullSearchText.includes('banco c6')
    ) {
      detectedBankSlug = 'c6';
      detectedBankName = 'C6 Bank';
    } else {
      // Default to inter if ambiguous
      detectedBankSlug = 'inter';
      detectedBankName = 'Banco Inter';
    }

    const ai = getGenAI();
    let parsedData: { transactions: any[]; summary: string; finalBalance: number | null; bankSlug: string | null } | null = null;

    // 3. Try Gemini models with extracted text or inline PDF data
    if (ai) {
      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      const systemInstruction = `Você é um extrator de dados financeiros de altíssima precisão para extratos bancários brasileiros (como Banco Inter, Itaú, Bradesco, Santander, Nubank).
IMPORTANTE:
- Extraia EXCLUSIVAMENTE as transações REAIS que aparecem no documento ou texto fornecido.
- NUNCA invente, presuma ou gere transações fictícias que não estejam explícitas no extrato.
- Se o documento for do Banco Inter, defina bankSlug como "inter" e bankName como "Banco Inter".
- O valor da propriedade "amount" deve ser estritamente positivo (número).
- "type" deve ser "income" para entradas/créditos/pix recebidos, e "expense" para saídas/débitos/pagamentos/compras.
- Infira a categoria adequada entre: moradia, alimentacao, transporte, lazer, saude, outros.
- Retorne EXATAMENTE o objeto JSON:
{
  "summary": "Resumo objetivo de 1-2 frases com o total de transações e saldo final identificado.",
  "finalBalance": 1250.00,
  "bankName": "${detectedBankName}",
  "bankSlug": "${detectedBankSlug}",
  "transactions": [
    {
      "id": "gerar_id_unico",
      "title": "Descrição da transação exatamente como no extrato",
      "category": "Alimentação",
      "categoryKey": "alimentacao",
      "date": "DD/MM/YYYY",
      "rawDate": "YYYY-MM-DD",
      "amount": 100.50,
      "type": "expense",
      "bankName": "${detectedBankName}",
      "bankSlug": "${detectedBankSlug}"
    }
  ]
}`;

      // Approach A: If text was extracted from PDF, pass the actual text to Gemini
      if (extractedPdfText && extractedPdfText.trim().length > 30) {
        for (const model of candidateModels) {
          try {
            const prompt = `Analise o texto deste extrato bancário do ${detectedBankName} e extraia rigorosamente todas as transações reais encontradas:\n\n${extractedPdfText}`;
            const response = await ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                systemInstruction,
                responseMimeType: 'application/json',
                temperature: 0.1,
              },
            });

            const resultText = response.text?.trim() || '';
            if (resultText) {
              const resJson = JSON.parse(resultText);
              if (resJson && Array.isArray(resJson.transactions) && resJson.transactions.length > 0) {
                parsedData = resJson;
                break;
              }
            }
          } catch (err) {
            console.warn(`Text-based extraction attempt with ${model} failed, trying next...`, err);
          }
        }
      }

      // Approach B: If text approach didn't return transactions, pass inline PDF bytes to Gemini
      if ((!parsedData || !parsedData.transactions?.length) && isValidBase64) {
        for (const model of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType || 'application/pdf',
                  },
                },
                `Extraia as transações financeiras reais deste extrato bancário do ${detectedBankName} e o saldo final. Retorne apenas o JSON.`,
              ],
              config: {
                systemInstruction,
                responseMimeType: 'application/json',
                temperature: 0.1,
              },
            });

            const resultText = response.text?.trim() || '';
            if (resultText) {
              const resJson = JSON.parse(resultText);
              if (resJson && Array.isArray(resJson.transactions) && resJson.transactions.length > 0) {
                parsedData = resJson;
                break;
              }
            }
          } catch (err) {
            console.warn(`PDF inline extraction attempt with ${model} failed, trying next...`, err);
          }
        }
      }
    }

    // 4. Fallback: Parse extracted text deterministically using Regex (NEVER fake transactions!)
    if ((!parsedData || !parsedData.transactions || parsedData.transactions.length === 0) && extractedPdfText) {
      const lines = extractedPdfText.split(/\r?\n/);
      const extractedTxs: any[] = [];
      const dateRegex = /(\d{2}[\/\-\.]\d{2}(?:[\/\-\.]\d{4}|[\/\-\.]\d{2})?)/;
      let finalBalanceFound: number | null = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Try detecting final balance line
        const balMatch = trimmed.match(/saldo\s+(?:atual|final|dispon[ií]vel)[:\s]+(?:R\$\s*)?([-+]?\d{1,3}(?:\.\d{3})*,\d{2})/i);
        if (balMatch) {
          const balStr = balMatch[1].replace(/\./g, '').replace(',', '.');
          const parsedBal = parseFloat(balStr);
          if (!isNaN(parsedBal)) {
            finalBalanceFound = parsedBal;
          }
        }

        if (/saldo\s+(?:anterior|atual|final|bloqueado|projetado)/i.test(trimmed)) continue;
        if (/extrato\s+de|per[ií]odo|correntista|ag[eê]ncia|conta\s+corrente/i.test(trimmed)) continue;

        const dateMatch = trimmed.match(dateRegex);
        if (!dateMatch) continue;

        const dateStr = dateMatch[1];
        const numberMatches = Array.from(trimmed.matchAll(/([-+]?\s*(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}[-+]?)/g));
        if (numberMatches.length === 0) continue;

        const lastMatch = numberMatches[numberMatches.length - 1][0];
        const isNegative =
          lastMatch.includes('-') ||
          /\b(d[eé]bito|pagto|pagamento|enviado|compra|saque|tarifa|boleto)\b/i.test(trimmed);

        const cleanNumStr = lastMatch
          .replace(/[R$\s+]/g, '')
          .replace('-', '')
          .replace(/\./g, '')
          .replace(',', '.');
        const val = parseFloat(cleanNumStr);
        if (isNaN(val) || val === 0) continue;

        let desc = trimmed
          .replace(dateStr, '')
          .replace(lastMatch, '')
          .replace(/[-+]/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();

        if (!desc || desc.length < 2) {
          desc = isNegative ? 'Despesa Extrato' : 'Receita Extrato';
        }

        let displayDate = dateStr;
        let rawDate = new Date().toISOString().split('T')[0];
        const parts = dateStr.split(/[\/\-\.]/);
        if (parts.length >= 2) {
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          const y = parts[2]
            ? parts[2].length === 2
              ? '20' + parts[2]
              : parts[2]
            : new Date().getFullYear().toString();
          displayDate = `${d}/${m}/${y}`;
          rawDate = `${y}-${m}-${d}`;
        }

        // Categorize based on description keywords
        const descLower = desc.toLowerCase();
        let catName = 'Outros';
        let catKey = 'outros';

        if (descLower.includes('mercado') || descLower.includes('supermercado') || descLower.includes('restaurante') || descLower.includes('alimento') || descLower.includes('padaria') || descLower.includes('ifood')) {
          catName = 'Alimentação';
          catKey = 'alimentacao';
        } else if (descLower.includes('posto') || descLower.includes('combustivel') || descLower.includes('uber') || descLower.includes('estacionamento')) {
          catName = 'Transporte';
          catKey = 'transporte';
        } else if (descLower.includes('farmacia') || descLower.includes('drogaria') || descLower.includes('hospital') || descLower.includes('medico')) {
          catName = 'Saúde';
          catKey = 'saude';
        } else if (descLower.includes('aluguel') || descLower.includes('condominio') || descLower.includes('luz') || descLower.includes('agua') || descLower.includes('energia') || descLower.includes('internet')) {
          catName = 'Moradia';
          catKey = 'moradia';
        } else if (descLower.includes('cinema') || descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('show')) {
          catName = 'Lazer';
          catKey = 'lazer';
        } else if (!isNegative) {
          catName = 'Receita / Salário';
          catKey = 'receita';
        }

        extractedTxs.push({
          id: `tx-pdf-${Date.now()}-${extractedTxs.length}`,
          title: desc,
          amount: Math.abs(val),
          type: isNegative ? 'expense' : 'income',
          category: catName,
          categoryKey: catKey,
          date: displayDate,
          rawDate,
          bankName: detectedBankName,
          bankSlug: detectedBankSlug,
        });
      }

      if (extractedTxs.length > 0) {
        parsedData = {
          transactions: extractedTxs,
          summary: `Extrato do ${detectedBankName} processado com sucesso. Foram extraídas ${extractedTxs.length} transações reais diretamente do documento.`,
          finalBalance: finalBalanceFound,
          bankSlug: detectedBankSlug,
        };
      }
    }

    // 5. If STILL no transactions found, return empty array with helpful error message (NEVER return mock transactions)
    if (!parsedData || !Array.isArray(parsedData.transactions) || parsedData.transactions.length === 0) {
      return res.status(200).json({
        success: false,
        error: `Não foi possível identificar transações no arquivo PDF de ${detectedBankName}. Certifique-se de que o PDF não esteja bloqueado por senha ou protegido.`,
        transactions: [],
        bankSlug: detectedBankSlug,
      });
    }

    return res.json({
      success: true,
      transactions: parsedData.transactions || [],
      summary: parsedData.summary || `Extrato do ${detectedBankName} importado com sucesso.`,
      finalBalance: parsedData.finalBalance ?? null,
      bankSlug: parsedData.bankSlug || detectedBankSlug,
      bankName: detectedBankName,
    });
  } catch (error: any) {
    console.error('Statement parsing error:', error);
    res.status(500).json({ error: error.message || 'Erro interno ao processar o extrato em PDF.' });
  }
});

// Vite Middleware for Dev and SPA static serving in Production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production' || process.argv[1]?.endsWith('.cjs') || process.argv[1]?.includes('dist');

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Finance AI Server rodando na porta ${PORT}`);
  });
}

startServer();

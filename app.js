import dotenv from 'dotenv';
dotenv.config(); // read API Key
import { JSDOM } from "jsdom";
import axios from 'axios';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import path from 'path';
import fs, { readFileSync } from 'fs';
import { Document, Packer } from 'docx';
import mammoth from 'mammoth';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Hilfsfunktion: HTML/Text bereinigen
function cleanText(rawHtml) {
  try {
    const dom = new JSDOM(rawHtml);
    let text = dom.window.document.body.textContent || "";
    // Whitespace normalisieren
    text = text.replace(/\s+/g, " ").trim();
    // Menü-/Footer-Begriffe entfernen
    const stopwords = [
      "Impressum", "Datenschutz", "Hilfe", "Support",
      "FAQ", "Startseite", "Login", "Sign In", "Registrierung"
    ];
    stopwords.forEach(sw => {
      text = text.replace(new RegExp("\\b" + sw + "\\b", "gi"), "");
    });
    return text;
  } catch (e) {
    // Fallback: Nur Tags rauswerfen
    return rawHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
}
if (!process.env.OPENAI_API_KEY) {
  console.error('[CONFIG] OPENAI_API_KEY is not set. OpenAI requests will fail (401).');
}


// --- Cron configuration via ENV ---
const ENABLE_CRON = String(process.env.ENABLE_CRON || 'true').toLowerCase() === 'true';
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 3 * * *'; // default: 03:00 UTC (05:00 DE im Sommer)
const CRON_TZ = process.env.TZ || 'Europe/Berlin';

// --- Weaviate client (optional) ---
let weaviateClient = null;
let weaviateAvailable = false;
let WEAVIATE_CLASS = process.env.WEAVIATE_CLASS || 'Gymnasiumalsterschulbuero';

(async () => {
  try {
    const mod = await import('weaviate-ts-client');

    // The client may be the default export or nested under .client
    const defaultOrNs = mod.default || mod;
    const { ApiKey } = mod;

    const makeClient =
      typeof defaultOrNs === 'function'
        ? defaultOrNs
        : (typeof defaultOrNs.client === 'function' ? defaultOrNs.client : null);

    if (!makeClient) {
      console.log('[WEAVIATE] unexpected module shape:', Object.keys(mod));
      throw new Error('Unsupported weaviate-ts-client export shape');
    }

    const scheme = process.env.WEAVIATE_SCHEME || 'https';
    const host = process.env.WEAVIATE_HOST;
    const apiKey = process.env.WEAVIATE_API_KEY;

    if (host) {
      weaviateClient = makeClient({
        scheme,
        host,
        apiKey: apiKey ? new ApiKey(apiKey) : undefined,
        headers: {
          'X-Weaviate-Cluster-Url': `${scheme}://${host}`,
        },
      });
      weaviateAvailable = true;
      console.log('[WEAVIATE] configured:', scheme + '://' + host, 'class=', WEAVIATE_CLASS);
    } else {
      console.log('[WEAVIATE] not configured (missing WEAVIATE_HOST). Falling back to local embeddings.');
    }
  } catch (e) {
    console.log('[WEAVIATE] client import failed:', e.message);
  }
})();

const app = express();

import { crawlWebsite } from './crawler.js';

let docContent = ''; // Variable to store extracted .docx content

let docChunks = []; // To store document chunks

const filePath = path.join(__dirname, 'output.docx');
console.log('[DOC] expected path:', filePath, 'exists:', fs.existsSync(filePath));

async function loadDoc() {
    try {
        const stat = fs.statSync(filePath);
        docChunks = await extractTextFromDocx(filePath);
        console.log(`[DOC] loaded ${docChunks.length} chunks from ${filePath} size=${stat.size} mtime=${stat.mtime.toISOString()}`);
    } catch (error) {
        console.warn("Warnung: Dokument konnte nicht geladen werden. Chatbot läuft trotzdem.", error.message);
    }
}

// Function to read and extract text from .docx file
const extractTextFromDocx = async (filePath) => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        const paragraphs = result.value.split(/\n+/).filter((para) => para.trim() !== '');
        return paragraphs;
    } catch (error) {
        console.error('Error reading .docx file:', error);
        throw error;
    }
};

const generateEmbedding = async (text) => {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
            model: 'text-embedding-3-small',
            input: text,
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );
    return response.data.data[0].embedding;
};

// Function to calculate cosine similarity
const cosineSimilarity = (vecA, vecB) => {
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
};

const preprocessText = (text) =>
  text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

let WEAV_SCHEMA_CACHE = { fields: null };

async function getWeaviateStringFields() {
  if (!weaviateAvailable || !weaviateClient) return [];
  if (WEAV_SCHEMA_CACHE.fields) return WEAV_SCHEMA_CACHE.fields;
  try {
    const schema = await weaviateClient.schema.getter().do();
    const classes = (schema && schema.classes) || [];
    const clazz = classes.find(c => (c.class === WEAVIATE_CLASS) || (c.class === WEAVIATE_CLASS.replace(/-/g, '_')));
    if (!clazz) return [];
    // Pick searchable properties: text/string and include 'date' so we can return dates
    const props = (clazz.properties || []).filter(p => {
      const dt = (p.dataType && p.dataType[0] ? String(p.dataType[0]) : '').toLowerCase();
      return dt === 'text' || dt === 'string' || dt === 'date' || dt === 'text[]' || dt === 'string[]';
    });
    const names = props.map(p => p.name);
    WEAV_SCHEMA_CACHE.fields = names;
    console.log('[WEAVIATE] detected fields for', WEAVIATE_CLASS + ':', names);
    return names;
  } catch (e) {
    console.warn('[WEAVIATE] schema getter failed:', e.message);
    return [];
  }
}

// Ensure the target Weaviate class exists (minimal text schema)
async function ensureWeaviateClass() {
  if (!weaviateAvailable || !weaviateClient) return false;
  try {
    const schema = await weaviateClient.schema.getter().do();
    const classes = (schema && schema.classes) || [];
    const exists = classes.some(c => (c.class === WEAVIATE_CLASS) || (c.class === WEAVIATE_CLASS.replace(/-/g, '_')));
    if (exists) return true;

    // Try to create a simple class; prefer server-side vectorizer if available
    const newClass = {
      class: WEAVIATE_CLASS,
      vectorizer: 'text2vec-openai', // requires module on server; if missing, Weaviate will error and we fallback below
      moduleConfig: {
        'text2vec-openai': { vectorizeClassName: true }
      },
      properties: [
        { name: 'text', dataType: ['text'] },
        { name: 'index', dataType: ['int'] },
        { name: 'source', dataType: ['text'] },
        { name: 'fileUrl', dataType: ['text'] }, // Neue Property für PDF-Links
        { name: 'title', dataType: ['text'] },   // Neue Property für Dokumenttitel
      ]
    };
    try {
      await weaviateClient.schema.classCreator().withClass(newClass).do();
      console.log('[WEAVIATE] class created with text2vec-openai:', WEAVIATE_CLASS);
      return true;
    } catch (e) {
      console.warn('[WEAVIATE] class creation with text2vec-openai failed, retrying without vectorizer:', e.message);
      // Retry without vectorizer; nearText won't work without a vectorizer, but we keep schema minimal
      const fallbackClass = { ...newClass };
      delete fallbackClass.vectorizer;
      delete fallbackClass.moduleConfig;
      await weaviateClient.schema.classCreator().withClass(fallbackClass).do();
      console.log('[WEAVIATE] class created without server-side vectorizer:', WEAVIATE_CLASS);
      return true;
    }
  } catch (err) {
    console.error('[WEAVIATE] ensure class failed:', err?.message || err);
    return false;
  }
}

// Upload chunks to Weaviate (idempotent by cleaning previous crawler docs)
async function saveChunksToWeaviate(chunks) {
  if (!weaviateAvailable || !weaviateClient) {
    console.warn('[WEAVIATE] client not available, skipping upload');
    return;
  }
  const ok = await ensureWeaviateClass();
  if (!ok) {
    console.warn('[WEAVIATE] class not ready, skipping upload');
    return;
  }

  // Optional: delete previous crawler-sourced objects to avoid duplicates
  try {
    await weaviateClient.batch.objectsBatchDeleter()
      .withClassName(WEAVIATE_CLASS)
      .withWhere({ path: ['source'], operator: 'Equal', valueText: 'crawler' })
      .do();
    console.log('[WEAVIATE] old crawler objects deleted');
  } catch (e) {
    console.warn('[WEAVIATE] batch delete skipped/failed:', e?.message || e);
  }

  // Upload new chunks
  let created = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = { text: chunks[i] };
    if (!chunk.text) continue;
    try {
      // Generate embedding so that the object is vectorized even if
      // the Weaviate instance has no server-side vectorizer modules.
      let vector = null;
      try {
        vector = await generateEmbedding(chunk.text);
      } catch (embedErr) {
        console.warn('[WEAVIATE] embedding failed for chunk', i, '-', embedErr?.message || embedErr);
      }

      // Clean text before upload
      const cleaned = cleanText(chunk.text || "");
      if (cleaned.length > 0) {
        const creator = weaviateClient.data.creator()
          .withClassName(WEAVIATE_CLASS)
          .withProperties({ text: cleaned, index: i, source: 'crawler' });
        if (Array.isArray(vector)) creator.withVector(vector);
        await creator.do();
        created++;
      }
    } catch (err) {
      console.error('[WEAVIATE] error saving chunk', i, '-', err?.message || err);
    }
  }
  console.log(`[WEAVIATE] uploaded ${created}/${chunks.length} chunks to class ${WEAVIATE_CLASS}`);
}

// Neue Funktion: PDF-Link in Weaviate speichern
async function savePdfToWeaviate(title, fileUrl, content = '') {
  if (!weaviateAvailable || !weaviateClient) {
    console.warn('[WEAVIATE] client not available, cannot save PDF');
    return false;
  }
  
  const ok = await ensureWeaviateClass();
  if (!ok) {
    console.warn('[WEAVIATE] class not ready, cannot save PDF');
    return false;
  }

  try {
    // Generate embedding für den Inhalt (falls vorhanden)
    let vector = null;
    if (content) {
      try {
        vector = await generateEmbedding(content);
      } catch (embedErr) {
        console.warn('[WEAVIATE] embedding failed for PDF content:', embedErr?.message || embedErr);
      }
    }

    // PDF-Objekt in Weaviate speichern
    const creator = weaviateClient.data.creator()
      .withClassName(WEAVIATE_CLASS)
      .withProperties({ 
        text: content || title, 
        title: title, 
        fileUrl: fileUrl, 
        source: 'pdf',
        index: Date.now() // Eindeutiger Index basierend auf Zeitstempel
      });
    
    if (Array.isArray(vector)) creator.withVector(vector);
    await creator.do();
    
    console.log(`[WEAVIATE] PDF saved: ${title}`);
    return true;
  } catch (err) {
    console.error('[WEAVIATE] error saving PDF:', err?.message || err);
    return false;
  }
}

// Query Weaviate for relevant chunks (if configured)
async function findRelevantChunksWeaviate(userQuery, topK = 6) {
  if (!weaviateAvailable || !weaviateClient) return [];

  // Felder dynamisch lesen (z.B. ['content','date','source','test','text'])
  const fields = await getWeaviateStringFields();
  const fieldList = (fields && fields.length) ? fields.join(' ') : 'text index source content date title fileUrl';

  // Query-Embedding lokal erzeugen (da der Cluster keinen nearText unterstützt)
  const qVec = await generateEmbedding(userQuery);

  const res = await weaviateClient.graphql.get()
    .withClassName(WEAVIATE_CLASS)
    .withFields(`${fieldList} _additional { id distance }`)
    .withNearVector({ vector: qVec })
    .withLimit(topK)
    .do();

  const items = ((((res || {}).data || {}).Get || {})[WEAVIATE_CLASS]) || [];
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const dateStr = item.date || item.Datum || item.datum || item.Date || '';
    const parts = [];

    if (dateStr) parts.push(String(Array.isArray(dateStr) ? dateStr.join(' ') : dateStr));

    const ordered = ['text','content','source','test','index','title','fileUrl']
      .concat((fields || []).filter(f => !['text','content','source','test','index','date','Datum','Date','datum','title','fileUrl'].includes(f)));

    const rest = ordered
      .map(n => item[n])
      .filter(Boolean)
      .map(v => Array.isArray(v) ? v.join(' ') : String(v))
      .join(' – ');

    if (rest) parts.push(rest);

    // PDF-Link hinzufügen, falls vorhanden
    if (item.fileUrl) {
      parts.push(`PDF: ${item.title || 'Dokument'} [${item.fileUrl}]`);
    }

    return parts.join(' – ').trim();
  }).filter(Boolean);
}

// Function to find the most relevant chunks
const findRelevantChunks = async (userQuery, chunks, topK = 6) => {
    const queryEmbedding = await generateEmbedding(preprocessText(userQuery));
    const chunkEmbeddings = await Promise.all(
        chunks.map(async (chunk) => ({
            text: chunk,
            embedding: await generateEmbedding(preprocessText(chunk)),
        }))
    );

    const similarities = chunkEmbeddings.map((chunk) => ({
        text: chunk.text,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map((chunk) => chunk.text);
};

// Read the .docx file at startup and store the content
(async () => {
    await loadDoc();
    console.log('[DOC] watching for changes on:', filePath);
    // Watch for local changes and hot-reload the document
    fs.watchFile(filePath, { interval: 2000 }, async (curr, prev) => {
        if (curr.mtimeMs !== prev.mtimeMs) {
            console.log('[DOC] change detected, reloading…');
            await loadDoc();
        }
    });
})();

async function runCrawlerAndReload() {
    const startedAt = new Date();
    console.log(`[CRON] ${startedAt.toISOString()} – starting crawl…`);
    try {
        await crawlWebsite();
        docChunks = await extractTextFromDocx(filePath);
        await saveChunksToWeaviate(docChunks);
        console.log(`[CRON] crawl finished. Reloaded chunks: ${docChunks.length}`);
    } catch (error) {
        console.error('[CRON] error during scheduled crawl:', error?.message || error);
    } finally {
        const endedAt = new Date();
        const ms = endedAt - startedAt;
        console.log(`[CRON] ${endedAt.toISOString()} – job done in ${ms} ms`);
    }
}

if (ENABLE_CRON) {
  const schedule = (CRON_SCHEDULE || '').trim();
  if (cron.validate(schedule)) {
    cron.schedule(schedule, runCrawlerAndReload, { timezone: CRON_TZ });
    console.log(`[CRON] enabled – schedule="${schedule}" timezone=${CRON_TZ}`);
  } else {
    console.warn(`[CRON] invalid CRON_SCHEDULE="${schedule}", cron disabled`);
  }
} else {
  console.log('[CRON] disabled via ENABLE_CRON=false');
}

// Start the server regardless of .docx success
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3001;
app.listen(PORT, HOST, () => {
  console.log(`Server läuft auf Port ${PORT} (Host: ${HOST})`);
});


//const systemPrompt = `Fragen zur Gymnasium Alster beantworten. Beziehe dich dabei auf Informationen: ${docContent}`;


// Middleware to parse JSON request bodies and handle CORS
app.use(express.json());
app.use(cors({ origin: '*' })); // Allow all origins (restrict in production)

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/debug/doc', (_req, res) => {
    const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
    res.json({
        path: filePath,
        exists: !!stat,
        size: stat?.size || null,
        mtime: stat?.mtime ? stat.mtime.toISOString() : null,
        chunks: docChunks.length,
        sample: docChunks.slice(0, 3)
    });
});


app.post('/admin/reload-doc', async (_req, res) => {
    await loadDoc();
    res.json({ ok: true, chunks: docChunks.length });
});

// Route to trigger crawl → reload → upload pipeline
app.post('/admin/run-crawl-now', async (_req, res) => {
    try {
        const startedAt = Date.now();
        await runCrawlerAndReload();
        const ms = Date.now() - startedAt;
        res.json({ ok: true, ran: true, duration_ms: ms, chunks: docChunks.length });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
});

// Chatbot route
app.post('/chat', async (req, res) => {
    console.log("aaaaa");
    const { message: userMessage, memory } = req.body;
    //userMessage = correctSpelling(userMessage);

    if (!userMessage) {
        return res.status(400).json({ reply: "I didn't receive a message!" });
    }
    if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ reply: 'Der Dienst ist derzeit nicht korrekt konfiguriert (OPENAI_API_KEY fehlt). Bitte wenden Sie sich an den Administrator.' });
    }

    try {
        let relevantChunks = [];
        let pdfLinks = [];
        
        try {
            // Try Weaviate first
            relevantChunks = await findRelevantChunksWeaviate(userMessage, 6);
            if (relevantChunks && relevantChunks.length) {
                console.log('[RAG] using Weaviate results:', relevantChunks.slice(0, 2));
                
                // Extract PDF links from Weaviate results
                pdfLinks = relevantChunks
                    .filter(chunk => chunk.includes('PDF:'))
                    .map(chunk => {
                        const match = chunk.match(/PDF:\s*(.*?)\s*\[(https?:\/\/[^\s\]]+)\]/);
                        return match ? { title: match[1], url: match[2] } : null;
                    })
                    .filter(Boolean);
            }
            
            // If no PDF links found in relevant chunks, search specifically for PDFs
            if (pdfLinks.length === 0) {
                try {
                    const pdfResults = await weaviateClient.graphql.get()
                        .withClassName(WEAVIATE_CLASS)
                        .withFields('title fileUrl')
                        .withWhere({
                            path: ['source'],
                            operator: 'Equal',
                            valueText: 'pdf'
                        })
                        .withLimit(10)
                        .do();
                    
                    const pdfItems = ((((pdfResults || {}).data || {}).Get || {})[WEAVIATE_CLASS]) || [];
                    pdfLinks = pdfItems
                        .filter(item => item.title && item.fileUrl)
                        .map(item => ({ title: item.title, url: item.fileUrl }));
                    
                    console.log('[PDF] found PDFs in direct search:', pdfLinks);
                } catch (e) {
                    console.warn('[PDF] direct PDF search failed:', e.message);
                }
            }
        } catch (e) {
            console.warn('[WEAVIATE] query failed, falling back to local embeddings:', e.message);
        }

        if (!relevantChunks || relevantChunks.length === 0) {
            // Fallback to local (docx) embedding search
            relevantChunks = await findRelevantChunks(userMessage, docChunks);
        }

        if (!relevantChunks || relevantChunks.length === 0) {
            console.error('No relevant chunks found after querying Weaviate and local fallback.');
            return res.status(500).json({ reply: "Leider habe ich keine passenden Informationen zu Ihrer Anfrage gefunden. Schreiben Sie uns gerne eine Email mit Ihrer Anfrage an: info@deepdive-ki.de" });
        } else {
            console.log('[RAG] relevant chunks count:', relevantChunks.length, 'sample:', relevantChunks.slice(0, 2));
            console.log('[PDF] found PDF links:', pdfLinks);
        }

        const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
        const docVersion = stat?.mtime ? stat.mtime.toISOString() : 'unknown';
        const safeMemory = memory || '(none)';

        // Construct the system prompt
        const systemPrompt = `
You are an expert assistant for answering questions about the Gymnasium Alster.
Only answer using the information in the section "Relevant Information" below. If the answer is not fully contained there, say you don't know and suggest contacting the school.

Document version (mtime): ${docVersion}

### Relevant Information:
${relevantChunks.join('\n\n')}

${pdfLinks.length > 0 ? `### Available PDF Documents:
${pdfLinks.map(pdf => `- ${pdf.title}: ${pdf.url}`).join('\n')}` : ''}

### User's Message History:
${safeMemory}

### CRITICAL FORMATTING RULES:
1. NEVER use markdown links like [Title](URL) for PDFs
2. ALWAYS use the exact format: "PDF: [Title] [URL]" for PDF documents
3. Example: "PDF: Test PDF [https://example.com/test.pdf]"
4. This format is required for the frontend to work properly

### Instructions:
1. Strictly ground your answer in the relevant information above.
2. If the user requests a different language or format, follow it as long as you stay grounded.
3. If the question cannot be answered with the provided information, explicitly say so and provide the school contact suggestion.
4. If there are PDF documents available and the user asks for them, you MUST respond with the exact format: "PDF: [Title] [URL]"
5. Do not use markdown links [Title](URL) for PDFs - use the exact format "PDF: [Title] [URL]"
Be polite, professional, and concise.`;

        // Call OpenAI GPT API
        const gptResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini', // Choose the model (e.g., gpt-4 or gpt-3.5-turbo)
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                max_tokens: 200, // Limit the response length
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Extract the bot's reply from the API response
        let botResponse = gptResponse.data.choices[0].message.content;
        
        // If we have PDF links, ensure they are in the correct format
        if (pdfLinks.length > 0) {
            // Replace any markdown links with the correct PDF format
            pdfLinks.forEach(pdf => {
                const markdownPattern = new RegExp(`\\[${pdf.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\(${pdf.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
                const correctFormat = `PDF: ${pdf.title} [${pdf.url}]`;
                botResponse = botResponse.replace(markdownPattern, correctFormat);
            });
            
            // Also check if the response mentions PDFs but doesn't use the correct format
            if (botResponse.includes('PDF') && !botResponse.includes('PDF:')) {
                pdfLinks.forEach(pdf => {
                    if (botResponse.includes(pdf.title) && botResponse.includes(pdf.url)) {
                        // Replace the entire response with the correct format
                        botResponse = `Hier ist das ${pdf.title}: PDF: ${pdf.title} [${pdf.url}]`;
                    }
                });
            }
            
            // If the response still contains markdown links, force the correct format
            if (botResponse.includes('[') && botResponse.includes('](') && botResponse.includes(')')) {
                pdfLinks.forEach(pdf => {
                    if (botResponse.includes(pdf.title) && botResponse.includes(pdf.url)) {
                        botResponse = `Hier ist das ${pdf.title}: PDF: ${pdf.title} [${pdf.url}]`;
                    }
                });
            }
            
            // Final check: if any markdown links remain, replace them all
            if (botResponse.includes('[') && botResponse.includes('](') && botResponse.includes(')')) {
                pdfLinks.forEach(pdf => {
                    const regex = new RegExp(`\\[.*?\\]\\(${pdf.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
                    botResponse = botResponse.replace(regex, `PDF: ${pdf.title} [${pdf.url}]`);
                });
            }
            
            // Ultimate fallback: if still contains markdown, completely rewrite the response
            if (botResponse.includes('[') && botResponse.includes('](') && botResponse.includes(')')) {
                const pdf = pdfLinks[0]; // Use the first PDF
                botResponse = `Hier ist das ${pdf.title}: PDF: ${pdf.title} [${pdf.url}]`;
            }
            
            // Final safety check: if response still contains markdown, force rewrite
            if (botResponse.includes('[') && botResponse.includes('](') && botResponse.includes(')')) {
                const pdf = pdfLinks[0];
                botResponse = `PDF: ${pdf.title} [${pdf.url}]`;
            }
            
            // Last resort: completely override the response if markdown persists
            if (botResponse.includes('[') && botResponse.includes('](') && botResponse.includes(')')) {
                const pdf = pdfLinks[0];
                botResponse = `PDF: ${pdf.title} [${pdf.url}]`;
            }
            
            // Nuclear option: if any markdown remains, completely rewrite
            if (botResponse.includes('[') && botResponse.includes('](') && botResponse.includes(')')) {
                const pdf = pdfLinks[0];
                botResponse = `PDF: ${pdf.title} [${pdf.url}]`;
            }
            
            // Final nuclear option: completely override response
            if (botResponse.includes('[') && botResponse.includes('](') && botResponse.includes(')')) {
                const pdf = pdfLinks[0];
                botResponse = `PDF: ${pdf.title} [${pdf.url}]`;
            }
        }
        
        //console.log('Response sent to client:', botResponse);

        // Send the response to the user
        res.json({ reply: botResponse });
    } catch (error) {
        console.error('Error communicating with OpenAI API:', error.message);

        // Return an error response
        console.log("bjoern");
        res.status(500).json({
            reply: "Sorry, I encountered an issue generating a response. Try again later.",
        });
    }
});

// Neuer Endpunkt: PDF-Link speichern
app.post('/pdf', async (req, res) => {
    const { title, fileUrl, content } = req.body;
    
    if (!title || !fileUrl) {
        return res.status(400).json({ 
            success: false, 
            error: 'Title und fileUrl sind erforderlich' 
        });
    }

    try {
        const success = await savePdfToWeaviate(title, fileUrl, content);
        
        if (success) {
            res.json({ 
                success: true, 
                message: `PDF "${title}" wurde erfolgreich gespeichert` 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'PDF konnte nicht gespeichert werden' 
            });
        }
    } catch (error) {
        console.error('Error saving PDF:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Interner Server-Fehler beim Speichern des PDFs' 
        });
    }
});


// Debug endpoint to test Weaviate connectivity
app.get('/debug/weaviate', async (_req, res) => {
  try {
    if (!weaviateAvailable || !weaviateClient) {
      return res.status(200).json({ ok: false, reason: 'client_not_ready_or_not_configured' });
    }
    const fields = await getWeaviateStringFields();
    const probeFields = (fields && fields.length) ? fields.join(' ') : 'text content source';
    const qVec = await generateEmbedding('Test');

    const probe = await weaviateClient.graphql.get()
      .withClassName(WEAVIATE_CLASS)
      .withFields(`${probeFields} _additional { id distance }`)
      .withNearVector({ vector: qVec })
      .withLimit(2)
      .do();

    res.json({ ok: true, fields, probe });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

/**
 * Debug: search top-K chunks in Weaviate with a free-text query.
 * Usage:
 *   GET /debug/chunks?q=Wer%20ist%20die%20Schulleiterin%3F&k=5
 */
app.get('/debug/chunks', async (req, res) => {
  try {
    if (!weaviateAvailable || !weaviateClient) {
      return res.status(200).json({ ok: false, reason: 'client_not_ready_or_not_configured' });
    }

    const q = String(req.query.q || 'Test');
    const k = Math.max(1, Math.min(50, parseInt(String(req.query.k || '6'), 10) || 6));

    // Resolve available string fields in the class (e.g. text, content, source, index, date, …)
    const fields = await getWeaviateStringFields();
    const fieldList = (fields && fields.length) ? fields.join(' ') : 'text index source content date';

    // Build query vector locally (cluster might not support nearText)
    const qVec = await generateEmbedding(q);

    const raw = await weaviateClient.graphql.get()
      .withClassName(WEAVIATE_CLASS)
      .withFields(`${fieldList} _additional { id distance }`)
      .withNearVector({ vector: qVec })
      .withLimit(k)
      .do();

    const items = ((((raw || {}).data || {}).Get || {})[WEAVIATE_CLASS]) || [];

    // Shape simplified results
    const results = items.map((it) => {
      const id = it?._additional?.id || null;
      const distance = it?._additional?.distance;
      const source = it?.source ?? it?.Source ?? null;
      const index = (typeof it?.index !== 'undefined') ? it.index : (typeof it?.Index !== 'undefined' ? it.Index : null);

      // Prefer 'text' then 'content' then any other field for preview
      const previewFieldOrder = ['text', 'content'].concat((fields || []).filter(f => !['text', 'content', 'source', 'index', 'date'].includes(f)));
      let preview = '';
      for (const f of previewFieldOrder) {
        if (it && it[f]) {
          preview = Array.isArray(it[f]) ? it[f].join(' ') : String(it[f]);
          break;
        }
      }
      if (!preview) preview = '';

      // Trim preview for readability
      const trimmed = preview.length > 320 ? preview.slice(0, 320) + '…' : preview;

      return { id, distance, source, index, preview: trimmed };
    });

    res.json({ ok: true, q, k, class: WEAVIATE_CLASS, fields, count: results.length, results, raw });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

app.get('/debug/health', (_req, res) => {
  res.json({
    ok: true,
    node: process.version,
    weaviate: {
      available: weaviateAvailable,
      class: WEAVIATE_CLASS,
    },
    env: {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      WEAVIATE_HOST: !!process.env.WEAVIATE_HOST,
      WEAVIATE_CLASS: process.env.WEAVIATE_CLASS || WEAVIATE_CLASS,
    }
  });
});

// Default route (serves the frontend `index.html`)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export { runCrawlerAndReload };

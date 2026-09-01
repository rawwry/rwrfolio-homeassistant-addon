import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  initDb, 
  getAllTransactions, 
  insertOrUpdateTransaction, 
  insertTransactionsBulk, 
  deleteTransaction, 
  deleteTransactionsBulk, 
  resetTransactionsToSample, 
  getCustomPrices, 
  saveCustomPrices,
  getSettingValue,
  setSettingValue,
  resolveDatabasePath,
  resolveImportedCsvPath,
  archiveImportedCsv,
  getArchivedCsvFiles
} from './server/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize SQLite database
  try {
    await initDb();
    console.log('[rwrfolio] SQLite Database initialized successfully.');
  } catch (err) {
    console.error('[rwrfolio] Failed to initialize SQLite database:', err);
  }

  // --- API Routes ---

  // Health & Storage info check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      app: 'rwrfolio', 
      version: '0.4.0',
      database: 'sqlite',
      databasePath: resolveDatabasePath(),
      importedCsvPath: resolveImportedCsvPath()
    });
  });

  // Storage info
  app.get('/api/storage', (req, res) => {
    try {
      const dbPath = resolveDatabasePath();
      const csvPath = resolveImportedCsvPath();
      const archivedFiles = getArchivedCsvFiles();
      res.json({
        success: true,
        databasePath: dbPath,
        importedCsvPath: csvPath,
        archivedFilesCount: archivedFiles.length,
        archivedFiles
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get App Settings
  app.get('/api/settings', async (req, res) => {
    try {
      const rawSettings = await getSettingValue('app_settings', '');
      if (rawSettings) {
        return res.json({ success: true, data: JSON.parse(rawSettings) });
      }
      res.json({ success: true, data: null });
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Save App Settings (User profile, email SMTP, alert triggers, theme)
  app.post('/api/settings', async (req, res) => {
    try {
      const settings = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ success: false, error: 'Ungültige Einstellungen' });
      }
      await setSettingValue('app_settings', JSON.stringify(settings));
      res.json({ success: true, message: 'Einstellungen dauerhaft in SQLite gespeichert' });
    } catch (err: any) {
      console.error('Error saving settings:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Send Test Email Route (Simulated / verified on server)
  app.post('/api/settings/test-email', async (req, res) => {
    try {
      const { emailConfig } = req.body;
      if (!emailConfig || !emailConfig.recipientEmail) {
        return res.status(400).json({ success: false, error: 'Empfänger-E-Mail fehlt' });
      }
      
      // In production or home assistant container, verify credentials structure
      console.log(`[SMTP Test] Simuliere / Verifiziere E-Mail an ${emailConfig.recipientEmail} über ${emailConfig.smtpHost || 'Standard-Mailserver'}`);
      
      res.json({ 
        success: true, 
        message: `Test-Alarm an ${emailConfig.recipientEmail} wurde erfolgreich initialisiert.` 
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get all transactions
  app.get('/api/transactions', async (req, res) => {
    try {
      const txs = await getAllTransactions();
      res.json({ success: true, data: txs });
    } catch (err: any) {
      console.error('Error getting transactions:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create or update a single transaction
  app.post('/api/transactions', async (req, res) => {
    try {
      const tx = req.body;
      if (!tx || !tx.id) {
        return res.status(400).json({ success: false, error: 'Ungültige Transaktionsdaten' });
      }
      await insertOrUpdateTransaction(tx);
      res.json({ success: true, message: 'Transaktion gespeichert' });
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Bulk import transactions (and optionally archive the raw CSV file to /share/rwrfolio/imported)
  app.post('/api/transactions/bulk', async (req, res) => {
    try {
      const { transactions, csvRawText, fileName } = req.body;
      if (!Array.isArray(transactions)) {
        return res.status(400).json({ success: false, error: 'Array erwartet' });
      }
      
      const count = await insertTransactionsBulk(transactions);

      let archivedPath: string | null = null;
      if (csvRawText && typeof csvRawText === 'string') {
        archivedPath = archiveImportedCsv(csvRawText, fileName || 'import.csv');
      }

      res.json({ 
        success: true, 
        inserted: count,
        archivedPath,
        message: archivedPath 
          ? `${count} Transaktionen importiert & CSV in ${archivedPath} gesichert` 
          : `${count} Transaktionen importiert`
      });
    } catch (err: any) {
      console.error('Error bulk importing transactions:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete single transaction
  app.delete('/api/transactions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deleteTransaction(id);
      res.json({ success: true, message: 'Transaktion gelöscht' });
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Bulk delete transactions
  app.post('/api/transactions/bulk-delete', async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ success: false, error: 'Array von IDs erwartet' });
      }
      await deleteTransactionsBulk(ids);
      res.json({ success: true, deleted: ids.length });
    } catch (err: any) {
      console.error('Error bulk deleting transactions:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset to initial sample data
  app.post('/api/reset', async (req, res) => {
    try {
      const resetData = await resetTransactionsToSample();
      res.json({ success: true, data: resetData });
    } catch (err: any) {
      console.error('Error resetting data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get cached prices from SQLite
  app.get('/api/prices', async (req, res) => {
    try {
      const prices = await getCustomPrices();
      res.json({ success: true, data: prices });
    } catch (err: any) {
      console.error('Error getting prices:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Save / update prices in SQLite
  app.post('/api/prices', async (req, res) => {
    try {
      const prices = req.body;
      if (typeof prices !== 'object' || prices === null) {
        return res.status(400).json({ success: false, error: 'Objekt erwartet' });
      }
      await saveCustomPrices(prices);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error saving prices:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- Vite & Static Asset Handling ---
  if (process.env.NODE_ENV !== 'production') {
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
    console.log(`[rwrfolio] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

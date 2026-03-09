# Health endpoint for Node.js/Express (Locus backend)

Add this route to your **server.js** (or main app file) so Nginx and monitors can hit `/health`:

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  });
});
```

Then restart PM2:

```bash
pm2 restart locus-backend
```

Ensure `/health` is registered **before** any catch-all or static routes.

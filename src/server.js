import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT} (${process.env.NODE_ENV || 'dev'})`);
}).on('error', (err) => {
  console.error('❌ Impossible de démarrer le serveur :', err.message);
});


/* import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT} (${process.env.NODE_ENV || 'dev'})`);
});
 */


/* import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
}); */

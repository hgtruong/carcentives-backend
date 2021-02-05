const app = require('./index')
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${PORT}...`);
});
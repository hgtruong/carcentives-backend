const app = require('./index')

app.listen(process.env.PORT || 8080, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${process.env.PORT || 8080}...`);
});
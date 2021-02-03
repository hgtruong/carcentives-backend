const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const puppeteer = require('puppeteer');
const preparePageForTests = require('./preparePageForTests')
const Cars = require('./CarList');
const parseString = require('xml2js').parseString;

const app = express();
const allowedOrigins = ['http://localhost:3000/', 'https://carcentives.netlify.app/'];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.options('/', (req, res) => {
  res.header("Access-Control-Allow-Origing", `${allowedOrigins}`);
  res.header('Access-Control-Allow-Credentials: true');
  res.header('Access-Control-Allow-Methods: GET, POST');
  res.header('Access-Control-Allow-Headers: Content-Type');
  res.end();
});

app.get('/', (req, res) => {
  res.status(200).statusMessage("carcentives-server is alive!");
})

app.get('/makes', (req, res) => {

  if(Cars !== undefined) {
    console.log('Car makes queried successfully.');
    res.status(200).json(Object.keys(Cars));
  } else {
    console.log('Error querying makes.');
    res.sendStatus(500);
  }
});

app.get('/models', (req, res) => {
  const selectedMake = req.query.selectedMake;

  if(Cars[selectedMake] !== undefined) {
    console.log('Car models retrieved.');
    res.status(200).json(Cars[selectedMake]);
  } else {
    console.log(`Car models for "${selectedMake}" failed.`);
    res.sendStatus(500);
  }
});

app.get('/validateZip', async (req, res) => {
  let url = `https://secure.shippingapis.com/ShippingAPI.dll?API=CityStateLookup&XML=`;
  try {
    const result = await axios({
      method: 'GET', 
      url:
      `
        ${url}
        <CityStateLookupRequest USERID="${process.env.USPS_USER_ID}">
          <ZipCode ID='0'>
            <Zip5>${req.query.zipCode}</Zip5>
          </ZipCode>
        </CityStateLookupRequest>
      `
    });
    parseString(result.data, (err, result) => {
      if(err) {
        console.log('Error parsing Zip Code Lookup response');
        res.sendStatus(500);
      } else {
        console.log(`Zip code: ${req.query.zipCode} validation successful.`);
        res.status(200).json(result.CityStateLookupResponse.ZipCode[0]);
      }
    });
  } catch(error) {
    console.log(`Error with zip code validation. Error: ${error}`);
  }
});

app.post('/carSubmission', (req, res) => {
  (async ({make, model, zipCode}) => {
    try{
      console.log(`Starting incentives retrieval for ${make}-${model}-${zipCode}`);

      let currYear = new Date().getFullYear();
      const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true
      });

      const page = await browser.newPage();
      await preparePageForTests(page);
      await page.setViewport({ width: 850, height: 1400});

      let url = `https://www.edmunds.com/${make}/${model}/${currYear}/deals/`
      await page.goto(url, {waitUntil: 'networkidle2'});

      let selector = '.size-16.text-gray-darker.pl-2.search-by-zip-input.size-16.form-control-sm.form-control'
      await page.waitForSelector(selector, {visible: true});

      // Setting Zipcode
      await page.$eval(selector, (el, zipCode) => {
        el.value = zipCode;
      }, zipCode);
      await page.keyboard.press('Enter');

      // Clicking incentives tab
      await page.click(`div[name="incentives-financing"]`);
      await page.screenshot({path: `${make}-${model}-${zipCode}.png`, type: 'png'});
      await browser.close();
      
      console.log(`Retrieved incentives for ${make}-${model}-${zipCode}`);
      res.sendStatus(200);
    } catch(error) {
      console.log(`Error with puppetter. ${error}`);
    }
  })({make: req.query.make, model: req.query.model, zipCode: req.query.zipCode});
});

app.listen(process.env.PORT || 3000, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${process.env.PORT}...`);
});

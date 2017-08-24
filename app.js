const Vacancy = require('./PlatsbankenVacancy.js');

const http = require('http');

const hostname = 'localhost';
const port = 80;
const env = 'development';

const baseUrl = 'http://api.arbetsformedlingen.se/ledigtarbete';
const routes = {
  postJobUrl: `${baseUrl}/apiledigtarbete/hrxml`,
  testPostJobUrl: `${baseUrl}/apiledigtarbete/test/hrxml`,
};

const path = env === 'production' ? routes.postJobUrl : routes.testPostJobUrl;

const options = {
  indent: '  ',
};

const requestString = new Vacancy('http://arbetsformedlingen.se/LedigtArbete', '0.52', options)
  .sender(1, 'foo@bar.com')
  .transaction('ID HERE');

console.log(`${requestString}`);
process.exit();

const httpOptions = {
  hostname,
  port,
  path,
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml',
    'Content-Length': xmlString.length,
  },
};

const req = http.request(httpOptions, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });

  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.log(`problem with request: ${e.message}`);
});

// write data to request body
// xml would have been set somewhere to a complete xml document in the form of a string
req.write(xmlString);
req.end();

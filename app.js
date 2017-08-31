const Vacancy = require('./PlatsbankenVacancy.js');

const http = require('http');

const util = require('util');

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

const request = Vacancy('http://arbetsformedlingen.se/LedigtArbete', '0.52', options);

try {
  request
    .sender({
      id: 1,
      email: 'foo@bar.com',
    })
    .transaction({
      id: 'ID HERE',
    })
    .jobPositionPosting({
      id: 1,
      status: 'active',
    })
    .hiringOrg({
      name: 'IES',
      id: 'IES-HIRING-ORG-ID',
      url: 'http://example.org',
    })
    .jobPostingContact({
      countryCode: 'SE',
      postalCode: 'POSTL',
      municipality: 'MUNI',
      addressLine: 'ADDRESS',
      streetName: 'STREET',
    })
    .postDetail({
      startDate: '2018-09-01',
      endDate: '2018-12-01',
      recruiterName: 'Alex Smith',
      recruiterEmail: 'alexsmith@example.org',
    })
    .jobPositionTitle({
      title: 'JOB TITLE',
    });
} catch (err) {
  console.log(err);
  process.exit(1);
}

console.log(util.inspect(request.doc, false, null, true));
console.log();
console.log('-'.repeat(80));
console.log();
console.log(`${request}`);
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

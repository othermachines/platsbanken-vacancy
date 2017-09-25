const Vacancy = require('./build/PlatsbankenVacancy.js');

const http = require('http');

const util = require('util');

// const hostname = 'localhost';
const hostname = 'api.arbetsformedlingen.se';
const port = 80;
const env = 'development';

// const baseUrl = 'http://api.arbetsformedlingen.se/ledigtarbete';
const baseUrl = '/ledigtarbete';
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
      id: '123-456',
      status: 'active',
    })
    .hiringOrg({
      name: 'ORG NAME',
      id: '46-XXYYZZ-XXYY-1',
      url: 'http://example.org',
    })
    .hiringOrgContact({
      countryCode: 'SE',
      postalCode: '11356',
      municipality: '0180',
      addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
      streetName: 'Birger Jarlsgatan 58',
    })
    .postDetail({
      startDate: '2018-09-01',
      endDate: '2018-12-01',
      recruiterName: 'Alex Smith',
      recruiterEmail: 'alexsmith@example.org',
    })
    .jobPositionTitle({
      title: 'JOB TITLE',
    })
    .jobPositionPurpose({
      purpose: 'JOB PURPOSE',
    })
    .jobPositionLocation({
      countryCode: 'SE',
      postalCode: '11356',
      municipality: '0180',
      addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
      streetName: 'Birger Jarlsgatan 58',
    })
    .classification({
      scheduleType: 'part',
      duration: 'temporary',
      scheduleSummaryText: 'Schedule Summary',
      durationSummaryText: 'Duration Summary',
      termLength: 2,
    })
    .compensationDescription({
      currency: 'SEK',
      salaryType: 1,
      benefits: 'bennies',
      summary: 'summary text',
    })
    .qualificationsRequiredSummary({
      summary: 'Summary of qualifications',
    })
    .qualification({
      type: 'license',
      description: 'DriversLicense',
      category: 'B',
    })
    .qualification({
      type: 'experience',
      yearsOfExperience: 1,
    })
    .qualification({
      type: 'equipment',
      description: 'Car',
    })
    .qualificationsPreferredSummary({
      summary: 'PREFERRED QUALIFICATIONS',
    })
    // applicationMethods() not neccessary, will be called by byWeb()
    // included for clarity
    .applicationMethods()
    .byWeb({
      url: 'http://example.org',
      summary: 'summary text',
    })
    .numberToFill({
      number: 1,
    })
    .hiringOrgDescription({
      description: 'HIRING ORG DESCRIPTION',
    })
    .occupationGroup({
      code: 12345,
    });
} catch (err) {
  console.log(err);
  console.log(err.message);
  console.log(err.details);
  if (err.isJoi) {
    console.log('-----');
    console.log(err.details[0].context);
    console.log('-----');
    console.log(err.annotate());
  }
  process.exit(1);
}
const xmlString = request.toString();
/*
console.log(util.inspect(request.doc, false, null, true));
console.log();
console.log('-'.repeat(80));
console.log();
console.log(`${request}`);
process.exit();
*/

console.log('-'.repeat(80));
console.log(`HOSTNAME: ${hostname}`);
console.log(`PATH: ${path}`);
console.log(`PORT: ${port}`);

console.log('-'.repeat(80));
console.log(xmlString);
console.log('-'.repeat(80));

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

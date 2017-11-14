/*
* $ export NODE_ENV=production
*   Setting to 'production' will submit to the live server.
*   Defaults to 'development'.
* $ node example.js
*   With no arguments, will send XML document to STDOUT and exit.
* $ node example.js json
*   outputs json document (before being transformed to XML) and exits
*   without submitting.
* $ node example.js submit
*   submits posting to the Platsbanken server (live or test, per NODE_ENV).
*/

const vacancy = require('../build/platsbanken-vacancy.js');
const http = require('http');
const util = require('util');

const config = require('config');

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const identity = config.get('identity');

const hostname = 'api.arbetsformedlingen.se';
const port = 80;

const routes = {
  postJobLive: '/ledigtarbete/apiledigtarbete/hrxml',
  postJobTest: '/ledigtarbete/apiledigtarbete/test/hrxml',
};

const path = env === 'production' ? routes.postJobLive : routes.postJobTest;

const submit = process.argv[2] === 'submit';
const json = process.argv[2] === 'json';

const options = {
  indent: '  ',
};

const request = vacancy('http://arbetsformedlingen.se/LedigtArbete', '0.52', options);

try {
  request
    .sender({
      id: identity.customerNumber,
      email: 'foo@bar.com',
    })
    .transaction({
      id: 'TRANSACTION GUID',
    })
    .jobPositionPosting({
      id: `${identity.orgNumber}-1234567890-1234567890-1234567890-q`,
      status: 'active',
    })
    .hiringOrg({
      name: identity.companyName,
      id: identity.orgNumber,
      url: 'http://example.org?hiringOrg',
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
      title: 'Job Title',
    })
    .jobPositionPurpose({
      purpose: 'Job purpose',
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
      benefits: 'Benefits',
      summary: 'Benefits summary text',
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
      yearsOfExperience: 4, // 1 = experience not required, 4 = experience required
    })
    .qualification({
      type: 'equipment',
      description: 'Car',
    })
    .qualificationsPreferredSummary({
      summary: 'Preferred qualifications',
    })
    // applicationMethods() not neccessary, will be called by byWeb()
    // or byEmail(), included for clarity
    .applicationMethods()
    .byWeb({
      url: 'http://example.org?byWeb',
    })
    .byEmail({
      email: 'foo@example.org',
    })
    .numberToFill({
      number: 1,
    })
    .hiringOrgDescription({
      description: 'Hiring org description',
    })
    .occupationGroup({
      code: 7652,
    });
} catch (err) {
  console.log(err);
  if (err.isJoi) {
    console.log('-----');
    console.log(err.annotate());
  }
  process.exit(1);
}
const xmlString = request.toString();

console.log(xmlString);

if (json) {
  console.log('-'.repeat(80));
  console.log(util.inspect(request.doc, false, null, true));
  console.log('-'.repeat(80));
  process.exit(1);
}

if (submit) {
  console.log('-'.repeat(80));
  console.log(`HOSTNAME: ${hostname}`);
  console.log(`PATH: ${path}`);
  console.log(`PORT: ${port}`);
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

  req.write(xmlString);
  req.end();
}

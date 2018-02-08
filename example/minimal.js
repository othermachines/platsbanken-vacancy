/*
* Minimal example for creating a new vacancy posting.
*
* Running this as-is with:
*   $ node minimal.js
*
* will output XML for adding a new vacancy. Using the -s flag
*   $ node minimal.js -s
*
* will submit that XML to Arbetsförmedling. This will return an error,
* complaining about a non-existent customer number, unless you fill in
* values for the identity object, just below.
*
* Full example of creating the XML for submission is in the createSubmission()
* function.
*/

const platsbankenVacancy = require('../build/platsbanken-vacancy.js');
const http = require('http');
const shortid = require('shortid');
const ArgumentParser = require('argparse').ArgumentParser;

const hostname = 'api.arbetsformedlingen.se';
const port = 80;
const path = '/ledigtarbete/apiledigtarbete/test/hrxml';

const identity = {
  customerNumber: '12345678',
  companyName: 'Company Name',
  orgNumber: '46-123456-1234',
};

const parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'platsbanken-vacancy minimal example script',
});

parser.addArgument(
  ['-s', '--submit'],
  {
    help: 'submit postings to Arbetsförmedling',
    action: 'storeTrue',
  },
);

const args = parser.parseArgs();

const options = { indent: '  ' };

function createSubmission() {
  const vacancy = platsbankenVacancy('http://arbetsformedlingen.se/LedigtArbete', '0.52', options);

  vacancy
    .sender({
      id: identity.customerNumber,
      email: 'sender@example.com',
    })
    .transaction({
      id: shortid.generate(),
    })
    .jobPositionPosting({
      id: `${identity.orgNumber}-${shortid.generate()}`,
      status: 'active',
    })
    .hiringOrg({
      name: identity.companyName,
      id: identity.orgNumber,
      url: 'http://example.org/hiringOrg',
      contact: {
        countryCode: 'SE',
        postalCode: '11356',
        municipality: '0180',
        addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
        streetName: 'Birger Jarlsgatan 58',
      },
      description: 'Organizational unit description',
    })
    .postDetail({
      startDate: '2018-09-01',
      endDate: '2018-12-01',
      recruiterName: 'Recruiter Name',
      recruiterEmail: 'recruiter@example.org',
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
      // same as: yearsOfExperience: 4
      required: true,
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
      url: 'http://example.org/byWeb',
    })
    .byEmail({
      email: 'byEmailcontact@example.org',
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
  return vacancy;
}

try {
  vacancy = createSubmission();
} catch (err) {
  if (err.isJoi) {
    console.log('Validation error');
    console.log('-'.repeat(80));
    console.log(err);
    console.log('-'.repeat(80));
    console.log(err.annotate());
    console.log('-'.repeat(80));
  } else {
    console.log(err);
  }
  process.exit(1);
}

const payload = vacancy.toString();
console.log(payload);
console.log('-'.repeat(80));

if (args.submit) {
  const httpOptions = {
    hostname,
    port,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
    },
  };

  const req = http.request(httpOptions, (res) => {
    res.setEncoding('utf8');

    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      const response = JSON.parse(body);

      if (response[0] != null) {
        if (response[0].ErrorCode) {
          console.log('API Error');
          console.log(response[0].ErrorCode);
        }
        if (response[0].Message) {
          console.log(response[0].Message);
        }
      } else {
        if (response.ErrorCode) {
          console.log('API Error');
          console.log(response.ErrorCode);
        }
        if (response.Message) {
          console.log(response.Message);
        }
      }
    });
  });

  req.on('error', (e) => {
    console.log('Error');
    console.log(e.message);
    process.exit(1);
  });

  req.write(payload);
  req.end();
}

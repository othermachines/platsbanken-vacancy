/*
* $ export NODE_ENV=production
*   Setting to 'production' will submit to the live server.
*   Defaults to 'development'.
*
* usage: example.js [-h] [-v] [-j] [-x] [-s] [-c] [-u] [-d] [-i ID]
*
* platsbanken-vacancy example script
*
* Optional arguments:
*  -h, --help      Show this help message and exit.
*  -v, --version   Show program's version number and exit.
*  -j, --json      output json
*  -x, --xml       output xml
*  -s, --submit    submit postings to Arbetsförmedling
*  -c, --create    create vacancy
*  -u, --update    update vacancy
*  -d, --delete    delete vacancy
*  -i ID, --id ID  posting id, will generate new one if not provided
*
* Examples
*   Unless you have set the NODE_ENV environment variable to "production",
*   these will submit to the test server:
*
*   output XML for adding a vacancy and exit (will not send):
*     $ node example.js --create --xml
*
*   submit a new vacancy to Arbetsförmedling:
*     $ node example.js --create --submit
*
*   update a vacancy at Arbetsförmedling:
*    $ node example.js --update --submit --id POST_ID_HERE
*/

const platsbankenVacancy = require('../build/platsbanken-vacancy.js');
const http = require('http');
const async = require('async');
const util = require('util');
const shortid = require('shortid');
const config = require('config');
const chalk = require('chalk');
const sprintf = require('sprintf-js').sprintf;
const vsprintf = require('sprintf-js').vsprintf;
const argparser = require('argparse').ArgumentParser;
const wordwrap = require('word-wrap');

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const identity = config.get('identity');

const hostname = 'api.arbetsformedlingen.se';
const port = 80;

const routes = {
  postJobLive: '/ledigtarbete/apiledigtarbete/hrxml',
  postJobTest: '/ledigtarbete/apiledigtarbete/test/hrxml',
};

const path = env === 'production' ? routes.postJobLive : routes.postJobTest;

const parser = new argparser({
  version: '0.0.1',
  addHelp: true,
  description: 'platsbanken-vacancy example script',
});

parser.addArgument(
  ['-j', '--json'],
  {
    help: 'output json',
    action: 'storeTrue',
  },
);

parser.addArgument(
  ['-x', '--xml'],
  {
    help: 'output xml',
    action: 'storeTrue',
  },
);

parser.addArgument(
  ['-s', '--submit'],
  {
    help: 'submit postings to Arbetsförmedling',
    action: 'storeTrue',
  },
);

parser.addArgument(
  ['-c', '--create'],
  {
    help: 'create vacancy',
    action: 'storeTrue',
  },
);

parser.addArgument(
  ['-u', '--update'],
  {
    help: 'update vacancy',
    action: 'storeTrue',
  },
);

parser.addArgument(
  ['-d', '--delete'],
  {
    help: 'delete vacancy',
    action: 'storeTrue',
  },
);

parser.addArgument(
  ['-i', '--id'],
  {
    help: 'posting id, will generate new one if not provided',
  },
);

const args = parser.parseArgs();

const options = { indent: '  ' };

/* start helper functions */

function createVacancy({ postingId }) {
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
      id: postingId,
      status: 'active',
    })
    .hiringOrg({
      name: identity.companyName,
      id: identity.orgNumber,
      url: 'http://example.org/hiringOrg',
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

function updateVacancy({ postingId }) {
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
      id: postingId,
      status: 'active',
    })
    .hiringOrg({
      name: identity.companyName,
      id: identity.orgNumber,
      url: 'http://example.org/hiringOrg',
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
      recruiterName: 'Recruiter Name',
      recruiterEmail: 'recruiter@example.org',
    })
    .jobPositionTitle({
      title: 'Job Title Updated',
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

function deleteVacancy({ postingId }) {
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
      id: postingId,
      status: 'inactive',
    })
    .hiringOrg({
      name: identity.companyName,
      id: identity.orgNumber,
      url: 'http://example.org/hiringOrg',
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

function out(type, ...s) {
  // sprintf is just a placeholder for now. Will come back later and switch
  // to clui or similar when I have a moment. This isn't actually important
  // after all...
  if (s[1] == null) {
    s[1] = '';
  }

  // sprintf counts ascii codes, 10 for opening/closing a color
  const col2 = '%-49s  %29s';
  const col2color = '%-59s  %39s';
  if (type === 'info') {
    console.log(sprintf(col2color, chalk.cyan(s[0]), chalk.cyanBright(s[1])));
  } else if (type === 'success') {
    console.log(sprintf(col2color, chalk.green(s[0]), chalk.greenBright(s[1])));
  } else if (type === 'error') {
    console.log(sprintf(col2color, chalk.red(s[0]), chalk.redBright(s[1])));
  } else {
    console.log(vsprintf(col2, s));
  }
}

function send(data, next) {
  out('info', 'Sending...');
  const payload = data.vacancy.toString();

  const httpOptions = {
    hostname,
    port,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      'Content-Length': payload.length,
    },
  };

  const req = http.request(httpOptions, (res) => {
    if (res.statusCode > 399) {
      out('error', 'Status', res.statusCode);
    } else {
      out('success', 'Status', res.statusCode);
    }

    res.setEncoding('utf8');

    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      const response = JSON.parse(body);

      if (response[0] != null) {
        if (response[0].ErrorCode) {
          out('error', 'API Error', response[0].ErrorCode);
        }
        if (response[0].Message) {
          console.log(wordwrap(response[0].Message));
        }
      } else {
        if (response.ErrorCode) {
          out('error', 'API Error', response.ErrorCode);
        }
        if (response.Message) {
          console.log(wordwrap(response.Message));
        }
      }
      next(null, data);
    });
  });

  req.on('error', (e) => {
    out('error', 'Error');
    console.log(e.message);
    next(e);
  });

  req.write(payload);
  req.end();
}

function processRequest(data, next) {
  if (args.json) {
    console.log(util.inspect(data.vacancy.doc, false, null, true));
  }

  if (args.xml) {
    console.log();
    console.log(data.vacancy.toString());
    console.log();
  }

  if (args.submit) {
    send(data, next);
  } else {
    next(null, data);
  }
}

function finalize(err, data) {
  if (err) {
    if (err.isJoi) {
      out('error', 'Validation error');
      console.log('-'.repeat(80));
      console.log(err);
      console.log('-'.repeat(80));
      console.log(err.annotate());
      console.log('-'.repeat(80));
    } else {
      console.log(err);
    }
  } else {
    out('success', 'Done', data.postingId);
  }
}

/* end helper functions */

const tasks = [];
tasks.push((next) => {
  const postingId = args.id != null
    ? args.id
    : `${identity.orgNumber}-${shortid.generate()}`;

  next(null, { postingId });
});

if (args.create) {
  tasks.push((data, next) => {
    out('info', 'Creating new vacancy', data.postingId);

    data.vacancy = {};

    try {
      data.vacancy = createVacancy({ postingId: data.postingId });
    } catch (err) {
      next(err);
    }
    processRequest(data, next);
  });
}

if (args.update) {
  tasks.push((data, next) => {
    out('info', 'Updating vacancy', data.postingId);

    try {
      data.vacancy = updateVacancy({ postingId: data.postingId });
    } catch (err) {
      next(err);
    }
    processRequest(data, next);
  });
}

if (args.delete) {
  tasks.push((data, next) => {
    out('info', 'Deleting vacancy', data.postingId);

    try {
      data.vacancy = deleteVacancy({ postingId: data.postingId });
    } catch (err) {
      next(err);
    }
    processRequest(data, next);
  });
}

async.waterfall(tasks, finalize);

/*
* usage: example.js [-h] [-v] [-j] [-x] [-s] [-c] [-u] [-d] [-i ID]
*
* platsbanken-vacancy submission test script
*
* Optional arguments:
*  -h, --help      Show this help message and exit.
*  -v, --version   Show program's version number and exit.
*  -j, --json      output json
*  -x, --xml       output xml
*  -s, --submit    submit postings to Arbetsförmedling
*  -c, --create    create vacancies
*  -u, --update    update vacancies
*  -d, --delete    delete vacancies
*  -b, --batch     batch number, used in generating posting ids
*
* Examples
*   These will submit to the test server:
*
*   output XML for adding a vacancies and exit (will not send):
*     $ node example.js --create --xml
*
*   submit new vacancies to Arbetsförmedling:
*     $ node example.js --create --submit
*
*   update vacancies at Arbetsförmedling:
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
const ArgumentParser = require('argparse').ArgumentParser;
const wordwrap = require('word-wrap');

const identity = config.get('identity');

const hostname = 'api.arbetsformedlingen.se';
const port = 80;

const path = '/ledigtarbete/apiledigtarbete/test/hrxml';

const parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'platsbanken-vacancy submission test script',
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
    help: 'create vacancies',
    action: 'storeTrue',
  },
);

parser.addArgument(
  ['-u', '--update'],
  {
    help: 'update vacancies',
    action: 'storeTrue',
  },
);

parser.addArgument(
  ['-d', '--delete'],
  {
    help: 'delete vacancies',
    action: 'storeTrue',
  },
);

parser.addArgument(
  ['-b', '--batch'],
  {
    help: 'batch number, used in generating posting ids',
  },
);

const args = parser.parseArgs();

const options = { indent: '  ' };

/* start helper functions */

function createSubmission({
  postingId,
  scheduleType = 'full',
  termLength,
  salaryType = 1,
  title,
  jobPositionLocation = {
    countryCode: 'SE',
    postalCode: '11356',
    municipality: '0180',
    addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
    streetName: 'Birger Jarlsgatan 58',
  },
  qualifications = [{
    type: 'experience',
    // same as: yearsOfExperience: 4
    required: true,
  }],
  code = 7652,
  comment,
} = {}) {
  const vacancy = platsbankenVacancy('http://arbetsformedlingen.se/LedigtArbete', '0.52', options);

  const duration = termLength ? 'temporary' : 'regular';

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
      title,
    })
    .jobPositionPurpose({
      purpose: comment,
    })
    .jobPositionLocation(jobPositionLocation)
    .classification({
      scheduleType,
      duration,
      scheduleSummaryText: 'Schedule Summary',
      durationSummaryText: 'Duration Summary',
      termLength: 2,
    })
    .compensationDescription({
      currency: 'SEK',
      salaryType,
      benefits: 'Benefits',
      summary: 'Benefits summary text',
    })
    .qualificationsRequiredSummary({
      summary: 'Qualifications required summary',
    });

  qualifications.forEach((q) => {
    vacancy.qualification(q);
  });
  vacancy
    .qualificationsPreferredSummary({
      summary: 'Qualifications preferred summary',
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
    .informationContact()
    .contact({
      name: 'Contact Name',
      phone: '555.555.5555',
      email: 'contact@example.org',
    })
    .contact({
      name: 'Contact Name 2',
      phone: '555.555.5556',
      email: 'contac2t@example.org',
    })
    .occupationGroup({ code })
    // informationContact() not neccessary, will be called by contact(), included for clarity
    .applicationReferenceID({
      id: 'ABC123',
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

/* start test parameters */
const params = [];
const batch = args.batch ? args.batch : '000';

params.push({
  postingId: `${identity.orgNumber}-${batch}1`,
  scheduleType: 'full',
  termLength: 2, // 6 months or longer
  comment: 'Full time, temporary, 6 months or longer, in Sweden.',
}, {
  postingId: `${identity.orgNumber}-${batch}2`,
  scheduleType: 'part',
  comment: 'Part time, permanent, in Sweden.',
}, {
  postingId: `${identity.orgNumber}-${batch}3`,
  scheduleType: 'full',
  termLength: 7, // 11 days to 3 months
  comment: 'Full time, 11 days to 3 months, in Sweden',
}, {
  postingId: `${identity.orgNumber}-${batch}4`,
  scheduleType: 'part',
  termLength: 3, // 3-6 months
  salaryType: 3, // commission only
  comment: 'Part time, 3 - 6 months, in Sweden, commission only.',
}, {
  postingId: `${identity.orgNumber}-${batch}5`,
  scheduleType: 'full',
  termLength: 4, // summer months
  salaryType: 2, // fixed plus commission
  comment: 'Full time, summer months, in Sweden, fixed plus commission.',
}, {
  postingId: `${identity.orgNumber}-${batch}6`,
  scheduleType: 'full',
  termLength: 2, // 6 months or longer
  comment: `Full time, temporary (test specification does not specify term and term is required, using 6 months+),
unspecified workplace in Sweden (not possible according to docs - API requires a work address)`,
}, {
  postingId: `${identity.orgNumber}-${batch}7`,
  scheduleType: 'full',
  salaryType: 1, // fixed
  comment: 'Full time, workplace outside Sweden (location outside Sweden ot accepted in JobPositionLocation), fixed salary.',
}, {
  postingId: `${identity.orgNumber}-${batch}8`,
  scheduleType: 'full',
  termLength: 2, // 6 months or longer
  salaryType: 2, // fixed plus commission
  qualifications: [{
    type: 'license',
    description: 'DriversLicense',
    category: 'C1E',
  }],
  code: '5687', // Truck driver
  comment: `Full time, 6 months or longer, in Sweden, requires driver's license (C1E),
fixed plus commission, truck driver.`,
});

/* end test parameters */

const tasks = [];
tasks.push((next) => {
  next(null, { });
});

if (args.create) {
  params.forEach((p) => {
    tasks.push((data, next) => {
      out('info', 'Creating new vacancy', p.postingId);

      data.vacancy = {};

      try {
        p.title = 'Job Title';
        p.status = 'active';
        data.vacancy = createSubmission(p);
      } catch (err) {
        next(err);
      }
      processRequest(data, next);
    });
  });
}

if (args.update) {
  params.forEach((p) => {
    tasks.push((data, next) => {
      out('info', 'Updating vacancy', p.postingId);

      try {
        p.title = 'Job Title updated';
        p.status = 'active';
        data.vacancy = createSubmission(p);
      } catch (err) {
        next(err);
      }
      processRequest(data, next);
    });
  });
}

if (args.delete) {
  params.forEach((p) => {
    tasks.push((data, next) => {
      out('info', 'Deleting vacancy', p.postingId);

      try {
        p.title = 'Job Title deleted';
        p.status = 'inactive';
        data.vacancy = createSubmission(p);
      } catch (err) {
        next(err);
      }
      processRequest(data, next);
    });
  });
}

async.waterfall(tasks, finalize);

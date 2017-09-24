const util = require('util');
const chai = require('chai');

chai.use(require('chai-things'));

const expect = chai.expect;
const Vacancy = require('../build/PlatsbankenVacancy.js');

// We will be building new PlatsbankenVacancies throughout, and sometimes this
// requires calling a series of methods to reach the state we want to be at.
// Rather than repeatedly specify valid parameters for each method, set
// default valid parameters that can be reused here.

// And now that we have these, it's a convenient way to check that each method
// accepts valid parameters. In cases where there are variations
// (e.g., jobPositionPosting() or qualification(), different sets can be
// set in an array.
const params = {
  sender: { id: 1, email: 'foo@example.org' },
  transaction: { id: 'valid' },
  jobPositionPosting: [
    { id: '123-456' },
    { id: '123-456', status: 'active' },
    { id: '123-456', status: 'inactive' },
  ],
  hiringOrg: {
    name: 'ORG NAME',
    id: '46-XXYYZZ-XXYY-1',
    url: 'http://example.org',
  },
  hiringOrgContact: {
    countryCode: 'SE',
    postalCode: '11356',
    municipality: '0180',
    addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
    streetName: 'Birger Jarlsgatan 58',
  },
  postDetail: {
    startDate: '2018-09-01',
    endDate: '2018-12-01',
    recruiterName: 'Alex Smith',
    recruiterEmail: 'alexsmith@example.org',
  },
  jobPositionTitle: {
    title: 'JOB TITLE',
  },
  jobPositionPurpose: {
    purpose: 'JOB PURPOSE',
  },
  jobPositionLocation: {
    countryCode: 'SE',
    postalCode: '11356',
    municipality: '0180',
    addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
    streetName: 'Birger Jarlsgatan 58',
  },
  classification: {
    scheduleType: 'part',
    duration: 'temporary',
    scheduleSummaryText: 'Schedule Summary',
    durationSummaryText: 'Duration Summary',
    termLength: 2,
  },
  compensationDescription: {
    currency: 'SEK',
    salaryType: 1,
    benefits: 'bennies',
    summary: 'summary text',
  },
  qualificationsRequiredSummary: {
    summary: 'Summary of qualifications',
  },
  qualification: [{
    type: 'license',
    description: 'DriversLicense',
    category: 'B',
  }, {
    type: 'experience',
    yearsOfExperience: 1,
  }, {
    type: 'equipment',
    description: 'Car',
  }],
  howToApply: [{
  }, {
    distribute: 'external',
  }],
  qualificationsPreferredSummary: {
    summary: 'PREFERRED QUALIFICATIONS',
  },
  byWeb: {
    url: 'http://example.org',
    summary: 'summary text',
  },
  numberToFill: {
    number: 1,
  },
  hiringOrgDescription: {
    description: 'HIRING ORG DESCRIPTION',
  },
  occupationGroup: [{
    code: 12345,
  }, {
    code: 12345,
    codename: 'OccupationNameID'
  }],
};

const invalidParams = {
  sender: [{
    id: 1,
  }, {
    email:'foo@example.org'
  }],
  transaction: { },
  jobPositionPosting: [
    { },
    { id: '123-456', status: 'foo' },
  ],
  hiringOrg: [{
    name: 'ORG NAME',
  }, {
    id: '46-XXYYZZ-XXYY-1',
  }],
  hiringOrgContact: [{
    postalCode: '11356',
    municipality: '0180',
    addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
    streetName: 'Birger Jarlsgatan 58',
  }, {
    countryCode: 'SE',
    municipality: '0180',
    addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
    streetName: 'Birger Jarlsgatan 58',
  }, {
    countryCode: 'SE',
    postalCode: '11356',
    addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
    streetName: 'Birger Jarlsgatan 58',
  }, {
    countryCode: 'SE',
    postalCode: '11356',
    municipality: '0180',
    streetName: 'Birger Jarlsgatan 58',
  }, {
    countryCode: 'SE',
    postalCode: '11356',
    municipality: '0180',
    addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
  }],
  postDetail: [{
    endDate: '2018-12-01',
    recruiterName: 'Alex Smith',
  }, {
    startDate: '2018-09-01',
    recruiterName: 'Alex Smith',
  }, {
    startDate: '2018-09-01',
    endDate: '2018-12-01',
  }, {
    startDate: '2018-09-01',
    endDate: '2018-12-01',
    recruiterName: 'Alex Smith',
    recruiterEmail: 'not an email',
  }, {
    startDate: 'not a date',
    endDate: '2018-12-01',
    recruiterName: 'Alex Smith',
    recruiterEmail: 'alexsmith@example.org',
  }, {
    startDate: '2018-09-01',
    endDate: 'not a date',
    recruiterName: 'Alex Smith',
    recruiterEmail: 'alexsmith@example.org',
  }, {
  }],
  jobPositionTitle: { },
  jobPositionPurpose: { },
  jobPositionLocation: [{
    postalCode: '11356',
    municipality: '0180',
    addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
    streetName: 'Birger Jarlsgatan 58',
  }, {
    countryCode: 'SE',
    municipality: '0180',
    addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
    streetName: 'Birger Jarlsgatan 58',
  }, {
    countryCode: 'SE',
    postalCode: '11356',
    addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
    streetName: 'Birger Jarlsgatan 58',
  }, {
    countryCode: 'SE',
    postalCode: '11356',
    municipality: '0180',
    streetName: 'Birger Jarlsgatan 58',
  }, {
    countryCode: 'SE',
    postalCode: '11356',
    municipality: '0180',
    addressLine: 'Birger Jarlsgatan 58, 11356, Stockholm',
  }],
  classification: [{
    duration: 'temporary',
    termLength: 2,
  }, {
    scheduleType: 'part',
    termLength: 2,
  }, {
    scheduleType: 'part',
    duration: 'temporary',
  }, {
    scheduleType: 'not valid',
    duration: 'temporary',
    termLength: 2,
  }, {
    scheduleType: 'part',
    duration: 'not valid',
    termLength: 2,
  }],
  compensationDescription: [{
    currency: 'SEK',
  }, {
    salaryType: 1,
  }, {
    currency: 'SEK',
    salaryType: 'not valid',
  }, {
    currency: 'SEK',
    salaryType: 9,
  }],
  qualificationsRequiredSummary: {
    summary: 1,
  },
  qualification: [{
    type: 'license',
    category: 'B',
  }, {
    type: 'license',
    description: 'DriversLicense',
  }, {
    type: 'experience',
  }, {
    type: 'equipment',
  }, {
    type: 'not valid',
  }],
  howToApply: {
    distribute: 'not valid',
  },
  qualificationsPreferredSummary: { },
  byWeb: {
    url: 'not a valid url',
  },
  numberToFill: [{
  }, {
    number: 'foo',
  }],
  hiringOrgDescription: { },
  occupationGroup: [{
  }, {
    code: 'not a number',
  }, {
    code: 12345,
    codename: 'invalid codename',
  }],
};

describe('PlatsbankenVacancy', () => {
  describe('check valid parameters are accepted', () => {
    const request = Vacancy();

    Object.keys(params).forEach((method) => {
      // get the name for this method's validation method
      // eg., turn sender into validateSender
      const vMethod = `validate${method[0].toUpperCase()}${method.slice(1)}`;
      const p = params[method];

      if (Array.isArray(p)) {
        p.forEach((p2) => {
          const pstring = util.inspect(p2);
          it(`${vMethod} should accept ${pstring} `, () => {
            expect(() => request[vMethod](p2)).to.not.throw();
          });
        });
      } else {
        const pstring = util.inspect(params[method]);
        it(`${vMethod} should accept ${pstring} `, () => {
          expect(() => request[vMethod](p)).to.not.throw();
        });
      }
    });
  });

  describe('check invalid parameters are not accepted', () => {
    const request = Vacancy();

    Object.keys(invalidParams).forEach((method) => {
      // get the name for this method's validation method
      // eg., turn sender into validateSender
      const vMethod = `validate${method[0].toUpperCase()}${method.slice(1)}`;
      const p = invalidParams[method];
      if (Array.isArray(p)) {
        p.forEach((p2) => {
          const pstring = util.inspect(p2);
          it(`${vMethod} should not accept ${pstring} `, () => {
            expect(() => request[vMethod](p2)).to.throw();
          });
        });
      } else {
        const pstring = util.inspect(invalidParams[method]);
        it(`${vMethod} should no accept ${pstring} `, () => {
          expect(() => request[vMethod](p)).to.throw();
        });
      }
    });
  });

  describe('sender()', () => {
    // rebuild on every set of method tests
    const request = Vacancy();

    // should pass
    it('should add a Sender tag with attributes to the Envelope', () => {
      request.sender({ id: 1, email: 'foo@example.org' });
      expect(request.json().Envelope)
        .include.something.to.have.property('Sender');
      expect(request.json().Envelope)
        .include.something.to.have.nested.property('Sender._attr');
      expect(request.json().Envelope)
        .include.something.to.have.nested.property('Sender._attr.id');
      expect(request.json().Envelope)
        .include.something.to.have.nested.property('Sender._attr.email');
    });
  });

  describe('transaction()', () => {
    const request = Vacancy();
    request.sender(params.sender);

    // should fail
    it('should add the TransactInfo tag set to the Envelope', () => {
      request.transaction(params.transaction);
      expect(request.json().Envelope)
        .include.something.to.have.property('TransactInfo');
      expect(request.json().Envelope)
        .include.something.to.have.nested.property('TransactInfo[0]._attr');
      expect(request.json().Envelope)
        .include.something.to.have.nested.property('TransactInfo[0]._attr.timeStamp');
      expect(request.json().Envelope)
        .include.something.to.have.nested.property('TransactInfo[1].TransactId');
    });
    it('should add a Packet tag set to the Envelope', () => {
      expect(request.json().Envelope)
        .include.something.to.have.property('Packet');
      expect(request.json().Envelope)
        .include.something.to.have.nested.property('Packet[0].PacketInfo');
      expect(request.json().Envelope)
        .include.something.to.have.nested.property('Packet[1].Payload');
    });
  });
  describe('jobPositionPosting()', () => {
    const request = Vacancy();
    request.sender(params.sender);
    request.transaction(params.transaction);

    // should fail
    it('should require transaction() to have been called first', () => {
      expect(() => {
        Vacancy().jobPositionPosting(params.jobPositionPosting);
      }).to.throw();
    });

    // should pass
    it('should add a Packet tag set to the Envelope', () => {
      expect(request.json().Envelope)
        .include.something.to.have.property('Packet');
      expect(request.json().Envelope)
        .include.something.to.have.nested.property('Packet[0].PacketInfo');
      expect(request.json().Envelope)
        .include.something.to.have.nested.property('Packet[1].Payload');
    });
  });
});

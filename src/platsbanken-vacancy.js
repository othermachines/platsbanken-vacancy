/*
* Throughout there are comments preceded with "HRXML 0.99"
* These are notes take from the documentation provided by Arbetsförmedling
* in the file "Extern_hrxml_format_description_Vers 0 99.xls"
*/

// enable source map support
require('source-map-support').install();

const xml = require('xml');
const Joi = require('joi');

const platsbankenVacancy = ({
  xmlns = 'http://arbetsformedlingen.se/LedigtArbete',
  version = '0.52',
  xmlOptions = { indent: '  ' },
} = {}) => ({
  xmlns,
  version,
  xmlOptions,

  packetCount: 0,
  ref: { },

  doc: {
    Envelope: [{ _attr: { xmlns, version } }],
  },

  toString() { return xml(this.doc, this.xmlOptions); },
  json() { return this.doc; },

  // Returns the last index in the requested Array
  // This is based off elements tracked in this.ref,
  // which are the only elements we are adding multiple
  // packages to. Mostly useful for testing, so you don't
  // need to keep track of which index an element has been
  // added at
  index(el) {
    return this.ref[el].length - 1;
  },

  // writing this:
  //   this.ref.Payload = this.ref.Packet[this.ref.Packet.length - 1].Payload;
  // to manage references is a pain
  makeRef: ({ obj, target, parent } = {}) => {
    Joi.assert({ obj, target, parent }, {
      obj: Joi.object().required(),
      target: Joi.string().required(),
      parent: Joi.string().required(),
    });

    Joi.assert(obj[parent], Joi.required(), `Parent element "${target}" does not exist as a reference key.`);
    Joi.assert(obj[target], Joi.forbidden(), `"${target}" already exists as a reference key.`);

    obj[target] = obj[parent][obj[parent].length - 1][target];
  },

  /*
  * HRXML 0.99
  * <Sender:id>
  * Your company's customer number at Arbetsformedlingen
  * Customer number is supplied by Arbetsförmedlingen.
  * Note: this is an element attribute.
  *
  * This will be an eight digit number, treated as a string
  */

  /*
  * HRXML 0.99
  * <Sender:email>
  * A valid e-mail address where receipt of file and error messages is sent to,
  *  max 3 email adress, seperated with semicolon ;
  * Ex: emailaddress@domain.com
  * Note: this is an element attribute.
  */
  jsonSender: ({ id, email } = {}) => ({ Sender: { _attr: { id, email } } }),

  validateSender: ({ id, email }) => {
    Joi.assert({ id, email }, {
      id: Joi.string().length(8).required(),
      email: Joi.string().email().required(),
    });
  },

  sender({ id, email } = {}) {
    this.validateSender({ id, email });
    this.doc.Envelope.push(this.jsonSender({ id, email }));
    return this;
  },

  /*
  * HRXML 0.99
  * <TransactInfo:timeStamp>
  * Your internal timestamp for this particular transaction.
  * fff is for milliseconds.
  * Format constraints: ISO 8601
  */

  /*
  * HRXML 0.99
  * <TransactId>
  * Your internal id for this particular transaction. Recommended that this
  *  is a UUID/GUID. (Globally unique identifier), will be shown in the
  *  confirm email for submitted files.
  */
  jsonTransaction: ({ id: TransactId } = {}) => {
    const _attr = { timeStamp: '2017-08-20T18:40:49Z' };
    return { TransactInfo: [{ _attr }, { TransactId }] };
  },

  validateTransaction: ({ id }) => {
    Joi.assert({ id }, { id: Joi.string().required() });
  },

  transaction({ id } = {}) {
    this.validateTransaction({ id });
    this.doc.Envelope.push(this.jsonTransaction({ id }));

    // one transaction can contain many packets
    // but each transaction must have at least one
    this.packet();

    return this;
  },

  /*
  * HRXML 0.99
  * <PacketId>
  * One Envelope can contain many packets. PacketID is the identifier for
  * each packet. This should be a counter, starting at 1, and is used
  * for traceability.
  */
  jsonPacket: ({ id = 1 } = { id: 1 }) => ({
    Packet: [{ PacketInfo: [{ PacketId: id }] }, { Payload: [] }],
  }),

  packet() {
    this.packetCount = this.packetCount + 1;

    this.ref.Envelope = this.doc.Envelope;
    this.ref.Envelope.push(this.jsonPacket(this.packetCount));

    this.makeRef({
      obj: this.ref,
      target: 'Packet',
      parent: 'Envelope',
    });

    this.makeRef({
      obj: this.ref,
      target: 'Payload',
      parent: 'Packet',
    });

    return this;
  },

  /*
  * HRXML 0.99
  * <JobPositionPosting:status>
  * active = jobplacement is to be published.
  * inactive = jobplacement is to be removed from site.
  * Note: this is an element attribute.
  * Format constraints: string ['active' | 'inactive']
  */

  /*
  * HRXML 0.99
  * <JobPositionPostingId>
  * This is a common identifier for this particular job position posting.
  * Landskod-HiringOrgId-Valfri1-Valfri2
  * Country Code-HiringOrgId-Optional1-Optional2
  */
  jsonJobPositionPosting: ({
    id: JobPositionPostingId,
    status = 'active',
  } = { status: 'active' }) => ({
    JobPositionPosting: [{ _attr: { status } }, { JobPositionPostingId }],
  }),

  validateJobPositionPosting({ id, status = 'active' } = { status: 'active' }) {
    Joi.assert({ id, status }, {
      id: Joi.string().max(50).required(),
      status: Joi.valid(['active', 'inactive']),
    });
  },

  jobPositionPosting({ id, status = 'active' } = { status: 'active' }) {
    this.validateJobPositionPosting({ id, status });

    if (!this.ref.Payload) {
      throw new Error('JobPositionPosting must be attached to a Payload element. Did you call transaction()?');
    }

    this.ref.Payload.push(this.jsonJobPositionPosting({ id, status }));

    this.makeRef({
      obj: this.ref,
      target: 'JobPositionPosting',
      parent: 'Payload',
    });

    return this;
  },

  /*
  * HRXML 0.99
  * <HiringOrgName>
  * Company name. This is used to identify who the employer for the
  *  particular job placement and will be shown in Platsbanken as company.
  */

  /*
  * HRXML 0.99
  * <HiringOrgId>
  * Adjusted Swedish organisation number, here in form of
  * country code (numerical) and Swedish organisation number
  */

  jsonHiringOrg: ({
    name: HiringOrgName,
    id: HiringOrgId,
    url: WebSite,
  } = {}) => ({
    HiringOrg: [{ HiringOrgName }, { HiringOrgId }, { WebSite }],
  }),

  validateHiringOrg: ({ name, id, url }) => {
    Joi.assert({ name, id, url }, {
      name: Joi.string().required(),
      id: Joi.string().required(),
      url: Joi.string().optional(),
    });
  },

  hiringOrg({ name, id, url } = {}) {
    this.validateHiringOrg({ name, id, url });
    if (!this.ref.JobPositionPosting) {
      throw new Error('HiringOrg must be attached to a JobPositionPosting element. Did you call jobPositionPosting()?');
    }

    this.ref.JobPositionPosting.push(this.jsonHiringOrg({ name, id, url }));

    this.makeRef({
      obj: this.ref,
      target: 'HiringOrg',
      parent: 'JobPositionPosting',
    });

    return this;
  },

  /*
  * HRXML 0.99
  * <PostalAddress>
  * Appears under the heading 'Arbetsgivare (Postadress/Besöksadress)' in the advert.
  */

  /*
  * HRXML 0.99
  * <CountryCode>
  * Country codes according to ISO 31661-1 alpha-2. (SE for Sweden.)
  */

  /*
  * HRXML 0.99
  * <PostalCode>
  * The postal code for the delivery address. Must be a valid postcode without spaces.
  */

  /*
  * HRXML 0.99
  * <Municipality>
  * Name of town/city for the delivery address
  */

  /*
  * HRXML 0.99
  * <AddressLine>
  * Element can not be repeated.
  * The workplaces' visiting address.
  * Will be shown under heading 'Besöksadress' in the advert.
  */

  /*
  * HRXML 0.99
  * <StreetName>
  * Street name for the delivery address of the workplace.
  * (Either this or PostOfficeBox must be specified.)
  *
  * Note that PostOfficeBox is not implemented here. To make that a valid
  * option, check whether StreetName or PostOfficeBox is supplied and
  * construct appropriately. PostOfficeBox would go in the same place
  * StreetName currently is.
  */

  jsonPostalAddress: ({
    countryCode: CountryCode,
    postalCode: PostalCode,
    municipality: Municipality,
    addressLine: AddressLine,
    streetName: StreetName,
  } = {}) => ({
    PostalAddress: [
      { CountryCode }, { PostalCode }, { Municipality },
      { DeliveryAddress: [{ AddressLine }, { StreetName }] },
    ],
  }),

  validatePostalAddress({ countryCode, postalCode, municipality, addressLine, streetName } = {}) {
    Joi.assert({ countryCode, postalCode, municipality, addressLine, streetName }, {
      countryCode: Joi.string().length(2).required(),
      postalCode: Joi.string().length(5).required(),
      municipality: Joi.string().max(50).required(),
      addressLine: Joi.string().max(50).required(),
      streetName: Joi.string().max(50).required(),
    });
  },

  jsonHiringOrgContact: ({ postalAddress: PostalAddress } = {}) => ({
    Contact: [PostalAddress],
  }),

  validateHiringOrgContact({ countryCode, postalCode, municipality, addressLine, streetName }) {
    this.validatePostalAddress({ countryCode, postalCode, municipality, addressLine, streetName });
  },

  hiringOrgContact({ countryCode, postalCode, municipality, addressLine, streetName } = {}) {
    this.validateHiringOrgContact({
      countryCode, postalCode, municipality, addressLine, streetName,
    });

    if (!this.ref.HiringOrg) {
      throw new Error('Contact must be attached to a HiringOrg element. Did you call hiringOrg()?');
    }
    const postalAddress = this.jsonPostalAddress({
      countryCode, postalCode, municipality, addressLine, streetName,
    });

    this.ref.HiringOrg.push(this.jsonHiringOrgContact({ postalAddress }));

    return this;
  },

  /*
  * HRXML 0.99
  * <StartDate><Date>
  * Start date for publishing.
  * Can be set to sometime in the future.
  * If empty/not present, current date is used.
  *
  * Format: yyyy-mm-dd
  */

  /*
  * HRXML 0.99
  * <EndDate><Date>
  * Last date for publishing the job position on the job board.
  *
  * Format: yyyy-mm-dd
  */

  /*
  * HRXML 0.99
  * <FormattedName>
  * Recommended but not required.
  * Name of recruiter who registers the Job Position. Combination of
  * Given name and Family Name
  * This information is NOT published on the job board
  *
  * GivenName and FamilyName can be used instead. We're not, and it is not
  * imiplemented here.
  */

  /*
  * HRXML 0.99
  * <E-mail>
  */

  jsonPostDetail: ({
    startDate,
    endDate,
    recruiterName,
    recruiterEmail,
  } = {}) => ({
    PostDetail: [
      { StartDate: [
        { Date: startDate },
      ] },
      { EndDate: [
        { Date: endDate },
      ] },
      { PostedBy: [
        { Contact: [
          { PersonName: [
            { FormattedName: recruiterName },
          ] },
          { 'E-mail': recruiterEmail },
        ] },
      ] },
    ],
  }),

  validatePostDetail: ({ startDate, endDate, recruiterName, recruiterEmail }) => {
    Joi.assert({ startDate, endDate, recruiterName, recruiterEmail }, {
      startDate: Joi.string().isoDate().required(),
      endDate: Joi.string().isoDate().required(),
      recruiterName: Joi.string().max(100).required(),
      recruiterEmail: Joi.string().email(),
    });
  },

  postDetail({ startDate, endDate, recruiterName, recruiterEmail } = {}) {
    this.validatePostDetail({ startDate, endDate, recruiterName, recruiterEmail });

    if (!this.ref.JobPositionPosting) {
      throw new Error('PostDetail must be attached to a JobPositionPosting element. Did you call jobPositionPosting()?');
    }

    this.ref.JobPositionPosting.push(
      this.jsonPostDetail({ startDate, endDate, recruiterName, recruiterEmail }),
    );

    return this;
  },

  jsonJobPositionInformation: () => ({
    JobPositionInformation: [],
  }),

  jobPositionInformation() {
    if (!this.ref.JobPositionPosting) {
      throw new Error('JobPositionInformation must be attached to a JobPositionPosting element. Did you call jobPositionPosting()?');
    }

    this.ref.JobPositionPosting.push(this.jsonJobPositionInformation());

    this.makeRef({
      obj: this.ref,
      target: 'JobPositionInformation',
      parent: 'JobPositionPosting',
    });

    return this;
  },

  /* HRSML 0.99
  * <JobPositionTitle>
  * Position title; used as the headline in the advert.
  * We recommend that you include the title of the occupation in the headline.
  */

  jsonJobPositionTitle: ({ title: JobPositionTitle } = {}) => ({ JobPositionTitle }),

  validateJobPositionTitle: ({ title }) => {
    Joi.assert({ title }, {
      title: Joi.string().max(75).required(),
    });
  },

  jobPositionTitle({ title } = {}) {
    this.validateJobPositionTitle({ title });

    // make sure we have the required parent element
    if (!this.ref.JobPositionInformation) {
      this.jobPositionInformation();
    }
    this.ref.JobPositionInformation.push(this.jsonJobPositionTitle({ title }));

    return this;
  },

  /*
  * <JobPositionDescription>
  * Container element only. Should never need to call this directly
  */

  jsonJobPositionDescription: () => ({ JobPositionDescription: [] }),

  jobPositionDescription() {
    // make sure we have the required parent element
    if (!this.ref.JobPositionInformation) {
      this.jobPositionInformation();
    }
    this.ref.JobPositionInformation.push(this.jsonJobPositionDescription());

    this.makeRef({
      obj: this.ref,
      target: 'JobPositionDescription',
      parent: 'JobPositionInformation',
    });

    return this;
  },

  /*
  * HRXML 0.99
  * <JobPositionPurpose>
  * Description of the purpose of the job position.
  * Published in the text body of the advert.
  */

  jsonJobPositionPurpose: ({ purpose: JobPositionPurpose } = {}) => ({
    JobPositionPurpose,
  }),

  validateJobPositionPurpose: ({ purpose }) => {
    Joi.assert({ purpose }, {
      purpose: Joi.string().required(),
    });
  },

  jobPositionPurpose({ purpose } = {}) {
    this.validateJobPositionPurpose({ purpose });

    // make sure we have the required parent element
    if (!this.ref.JobPositionDescription) {
      this.jobPositionDescription();
    }
    this.ref.JobPositionDescription.push(this.jsonJobPositionPurpose({ purpose }));

    return this;
  },

  /*
  * HRXML 0.99
  * <PostalAddress>
  * Appears under the heading 'Arbetsgivare (Postadress/Besöksadress)' in the advert.
  */

  /*
  * HRXML 0.99
  * <CountryCode>
  * Country codes according to ISO 31661-1 alpha-2. (SE for Sweden.)
  */

  /*
  * HRXML 0.99
  * <PostalCode>
  * The postal code for the delivery address. Must be a valid postcode without spaces.
  */

  /*
  * HRXML 0.99
  * <PostAddress><Municipality>
  * Name of town/city for the delivery address
  *
  * Note: Municipality is defined everywhere else as a code.
  * We are using that definition here for the moment. If this is
  * not correct, we will need to differentiate between municipality and
  * municipality code.
  *
  * See also comment below for <LocationSummary><Municipality>.
  */

  /*
  * HRXML 0.99
  * <AddressLine>
  * Element can not be repeated.
  * The workplaces' visiting address.
  * Will be shown under heading 'Besöksadress' in the advert.
  */

  /*
  * HRXML 0.99
  * <StreetName>
  * Street name for the delivery address of the workplace.
  * (Either this or PostOfficeBox must be specified.)
  *
  * Note that PostOfficeBox is not implemented here. To make that a valid
  * option, check whether StreetName or PostOfficeBox is supplied and
  * construct appropriately. PostOfficeBox would go in the same place
  * StreetName currently is.
  */

  /*
  * <Recipient><OrganizationName> is defined in the docs here. It
  * is optional, and not implemented here.
  */

  /*
  * HRXML 0.99
  * <LocationSummary><Municipality>
  * A Swedish municipality code, used to make the job position searchable by location.
  * If Job location is in another country than Sweden then this should be set to 9999.
  */

  /*
  * HRXML 0.99
  * <CountryCode>
  * Country codes according to ISO 31661-1 alpha-2.
  * (SE for Sweden.)
  */

  jsonJobPositionLocation: ({
    municipality: Municipality,
    countryCode: CountryCode,
    postalAddress: PostalAddress,
  } = {}) => ({
    JobPositionLocation: [
      PostalAddress,
      { LocationSummary: [{ Municipality }, { CountryCode }] },
    ],
  }),

  validateJobPositionLocation({ countryCode, postalCode, municipality, addressLine, streetName }) {
    this.validatePostalAddress({ countryCode, postalCode, municipality, addressLine, streetName });
  },

  jobPositionLocation({
    countryCode,
    postalCode,
    municipality,
    addressLine,
    streetName,
  } = {}) {
    this.validateJobPositionLocation({
      countryCode, postalCode, municipality, addressLine, streetName,
    });

    // make sure we have the required parent element
    if (!this.ref.JobPositionDescription) {
      this.jobPositionDescription();
    }

    const postalAddress = this.jsonPostalAddress({
      countryCode,
      postalCode,
      municipality,
      addressLine,
      streetName,
    });
    this.ref.JobPositionDescription.push(this.jsonJobPositionLocation({
      municipality,
      countryCode,
      postalAddress,
    }));

    return this;
  },

  /*
  * HRXML 0.99
  * <FullTime>
  * If job position is full time (38 hours per week or more) this element must
  * be included in the file. No content inside the element is required.
  */

  /*
  * HRXML 0.99
  * <PartTime>
  * If job position is part time (less than 38 hours per week) this element must
  * be included in the file. No content inside the element is required.
  */

  /*
  * HRXML 0.99
  * <Schedule><SummaryText>
  * Information (free text) if position is full time, part time, etc.
  * E.g.  "part time 50%".
  * Published under heading 'Arbetstid Varaktighet'.
  */

  /*
  * HRXML 0.99
  * <Regular>
  * If the job position is permanent this element must be included in the file.
  */


  /*
  * HRXML 0.99
  * <Temporary>
  * If this element is specified, the element Temporary->TermLength must exist.
  */

  /*
  * HRXML 0.99
  * <Temporary><TermLength>
  * If the job position is temporary this element must be included in the file.
  *
  * The element has to contain one of the following codes:
  * 2: Temporary employment 6 months or longer
  * 3: Temporary employment 3-6 months
  * 4: Temporary employment during the summer months (June to August)
  * 7: Temporary employment 11 days to 3 months
  * 8: Temporary employment max 10 days
  *
  */

  /*
  * HRXML 0.99
  * <Duration><SummaryText>
  * Information (free text) if position is regular or temporary. If a temporary
  * employment is specified, the dates can be written here.
  * E.g. 'Visstidsanställning 2012-02-03 till 2012-06-30'.
  * Published under heading 'Arbetstid Varaktighet'.
  */

  jsonClassification: ({
    scheduleType,
    duration,
    termLength: TermLength,
    scheduleSummaryText,
    durationSummaryText,
  } = {}) => {
    let scheduleObj = {};

    if (scheduleType === 'full') {
      scheduleObj = { Schedule: [{ FullTime: '' }] };
    } else if (scheduleType === 'part') {
      scheduleObj = { Schedule: [{ PartTime: '' }] };
    }
    scheduleObj.Schedule.push({ SummaryText: scheduleSummaryText });

    let durationObj = {};
    if (duration === 'regular') {
      durationObj = { Duration: [{ Regular: '' }] };
    } else if (duration === 'temporary') {
      durationObj = {
        Duration: [{
          Temporary: [{ TermLength }],
        }],
      };
    }
    durationObj.Duration.push({ SummaryText: durationSummaryText });

    return { Classification: [scheduleObj, durationObj] };
  },

  validateClassification: ({
    scheduleType,
    duration,
    termLength,
  }) => {
    Joi.assert({
      scheduleType,
      duration,
      termLength,
    }, {
      scheduleType: Joi.string().valid(['full', 'part']).required(),
      duration: Joi.string().valid(['regular', 'temporary']).required(),
      termLength: Joi.when('scheduleType', {
        is: 'part',
        then: Joi.valid([2, 3, 4, 7, 8]).required(),
      }).description('Required if position is temporary'),
    });
  },

  classification({
    scheduleType,
    duration,
    scheduleSummaryText,
    durationSummaryText,
    termLength,
  } = { scheduleType: 'full', duration: 'regular' }) {
    this.validateClassification({
      scheduleType,
      duration,
      termLength,
    });

    // make sure we have the required parent element
    if (!this.ref.JobPositionDescription) {
      this.jobPositionDescription();
    }

    this.ref.JobPositionDescription.push(this.jsonClassification({
      scheduleType,
      duration,
      termLength,
      scheduleSummaryText,
      durationSummaryText,
    }));

    return this;
  },

  /*
  * HRXML 0.99
  * <SalaryMonthly:currency>
  * Documentations says only "Static value" and "unspecified" for value.
  * Assuming this will take any string.
  */

  /*
  * HRXML 0.99
  * <SalaryMonthly>
  * Must contain a numerical value to indicate whether salary is Fixed,
  * Comission, or Fixed plus Comission. Information is not published but is
  * used as a search criteria.
  *
  * The element has to contain one of the following codes:
  * 1: Fixed salary
  * 2: Fixed plus Comission
  * 3: Comission only
  */

  /*
  * HRXML 0.99
  * <Benefits><P>
  * Free text for type of benefits; car, housing, insurance package etc.
  */

  /*
  * HRXML 0.99
  * <SummaryText>
  * Free text for type of remuneration; monthly, weekly, etc.
  * Published under heading 'Lön'.
  */

  jsonCompensationDescription: ({
    currency,
    salaryType: SalaryMonthly,
    benefits: P,
    summary: SummaryText,
  } = {}) => ({
    CompensationDescription: [{
      Pay: [{
        SalaryMonthly: [{ _attr: { currency } }, SalaryMonthly],
      }],
    }, {
      BenefitsDescription: [{ P }],
    }, {
      SummaryText,
    }],
  }),

  validateCompensationDescription: ({ currency, salaryType, benefits, summary }) => {
    Joi.assert({
      currency,
      salaryType,
    }, {
      currency: Joi.any().required(),
      salaryType: Joi.number().valid([1, 2, 3]).required(),
    });
    if (benefits.length + summary.length > 255) {
      throw new Error('Summary text length plus benefits text length must not exceed 255 characters');
    }
  },

  compensationDescription({ currency, salaryType, benefits, summary } = {}) {
    this.validateCompensationDescription({ currency, salaryType, benefits, summary });
    this.ref.JobPositionDescription.push(this.jsonCompensationDescription({
      currency,
      salaryType,
      benefits,
      summary,
    }));

    if (benefits.length + summary.length > 255) {
      throw new Error('Summary text length plus benefits text length must not exceed 255 characters');
    }

    return this;
  },

  jsonJobPositionRequirements: () => ({ JobPositionRequirements: [] }),
  jobPositionRequirements() {
    this.ref.JobPositionInformation.push(this.jsonJobPositionRequirements());

    this.makeRef({
      obj: this.ref,
      target: 'JobPositionRequirements',
      parent: 'JobPositionInformation',
    });
    return this;
  },

  jsonQualificationsRequired: () => ({ QualificationsRequired: [] }),

  qualificationsRequired() {
    // make sure we have the required parent elements
    if (!this.ref.JobPositionInformation) {
      this.jobPositionInformation();
    }
    if (!this.ref.JobPositionRequirements) {
      this.jobPositionRequirements();
    }

    this.ref.JobPositionRequirements.push(this.jsonQualificationsRequired());

    this.makeRef({
      obj: this.ref,
      target: 'QualificationsRequired',
      parent: 'JobPositionRequirements',
    });

    return this;
  },

  /*
  * HRXML 0.99
  * <QualificationsRequired><P>
  * Recommended but not required.
  * Information about the required qualifications. Published in the text body
  * of the advert.
  */

  jsonQualificationsRequiredSummary: ({ summary: P } = {}) => ({ P }),

  validateQualificationsRequiredSummary: ({ summary }) => {
    Joi.assert({ summary }, { summary: Joi.string().optional() });
  },

  qualificationsRequiredSummary({ summary } = {}) {
    this.validateQualificationsRequiredSummary({ summary });
    // make sure we have the required parent elements
    if (!this.ref.JobPositionInformation) {
      this.jobPositionInformation();
    }
    if (!this.ref.QualificationsRequired) {
      this.qualificationsRequired();
    }

    this.ref.QualificationsRequired.push(this.jsonQualificationsRequiredSummary({ summary }));

    return this;
  },

  /*
  * HRXML 0.99
  * <Qualification>
  * This element is used to describe either that applicants are required to
  * have a drivers license, or that they have to have their own car.
  * The element can be repeated to indicate both.
  * If ommitted, no such requirements exist for this job position.
  *
  * Note that the element does not have a value, only attributes.
  * Example 1:
  * <Qualification type="license" description="DriversLicense" category="B,C1,C1E" />
  * Example 2:
  * <Qualification type="equipment" description="Car" />
  *
  * Alternatively (see <Qualification:type> and <Qualification:experience>, below):
  * This element is used to describe either that experience is required or not required
  */

  /*
  * HRXML 0.99
  * <Qualification:type>
  * Describes the type of Qualification. Only two different values are allowed:
  *    "license" indicates that a drivers licens is required.
  *    "equipment" indicates that the applicant must have her own car.
  */

  /*
  * HRXML 0.99
  * <Qualification:description>
  * Attribute is used together with the "type" attribute described above.
  * If "license" was specified as type, this should be set to "DriversLicense".
  * If "equipment" was specified as type, this should be set to "Car".
  */

  /*
  * HRXML 0.99
  * <Qualification:category>
  * This attribute is used to indicate the type of drivers license required.
  * Thus, it is only required if the description attribute described above is
  * set to "DriversLicense".
  */

  /*
  * HRXML 0.99
  * <Qualification:type>
  * Describes the type of Qualification.
  */

  /*
  * HRXML 0.99
  * <Qualification:yearsOfExperience>
  * This attribute is used to indicate if experience is a requirement.
  */

  /*
  * The <Qualification> tag appears to be used for one of three things:
  *   - indicate that a driver's license is required, and the type,
  *   - indicate that a car is required,
  *   - indicate that experience is required.
  *
  * Which attributes are required varies based on the qualification being
  * defined, eg.:
  *   <Qualification type="experience" yearsOfExperience="1"/>
  *   <Qualification type="license" description="DriversLicense" category="B,C1"/>
  *   <Qualification type="equipment" description="Car"/>
  *
  * Notes:
  *   The "experience" type is flagged as being required, while
  *   the other two are not. The XSDs indicate that this tag is entirely
  *   optional. This may be enforced at the application level, but is untested.
  *   Here we are assuming that it is in fact a required element.
  *
  *   The XSDs indicate other possible attributes and values for the
  *   Qualification element. (Values documented in HRXML 0.99 are starred):
  *   "type" can be one of:
  *     - skill
  *     - experience*
  *     - education
  *     - license*
  *     - certification
  *     - equipment*
  *     - other
  *
  *   Other attributes that may be present (attributes documented in HRXML 0.99
  *   are starred):
  *     - description*
  *     - yearsOfExperience*
  *     - level
  *     - interest
  *     - yearLastUsed
  *     - source
  *     - category*
  *
  *   Because of this ambiguity, minimal parameter checking is done in order
  *   to be as permissive as possible, while still checking that the
  *   attributes that are intended to go together do.
  *
  *   <Qualification:type>: must be one of:
  *     - skill
  *     - experience*
  *     - education
  *     - license*
  *     - certification
  *     - equipment*
  *     - other
  *
  *   <Qualification type="experience"> also requires a "yearsOfExperience" attribute.
  *   <Qualification type="license"> also requires a "description" with the value
  *     "DriversLicense" and a "category" attribute.
  *   <Qualification type="equipment"> requires  a "description" attribute with
  *     the value "Car"
  *
  *   The following attributes will pass:
  *     - type
  *     - description
  *     - yearsOfExperience
  *     - level
  *     - interest
  *     - yearLastUsed
  *     - source
  *     - category
  *
  *   Excepting the pairings noted above, any combination or value will pass.
  */

  jsonQualification: ({ _attr } = {}) => ({ Qualification: { _attr } }),

  validateQualification: ({ type, description, yearsOfExperience, category }) => {
    Joi.assert({
      type,
    }, {
      type: Joi.string().valid(['skill', 'experience', 'education', 'license',
        'certification', 'equipment', 'other']).optional(),
    });

    Joi.assert({
      type,
      yearsOfExperience,
    }, {
      type: Joi.string().optional(),
      yearsOfExperience: Joi.when('type', {
        is: 'experience',
        then: Joi.required(),
      }).description('If type is "experience", "yearsOfExperience" is required.'),
    });

    Joi.assert({
      type,
      description,
      category,
    }, {
      type: Joi.string().optional(),
      description: Joi.when('type', {
        is: 'license',
        then: Joi.string().valid('DriversLicense').required(),
      }).description('If type is "license", "description" must be "DriversLicense".'),
      category: Joi.when('type', {
        is: 'license',
        then: Joi.required(),
      }).description('If type is "license", "category" is required.'),
    });

    Joi.assert({
      type,
      description,
    }, {
      type: Joi.string().optional(),
      description: Joi.when('type', {
        is: 'equipment',
        then: Joi.string().valid('Car').required(),
      }).description('If type is "equipment", "description" must be "Car".'),
    });
  },

  qualification({ type, description, yearsOfExperience, category, ...attrs }) {
    // make sure we have the required parent elements
    if (!this.ref.QualificationsRequired) {
      this.qualificationsRequired();
    }

    this.validateQualification({ type, description, yearsOfExperience, category });
    // make sure we have the required parent element
    if (!this.ref.JobPositionRequirements) {
      this.jobPositionRequirements();
    }
    const _attr = {
      type,
      description,
      yearsOfExperience,
      category,
      ...attrs,
    };

    // some of our attributes may be undefined (not everything must be
    // passed in). Clean those out so we don't have spurious attributes.
    Object.keys(_attr).forEach(key => !_attr[key] && delete _attr[key]);

    this.ref.QualificationsRequired.push(this.jsonQualification({ _attr }));

    return this;
  },

  /*
  * HRXML 0.99
  * <QualificationsPreferred><P>
  * Recommended but not required.
  * Information about the preferred qualifications. Published in the text
  * body of the advert.
  */

  jsonQualificationsPreferred: () => ({ QualificationsPreferred: [] }),

  qualificationsPreferred() {
    // make sure we have the required parent elements
    if (!this.ref.JobPositionInformation) {
      this.jobPositionInformation();
    }
    if (!this.ref.JobPositionRequirements) {
      this.jobPositionRequirements();
    }

    this.ref.JobPositionRequirements.push(this.jsonQualificationsPreferred());

    this.makeRef({
      obj: this.ref,
      target: 'QualificationsPreferred',
      parent: 'JobPositionRequirements',
    });

    return this;
  },

  jsonQualificationsPreferredSummary: ({ summary: P } = {}) => ({ P }),

  validateQualificationsPreferredSummary: ({ summary }) => {
    Joi.assert({
      summary,
    }, {
      summary: Joi.required(),
    });
  },

  qualificationsPreferredSummary({ summary } = {}) {
    this.validateQualificationsPreferredSummary({ summary });
    // make sure we have the required parent elements
    if (!this.ref.JobPositionInformation) {
      this.jobPositionInformation();
    }
    if (!this.ref.QualificationsPreferred) {
      this.qualificationsPreferred();
    }

    this.ref.QualificationsPreferred.push(
      this.jsonQualificationsPreferredSummary({ summary }),
    );

    return this;
  },

  /*
  * <HowToApply>
  *
  * This element has one attribute, "distribute", which is required and must
  * be set to "external". These are used as the default parameters, so do
  * not need to be passed when calling.
  *
  * Neither howToApply() or applicationMethods() need to be called directly,
  * as they are called by byWeb().
  *
  * See note 2 in HRXML 0.99 regarding allowed length for the fields under this element.
  * Total length for text in all elements can be a maximum of 340 characters.
  * Currently, only the application method <ByWeb> is implemented, so this
  * length check is ONLY done against the <ByWeb><SummaryText> element.
  * If other application methods are implemented, this will need to be modified.
  */

  /*
  * HRXML 0.99
  * <URL>
  * A web address where applicants can register an application.
  * If present, a link is published with the text: 'Ansök via vår webplats'.
  * Maximum size is 200 characters.
  */

  /*
  * <HowToApply><ApplicationMethods><ByWeb><SummaryText>
  * Note that the HRXML 0.99 documentation is unclear on this. In the
  * spreadsheet <SummaryText> appears to be one element with it's immediate
  * parent being HowToApply. In the XSDs, it is an element that each
  * application method (ByWeb, InPerson, ByMail, etc.) has as a child.
  */

  jsonHowToApply: ({ distribute } = {}) => ({
    HowToApply: [{ _attr: { distribute } }],
  }),

  validateHowToApply: ({ distribute = 'external' } = { distribute: 'external' }) => {
    Joi.assert({ distribute }, { distribute: Joi.string().valid('external').required() });
  },

  howToApply({ distribute = 'external' } = { distribute: 'external' }) {
    this.validateHowToApply({ distribute });
    if (!this.ref.JobPositionPosting) {
      throw new Error('HowToApply must be attached to a JobPositionPosting element. Did you call jobPositionPosting()?');
    }

    this.ref.JobPositionPosting.push(this.jsonHowToApply({ distribute }));

    this.makeRef({
      obj: this.ref,
      target: 'HowToApply',
      parent: 'JobPositionPosting',
    });

    return this;
  },

  jsonApplicationMethods: () => ({ ApplicationMethods: [] }),

  applicationMethods() {
    if (!this.ref.HowToApply) {
      this.howToApply();
    }

    this.ref.HowToApply.push(this.jsonApplicationMethods());

    this.makeRef({
      obj: this.ref,
      target: 'ApplicationMethods',
      parent: 'HowToApply',
    });

    return this;
  },

  jsonByWeb: ({
    url: URL,
    summary: SummaryText,
  } = {}) => ({
    ByWeb: [{ URL }, { SummaryText }],
  }),

  validateByWeb: ({ url, summary }) => {
    Joi.assert({
      url,
      summary,
    }, {
      url: Joi.string().max(200).uri({
        scheme: ['http', 'https'],
      }),
      summary: Joi.string().max(340).optional(),
    });
  },

  byWeb({ url, summary } = {}) {
    this.validateByWeb({ url, summary });

    if (!this.ref.ApplicationMethods) {
      this.applicationMethods();
    }

    this.ref.ApplicationMethods.push(this.jsonByWeb({ url, summary }));

    return this;
  },

  /*
  * HRXML 0.99
  * E-mail address where applicants can send application.
  * If present, the option 'Apply by e-post' is enabled in the job advert.
  *
  * Max 100 characters
  */
  jsonByEmail: ({
    email,
  } = {}) => ({
    ByEmail: [{ 'E-mail': email }],
  }),

  validateByEmail: ({ email }) => {
    Joi.assert({
      email,
    }, {
      email: Joi.string().max(100).email(),
    });
  },

  byEmail({ email } = {}) {
    this.validateByEmail({ email });

    if (!this.ref.ApplicationMethods) {
      this.applicationMethods();
    }

    this.ref.ApplicationMethods.push(this.jsonByEmail({ email }));

    return this;
  },

  /*
  * HRXML 0.99
  * <NumberToFill>
  * Number of positions to be filled.
  * Any number between 1 and 999.
  */

  jsonNumberToFill: ({ number: NumberToFill } = {}) => ({ NumberToFill }),

  validateNumberToFill: ({ number }) => {
    Joi.assert({ number }, { number: Joi.number().max(999).required() });
  },

  numberToFill({ number } = {}) {
    this.validateNumberToFill({ number });
    if (!this.ref.JobPositionPosting) {
      throw new Error('NumberToFill must be attached to a JobPositionPosting element. Did you call jobPositionPosting()?');
    }

    this.ref.JobPositionPosting.push(this.jsonNumberToFill({ number }));

    return this;
  },

  jsonJPPExtension: () => ({ JPPExtension: [] }),

  jppExtension() {
    if (!this.ref.JobPositionPosting) {
      throw new Error('JPPExtension must be attached to a JobPositionPosting element. Did you call jobPositionPosting()?');
    }

    this.ref.JobPositionPosting.push(this.jsonJPPExtension());

    this.makeRef({
      obj: this.ref,
      target: 'JPPExtension',
      parent: 'JobPositionPosting',
    });

    return this;
  },

  /*
  * HRXML 0.99
  * <HiringOrgDescription>
  * Recommended but not required. Description of the company.
  */

  /*
  * HRXML 0.99
  * <OccupationGroup:code>
  * The job classification code for the job posting (according to code
  * type OccupationNameID)
  * Required.
  */

  /*
  * HRXML 0.99
  * <OccupationGroup:codename>
  * Type of job classification code used
  * Required, must be "OccupationNameID".
  * This is the default in occupationGroup() and does not need to be passed in.
  */

  jsonHiringOrgDescription: ({
    description: HiringOrgDescription,
  } = {}) => ({
    HiringOrgDescription,
  }),

  validateHiringOrgDescription: ({ description }) => {
    Joi.assert({ description }, { description: Joi.string().required() });
  },

  hiringOrgDescription({ description } = {}) {
    this.validateHiringOrgDescription({ description });
    if (!this.ref.JPPExtension) {
      this.jppExtension();
    }

    this.ref.JPPExtension.push(this.jsonHiringOrgDescription({ description }));

    return this;
  },

  jsonOccupationGroup: ({
    code,
    codename,
  } = {}) => ({
    OccupationGroup: [{ _attr: { code, codename } }],
  }),

  validateOccupationGroup: ({ code, codename = 'OccupationNameID' } = {}) => {
    Joi.assert({ code, codename }, {
      code: Joi.number().required(),
      codename: Joi.string().valid('OccupationNameID').optional(),
    });
  },

  occupationGroup({ code, codename = 'OccupationNameID' } = {}) {
    this.validateOccupationGroup({ code });
    if (!this.ref.JPPExtension) {
      this.jppExtension();
    }

    this.ref.JPPExtension.push(this.jsonOccupationGroup({ code, codename }));

    return this;
  },

});

module.exports = platsbankenVacancy;

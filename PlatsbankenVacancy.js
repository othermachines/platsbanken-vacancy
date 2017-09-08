/*
* Throughout there are comments preceded with "HRXML 0.99"
* These are notes take from the documentation provided by Arbetsförmedling
* in the file "Extern_hrxml_format_description_Vers 0 99.xls"
*/

const xml = require('xml');
const Joi = require('joi');

const PlatsbankenVacancy = ({
  xmlns = 'http://api.arbetsformedlingen.se/ledigtarbete',
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

  toXml: (obj, options = {}) => xml(obj, options),
  toString() { return this.toXml(this.doc, this.xmlOptions); },

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
  sender({ id, email } = {}) {
    Joi.assert({ id, email }, {
      id: Joi.number().integer().positive(),
      email: Joi.string().email(),
    });

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
  transaction({ id } = {}) {
    Joi.assert({ id }, { id: Joi.string().required() });

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
  */
  jsonJobPositionPosting: ({
    id: JobPositionPostingId,
    status,
  } = { status: 'active' }) => ({
    JobPositionPosting: [{ _attr: { status } }, { JobPositionPostingId }],
  }),
  jobPositionPosting({ id, status = 'active' } = { status: 'active' }) {
    Joi.assert({ id, status }, {
      id: Joi.string().max(50).required(),
      status: Joi.valid(['active', 'inactive']),
    });

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
    url: Website,
  } = {}) => ({
    HiringOrg: [{ HiringOrgName }, { HiringOrgId }, { Website }],
  }),
  hiringOrg({ name, id, url } = {}) {
    Joi.assert({ name, id, url }, {
      name: Joi.string().required(),
      id: Joi.string().required(),
      url: Joi.string().optional(),
    });

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

  hiringOrgContact({ countryCode, postalCode, municipality, addressLine, streetName } = {}) {
    // throws error on failure
    this.validatePostalAddress({ countryCode, postalCode, municipality, addressLine, streetName });

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
  postDetail({ startDate, endDate, recruiterName, recruiterEmail } = {}) {
    Joi.assert({ startDate, endDate, recruiterName, recruiterEmail }, {
      startDate: Joi.string().isoDate().required(),
      endDate: Joi.string().isoDate().required(),
      recruiterName: Joi.string().max(100).required(),
      recruiterEmail: Joi.string().email(),
    });

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
  jobPositionTitle({ title } = {}) {
    Joi.assert({ title }, {
      title: Joi.string().max(75).required(),
    });

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
  jobPositionPurpose({ purpose } = {}) {
    Joi.assert({ purpose }, {
      purpose: Joi.string().required(),
    });

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
  jobPositionLocation({
    countryCode,
    postalCode,
    municipality,
    addressLine,
    streetName,
  } = {}) {
    // throws error on failure
    this.validatePostalAddress({ countryCode, postalCode, municipality, addressLine, streetName });

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

  classification({
    scheduleType,
    duration,
    scheduleSummaryText,
    durationSummaryText,
    termLength,
  } = { scheduleType: 'full', duration: 'regular' }) {
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
        SalaryMonthly: [{ _attr: { currency } }, { SalaryMonthly }],
      }],
    }, {
      SummaryText,
    }, {
      Benefits: [{ P }],
    }],
  }),

  compensationDescription({ currency, salaryType, benefits, summary } = {}) {
    this.ref.JobPositionDescription.push(this.jsonCompensationDescription({
      currency,
      salaryType,
      benefits,
      summary,
    }));

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

  qualificationsRequiredSummary({ summary } = {}) {
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

});

module.exports = PlatsbankenVacancy;

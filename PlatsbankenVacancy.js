/*
* Throughout there are comments preceded with "HRXML 0.99"
* These are notes take from the documentation provided by Arbetsförmedling
* in the file "Extern_hrxml_format_description_Vers 0 99.xls"
*/

const xml = require('xml');

const Validator = require('better-validator');

/* validators */
isRequired = o => o.required();
isPosInt = o => o.isNumber().integer().isPositive().required();
isEmail = o => o.isString().isEmail().required();
isActiveInactive = o => o.isString().isIn(['active', 'inactve']).required();

/*
* A bit of sugar to make better-validator more concise.
*
* rather than:
*   const valitador = new Validator();
*   validator(123).isNumber();
*   const errs = validator.run();
*   if (errs.length) { ... }
*
* we can do
*   if (fails(123, o => o.isNumber()) { ... }
*/
const fails = (o, fn) => {
  const validator = new Validator();
  return validator(o, fn).length;
};

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
    if (obj[target]) {
      throw new Error(`"${target}" already exists as a reference key.`);
    }
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
  rawSender: ({ id, email } = {}) => ({ Sender: { _attr: { id, email } } }),
  sender({ id, email } = {}) {
    if (fails(id, isPosInt)) {
      throw new Error(`id must be a positive integer, "${id}" received`);
    }
    if (fails(email, isEmail)) {
      throw new Error(`email must be an email address, "${email}" received`);
    }
    this.doc.Envelope.push(this.rawSender({ id, email }));
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
  rawTransaction: ({ id: TransactId } = {}) => {
    const _attr = { timeStamp: '2017-08-20T18:40:49Z' };
    return { TransactInfo: [{ _attr }, { TransactId }] };
  },
  transaction(id) {
    if (fails(id, isRequired)) {
      throw new Error(`A transaction id is required.`);
    }
    this.doc.Envelope.push(this.rawTransaction({ id }));

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
  rawPacket: ({ id = 1 } = { id: 1 }) => ({
    Packet: [{ PacketInfo: [{ PacketId: id }] }, { Payload: [] }],
  }),
  packet() {
    this.packetCount = this.packetCount + 1;

    this.ref.Envelope = this.doc.Envelope;
    this.ref.Envelope.push(this.rawPacket(this.packetCount));

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
  rawJobPositionPosting: ({
    id: JobPositionPostingId,
    status,
  } = { status: 'active' }) => ({
    JobPositionPosting: [{ _attr: { status } }, { JobPositionPostingId }],
  }),
  jobPositionPosting({ id, status = 'active' } = { status: 'active' }) {
    if (fails(status, isActiveInactive)) {
      throw new Error(`Status must be "active" or "inactive", "${status}" received`);
    }

    if (!this.ref.Payload) {
      throw new Error('JobPositionPosting must be attached to a Payload element. Did you call transaction()?');
    }

    this.ref.Payload.push(this.rawJobPositionPosting({ id, status }));

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

  rawHiringOrg: ({
    name: HiringOrgName,
    id: HiringOrgId,
    url: Website,
  } = {}) => ({
    HiringOrg: [{ HiringOrgName }, { HiringOrgId }, { Website }],
  }),
  hiringOrg({ name, id, url } = {}) {
    if (fails(name, isRequired)) {
      throw new Error(`Organization name is required.`);
    }
    if (fails(id, isRequired)) {
      throw new Error(`Organziation id is required.`);
    }
    if (fails(url, o => o.isString().isURL())) {
      throw new Error(`url (if used) should be a fully qualified URL, "${url}" recieved.`);
    }

    if (!this.ref.JobPositionPosting) {
      throw new Error('HiringOrg must be attached to a JobPositionPosting element. Did you call jobPositionPosting()?');
    }

    this.ref.JobPositionPosting.push(this.rawHiringOrg({ name, id, url }));

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

  rawJobPostingContact: ({
    countryCode: CountryCode,
    postalCode: PostalCode,
    municipality: Municipality,
    addressLine: AddressLine,
    streetName: StreetName,
  } = {}) => ({
    Contact: [
      { PostalAddress: [{ CountryCode }, { PostalCode }, { Municipality }] },
      { DeliveryAddress: [{ AddressLine }, { StreetName }] },
    ],
  }),
  jobPostingContact({ countryCode, postalCode, municipality, addressLine, streetName } = {}) {
    if (fails(countryCode, o =>
      o.isString()
        .isLength({ min: 2, max: 2 })
        .required())) {
      throw new Error(`countryCode is required and must be 2 characters.`);
    }
    if (fails(postalCode, o =>
      o.isString()
        .isLength({ min: 5, max: 5 })
        .required())) {
      throw new Error(`postalCode is required and must be 5 characters.`);
    }
    if (fails(municipality, o =>
      o.isString()
        .isLength({ min: 0, max: 50 })
        .required())) {
      throw new Error(`municipality is required and must be less than 50 characters.`);
    }
    if (fails(addressLine, o =>
      o.isString()
        .isLength({ min: 0, max: 50 })
        .required())) {
      throw new Error(`addressLine must be less than 50 characters.`);
    }
    if (fails(streetName, o =>
      o.isString()
        .isLength({ min: 0, max: 50 })
        .required())) {
      throw new Error(`streetName must be less than 50 characters.`);
    }

    if (!this.ref.HiringOrg) {
      throw new Error('Contact must be attached to a HiringOrg element. Did you call hiringOrg()?');
    }

    this.ref.HiringOrg.push(this.rawJobPostingContact({
      countryCode, postalCode, municipality, addressLine, streetName,
    }));

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

  rawPostDetail: ({
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
    if (fails(startDate, o =>
      o.isString()
        .isISO8601()
        .isLength({ min: 10, max: 10 }))) {
      throw new Error(`startDate must be a 10 character date, yyyy-mm-dd.`);
    }
    if (fails(endDate, o =>
      o.isString()
        .isISO8601()
        .isLength({ min: 10, max: 10 })
        .required())) {
      throw new Error(`endDate is required and must be a 10 character date, yyyy-mm-dd.`);
    }
    if (fails(recruiterName, o => o.isString().required())) {
      throw new Error(`recruiterName is required and should be a string.`);
    }
    if (fails(recruiterEmail, o => o.isString().isEmail())) {
      throw new Error(`recruiterName is required and should be an email address, received "${recruiterEmail}".`);
    }

    if (!this.ref.JobPositionPosting) {
      throw new Error('PostDetail must be attached to a JobPositionPosting element. Did you call jobPositionPosting()?');
    }

    this.ref.JobPositionPosting.push(
      this.rawPostDetail({ startDate, endDate, recruiterName, recruiterEmail }),
    );

    return this;
  },

  rawJobPositionInformation: () => ({
    JobPositionInformation: [],
  }),
  jobPositionInformation() {
    if (!this.ref.JobPositionPosting) {
      throw new Error('PostDetail must be attached to a JobPositionPosting element. Did you call jobPositionPosting()?');
    }

    this.ref.JobPositionPosting.push(this.rawJobPositionInformation());
  },

  jobPositionPurpose() {
    if (!this.ref.JobPositionPosting) {
      throw new Error('PostDetail must be attached to a JobPositionPosting element. Did you call jobPositionPosting()?');
    }
    return this;
  },

  jobPositionLocation() {
    return this;
  },

});

module.exports = PlatsbankenVacancy;

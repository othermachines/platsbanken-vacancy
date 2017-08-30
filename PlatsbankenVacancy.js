/*
* Throughout there are comments preceded with "HRXML 0.99"
* These are notes take from the documentation provided by Arbetsförmedling
* in the file "Extern_hrxml_format_description_Vers 0 99.xls"
*/

const xml = require('xml');

const PlatsbankenVacancy = ({
  xmlns = 'http://api.arbetsformedlingen.se/ledigtarbete',
  version = '0.52',
  xmlOptions = { indent: '  ' },
} = {}) => ({
  xmlns,
  version,
  xmlOptions,

  packetCount: 0,
  ref: {
    Packet: [],
    Payload: [],
  },

  doc: {
    Envelope: [{
      _attr: { xmlns, version },
    }],
  },

  toXml: (obj, options = {}) => xml(obj, options),
  toString() { return this.toXml(this.doc, this.xmlOptions); },

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
    Packet: [{
      PacketInfo: [{
        PacketId: id,
      }],
    }, {
      Payload: [],
    }],
  }),
  packet() {
    this.packetCount = this.packetCount + 1;

    this.doc.Envelope.push(this.rawPacket(this.packetCount));
    this.ref.Packet = this.doc.Envelope[this.doc.Envelope.length - 1].Packet;
    this.ref.Payload = this.ref.Packet[this.ref.Packet.length - 1].Payload;

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
    status, postingId: JobPositionPostingId,
  } = { status: 'active' }) => {
    if (status !== 'active' && status !== 'inactive') {
      throw new Error(`Status must be "active" or "inactive", "${status}" received`);
    }
    return {
      JobPositionPosting: [{
        _attr: { status },
      }, {
        JobPositionPostingId,
      }],
    };
  },
  jobPositionPosting({ status = 'active', postingId } = { status: 'active' }) {
    this.ref.Payload.push(this.rawJobPositionPosting({ status, postingId }));

    return this;
  },
});

module.exports = PlatsbankenVacancy;

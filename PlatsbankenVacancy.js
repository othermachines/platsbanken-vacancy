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
  rawSender: (id, email) => ({ Sender: { _attr: { id, email } } }),
  sender(id, email) {
    this.doc.Envelope.push(this.rawSender(id, email));
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
  rawTransaction: (id) => {
    const timeStamp = '2017-08-20T18:40:49Z';
    return {
      TransactInfo: [
        { _attr: { timeStamp } },
        { TransactId: id },
      ],
    };
  },
  transaction(id) {
    this.doc.Envelope.push(this.rawTransaction(id));

    // one transaction can contain many packets
    // but each transaction must have at least one
    this.packetCount = this.packetCount + 1;
    this.doc.Envelope.push(this.rawPacket(this.packetCount));

    return this;
  },

  /*
  * HRXML 0.99
  * <PacketId>
  * One Envelope can contain many packets. PacketID is the identifier for
  * each packet. This should be a counter, starting at 1, and is used
  * for traceability.
  */
  rawPacket: (id = 1) => ({
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
    return this;
  },

});
module.exports = PlatsbankenVacancy;

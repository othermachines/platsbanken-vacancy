const xml = require('xml');

/**
 * Create an XML document (or fragement) suitable for submission to
 *  Arbetsföremedlingen Platsbanken
 *
 * @param  {string} xmlns    XML namespace
 * @param  {string} version  Version of HR-XML-SE used. As of 2017-08-24
 *  must be "0.52"
 * @param  {type} xmlOptions Options to be passed to xml(). Cf. Node xml
 * @return {type}            Returns new PlatsbankenVacancy object
 */
const PlatsbankenVacancy = function PlatsbankenVacancy(xmlns, version, xmlOptions) {
  this.options = xmlOptions;
  this.doc = {
    Envelope: [{
      _attr: { xmlns, version },
    }],
  };
};

PlatsbankenVacancy.prototype.toXml = (obj, options = {}) => xml(obj, options);

PlatsbankenVacancy.prototype.toString = function toString() {
  return this.toXml(this.doc, this.options);
};

PlatsbankenVacancy.prototype.rawSender = (id, email) => (
  { Sender: { _attr: { id, email } } }
);

/**
 * sender - description
 *
 * @param  {type} id    description
 * @param  {type} email description
 * @return {type}       description
 */
PlatsbankenVacancy.prototype.sender = function sender(id, email) {
  this.doc.Envelope.push(this.rawSender(id, email));
  return this;
};

PlatsbankenVacancy.prototype.transaction = function transaction(id) {
  const timeStamp = '2017-08-20T18:40:49Z';

  this.doc.Envelope.push({
    TransactionInfo: [
      {
        _attr: { timeStamp },
      }, {
        TransactId: id,
      },
    ],
  });
  return this;
};

module.exports = PlatsbankenVacancy;

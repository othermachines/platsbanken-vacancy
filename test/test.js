const chai = require('chai');

chai.use(require('chai-things'));

const expect = chai.expect;
const Vacancy = require('../build/PlatsbankenVacancy.js');

const options = {
  indent: '  ',
};
const request = Vacancy('http://arbetsformedlingen.se/LedigtArbete', '0.52', options);


describe('PlatsbankenVacancy', () => {
  describe('sender()', () => {
    // should fail
    it('should require an id', () => {
      expect(() =>
        request.sender({ email: 'foo@example.org' }))
        .to.throw();
    });
    it('should require an email', () => {
      expect(() =>
        request.sender({ id: 1 }))
        .to.throw();
    });
    it('should require a valid email', () => {
      expect(() =>
        request.sender({ id: 1, email: 'notanemail' }))
        .to.throw();
    });

    // should pass
    it('should accept a numeric id and a valid email', () => {
      expect(() =>
        request.sender({ id: 1, email: 'foo@example.org' }))
        .to.not.throw();
    });
    it('should add a Sender tag with attributes to the Envelope', () => {
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
    // should fail
    it('should require an id', () => {
      expect(() =>
        request.transaction({}))
        .to.throw();
    });

    // should pass
    it('should accept a string id', () => {
      expect(() =>
        request.transaction({ id: 'valid' }))
        .to.not.throw();
    });
    it('should add the TransactInfo tag set to the Envelope', () => {
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
});

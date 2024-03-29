import chai from 'chai';
import chaiHttp from 'chai-http';

const { expect } = chai;
chai.use(chaiHttp);

describe('Testing the http API', () => {
  let vk;
  it('should respond with status 200 to the health check', done => {
    chai
      .request('http://localhost:8080')
      .get('/healthcheck')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });
  it('should load a zokrates file', done => {
    chai
      .request('http://localhost:8080')
      .post('/load-circuits')
      .attach('circuits', 'circuits/test/factor.zok')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal('File factor.zok was uploaded');
        expect(res.body.data.name).to.equal('factor.zok');
        done();
      });
  });
  it('should load a tar-ed set of zokrates file', done => {
    chai
      .request('http://localhost:8080')
      .post('/load-circuits')
      .attach('circuits', 'circuits/test/multiple.tar')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal('File multiple.tar was uploaded');
        expect(res.body.data.name).to.equal('multiple.tar');
        done();
      });
  });
  it('should generate a proving and verifying keys (trusted setup) and return the verifying key', done => {
    chai
      .request('http://localhost:8080')
      .post('/generate-keys')
      .set('Content-Type', 'application/json')
      .send({
        filepath: 'factor.zok',
        curve: 'bn128',
        provingScheme: 'gm17',
        backend: 'libsnark',
      })
      .end((err, res) => {
        expect(res.body).to.have.property('vk');
        expect(res.body.vk).to.have.property('query');
        expect(res.body.vk.h).to.be.instanceof(Array);
        vk = res.body.vk;
        done();
      });
  });
  it('should get the vk', done => {
    chai
      .request('http://localhost:8080')
      .get('/vk')
      .query({ folderpath: 'factor' })
      .end((err, res) => {
        expect(res.status).to.equal(200);
        expect(res.body.vk.h[0][0]).to.equal(vk.h[0][0]);
        done();
      });
  });
  it('should fail on malformed inputs', done => {
    chai
      .request('http://localhost:8080')
      .post('/generate-proof')
      .set('Content-Type', 'application/json')
      .send({
        folderpath: 'factor',
        inputs: [24534, 1468, 12458],
        transactionInputs: 'test',
        provingScheme: 'gm17',
        backend: 'libsnark',
      })
      .end((err, res) => {
        expect(res.error.status).to.equal(500);
        done();
      });
  });
  it('should generate a proof', done => {
    chai
      .request('http://localhost:8080')
      .post('/generate-proof')
      .set('Content-Type', 'application/json')
      .send({
        folderpath: 'factor',
        inputs: [6, 3, 2],
        transactionInputs: 'test',
        provingScheme: 'gm17',
        backend: 'libsnark',
      })
      .end((err, res) => {
        expect(res.body).to.have.property('proof');
        expect(res.body).to.have.property('type');
        expect(res.body).to.have.property('transactionInputs');
        expect(res.body.proof).to.have.property('a');
        expect(res.body.proof).to.have.property('b');
        expect(res.body.proof).to.have.property('c');
        expect(res.body.proof.a).to.be.instanceof(Array);
        expect(res.body.type).to.equal('factor');
        done();
      });
  });
});

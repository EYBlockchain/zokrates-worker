import chai from 'chai';
import fs from 'fs';

import rabbitmq from '../src/utils/rabbitmq.mjs';

const fileToBuffer = filename => {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filename);
    const chunks = [];

    // Handle any errors while reading
    readStream.on('error', err => {
      return reject(err);
    });

    // Listen for data
    readStream.on('data', chunk => {
      chunks.push(chunk);
    });

    // File is done being read
    readStream.on('close', () => {
      resolve(Buffer.concat(chunks));
    });
  });
};

const generateUuid = () => `${Math.random()}${Math.random()}${Math.random()}`;

const { expect } = chai;
let file;

const { env } = process;
env.RABBITMQ_HOST = 'amqp://localhost';
env.RABBITMQ_PORT = '5672';

process.on('unhandledRejection', () => {});

describe('Testing the Zokrates queue mechanism', () => {
  before(async () => {
    await rabbitmq.connect();
    file = {
      name: 'multiple.tar',
      data: (await fileToBuffer('./circuits/test/multiple.tar')).toString(),
    };
  });

  after(() => rabbitmq.close());

  it('should load a zokrates file', done => {
    const correlationId = generateUuid();
    const queue = 'load-circuits';
    const replyTo = `${queue}-reply`; // replyTo queue

    rabbitmq.sendMessage(queue, file, {
      correlationId,
      replyTo,
    });

    rabbitmq.listenToReplyQueue(replyTo, correlationId, response => {
      expect(response).to.have.property('data');
      expect(response.data).to.have.property('message');
      expect(response.data.message).to.equal('File multiple.tar was uploaded');
      done();
    });
  });

  it('should generate a proving and verifying keys (trusted setup) and return the verifying key', done => {
    const correlationId = generateUuid();
    const queue = 'generate-keys';
    const replyTo = `${queue}-reply`; // replyTo queue

    rabbitmq.sendMessage(
      queue,
      {
        filepath: 'factor.zok',
        curve: 'bn128',
        provingScheme: 'gm17',
        backend: 'libsnark',
      },
      {
        correlationId,
        replyTo,
      },
    );

    rabbitmq.listenToReplyQueue(replyTo, correlationId, response => {
      expect(response).to.have.property('data');
      expect(response.data).to.have.property('vk');
      expect(response.data.vk).to.have.property('query');
      expect(response.data.vk.h).to.be.instanceof(Array);
      done();
    });
  });

  it('Should fail on malformed inputs', done => {
    const correlationId = generateUuid();
    const queue = 'generate-proof';
    const replyTo = `${queue}-reply`; // replyTo queue

    rabbitmq.sendMessage(
      queue,
      {
        folderpath: 'factor',
        inputs: [13, 3, 2],
        transactionInputs: 'test',
        provingScheme: 'gm17',
        backend: 'libsnark',
      },
      {
        correlationId,
        replyTo,
      },
    );

    rabbitmq.listenToReplyQueue(replyTo, correlationId, response => {
      expect(response.error).to.be.string('Proof generation failed');
      done();
    });
  });

  it('should generate a proof', done => {
    const correlationId = generateUuid();
    const queue = 'generate-proof';
    const replyTo = `${queue}-reply`; // replyTo queue

    rabbitmq.sendMessage(
      queue,
      {
        folderpath: 'factor',
        inputs: [6, 3, 2],
        transactionInputs: 'test',
        provingScheme: 'gm17',
        backend: 'libsnark',
      },
      {
        correlationId,
        replyTo,
      },
    );

    rabbitmq.listenToReplyQueue(replyTo, correlationId, response => {
      expect(response).to.have.property('type');
      expect(response).to.have.property('data');
      expect(response.data).to.have.property('proof');
      expect(response.data).to.have.property('transactionInputs');
      expect(response.data.proof).to.have.property('a');
      expect(response.data.proof).to.have.property('b');
      expect(response.data.proof).to.have.property('c');
      expect(response.data.proof.a).to.be.instanceof(Array);
      expect(response.data.type).to.equal('factor');
      expect(response.data.transactionInputs).to.equal('test');
      done();
    });
  });
});

import amqp from 'amqplib';
import queues from '../queues/index.mjs';
import logger from '../utils/logger.mjs';

let connection;
let channel;

// connect to RabbitMQ server.
const connect = async () => {
  logger.info('[AMQP] Connecting...');
  connection = await amqp.connect(`${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`);
  connection.on('error', err => {
    if (err.message !== 'Connection closing') {
      logger.error(`[AMQP] Connection error: ${err.message}`);
      return setTimeout(connect, 1000);
    }
  });
  connection.on('close', () => {
    logger.debug('[AMQP] Reconnecting');
    return setTimeout(connect, 1000);
  });
  channel = await connection.createChannel();
  channel.prefetch(1);
  queues();
};

// publish message to a queue
const sendMessage = async (queue, data, options = {}) => {
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), options);
};

// only called from test-suite ./test/queue.mjs
const cancelChannelConsume = consumerTag => {
  channel.cancel(consumerTag);
};

const sendACK = message => {
  channel.ack(message);
};

// only called from test-suite ./test/queue.mjs
const sendNACK = message => {
  channel.nack(message);
};

/*
 * Consumer: receive message from a queue
 */
const receiveMessage = async (queue, callback) => {
  await channel.assertQueue(queue);
  channel.consume(queue, callback, { noAck: false });
};

// only called from test-suite ./test/queue.mjs
const listenToReplyQueue = async (queue, correlationId, callback) => {
  logger.info(`[AMQP] Listening to reply queue: ${queue}`);
  receiveMessage(queue, message => {
    if (message.properties.correlationId !== correlationId) {
      logger.debug(`[AMQP] Sending NACK due to different correlation id: ${JSON.stringify({ message: message.properties.correlationId, param: correlationId })}`);
      return sendNACK(message);
    }
    cancelChannelConsume(message.fields.consumerTag);
    sendACK(message);

    const response = JSON.parse(message.content.toString());
    response.type = message.properties.type;

    return callback(response);
  });
};

// only called from test-suite ./test/queue.mjs
const close = async () => {
  await channel.close();
  await connection.close();
};

export default {
  connection,
  channel,
  connect,
  sendMessage,
  cancelChannelConsume,
  sendACK,
  sendNACK,
  receiveMessage,
  listenToReplyQueue,
  close,
};

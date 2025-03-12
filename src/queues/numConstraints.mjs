import rabbitmq from '../utils/rabbitmq.mjs';
import logger from '../utils/logger.mjs';
import numConstraints from '../services/numConstraints.mjs';

export default function receiveMessage() {
  rabbitmq.receiveMessage('num_constraints', async message => {
    const { replyTo, correlationId } = message.properties;
    const response = {
      error: null,
      data: null,
    };

    try {
      response.data = await numConstraints(JSON.parse(message.content.toString()));
    } catch (err) {
      logger.error('Error due num_constraints', err);
      response.error = 'Number of constraints check failed';
    }

    rabbitmq.sendMessage(replyTo, response, { correlationId });
    rabbitmq.sendACK(message);
  });
}

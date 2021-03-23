import rabbitmq from '../utils/rabbitmq.mjs';
import logger from '../utils/logger.mjs';
import verify from '../services/verify.mjs';

export default function receiveMessage() {
  rabbitmq.receiveMessage('verify', async message => {
    const { replyTo, correlationId } = message.properties;

    const response = {
      error: null,
      data: null,
    };

    try {
      const verifies = await verify(JSON.parse(
        message.content.toString(),
      ));
      response.data = { verifies };
    } catch (err) {
      logger.error('Error in verify', err);
      response.error = 'Verify failed';
    }


    rabbitmq.sendMessage(replyTo, response, { correlationId });
    rabbitmq.sendACK(message);
  });
}

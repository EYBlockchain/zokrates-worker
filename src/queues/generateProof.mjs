// eslint-disable-next-line import/no-cycle
import rabbitmq from '../utils/rabbitmq.mjs';
import logger from '../utils/logger.mjs';
import generateProof from '../services/generateProof.mjs';
import formatTrackingID from '../utils/formatter.mjs';

export default function receiveMessage() {
  rabbitmq.receiveMessage('generate-proof', async message => {
    const { replyTo, correlationId } = message.properties;

    const response = {
      error: null,
      data: null,
    };

    let trackingID = '';
    try {
      trackingID = JSON.parse(message.content.toString()).trackingID;
      response.data = await generateProof(
        JSON.parse(message.content.toString()),
      );
    } catch (err) {
      logger.error(
        `${formatTrackingID(trackingID)} Error in generate-proof:`,
        err,
      );
      response.error = `${formatTrackingID(
        trackingID,
      )} Proof generation failed`;
    }

    rabbitmq.sendMessage(replyTo, response, { correlationId });
    try {
      rabbitmq.sendACK(message);
    } catch (error) {
      logger.warn(
        `The acknowledgement failed, the channel was closed: ${error}`,
      );
    }
  });
}

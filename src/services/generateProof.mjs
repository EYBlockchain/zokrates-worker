import fs from 'fs';
import util from 'util';
import crypto from 'crypto';
import zokrates from '@eyblockchain/zokrates-zexe.js';
import path from 'path';
import { getProofFromFile } from '../utils/filing.mjs';
import logger from '../utils/logger.mjs';
import { formatTrackingID } from '../utils/formatter.mjs';

const unlink = util.promisify(fs.unlink);

export default async function ({
  folderpath,
  inputs,
  transactionInputs,
  outputDirectoryPath,
  proofFileName,
  backend = 'bellman',
  provingScheme = 'g16',
  trackingID,
}) {
  const outputPath = `./output`;
  let proof, publicInputs;

  // unique hash to name witness and proof.json files
  // to avoid overwrite on concurrent call.
  const fileNamePrefix = (await crypto.randomBytes(32)).toString('hex');

  const circuitName = path.basename(folderpath);
  const witnessFile = `${circuitName}_${fileNamePrefix}_witness`;
  const proofJsonFile = `${circuitName}_${fileNamePrefix}_proof.json`;

  if (fs.existsSync(`${outputPath}/${folderpath}/${witnessFile}`)) {
    throw Error(`${formatTrackingID(trackingID)} Witness file with same name exists`);
  }

  if (fs.existsSync(`${outputPath}/${folderpath}/${proofJsonFile}`)) {
    throw Error(`${formatTrackingID(trackingID)} proof.json file with same name exists`);
  }

  const opts = {};
  opts.createFile = true;
  opts.directory = outputDirectoryPath || `./output/${folderpath}`;
  opts.fileName = proofFileName || `${proofJsonFile}`;

  try {
    logger.info(`${formatTrackingID(trackingID)} Compute witness...`);
    await zokrates.computeWitness(
      `${outputPath}/${folderpath}/${circuitName}_out`,
      `${outputPath}/${folderpath}/`,
      `${witnessFile}`,
      inputs,
    );

    logger.info(`${formatTrackingID(trackingID)} Generate proof...`);
    await zokrates.generateProof(
      `${outputPath}/${folderpath}/${circuitName}_pk.key`,
      `${outputPath}/${folderpath}/${circuitName}_out`,
      `${outputPath}/${folderpath}/${witnessFile}`,
      provingScheme,
      backend,
      opts,
    );

    ({ proof, inputs: publicInputs } = await getProofFromFile(`${folderpath}/${proofJsonFile}`));

    logger.info(`Complete`);
    logger.debug(`${formatTrackingID(trackingID)}Responding with proof and inputs:`);
    logger.debug(publicInputs);
  } finally {
    try {
      await unlink(`${outputPath}/${folderpath}/${witnessFile}`);
      await unlink(`${outputPath}/${folderpath}/${proofJsonFile}`);
    } catch {
      // No files to delete. Do nothing.
    }
  }

  return {
    proof,
    inputs: publicInputs,
    transactionInputs,
    type: folderpath,
  };
}

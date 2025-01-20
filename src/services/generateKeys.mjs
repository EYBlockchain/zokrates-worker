import fs from 'fs';
import path from 'path';
import { compile, extractVk, exportKeys, setup } from '../zokrates-lib/index.mjs';
import logger from '../utils/logger.mjs';

export default async function generateKeys({ filepath, curve = 'bn128' }) {
  const outputPath = `./output`;
  const circuitsPath = `./circuits`;

  const ext = path.extname(filepath);
  const circuitName = path.basename(filepath, '.zok'); // filename without '.zok'
  const circuitDir = filepath.replace(ext, '');

  fs.mkdirSync(`${outputPath}/${circuitDir}`, { recursive: true });

  logger.info(
    `${circuitsPath}/${filepath}`,
    `${outputPath}/${circuitDir}`,
    `${circuitName}_out`,
    curve,
  );

  logger.info('Compile...');
  const compileResult = await compile(
    `${circuitsPath}/${filepath}`,
    `${outputPath}/${circuitDir}`,
    `${circuitName}_out`,
    curve,
  );
  const regex = /Number of constraints:\s*(\d+)/;
  const match = compileResult.match(regex);
  if (match) {
    const numberOfConstraints = match[1];
    const limit = 20000;
    if (numberOfConstraints > limit) {
      throw new Error(`The circuit has ${numberOfConstraints} constraints, which exceeds the limit of ${limit} constraints from the current subscription plan.`);
    } else {
      console.log(`Number of constraints in the circuit does not exceed limit of ${limit}:`, numberOfConstraints);
    }
  } else {
    throw new Error('Number of constraints not found.');
  }

    logger.info('Setup...');
    await setup(
      `${outputPath}/${circuitDir}/${circuitName}_out`,
      `${outputPath}/${circuitDir}`,
      'g16',
      'bellman',
      `${circuitName}_vk`,
      `${circuitName}_pk`,
    );

  const vk = await extractVk(`${outputPath}/${circuitDir}/${circuitName}_vk.key`);

  logger.info(`Complete ${filepath}`);
  return { vk, filepath };
}

import fs from 'fs';
import path from 'path';
import { compile, extractVk, exportKeys, setup } from '../zokrates-lib/index.mjs';
import logger from '../utils/logger.mjs';

export default async function numConstraints({ filepath, curve = 'bn128' }) {
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
  console.log(compileResult);
  const match = compileResult.match(regex);
  let numberOfConstraints;
  if (match) {
    numberOfConstraints = match[1];
  } else {
    throw new Error('Number of constraints not found, due to compilation failure.');
  }

  return {  numberOfConstraints };
}

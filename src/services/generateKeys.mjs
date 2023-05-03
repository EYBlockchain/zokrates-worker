import fs from 'fs';
import path from 'path';
import zokrates from '@eyblockchain/zokrates-zexe.js';
import logger from '../utils/logger.mjs';
import compile from './compile-zok.mjs';

// TODO: REMOVE THE COMPILE MODULE WHEN IT IS CORRECTED ON @eyblockchain/zokrates-zexe.js
export default async function({
  filepath,
  curve = 'bn128',
  backend = 'bellman',
  provingScheme = 'g16',
}) {
  const outputPath = `./output`;
  const circuitsPath = `./circuits`;

  const ext = path.extname(filepath);
  const circuitName = path.basename(filepath, '.zok'); // filename without '.zok'
  const circuitDir = filepath.replace(ext, '');

  fs.mkdirSync(`${outputPath}/${circuitDir}`, { recursive: true });

  logger.info('Compile...');
  // TODO: Use again the zokrates node module.
  await compile(
    `${circuitsPath}/${filepath}`,
    `${outputPath}/${circuitDir}`,
    `${circuitName}_out`,
    curve,
  );

  logger.info('Setup...');
  await zokrates.setup(
    `${outputPath}/${circuitDir}/${circuitName}_out`,
    `${outputPath}/${circuitDir}`,
    provingScheme,
    backend,
    `${circuitName}_vk`,
    `${circuitName}_pk`,
  );

  const vk = await zokrates.extractVk(`${outputPath}/${circuitDir}/${circuitName}_vk.key`);

  logger.info(`Complete ${filepath}`);
  return { vk, filepath };
}

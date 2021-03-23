import loadCircuits from './loadCircuits.mjs';
import generateKeys from './generateKeys.mjs';
import generateProof from './generateProof.mjs';
import verify from './verify.mjs';

export default function receiveMessage() {
  loadCircuits();
  generateKeys();
  generateProof();
  verify();
}

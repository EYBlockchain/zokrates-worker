import zokrates from '@eyblockchain/zokrates-zexe.js'

export default function({ vk, proof, provingScheme, backend, curve, inputs }) {
  return zokrates.verify(
    vk,
    proof.inputs ? proof : { proof, inputs }, // sometimes the public inputs are already included in the proof
    provingScheme,
    backend,
    curve
  );
}
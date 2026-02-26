import { runPractRand } from './practRand.js'
import { runScrush } from './runScrush.js'
import { runCrush } from './runCrush.js'
import { runBcrush } from './runBcrush.js'
import { runAlpha } from './runAlpha.js'
import { runRabbit } from './runRabbit.js'
import { runNist } from './runNist.js'
import { runDieharder } from './runDieharder.js'
import { runEnt } from './runEnt.js'

/** @type {Record<string, (job: { id: string, type: string, filePath: string }, onDone: () => void, deps: unknown) => void>} */
export const RUNNERS = {
  'Pract Rand': runPractRand,
  'Small Crush': runScrush,
  Crush: runCrush,
  'Big Crush': runBcrush,
  Alpha: runAlpha,
  Rabbit: runRabbit,
  'NIST STS': runNist,
  'Die Harder': runDieharder,
  Ent: runEnt
}

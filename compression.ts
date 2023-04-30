const os = require('os');
import fs from "fs"
import { pipeline } from 'stream';
import zlib from 'zlib';

process.env.UV_THREADPOOL_SIZE = '16';

function getChunkSize(fileSize: number, numChunks: number): number {
  return Math.ceil(fileSize / numChunks);
}

// function getOptimalChunkSize(name: string, action?: boolean) {
//   console.log(`-----------------------------`)

//   const fileSize = fs.statSync(`./files/${name}`).size;
//   console.log(`fileSize = ${Math.floor(fileSize / (1024 * 1024))} MB`);

//   const totalMem = os.totalmem();
//   console.log(`totalMemort = ${Math.floor(totalMem / (1024 * 1024))} MB`);

//   const freeMem = os.freemem();
//   console.log(`FreeMemory = ${Math.floor(freeMem / (1024 * 1024))} MB`);

//   const numCpus = os.cpus().length;
//   console.log(`NumbrtCpus = ${Math.floor(numCpus)} `);

//   const chunkSize = Math.floor(fileSize / 100);
//   console.log(`ChunkSize = ${chunkSize / (1024 * 1024)} MB`);

//   const numChunks = Math.ceil(fileSize / chunkSize);
//   console.log(`Number of chunks = ${numChunks}`)
//   console.log(`-----------------------------`)

//   return { chunkSize, numChunks };
// }

function getOptimalChunkSize(fileName: string, action: boolean): { chunkSize: number, numChunks: number } {
  let fileSize: number;

  if (action === true) {
    fileSize = fs.statSync(`./files/${fileName}`).size;
  } else {
    fileSize = fs.statSync(`./files/compressedFile/${fileName}.gz`).size;
  }
  const freeMem = os.freemem();
  const numCpus = os.cpus().length;
  const maxMemoryPerChunk = Math.min(fileSize, freeMem * 0.6) / (numCpus * 2);
  const numChunks = Math.ceil(fileSize / maxMemoryPerChunk);
  const chunkSize = Math.ceil(fileSize / numChunks);

  return { chunkSize, numChunks };
}


async function compress(name: string, action: boolean) {
  console.time('time');
  console.log('\n* Started reading file');
  console.log(`* Free memmory before compression ${Math.floor(os.freemem() / (1024 * 1024))} MB\n`);

  const chunkSize = getOptimalChunkSize(name, action);
  console.log(chunkSize);

  const readStream = fs.createReadStream(`./files/${name}`, { highWaterMark: chunkSize.chunkSize });
  const writeStream = fs.createWriteStream(`./files/compressedFile/${name}.gz`);
  console.log('--| Started compression |--\n');

  const gzipStream = zlib.createGzip();
  let chunkNum = 1;

  pipeline(
    readStream,
    gzipStream,
    writeStream,
    (err) => {
      if (err) {
        console.error('Pipeline failed', err);
      } else {
        console.log("\n--| File compressed |--\n");
        console.timeEnd('time');
        console.log('\n= memory usage info:\n');
        console.log('---------------------------');
        const used = process.memoryUsage();
        for (let key in used) {
          console.log(`|  ${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB  `);
        }
        console.log('---------------------------');
      }
    }
  );
  readStream.on('data', (chunk) => {
    console.log(`| Chunk ${chunkNum} read size: ${Math.floor(chunk.length / (1024 * 1024))} MB |`);
    chunkNum++;
  });
  console.log(`File ${name} split into ${chunkSize.numChunks} chunks of ${Math.floor(chunkSize.chunkSize) / (1024 * 1024)} MB\n`);
}


async function decompress(name: string, action: boolean) {
  console.time('time');
  console.log('\n* Started reading file');

  console.log(`* Free memmory before decompression ${Math.floor(os.freemem() / (1024 * 1024))} MB\n`);

  // const fileForDeCompressionSize = fs.statSync(`./files/compressedFile/${name}.gz`).size;
  // const chunkSize = getChunkSize(fileForDeCompressionSize, chunksNum);
  const chunkSize = getOptimalChunkSize(name, action);
  console.log(chunkSize);


  // const readStream = fs.createReadStream(`./files/compressedFile/${name}.gz`, { highWaterMark: chunkSize });
  const readStream = fs.createReadStream(`./files/compressedFile/${name}.gz`, { highWaterMark: chunkSize.chunkSize });
  const writeSteam = fs.createWriteStream(`./files/decompressedFile/${name}`);
  console.log('--| Started decompression |--\n');

  const gzipStream = zlib.createGunzip();
  let chunkNum = 1;

  pipeline(
    readStream,
    gzipStream,
    writeSteam,
    (err) => {
      if (err) {
        console.error("Pipeline failed", err);
      } else {
        console.log("\n--| File decompresed |--\n");
        console.timeEnd('time');
        console.log('\n= memory usage info:\n');
        console.log('---------------------------');
        const used = process.memoryUsage();
        for (let key in used) {
          console.log(`|  ${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
        }
        console.log('---------------------------');
      }
    }
  );
  readStream.on('data', (chunk) => {
    console.log(`| Chunk ${chunkNum} read size: ${Math.floor(chunk.length)} KB |`);
    chunkNum++;
  });
  console.log(`File ${name} split into ${chunkSize.numChunks} chunks of ${Math.floor(chunkSize.chunkSize)} KB\n`);
}


const controler = (name: string, action: boolean, numberOfChunks?: number) => {
  if (action === true) {
    compress(name, action);
  } if (action === false) {
    decompress(name, action);
  }
}
// console.log(getOptimalChunkSize('text.txt'));
controler('text.txt', false);

// console.log(getOptimalChunkSize('text.txt', false));












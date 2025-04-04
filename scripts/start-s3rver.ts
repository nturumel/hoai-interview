import S3rver from 's3rver';
import path from 'node:path';

const s3rver = new S3rver({
  port: 4568,
  silent: false,
  directory: path.join(process.cwd(), 'tmp', 's3'),
  configureBuckets: [
    {
      name: 'uploads',
      configs: [],
    },
  ],
});

s3rver.run().then(() => {
  console.log('S3rver is running on http://localhost:4568');
}).catch((err: Error) => {
  console.error('Failed to start S3rver:', err);
  process.exit(1);
}); 
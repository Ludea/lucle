import * as Minio from "minio";

export const minioClient = new Minio.Client({
  endPoint: "127.0.0.1",
  port: 9000,
  useSSL: false,
  accessKey: "sPFB3PIKH1CKtthKsGUq",
  secretKey: "wzf94WPq4lYyMqpU6s9S8tQCKCMknz5OfeN74HHY",
});

export const uploadFile = async () => {
  const sourceFile = "~/minio.txt";

  const bucket = "ludea";

  const destinationObject = "minio.txt";

  const exists = await minioClient.bucketExists(bucket);
  if (exists) {
    console.log(`Bucket ${bucket} exists.`);
  } else {
    await minioClient.makeBucket(bucket, "localhost");
    console.log(`Bucket ${bucket} created in "localhost".`);
  }

  const metaData = {
    "Content-Type": "text/plain",
    "X-Amz-Meta-Testing": 1234,
    example: 5678,
  };

  minioClient
    .fPutObject(bucket, destinationObject, sourceFile, metaData)
    .then((value) => {
      console.log(`output : ${value}`);
    });
  console.log(
    `File ${sourceFile} uploaded as object ${destinationObject} in bucket ${
      bucket
    }`,
  );
};

/** True when running on a serverless platform (AWS Lambda / Netlify / Vercel),
 *  where there's no always-on process and the filesystem is read-only except /tmp. */
export function isServerless(): boolean {
  return !!(
    process.env.LAMBDA_TASK_ROOT ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY ||
    process.env.NETLIFY_BLOBS_CONTEXT ||
    process.env.VERCEL
  );
}

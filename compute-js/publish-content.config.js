/*
 * Configuration for @fastly/compute-js-static-publish.
 */

/** @type {import('@fastly/compute-js-static-publish').PublishContentConfig} */
const config = {
  kvStoreName: "divine-web-content",
  rootDir: "../dist",
};

export default config;

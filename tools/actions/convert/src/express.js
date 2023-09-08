/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable import/no-extraneous-dependencies */
import 'dotenv/config.js';
import express from 'express';
import { render } from './index.js';

const {
  AEM_USER,
  AEM_PASSWORD,
} = process.env;
const app = express();
const port = 3030;

const handler = (req, res) => {
  // eslint-disable-next-line prefer-const
  let { path, query } = req;
  const params = {
    ...query,
  };

  if (AEM_USER && AEM_PASSWORD) {
    params.authorization = `Basic ${Buffer.from(`${AEM_USER}:${AEM_PASSWORD}`).toString('base64')}`;
    params.wcmmode = 'disabled';
  }

  let serveMd = false;
  if (path.endsWith('.md')) {
    serveMd = true;
    path = `${path.substring(0, path.length - 3)}.html`;
  }

  render(path, params).then(({ html, md, error }) => {
    if (error) {
      res.status(error.code || 503);
      res.send(error.message);
      return;
    }

    res.status(200);

    if (serveMd) {
      res.contentType('.md');
      res.send(md.md);
    } else {
      res.send(html);
    }
  });
};

app.get('/**.html', handler);
app.get('/**.md', handler);
// eslint-disable-next-line no-console
app.listen(port, () => console.log(`Converter listening on port ${port}`));

//   Copyright 2020 Vircadia Contributors
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.

'use strict';

import { Router, RequestHandler, Request, Response, NextFunction } from 'express';
import { setupMetaverseAPI, finishMetaverseAPI } from '@Route-Tools/middleware';

import { Logger } from '@Tools/Logging';

const procMetaverseInfo: RequestHandler = (req: Request, resp: Response, next: NextFunction) => {
  req.vRestResp.Data = {
    'metaverse': 'is',
    'cool': 'nothing else'
  };
  Logger.debug('procMetaverseInfo: exiting');
  next();
};

export const name = "metaverseInfo";

export const router = Router();

router.get( '/api/metaverse_info',    [ setupMetaverseAPI,
                                        procMetaverseInfo,
                                        finishMetaverseAPI ] );
router.get( '/api/v1/metaverse_info', [ setupMetaverseAPI,
                                        procMetaverseInfo,
                                        finishMetaverseAPI ] );
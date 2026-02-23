import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        bodyParser.json({
            verify: (req: Request & { rawBody?: Buffer }, res: Response, buf: Buffer) => {
                req.rawBody = buf;
            }
        })(req, res, next);
    }
}

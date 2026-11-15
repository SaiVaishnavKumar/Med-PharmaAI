import { describe, expect, it } from 'vitest';
import { Duplex } from 'stream';
import { IncomingMessage, ServerResponse } from 'http';
import jwt from 'jsonwebtoken';
import { app } from './app.js';

process.env.JWT_SECRET = 'test-secret';
const auth = (roles: string[]) =>
  `mediflow_session=${jwt.sign({ id: 'test-user', roles }, 'test-secret')}`;

interface TestResponse {
  status: number;
  body: any;
  headers: Record<string, string | string[] | undefined>;
}

class TestRequest {
  private method: string;
  private path: string;
  private headers: Record<string, string> = {};
  private bodyData?: any;

  constructor(method: string, path: string) {
    this.method = method;
    this.path = path;
  }

  set(header: string, value: string) {
    this.headers[header.toLowerCase()] = value;
    return this;
  }

  send(data: any) {
    this.bodyData = data;
    if (!this.headers['content-type']) {
      this.headers['content-type'] = 'application/json';
    }
    return this;
  }

  then(resolve: (res: TestResponse) => void, reject: (err: any) => void) {
    return this.execute().then(resolve, reject);
  }

  private execute(): Promise<TestResponse> {
    return new Promise((resolve, reject) => {
      try {
        const socket = new Duplex({
          read() {},
          write(_chunk, _encoding, callback) {
            callback();
          },
        });

        const req = new IncomingMessage(socket as any);
        req.url = this.path;
        req.method = this.method;

        let payload: string | undefined;
        if (this.bodyData !== undefined) {
          payload =
            typeof this.bodyData === 'string'
              ? this.bodyData
              : JSON.stringify(this.bodyData);
          this.headers['content-length'] = String(Buffer.byteLength(payload));
        }

        for (const [k, v] of Object.entries(this.headers)) {
          req.headers[k] = v;
        }

        const res = new ServerResponse(req);
        res.assignSocket(socket as any);

        let resData = '';
        res.write = (chunk: any) => {
          resData += chunk.toString();
          return true;
        };

        res.end = (chunk: any) => {
          if (chunk) resData += chunk.toString();
          let parsed = resData;
          try {
            parsed = JSON.parse(resData);
          } catch {
            // keep raw text if not json
          }
          resolve({
            status: res.statusCode,
            body: parsed,
            headers: res.getHeaders() as any,
          });
          return res;
        };

        app(req, res);

        setImmediate(() => {
          if (payload !== undefined) {
            req.push(payload);
          }
          req.push(null);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

function request(_app: any) {
  return {
    get(path: string) {
      return new TestRequest('GET', path);
    },
    post(path: string) {
      return new TestRequest('POST', path);
    },
  };
}

describe('API boundary', () => {
  it('reports service health with the shared response envelope', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body.data?.status).toBe('ok');
  });

  it('requires a session for sale creation', async () => {
    const response = await request(app)
      .post('/api/v1/sales')
      .send({ items: [{ medicineId: 'x', quantity: 1 }], paymentMethod: 'CASH' });
    expect(response.status).toBe(401);
  });

  it('returns a predictable not found error', async () => {
    const response = await request(app).get('/api/v1/missing');
    expect(response.status).toBe(404);
    expect(response.body.error?.code).toBe('NOT_FOUND');
  });

  it('rejects return requests without a mandatory reason before database access', async () => {
    const response = await request(app)
      .post('/api/v1/inventory/returns')
      .set('Cookie', auth(['PHARMACIST']))
      .send({
        items: [{ saleItemId: 'item-1', batchId: 'batch-1', quantity: 1, restock: false }],
      });
    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe('VALIDATION_ERROR');
  });

  it('rejects adjustments without a mandatory reason before database access', async () => {
    const response = await request(app)
      .post('/api/v1/inventory/adjustments')
      .set('Cookie', auth(['INVENTORY_MANAGER']))
      .send({ batchId: 'batch-1', delta: -1 });
    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe('VALIDATION_ERROR');
  });

  it('enforces server roles on purchase creation', async () => {
    const response = await request(app)
      .post('/api/v1/purchases')
      .set('Cookie', auth(['CASHIER']))
      .send({ supplierId: 'supplier-1', items: [] });
    expect(response.status).toBe(403);
  });

  it('refuses medical advice questions in the Copilot', async () => {
    const response = await request(app)
      .post('/api/v1/ai/ask')
      .set('Cookie', auth(['PHARMACIST']))
      .send({ question: 'What dosage should I take for a headache?' });
    expect(response.status).toBe(200);
    expect(response.body.data?.answer).toContain('can’t provide medical');
  });
});

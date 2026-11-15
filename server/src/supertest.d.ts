declare module 'supertest' {
  type Response = { status: number; body: { data?: { status?: string; answer?: string }; error?: { code?: string } } };
  type Test = Promise<Response>;
  type TestBuilder = { set(name: string, value: string): TestBuilder; send(body: unknown): Test };
  type Request = { get(path: string): Test; post(path: string): TestBuilder };
  function request(app: import('express').Express): Request;
  export = request;
}

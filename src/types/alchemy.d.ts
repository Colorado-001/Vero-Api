export interface AlchemyRequest extends Request {
  alchemy: {
    rawBody: string;
    signature: string;
  };
}

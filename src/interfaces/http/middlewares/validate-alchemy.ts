import * as crypto from "crypto";
import express, { NextFunction, Request, Response } from "express";
import type { AlchemyRequest } from "../../../types/alchemy";

function isValidSignatureForAlchemyRequest(
  request: AlchemyRequest,
  signingKey: string
): boolean {
  return isValidSignatureForStringBody(
    request.alchemy.rawBody,
    request.alchemy.signature,
    signingKey
  );
}

function isValidSignatureForStringBody(
  body: string,
  signature: string,
  signingKey: string
): boolean {
  const hmac = crypto.createHmac("sha256", signingKey); // Create a HMAC SHA256 hash using the signing key
  hmac.update(body, "utf8"); // Update the token hash with the request body using utf8
  const digest = hmac.digest("hex");
  return signature === digest;
}

export function validateAlchemySignature(signingKey: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (
      !isValidSignatureForAlchemyRequest(
        req as unknown as AlchemyRequest,
        signingKey
      )
    ) {
      const errMessage = "Signature validation failed, unauthorized!";
      res.status(403).send(errMessage);
      console.error(errMessage);
    } else {
      next();
    }
  };
}

export function createAlchemyParser() {
  return express.json({
    verify: function addAlchemyContextToRequest(
      req,
      _res,
      buf,
      encoding: BufferEncoding
    ) {
      const signature = req.headers["x-alchemy-signature"];
      // Signature must be validated against the raw string
      var body = buf.toString(encoding || "utf8");
      (req as unknown as AlchemyRequest).alchemy = {
        rawBody: body,
        signature: signature as string,
      };
    },
  });
}

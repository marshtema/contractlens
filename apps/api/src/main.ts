import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import multipart from "@fastify/multipart";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: { level: "info" } }),
  );

  const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
  app.enableCors({ origin: webOrigin, credentials: true });

  // Multipart for file uploads.
  // Cast: @nestjs/platform-fastify ships its own fastify version, which is
  // type-incompatible with the standalone fastify that @fastify/multipart
  // resolves against. At runtime both resolve to the same plugin contract.
  await app.register(multipart as never, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB по ТЗ
      files: 1,
    },
  });

  app.setGlobalPrefix("api");

  const port = Number(process.env.PORT ?? 3001);
  await app.listen({ port, host: "0.0.0.0" });
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[api] bootstrap failed:", err);
  process.exit(1);
});

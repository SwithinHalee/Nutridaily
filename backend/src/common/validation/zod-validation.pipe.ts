import { PipeTransform } from '@nestjs/common';
import { ZodTypeAny, z } from 'zod';

/**
 * Validates and sanitises a request part against a Zod schema. Unknown keys are rejected by
 * the schemas themselves (`.strict()`), which blocks mass-assignment such as `{ role: "ADMIN" }`.
 * A ZodError propagates to AllExceptionsFilter, which renders a field-level 400 response.
 */
export class ZodValidationPipe<S extends ZodTypeAny> implements PipeTransform<unknown, z.infer<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.infer<S> {
    return this.schema.parse(value ?? {});
  }
}

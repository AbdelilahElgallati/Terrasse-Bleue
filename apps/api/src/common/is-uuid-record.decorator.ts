import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function IsUuidRecord(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isUuidRecord',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return Boolean(
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            Object.entries(value).every(
              ([key, entry]) =>
                uuid.test(key) && typeof entry === 'string' && uuid.test(entry),
            ),
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} doit associer des identifiants UUID valides.`;
        },
      },
    });
}

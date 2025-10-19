import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'arrayUnique', async: false })
export class ArrayUniqueConstraint implements ValidatorConstraintInterface {
  validate(value: any[], _args: ValidationArguments) {
    if (!Array.isArray(value)) {
      return true;
    }

    const uniqueValues = new Set(value);
    return uniqueValues.size === value.length;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Wszystkie elementy w tablicy muszą być unikalne';
  }
}

export function ArrayUnique(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ArrayUniqueConstraint,
    });
  };
}
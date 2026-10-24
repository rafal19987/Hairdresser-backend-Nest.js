import { Matches, ValidationOptions } from 'class-validator';

const TIME_ZONE_SUFFIX = /(Z|[+-]\d{2}:\d{2})$/i;

export function HasTimeZone(validationOptions?: ValidationOptions) {
  return Matches(TIME_ZONE_SUFFIX, {
    message:
      '$property musi zawierać strefę czasową, np. 2026-03-01T10:00:00.000Z lub 2026-03-01T11:00:00+01:00',
    ...validationOptions,
  });
}

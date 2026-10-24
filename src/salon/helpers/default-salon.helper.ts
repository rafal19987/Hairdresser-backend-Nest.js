import { Repository } from 'typeorm';
import { Salon } from '@/salon/entities/salon.entity';

// Single-location setup: the oldest salon record is the salon
export const findDefaultSalon = async (
  repository: Repository<Salon>,
): Promise<Salon | null> => {
  const [salon] = await repository.find({
    order: { createdAt: 'ASC' },
    take: 1,
  });

  return salon ?? null;
};

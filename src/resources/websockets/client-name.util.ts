import { faker } from '@faker-js/faker';

/**
 * Generates a random friendly name for connected clients
 * E.g., "HappyPanda", "SwiftEagle", "BraveWolf"
 */
export function generateClientName(): string {
  const adjective = faker.word.adjective();
  const animal = faker.animal.type();
  return `${capitalize(adjective)}${capitalize(animal)}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

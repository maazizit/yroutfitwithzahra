export type Gender = 'femme' | 'homme';

export type ProductGender = Gender | 'mixte';

export const GENDERS: Gender[] = ['femme', 'homme'];

export function genderLabel(g: Gender): string {
  return g === 'femme' ? 'Femme' : 'Homme';
}

export function productGenderLabel(g: ProductGender): string {
  if (g === 'mixte') return 'Mixte';
  return genderLabel(g);
}

/** Le profil voit les pièces de son genre + unisexe. */
export function matchesGender(productGender: ProductGender | undefined, profileGender: Gender): boolean {
  const g = productGender ?? 'mixte';
  if (g === 'mixte') return true;
  return g === profileGender;
}

/** Heuristique import Awin / fallback catalogue. */
export function inferProductGender(text: string): ProductGender {
  const t = text.toLowerCase();
  if (/unisex|unisexe|mixte|gender\s*neutral/i.test(t)) return 'mixte';

  const homme =
    /homme|men'?s?\b|\bman\b|masculin|garçon|garcon|\bmale\b|for\s*him|pour\s*lui|boy'?s?\b/i.test(t);
  const femme =
    /femme|women|woman|ladies|\blady\b|féminin|feminin|\bfille\b|\bfemale\b|for\s*her|pour\s*elle|\brobe\b|\bdress\b|jupe|skirt|soutien|lingerie|\bbra\b/i.test(
      t,
    );

  if (homme && femme) return 'mixte';
  if (homme) return 'homme';
  if (femme) return 'femme';
  return 'mixte';
}

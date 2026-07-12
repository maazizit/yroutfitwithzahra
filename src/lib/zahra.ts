import { genderLabel } from './gender';
import { morphologyInfo, morphologyLabel } from './morphology';
import { SUPABASE_KEY, SUPABASE_URL } from './supabase';
import type { UserProfile } from './types';

export interface ZahraMessage {
  id: string;
  role: 'zahra' | 'user';
  text: string;
}

export const QUICK_PROMPTS = [
  '🧕 Un look pudique stylé',
  '💼 Tenue pour un entretien',
  '💃 Look de soirée',
  '💍 Invitée à un mariage',
  '☀️ Tenue d’été légère',
  '🎨 Quelles couleurs me vont ?',
  '👖 Quel jean pour moi ?',
];

const IA_TIMEOUT_MS = 8000;

/**
 * Demande un conseil à Zahra : essaie d'abord l'IA (Edge Function ask-zahra,
 * Gemini avec la personnalité de Zahra), sinon bascule sur le moteur de
 * conseils intégré — la page marche donc même sans clé Gemini.
 */
export async function askZahra(message: string, profile: UserProfile): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IA_TIMEOUT_MS);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ask-zahra`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
      },
      body: JSON.stringify({
        message,
        morphology: profile.morphology,
        budget: profile.budget,
        modestMode: profile.modestMode,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (response.ok) {
      const data = (await response.json()) as { reply?: string };
      if (data.reply && data.reply.trim().length > 0) return data.reply.trim();
    }
  } catch {
    // IA indisponible → moteur local
  }
  return localAdvice(message, profile);
}

/* ─────────────── Moteur de conseils intégré ─────────────── */

interface Topic {
  patterns: RegExp;
  build: (profile: UserProfile) => string;
}

function modestLine(profile: UserProfile): string {
  if (!profile.modestMode) return '';
  return `\n\nVersion pudeur 🧕 : privilégie les manches longues, les coupes amples et les longueurs maxi, avec des tissus opaques — et assortis ton hijab à la pièce principale pour un look harmonieux.`;
}

function budgetLine(profile: UserProfile): string {
  if (profile.budget <= 25) {
    return `Avec ${profile.budget} € par pièce, fonce sur Shein et l'onglet Ventes Privées ✨ — on y trouve des pépites à -70 %.`;
  }
  if (profile.budget <= 60) {
    return `Avec ${profile.budget} € par pièce, tu peux mixer Shein pour les basiques et H&M/Zara pour les pièces fortes.`;
  }
  return `Avec ${profile.budget} € par pièce, offre-toi des matières de qualité chez Zara ou Mango — une belle pièce vaut trois moyennes.`;
}

function morphoLines(profile: UserProfile): string {
  const info = morphologyInfo(profile.morphology);
  return info.advice.map((a) => `• ${a}`).join('\n');
}

const MORPHO_JEAN: Record<string, string> = {
  sablier: 'un jean taille haute légèrement cintré : il épouse ta taille marquée sans la cacher.',
  poire: 'un jean droit ou flare, foncé et taille haute : il allonge la jambe et équilibre les hanches.',
  pomme: 'un jean droit taille mi-haute avec un haut fluide par-dessus : confort et allure.',
  rectangle: 'un jean push-up ou à poches travaillées : il crée du galbe et structure la silhouette.',
  triangle_inverse: 'un jean large ou boyfriend : il apporte du volume en bas et équilibre tes épaules.',
};

const MORPHO_ROBE: Record<string, string> = {
  sablier: 'la robe portefeuille est ta meilleure amie : elle souligne ta taille naturellement.',
  poire: 'une robe patineuse ou trapèze : ajustée en haut, évasée en bas — équilibre parfait.',
  pomme: 'une robe empire ou fluide avec un joli col en V : elle allonge et met ton décolleté en valeur.',
  rectangle: 'une robe ceinturée ou à volants : elle dessine une taille et ajoute du mouvement.',
  triangle_inverse: 'une robe évasée à fines bretelles ou col V : le volume en bas adoucit les épaules.',
};

const TOPICS: Topic[] = [
  {
    patterns: /hijab|voile|char3i|charii|char'i|pudeur|pudique|abaya|modest|halal|couvrant|jilbab|khimar/i,
    build: (p) =>
      `Le style pudique, c'est mon domaine préféré 🧕✨\n\n• La base : coupes amples, longueurs maxi, tissus opaques — la pudeur n'enlève RIEN au style\n• Une abaya kimono moderne ou une robe longue chemisier : élégance instantanée\n• Le hijab : mousseline ou jersey premium, dans un ton assorti à ta pièce principale (camaïeu = effet luxe)\n• Superpose : tunique longue + pantalon fluide + cardigan maxi = silhouette harmonieuse\n\nPour ta silhouette ${morphologyLabel(p.morphology)}, joue avec les superpositions plutôt que les coupes près du corps : une ceinture par-dessus une robe ample dessine la ligne tout en restant couvrante.\n\n${budgetLine(p)}\n\nActive le Mode Pudeur 🧕 dans « Mon style » pour ne voir que des pièces char3i dans ton feed ✨`,
  },
  {
    patterns: /entretien|travail|bureau|boulot|job|pro|réunion|reunion|stage/i,
    build: (p) =>
      `Pour un entretien, mise sur la confiance ✨\n\n• Un blazer bien coupé (marine ou noir) — la pièce qui change tout\n• Un haut uni clair, pantalon droit ou jupe midi\n• Une seule touche de couleur ou un bijou fin, pas plus\n\nPour ta silhouette ${morphologyLabel(p.morphology)} :\n${morphoLines(p)}${modestLine(p)}\n\n${budgetLine(p)}\n\nEt surtout : tu es magnifique, tiens-toi droite et souris 💛`,
  },
  {
    patterns: /mariage|cérémonie|ceremonie|invitée|invitee|fiançailles|fiancailles|henné|henne/i,
    build: (p) =>
      `Invitée à un mariage, quel bonheur ! 💍\n\n• Une robe midi ou longue dans une couleur riche (terracotta, émeraude, bleu nuit)\n• Évite le blanc (réservé à la mariée !) et le noir total\n• Talons confortables — tu vas danser 💃\n\nPour ta silhouette ${morphologyLabel(p.morphology)}, ${MORPHO_ROBE[p.morphology]}${modestLine(p)}\n\n${budgetLine(p)}`,
  },
  {
    patterns: /soirée|soiree|date|resto|restaurant|rendez-vous|sortie|club|anniversaire/i,
    build: (p) =>
      `Look de soirée — on sort le grand jeu ✨\n\n• Une pièce statement : robe satinée, top à sequins discrets ou blazer porté épaules nues\n• Le reste sobre pour laisser la pièce forte briller\n• Rouge à lèvres terracotta et c'est gagné 💄\n\nPour ta silhouette ${morphologyLabel(p.morphology)}, ${MORPHO_ROBE[p.morphology]}${modestLine(p)}\n\n${budgetLine(p)}`,
  },
  {
    patterns: /été|ete|plage|vacances|chaleur|chaud|soleil|piscine/i,
    build: (p) =>
      `Tenue d'été légère et stylée ☀️\n\n• Matières naturelles : lin, coton, viscose fluide\n• Couleurs claires ou imprimés fins — plus frais et plus chic\n• Robe longue fluide + sandales plates = combo gagnant\n\nPour ta silhouette ${morphologyLabel(p.morphology)} :\n${morphoLines(p)}${modestLine(p)}\n\n${budgetLine(p)}`,
  },
  {
    patterns: /hiver|froid|manteau|pluie|automne/i,
    build: (p) =>
      `Pour l'hiver, on superpose avec style ❄️\n\n• Un manteau long ligne droite — il élève n'importe quelle tenue\n• Col roulé fin + pantalon fluide : chic sans effort\n• Camel, gris perle et bordeaux : le trio qui réchauffe\n\nPour ta silhouette ${morphologyLabel(p.morphology)} :\n${morphoLines(p)}${modestLine(p)}\n\n${budgetLine(p)}`,
  },
  {
    patterns: /couleur|palette|teinte|coloris/i,
    build: (p) =>
      `Parlons couleurs 🎨\n\n• Les tons chauds (terracotta, camel, crème, kaki doux) flattent presque tous les teints\n• Près du visage, choisis la couleur qui illumine ton regard — teste devant un miroir en lumière naturelle\n• Le total look d'une même gamme (camaïeu) = effet luxe immédiat\n\nAstuce silhouette ${morphologyLabel(p.morphology)} : place la couleur claire là où tu veux attirer le regard, la foncée là où tu veux affiner ✨\n\n${budgetLine(p)}`,
  },
  {
    patterns: /jean|pantalon|denim/i,
    build: (p) =>
      `Le bon jean change une silhouette 👖\n\nPour toi, silhouette ${morphologyLabel(p.morphology)} : ${MORPHO_JEAN[p.morphology]}${modestLine(p)}\n\n• Toujours l'essayer assis ET debout\n• L'ourlet doit effleurer la chaussure\n\n${budgetLine(p)}`,
  },
  {
    patterns: /robe/i,
    build: (p) =>
      `La robe parfaite existe, promis 👗\n\nPour ta silhouette ${morphologyLabel(p.morphology)}, ${MORPHO_ROBE[p.morphology]}${modestLine(p)}\n\n${budgetLine(p)}\n\nVa voir l'onglet « Pour toi », j'ai filtré des robes à ta silhouette ✨`,
  },
  {
    patterns: /bonjour|salut|salam|hello|coucou|cc|hey/i,
    build: (p) =>
      `Coucou toi 💛 Je suis Zahra, ta styliste personnelle.\n\nJe connais ta silhouette ${morphologyLabel(p.morphology)} et ton budget de ${p.budget} € — pose-moi n'importe quelle question mode : une occasion, une pièce, des couleurs…\n\nEt souviens-toi : tu es magnifique, on va juste apprendre à te mettre en valeur ✨`,
  },
];

export function localAdvice(message: string, profile: UserProfile): string {
  for (const topic of TOPICS) {
    if (topic.patterns.test(message)) return topic.build(profile);
  }
  return `Très bonne question 💭\n\nVoici mes essentiels pour ta silhouette ${morphologyLabel(profile.morphology)} :\n${morphoLines(profile)}${modestLine(profile)}\n\n${budgetLine(profile)}\n\nTu peux aussi me demander : une tenue d'entretien, de mariage, de soirée, quelles couleurs te vont, ou quel jean choisir ✨`;
}

export function welcomeMessage(profile: UserProfile): ZahraMessage {
  const modestNote = profile.modestMode
    ? ' Mode Pudeur activé 🧕 — tous mes conseils respecteront le style char3i.'
    : '';
  return {
    id: 'welcome',
    role: 'zahra',
    text: `Bienvenue dans mon salon de style 🌸\n\nJe suis Zahra. Mode ${genderLabel(profile.gender)}, silhouette ${morphologyLabel(profile.morphology)}, budget ${profile.budget} € — j'ai déjà tout en tête.${modestNote}\n\nDis-moi pour quelle occasion tu veux briller, ou choisis une question ci-dessous 👇`,
  };
}

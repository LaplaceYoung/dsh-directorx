/** Named 运镜 recipes → campath DSL the live compiler already understands. */

export interface ShotRecipe {
  id: string;
  label: string;
  dsl: (targetId: string) => string;
}

export const SHOT_RECIPES: ShotRecipe[] = [
  {
    id: 'hero_reveal',
    label: '英雄揭示',
    dsl: (id) => `campath "Hero reveal"
  look target "${id}"
  easing easeInOut
  from scale ws yaw 14 pitch 10 lens 35
  crane up 1.4 3s
  dolly in 1.2 2.5s`,
  },
  {
    id: 'tracking',
    label: '侧面跟拍',
    dsl: (id) => `campath "Tracking"
  look target "${id}"
  easing easeInOut
  from scale ms yaw 80 pitch 2 lens 50
  truck left 4 4s`,
  },
  {
    id: 'punch_in',
    label: '急推',
    dsl: (id) => `campath "Punch in"
  look target "${id}"
  easing easeIn
  from scale mcu yaw 12 pitch 6 lens 50
  zoom in 12 0.8s`,
  },
  {
    id: 'hitchcock',
    label: '希区柯克变焦',
    dsl: (id) => `campath "Dolly zoom"
  look target "${id}"
  easing easeInOut
  from scale ms yaw 8 pitch 4 lens 35
  dolly-zoom in 2 4s`,
  },
  {
    id: 'orbit_90',
    label: '四分之一环绕',
    dsl: (id) => `campath "Quarter orbit"
  look target "${id}"
  easing easeInOut
  from scale ms yaw 20 pitch 6 lens 50
  orbit right 90 4s`,
  },
  {
    id: 'rise',
    label: '升起揭示',
    dsl: (id) => `campath "Rise"
  look target "${id}"
  easing easeInOut
  from scale ws yaw 10 pitch 16 lens 24
  jib up 1.6 3s
  tilt down 8 2s`,
  },
  {
    id: 'whip',
    label: '甩镜',
    dsl: (id) => `campath "Whip"
  look target "${id}"
  easing easeIn
  from scale mcu yaw 10 pitch 4 lens 50
  whip right 70 0.4s`,
  },
  {
    id: 'follow',
    label: '跟随推近',
    dsl: (id) => `campath "Follow"
  look target "${id}"
  easing easeInOut
  handheld 0.25
  from scale ms yaw 0 pitch 5 lens 35
  dolly in 2.5 4s`,
  },
];

export function parseShotRecipe(token?: string): ShotRecipe | null {
  const t = String(token || '').trim().toLowerCase();
  return SHOT_RECIPES.find((item) => item.id === t || item.label === token) ?? null;
}

export function shotCampathDsl(recipeId: string, targetId: string): string {
  const recipe = parseShotRecipe(recipeId);
  if (!recipe) throw new Error(`unknown shot recipe: ${recipeId}`);
  const id = String(targetId || '').trim();
  if (!id) throw new Error('shot recipe needs a target id');
  return recipe.dsl(id);
}

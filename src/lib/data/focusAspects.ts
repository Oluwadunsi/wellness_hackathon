export const focusAspects = [
  'Rest',
  'Health',
  'Fitness',
  'Cooking',
  'Friends & family',
  'Hobbies',
  'Personal admin',
] as const

export type FocusPeriod = 'morning' | 'afternoon' | 'evening'

export const focusActivities: Record<string, Record<FocusPeriod, string[]>> = {
  Rest: {
    morning: ['Start the day slowly', 'Have a quiet breakfast'],
    afternoon: ['Take a proper rest break', 'Read and recharge'],
    evening: ['Have a screen-free evening', 'Wind down with a book'],
  },
  Health: {
    morning: ['Go for a morning walk', 'Prepare a healthy breakfast'],
    afternoon: ['Take a walk outside', 'Take a mindful lunch break'],
    evening: ['Go for an evening walk', 'Prepare for a good night’s sleep'],
  },
  Fitness: {
    morning: ['Do a morning workout', 'Go for a morning run'],
    afternoon: ['Take a brisk afternoon walk', 'Do a lunchtime workout'],
    evening: ['Do an evening workout', 'Stretch or do gentle yoga'],
  },
  Cooking: {
    morning: ['Prepare a nourishing breakfast', 'Prepare food for the day'],
    afternoon: ['Cook a relaxed lunch', 'Prepare ingredients for dinner'],
    evening: ['Cook a nourishing dinner', 'Prepare easy meals for tomorrow'],
  },
  'Friends & family': {
    morning: ['Have breakfast with someone you care about', 'Call a family member'],
    afternoon: ['Meet a friend for coffee', 'Spend time with family'],
    evening: ['Have dinner with friends or family', 'Call or meet a friend'],
  },
  Hobbies: {
    morning: ['Spend time on a favourite hobby', 'Do something creative'],
    afternoon: ['Work on a personal project', 'Practise a favourite hobby'],
    evening: ['Enjoy a creative evening', 'Read, make or learn something for fun'],
  },
  'Personal admin': {
    morning: ['Plan the day and clear one small task', 'Handle one important errand'],
    afternoon: ['Clear a small personal task', 'Handle a household errand'],
    evening: ['Prepare for tomorrow', 'Do a short home reset'],
  },
}

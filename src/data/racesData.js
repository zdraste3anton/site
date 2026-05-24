import elfIcon from '../assets/races/elf.png';
import halfElfIcon from '../assets/races/half-elf.png';
import dwarfIcon from '../assets/races/dwarf.png';
import tieflingIcon from '../assets/races/tiefling.png';
import gnomeIcon from '../assets/races/gnome.png';
import humanIcon from '../assets/races/human.png';
import dragonbornIcon from '../assets/races/dragonborn.png';
import halflingIcon from '../assets/races/halfling.png';
import halfOrcIcon from '../assets/races/half-orc.png';
import kenkuIcon from '../assets/races/kenku.png';
import koboldIcon from '../assets/races/kobold.png';
import tritonIcon from '../assets/races/triton.png';
import goblinIcon from '../assets/races/goblin.png';
import shifterIcon from '../assets/races/shifter.png';
import centaurIcon from '../assets/races/centaur.png';
import orcIcon from '../assets/races/orc.png';
import satyrIcon from '../assets/races/satyr.png';
import tabaxiIcon from '../assets/races/tabaxi.png';
import yuanTiIcon from '../assets/races/yuan-ti.png';
import minotaurIcon from '../assets/races/minotaur.png';


export const RACES = [
  {
    id: 'elf',
    name: 'Эльф',
    description:
      'Грациозные долгожители с острыми чувствами, тягой к природе и тонким пониманием магии фей.',
    tags: ['+2 Ловкость', 'Тёмное зрение', 'Наследие фей'],
    icon: elfIcon,
    accent: 'violet',
  },
  {
    id: 'dwarf',
    name: 'Дворф',
    description:
      'Крепкие мастера камня и металла, ценящие традиции клана, выдержку и честь кузни.',
    tags: ['+2 Телосложение', 'Тёмное зрение', 'Устойчив дворфов'],
    icon: dwarfIcon,
    accent: 'orange',
  },
  {
    id: 'tiefling',
    name: 'Тифлинг',
    description:
      'Наследники инфернальной крови с внушительной внешностью и врождённым чутьём на огонь.',
    tags: ['+2 Харизма', 'Тёмное зрение', 'Сопротивление огню'],
    icon: tieflingIcon,
    accent: 'purple',
  },
  {
    id: 'gnome',
    name: 'Гном',
    description:
      'Маленькие изобретатели и любители чудес с живым умом и природной устойчивостью к иллюзиям.',
    tags: ['+2 Интеллект', 'Тёмное зрение', 'Хитрость гномов'],
    icon: gnomeIcon,
    accent: 'orange',
  },
  {
    id: 'human',
    name: 'Человек',
    description:
      'Универсальные адаптанты, быстро осваивающие ремёсла и судьбы, что меняют мир вокруг.',
    tags: ['+1 ко всем характеристикам', 'Доп. навык', 'Черта'],
    icon: humanIcon,
    accent: 'orange',
  },
  {
    id: 'dragonborn',
    name: 'Драконорождённый',
    description:
      'Гордые носители драконьей крови с дыханием стихии и врождённым чувством собственного достоинства.',
    tags: ['+2 Сила', '+1 Харизма', 'Дыхание дракона'],
    icon: dragonbornIcon,
    accent: 'purple',
  },
  {
    id: 'half-elf',
    name: 'Полуэльф',
    description:
      'На стыке двух культур они сочетают обаяние людей и чуткость эльфов, легко находя общий язык.',
    tags: ['+2 Харизма', '+1 к двум', 'Тёмное зрение'],
    icon: halfElfIcon,
    accent: 'violet',
  },
  {
    id: 'halfling',
    name: 'Полурослик',
    description:
      'Удачливые путешественники, предпочитающие уют и находчивость — и неожиданно острый клинок.',
    tags: ['+2 Ловкость', 'Везучий', 'Храбрый'],
    icon: halflingIcon,
    accent: 'orange',
  },
  {
    id: 'half-orc',
    name: 'Полуорк',
    description:
      'Сила орков и цепкость выживания, часто встречающаяся с предубеждением — и ответом упорством.',
    tags: ['+2 Сила', '+1 Телосложение', 'Ярость'],
    icon: halfOrcIcon,
    accent: 'purple',
  },
  {
    id: 'kenku',
    name: 'Кенку',
    description:
      'Пернатые мимы и мастера подражания, чья культура строится на звуках, жестах и остром уме.',
    tags: ['+2 Ловкость', '+1 Интеллект', 'Подражание'],
    icon: kenkuIcon,
    accent: 'violet',
  },
  {
    id: 'kobold',
    name: 'Кобольд',
    description:
      'Мелкие существа с драконьей кровью, славящиеся ловкостью в стае и хитрыми ловушками.',
    tags: ['+2 Ловкость', 'Тёмное зрение', 'Засада стаи'],
    icon: koboldIcon,
    accent: 'orange',
  },
  {
    id: 'triton',
    name: 'Тритон',
    description:
      'Стражи глубин с врождённой связью с водой и долгом защищать морские просторы от угроз.',
    tags: ['+1 Сила', '+1 Телосложение', '+1 Харизма', 'Подводное дыхание'],
    icon: tritonIcon,
    accent: 'purple',
  },
  {
    id: 'goblin',
    name: 'Гоблин',
    description:
      'Проворные выжившие с острыми инстинктами; в стае опасны, в одиночку — невероятно изобретательны.',
    tags: ['+2 Ловкость', 'Тёмное зрение', 'Нырок'],
    icon: goblinIcon,
    accent: 'violet',
  },
  {
    id: 'shifter',
    name: 'Шифтер',
    description:
      'Носители звериной души: в моменты напряжения проявляются черты предка — когти, чутьё, ярость.',
    tags: ['+1 Телосложение', 'Острые чувства', 'Сдвиг'],
    icon: shifterIcon,
    accent: 'purple',
  },
  {
    id: 'centaur',
    name: 'Кентавр',
    description:
      'Могучие странники степей и лесов, сочетающие скорость коня и мудрость древних кочевников.',
    tags: ['+2 Сила', 'Скорость', 'Заряд'],
    icon: centaurIcon,
    accent: 'orange',
  },
  {
    id: 'orc',
    name: 'Орк',
    description:
      'Крепкие воины с культурой чести и выживания; их гнев и выносливость легендарны на поле боя.',
    tags: ['+2 Сила', 'Тёмное зрение', 'Угроза'],
    icon: orcIcon,
    accent: 'purple',
  },
  {
    id: 'satyr',
    name: 'Сатир',
    description:
      'Веселье, музыка и природа в одном существе; их обаяние и ловкость открывают неожиданные пути.',
    tags: ['+2 Харизма', '+1 Ловкость', 'Сопротивление магии'],
    icon: satyrIcon,
    accent: 'violet',
  },
  {
    id: 'tabaxi',
    name: 'Табакси',
    description:
      'Кошачьи странники, одержимые любопытством и историями; их лапы бесшумны, а рефлексы — молниеносны.',
    tags: ['+2 Ловкость', 'Тёмное зрение', 'Когти'],
    icon: tabaxiIcon,
    accent: 'orange',
  },
  {
    id: 'yuan-ti',
    name: 'Юань-ти',
    description:
      'Потомки змеиных богов с холодной харизмой, природной устойчивостью к ядам и магии.',
    tags: ['+2 Харизма', 'Сопротивление ядам', 'Заклинания'],
    icon: yuanTiIcon,
    accent: 'purple',
  },
  {
    id: 'minotaur',
    name: 'Минотавр',
    description:
      'Рога, мощь и чувство лабиринта; многие несут память о древних аренах и корабельных палубах.',
    tags: ['+2 Сила', 'Рога', 'Заряд'],
    icon: minotaurIcon,
    accent: 'orange',
  },
];

export const INITIAL_RACE_COUNT = 9;

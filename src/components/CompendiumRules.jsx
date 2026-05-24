import React, { useMemo, useState } from 'react';
import SearchBar from './SearchBar';
import StatRuleItem from './StatRuleItem';
import CombatRulesBlock from './CombatRulesBlock';
import DiceRow from './DiceRow';
import styles from './CompendiumRules.module.css';

function matchesSearch(section, query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  const hay = `${section.title} ${section.subtitle || ''} ${section.keywords}`.toLowerCase();
  return tokens.some((t) => hay.includes(t));
}

function MechanicsContent() {
  return (
    <div className={styles.twoCols}>
      <div className={styles.col}>
        <h3 className={styles.colTitle}>Основа игрового процесса</h3>
        <p className={styles.p}>
          D&amp;D строится на совместном рассказе: игроки воплощают героев, Мастер описывает мир, последствия и
          неигровых персонажей. Когда исход действия неочевиден, помогает случайность — в первую очередь бросок
          двадцатигранника.
        </p>
        <p className={styles.p}>
          <strong className={styles.gold}>Золотое правило:</strong> сначала заявляете намерение, Мастер определяет,
          нужна ли проверка и какая. Вы бросаете d20, добавляете модификаторы и сравниваете результат с числом
          сложности — так рождается честный и драматичный исход без споров о «автоматическом успехе».
        </p>
      </div>
      <div className={styles.col}>
        <h3 className={styles.colTitle}>Сложность и успех</h3>
        <p className={styles.p}>
          <strong>Класс сложности (КС)</strong> — целевое число для проверки. Если итог броска с модификаторами ≥
          КС, попытка удаётся; если ниже — неудача. Критический успех и провал на 20 и 1 на d20 часто добавляют
          особый эффект по правилам стола.
        </p>
        <h3 className={`${styles.colTitle} ${styles.colTitleSpaced}`}>Преимущество и помеха</h3>
        <p className={styles.p}>
          При <strong>преимуществе</strong> вы бросаете два d20 и выбираете лучший результат; при{' '}
          <strong>помехе</strong> — худший. Если одновременно есть и то и другое, они компенсируют друг друга и
          остаётся обычный один бросок.
        </p>
      </div>
    </div>
  );
}

function SkillCheckFormula() {
  return (
    <div className={styles.formulaWrap} aria-label="Формула проверки навыка">
      <div className={styles.formulaRow}>
        <div className={styles.formulaChip}>
          <span className={styles.formulaChipLabel}>d20</span>
          <span className={styles.formulaChipHint}>бросок</span>
        </div>
        <span className={styles.formulaOp}>+</span>
        <div className={styles.formulaChip}>
          <span className={styles.formulaChipLabel}>Mod</span>
          <span className={styles.formulaChipHint}>модификатор характеристики</span>
        </div>
        <span className={styles.formulaOp}>+</span>
        <div className={styles.formulaChip}>
          <span className={styles.formulaChipLabel}>Prof</span>
          <span className={styles.formulaChipHint}>бонус владения (если есть)</span>
        </div>
        <span className={styles.formulaOp}>=</span>
        <div className={`${styles.formulaChip} ${styles.formulaChipResult}`}>
          <span className={styles.formulaChipLabel}>Итог</span>
          <span className={styles.formulaChipHint}>сравните с КС</span>
        </div>
      </div>
      <p className={styles.formulaFoot}>
        Для пассивной проверки часто используют <strong>10 + Mod + Prof</strong> — без броска кости.
      </p>
    </div>
  );
}

function IconBlinded() {
  return (
    <svg viewBox="0 0 24 24" className={styles.stateSvg} aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"
      />
      <path fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="M4 20L20 4" />
    </svg>
  );
}

function IconFrightened() {
  return (
    <svg viewBox="0 0 24 24" className={styles.stateSvg} aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        d="M12 5c-3 4-6 4-6 9a6 6 0 0012c0-5-3-5-6-9z"
      />
      <circle cx="9" cy="11" r="0.9" fill="currentColor" />
      <circle cx="15" cy="11" r="0.9" fill="currentColor" />
    </svg>
  );
}

function IconCharmed() {
  return (
    <svg viewBox="0 0 24 24" className={styles.stateSvg} aria-hidden>
      <path fill="none" stroke="currentColor" strokeWidth="1.75" d="M12 21s-6-4.35-6-10a6 6 0 1112 0c0 5.65-6 10-6 10z" />
    </svg>
  );
}

function IconDeafened() {
  return (
    <svg viewBox="0 0 24 24" className={styles.stateSvg} aria-hidden>
      <path fill="none" stroke="currentColor" strokeWidth="1.75" d="M8 10c0-2 1.5-3.5 4-3.5M12 6.5V4M16 10v10M8 10v4" />
      <path fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="M4 4l16 16" />
    </svg>
  );
}

function IconGrappled() {
  return (
    <svg viewBox="0 0 24 24" className={styles.stateSvg} aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M8 8c2 0 3 1 3 3v7M13 8c2 0 3 1 3 3v7M8 21h8"
      />
    </svg>
  );
}

function IconParalyzed() {
  return (
    <svg viewBox="0 0 24 24" className={styles.stateSvg} aria-hidden>
      <circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path fill="none" stroke="currentColor" strokeWidth="1.75" d="M6 22l2-7h8l2 7" />
    </svg>
  );
}

function IconPoisoned() {
  return (
    <svg viewBox="0 0 24 24" className={styles.stateSvg} aria-hidden>
      <path fill="none" stroke="currentColor" strokeWidth="1.75" d="M12 3v4M10 7h4l-1 14h-2L9 7zM9 14h6" />
    </svg>
  );
}

function IconProne() {
  return (
    <svg viewBox="0 0 24 24" className={styles.stateSvg} aria-hidden>
      <path fill="none" stroke="currentColor" strokeWidth="1.75" d="M5 19h14M8 16l8-10" strokeLinecap="round" />
      <circle cx="9" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconRestrained() {
  return (
    <svg viewBox="0 0 24 24" className={styles.stateSvg} aria-hidden>
      <rect x="7" y="7" width="10" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path fill="none" stroke="currentColor" strokeWidth="1.75" d="M4 12h3M17 12h3M12 4v3M12 17v3" />
    </svg>
  );
}

function IconStunned() {
  return (
    <svg viewBox="0 0 24 24" className={styles.stateSvg} aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        d="M12 3l1.8 5.5h5.7l-4.6 3.4 1.8 5.6-4.7-3.4-4.7 3.4 1.8-5.6-4.6-3.4h5.7L12 3z"
      />
    </svg>
  );
}

const CONDITIONS = [
  {
    id: 'blinded',
    name: 'Ослеплён',
    Icon: IconBlinded,
    desc: 'Автоматически проваливает проверки зрения; атаки по вам с преимуществом; ваши дальнобойные атаки с помехой.',
    kw: 'ослеплён слепота зрение',
  },
  {
    id: 'frightened',
    name: 'Испуг',
    Icon: IconFrightened,
    desc: 'Помеха на проверки и атаки, пока виден источник страха; нельзя добровольно подойти к нему ближе.',
    kw: 'испуг страх помеха',
  },
  {
    id: 'charmed',
    name: 'Очарован',
    Icon: IconCharmed,
    desc: 'Не можете атаковать очаровавшего; он имеет преимущество на социальные проверки против вас.',
    kw: 'очарование очарован',
  },
  {
    id: 'deafened',
    name: 'Оглушён (слух)',
    Icon: IconDeafened,
    desc: 'Не слышите; автоматически проваливаете проверки, зависящие от слуха; можете кастовать с материальной составляющей.',
    kw: 'оглох слух',
  },
  {
    id: 'grappled',
    name: 'Схвачен',
    Icon: IconGrappled,
    desc: 'Скорость 0; состояние оканчивается, если схвативший недееспособен или вы вырвались.',
    kw: 'схватить захват',
  },
  {
    id: 'paralyzed',
    name: 'Паралич',
    Icon: IconParalyzed,
    desc: 'Недееспособен, не можете двигаться и говорить; автоматические критические попадания в 5 футах; проваливаете спасброски Силы и Ловкости.',
    kw: 'паралич недееспособен',
  },
  {
    id: 'poisoned',
    name: 'Отравлен',
    Icon: IconPoisoned,
    desc: 'Помеха на броски атаки и проверки характеристик.',
    kw: 'яд отравление',
  },
  {
    id: 'prone',
    name: 'Нокдаун',
    Icon: IconProne,
    desc: 'Помеха на атаки; ближние атаки по вам с преимуществом; встать стоит половину перемещения.',
    kw: 'нокдаун лежа',
  },
  {
    id: 'restrained',
    name: 'Удерживаемый',
    Icon: IconRestrained,
    desc: 'Скорость 0; помеха на спасброски Ловкости; атаки по вам с преимуществом.',
    kw: 'удерживаем связан',
  },
  {
    id: 'stunned',
    name: 'Ошеломлён',
    Icon: IconStunned,
    desc: 'Недееспособен, не может ходить, говорит только запинаясь; автоматические критические попадания в 5 футах.',
    kw: 'ошеломлён стан',
  },
];

function ConditionsGrid({ search }) {
  const list = useMemo(() => {
    const q = String(search || '')
      .trim()
      .toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    if (!tokens.length) return CONDITIONS;
    return CONDITIONS.filter((c) => {
      const hay = `${c.name} ${c.desc} ${c.kw}`.toLowerCase();
      return tokens.some((t) => hay.includes(t));
    });
  }, [search]);

  return (
    <div className={styles.statesIntro}>
      <p className={styles.statesLead}>
        Наведите курсор или сфокусируйте карточку — появится краткое описание. Состояния суммируются, если правила не
        говорят иначе.
      </p>
      <div className={styles.statesGrid}>
        {list.length === 0 ? (
          <p className={styles.statesEmpty}>Нет состояний по этому запросу. Измените поиск.</p>
        ) : (
          list.map((c) => {
            const Icon = c.Icon;
            return (
              <button key={c.id} type="button" className={styles.stateCard}>
                <span className={styles.stateIcon} aria-hidden>
                  <Icon />
                </span>
                <span className={styles.stateName}>{c.name}</span>
                <span className={styles.stateDesc}>{c.desc}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatsContent() {
  return (
    <>
      <p className={styles.intro}>
        Шесть базовых характеристик задают физические и ментальные грани героя. От них считаются модификаторы и связанные
        навыки.
      </p>
      <div className={styles.statsGrid}>
        <StatRuleItem abbr="STR" name="Сила">
          <p>Физическая мощь, грубая сила и атлетика. Влияет на атаки силовым оружием, подъём и толкание.</p>
          <p>
            <strong>Навыки:</strong> Атлетика.
          </p>
        </StatRuleItem>
        <StatRuleItem abbr="DEX" name="Ловкость">
          <p>Реакция, точность, уклонение. Важна для дистанционных атак, лёгкого оружия и класса брони при лёгкой броне.</p>
          <p>
            <strong>Навыки:</strong> Акробатика, Ловкость рук, Скрытность.
          </p>
        </StatRuleItem>
        <StatRuleItem abbr="CON" name="Телосложение">
          <p>Выносливость и здоровье. Увеличивает максимум хитов за уровень и помогает концентрации заклинаний под ударом.</p>
          <p>
            <strong>Навыки:</strong> отдельного навыка нет, но часто требуется для спасбросков против яда и усталости.
          </p>
        </StatRuleItem>
        <StatRuleItem abbr="INT" name="Интеллект">
          <p>Память, логика, обучаемость. Основа для знаний об истории, магии и природе.</p>
          <p>
            <strong>Навыки:</strong> Анализ, История, Магия, Природа, Расследование.
          </p>
        </StatRuleItem>
        <StatRuleItem abbr="WIS" name="Мудрость">
          <p>Внимательность, интуиция, сила воли. Связана с восприятием обмана и с природной магией друидов и жрецов.</p>
          <p>
            <strong>Навыки:</strong> Внимательность, Выживание, Медицина, Проницательность, Уход за животными.
          </p>
        </StatRuleItem>
        <StatRuleItem abbr="CHA" name="Харизма">
          <p>Сила личности, убеждение, влияние. Определяет обаяние, запугивание и многие магические классы.</p>
          <p>
            <strong>Навыки:</strong> Выступление, Запугивание, Обман, Убеждение.
          </p>
        </StatRuleItem>
      </div>
    </>
  );
}

const SECTION_BLUEPRINTS = [
  {
    id: 'mechanics',
    title: 'Фундаментальная механика',
    subtitle: 'Система d20',
    keywords:
      'd20 кс класс сложности проверка успех неудача преимущество помеха золотое правило бросок модификатор мастер игрок',
    render: () => <MechanicsContent />,
  },
  {
    id: 'skill',
    title: 'Проверка навыка',
    subtitle: 'Формула итога',
    keywords: 'навык проверка модификатор владение бонус d20 итог кс пассивная',
    render: () => <SkillCheckFormula />,
  },
  {
    id: 'stats',
    title: 'Характеристики персонажа',
    subtitle: 'STR · DEX · CON · INT · WIS · CHA',
    keywords: 'сила ловкость телосложение интеллект мудрость харизма навыки модификатор атлетика скрытность',
    render: () => <StatsContent />,
  },
  {
    id: 'conditions',
    title: 'Состояния',
    subtitle: 'Эффекты в бою и вне его',
    keywords:
      'состояния ослеплён испуг очарован оглох схвачен паралич отравлен нокдаун удерживаемый ошеломлён страх яд',
    render: ({ search }) => <ConditionsGrid search={search} />,
  },
  {
    id: 'combat',
    title: 'Структура боя и экономика хода',
    subtitle: 'Раунды и действия',
    keywords: 'бой раунд ход перемещение действие бонусное реакция инициатива провоцированная',
    render: () => <CombatRulesBlock />,
  },
  {
    id: 'dice',
    title: 'Виды игральных костей',
    subtitle: 'Многогранники',
    keywords: 'кости d4 d6 d8 d10 d12 d20 урон проверка',
    render: () => <DiceRow />,
  },
];

function RulesAccordion({ section, index, open, onToggle, search }) {
  const panelId = `rules-panel-${section.id}`;
  const headId = `rules-head-${section.id}`;

  return (
    <section className={`${styles.accordion} ${styles.staggerItem}`} style={{ '--i': index }} data-rules-section={section.id}>
      <button
        type="button"
        id={headId}
        className={styles.accordionHead}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(section.id)}
      >
        <span className={styles.accordionHeadText}>
          <span className={styles.accordionTitle}>{section.title}</span>
          {section.subtitle ? <span className={styles.accordionSubtitle}>{section.subtitle}</span> : null}
        </span>
        <svg className={`${styles.accordionChev} ${open ? styles.accordionChevOpen : ''}`} viewBox="0 0 24 24" aria-hidden>
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <div id={panelId} role="region" aria-labelledby={headId} className={styles.accordionPanel}>
          {section.render({ search })}
        </div>
      ) : null}
    </section>
  );
}

export default function CompendiumRules() {
  const [search, setSearch] = useState('');
  const [openIds, setOpenIds] = useState(() => new Set(['mechanics']));

  const visibleSections = useMemo(
    () => SECTION_BLUEPRINTS.filter((s) => matchesSearch(s, search)),
    [search]
  );

  const toggle = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={styles.root}>
      <div className={`${styles.searchBlock} ${styles.staggerItem}`} style={{ '--i': 0 }}>
        <SearchBar
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по правилам: d20, КС, состояния…"
          ariaLabel="Поиск по разделам правил"
        />
      </div>

      {visibleSections.length === 0 ? (
        <p className={styles.rulesEmpty}>Ничего не найдено. Попробуйте другие слова.</p>
      ) : (
        <div className={styles.accordionList}>
          {visibleSections.map((section, index) => (
            <RulesAccordion
              key={section.id}
              section={section}
              index={index + 1}
              open={openIds.has(section.id)}
              onToggle={toggle}
              search={search}
            />
          ))}
        </div>
      )}
    </div>
  );
}

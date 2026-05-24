import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BackgroundEffects from './components/BackgroundEffects';
import DashboardHeader from './components/DashboardHeader';
import CompendiumTabs from './components/CompendiumTabs';
import SearchBar from './components/SearchBar';
import RacesGrid from './components/RacesGrid';
import ClassesGrid from './components/ClassesGrid';
import FiltersPanel from './components/FiltersPanel';
import SpellGrid from './components/SpellGrid';
import CompendiumRules from './components/CompendiumRules';
import { INITIAL_RACE_COUNT } from './data/racesData';
import { INITIAL_CLASS_COUNT } from './data/classesData';
import { INITIAL_SPELL_COUNT } from './data/spellsData';
import { matchesCompendiumItem } from './utils/compendiumSearch';
import { filterSpells } from './utils/spellFilter';
import * as compendiumService from './services/compendiumService';
import { mapApiErrorMessage } from './constants/uiMessages';
import styles from './CompendiumPage.module.css';

function CompendiumSkeleton() {
  return (
    <div className={styles.skeletonGrid} aria-busy="true" aria-label="Загрузка">
      {[1, 2, 3, 4, 5, 6].map((k) => (
        <div key={k} className={styles.skeletonCard} />
      ))}
    </div>
  );
}

const TABS = [
  { id: 'races', label: 'Расы' },
  { id: 'classes', label: 'Классы' },
  { id: 'spells', label: 'Заклинания' },
  { id: 'rules', label: 'Правила' },
];

function toggleInSet(prev, value) {
  const next = new Set(prev);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

const TAB_IDS = new Set(TABS.map((t) => t.id));

export default function CompendiumPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo(() => {
    const s = searchParams.get('section');
    if (s && TAB_IDS.has(s)) return s;
    return 'races';
  }, [searchParams]);

  const selectTab = useCallback(
    (id) => {
      if (!TAB_IDS.has(id)) return;
      if (id === 'races') {
        setSearchParams({}, { replace: true });
      } else {
        setSearchParams({ section: id }, { replace: true });
      }
    },
    [setSearchParams]
  );
  const [raceSearch, setRaceSearch] = useState('');
  const [raceExpanded, setRaceExpanded] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [classExpanded, setClassExpanded] = useState(false);

  const [spellSearch, setSpellSearch] = useState('');
  const [spellLevels, setSpellLevels] = useState(() => new Set());
  const [spellSchools, setSpellSchools] = useState(() => new Set());
  const [spellClasses, setSpellClasses] = useState(() => new Set());
  const [spellVisibleCount, setSpellVisibleCount] = useState(INITIAL_SPELL_COUNT);

  const [races, setRaces] = useState([]);
  const [classes, setClasses] = useState([]);
  const [spells, setSpells] = useState([]);
  const [compendiumLoading, setCompendiumLoading] = useState(true);
  const [compendiumError, setCompendiumError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setCompendiumLoading(true);
      setCompendiumError('');
      try {
        const [r, c, s] = await Promise.all([
          compendiumService.loadRaces(),
          compendiumService.loadClasses(),
          compendiumService.loadSpells(),
        ]);
        if (!cancelled) {
          setRaces(r);
          setClasses(c);
          setSpells(s);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = mapApiErrorMessage(
            e,
            'Не удалось загрузить справочник. Проверьте, что сервер запущен.'
          );
          setCompendiumError(msg);
        }
      } finally {
        if (!cancelled) setCompendiumLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRaces = useMemo(
    () => races.filter((r) => matchesCompendiumItem(r, raceSearch)),
    [races, raceSearch]
  );

  const displayedRaces = useMemo(() => {
    if (raceExpanded || filteredRaces.length <= INITIAL_RACE_COUNT) {
      return filteredRaces;
    }
    return filteredRaces.slice(0, INITIAL_RACE_COUNT);
  }, [filteredRaces, raceExpanded]);

  const raceCanToggleMore = filteredRaces.length > INITIAL_RACE_COUNT;
  const raceShowLoadMore = raceCanToggleMore && !raceExpanded;
  const raceShowCollapse = raceCanToggleMore && raceExpanded;

  const filteredClasses = useMemo(
    () => classes.filter((c) => matchesCompendiumItem(c, classSearch)),
    [classes, classSearch]
  );

  const displayedClasses = useMemo(() => {
    if (classExpanded || filteredClasses.length <= INITIAL_CLASS_COUNT) {
      return filteredClasses;
    }
    return filteredClasses.slice(0, INITIAL_CLASS_COUNT);
  }, [filteredClasses, classExpanded]);

  const classCanToggleMore = filteredClasses.length > INITIAL_CLASS_COUNT;
  const classShowLoadMore = classCanToggleMore && !classExpanded;
  const classShowCollapse = classCanToggleMore && classExpanded;

  const filteredSpells = useMemo(
    () =>
      filterSpells(spells, {
        query: spellSearch,
        selectedLevels: spellLevels,
        selectedSchools: spellSchools,
        selectedClasses: spellClasses,
      }),
    [spells, spellSearch, spellLevels, spellSchools, spellClasses]
  );

  useEffect(() => {
    setSpellVisibleCount(INITIAL_SPELL_COUNT);
  }, [filteredSpells]);

  const displayedSpells = useMemo(
    () => filteredSpells.slice(0, spellVisibleCount),
    [filteredSpells, spellVisibleCount]
  );

  const spellShowLoadMore = spellVisibleCount < filteredSpells.length;

  const resetSpellFilters = () => {
    setSpellLevels(new Set());
    setSpellSchools(new Set());
    setSpellClasses(new Set());
    setSpellSearch('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden />
      <BackgroundEffects />
      <DashboardHeader />
      <main className={styles.main}>
        <h1 className={styles.title}>Справочник D&amp;D</h1>

        {compendiumError ? (
          <p style={{ color: '#f5a5a5', marginBottom: 16, maxWidth: 720 }}>
            {compendiumError}
          </p>
        ) : null}
        {compendiumLoading ? <CompendiumSkeleton /> : null}

        <CompendiumTabs tabs={TABS} activeId={activeTab} onSelect={selectTab} />

        {activeTab === 'races' && (
          <>
            <SearchBar
              value={raceSearch}
              onChange={(e) => {
                setRaceSearch(e.target.value);
                setRaceExpanded(false);
              }}
              placeholder="Поиск рас..."
              ariaLabel="Поиск рас"
            />
            {!compendiumLoading && !compendiumError && races.length === 0 ? (
              <p className={styles.emptyFallback}>Нет данных о расах. Проверьте seed на сервере.</p>
            ) : null}
            {!compendiumLoading && !compendiumError && races.length > 0 && filteredRaces.length === 0 ? (
              <p className={styles.emptyFallback}>Ничего не найдено по вашему запросу.</p>
            ) : null}
            {!compendiumLoading && !compendiumError && filteredRaces.length > 0 ? (
              <RacesGrid races={displayedRaces} />
            ) : null}
            {!compendiumLoading && !compendiumError && raceCanToggleMore && filteredRaces.length > 0 ? (
              <div className={styles.moreRow}>
                {raceShowLoadMore && (
                  <button type="button" className={styles.moreBtn} onClick={() => setRaceExpanded(true)}>
                    Загрузить больше
                  </button>
                )}
                {raceShowCollapse && (
                  <button type="button" className={styles.moreBtn} onClick={() => setRaceExpanded(false)}>
                    Скрыть
                  </button>
                )}
              </div>
            ) : null}
          </>
        )}

        {activeTab === 'classes' && (
          <>
            <SearchBar
              value={classSearch}
              onChange={(e) => {
                setClassSearch(e.target.value);
                setClassExpanded(false);
              }}
              placeholder="Поиск класса..."
              ariaLabel="Поиск класса"
            />
            {!compendiumLoading && !compendiumError && classes.length === 0 ? (
              <p className={styles.emptyFallback}>Нет данных о классах. Проверьте seed на сервере.</p>
            ) : null}
            {!compendiumLoading && !compendiumError && classes.length > 0 && filteredClasses.length === 0 ? (
              <p className={styles.emptyFallback}>Ничего не найдено по вашему запросу.</p>
            ) : null}
            {!compendiumLoading && !compendiumError && filteredClasses.length > 0 ? (
              <ClassesGrid dndClasses={displayedClasses} />
            ) : null}
            {!compendiumLoading && !compendiumError && classCanToggleMore && filteredClasses.length > 0 ? (
              <div className={styles.moreRow}>
                {classShowLoadMore && (
                  <button type="button" className={styles.moreBtn} onClick={() => setClassExpanded(true)}>
                    Загрузить больше
                  </button>
                )}
                {classShowCollapse && (
                  <button type="button" className={styles.moreBtn} onClick={() => setClassExpanded(false)}>
                    Скрыть
                  </button>
                )}
              </div>
            ) : null}
          </>
        )}

        {activeTab === 'spells' && (
          <div className={styles.spellsLayout}>
            <aside className={styles.spellsSidebar}>
              <SearchBar
                fullWidth
                value={spellSearch}
                onChange={(e) => setSpellSearch(e.target.value)}
                placeholder="Поиск заклинания..."
                ariaLabel="Поиск заклинания"
              />
              <FiltersPanel
                selectedLevels={spellLevels}
                selectedSchools={spellSchools}
                selectedClasses={spellClasses}
                onToggleLevel={(v) => setSpellLevels((p) => toggleInSet(p, v))}
                onToggleSchool={(v) => setSpellSchools((p) => toggleInSet(p, v))}
                onToggleClass={(v) => setSpellClasses((p) => toggleInSet(p, v))}
                onReset={resetSpellFilters}
              />
            </aside>
            <div className={styles.spellsContent}>
              {!compendiumLoading && !compendiumError && spells.length === 0 ? (
                <p className={styles.emptyFallback}>Нет данных о заклинаниях. Проверьте seed на сервере.</p>
              ) : null}
              {!compendiumLoading && !compendiumError && spells.length > 0 && filteredSpells.length === 0 ? (
                <p className={styles.emptyFallback}>Ничего не найдено по фильтрам и запросу.</p>
              ) : null}
              {!compendiumLoading && !compendiumError && filteredSpells.length > 0 ? (
                <SpellGrid spells={displayedSpells} />
              ) : null}
              {!compendiumLoading && !compendiumError && spellShowLoadMore ? (
                <div className={styles.moreRow}>
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() =>
                      setSpellVisibleCount((c) =>
                        Math.min(c + INITIAL_SPELL_COUNT, filteredSpells.length)
                      )
                    }
                  >
                    Загрузить больше
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {activeTab === 'rules' && <CompendiumRules />}
      </main>
    </div>
  );
}

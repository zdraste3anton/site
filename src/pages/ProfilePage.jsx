import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import ParticleBackground from '../components/ParticleBackground';
import DashboardHeader from '../components/DashboardHeader';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import CharacterList from '../components/profile/CharacterList';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as characterService from '../services/characterService';
import { mapApiErrorMessage, SUCCESS } from '../constants/uiMessages';
import styles from './ProfilePage.module.css';

function mapListError(e) {
  return mapApiErrorMessage(e, 'Не удалось загрузить персонажей. Проверьте соединение с сервером.');
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const refresh = useCallback(async () => {
    setListError('');
    setLoading(true);
    try {
      const items = await characterService.listCharacters();
      setCharacters(items);
    } catch (e) {
      setListError(mapListError(e));
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handlePortraitUpdated = useCallback((updated) => {
    if (!updated?.id) return;
    setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleRequestDelete = (character) => {
    setDeleteTarget({ id: character.id, name: character.name || 'Персонаж' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await characterService.deleteCharacter(deleteTarget.id);
      setDeleteTarget(null);
      showSuccess(SUCCESS.CHARACTER_DELETED);
      await refresh();
    } catch (e) {
      const msg = mapApiErrorMessage(e, 'Не удалось удалить персонажа.');
      showError(msg);
    } finally {
      setDeleteBusy(false);
    }
  };

  const createHero = () => {
    navigate('/generator/mechanics');
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Игрок';
  const roleLabel = user?.roleLabel || 'Мастер Игр';

  const favoriteClassLabel = useMemo(() => {
    if (!characters.length) return '—';
    const tally = {};
    for (const c of characters) {
      const label = String(c.className || '').trim() || '—';
      tally[label] = (tally[label] || 0) + 1;
    }
    const sorted = Object.entries(tally).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0], 'ru');
    });
    return sorted[0][0];
  }, [characters]);

  return (
    <PageShell variant="main">
      <ParticleBackground variant="viewport" />
      <DashboardHeader />
      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Ваш профиль</h1>

        <div className={styles.profileStatsBar} role="status" aria-live="polite">
          <span>Всего героев: {characters.length}</span>
          <span className={styles.profileStatsSep} aria-hidden>
            ·
          </span>
          <span>Любимый класс: {favoriteClassLabel}</span>
        </div>

        {!loading && characters.length === 0 ? (
          <div className={styles.profileEmptyCta}>
            <button type="button" className={styles.btnPrimary} onClick={createHero}>
              Создать нового героя
            </button>
          </div>
        ) : null}

        {listError ? <p className={styles.listError}>{listError}</p> : null}

        <div className={styles.layout}>
          <ProfileSidebar displayName={displayName} roleLabel={roleLabel} onLogout={handleLogout} />

          <section aria-labelledby="chars-heading">
            <div className={styles.charactersHeader}>
              <div className={styles.charactersTitles}>
                <h2 id="chars-heading">Мои персонажи</h2>
                <p>Управляйте своими героями</p>
              </div>
              <button type="button" className={styles.btnSecondary} onClick={createHero}>
                + Создать героя
              </button>
            </div>
            <CharacterList
              characters={characters}
              loading={loading}
              onRequestDelete={handleRequestDelete}
              onPortraitUpdated={handlePortraitUpdated}
            />
          </section>
        </div>
      </main>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Удалить персонажа?"
        message={
          deleteTarget
            ? `Персонаж «${deleteTarget.name}» будет удалён без возможности восстановления.`
            : ''
        }
        confirmLabel={deleteBusy ? 'Удаление...' : 'Удалить'}
        cancelLabel="Отмена"
        danger
        busy={deleteBusy}
        onCancel={() => !deleteBusy && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </PageShell>
  );
}

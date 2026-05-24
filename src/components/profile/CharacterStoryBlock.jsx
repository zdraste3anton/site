import React from 'react';
import styles from './CharacterSheetBlocks.module.css';

export default function CharacterStoryBlock({ story }) {
  const text = (story || '').trim() || 'История ещё не записана.';
  const paragraphs = text.split(/\n+/).filter(Boolean);

  return (
    <section className={styles.storyPanel} aria-labelledby="story-heading">
      <h2 id="story-heading" className={styles.panelTitle}>
        История (Квента)
      </h2>
      <div className={styles.storyBody}>
        {paragraphs.map((para, i) => (
          <p key={i} className={styles.storyPara}>
            {para}
          </p>
        ))}
      </div>
    </section>
  );
}

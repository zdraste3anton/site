import React from 'react';
import CardGrid from './CardGrid';
import RaceCard from './RaceCard';

export default function RacesGrid({ races }) {
  return (
    <CardGrid
      variant="races"
      items={races}
      emptyMessage="Ничего не найдено. Попробуйте другой запрос."
      renderItem={(race) => <RaceCard key={race.id} race={race} />}
    />
  );
}
